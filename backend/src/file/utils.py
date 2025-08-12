import json
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.shared.SentenceTransformer import model
from PyPDF2 import PdfReader
import pandas as pd
import numpy as np


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
    return "\n".join(fullText)


def read_excel_file(file_path, chunk_size=256, chunk_overlap=64):
    """
    Reads an Excel file and splits each row into chunks directly.
    This preserves row boundaries and avoids loading one huge string in memory.
    """
    try:
        print(f"Starting to read Excel file: {file_path}")
        
        # Load all sheets at once
        all_sheets_dict = pd.read_excel(file_path, sheet_name=None, dtype=str)
        all_sheets = list(all_sheets_dict.values())
        
        print(f"Found {len(all_sheets)} sheets in Excel file")
        
        if not all_sheets:
            print("No sheets found in Excel file")
            return []
        
        df = pd.concat(all_sheets, ignore_index=True).fillna("")
        print(f"Combined dataframe has {len(df)} rows and {len(df.columns)} columns")
        
        # Check if dataframe is empty or has no meaningful content
        if df.empty:
            print("Excel file appears to be empty")
            return []
            
        # Remove completely empty rows
        df = df.dropna(how='all')
        if df.empty:
            print("Excel file has no meaningful content after removing empty rows")
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        chunks = []
        for row in df.to_dict(orient="records"):
            # Skip rows that are completely empty after converting to string
            row_values = [str(v) for v in row.values() if str(v).strip() and str(v).strip().lower() != 'nan']
            if not row_values:
                continue
                
            row_text = json.dumps(row, ensure_ascii=False)
            row_chunks = splitter.split_text(row_text)
            chunks.extend(row_chunks)

        print(f"Generated {len(chunks)} chunks from Excel file")
        return chunks
    
    except Exception as e:
        print(f"Error reading Excel file {file_path}: {str(e)}")
        return []



def read_txt_file(file_path):
    """
    Reads txt file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                return file.read()
        except Exception:
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()


def chunk_text(text):
    split_text = RecursiveCharacterTextSplitter(chunk_size=256, chunk_overlap=64)
    chunks = split_text.split_text(text)
    return chunks


def vector_embedding_chunks(chunks, max_length=1024):
    embeddings = []
    for chunk in chunks:
        embeddings.append(np.array(model.encode(chunk)))
    return embeddings
