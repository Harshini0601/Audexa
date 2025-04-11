from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse, Response
from app.services.tts_engine import text_to_speech
from app.utils.extract_text_from_pdf import extract_text_from_pdf
import logging
import traceback
import os
import uuid

# Set up logging with more details
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/tts/pdf")
async def generate_tts_from_pdf(file: UploadFile = File(...), lang: str = "en"):
    """API endpoint to extract text from PDF and convert to speech."""
    temp_file_path = None
    
    try:
        if not file or not file.filename:
            logger.error("No file provided or filename is empty")
            return JSONResponse(
                status_code=400,
                content={"error": "No PDF file was provided"}
            )
            
        logger.info(f"Received PDF conversion request: {file.filename}, Content-Type: {file.content_type}")
        
        # Create a unique filename to prevent conflicts
        unique_id = str(uuid.uuid4())
        temp_file_path = f"temp_pdf_{unique_id}_{file.filename}"
        
        # Save the uploaded file
        try:
            logger.info(f"Saving uploaded file to {temp_file_path}")
            content = await file.read()
            
            with open(temp_file_path, "wb") as temp_file:
                temp_file.write(content)
                
            file_size = os.path.getsize(temp_file_path)
            logger.info(f"File saved successfully, size: {file_size} bytes")
            
            # Extract text from PDF using the saved file path
            logger.info("Extracting text from PDF...")
            text = await extract_text_from_pdf(temp_file_path)
            
            if not text or not text.strip():
                logger.warning("No readable text found in PDF")
                return JSONResponse(
                    status_code=400, 
                    content={"error": "No readable text found in the PDF file. Make sure it's not a scanned document or image-only PDF."}
                )
                
            logger.info(f"Text extracted successfully: {text[:100]}...")
                
            # Generate speech from extracted text
            logger.info(f"Extracted {len(text)} characters. Converting to speech...")
            audio_path = text_to_speech(text, lang)
            
            if not os.path.exists(audio_path):
                logger.error(f"Generated audio file not found at expected path: {audio_path}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to generate audio file"}
                )
                
            file_size = os.path.getsize(audio_path)
            logger.info(f"Generated audio at: {audio_path}, Size: {file_size} bytes")
            
            # Return the audio file
            response = FileResponse(
                path=audio_path, 
                media_type="audio/mpeg", 
                filename=f"{os.path.splitext(file.filename)[0]}.mp3"
            )
            
            logger.info("Returning audio file response")
            return response
        
        except Exception as e:
            logger.error(f"Error in PDF processing: {str(e)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500, 
                content={"error": f"Failed to process PDF: {str(e)}"}
            )
            
    except Exception as outer_e:
        logger.error(f"Outer exception: {str(outer_e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"Server error: {str(outer_e)}"}
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Temporary file removed: {temp_file_path}")
            except Exception as e:
                logger.error(f"Failed to remove temporary file: {str(e)}")