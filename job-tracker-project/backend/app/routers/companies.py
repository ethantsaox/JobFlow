from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.company import Company
from app.models.job_application import JobApplication
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyWithStats

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new company"""
    
    # Check if company already exists
    existing_company = db.query(Company).filter(Company.name == company_data.name).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this name already exists"
        )
    
    # Create new company
    db_company = Company(**company_data.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return CompanyResponse.model_validate(db_company)

@router.get("/", response_model=List[CompanyWithStats])
async def get_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get companies with application statistics for the current user"""
    
    # Build query with user's application counts
    query = db.query(
        Company,
        func.count(JobApplication.id).label('application_count')
    ).outerjoin(
        JobApplication,
        (JobApplication.company_id == Company.id) & 
        (JobApplication.user_id == current_user.id)
    ).group_by(Company.id)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                Company.name.ilike(f"%{search}%"),
                Company.description.ilike(f"%{search}%")
            )
        )
    
    if industry:
        query = query.filter(Company.industry == industry)
    
    if size:
        query = query.filter(Company.size == size)
    
    # Order by application count (companies user applied to first)
    companies = query.order_by(desc('application_count')).offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for company, app_count in companies:
        company_dict = CompanyResponse.model_validate(company).model_dump()
        company_dict['application_count'] = app_count
        result.append(CompanyWithStats(**company_dict))
    
    return result

@router.get("/search")
async def search_companies(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search companies by name for autocomplete"""
    
    companies = db.query(Company).filter(
        Company.name.ilike(f"%{q}%")
    ).order_by(Company.name).limit(limit).all()
    
    return [
        {
            "id": str(company.id),
            "name": company.name,
            "industry": company.industry,
            "size": company.size
        }
        for company in companies
    ]

@router.get("/{company_id}", response_model=CompanyWithStats)
async def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific company with user's application statistics"""
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Get application count for this user
    app_count = db.query(func.count(JobApplication.id)).filter(
        JobApplication.company_id == company_id,
        JobApplication.user_id == current_user.id
    ).scalar()
    
    company_dict = CompanyResponse.model_validate(company).model_dump()
    company_dict['application_count'] = app_count
    
    return CompanyWithStats(**company_dict)

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a company (admin-like functionality)"""
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update fields
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    
    return CompanyResponse.model_validate(company)

@router.get("/{company_id}/applications")
async def get_company_applications(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all applications for a specific company by the current user"""
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    applications = db.query(JobApplication).filter(
        JobApplication.company_id == company_id,
        JobApplication.user_id == current_user.id
    ).order_by(desc(JobApplication.applied_date)).all()
    
    return {
        "company": CompanyResponse.model_validate(company),
        "applications": [
            {
                "id": str(app.id),
                "title": app.title,
                "status": app.status,
                "applied_date": app.applied_date,
                "source_platform": app.source_platform
            }
            for app in applications
        ]
    }

@router.get("/stats/overview")
async def get_companies_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview statistics about companies the user has applied to"""
    
    # Total unique companies applied to
    total_companies = db.query(func.count(func.distinct(JobApplication.company_id))).filter(
        JobApplication.user_id == current_user.id
    ).scalar()
    
    # Company size distribution
    size_dist = db.query(
        Company.size,
        func.count(JobApplication.id).label('count')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(Company.size).all()
    
    # Industry distribution
    industry_dist = db.query(
        Company.industry,
        func.count(JobApplication.id).label('count')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(Company.industry).all()
    
    # Top companies by application count
    top_companies = db.query(
        Company.name,
        func.count(JobApplication.id).label('applications')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(Company.id, Company.name).order_by(desc('applications')).limit(10).all()
    
    return {
        "total_companies_applied": total_companies,
        "size_distribution": [
            {"size": size or "Unknown", "count": count}
            for size, count in size_dist
        ],
        "industry_distribution": [
            {"industry": industry or "Unknown", "count": count}
            for industry, count in industry_dist
        ],
        "top_companies": [
            {"name": name, "applications": applications}
            for name, applications in top_companies
        ]
    }