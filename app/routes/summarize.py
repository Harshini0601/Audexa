
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import re
import logging
from app.services.summarize_engine import summarize_text

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summarize", tags=["Summarization"])

class SummarizeRequest(BaseModel):
    text: str
    sentence_count: int = Field(default=3, ge=1, le=10, description="Number of sentences in summary")
    detailed: bool = Field(default=False, description="Request a more detailed summary")

def clean_text(text):
    # Remove control characters but keep newlines for paragraph structure
    cleaned = re.sub(r"[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]", "", text)
    # Replace multiple newlines with single newline for paragraph separation
    cleaned = re.sub(r"\n+", "\n", cleaned)
    # Replace newlines with spaces for processing
    cleaned = re.sub(r"\n", " ", cleaned)
    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

@router.post("/")
async def summarize_route(request: SummarizeRequest):
    try:
        # Clean the input text
        cleaned_text = clean_text(request.text)
        if not cleaned_text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty or contains only invalid characters")
        
        # Log text length for debugging
        word_count = len(cleaned_text.split())
        logger.info(f"Summarizing text with {word_count} words, detailed={request.detailed}, sentence_count={request.sentence_count}")
        
        # More sophisticated length parameter calculation
        # Base lengths adjusted for different text sizes
        if word_count < 200:
            base_min_length = 30
            base_max_length = 80
        elif word_count < 500:
            base_min_length = 50
            base_max_length = 150
        elif word_count < 1000:
            base_min_length = 70
            base_max_length = 200
        else:
            base_min_length = 100
            base_max_length = 300
        
        # If detailed summary requested, increase lengths significantly
        if request.detailed:
            base_min_length = int(base_min_length * 1.7)
            base_max_length = int(base_max_length * 1.7)
        
        # Apply sentence count factor - each additional sentence increases length proportionally
        sentence_factor = request.sentence_count / 3  # Normalized to default of 3 sentences
        
        # Apply sentence count scaling
        min_length = max(30, int(base_min_length * sentence_factor))
        max_length = max(80, int(base_max_length * sentence_factor))
        
        # Cap at reasonable limits
        min_length = min(min_length, 250)
        max_length = min(max_length, 500)
        
        logger.info(f"Final parameters: min_length={min_length}, max_length={max_length}")
        
        # Call the summarize engine with optimized parameters
        summary = summarize_text(cleaned_text, max_length=max_length, min_length=min_length)
        
        if not summary or summary.strip() == "":
            logger.warning(f"Empty summary returned for text with {word_count} words")
            raise HTTPException(status_code=500, detail="Summarization produced an empty result")
            
        return {"summary": summary}
        
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
