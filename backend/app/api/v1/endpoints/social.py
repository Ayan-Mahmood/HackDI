from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ...core.database import get_db
from ...core.dependencies import get_current_active_user
from ...models.user import User
from ...models.social import Friendship, Thread, Comment, Like
from ...schemas.social import (
    Friendship as FriendshipSchema, FriendshipCreate, Thread as ThreadSchema,
    ThreadCreate, ThreadDetail, Comment as CommentSchema, CommentCreate,
    LeaderboardEntry
)

router = APIRouter()


# Friendship endpoints
@router.post("/friends/request", response_model=FriendshipSchema)
async def send_friend_request(
    friend_request: FriendshipCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a friend request"""
    if friend_request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only send friend requests on your own behalf"
        )
    
    # Check if friendship already exists
    existing_friendship = db.query(Friendship).filter(
        ((Friendship.user_id == friend_request.user_id) & 
         (Friendship.friend_id == friend_request.friend_id)) |
        ((Friendship.user_id == friend_request.friend_id) & 
         (Friendship.friend_id == friend_request.user_id))
    ).first()
    
    if existing_friendship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friendship request already exists"
        )
    
    # Check if trying to friend yourself
    if friend_request.user_id == friend_request.friend_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself"
        )
    
    # Check if friend exists
    friend = db.query(User).filter(User.id == friend_request.friend_id).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db_friendship = Friendship(**friend_request.dict())
    db.add(db_friendship)
    db.commit()
    db.refresh(db_friendship)
    
    return FriendshipSchema.from_orm(db_friendship)


@router.put("/friends/{friendship_id}/accept")
async def accept_friend_request(
    friendship_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Accept a friend request"""
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found"
        )
    
    friendship.status = "accepted"
    friendship.accepted_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Friend request accepted"}


@router.put("/friends/{friendship_id}/decline")
async def decline_friend_request(
    friendship_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Decline a friend request"""
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found"
        )
    
    friendship.status = "declined"
    db.commit()
    
    return {"message": "Friend request declined"}


@router.get("/friends", response_model=List[dict])
async def get_friends(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's friends"""
    friendships = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) | 
         (Friendship.friend_id == current_user.id)) &
        (Friendship.status == "accepted")
    ).all()
    
    friends = []
    for friendship in friendships:
        if friendship.user_id == current_user.id:
            friend = db.query(User).filter(User.id == friendship.friend_id).first()
        else:
            friend = db.query(User).filter(User.id == friendship.user_id).first()
        
        if friend:
            friends.append({
                "id": friend.id,
                "username": friend.username,
                "current_streak": friend.current_streak,
                "longest_streak": friend.longest_streak,
                "total_verses_completed": friend.total_verses_completed
            })
    
    return friends


# Thread endpoints
@router.post("/threads", response_model=ThreadSchema)
async def create_thread(
    thread_data: ThreadCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new thread"""
    db_thread = Thread(
        **thread_data.dict(),
        author_id=current_user.id
    )
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    
    # Add author username
    thread_dict = ThreadSchema.from_orm(db_thread).dict()
    thread_dict["author_username"] = current_user.username
    
    return ThreadSchema(**thread_dict)


@router.get("/threads", response_model=List[ThreadSchema])
async def get_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    thread_type: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get threads with pagination"""
    query = db.query(Thread).filter(Thread.is_active == True)
    
    if thread_type:
        query = query.filter(Thread.thread_type == thread_type)
    
    threads = query.order_by(desc(Thread.created_at)).offset(skip).limit(limit).all()
    
    # Add author usernames and counts
    result = []
    for thread in threads:
        author = db.query(User).filter(User.id == thread.author_id).first()
        likes_count = db.query(Like).filter(Like.thread_id == thread.id).count()
        comments_count = db.query(Comment).filter(Comment.thread_id == thread.id).count()
        
        thread_dict = ThreadSchema.from_orm(thread).dict()
        thread_dict["author_username"] = author.username if author else "Unknown"
        thread_dict["likes_count"] = likes_count
        thread_dict["comments_count"] = comments_count
        
        result.append(ThreadSchema(**thread_dict))
    
    return result


@router.get("/threads/{thread_id}", response_model=ThreadDetail)
async def get_thread_detail(
    thread_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed thread with comments"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_active == True
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Get author
    author = db.query(User).filter(User.id == thread.author_id).first()
    
    # Get comments
    comments = db.query(Comment).filter(
        Comment.thread_id == thread_id,
        Comment.is_active == True,
        Comment.parent_id == None  # Only top-level comments
    ).order_by(Comment.created_at).all()
    
    # Add author usernames to comments
    comment_list = []
    for comment in comments:
        comment_author = db.query(User).filter(User.id == comment.author_id).first()
        comment_dict = CommentSchema.from_orm(comment).dict()
        comment_dict["author_username"] = comment_author.username if comment_author else "Unknown"
        
        # Get replies
        replies = db.query(Comment).filter(
            Comment.parent_id == comment.id,
            Comment.is_active == True
        ).order_by(Comment.created_at).all()
        
        reply_list = []
        for reply in replies:
            reply_author = db.query(User).filter(User.id == reply.author_id).first()
            reply_dict = CommentSchema.from_orm(reply).dict()
            reply_dict["author_username"] = reply_author.username if reply_author else "Unknown"
            reply_list.append(CommentSchema(**reply_dict))
        
        comment_dict["replies"] = reply_list
        comment_list.append(CommentSchema(**comment_dict))
    
    # Check if user liked the thread
    is_liked = db.query(Like).filter(
        Like.thread_id == thread_id,
        Like.user_id == current_user.id
    ).first() is not None
    
    # Get counts
    likes_count = db.query(Like).filter(Like.thread_id == thread_id).count()
    comments_count = db.query(Comment).filter(Comment.thread_id == thread_id).count()
    
    thread_dict = ThreadDetail.from_orm(thread).dict()
    thread_dict["author_username"] = author.username if author else "Unknown"
    thread_dict["likes_count"] = likes_count
    thread_dict["comments_count"] = comments_count
    thread_dict["is_liked"] = is_liked
    thread_dict["comments"] = comment_list
    
    return ThreadDetail(**thread_dict)


@router.post("/threads/{thread_id}/like")
async def like_thread(
    thread_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Like or unlike a thread"""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    existing_like = db.query(Like).filter(
        Like.thread_id == thread_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        db.commit()
        return {"message": "Thread unliked"}
    else:
        # Like
        new_like = Like(thread_id=thread_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"message": "Thread liked"}


@router.post("/threads/{thread_id}/comments", response_model=CommentSchema)
async def add_comment(
    thread_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a comment to a thread"""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    db_comment = Comment(
        **comment_data.dict(),
        author_id=current_user.id,
        thread_id=thread_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    comment_dict = CommentSchema.from_orm(db_comment).dict()
    comment_dict["author_username"] = current_user.username
    
    return CommentSchema(**comment_dict)


# Leaderboard endpoint
@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get leaderboard by current streak"""
    users = db.query(User).filter(
        User.is_active == True
    ).order_by(
        desc(User.current_streak),
        desc(User.total_verses_completed)
    ).limit(limit).all()
    
    leaderboard = []
    for i, user in enumerate(users, 1):
        leaderboard.append(LeaderboardEntry(
            username=user.username,
            current_streak=user.current_streak,
            longest_streak=user.longest_streak,
            total_verses_completed=user.total_verses_completed,
            rank=i
        ))
    
    return leaderboard 