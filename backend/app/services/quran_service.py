import httpx
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.user import User
from ..schemas.quran import Verse, Surah, DailyLesson, ProgressUpdate
from ..utils.constants import SURAH_DATA


class QuranService:
    def __init__(self):
        self.base_url = settings.quran_api_base_url
        self.surah_data = SURAH_DATA

    async def get_verse(self, surah: int, verse: int) -> Optional[Verse]:
        """Fetch a single verse from the Quran API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/{surah}/{verse}.json")
                if response.status_code == 200:
                    data = response.json()
                    return Verse(
                        surah_no=surah,
                        ayah_no=verse,
                        arabic=data.get("arabic1", ""),
                        english=data.get("english", ""),
                        transliteration=data.get("transliteration")
                    )
        except Exception as e:
            print(f"Error fetching verse {surah}:{verse}: {e}")
        
        return None

    async def get_surah_info(self, surah: int) -> Optional[Dict[str, Any]]:
        """Fetch surah information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/{surah}.json")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error fetching surah {surah} info: {e}")
        
        return None

    def get_surah_list(self) -> List[Surah]:
        """Get the list of all surahs"""
        return [
            Surah(
                number=surah["number"],
                name=surah["name"],
                english_name=surah["englishName"],
                number_of_ayahs=surah["numberOfAyahs"],
                revelation_type=surah.get("revelationType", "Meccan")
            )
            for surah in self.surah_data
        ]

    async def get_daily_lesson(self, user: User) -> DailyLesson:
        """Generate daily lesson based on user progress"""
        verses = []
        current_surah = user.current_surah
        current_verse = user.current_verse
        daily_ayats = user.daily_ayats

        # Check if it's a new day
        from datetime import datetime, date
        today = date.today()
        last_completed = user.last_completed_date.date() if user.last_completed_date else None
        
        if last_completed and last_completed < today:
            # Advance to next position
            current_verse += 1
            
            # Check if we need to move to next surah
            surah_info = await self.get_surah_info(current_surah)
            if not surah_info or current_verse > surah_info.get("totalAyah", 1):
                current_surah += 1
                current_verse = 1

        # Fetch verses for daily lesson
        for i in range(daily_ayats):
            verse = await self.get_verse(current_surah, current_verse)
            if verse:
                verses.append(verse)
                current_verse += 1
            else:
                # Move to next surah if verse doesn't exist
                current_surah += 1
                current_verse = 1
                verse = await self.get_verse(current_surah, current_verse)
                if verse:
                    verses.append(verse)
                    current_verse += 1

        # Calculate next position
        next_surah = current_surah
        next_verse = current_verse

        return DailyLesson(
            verses=verses,
            total_verses=len(verses),
            current_surah=user.current_surah,
            current_verse=user.current_verse,
            next_surah=next_surah,
            next_verse=next_verse
        )

    def calculate_progress_update(self, user: User, verses_completed: int) -> ProgressUpdate:
        """Calculate progress update after completing verses"""
        from datetime import datetime, date
        
        today = date.today()
        last_completed = user.last_completed_date.date() if user.last_completed_date else None
        
        # Calculate new streak
        if last_completed and (today - last_completed).days == 1:
            new_streak = user.current_streak + 1
        elif last_completed and (today - last_completed).days == 0:
            new_streak = user.current_streak
        else:
            new_streak = 1

        new_total = user.total_verses_completed + verses_completed
        
        # Check for achievements
        achievement = None
        if new_streak == 7:
            achievement = "Week Warrior"
        elif new_streak == 30:
            achievement = "Month Master"
        elif new_streak == 100:
            achievement = "Century Champion"
        elif new_total == 100:
            achievement = "Hundred Verses"
        elif new_total == 1000:
            achievement = "Thousand Verses"

        return ProgressUpdate(
            verses_completed=verses_completed,
            new_streak=new_streak,
            new_total=new_total,
            achievement=achievement
        )

    def get_surah_status(self, user: User, surah_number: int) -> str:
        """Get the status of a surah for a user"""
        if surah_number < user.current_surah:
            return "completed"
        elif surah_number == user.current_surah:
            return "current"
        else:
            return "available"

    def get_surah_progress(self, user: User, surah_number: int, total_verses: int) -> int:
        """Calculate progress percentage for a surah"""
        if surah_number < user.current_surah:
            return 100
        elif surah_number == user.current_surah:
            progress = ((user.current_verse - 1) / total_verses) * 100
            return min(int(progress), 100)
        else:
            return 0 