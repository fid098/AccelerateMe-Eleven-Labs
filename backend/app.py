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
CORS(app)  # allow the Vite frontend to call this API

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

# Load environment and initialise ElevenLabs client
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")  # Default to George voice

eleven_client: ElevenLabs | None = None
if ELEVENLABS_API_KEY:
    eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    print("✓ ElevenLabs client initialized successfully")
else:
    print("⚠ Warning: ELEVENLABS_API_KEY not found in environment")


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

SONG_STORE: Dict[str, Dict[str, Any]] = {}


def _make_song_id() -> str:
    """Create a simple unique song id."""
    song_id = str(len(SONG_STORE) + 1)
    return song_id


def _synthesize_with_elevenlabs(text: str, voice_id: str | None, output_path: Path) -> Path:
    """Call ElevenLabs Text-to-Speech API and write the result to output_path."""
    
    if eleven_client is None:
        raise RuntimeError(
            "ELEVENLABS_API_KEY is not configured on the server. "
            "Please add it to your .env file."
        )

    # Use provided voice_id or fall back to default
    final_voice_id = voice_id or DEFAULT_VOICE_ID
    
    if not final_voice_id:
        raise RuntimeError(
            "No ElevenLabs voice id provided. Set ELEVENLABS_VOICE_ID in .env "
            "or send 'voiceId' in the request body."
        )

    print(f"Generating speech with voice_id: {final_voice_id}")
    print(f"Text to synthesize: {text[:100]}...")

    try:
        # Generate audio using ElevenLabs API
        audio_generator = eleven_client.text_to_speech.convert(
            voice_id=final_voice_id,
            model_id="eleven_multilingual_v2",
            text=text,
            output_format="mp3_44100_128",
        )

        # Write the audio to file
        with open(output_path, "wb") as f:
            for chunk in audio_generator:
                if isinstance(chunk, (bytes, bytearray)):
                    f.write(chunk)
        
        print(f"✓ Audio generated successfully: {output_path}")
        return output_path

    except Exception as e:
        print(f"✗ ElevenLabs API error: {str(e)}")
        raise


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health() -> Any:
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "time": datetime.utcnow().isoformat(),
        "elevenlabs_configured": eleven_client is not None
    }), 200


@app.route("/api/voices", methods=["GET"])
def list_voices() -> Any:
    """List available ElevenLabs voices."""
    
    if eleven_client is None:
        return jsonify({"error": "ElevenLabs API not configured"}), 500
    
    try:
        # Get all voices from ElevenLabs
        voices_response = eleven_client.voices.get_all()
        
        # Format the response
        voices = []
        for voice in voices_response.voices:
            voices.append({
                "voice_id": voice.voice_id,
                "name": voice.name,
                "category": getattr(voice, "category", "premade"),
                "description": getattr(voice, "description", ""),
                "labels": getattr(voice, "labels", {}),
            })
        
        return jsonify({"voices": voices}), 200
        
    except Exception as e:
        print(f"Error fetching voices: {str(e)}")
        return jsonify({"error": f"Failed to fetch voices: {str(e)}"}), 500


@app.route("/api/generate-song", methods=["POST"])
def generate_song() -> Any:
    """Generate a song using ElevenLabs TTS.
    
    Expected JSON body:
      - lyrics: str (required)
      - voiceId: str (optional, defaults to env variable)
      - title: str (optional)
      - genre: str (optional)
      - mood: str (optional)
      - tempo: int (optional)
    """
    
    data = request.get_json(force=True, silent=True) or {}
    
    # Extract parameters
    lyrics: str = (data.get("lyrics") or "").strip()
    voice_id: str | None = data.get("voiceId")
    title: str = data.get("title") or "Untitled Song"
    genre: str | None = data.get("genre")
    mood: str | None = data.get("mood")
    tempo: int | None = data.get("tempo")
    
    # Validate input
    if not lyrics:
        return jsonify({"error": "Lyrics are required"}), 400
    
    # Generate unique song ID
    song_id = _make_song_id()
    audio_path = GENERATED_DIR / f"song_{song_id}.mp3"
    
    try:
        # Generate speech from lyrics
        print(f"\n{'='*60}")
        print(f"Generating song #{song_id}: {title}")
        print(f"{'='*60}")
        
        _synthesize_with_elevenlabs(lyrics, voice_id, audio_path)
        
        # Create song metadata
        song_meta: Dict[str, Any] = {
            "id": song_id,
            "title": title,
            "lyrics": lyrics,
            "voiceId": voice_id or DEFAULT_VOICE_ID,
            "genre": genre,
            "mood": mood,
            "tempo": tempo,
            "audioUrl": f"/api/songs/{song_id}/audio",
            "downloadUrl": f"/api/songs/{song_id}/download",
            "timestamp": datetime.utcnow().isoformat(),
            "version": 1,
            "audioPath": str(audio_path),
            "status": "completed"
        }
        
        # Store in memory
        SONG_STORE[song_id] = song_meta
        
        print(f"✓ Song generated successfully!")
        print(f"  Audio URL: {song_meta['audioUrl']}")
        
        return jsonify(song_meta), 201
        
    except RuntimeError as e:
        print(f"✗ Configuration error: {str(e)}")
        return jsonify({
            "error": "configuration_error",
            "detail": str(e),
            "hint": "Make sure ELEVENLABS_API_KEY is set in your .env file"
        }), 500
        
    except Exception as e:
        print(f"✗ Generation error: {str(e)}")
        return jsonify({
            "error": "generation_failed",
            "detail": str(e)
        }), 500


