from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.dependencies import get_current_active_user
from ...models.user import User
from ...schemas.quran import Verse, Surah, DailyLesson, ProgressUpdate
from ...services.quran_service import QuranService

router = APIRouter()
quran_service = QuranService()


@router.get("/surahs", response_model=List[Surah])
async def get_surah_list():
    """Get list of all surahs"""
    return quran_service.get_surah_list()


@router.get("/surahs/{surah_number}", response_model=dict)
async def get_surah_info(surah_number: int):
    """Get information about a specific surah"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Surah number must be between 1 and 114"
        )
    
    surah_info = await quran_service.get_surah_info(surah_number)
    if not surah_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Surah not found"
        )
    
    return surah_info


@router.get("/verses/{surah_number}/{verse_number}", response_model=Verse)
async def get_verse(surah_number: int, verse_number: int):
    """Get a specific verse"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Surah number must be between 1 and 114"
        )
    
    verse = await quran_service.get_verse(surah_number, verse_number)
    if not verse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verse not found"
        )
    
    return verse


@router.get("/daily-lesson", response_model=DailyLesson)
async def get_daily_lesson(
    current_user: User = Depends(get_current_active_user)
):
    """Get user's daily lesson"""
    return await quran_service.get_daily_lesson(current_user)


@router.post("/complete-lesson", response_model=ProgressUpdate)
async def complete_daily_lesson(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete the daily lesson and update progress"""
    # Get the daily lesson to know how many verses were completed
    daily_lesson = await quran_service.get_daily_lesson(current_user)
    verses_completed = len(daily_lesson.verses)
    
    # Calculate progress update
    progress_update = quran_service.calculate_progress_update(current_user, verses_completed)
    
    # Update user progress
    current_user.current_streak = progress_update.new_streak
    current_user.total_verses_completed = progress_update.new_total
    current_user.last_completed_date = datetime.utcnow()
    
    # Update longest streak if necessary
    if progress_update.new_streak > current_user.longest_streak:
        current_user.longest_streak = progress_update.new_streak
    
    # Update current position to next lesson
    current_user.current_surah = daily_lesson.next_surah
    current_user.current_verse = daily_lesson.next_verse
    
    db.commit()
    db.refresh(current_user)
    
    return progress_update


@router.get("/progress/surah/{surah_number}")
async def get_surah_progress(
    surah_number: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get progress information for a specific surah"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Surah number must be between 1 and 114"
        )
    
    # Find surah data
    surah_data = next((s for s in quran_service.surah_data if s["number"] == surah_number), None)
    if not surah_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Surah not found"
        )
    
    status = quran_service.get_surah_status(current_user, surah_number)
    progress = quran_service.get_surah_progress(current_user, surah_number, surah_data["numberOfAyahs"])
    
    return {
        "surah_number": surah_number,
        "surah_name": surah_data["name"],
        "english_name": surah_data["englishName"],
        "total_verses": surah_data["numberOfAyahs"],
        "status": status,
        "progress_percentage": progress
    }


@router.get("/roadmap")
async def get_quran_roadmap(
    current_user: User = Depends(get_current_active_user)
):
    """Get complete Quran roadmap with user progress"""
    surahs = quran_service.get_surah_list()
    roadmap = []
    
    for surah in surahs:
        status = quran_service.get_surah_status(current_user, surah.number)
        progress = quran_service.get_surah_progress(current_user, surah.number, surah.number_of_ayahs)
        
        roadmap.append({
            "number": surah.number,
            "name": surah.name,
            "english_name": surah.english_name,
            "number_of_ayahs": surah.number_of_ayahs,
            "status": status,
            "progress_percentage": progress
        })
    
    return {
        "user_progress": {
            "current_surah": current_user.current_surah,
            "current_verse": current_user.current_verse,
            "current_streak": current_user.current_streak,
            "longest_streak": current_user.longest_streak,
            "total_verses_completed": current_user.total_verses_completed
        },
        "surahs": roadmap
    } 