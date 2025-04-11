from gtts import gTTS
import uuid
import os
import logging
from gtts.tts import gTTSError
import uuid, os, textwrap
from pydub import AudioSegment

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path where audio files will be saved temporarily
TEMP_AUDIO_PATH = "temp_audio"

# Ensure the folder exists
os.makedirs(TEMP_AUDIO_PATH, exist_ok=True)

def text_to_speech(text: str, lang: str = "en") -> str:
    """Converts text to speech and returns the path to the audio file."""
    try:
        if not text.strip():
            raise ValueError("Empty text provided")

        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(TEMP_AUDIO_PATH, filename)
        
        logger.info(f"Attempting TTS conversion for text: {text[:50]}...")
        tts = gTTS(text=text, lang=lang)
        
        logger.info(f"Saving audio to {filepath}")
        tts.save(filepath)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Failed to create audio file at {filepath}")
            
        return filepath
    except gTTSError as e:
        logger.error(f"gTTS error: {str(e)}")
        raise Exception(f"TTS generation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in TTS generation: {str(e)}")
        raise Exception(f"TTS generation failed: {str(e)}")

def read_web_browser(text: str, lang: str = "en") -> str:
    chunks = textwrap.wrap(text, width=4500)  # Break into safe chunks
    audio_segments = []
    
    for i, chunk in enumerate(chunks):
        tts = gTTS(text=chunk, lang=lang)
        chunk_path = f"temp_audio/{uuid.uuid4().hex}_chunk.mp3"
        tts.save(chunk_path)
        audio_segments.append(AudioSegment.from_mp3(chunk_path))
        os.remove(chunk_path)

    final_audio = sum(audio_segments)
    output_path = f"temp_audio/{uuid.uuid4().hex}_final.mp3"
    final_audio.export(output_path, format="mp3")
    
    return output_path
# from gtts import gTTS
# import os
# from gtts.lang import tts_langs

# def text_to_speech(text: str, lang: str = "en", output_path: str = "static/audio/speech.mp3") -> str:
#     """
#     Converts given text into speech and saves it to an MP3 file.
#     Falls back to English if the language is unsupported.
#     """
#     supported_langs = tts_langs()

#     if lang not in supported_langs:
#         print(f"[Warning] Language '{lang}' not supported. Falling back to English.")
#         lang = "en"

#     os.makedirs(os.path.dirname(output_path), exist_ok=True)
#     tts = gTTS(text=text, lang=lang, slow=False)
#     tts.save(output_path)

#     return output_path