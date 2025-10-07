"""
Arabic text processing utilities for The Islamic Guidance Station
"""

import re

try:
    import pyarabic.araby as araby

    PYARABIC_AVAILABLE = True
except ImportError:
    PYARABIC_AVAILABLE = False


def remove_diacritics(text: str) -> str:
    """
    Remove Arabic diacritics (tashkeel) from text

    Args:
        text: Arabic text with diacritics

    Returns:
        Arabic text without diacritics
    """
    if not text or not isinstance(text, str):
        return ""

    if PYARABIC_AVAILABLE:
        return araby.normalize_harakat(text)
    else:
        # Fallback: remove common diacritics manually
        diacritics = r"[\u064B-\u0652\u0670\u0640]"  # Arabic diacritic range
        return re.sub(diacritics, "", text)


def normalize_arabic_search(text: str) -> str:
    """
    Normalize Arabic text for search purposes

    Args:
        text: Arabic text to normalize

    Returns:
        Normalized Arabic text suitable for search
    """
    if not text or not isinstance(text, str):
        return ""

    # Remove diacritics
    text = remove_diacritics(text)

    if PYARABIC_AVAILABLE:
        # Normalize alef variants
        text = araby.normalize_alef(text)
        # Normalize teh marbuta
        text = araby.normalize_teh(text)
    else:
        # Fallback normalizations
        # Normalize alef variants
        text = re.sub(r"[أإآ]", "ا", text)
        # Normalize teh marbuta to heh
        text = re.sub(r"ة", "ه", text)
        # Normalize yeh variants
        text = re.sub(r"[يى]", "ي", text)

    # Remove extra whitespace and normalize
    text = re.sub(r"\s+", " ", text.strip())

    return text


def normalize_arabic_for_display(text: str) -> str:
    """
    Normalize Arabic text for display while preserving some diacritics

    Args:
        text: Arabic text to normalize

    Returns:
        Normalized Arabic text for display
    """
    if not text or not isinstance(text, str):
        return ""

    if PYARABIC_AVAILABLE:
        # Only normalize certain characters for display
        text = araby.normalize_alef(text)
        text = araby.normalize_teh(text)
    else:
        # Fallback normalizations
        text = re.sub(r"[أإآ]", "ا", text)
        text = re.sub(r"ة", "ه", text)

    return text.strip()


def is_arabic_text(text: str) -> bool:
    """
    Check if text contains Arabic characters

    Args:
        text: Text to check

    Returns:
        True if text contains Arabic characters
    """
    if not text or not isinstance(text, str):
        return False

    # Check for Arabic characters
    arabic_pattern = r"[\u0600-\u06FF]"
    return bool(re.search(arabic_pattern, text))


def extract_arabic_words(text: str) -> list[str]:
    """
    Extract Arabic words from text

    Args:
        text: Text containing Arabic words

    Returns:
        List of Arabic words
    """
    if not text or not isinstance(text, str):
        return []

    # Arabic word pattern (includes connected characters)
    arabic_word_pattern = (
        r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+"
    )
    return re.findall(arabic_word_pattern, text)


def clean_search_query(query: str) -> str:
    """
    Clean and normalize search query

    Args:
        query: Search query to clean

    Returns:
        Cleaned and normalized query
    """
    if not query or not isinstance(query, str):
        return ""

    # Remove HTML tags and special characters
    query = re.sub(r"<[^>]+>", "", query)
    query = re.sub(r"[^\w\s\u0600-\u06FF]", " ", query)

    # Normalize Arabic text
    if is_arabic_text(query):
        query = normalize_arabic_search(query)
    else:
        # Clean English text
        query = re.sub(r"[^\w\s]", " ", query.lower())

    # Remove extra whitespace
    query = re.sub(r"\s+", " ", query.strip())

    return query


def create_search_variants(text: str) -> list[str]:
    """
    Create multiple search variants for better matching

    Args:
        text: Original text

    Returns:
        List of search variants
    """
    if not text or not isinstance(text, str):
        return []

    variants = [text]

    if is_arabic_text(text):
        # Add normalized version
        normalized = normalize_arabic_search(text)
        if normalized != text:
            variants.append(normalized)

        # Add version without diacritics
        without_diacritics = remove_diacritics(text)
        if without_diacritics != text:
            variants.append(without_diacritics)

    return list(set(variants))  # Remove duplicates


def get_text_statistics(text: str) -> dict:
    """
    Get statistics about Arabic text

    Args:
        text: Arabic text to analyze

    Returns:
        Dictionary with text statistics
    """
    if not text or not isinstance(text, str):
        return {"length": 0, "words": 0, "is_arabic": False, "has_diacritics": False}

    is_arabic = is_arabic_text(text)
    words = extract_arabic_words(text) if is_arabic else text.split()
    has_diacritics = (
        PYARABIC_AVAILABLE and araby.is_harakat(text) if is_arabic else False
    )

    return {
        "length": len(text),
        "words": len(words),
        "is_arabic": is_arabic,
        "has_diacritics": has_diacritics,
    }


# Utility function to check if PyArabic is available
def is_pyarabic_available() -> bool:
    """Check if PyArabic library is available"""
    return PYARABIC_AVAILABLE


# Warning function for missing dependency
def warn_pyarabic_not_available():
    """Log warning when PyArabic is not available"""
    import logging

    logger = logging.getLogger(__name__)
    logger.warning(
        "PyArabic library not available. "
        "Arabic text processing will use fallback implementations. "
        "Install with: pip install pyarabic>=0.6.15"
    )
