from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import csv
import io
from datetime import datetime, date
import json

from app.models.job_application import JobApplication
from app.models.company import Company
from app.models.streak import Streak

class DataExportService:
    """Service for exporting user data in various formats"""
    
    @staticmethod
    def export_applications_csv(applications: List[JobApplication]) -> StreamingResponse:
        """Export job applications to CSV format"""
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'Title', 'Company', 'Location', 'Status', 'Applied Date',
            'Salary Range', 'Source URL', 'Source Platform', 'Notes'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for app in applications:
            writer.writerow([
                app.title or '',
                app.company.name if app.company else '',
                app.location or '',
                app.status or '',
                app.applied_date.strftime('%Y-%m-%d') if app.applied_date else '',
                app.salary_range or '',
                app.source_url or '',
                app.source_platform or '',
                app.notes or ''
            ])
        
        # Prepare response
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="job_applications_{datetime.now().strftime("%Y%m%d")}.csv"'
            }
        )
    
    @staticmethod
    def export_analytics_json(analytics_data: Dict[str, Any], user_email: str) -> StreamingResponse:
        """Export analytics data to JSON format"""
        
        export_data = {
            'export_date': datetime.now().isoformat(),
            'user_email': user_email,
            'analytics': analytics_data
        }
        
        json_str = json.dumps(export_data, indent=2, default=str)
        
        return StreamingResponse(
            io.BytesIO(json_str.encode('utf-8')),
            media_type='application/json',
            headers={
                'Content-Disposition': f'attachment; filename="analytics_{datetime.now().strftime("%Y%m%d")}.json"'
            }
        )
    
    @staticmethod
    def export_streaks_csv(streaks: List[Streak]) -> StreamingResponse:
        """Export streak data to CSV format"""
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = ['Date', 'Applications Count', 'Goal Met', 'Daily Goal']
        writer.writerow(headers)
        
        # Write data rows
        for streak in streaks:
            writer.writerow([
                streak.date.strftime('%Y-%m-%d'),
                streak.applications_count,
                'Yes' if streak.goal_met else 'No',
                streak.user.daily_goal if streak.user else ''
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="streaks_{datetime.now().strftime("%Y%m%d")}.csv"'
            }
        )
    
    @staticmethod
    def get_applications_for_export(db: Session, user_id: str, 
                                   start_date: date = None, end_date: date = None) -> List[JobApplication]:
        """Get applications for export with optional date filtering"""
        
        query = db.query(JobApplication).filter(JobApplication.user_id == user_id)
        
        if start_date:
            query = query.filter(JobApplication.applied_date >= start_date)
        if end_date:
            query = query.filter(JobApplication.applied_date <= end_date)
            
        return query.order_by(JobApplication.applied_date.desc()).all()
    
    @staticmethod
    def get_streaks_for_export(db: Session, user_id: str,
                              start_date: date = None, end_date: date = None) -> List[Streak]:
        """Get streaks for export with optional date filtering"""
        
        query = db.query(Streak).filter(Streak.user_id == user_id)
        
        if start_date:
            query = query.filter(Streak.date >= start_date)
        if end_date:
            query = query.filter(Streak.date <= end_date)
            
        return query.order_by(Streak.date.desc()).all()

# Create service instance
export_service = DataExportService()