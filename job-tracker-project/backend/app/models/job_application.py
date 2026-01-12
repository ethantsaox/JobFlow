from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    
    # Job details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    salary_min = Column(Numeric(10, 2), nullable=True)
    salary_max = Column(Numeric(10, 2), nullable=True)
    salary_text = Column(String, nullable=True)
    location = Column(String, nullable=True)
    location_type = Column(String, nullable=True)  # on-site, remote, hybrid
    salary_info = Column(String, nullable=True)  # raw salary text from job posting (e.g., "$25/hr - $30/hr")
    remote_ok = Column(Boolean, default=False, nullable=False)
    job_type = Column(String, nullable=True)  # full-time, part-time, contract, internship, etc.
    
    # Application tracking
    status = Column(String, default="applied", nullable=False)  # applied, screening, interview, offer, rejected, withdrawn
    applied_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_url = Column(String, nullable=True)
    source_platform = Column(String, nullable=True)  # linkedin, indeed, glassdoor, etc.
    notes = Column(Text, nullable=True)
    
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="job_applications")
    company = relationship("Company", back_populates="job_applications")
    status_transitions = relationship("StatusTransition", back_populates="job_application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<JobApplication(id={self.id}, title={self.title}, company={self.company.name if self.company else 'Unknown'})>"