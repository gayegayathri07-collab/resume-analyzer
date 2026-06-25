from pathlib import Path
import pypdf
from docx import Document


def extract_text(filepath: Path) -> str:
    ext = filepath.suffix.lower()
    if ext == ".pdf":
        return _extract_pdf(filepath)
    elif ext == ".docx":
        return _extract_docx(filepath)
    elif ext == ".txt":
        return _extract_txt(filepath)
    else:
        raise ValueError(f"Unsupported file: {filepath.name}")


def _extract_pdf(filepath: Path) -> str:
    text_parts: list[str] = []
    with open(filepath, "rb") as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_docx(filepath: Path) -> str:
    doc = Document(str(filepath))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_txt(filepath: Path) -> str:
    return filepath.read_text(encoding="utf-8", errors="replace")
