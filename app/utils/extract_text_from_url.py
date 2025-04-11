import requests
from bs4 import BeautifulSoup

def extract_text_from_url(url: str) -> str:
    """
    Extracts visible text from a webpage.

    Args:
        url: The URL of the webpage.

    Returns:
        Extracted text as a string.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script and style elements
        for script_or_style in soup(["script", "style", "noscript"]):
            script_or_style.decompose()

        text = soup.get_text(separator=' ')
        lines = [line.strip() for line in text.splitlines()]
        text = ' '.join(line for line in lines if line)

        return text

    except Exception as e:
        raise Exception(f"Error extracting text from URL: {str(e)}")