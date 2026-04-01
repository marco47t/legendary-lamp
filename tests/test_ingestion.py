import pytest
import tempfile
import os
from services.ingestion import extract_text, chunk_text, get_file_type


def test_get_file_type_pdf():
    assert get_file_type("report.pdf") == "pdf"

def test_get_file_type_docx():
    assert get_file_type("doc.docx") == "docx"

def test_get_file_type_txt():
    assert get_file_type("notes.txt") == "txt"

def test_get_file_type_md():
    assert get_file_type("readme.md") == "txt"

def test_get_file_type_unsupported():
    with pytest.raises(ValueError):
        get_file_type("image.png")

def test_get_file_type_no_extension():
    with pytest.raises(ValueError):
        get_file_type("noext")


def test_extract_text_txt():
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w") as f:
        f.write("Hello world")
        path = f.name
    try:
        assert extract_text(path, "txt") == "Hello world"
    finally:
        os.unlink(path)


def test_chunk_text_splits_long_text():
    long_text = "word " * 500  # ~2500 chars, well over 600 chunk size
    chunks = chunk_text(long_text)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 700  # chunk_size + small overlap tolerance


def test_chunk_text_short_text():
    chunks = chunk_text("short")
    assert len(chunks) == 1
    assert chunks[0] == "short"


def test_chunk_text_empty():
    chunks = chunk_text("")
    assert chunks == []