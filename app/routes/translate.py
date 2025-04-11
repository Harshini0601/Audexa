
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services.translate_engine import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    lang: str

@router.post("/translate/")
async def translate(req: TranslationRequest):
    translated = translate_text(req.text, req.lang)
    if translated == "Translation failed.":
        raise HTTPException(status_code=500, detail="Translation service failed.")
    return { "translated_text": translated }