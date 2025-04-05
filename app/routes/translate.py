from fastapi import APIRouter, Request
from app.services.translate_engine import translate_text

router = APIRouter(prefix="/translate", tags=["Translation"])

@router.post("/")
async def translate_route(request: Request):
    data = await request.json()
    text = data.get("text")
    target_lang = data.get("lang", "hi")
    translated = translate_text(text, target_lang)
    return {"translated_text": translated}