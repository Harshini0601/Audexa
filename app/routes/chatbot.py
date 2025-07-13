from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from app.services.qa_engine import answer_question
import os
import openai

router = APIRouter(prefix="/chatbot", tags=["Q&A Chatbot"])

class QARequest(BaseModel):
    question: str
    context: Optional[str] = ""  # Context is optional

@router.post("/")
async def chatbot_route(request: Request):
    """
    Handle both plain text and JSON requests for the chatbot
    """
    try:
        # First check if it's a plain text request
        content_type = request.headers.get("content-type", "").lower()
        
        if "text/plain" in content_type:
            # Handle plain text request (just the question)
            question_text = await request.body()
            question = question_text.decode("utf-8")
            
            if not question.strip():
                return {"answer": "Please enter a valid question."}
                
            # Pass empty context with plain text requests
            answer = answer_question(question)
            return {"answer": answer}
        else:
            # Handle JSON request with question and optional context
            json_data = await request.json()
            question = json_data.get("question", "").strip()
            context = json_data.get("context", "").strip()
            
            if not question:
                return {"answer": "Please enter a valid question."}
                
            answer = answer_question(question, context)
            return {"answer": answer}
            
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Chatbot error: {str(e)}")
        print(traceback.format_exc())
        
        # Return a user-friendly message
        return {"answer": f"I'm sorry, I encountered an error: {str(e)}"}

