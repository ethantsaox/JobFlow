from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
import asyncio
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job_application import JobApplication
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

@router.post("/parse-job")
async def parse_job_description(
    job_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Parse job description and extract structured information using AI"""
    
    try:
        ai_service = AIService()
        
        # Parse the job description
        parsed_data = await ai_service.parse_job_description(
            title=job_data.get("title", ""),
            description=job_data.get("description", ""),
            company=job_data.get("company", "")
        )
        
        return {
            "success": True,
            "data": parsed_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse job description: {str(e)}"
        )

@router.post("/analyze-match/{application_id}")
async def analyze_job_match(
    application_id: str,
    user_skills: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Analyze how well a job matches the user's skills"""
    
    # Get the job application
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    try:
        ai_service = AIService()
        
        # Analyze the match
        match_analysis = await ai_service.analyze_job_match(
            job_title=application.title,
            job_description=application.description or "",
            job_requirements=application.requirements or "",
            user_skills=user_skills
        )
        
        # Update the application with AI analysis
        application.ai_match_score = match_analysis.get("score", 0)
        application.ai_skills_extracted = json.dumps(match_analysis.get("required_skills", []))
        application.ai_summary = match_analysis.get("summary", "")
        
        db.commit()
        
        return {
            "success": True,
            "data": match_analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze job match: {str(e)}"
        )

@router.post("/generate-insights")
async def generate_personalized_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate personalized insights based on user's application history"""
    
    try:
        # Get user's application history
        applications = db.query(JobApplication).filter(
            JobApplication.user_id == current_user.id
        ).limit(50).all()  # Limit to recent applications
        
        if len(applications) < 3:
            return {
                "success": True,
                "data": {
                    "insights": ["Apply to more jobs to get personalized insights!"],
                    "recommendations": ["Track at least 5 job applications to see patterns."]
                }
            }
        
        ai_service = AIService()
        
        # Prepare application data for analysis
        app_data = [
            {
                "title": app.title,
                "company": app.company.name if app.company else "Unknown",
                "status": app.status,
                "description": app.description or "",
                "applied_date": app.applied_date.isoformat()
            }
            for app in applications
        ]
        
        # Generate insights
        insights = await ai_service.generate_user_insights(
            applications=app_data,
            user_goals={
                "daily_goal": current_user.daily_goal,
                "weekly_goal": current_user.weekly_goal
            }
        )
        
        return {
            "success": True,
            "data": insights
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )

@router.get("/market-analysis")
async def get_market_analysis(
    role_type: str,
    location: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get market analysis for a specific role type"""
    
    try:
        ai_service = AIService()
        
        # Get market analysis
        market_data = await ai_service.get_market_analysis(
            role_type=role_type,
            location=location
        )
        
        return {
            "success": True,
            "data": market_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get market analysis: {str(e)}"
        )

@router.post("/improve-application")
async def get_application_suggestions(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get AI suggestions to improve a job application"""
    
    # Get the job application
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    try:
        ai_service = AIService()
        
        # Get improvement suggestions
        suggestions = await ai_service.get_application_improvements(
            job_title=application.title,
            job_description=application.description or "",
            current_status=application.status,
            notes=application.notes or ""
        )
        
        return {
            "success": True,
            "data": suggestions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application suggestions: {str(e)}"
        )

@router.post("/extract-skills")
async def extract_skills_from_description(
    job_description: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Extract skills and requirements from job description"""
    
    try:
        ai_service = AIService()
        
        skills_data = await ai_service.extract_skills_from_job(job_description)
        
        return {
            "success": True,
            "data": skills_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract skills: {str(e)}"
        )

@router.post("/salary-estimate")
async def estimate_salary_range(
    job_title: str,
    location: str,
    experience_level: str,
    company_size: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Estimate salary range for a job based on various factors"""
    
    try:
        ai_service = AIService()
        
        salary_data = await ai_service.estimate_salary(
            job_title=job_title,
            location=location,
            experience_level=experience_level,
            company_size=company_size
        )
        
        return {
            "success": True,
            "data": salary_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to estimate salary: {str(e)}"
        )

@router.post("/analyze-resume-fit")
async def analyze_resume_job_fit(
    application_id: str,
    resume_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Analyze how well a resume fits a specific job posting"""
    
    # Get the job application
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    try:
        ai_service = AIService()
        
        # Analyze resume fit
        analysis = await ai_service.analyze_resume_job_fit(
            resume_text=resume_text,
            job_description=application.description or ""
        )
        
        return {
            "success": True,
            "data": analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze resume fit: {str(e)}"
        )

@router.post("/job-recommendations")
async def generate_job_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate personalized job recommendations based on user profile and history"""
    
    try:
        # Get user's recent applications
        applications = db.query(JobApplication).filter(
            JobApplication.user_id == current_user.id
        ).limit(20).all()
        
        ai_service = AIService()
        
        # Prepare user profile
        user_profile = {
            "user_id": str(current_user.id),
            "goals": {
                "daily_goal": current_user.daily_goal,
                "weekly_goal": current_user.weekly_goal
            },
            "preferences": {
                # Add any user preferences here
            }
        }
        
        # Prepare application data
        app_data = [
            {
                "title": app.title,
                "company_name": app.company.name if app.company else "Unknown",
                "status": app.status,
                "description": app.description or "",
                "applied_date": app.applied_date.isoformat() if app.applied_date else None
            }
            for app in applications
        ]
        
        # Generate recommendations
        recommendations = await ai_service.generate_job_recommendations(
            user_profile=user_profile,
            recent_applications=app_data
        )
        
        return {
            "success": True,
            "data": recommendations
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate job recommendations: {str(e)}"
        )

@router.post("/optimize-application-content")
async def optimize_application_content(
    application_id: str,
    resume_text: str,
    cover_letter: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get AI-powered suggestions to optimize application content for a specific job"""
    
    # Get the job application
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    try:
        ai_service = AIService()
        
        # Optimize application content
        optimization = await ai_service.optimize_application_content(
            job_description=application.description or "",
            current_resume=resume_text,
            cover_letter=cover_letter
        )
        
        return {
            "success": True,
            "data": optimization
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize application content: {str(e)}"
        )

@router.post("/bulk-analyze")
async def bulk_analyze_applications(
    user_skills: List[str],
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Analyze multiple job applications for skill match and provide insights"""
    
    try:
        # Get user's recent applications
        applications = db.query(JobApplication).filter(
            JobApplication.user_id == current_user.id,
            JobApplication.status == "applied"  # Focus on active applications
        ).limit(limit).all()
        
        if not applications:
            return {
                "success": True,
                "data": {
                    "analyses": [],
                    "summary": "No applications found to analyze"
                }
            }
        
        ai_service = AIService()
        analyses = []
        
        # Analyze each application
        for app in applications:
            try:
                analysis = await ai_service.analyze_job_match(
                    job_title=app.title,
                    job_description=app.description or "",
                    job_requirements=app.requirements or "",
                    user_skills=user_skills
                )
                
                analyses.append({
                    "application_id": str(app.id),
                    "title": app.title,
                    "company": app.company.name if app.company else "Unknown",
                    "analysis": analysis
                })
                
                # Update the application with AI analysis
                app.ai_match_score = analysis.get("score", 0)
                app.ai_summary = analysis.get("summary", "")
                
            except Exception as e:
                print(f"Failed to analyze application {app.id}: {e}")
                continue
        
        db.commit()
        
        # Generate summary insights
        if analyses:
            avg_score = sum(a["analysis"]["score"] for a in analyses) / len(analyses)
            top_matches = sorted(analyses, key=lambda x: x["analysis"]["score"], reverse=True)[:3]
            
            summary = {
                "total_analyzed": len(analyses),
                "average_match_score": round(avg_score, 1),
                "top_matches": [
                    {
                        "title": match["title"],
                        "company": match["company"],
                        "score": match["analysis"]["score"]
                    }
                    for match in top_matches
                ],
                "overall_insights": [
                    f"Your applications have an average match score of {avg_score:.1f}%",
                    f"Your strongest match is {top_matches[0]['title']} at {top_matches[0]['company']}" if top_matches else "No strong matches found",
                    "Consider focusing on roles that better match your skillset"
                ]
            }
        else:
            summary = {"message": "No applications could be analyzed"}
        
        return {
            "success": True,
            "data": {
                "analyses": analyses,
                "summary": summary
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform bulk analysis: {str(e)}"
        )