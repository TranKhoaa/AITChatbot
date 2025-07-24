from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
)


def read_docx_file(file_path):
    doc = Document(file_path)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return "\n".join(fullText)


def chunk_text(text):
    split_text = RecursiveCharacterTextSplitter(chunk_size=256, chunk_overlap=64)
    chunks = split_text.split_text(text)
    return chunks


def vector_embedding_chunks(chunks, max_length=1024):
    embeddings = []
    for chunk in chunks:
        embeddings.append(np.array(model.encode(chunk)))
    return embeddings
