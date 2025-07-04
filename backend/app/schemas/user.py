from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    daily_ayats: int = Field(default=3, ge=1, le=10)
    learning_mode: str = Field(default="read", regex="^(read|memorize)$")
    preferred_language: str = Field(default="english", regex="^(english|arabic|urdu)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    daily_ayats: Optional[int] = Field(None, ge=1, le=10)
    learning_mode: Optional[str] = Field(None, regex="^(read|memorize)$")
    preferred_language: Optional[str] = Field(None, regex="^(english|arabic|urdu)$")


class UserInDB(UserBase):
    id: int
    current_surah: int = 1
    current_verse: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    total_verses_completed: int = 0
    last_completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    current_streak: int
    longest_streak: int
    total_verses_completed: int
    daily_ayats: int
    learning_mode: str
    preferred_language: str
    last_completed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserProgress(BaseModel):
    current_surah: int
    current_verse: int
    current_streak: int
    longest_streak: int
    total_verses_completed: int
    last_completed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    total_users: int
    active_users_today: int
    total_verses_completed: int
    average_streak: float 