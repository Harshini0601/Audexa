# from transformers import pipeline

# qa_pipeline = pipeline("question-answering")

# def answer_question(context, question):
#     if not context or not question:
#         return "Please provide both context and question."

#     result = qa_pipeline(question=question, context=context)
#     return result.get('answer', 'Sorry, I could not find an answer.')


import openai
import os
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = "https://openrouter.ai/api/v1"  # note: base_url not api_base in new version

if not openai.api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set. Please set it to your OpenRouter API key.")

client = openai.OpenAI(
    api_key=openai.api_key,
    base_url=openai.base_url
)


def answer_question(question: str, context = "") -> str:
    if not question.strip() and context=="":
        return "Please enter a valid question."

    prompt = f"Context:\n{context}\n\nQuestion:\n{question}"

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"

