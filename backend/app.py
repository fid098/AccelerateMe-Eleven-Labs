import json
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from db import SessionLocal, init_db
from models import Song
from vocal_processing import create_perfected_vocal

# -------------------------------------------------------------------
# Flask + basic setup
# -------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # Allow React dev server to call this backend

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
GENERATED_DIR = BASE_DIR / "generated"
PITCH_INFO_DIR = BASE_DIR / "pitch_info"

for d in (UPLOAD_DIR, GENERATED_DIR, PITCH_INFO_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Initialize SQLite DB and tables
init_db()


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _save_uploaded_file(file_storage, dest_dir: Path) -> Path:
    """Save an uploaded file to dest_dir with a random name and return its path."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    original_name = file_storage.filename or "file"
    ext = Path(original_name).suffix
    file_id = uuid.uuid4().hex
    dest_path = dest_dir / f"{file_id}{ext}"
    file_storage.save(dest_path)
    return dest_path


def _generate_dummy_instrumental(genre: str | None, mood: str | None, tempo: str | None) -> Path:
    """Placeholder for real instrumental generation using external APIs."""
    instrumental_id = uuid.uuid4().hex
    dest = GENERATED_DIR / f"instrumental_{instrumental_id}.txt"
    content = [
        "FAKE INSTRUMENTAL",
        f"genre={genre}",
        f"mood={mood}",
        f"tempo={tempo}",
    ]
    dest.write_text("\n".join(content), encoding="utf-8")
    return dest


def _mix_vocals_and_instrumental(perfected_vocal_path: Path, instrumental_path: Path) -> Path:
    """Placeholder mix step that combines perfected vocal and instrumental into a final song."""
    song_id = uuid.uuid4().hex
    song_path = GENERATED_DIR / f"song_{song_id}.txt"

    data = [
        "FAKE FINAL SONG",
        "--- PERFECTED VOCAL ---",
        str(perfected_vocal_path),
        "--- INSTRUMENTAL ---",
        str(instrumental_path),
    ]
    song_path.write_text("\n".join(data), encoding="utf-8")
    return song_path


def _save_pitch_info_to_json(song_id: int, pitch_hz, times_sec) -> Path:
    """Persist pitch + timing arrays to JSON for potential visualization/debugging."""
    dest = PITCH_INFO_DIR / f"pitch_{song_id}.json"
    obj = {
        "pitch_hz": pitch_hz,
        "times_sec": times_sec,
    }
    dest.write_text(json.dumps(obj), encoding="utf-8")
    return dest


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health():
    """Simple health check."""
    return jsonify({"status": "ok"}), 200


@app.route("/api/generate-song", methods=["POST"])
def generate_song():
    """Generate a song from uploaded vocal, lyrics, voice choice, and instrumental settings."""
    form = request.form
    files = request.files

    # 1) Raw vocal audio (required)
    if "audio" not in files:
        return jsonify({"error": "Missing 'audio' (vocal) file"}), 400

    raw_vocal_file = files["audio"]
    raw_vocal_path = _save_uploaded_file(raw_vocal_file, UPLOAD_DIR / "vocals")

    # 2) Lyrics (optional text field or lyrics file)
    lyrics_text = form.get("lyricsText", "").strip()
    lyrics_file = files.get("lyricsFile")
    if not lyrics_text and lyrics_file:
        lyrics_path = _save_uploaded_file(lyrics_file, UPLOAD_DIR / "lyrics")
        lyrics_text = Path(lyrics_path).read_text(encoding="utf-8")

    # 3) Basic metadata and options
    title = form.get("title") or "Untitled"
    voice_id = form.get("voiceId") or None

    instrumental_mode = form.get("instrumentalMode", "generate")
    genre = form.get("instrumentalGenre")
    mood = form.get("instrumentalMood")
    tempo = form.get("instrumentalTempo")

    # 4) Perfected vocal pipeline (librosa pitch + placeholder ASR + ElevenLabs TTS)
    perfected_result = create_perfected_vocal(input_audio_path=raw_vocal_path, voice_id=voice_id)
    perfected_path = Path(perfected_result["perfected_path"])
    pitch_hz = perfected_result["pitch_hz"]
    times_sec = perfected_result["times_sec"]

    # 5) Instrumental: upload or generate dummy
    if instrumental_mode == "upload" and "instrumental" in files:
        instrumental_file = files["instrumental"]
        instrumental_path = _save_uploaded_file(instrumental_file, UPLOAD_DIR / "instrumentals")
    else:
        instrumental_path = _generate_dummy_instrumental(genre, mood, tempo)

    # 6) Mix perfected vocal and instrumental
    final_song_path = _mix_vocals_and_instrumental(perfected_path, instrumental_path)

    # 7) Store in SQLite
    db = SessionLocal()
    try:
        song = Song(
            title=title,
            genre=genre,
            mood=mood,
            tempo=tempo,
            lyrics=lyrics_text or None,
            raw_vocal_path=str(raw_vocal_path),
            perfected_vocal_path=str(perfected_path),
            instrumental_path=str(instrumental_path),
            final_song_path=str(final_song_path),
            voice_id=perfected_result["voice_id"],
        )
        db.add(song)
        db.commit()
        db.refresh(song)

        pitch_json_path = _save_pitch_info_to_json(song.id, pitch_hz, times_sec)
        song.pitch_info_path = str(pitch_json_path)
        db.commit()
    finally:
        db.close()

    return jsonify({
        "songId": song.id,
        "title": song.title,
        "songUrl": f"/api/songs/{song.id}/audio",
        "perfectedVocalUrl": f"/api/songs/{song.id}/perfected",
        "pitchInfoUrl": f"/api/songs/{song.id}/pitch",
    }), 201


@app.route("/api/songs/<int:song_id>", methods=["GET"])
def get_song(song_id: int):
    """Return metadata for a single song from SQLite."""
    db = SessionLocal()
    try:
        song = db.get(Song, song_id)
        if not song:
            return jsonify({"error": "Song not found"}), 404

        return jsonify({
            "id": song.id,
            "title": song.title,
            "genre": song.genre,
            "mood": song.mood,
            "tempo": song.tempo,
            "lyrics": song.lyrics,
            "voice_id": song.voice_id,
            "created_at": song.created_at.isoformat(),
            "updated_at": song.updated_at.isoformat(),
        }), 200
    finally:
        db.close()


@app.route("/api/songs/<int:song_id>/audio", methods=["GET"])
def get_song_audio(song_id: int):
    """Stream the final song audio (currently a text placeholder)."""
    db = SessionLocal()
    try:
        song = db.get(Song, song_id)
        if not song or not song.final_song_path:
            return jsonify({"error": "Song or audio not found"}), 404
        song_path = Path(song.final_song_path)
    finally:
        db.close()

    return send_from_directory(
        directory=str(song_path.parent),
        path=song_path.name,
        as_attachment=False,
        mimetype="text/plain",  # change to audio/* when you have real audio
    )


@app.route("/api/songs/<int:song_id>/perfected", methods=["GET"])
def get_perfected_vocal(song_id: int):
    """Stream the perfected vocal produced by ElevenLabs."""
    db = SessionLocal()
    try:
        song = db.get(Song, song_id)
        if not song or not song.perfected_vocal_path:
            return jsonify({"error": "Song or perfected vocal not found"}), 404
        p_path = Path(song.perfected_vocal_path)
    finally:
        db.close()

    return send_from_directory(
        directory=str(p_path.parent),
        path=p_path.name,
        as_attachment=False,
        mimetype="audio/mpeg",
    )


@app.route("/api/songs/<int:song_id>/pitch", methods=["GET"])
def get_song_pitch_info(song_id: int):
    """Return pitch + timing JSON for a song (for visualization/debugging)."""
    db = SessionLocal()
    try:
        song = db.get(Song, song_id)
        if not song or not song.pitch_info_path:
            return jsonify({"error": "Song or pitch info not found"}), 404
        p_json_path = Path(song.pitch_info_path)
    finally:
        db.close()

    if not p_json_path.exists():
        return jsonify({"error": "Pitch info file missing"}), 404

    data = json.loads(p_json_path.read_text(encoding="utf-8"))
    return jsonify(data), 200


@app.route("/api/songs/<int:song_id>/improve", methods=["POST"])
def improve_song(song_id: int):
    """Simple improvement loop that appends feedback to the final song placeholder file."""
    body = request.json or {}
    feedback = (body.get("feedbackText") or "").strip()

    if not feedback:
        return jsonify({"error": "feedbackText is required"}), 400

    db = SessionLocal()
    try:
        song = db.get(Song, song_id)
        if not song or not song.final_song_path:
            return jsonify({"error": "Song not found"}), 404

        song_path = Path(song.final_song_path)
        original = song_path.read_text(encoding="utf-8")
        updated = original + "\n\n=== USER FEEDBACK ===\n" + feedback
        song_path.write_text(updated, encoding="utf-8")
        db.commit()
    finally:
        db.close()

    return jsonify({
        "songId": song_id,
        "songUrl": f"/api/songs/{song_id}/audio",
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
