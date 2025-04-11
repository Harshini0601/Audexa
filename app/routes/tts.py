#wrong code this is for translate not tts

# from fastapi import APIRouter, Query
# from fastapi.responses import FileResponse
# from app.services.tts_engine import text_to_speech

# router = APIRouter()

# @router.get("/translate")
# async def generate_tts(text: str = Query(..., min_length=1), lang: str = "en"):
#     """
#     API endpoint to convert text to speech and return the audio file.
#     """
#     audio_path = text_to_speech(text, lang)
#     return FileResponse(
#         path=audio_path,
#         media_type="audio/mpeg",
#         filename="speech.mp3"
#     )


#working
# from fastapi import APIRouter, Query
# from fastapi.responses import FileResponse
# from app.services.tts_engine import text_to_speech

# router = APIRouter()

# @router.get("/tts")
# async def generate_tts(text: str = Query(..., min_length=1), lang: str = "en"):
#     """API endpoint to convert text to speech and return the audio file."""
#     audio_path = text_to_speech(text, lang)
#     return FileResponse(
#         path=audio_path,
#         media_type="audio/mpeg",
#         filename="speech.mp3"
#     )

from fastapi import APIRouter, Query, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse, Response
from app.services.tts_engine import text_to_speech
# from app.utils.tts_utils import extract_text_from_pdf
import os
import logging
from starlette.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/tts")
async def generate_tts_get(text: str = Query(..., min_length=1), lang: str = "en"):
    """API endpoint to convert text to speech and return the audio file (GET method)."""
    return await process_tts(text, lang)

@router.post("/tts")
async def generate_tts_post(text: str = Query(..., min_length=1), lang: str = "en"):
    """API endpoint to convert text to speech and return the audio file (POST method)."""
    return await process_tts(text, lang)

async def process_tts(text: str, lang: str = "en"):
    """Process text-to-speech conversion and return response."""
    try:
        logger.info(f"Received TTS request for text: {text[:50]}...")
        
        if not text.strip():
            return Response(
                content="Text cannot be empty",
                status_code=400
            )
            
        audio_path = text_to_speech(text, lang)
        
        if not os.path.exists(audio_path):
            return Response(
                content="Failed to generate audio file",
                status_code=500
            )
            
        return FileResponse(
            path=audio_path,
            media_type="audio/mpeg",
            filename="speech.mp3"
        )
    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        return Response(
            content=str(e),
            status_code=500
        )

# @router.post("/tts/pdf")
# async def generate_tts_from_pdf(file: UploadFile = File(...), lang: str = "en"):
#     """API endpoint to extract text from PDF and convert to speech."""
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"error": "Only PDF files are supported."})

#     try:
#         # Extract text from the uploaded PDF
#         text = extract_text_from_pdf(file.file)

#         if not text.strip():
#             return JSONResponse(status_code=400, content={"error": "No readable text in PDF."})

#         # Generate TTS from extracted text
#         audio_path = text_to_speech(text, lang)

#         return FileResponse(
#             path=audio_path,
#             media_type="audio/mpeg",
#             filename="speech_from_pdf.mp3"
#         )

#     except Exception as e:
#         return JSONResponse(status_code=500, content={"error": str(e)})
    
# from app.utils import extract_text_from_url

# @router.post("/read_webpage")
# async def read_webpage(data: dict):
#     from app.services.tts_engine import text_to_speech

#     url = data.get("url")
#     if not url:
#         raise HTTPException(status_code=400, detail="URL is required.")

#     try:
#         text = extract_text_from_url(url)
#         audio = text_to_speech(text, lang="en", voice="female", rate=150)
#         return StreamingResponse(audio, media_type="audio/mpeg")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#not working removing other functionalities also
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from fastapi.responses import StreamingResponse
# import io

# from app.utils import extract_text_from_url
# from app.services.tts_engine import text_to_speech

# router = APIRouter()

# # Pydantic model
# class URLRequest(BaseModel):
#     url: str

# @router.post("/read_webpage")
# async def read_webpage(data: URLRequest):
#     try:
#         text = extract_text_from_url(data.url)
#         audio_bytes = text_to_speech(text, lang="en", voice="female", rate=150)
#         return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))