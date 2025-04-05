

# # from fastapi import APIRouter, Request
# # import json
# # from app.services.summarize_engine import summarize_text

# # router = APIRouter(prefix="/summarize", tags=["Summarization"])

# # @router.post("/")
# # async def summarize_route(request: Request):
# #     try:
# #         # Read JSON data safely
# #         raw_data = await request.body()
        
# #         # Decode JSON and remove escape characters
# #         data = json.loads(raw_data.decode("utf-8").replace("\r", "").replace("\n", " ").replace("\t", " "))

# #         # Extract text
# #         text = data.get("text", "").strip()

# #         if not text:
# #             return {"error": "No text provided for summarization"}

# #         # Summarize text
# #         summary = summarize_text(text)
        
# #         return {"summary": summary}
    
# #     except json.JSONDecodeError as e:
# #         return {"error": "Invalid JSON format", "details": str(e)}


# working
# from fastapi import FastAPI, APIRouter, Request, Form
# from fastapi.responses import HTMLResponse
# from fastapi.templating import Jinja2Templates
# import json
# from app.services.summarize_engine import summarize_text

# app = FastAPI()
# router = APIRouter(prefix="/summarize", tags=["Summarization"])

# # Load HTML templates
# templates = Jinja2Templates(directory="templates")

# @app.get("/", response_class=HTMLResponse)
# async def read_root(request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})

# @router.post("/")
# async def summarize_route(request: Request):
#     try:
#         raw_data = await request.body()
#         data = json.loads(raw_data.decode("utf-8").replace("\r", "").replace("\n", " ").replace("\t", " "))
#         text = data.get("text", "").strip()

#         if not text:
#             return {"error": "No text provided for summarization"}

#         summary = summarize_text(text)
#         return {"summary": summary}

#     except json.JSONDecodeError as e:
#         return {"error": "Invalid JSON format", "details": str(e)}

# app.include_router(router)


# # from fastapi import APIRouter, Request, HTTPException
# # from pydantic import BaseModel
# # import json
# # import re
# # from app.services.summarize_engine import summarize_text

# # router = APIRouter(prefix="/summarize", tags=["Summarization"])

# # class SummarizeRequest(BaseModel):
# #     text: str

# # def clean_text(text):
# #     """Removes escape characters and control characters from input text."""
# #     return re.sub(r"[\x00-\x1F\x7F]", " ", text).strip()

# # @router.post("/")
# # async def summarize_route(request: Request):
# #     try:
# #         # Read JSON data safely
# #         raw_data = await request.body()
# #         data = json.loads(raw_data.decode("utf-8"))

# #         # Extract and clean text
# #         text = data.get("text", "").strip()
# #         cleaned_text = clean_text(text)

# #         if not cleaned_text:
# #             raise HTTPException(status_code=400, detail="Input text cannot be empty or contain only invalid characters")

# #         # Summarize text
# #         summary = summarize_text(cleaned_text)
# #         if not summary:
# #             raise HTTPException(status_code=500, detail="Summarization failed")

# #         return {"summary": summary}

# #     except json.JSONDecodeError as e:
# #         raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")


# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import re
# from app.services.summarize_engine import summarize_text  # Import your summarization function

# app = FastAPI()

# # ✅ Define a request model (this makes input appear in Swagger UI)
# class SummarizeRequest(BaseModel):
#     text: str

# # ✅ Function to clean raw input text
# def clean_text(text: str) -> str:
#     # Remove control characters, excessive whitespace, and escape sequences
#     cleaned_text = re.sub(r"[\x00-\x1F\x7F]", "", text)  
#     cleaned_text = cleaned_text.replace("\r", " ").replace("\n", " ").replace("\t", " ")
#     return cleaned_text.strip()

# # ✅ API Route for Summarization
# @app.post("/summarize/")
# async def summarize(request: SummarizeRequest):
#     cleaned_text = clean_text(request.text)

#     if not cleaned_text:
#         raise HTTPException(status_code=400, detail="Input text cannot be empty or contains invalid characters")

#     summary = summarize_text(cleaned_text)  # Call your actual summarization function

#     if not summary:
#         raise HTTPException(status_code=500, detail="Summarization failed")

#     return {"summary": summary}



#ui code without escape characters
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import re
# from app.services.summarize_engine import summarize_text

# router = APIRouter(prefix="/summarize", tags=["Summarization"])

# class SummarizeRequest(BaseModel):
#     text: str

# def clean_text(text):
#     return re.sub(r"[\x00-\x1F\x7F]", "", text)  # Remove control characters

# @router.post("/")
# async def summarize_route(request: SummarizeRequest):
#     cleaned_text = clean_text(request.text)
#     if not cleaned_text.strip():
#         raise HTTPException(status_code=400, detail="Input text cannot be empty or contains invalid characters")

#     summary = summarize_text(cleaned_text)
#     if not summary:
#         raise HTTPException(status_code=500, detail="Summarization failed")

#     return {"summary": summary}

from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.services.summarize_engine import summarize_text
import json
import re

app = FastAPI()
router = APIRouter(prefix="/summarize", tags=["Summarization"])

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 💡 Clean text function to sanitize input
def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"[\x00-\x1F\x7F]", "", text)  # Remove control characters
    return text

@router.post("/")
async def summarize_route(request: Request):
    try:
        # Decode and pre-clean raw request data
        raw_data = await request.body()
        data = json.loads(
            raw_data.decode("utf-8")
            .replace("\r", "")
            .replace("\n", " ")
            .replace("\t", " ")
        )

        text = data.get("text", "").strip()
        cleaned_text = clean_text(text)

        if not cleaned_text:
            raise HTTPException(status_code=400, detail="Input text is empty or invalid after cleaning.")

        summary = summarize_text(cleaned_text)

        if not summary:
            raise HTTPException(status_code=500, detail="Summarization failed")

        return {"summary": summary}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")




