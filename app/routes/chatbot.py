from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from app.services.qa_engine import answer_question  # ✅ import the function

router = APIRouter(prefix="/chatbot", tags=["Q&A Chatbot"])

class QARequest(BaseModel):
    question: str
    context: Optional[str] = ""  # context is optional

@router.post("/")
async def chatbot_route(request: Request):
    """
    Handle both plain text and JSON requests for the chatbot
    """
    try:
        content_type = request.headers.get("content-type", "").lower()

        if "text/plain" in content_type:
            question_text = await request.body()
            question = question_text.decode("utf-8").strip()

            if not question:
                return {"answer": "Please enter a valid question."}

            answer = answer_question(question, "")
            return {"answer": answer}

        else:
            json_data = await request.json()
            question = json_data.get("question", "").strip()
            context = json_data.get("context", "").strip()

            if not question:
                return {"answer": "Please enter a valid question."}

            answer = answer_question(question, context)
            return {"answer": answer}

    except Exception as e:
        import traceback
        print("Chatbot error:", str(e))
        print(traceback.format_exc())
        return {"answer": f"I'm sorry, I encountered an error: {str(e)}"}
