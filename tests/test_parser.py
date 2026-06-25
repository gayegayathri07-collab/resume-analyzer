import sys
sys.path.insert(0, ".")

from pathlib import Path
from app.services.parser_service import extract_text, _extract_txt
import tempfile


def test_extract_txt():
    content = "Hello\nWorld\n"
    with tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False, encoding="utf-8") as f:
        f.write(content)
        path = Path(f.name)
    try:
        result = _extract_txt(path)
        assert result == "Hello\nWorld\n"
    finally:
        path.unlink(missing_ok=True)


def test_extract_text_unsupported():
    with tempfile.NamedTemporaryFile(suffix=".xyz", delete=False) as f:
        path = Path(f.name)
    try:
        import pytest
        with pytest.raises(ValueError, match="Unsupported file"):
            extract_text(path)
    finally:
        path.unlink(missing_ok=True)


def test_extract_text_txt():
    content = "Sample resume text"
    with tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False, encoding="utf-8") as f:
        f.write(content)
        path = Path(f.name)
    try:
        result = extract_text(path)
        assert result == content
    finally:
        path.unlink(missing_ok=True)
