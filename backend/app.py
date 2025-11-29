from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

# ----------------------------------------------------------------------------
# Basic Flask setup
# ----------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # allow the Vite frontend at http://localhost:5173 to call this API

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


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
    instrumental_option: str = data.get("instrumentalOption") or "generate"
    genre: str | None = data.get("genre")
    mood: str | None = data.get("mood")
    tempo: int | None = data.get("tempo")

    if not lyrics and not data.get("hasRecording"):
        return jsonify({"error": "No lyrics or vocal recording provided"}), 400

    song_id = _make_song_id()

    # In a real implementation, this is where you would:
    #   - run transcription on the uploaded/recorded vocals (Whisper/ASR)
    #   - call ElevenLabs / Gemini / other TTS with the chosen voice
    #   - generate or mix in an instrumental (Suno/MusicGen/etc.)
    #   - write an audio file to GENERATED_DIR and return a download URL

    song_meta: Dict[str, Any] = {
        "id": song_id,
        "title": data.get("title") or "Untitled",
        "lyrics": lyrics,
        "voiceOption": voice_option,
        "instrumentalOption": instrumental_option,
        "genre": genre,
        "mood": mood,
        "tempo": tempo,
        # Placeholder audio URL; the current frontend stores an audio URL in
        # its own state, so for now this is just documentation.
        "audioUrl": None,
        "duration": "3:45",  # fake duration for prototype UI
        "timestamp": datetime.utcnow().isoformat(),
        "version": 1,
    }

    SONG_STORE[song_id] = song_meta

    return jsonify(song_meta), 201


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
