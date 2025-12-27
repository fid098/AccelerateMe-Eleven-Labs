from datetime import datetime
from pathlib import Path

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Song(Base):
    """Represents one generated song/workspace in the system."""

    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic metadata
    title = Column(String(255), nullable=False, default="Untitled")
    genre = Column(String(100), nullable=True)
    mood = Column(String(100), nullable=True)
    tempo = Column(String(100), nullable=True)

    # Song lyrics
    lyrics = Column(Text, nullable=True)

    # Paths to audio artifacts
    raw_vocal_path = Column(String(500), nullable=True)
    perfected_vocal_path = Column(String(500), nullable=True)
    instrumental_path = Column(String(500), nullable=True)
    final_song_path = Column(String(500), nullable=True)

    # ElevenLabs voice id used for the perfected vocal
    voice_id = Column(String(200), nullable=True)

    # Optional path to JSON with pitch + timing info
    pitch_info_path = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Song id={self.id} title={self.title!r}>"
