from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from app.services.tts_engine import text_to_speech

router = APIRouter()

@router.get("/tts")
async def generate_tts(text: str = Query(..., min_length=1), lang: str = "en"):
    """API endpoint to convert text to speech and return the audio file."""
    audio_path = text_to_speech(text, lang)
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename="speech.mp3"
    )