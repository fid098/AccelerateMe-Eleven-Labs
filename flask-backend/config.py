"""
Configuration file for the Flask application.
Loads environment variables and sets up global constants.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
    
    # API Keys
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
    
    # Folder paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
    WORKSPACE_FOLDER = os.path.join(BASE_DIR, 'workspace')
    
    # Subfolders
    LYRICS_FOLDER = os.path.join(UPLOAD_FOLDER, 'lyrics')
    AUDIO_FOLDER = os.path.join(UPLOAD_FOLDER, 'audio')
    INSTRUMENTAL_FOLDER = os.path.join(UPLOAD_FOLDER, 'instrumentals')
    
    VOCALS_OUTPUT = os.path.join(OUTPUT_FOLDER, 'vocals')
    INSTRUMENTAL_OUTPUT = os.path.join(OUTPUT_FOLDER, 'instrumentals')
    FINAL_SONGS_OUTPUT = os.path.join(OUTPUT_FOLDER, 'final_songs')
    
    # Allowed file extensions
    ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac'}
    ALLOWED_TEXT_EXTENSIONS = {'txt', 'doc', 'docx'}
    
    # Audio settings
    DEFAULT_SAMPLE_RATE = 44100
    DEFAULT_BIT_RATE = '192k'
    
    # Instrumental generation defaults
    DEFAULT_GENRE = 'pop'
    DEFAULT_TEMPO = 120
    DEFAULT_MOOD = 'upbeat'
    
    @staticmethod
    def init_app(app):
        """Initialize application folders"""
        folders = [
            Config.UPLOAD_FOLDER,
            Config.OUTPUT_FOLDER,
            Config.WORKSPACE_FOLDER,
            Config.LYRICS_FOLDER,
            Config.AUDIO_FOLDER,
            Config.INSTRUMENTAL_FOLDER,
            Config.VOCALS_OUTPUT,
            Config.INSTRUMENTAL_OUTPUT,
            Config.FINAL_SONGS_OUTPUT
        ]
        
        for folder in folders:
            os.makedirs(folder, exist_ok=True)
        
        print("✓ Application folders initialized")

# Create config instance
config = Config()