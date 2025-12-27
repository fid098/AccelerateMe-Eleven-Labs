"""
Handles all lyrics-related processing:
- Text input
- File upload (.txt, .doc)
- Audio transcription (user singing)
"""

import os
import uuid
import speech_recognition as sr
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from config import config

class LyricsProcessor:
    """Process lyrics from various input methods"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def process_text_input(self, lyrics_text):
        """
        Process lyrics directly typed by user
        
        Args:
            lyrics_text (str): Raw lyrics text
            
        Returns:
            dict: Processed lyrics info with file path
        """
        try:
            # Generate unique ID for this lyrics
            lyrics_id = str(uuid.uuid4())
            
            # Clean up lyrics text
            cleaned_lyrics = lyrics_text.strip()
            
            # Save to file for reference
            lyrics_filename = f"{lyrics_id}.txt"
            lyrics_path = os.path.join(config.LYRICS_FOLDER, lyrics_filename)
            
            with open(lyrics_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_lyrics)
            
            return {
                'success': True,
                'lyrics_id': lyrics_id,
                'lyrics_text': cleaned_lyrics,
                'lyrics_path': lyrics_path,
                'word_count': len(cleaned_lyrics.split()),
                'line_count': len(cleaned_lyrics.split('\n'))
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_lyrics_file(self, file):
        """
        Process uploaded lyrics file (.txt, .doc, .docx)
        
        Args:
            file: FileStorage object from Flask request
            
        Returns:
            dict: Processed lyrics info
        """
        try:
            # Validate file
            if not file or file.filename == '':
                return {'success': False, 'error': 'No file provided'}
            
            # Check file extension
            filename = secure_filename(file.filename)
            file_ext = filename.rsplit('.', 1)[1].lower()
            
            if file_ext not in config.ALLOWED_TEXT_EXTENSIONS:
                return {
                    'success': False, 
                    'error': f'Invalid file type. Allowed: {config.ALLOWED_TEXT_EXTENSIONS}'
                }
            
            # Generate unique ID
            lyrics_id = str(uuid.uuid4())
            
            # Save original file
            saved_filename = f"{lyrics_id}.{file_ext}"
            file_path = os.path.join(config.LYRICS_FOLDER, saved_filename)
            file.save(file_path)
            
            # Read text content
            if file_ext == 'txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    lyrics_text = f.read()
            else:
                # For .doc/.docx, you'd need python-docx library
                # For hackathon, just support .txt
                return {
                    'success': False,
                    'error': '.doc/.docx support requires python-docx library (use .txt for hackathon)'
                }
            
            # Save as standardized .txt
            txt_path = os.path.join(config.LYRICS_FOLDER, f"{lyrics_id}.txt")
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(lyrics_text)
            
            return {
                'success': True,
                'lyrics_id': lyrics_id,
                'lyrics_text': lyrics_text,
                'lyrics_path': txt_path,
                'word_count': len(lyrics_text.split()),
                'line_count': len(lyrics_text.split('\n'))
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def transcribe_audio(self, audio_path):
        """
        Transcribe lyrics from audio file (user singing/speaking)
        Uses Google Speech Recognition (free, no API key needed)
        
        Args:
            audio_path (str): Path to audio file
            
        Returns:
            dict: Transcription result
        """
        try:
            # Convert audio to WAV format (required for speech_recognition)
            audio = AudioSegment.from_file(audio_path)
            wav_path = audio_path.rsplit('.', 1)[0] + '_temp.wav'
            audio.export(wav_path, format='wav')
            
            # Transcribe using speech recognition
            with sr.AudioFile(wav_path) as source:
                audio_data = self.recognizer.record(source)
                
                # Use Google Speech Recognition (free, no API key)
                lyrics_text = self.recognizer.recognize_google(audio_data)
            
            # Clean up temp file
            if os.path.exists(wav_path):
                os.remove(wav_path)
            
            # Save transcription
            lyrics_id = str(uuid.uuid4())
            lyrics_path = os.path.join(config.LYRICS_FOLDER, f"{lyrics_id}.txt")
            
            with open(lyrics_path, 'w', encoding='utf-8') as f:
                f.write(lyrics_text)
            
            return {
                'success': True,
                'lyrics_id': lyrics_id,
                'lyrics_text': lyrics_text,
                'lyrics_path': lyrics_path,
                'source': 'audio_transcription'
            }
        
        except sr.UnknownValueError:
            return {
                'success': False,
                'error': 'Could not understand audio. Please speak clearly or use text input.'
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'error': f'Speech recognition service error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_lyrics(self, lyrics_id):
        """
        Retrieve saved lyrics by ID
        
        Args:
            lyrics_id (str): Unique lyrics identifier
            
        Returns:
            dict: Lyrics content or error
        """
        try:
            lyrics_path = os.path.join(config.LYRICS_FOLDER, f"{lyrics_id}.txt")
            
            if not os.path.exists(lyrics_path):
                return {
                    'success': False,
                    'error': 'Lyrics not found'
                }
            
            with open(lyrics_path, 'r', encoding='utf-8') as f:
                lyrics_text = f.read()
            
            return {
                'success': True,
                'lyrics_id': lyrics_id,
                'lyrics_text': lyrics_text
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Create global instance
lyrics_processor = LyricsProcessor()