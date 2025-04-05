from fastapi import APIRouter, Request
from app.services.qa_engine import answer_question

router = APIRouter(prefix="/chatbot", tags=["Q&A Chatbot"])

@router.post("/")
async def chatbot_route(request: Request):
    data = await request.json()
    context = data.get("context")
    question = data.get("question")
    answer = answer_question(context, question)
    return {"answer": answer}