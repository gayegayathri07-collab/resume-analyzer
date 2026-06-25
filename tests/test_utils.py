import sys
sys.path.insert(0, ".")

from pathlib import Path
from app.utils.file_utils import validate_file, cleanup_file


def test_validate_file_pdf():
    class FakeFile:
        filename = "resume.pdf"
    ext = validate_file(FakeFile())
    assert ext == ".pdf"


def test_validate_file_docx():
    class FakeFile:
        filename = "resume.docx"
    ext = validate_file(FakeFile())
    assert ext == ".docx"


def test_validate_file_txt():
    class FakeFile:
        filename = "resume.txt"
    ext = validate_file(FakeFile())
    assert ext == ".txt"


def test_validate_file_invalid():
    class FakeFile:
        filename = "resume.exe"
    import pytest
    with pytest.raises(ValueError, match="Unsupported file type"):
        validate_file(FakeFile())


def test_cleanup_file_nonexistent():
    p = Path("nonexistent_file_12345.txt")
    cleanup_file(p)


def test_cleanup_file_exists(tmp_path):
    p = tmp_path / "test.txt"
    p.write_text("hello")
    assert p.exists()
    cleanup_file(p)
    assert not p.exists()
