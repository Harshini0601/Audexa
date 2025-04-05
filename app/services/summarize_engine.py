from transformers import pipeline

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6",framework="pt")

def summarize_text(text):
    result = summarizer(text, max_length=100, min_length=25, do_sample=False)
    return result[0]['summary_text']