@app.route("/api/songs/<song_id>/audio", methods=["GET"])
def get_song_audio(song_id: str) -> Any:
    """Serve the generated audio file for playback."""
    
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


@app.route("/api/songs/<song_id>/download", methods=["GET"])
def download_song(song_id: str) -> Any:
    """Download the generated audio file."""
    
    song = SONG_STORE.get(song_id)
    if not song:
        return jsonify({"error": "Song not found"}), 404
    
    audio_path_str = song.get("audioPath")
    if not audio_path_str:
        return jsonify({"error": "Audio not available for this song"}), 404
    
    audio_path = Path(audio_path_str)
    if not audio_path.exists():
        return jsonify({"error": "Audio file is missing on the server"}), 404
    
    # Get the song title for the filename
    title = song.get("title", "song").replace(" ", "_")
    filename = f"{title}_{song_id}.mp3"
    
    return send_from_directory(
        directory=str(audio_path.parent),
        path=audio_path.name,
        as_attachment=True,
        download_name=filename,
        mimetype="audio/mpeg",
    )


@app.route("/api/songs", methods=["GET"])
def list_songs() -> Any:
    """List all generated songs."""
    
    songs = list(SONG_STORE.values())
    # Sort by timestamp, newest first
    songs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return jsonify({"songs": songs, "count": len(songs)}), 200


@app.route("/api/songs/<song_id>", methods=["GET"])
def get_song(song_id: str) -> Any:
    """Get metadata for a specific song."""
    
    song = SONG_STORE.get(song_id)
    if not song:
        return jsonify({"error": "Song not found"}), 404
    
    return jsonify(song), 200


@app.route("/api/songs/<song_id>/improve", methods=["POST"])
def improve_song(song_id: str) -> Any:
    """Regenerate song with feedback.
    
    Expected JSON body:
      - feedback: str (required)
      - lyrics: str (optional, uses original if not provided)
    """
    
    if song_id not in SONG_STORE:
        return jsonify({"error": "Song not found"}), 404
    
    data = request.get_json(force=True, silent=True) or {}
    feedback: str = (data.get("feedback") or "").strip()
    new_lyrics: str | None = data.get("lyrics")
    
    if not feedback:
        return jsonify({"error": "feedback is required"}), 400
    
    song = SONG_STORE[song_id]
    
    # Use new lyrics if provided, otherwise use original
    lyrics = new_lyrics or song.get("lyrics", "")
    
    if not lyrics:
        return jsonify({"error": "No lyrics available for regeneration"}), 400
    
    try:
        # Generate new version
        audio_path = Path(song["audioPath"])
        _synthesize_with_elevenlabs(lyrics, song.get("voiceId"), audio_path)
        
        # Update metadata
        song["version"] = int(song.get("version", 1)) + 1
        song["timestamp"] = datetime.utcnow().isoformat()
        song["lastFeedback"] = feedback
        if new_lyrics:
            song["lyrics"] = new_lyrics
        
        print(f"✓ Song {song_id} regenerated (version {song['version']})")
        
        return jsonify(song), 200
        
    except Exception as e:
        print(f"✗ Regeneration error: {str(e)}")
        return jsonify({
            "error": "regeneration_failed",
            "detail": str(e)
        }), 500


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎵 Song Creator Studio - Backend Server")
    print("="*60)
    print(f"ElevenLabs configured: {eleven_client is not None}")
    print(f"Default voice ID: {DEFAULT_VOICE_ID}")
    print(f"Generated files directory: {GENERATED_DIR}")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)