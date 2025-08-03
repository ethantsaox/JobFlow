from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.company import Company
from app.schemas.job_application import (
    JobApplicationCreate, 
    JobApplicationUpdate, 
    JobApplicationResponse,
    JobApplicationWithCompany
)
from app.services.streak_service import streak_service
from app.services.achievement_service import achievement_service

router = APIRouter(prefix="/job-applications", tags=["Job Applications"])

@router.post("/", response_model=JobApplicationWithCompany, status_code=status.HTTP_201_CREATED)
async def create_job_application(
    application_data: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job application"""
    
    # Get or create company
    company = db.query(Company).filter(Company.name == application_data.company_name).first()
    if not company:
        company = Company(
            name=application_data.company_name,
            website=application_data.company_website,
            description=application_data.company_description
        )
        db.add(company)
        db.flush()  # Get the ID without committing
    
    # Create job application
    db_application = JobApplication(
        user_id=current_user.id,
        company_id=company.id,
        title=application_data.title,
        description=application_data.description,
        requirements=application_data.requirements,
        salary_min=application_data.salary_min,
        salary_max=application_data.salary_max,
        location=application_data.location,
        remote_ok=application_data.remote_ok,
        job_type=application_data.job_type,
        status=application_data.status or "applied",
        source_url=application_data.source_url,
        source_platform=application_data.source_platform,
        notes=application_data.notes
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    # Update daily streak
    await streak_service.update_daily_streak(current_user.id, db)
    
    # Check for newly unlocked achievements
    await achievement_service.initialize_user_achievements(current_user.id, db)
    newly_unlocked = await achievement_service.check_and_unlock_achievements(current_user.id, db)
    
    # Refresh the application to get the company relationship
    db.refresh(db_application)
    
    # Create response with gamification data
    response_data = JobApplicationWithCompany.model_validate(db_application).dict()
    response_data["gamification"] = {
        "newly_unlocked_achievements": newly_unlocked,
        "motivation_message": await streak_service.get_motivation_message(current_user.id, db)
    }
    
    return response_data

@router.get("/", response_model=List[JobApplicationWithCompany])
async def get_job_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    company_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("applied_date", regex="^(applied_date|title|company|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's job applications with filtering and sorting"""
    
    query = db.query(JobApplication).options(joinedload(JobApplication.company)).filter(
        JobApplication.user_id == current_user.id
    )
    
    # Apply filters
    if status:
        query = query.filter(JobApplication.status == status)
    
    if company_name:
        query = query.join(Company).filter(Company.name.ilike(f"%{company_name}%"))
    
    if search:
        query = query.filter(
            JobApplication.title.ilike(f"%{search}%") |
            JobApplication.description.ilike(f"%{search}%")
        )
    
    # Apply sorting
    if sort_by == "company":
        query = query.join(Company)
        order_field = Company.name
    else:
        order_field = getattr(JobApplication, sort_by)
    
    if sort_order == "desc":
        query = query.order_by(desc(order_field))
    else:
        query = query.order_by(order_field)
    
    applications = query.offset(skip).limit(limit).all()
    
    return [JobApplicationWithCompany.model_validate(app) for app in applications]

@router.get("/{application_id}", response_model=JobApplicationWithCompany)
async def get_job_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific job application"""
    
    application = db.query(JobApplication).options(joinedload(JobApplication.company)).filter(
        and_(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id
        )
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    return JobApplicationWithCompany.model_validate(application)

@router.put("/{application_id}", response_model=JobApplicationResponse)
async def update_job_application(
    application_id: str,
    application_data: JobApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a job application"""
    
    application = db.query(JobApplication).filter(
        and_(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id
        )
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    # Update fields
    update_data = application_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    return JobApplicationResponse.model_validate(application)

@router.patch("/{application_id}/status", response_model=JobApplicationResponse)
async def update_application_status(
    application_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update job application status"""
    
    valid_statuses = ["applied", "screening", "interview", "offer", "rejected", "withdrawn"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    application = db.query(JobApplication).filter(
        and_(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id
        )
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    application.status = status
    db.commit()
    db.refresh(application)
    
    return JobApplicationResponse.model_validate(application)

@router.delete("/{application_id}")
async def delete_job_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a job application"""
    
    application = db.query(JobApplication).filter(
        and_(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id
        )
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    db.delete(application)
    db.commit()
    
    return {"message": "Job application deleted successfully"}

async def update_user_streak(user_id: str, db: Session):
    """Update user's daily streak when a new application is added"""
    from app.models.streak import Streak
    
    today = date.today()
    
    # Get or create today's streak record
    streak = db.query(Streak).filter(
        and_(
            Streak.user_id == user_id,
            Streak.date == today
        )
    ).first()
    
    if not streak:
        streak = Streak(
            user_id=user_id,
            date=today,
            applications_count=0
        )
        db.add(streak)
    
    # Increment application count
    streak.applications_count += 1
    
    # Check if daily goal is met
    user = db.query(User).filter(User.id == user_id).first()
    if user and streak.applications_count >= user.daily_goal:
        streak.goal_met = True
    
    db.commit()