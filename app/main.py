# from fastapi import FastAPI
# from app.routes import summarize, tts, translate, chatbot, tts_pdf, tts_web
# from fastapi.middleware.cors import CORSMiddleware

# from fastapi import FastAPI
# from fastapi.staticfiles import StaticFiles

# app = FastAPI(title="Vocal Reader")

# # Include feature routes
# app.include_router(summarize.router)
# app.include_router(tts.router)
# app.include_router(translate.router)
# app.include_router(chatbot.router)
# # Include routes

# app.include_router(tts_pdf.router)
# app.include_router(tts_web.router)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# from app.routes import tts_web



# app.include_router(tts_web.router)
# app.mount("/temp_audio", StaticFiles(directory="temp_audio"), name="temp_audio")

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path
import logging
import os
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routes
from app.routes import summarize, tts, translate, chatbot, tts_pdf

# Create necessary directories
temp_audio_dir = Path("temp_audio")
temp_audio_dir.mkdir(exist_ok=True)
logger.info(f"Ensuring temp_audio directory exists at: {temp_audio_dir.absolute()}")

app = FastAPI(title="Vocal Reader")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include all feature routes
app.include_router(summarize.router)
app.include_router(tts.router)
app.include_router(translate.router)
app.include_router(chatbot.router)
app.include_router(tts_pdf.router)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/audio", StaticFiles(directory="temp_audio", html=True), name="audio")

# Templates setup
templates = Jinja2Templates(directory="templates")

# Main application page
@app.get("/app", response_class=HTMLResponse)
async def app_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Welcome page (default landing page)
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("welcome.html", {"request": request})

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure temp directories exist
TEMP_AUDIO_DIR = Path("temp_audio")
TEMP_EXTENSION_DIR = Path("temp_extension")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)
TEMP_EXTENSION_DIR.mkdir(exist_ok=True)

@app.get("/download-extension")
async def download_extension():
    try:
        # Create a temporary directory for the extension
        temp_dir = TEMP_EXTENSION_DIR / "audexa-reader"
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        temp_dir.mkdir(parents=True)

        # Copy extension files to temp directory
        extension_src = Path("chrome_extension")
        if not extension_src.exists():
            raise HTTPException(status_code=404, detail="Extension files not found")

        # Copy extension files
        shutil.copytree(extension_src, temp_dir, dirs_exist_ok=True)

        # Create zip file
        zip_path = TEMP_EXTENSION_DIR / "audexa-reader-extension.zip"
        shutil.make_archive(str(zip_path.with_suffix('')), 'zip', temp_dir)

        return FileResponse(
            path=zip_path,
            filename="audexa-reader-extension.zip",
            media_type="application/zip"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))