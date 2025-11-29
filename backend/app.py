from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict
import os

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# ----------------------------------------------------------------------------
# Basic Flask + ElevenLabs setup
# ----------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # allow the Vite frontend at http://localhost:5173 to call this API

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

# Load environment and initialise ElevenLabs client
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")  # optional default voice

eleven_client: ElevenLabs | None = None
if ELEVENLABS_API_KEY:
    eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

SONG_STORE: Dict[str, Dict[str, Any]] = {}


def _make_song_id() -> str:
    """Create a simple unique-ish song id.

    For the current prototype we just use an incrementing counter; a UUID would
    also be fine. This lives only in memory and resets when the server restarts.
    """

    song_id = str(len(SONG_STORE) + 1)
    return song_id


def _synthesize_with_elevenlabs(text: str, voice_id: str | None, output_path: Path) -> Path:
    """Call ElevenLabs Text-to-Speech API and write the result to output_path.

    Uses the official Python SDK as shown in the ElevenLabs quickstart docs.
    """

    if eleven_client is None:
        raise RuntimeError("ELEVENLABS_API_KEY is not configured on the server")

    # Prefer an explicit voice id from the request; otherwise fall back to env.
    if not voice_id:
        voice_id = DEFAULT_VOICE_ID

    if not voice_id:
        raise RuntimeError(
            "No ElevenLabs voice id provided. Set ELEVENLABS_VOICE_ID or send 'voiceId' in the request body."
        )

    # Stream MP3 audio from ElevenLabs and write it to disk.
    audio_stream = eleven_client.text_to_speech.convert(
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        text=text,
        output_format="mp3_44100_128",
    )

    with open(output_path, "wb") as f:
        for chunk in audio_stream:
            if isinstance(chunk, (bytes, bytearray)):
                f.write(chunk)

    return output_path


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health() -> Any:
    """Simple health check used by the frontend / for debugging."""

    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()}), 200


@app.route("/api/generate-song", methods=["POST"])
def generate_song() -> Any:
    """Stub endpoint that mimics song generation.

    The current React client (`SongCreatorStudio` in `frontend/src/App.jsx`)
    does all TTS and audio work in the browser. This endpoint exists so we can
    later move that logic server‑side and keep API keys off the client.

    For now we accept a JSON payload and return structured metadata that the
    frontend *could* consume instead of its internal mock state.

    Expected JSON body (all optional for now):
      - lyrics: str
      - voiceOption: str (id from the voice dropdown)
      - instrumentalOption: str ("generate" or "upload")
      - genre: str
      - mood: str
      - tempo: int/BPM
    """

    data = request.get_json(force=True, silent=True) or {}

    lyrics: str = (data.get("lyrics") or "").strip()
    voice_option: str | None = data.get("voiceOption")
    # Optional explicit ElevenLabs voice id; otherwise we fall back to env.
    voice_id: str | None = data.get("voiceId")

    instrumental_option: str = data.get("instrumentalOption") or "generate"
    genre: str | None = data.get("genre")
    mood: str | None = data.get("mood")
    tempo: int | None = data.get("tempo")

    if not lyrics and not data.get("hasRecording"):
        return jsonify({"error": "No lyrics or vocal recording provided"}), 400

    song_id = _make_song_id()

    # Text that will be spoken by ElevenLabs. If there are no lyrics we
    # synthesise a simple placeholder line.
    text_to_speak = lyrics or "The melody begins now."

    audio_path = GENERATED_DIR / f"song_{song_id}.mp3"

    try:
        _synthesize_with_elevenlabs(text_to_speak, voice_id, audio_path)
    except Exception as exc:  # pragma: no cover - logged for debugging only
        return (
            jsonify({"error": "tts_failed", "detail": str(exc)}),
            500,
        )

    song_meta: Dict[str, Any] = {
        "id": song_id,
        "title": data.get("title") or "Untitled",
        "lyrics": lyrics,
        "voiceOption": voice_option,
        "instrumentalOption": instrumental_option,
        "genre": genre,
        "mood": mood,
        "tempo": tempo,
        # URL that the frontend can use for playback/download.
        "audioUrl": f"/api/songs/{song_id}/audio",
        "duration": "3:45",  # fake duration for prototype UI
        "timestamp": datetime.utcnow().isoformat(),
        "version": 1,
        "audioPath": str(audio_path),
    }

    SONG_STORE[song_id] = song_meta

    return jsonify(song_meta), 201


@app.route("/api/songs/<song_id>/audio", methods=["GET"])
def get_song_audio(song_id: str) -> Any:
    """Serve the generated audio file for playback/download."""

    song = SONG_STORE.get(song_id)
    if not song:
        return jsonify({"error": "Song not found"}), 404

    audio_path_str = song.get("audioPath")
    if not audio_path_str:
        return jsonify({"error": "Audio not available for this song"}), 404

    audio_path = Path(audio_path_str)
    if not audio_path.exists():
        return jsonify({"error": "Audio file is missing on the server"}), 404

    return send_from_directory(
        directory=str(audio_path.parent),
        path=audio_path.name,
        as_attachment=False,
        mimetype="audio/mpeg",
    )


@app.route("/api/songs/<song_id>/improve", methods=["POST"])
def improve_song(song_id: str) -> Any:
    """Very small stub for the "regenerate with feedback" step.

    Accepts JSON:
      - feedback: str

    and bumps the in‑memory song version / timestamp. Real audio regeneration
    should be plugged in here later.
    """

    if song_id not in SONG_STORE:
        return jsonify({"error": "Song not found"}), 404

    data = request.get_json(force=True, silent=True) or {}
    feedback: str = (data.get("feedback") or "").strip()

    if not feedback:
        return jsonify({"error": "feedback is required"}), 400

    song = SONG_STORE[song_id]
    song["version"] = int(song.get("version") or 1) + 1
    song["timestamp"] = datetime.utcnow().isoformat()
    song["lastFeedback"] = feedback

    return jsonify(song), 200


if __name__ == "__main__":  # pragma: no cover
    app.run(host="0.0.0.0", port=5000, debug=True)
