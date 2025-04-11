import fitz  # PyMuPDF
import logging
import traceback
import os
from fastapi import UploadFile

logger = logging.getLogger(__name__)

async def extract_text_from_pdf(file_path) -> str:
    """
    Extracts text from a PDF file.
    
    Args:
        file_path: Path to the PDF file on disk.

    Returns:
        Extracted text as a string.
    """
    text = ""
    
    try:
        logger.info(f"Opening PDF file from path: {file_path}")
        
        # Open the PDF file
        doc = fitz.open(file_path)
        logger.info(f"PDF opened successfully. Page count: {len(doc)}")
        
        # Extract text from all pages
        for i, page in enumerate(doc):
            page_text = page.get_text()
            text += page_text
            logger.info(f"Extracted {len(page_text)} characters from page {i+1}")
            
        logger.info(f"Completed PDF text extraction. Total characters: {len(text)}")
        doc.close()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        logger.error(traceback.format_exc())
        raise Exception(f"Error extracting text from PDF: {str(e)}")