from gtts import gTTS
import uuid
import os

# Path where audio files will be saved temporarily
TEMP_AUDIO_PATH = "temp_audio"

# Ensure the folder exists
os.makedirs(TEMP_AUDIO_PATH, exist_ok=True)

def text_to_speech(text: str, lang: str = "en") -> str:
    """Converts text to speech and returns the path to the audio file."""
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(TEMP_AUDIO_PATH, filename)
    
    tts = gTTS(text=text, lang=lang)
    tts.save(filepath)

    return filepath