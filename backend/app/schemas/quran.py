from typing import List, Optional
from pydantic import BaseModel, Field


class Verse(BaseModel):
    surah_no: int = Field(..., ge=1, le=114)
    ayah_no: int = Field(..., ge=1)
    arabic: str
    english: str
    transliteration: Optional[str] = None


class Surah(BaseModel):
    number: int = Field(..., ge=1, le=114)
    name: str
    english_name: str
    number_of_ayahs: int
    revelation_type: str = "Meccan"  # or "Medinan"


class DailyLesson(BaseModel):
    verses: List[Verse]
    total_verses: int
    current_surah: int
    current_verse: int
    next_surah: int
    next_verse: int


class ProgressUpdate(BaseModel):
    verses_completed: int
    new_streak: int
    new_total: int
    achievement: Optional[str] = None


class AyahShare(BaseModel):
    surah_number: int
    surah_name: str
    verse_number: int
    arabic_text: str
    translation: str
    comment: Optional[str] = None 