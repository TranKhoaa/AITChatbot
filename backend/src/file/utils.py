import json
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
import pandas as pd
import numpy as np


model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
)


def read_docx_file(file_path):
    """
    Reads docx file 
    """
    doc = Document(file_path)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return "\n".join(fullText)


def read_pdf_file(file_path):
    """
    Reads pdf file 
    """
    doc = PdfReader(file_path)
    fullText = []
    for page in doc.pages:
        page_text = page.extract_text()
        if page_text:
            fullText.append(page_text)
    return '\n'.join(fullText)

def read_excel_file(file_path):
    """
    Reads an Excel file 
    """
    xls = pd.ExcelFile(file_path)
    all_rows = []
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name).fillna("")
        for _, row in df.iterrows():
            row_json = json.dumps(row.to_dict(), ensure_ascii=False)
            all_rows.append(row_json)
    return all_rows 

def chunk_text(text):
    split_text = RecursiveCharacterTextSplitter(chunk_size=256, chunk_overlap=64)
    chunks = split_text.split_text(text)
    return chunks


def vector_embedding_chunks(chunks, max_length=1024):
    embeddings = []
    for chunk in chunks:
        embeddings.append(np.array(model.encode(chunk)))
    return embeddings
