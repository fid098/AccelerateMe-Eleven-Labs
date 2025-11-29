import os
import uuid
from pathlib import Path
from typing import Tuple

import librosa
import numpy as np
import requests
import soundfile as sf  # noqa: F401  # kept for potential future audio conversions
from dotenv import load_dotenv

# Load environment variables (e.g. ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID)
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
DEFAULT_ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "your-cloned-voice-id")

BASE_DIR = Path(__file__).resolve().parent
PERFECTED_DIR = BASE_DIR / "perfected_vocals"
PERFECTED_DIR.mkdir(parents=True, exist_ok=True)


# -------------------------------------------------------------------
# 1. Pitch + timing extraction
# -------------------------------------------------------------------


def extract_pitch_and_timing(
    audio_path: Path,
    target_sr: int = 22050,
    fmin: float = 50.0,
    fmax: float = 2000.0,
    frame_length: int = 2048,
    hop_length: int = 256,
) -> Tuple[np.ndarray, np.ndarray]:
    """Extract per-frame pitch (F0) and corresponding time stamps using librosa."""
    y, sr = librosa.load(str(audio_path), sr=target_sr, mono=True)

    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=fmin,
        fmax=fmax,
        frame_length=frame_length,
        hop_length=hop_length,
    )

    times = librosa.times_like(f0, sr=sr, hop_length=hop_length)
    return f0, times


# -------------------------------------------------------------------
# 2. Placeholder transcription (swap in Whisper/ASR later)
# -------------------------------------------------------------------


def transcribe_audio_placeholder(audio_path: Path) -> str:
    """Placeholder transcription function to be replaced with real ASR/Whisper."""
    return "This is a placeholder transcription. Replace with Whisper or another ASR output."


# -------------------------------------------------------------------
# 3. ElevenLabs TTS integration
# -------------------------------------------------------------------


def elevenlabs_tts_from_text(
    text: str,
    output_path: Path,
    voice_id: str | None = None,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.5,
    use_speaker_boost: bool = True,
) -> Path:
    """Call ElevenLabs text-to-speech with a cloned/custom voice and save the result."""
    if ELEVENLABS_API_KEY is None:
        raise RuntimeError("ELEVENLABS_API_KEY is not set in the environment.")

    if voice_id is None:
        voice_id = DEFAULT_ELEVENLABS_VOICE_ID

    if not voice_id:
        raise RuntimeError(
            "No ElevenLabs voice ID provided. Set ELEVENLABS_VOICE_ID or pass voice_id explicitly."
        )

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }

    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost,
        },
    }

    response = requests.post(url, json=payload, headers=headers, stream=True)
    if not response.ok:
        raise RuntimeError(
            f"ElevenLabs TTS failed ({response.status_code}): {response.text}"
        )

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=4096):
            if chunk:
                f.write(chunk)

    return output_path


# -------------------------------------------------------------------
# 4. Full perfected-vocal pipeline
# -------------------------------------------------------------------


def create_perfected_vocal(input_audio_path: Path, voice_id: str | None = None) -> dict:
    """Run pitch extraction, placeholder transcription, and ElevenLabs TTS to create a perfected vocal."""
    input_audio_path = Path(input_audio_path)

    # 1) Pitch + timing
    f0, times = extract_pitch_and_timing(input_audio_path)

    # 2) Transcription (placeholder)
    transcription = transcribe_audio_placeholder(input_audio_path)

    # 3) ElevenLabs TTS call
    perfected_id = uuid.uuid4().hex
    perfected_path = PERFECTED_DIR / f"perfected_{perfected_id}.mp3"

    elevenlabs_tts_from_text(
        text=transcription,
        output_path=perfected_path,
        voice_id=voice_id,
    )

    # Convert numpy arrays to JSON-serializable lists
    pitch_list = [float(v) if not np.isnan(v) else None for v in f0]
    time_list = [float(t) for t in times]

    return {
        "perfected_path": str(perfected_path),
        "pitch_hz": pitch_list,
        "times_sec": time_list,
        "transcription": transcription,
        "voice_id": voice_id or DEFAULT_ELEVENLABS_VOICE_ID,
    }
