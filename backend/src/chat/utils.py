from src.shared.SentenceTransformer import model
from typing import List
import requests
import re
from ollama import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession
from src.chat_history.model import Chat_history
from langdetect import detect
from deep_translator import GoogleTranslator



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


def query_ollama(prompt: str, model_id: str) -> str:
    """Call the Ollama API with the given prompt. sync function"""
    payload = {
        "model": model_id,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.6, "max_tokens": 500},
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        answer = response.json().get("response", "No response from Ollama")

        if "qwen" in model_id:
            answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL)

        return answer.strip()
    except requests.RequestException as e:
        raise Exception(f"Ollama API request failed: {str(e)}")


async def chat_gen(prompt: str, session: AsyncSession, chat_id: str, model_id: str):
    message = {"role": "user", "content": prompt}
    end_think = False  # Set to True to start yielding content immediately
    answer = ""
    
    try:
        async for part in await AsyncClient().chat(
            model=model_id,
            options={"temperature": 0.6, "max_tokens": 500},
            messages=[message],
            stream=True,
        ):
            content = part["message"]["content"]
            
            # Skip <think> content
            if "</think>" in content:
                end_think = True
                continue
            if not end_think:
                continue
                
            yield content
            print(content, end="", flush=True)
            answer += content
            
            if part.get("done"):
                # Translate answer to Vietnamese if requested
                final_answer = translate_to_vietnam(answer)

                # Store answer in Chat_history using a new transaction
                try:
                    answer_entry = Chat_history(
                        content=final_answer,
                        source="bot",
                        chat_id=chat_id,
                        model=model_id,
                    )
                    session.add(answer_entry)
                    await session.commit()
                except Exception as e:
                    print(f"Error saving answer to database: {str(e)}")
                    await session.rollback()
    except Exception as e:
        print(f"Error in chat generation: {str(e)}")
        # Don't rollback here as it might affect the question that was already saved


def translate_to_vietnam(answer: str) -> str:
    # Translate text to Vietnamese
    try:
        lang = detect(answer)
        print(f"Detect language for answer:{lang}")
        if lang != "vi":
            translated = GoogleTranslator(source=lang, target="vi").translate(answer)
            return translated
        return answer
    except Exception as e:
        print(f"Error translating text: {str(e)}")
        return answer
