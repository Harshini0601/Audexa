from transformers import pipeline
import logging
import re
import nltk
from nltk.tokenize import sent_tokenize

# Initialize the NLTK tokenizer for sentence splitting
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the summarizer with a better model
# Using facebook/bart-large-cnn which provides better summarization quality
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", framework="pt")

# Maximum number of tokens the model can handle at once
MAX_INPUT_LENGTH = 1024
# Approximate number of tokens per word (for estimation)
TOKENS_PER_WORD = 1.3

def chunk_text(text, max_chunk_size=800):
    """Split text into chunks of maximum size while preserving sentence boundaries."""
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_size = 0
    
    for sentence in sentences:
        # Estimate token count for this sentence
        sentence_size = len(sentence.split()) * TOKENS_PER_WORD
        
        if current_size + sentence_size > max_chunk_size and current_chunk:
            # Current chunk is full, start a new one
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_size = sentence_size
        else:
            # Add sentence to current chunk
            current_chunk.append(sentence)
            current_size += sentence_size
    
    # Add the last chunk if it's not empty
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def summarize_text(text, max_length=150, min_length=30):
    """
    Summarize text, handling long inputs by chunking and combining summaries.
    
    Args:
        text: The text to summarize
        max_length: Maximum length of the summary in tokens
        min_length: Minimum length of the summary in tokens
        
    Returns:
        A string containing the summary
    """
    if not text or not text.strip():
        return "No text to summarize."
    
    # Clean the text
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Get word count
    word_count = len(text.split())
    estimated_token_count = int(word_count * TOKENS_PER_WORD)
    
    logger.info(f"Input text has approximately {word_count} words and {estimated_token_count} tokens")
    
    # Improve the length adjustment logic for better summaries
    # Use a more gradual scaling based on text length
    if word_count < 200:
        # For very short texts, keep summaries concise
        adjusted_max_length = min(max(80, word_count // 4), 150)
        adjusted_min_length = min(max(20, word_count // 8), 60)
    elif word_count < 500:
        # For medium length texts
        adjusted_max_length = min(max(120, word_count // 6), 200)
        adjusted_min_length = min(max(40, word_count // 12), 80)
    else:
        # For longer texts, allow for more detailed summaries
        adjusted_max_length = min(max(150, word_count // 6), 400)
        adjusted_min_length = min(max(60, word_count // 12), 200)
    
    # Override with user-specified lengths if provided
    if max_length != 150:  # If user specified a custom max_length
        adjusted_max_length = max_length
    if min_length != 30:   # If user specified a custom min_length
        adjusted_min_length = min_length
    
    logger.info(f"Using max_length={adjusted_max_length}, min_length={adjusted_min_length}")
    
    try:
        # For short texts, summarize directly
        if estimated_token_count <= MAX_INPUT_LENGTH:
            logger.info("Summarizing text in one pass")
            result = summarizer(text, 
                               max_length=adjusted_max_length, 
                               min_length=adjusted_min_length, 
                               do_sample=True,
                               temperature=0.8,  # Slightly increased for more creative summaries
                               num_beams=4)      # Using beam search for better quality
            return result[0]['summary_text']
        
        # For long texts, chunk and summarize each chunk
        else:
            logger.info("Text too long, chunking into smaller pieces")
            chunks = chunk_text(text)
            logger.info(f"Text split into {len(chunks)} chunks")
            
            # Summarize each chunk
            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                logger.info(f"Summarizing chunk {i+1}/{len(chunks)}")
                # Better chunk size calculations
                chunk_max_length = max(80, adjusted_max_length // max(1, len(chunks)))
                chunk_min_length = max(30, adjusted_min_length // max(1, len(chunks)))
                
                result = summarizer(chunk, 
                                   max_length=chunk_max_length, 
                                   min_length=chunk_min_length, 
                                   do_sample=True,
                                   temperature=0.7,
                                   num_beams=4)
                chunk_summaries.append(result[0]['summary_text'])
            
            # If we have multiple chunk summaries, combine them
            if len(chunk_summaries) > 1:
                logger.info("Generating final summary from chunk summaries")
                combined_summary = " ".join(chunk_summaries)
                
                # If the combined summary is still too long, summarize it again
                if len(combined_summary.split()) > MAX_INPUT_LENGTH // TOKENS_PER_WORD:
                    logger.info("Combined summary still too long, summarizing again")
                    result = summarizer(combined_summary, 
                                       max_length=adjusted_max_length,
                                       min_length=adjusted_min_length,
                                       do_sample=True,
                                       temperature=0.6,  # Lower temperature for more focused final summary
                                       num_beams=5)      # More beams for better quality in final pass
                    return result[0]['summary_text']
                else:
                    return combined_summary
            else:
                return chunk_summaries[0]
                
    except Exception as e:
        logger.error(f"Error in summarization: {str(e)}")
        # Return a simpler summary for very long texts if the model fails
        if word_count > 1000:
            return "The text is too long to summarize with the current model. Please try with a shorter text or break it into smaller sections."
        else:
            return f"Error generating summary: {str(e)}"


