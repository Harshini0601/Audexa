from transformers import pipeline

# Load a general-purpose text generation model
chatbot = pipeline("text2text-generation", model="google/flan-t5-large")

def answer_question(question, context=""):
    if not question.strip():
        return "Please provide a valid question."

    try:
        # Create a prompt suitable for general Q&A
        prompt = f"Answer the following question clearly and concisely:\n{question}"
        
        # Generate response
        response = chatbot(prompt, max_new_tokens=200, temperature=0.7, top_p=0.9)
        answer = response[0]["generated_text"].strip()

        return answer
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"
