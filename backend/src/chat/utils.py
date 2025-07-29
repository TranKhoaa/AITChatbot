from sentence_transformers import SentenceTransformer
from typing import List
import requests
import re
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen3:0.6b"

def question_embedding(query: str, max_length=1024):
    question_vect = model.encode(query)
    return question_vect

def construct_prompt(question: str, chunks: List[str]) -> str:
    """Construct a prompt for the LLM using the question and chunk context."""
    context = "\n\n".join(chunks)
    prompt = f"""
        You are a helpful and intelligent assistant designed to provide concise and accurate answers based on the given context. 
        When a user asks a question, analyze the provided context carefully to find relevant information. 
        If the context contains sufficient details, answer the question precisely using that information. 
        If the context lacks enough information to answer fully, clearly state that the information is insufficient and offer a general answer or explanation if possible. 
        **Context**:
        {context}

        **Question**:
        {question}

        **Answer**:
        """
    return prompt

def query_ollama(prompt: str) -> str:
    """Call the Ollama API with the given prompt."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.6,
            "max_tokens": 500
        }
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        answer = response.json().get("response", "Error: No response from Ollama")
        # Extract the answer after "**Answer**:" if present

        """If using qwen3:latest uncomment this line"""
        # if "**Answer**:" in answer:
        #     return answer.split("**Answer**:")[1].strip()
        """End comment"""

        """Use for qwen3:0.6b"""
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL)
        """End"""

        return answer.strip()
    except requests.RequestException as e:
        raise Exception(f"Ollama API request failed: {str(e)}")

def translate_to_vietnam(answer: str) -> str:
    # Translate text to Vietnamese
    try:
        lang = detect(answer)
        print(f"Detect language for answer:{lang}")
        if lang!="vi":
            translated = GoogleTranslator(source=lang, target="vi").translate(text)
            return translated
        return answer
    except Exception as e:
        print(f"Error translating text: {str(e)}")
        return answer