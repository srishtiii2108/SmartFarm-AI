import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List
from pypdf import PdfReader


def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def extract_text_from_bytes(filename: str, raw_bytes: bytes) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        import io
        reader = PdfReader(io.BytesIO(raw_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    return raw_bytes.decode("utf-8", errors="ignore")


def extract_text_from_file(file_path: Path) -> str:
    return extract_text_from_bytes(file_path.name, file_path.read_bytes())


def clean_text(raw_text: str) -> str:
    # Normalize line endings and collapse excessive blank lines/spaces
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_document_text(
    text: str,
    chunk_size: int = 900,
    chunk_overlap: int = 150,
) -> List[Dict[str, Any]]:
    """
    Section-aware overlapping text splitter that preserves Markdown/section headings
    in chunk metadata for accurate source attribution.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    chunks: List[Dict[str, Any]] = []
    current_section = "General Overview"
    buffer = ""
    chunk_idx = 0

    for para in paragraphs:
        # Track Markdown headings as section context
        if para.startswith("#"):
            heading_line = para.splitlines()[0].lstrip("#").strip()
            if heading_line:
                current_section = heading_line

        candidate = f"{buffer}\n\n{para}".strip() if buffer else para
        if len(candidate) <= chunk_size:
            buffer = candidate
        else:
            if buffer:
                chunks.append(
                    {
                        "chunk_index": chunk_idx,
                        "content": buffer,
                        "metadata": {"section": current_section},
                    }
                )
                chunk_idx += 1
                overlap_tail = buffer[-chunk_overlap:] if chunk_overlap > 0 else ""
                buffer = f"{overlap_tail}\n\n{para}".strip()
            else:
                # Single paragraph exceeds chunk_size; slice with overlap
                start = 0
                step = max(chunk_size - chunk_overlap, 100)
                while start < len(para):
                    piece = para[start : start + chunk_size].strip()
                    if piece:
                        chunks.append(
                            {
                                "chunk_index": chunk_idx,
                                "content": piece,
                                "metadata": {"section": current_section},
                            }
                        )
                        chunk_idx += 1
                    start += step
                buffer = ""

    if buffer:
        chunks.append(
            {
                "chunk_index": chunk_idx,
                "content": buffer,
                "metadata": {"section": current_section},
            }
        )

    return chunks