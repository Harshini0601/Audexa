import os

def cleanup_audio_folder():
    folder = "static/audio"
    for file in os.listdir(folder):
        if file.endswith(".mp3"):
            os.remove(os.path.join(folder, file))


import re

def clean_text(text: str) -> str:
    text = re.sub(r'[\u200B-\u200D\uFEFF]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# import PyPDF2

# def extract_text_from_pdf(pdf_file) -> str:
#     reader = PyPDF2.PdfReader(pdf_file)
#     text = ""
#     for page in reader.pages:
#         content = page.extract_text()
#         if content:
#             text += content + "\n"
#     return text.strip()

# # utils.py
# from bs4 import BeautifulSoup
# import requests

# def extract_text_from_url(url: str) -> str:
#     try:
#         response = requests.get(url)
#         response.raise_for_status()

#         soup = BeautifulSoup(response.text, "html.parser")

#         # Remove unwanted tags
#         for tag in soup(["script", "style", "header", "footer", "nav", "aside"]):
#             tag.decompose()

#         # Grab meaningful text
#         text_elements = soup.find_all(["p", "h1", "h2", "li"])
#         extracted_text = " ".join(el.get_text(separator=" ", strip=True) for el in text_elements)

#         return extracted_text
#     except Exception as e:
#         raise RuntimeError(f"Error extracting text: {e}")