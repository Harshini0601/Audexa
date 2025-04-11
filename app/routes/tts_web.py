from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from gtts import gTTS
import os
import uuid
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from typing import List, Optional
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Browser headers to avoid 403 errors
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

class WebpageRequest(BaseModel):
    url: str

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com"
            }
        }

@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    try:
        # Create temp directory if it doesn't exist
        temp_dir = Path("temp_audio")
        temp_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = temp_dir / filename
        
        # Convert text to speech
        tts = gTTS(text=request.text, lang='en')
        tts.save(str(filepath))
        
        # Return the audio URL with the correct path
        return {"audio_url": f"/audio/{filename}", "status": "success"}
    except Exception as e:
        logger.error(f"Error in text_to_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read_webpage")
async def read_webpage(request: Request):
    try:
        # Parse request body
        try:
            body = await request.json()
            url = body.get('url')
            logger.info(f"Received request to read webpage: {url}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        if not url:
            logger.error("No URL provided in request")
            raise HTTPException(status_code=400, detail="URL is required")

        # Add scheme if missing
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
            logger.info(f"Added http:// scheme to URL: {url}")

        # Fetch webpage content with browser headers
        try:
            logger.info(f"Fetching webpage content from: {url}")
            session = requests.Session()
            session.headers.update(BROWSER_HEADERS)
            response = session.get(url, timeout=10, allow_redirects=True)
            response.raise_for_status()
            logger.info("Successfully fetched webpage content")
        except requests.RequestException as e:
            logger.error(f"Error fetching webpage: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error fetching webpage: {str(e)}")

        # Parse HTML
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script, style, and other non-content elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'iframe', 'form', 'button', 'input', 'select', 'textarea']):
                element.decompose()
            
            # Extract main content
            main_content = []
            
            # Try to find main content container
            content_selectors = [
                'article',
                'main',
                '[role="main"]',
                '.main-content',
                '#main-content',
                '.post-content',
                '.article-content',
                '.entry-content',
                '#content',
                '.content',
                '.story-content',
                '.post',
                '.article',
                '.blog-post',
                '.news-article',
                '.page-content',
                '.article-body',
                '.story-body',
                '.post-body',
                '.entry-body',
                '.article-text',
                '.post-text',
                '.entry-text',
                '.article-main',
                '.post-main',
                '.entry-main',
                '.article-container',
                '.post-container',
                '.entry-container'
            ]
            
            content_container = None
            for selector in content_selectors:
                content_container = soup.select_one(selector)
                if content_container:
                    logger.info(f"Found main content using selector: {selector}")
                    break
            
            if content_container:
                # Extract paragraphs and headings from main content
                elements = content_container.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'])
            else:
                # Fallback to all paragraphs if no main content container found
                logger.info("No main content container found, falling back to all paragraphs")
                elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'])
            
            # Extract text from elements
            for element in elements:
                # Skip if element is empty or contains only whitespace/special characters
                text = ' '.join(element.get_text().split())  # Normalize whitespace
                if text and len(text) > 10 and not text.isspace():
                    # Add appropriate spacing for headings
                    if element.name.startswith('h'):
                        main_content.append(f"\n{text}\n")
                    else:
                        main_content.append(text)
            
            if not main_content:
                logger.error("No readable content found on the webpage")
                raise HTTPException(status_code=400, detail="No readable content found on the webpage")
            
            logger.info(f"Found {len(main_content)} elements of content")
            
            # Create temp directory if it doesn't exist
            temp_dir = Path("temp_audio")
            temp_dir.mkdir(exist_ok=True)
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}.mp3"
            filepath = temp_dir / filename
            
            # Convert text to speech
            full_text = " ".join(main_content)
            logger.info(f"Converting {len(full_text)} characters to speech")
            
            try:
                tts = gTTS(text=full_text, lang='en')
                tts.save(str(filepath))
                logger.info(f"Successfully saved audio file to {filepath}")
            except Exception as e:
                logger.error(f"Error in text-to-speech conversion: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error converting text to speech: {str(e)}")
            
            return {
                "status": "success",
                "audio_url": f"/audio/{filename}",
                "text_content": main_content
            }
            
        except Exception as e:
            logger.error(f"Error processing webpage content: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing webpage content: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in read_webpage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))