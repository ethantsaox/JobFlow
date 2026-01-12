from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from .company import CompanyResponse

class JobApplicationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    requirements: Optional[str] = None  
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    salary_text: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    location_type: Optional[str] = Field(None, max_length=50)  # on-site, remote, hybrid
    salary_info: Optional[str] = Field(None, max_length=255)  # raw salary text from job posting
    remote_ok: bool = False
    job_type: Optional[str] = Field(None, max_length=50)
    source_url: Optional[str] = Field(None, max_length=500)
    source_platform: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    company_name: str = Field(..., min_length=1, max_length=255)
    company_website: Optional[str] = Field(None, max_length=255)
    company_description: Optional[str] = None
    company_industry: Optional[str] = Field(None, max_length=255)
    company_size: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field("applied", max_length=50)

class JobApplicationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    salary_text: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    location_type: Optional[str] = Field(None, max_length=50)
    salary_info: Optional[str] = Field(None, max_length=255)
    remote_ok: Optional[bool] = None
    job_type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    source_url: Optional[str] = Field(None, max_length=500)
    source_platform: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None

class JobApplicationResponse(JobApplicationBase):
    id: UUID
    user_id: UUID
    company_id: UUID
    status: str
    applied_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class JobApplicationWithCompany(JobApplicationResponse):
    company: CompanyResponse