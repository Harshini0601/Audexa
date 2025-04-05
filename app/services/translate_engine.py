from transformers import MarianMTModel, MarianTokenizer

def translate_text(text, lang_code="hi"):
    model_name = f"Helsinki-NLP/opus-mt-en-{lang_code}"
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)

    tokens = tokenizer.prepare_seq2seq_batch([text], return_tensors="pt")
    translated = model.generate(**tokens)
    result = tokenizer.decode(translated[0], skip_special_tokens=True)
    return result