from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FriendshipBase(BaseModel):
    user_id: int
    friend_id: int
    status: str = Field(default="pending", regex="^(pending|accepted|declined)$")


class FriendshipCreate(FriendshipBase):
    pass


class Friendship(FriendshipBase):
    id: int
    created_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ThreadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    thread_type: str = Field(default="discussion", regex="^(discussion|ayah-share)$")


class ThreadCreate(ThreadBase):
    ayah_surah: Optional[int] = None
    ayah_verse: Optional[int] = None
    ayah_arabic: Optional[str] = None
    ayah_translation: Optional[str] = None


class Thread(ThreadBase):
    id: int
    author_id: int
    ayah_surah: Optional[int] = None
    ayah_verse: Optional[int] = None
    ayah_arabic: Optional[str] = None
    ayah_translation: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True
    likes_count: int = 0
    comments_count: int = 0
    author_username: str

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None


class CommentCreate(CommentBase):
    pass


class Comment(CommentBase):
    id: int
    author_id: int
    thread_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True
    author_username: str
    replies: List["Comment"] = []

    class Config:
        from_attributes = True


class Like(BaseModel):
    id: int
    user_id: int
    thread_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ThreadDetail(Thread):
    comments: List[Comment] = []
    is_liked: bool = False


class LeaderboardEntry(BaseModel):
    username: str
    current_streak: int
    longest_streak: int
    total_verses_completed: int
    rank: int 