from pathlib import Path
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)


def extract_text(file_path: str, file_type: str) -> str:
    if file_type == "pdf":
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    elif file_type == "docx":
        from docx import Document
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)

    elif file_type == "txt":
        return Path(file_path).read_text(encoding="utf-8", errors="ignore")

    raise ValueError(f"Unsupported file type: {file_type}")


def chunk_text(text: str) -> list[str]:
    return splitter.split_text(text)


def get_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext == "pdf":
        return "pdf"
    if ext in ("docx", "doc"):
        return "docx"
    if ext in ("txt", "md"):
        return "txt"
    raise ValueError(f"Unsupported file extension: .{ext}")