from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.dependencies import get_current_active_user
from ...models.user import User
from ...schemas.user import UserProfile, UserUpdate, UserProgress, UserStats

router = APIRouter()


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return UserProfile.from_orm(current_user)


@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    # Check if username is being changed and if it's already taken
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserProfile.from_orm(current_user)


@router.get("/me/progress", response_model=UserProgress)
async def get_current_user_progress(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's progress"""
    return UserProgress.from_orm(current_user)


@router.post("/me/reset-progress")
async def reset_user_progress(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reset user's progress (for testing purposes)"""
    current_user.current_surah = 1
    current_user.current_verse = 1
    current_user.current_streak = 0
    current_user.longest_streak = 0
    current_user.total_verses_completed = 0
    current_user.last_completed_date = None
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Progress reset successfully"}


@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    db: Session = Depends(get_db)
):
    """Get overall user statistics"""
    total_users = db.query(User).count()
    active_users_today = db.query(User).filter(
        User.last_completed_date >= datetime.utcnow().date()
    ).count()
    
    # Calculate total verses completed and average streak
    users = db.query(User).all()
    total_verses = sum(user.total_verses_completed for user in users)
    average_streak = sum(user.current_streak for user in users) / total_users if total_users > 0 else 0
    
    return UserStats(
        total_users=total_users,
        active_users_today=active_users_today,
        total_verses_completed=total_verses,
        average_streak=round(average_streak, 2)
    )


@router.get("/search/{username}")
async def search_user_by_username(
    username: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search for a user by username"""
    user = db.query(User).filter(
        User.username == username,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot search for yourself"
        )
    
    return {
        "id": user.id,
        "username": user.username,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "total_verses_completed": user.total_verses_completed
    } 