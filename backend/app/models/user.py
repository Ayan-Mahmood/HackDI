from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Profile settings
    daily_ayats = Column(Integer, default=3)
    learning_mode = Column(String, default="read")  # "read" or "memorize"
    preferred_language = Column(String, default="english")
    timezone = Column(String, default="UTC")
    
    # Progress tracking
    current_surah = Column(Integer, default=1)
    current_verse = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_verses_completed = Column(Integer, default=0)
    last_completed_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    friendships = relationship("Friendship", back_populates="user")
    friend_requests = relationship("Friendship", back_populates="friend")
    threads = relationship("Thread", back_populates="author")
    comments = relationship("Comment", back_populates="author")
    likes = relationship("Like", back_populates="user") 