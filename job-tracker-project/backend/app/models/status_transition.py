from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class StatusTransition(Base):
    __tablename__ = "status_transitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    job_application_id = Column(UUID(as_uuid=True), ForeignKey("job_applications.id"), nullable=False, index=True)
    
    # Transition details
    from_status = Column(String, nullable=True)  # null for initial status
    to_status = Column(String, nullable=False)
    transition_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Additional context
    notes = Column(Text, nullable=True)
    trigger = Column(String, nullable=True)  # manual, automatic, system
    triggered_by = Column(String, nullable=True)  # user action, system event, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    job_application = relationship("JobApplication", back_populates="status_transitions")

    def __repr__(self):
        return f"<StatusTransition(id={self.id}, from={self.from_status}, to={self.to_status})>"

