from fastapi import FastAPI
from app.routes import summarize, tts, translate, chatbot

app = FastAPI(title="Vocal Reader")

# Include feature routes
app.include_router(summarize.router)
app.include_router(tts.router)
app.include_router(translate.router)
app.include_router(chatbot.router)