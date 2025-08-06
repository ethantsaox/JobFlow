from typing import Dict, List, Any, Optional
import json
import re
import os
import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    """AI Service for job analysis using OpenAI GPT"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "")
        )
        self.model = "gpt-4o-mini"  # Using more cost-effective model
        self.use_mock = not os.getenv("OPENAI_API_KEY")  # Fallback to mock if no API key
        
    async def parse_job_description(self, title: str, description: str, company: str) -> Dict[str, Any]:
        """Parse job description and extract structured information"""
        
        if self.use_mock:
            return await self._mock_parse_job_description(title, description, company)
        
        try:
            prompt = f"""
            Analyze this job posting and extract structured information. Return only valid JSON.

            Job Title: {title}
            Company: {company}
            Job Description: {description}

            Extract the following information as JSON:
            {{
                "required_skills": ["skill1", "skill2"],
                "preferred_skills": ["skill1", "skill2"],
                "experience_level": "entry|mid|senior|lead",
                "job_type": "full-time|part-time|contract|internship",
                "remote_ok": true|false,
                "salary_range": "extracted salary or null",
                "key_responsibilities": ["responsibility1", "responsibility2"],
                "company_benefits": ["benefit1", "benefit2"],
                "education_requirements": "degree requirement or null",
                "industry": "industry name",
                "work_environment": "remote|hybrid|onsite|flexible"
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a job analysis expert. Extract structured information from job postings and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI parsing failed, using fallback: {e}")
            return await self._mock_parse_job_description(title, description, company)
    
    async def analyze_job_match(self, job_title: str, job_description: str, 
                              job_requirements: str, user_skills: List[str]) -> Dict[str, Any]:
        """Analyze how well a job matches user's skills"""
        
        if self.use_mock:
            return await self._mock_analyze_job_match(job_title, job_description, job_requirements, user_skills)
        
        try:
            user_skills_str = ", ".join(user_skills)
            
            prompt = f"""
            Analyze how well this candidate matches this job posting. Return only valid JSON.

            Job Title: {job_title}
            Job Description: {job_description}
            Job Requirements: {job_requirements}
            Candidate Skills: {user_skills_str}

            Provide analysis as JSON:
            {{
                "score": 85,
                "required_skills": ["skill1", "skill2"],
                "matching_skills": ["skill1"],
                "missing_skills": ["skill2"],
                "skill_gaps": ["specific gap analysis"],
                "strengths": ["candidate strengths for this role"],
                "summary": "detailed match analysis",
                "recommendations": ["specific actionable advice"],
                "interview_prep_tips": ["tips for this specific role"],
                "application_focus": ["what to emphasize in application"]
            }}

            Score should be 0-100 based on skill match, experience alignment, and role fit.
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career coach and technical recruiter. Analyze job-candidate fit objectively."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1200
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI job match analysis failed, using fallback: {e}")
            return await self._mock_analyze_job_match(job_title, job_description, job_requirements, user_skills)
    
    async def generate_user_insights(self, applications: List[Dict[str, Any]], 
                                   user_goals: Dict[str, int]) -> Dict[str, Any]:
        """Generate personalized insights based on application history"""
        
        if self.use_mock:
            return await self._mock_generate_user_insights(applications, user_goals)
        
        try:
            apps_summary = self._summarize_applications(applications)
            
            prompt = f"""
            Analyze this job seeker's application history and provide personalized insights. Return only valid JSON.

            Application Summary: {apps_summary}
            User Goals: {user_goals}

            Provide analysis as JSON:
            {{
                "insights": ["key insight 1", "key insight 2"],
                "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
                "success_patterns": ["pattern 1", "pattern 2"],
                "improvement_areas": ["area 1", "area 2"],
                "goal_assessment": "assessment of their goal achievability",
                "next_steps": ["step 1", "step 2"],
                "market_positioning": "how they're positioned in job market",
                "application_strategy": "strategic advice for future applications",
                "skill_development": ["skill to develop 1", "skill to develop 2"],
                "networking_advice": "specific networking recommendations"
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an experienced career coach. Provide personalized, actionable career advice based on job application data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1500
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI user insights failed, using fallback: {e}")
            return await self._mock_generate_user_insights(applications, user_goals)
    
    async def get_market_analysis(self, role_type: str, location: Optional[str] = None) -> Dict[str, Any]:
        """Get market analysis for a specific role"""
        
        return {
            "demand_level": "high",
            "salary_range": "Varies by experience and location",
            "growth_outlook": "Positive growth expected",
            "key_skills": ["Communication", "Problem-solving", "Technical skills"],
            "hiring_trends": ["Remote work acceptance", "Skills-based hiring"],
            "competition_level": "medium",
            "best_companies": ["Tech startups", "Fortune 500 companies"],
            "market_insights": [
                "Market is competitive but opportunities exist",
                "Remote positions are increasingly common",
                "Soft skills are highly valued"
            ],
            "application_tips": [
                "Tailor your resume for each position",
                "Build a strong online presence",
                "Network within the industry",
                "Prepare for technical interviews"
            ]
        }
    
    async def get_application_improvements(self, job_title: str, job_description: str, 
                                         current_status: str, notes: str) -> Dict[str, Any]:
        """Get suggestions to improve job application approach"""
        
        return {
            "status_specific_tips": [
                f"For {current_status} status: Be patient and prepare for next steps",
                "Continue applying to similar positions"
            ],
            "follow_up_suggestions": [
                "Follow up after 1-2 weeks if no response",
                "Connect with hiring manager on LinkedIn"
            ],
            "preparation_tips": [
                "Research the company culture and values",
                "Prepare specific examples of your achievements"
            ],
            "common_mistakes": [
                "Generic applications",
                "Not following up",
                "Incomplete LinkedIn profile"
            ],
            "success_strategies": [
                "Network within the company",
                "Get referrals when possible",
                "Show genuine interest in the role"
            ],
            "networking_tips": [
                "Attend industry events",
                "Join professional groups",
                "Engage with company content on social media"
            ],
            "next_actions": [
                "Update your resume",
                "Practice your elevator pitch",
                "Follow up on this application"
            ]
        }
    
    async def extract_skills_from_job(self, job_description: str) -> Dict[str, Any]:
        """Extract skills and requirements from job description"""
        
        skills = self._extract_skills_from_text(job_description)
        
        return {
            "technical_skills": [s for s in skills if self._is_technical_skill(s)],
            "soft_skills": [s for s in skills if not self._is_technical_skill(s)],
            "tools_technologies": [],
            "certifications": [],
            "experience_requirements": self._extract_experience(job_description),
            "education_requirements": self._extract_education(job_description),
            "skill_categories": {
                "technical": [s for s in skills if self._is_technical_skill(s)],
                "soft": [s for s in skills if not self._is_technical_skill(s)]
            }
        }
    
    async def estimate_salary(self, job_title: str, location: str, 
                            experience_level: str, company_size: Optional[str] = None) -> Dict[str, Any]:
        """Estimate salary range based on job parameters"""
        
        # Simple salary estimation logic
        base_salary = 70000
        if "senior" in experience_level.lower():
            base_salary = 100000
        elif "lead" in experience_level.lower():
            base_salary = 120000
        
        return {
            "salary_range": {"min": int(base_salary * 0.8), "max": int(base_salary * 1.3)},
            "median_salary": base_salary,
            "factors_affecting_salary": [
                "Years of experience",
                "Location",
                "Company size",
                "Industry demand"
            ],
            "benefits_to_expect": [
                "Health insurance",
                "401k matching",
                "Paid time off",
                "Professional development"
            ],
            "negotiation_tips": [
                "Research market rates thoroughly",
                "Highlight your unique value",
                "Consider total compensation package",
                "Be prepared to justify your ask"
            ],
            "market_comparison": "Competitive with market rates",
            "growth_potential": "Good career advancement opportunities"
        }

    async def analyze_resume_job_fit(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze how well a resume fits a specific job"""
        
        if self.use_mock:
            return await self._mock_analyze_resume_job_fit(resume_text, job_description)
        
        try:
            prompt = f"""
            Analyze how well this resume matches the job requirements. Return only valid JSON.

            Resume Content: {resume_text[:2000]}...
            Job Description: {job_description[:1500]}...

            Provide detailed analysis as JSON:
            {{
                "overall_match_score": 75,
                "strengths": ["what makes this candidate strong for this role"],
                "weaknesses": ["areas where candidate may not meet requirements"],
                "missing_keywords": ["important keywords missing from resume"],
                "resume_improvements": ["specific suggestions to improve resume for this job"],
                "experience_alignment": "how candidate's experience aligns with job",
                "skill_match_breakdown": {{
                    "technical_skills": {{"matched": ["skill1"], "missing": ["skill2"]}},
                    "soft_skills": {{"matched": ["skill1"], "missing": ["skill2"]}}
                }},
                "ats_optimization": ["suggestions to improve ATS compatibility"],
                "cover_letter_focus": ["key points to emphasize in cover letter"]
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert resume reviewer and ATS specialist. Provide detailed, actionable feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI resume analysis failed, using fallback: {e}")
            return await self._mock_analyze_resume_job_fit(resume_text, job_description)

    async def generate_job_recommendations(self, user_profile: Dict[str, Any], 
                                         recent_applications: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate personalized job recommendations"""
        
        if self.use_mock:
            return await self._mock_generate_job_recommendations(user_profile, recent_applications)
        
        try:
            profile_summary = json.dumps(user_profile, indent=2)
            apps_summary = self._summarize_applications(recent_applications)
            
            prompt = f"""
            Generate personalized job recommendations for this candidate. Return only valid JSON.

            User Profile: {profile_summary}
            Recent Applications: {apps_summary}

            Provide recommendations as JSON:
            {{
                "recommended_roles": [
                    {{
                        "title": "Software Engineer",
                        "reasoning": "why this role fits",
                        "growth_potential": "career growth explanation",
                        "skill_alignment": "how their skills match"
                    }}
                ],
                "recommended_companies": [
                    {{
                        "type": "startup|midsize|enterprise",
                        "reasoning": "why this company type fits",
                        "examples": ["Company1", "Company2"]
                    }}
                ],
                "skill_development_plan": [
                    {{
                        "skill": "Python",
                        "priority": "high|medium|low",
                        "learning_path": "how to develop this skill",
                        "timeline": "estimated time to proficiency"
                    }}
                ],
                "market_opportunities": ["emerging opportunities in their field"],
                "application_strategy": "strategic advice for job searching",
                "networking_targets": ["specific people/roles to network with"],
                "portfolio_projects": ["project ideas to strengthen their profile"]
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career strategist and industry expert. Provide personalized, market-aware career guidance."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=2000
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI job recommendations failed, using fallback: {e}")
            return await self._mock_generate_job_recommendations(user_profile, recent_applications)

    async def optimize_application_content(self, job_description: str, current_resume: str, 
                                         cover_letter: str = "") -> Dict[str, Any]:
        """Optimize application content for a specific job"""
        
        if self.use_mock:
            return await self._mock_optimize_application_content(job_description, current_resume, cover_letter)
        
        try:
            prompt = f"""
            Optimize this application content for the specific job. Return only valid JSON.

            Job Description: {job_description[:1500]}...
            Current Resume: {current_resume[:1500]}...
            Cover Letter: {cover_letter[:1000] if cover_letter else "Not provided"}

            Provide optimization suggestions as JSON:
            {{
                "resume_optimizations": [
                    {{
                        "section": "summary|experience|skills",
                        "current": "current text",
                        "optimized": "optimized text",
                        "reasoning": "why this change improves fit"
                    }}
                ],
                "keyword_additions": ["important keywords to add"],
                "content_reordering": "suggestions for better content organization",
                "quantification_opportunities": ["where to add metrics/numbers"],
                "cover_letter_framework": {{
                    "opening": "suggested opening paragraph",
                    "body_points": ["key point 1", "key point 2"],
                    "closing": "suggested closing paragraph"
                }},
                "interview_prep": ["questions likely to be asked based on job"],
                "portfolio_highlights": ["what to emphasize in portfolio/samples"],
                "overall_strategy": "high-level application strategy"
            }}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert application optimizer and career coach. Help candidates tailor their materials effectively."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.warning(f"AI application optimization failed, using fallback: {e}")
            return await self._mock_optimize_application_content(job_description, current_resume, cover_letter)

    # Helper methods for AI integration
    def _summarize_applications(self, applications: List[Dict[str, Any]]) -> str:
        """Summarize applications for AI analysis"""
        if not applications:
            return "No applications provided"
        
        summary = {
            "total_applications": len(applications),
            "status_breakdown": {},
            "companies": [],
            "roles": [],
            "recent_activity": "Last 30 days" if applications else "No recent activity"
        }
        
        for app in applications:
            status = app.get("status", "unknown")
            summary["status_breakdown"][status] = summary["status_breakdown"].get(status, 0) + 1
            
            if app.get("company_name"):
                summary["companies"].append(app["company_name"])
            if app.get("title"):
                summary["roles"].append(app["title"])
        
        return json.dumps(summary, indent=2)

    # Mock methods for fallback when no OpenAI API key
    async def _mock_parse_job_description(self, title: str, description: str, company: str) -> Dict[str, Any]:
        """Mock implementation for job description parsing"""
        return {
            "required_skills": self._extract_skills_from_text(description),
            "preferred_skills": [],
            "experience_level": self._guess_experience_level(title, description),
            "job_type": "full-time",
            "remote_ok": "remote" in description.lower(),
            "salary_range": self._extract_salary(description),
            "key_responsibilities": ["Execute primary job functions", "Collaborate with team members"],
            "company_benefits": ["Health insurance", "401k matching"],
            "education_requirements": self._extract_education(description),
            "industry": "technology",
            "work_environment": "hybrid"
        }

    async def _mock_analyze_job_match(self, job_title: str, job_description: str, 
                                    job_requirements: str, user_skills: List[str]) -> Dict[str, Any]:
        """Mock implementation for job match analysis"""
        job_skills = self._extract_skills_from_text(job_description + " " + job_requirements)
        matching_skills = [skill for skill in user_skills if any(js.lower() in skill.lower() for js in job_skills)]
        
        score = min(100, len(matching_skills) * 20)
        
        return {
            "score": score,
            "required_skills": job_skills,
            "matching_skills": matching_skills,
            "missing_skills": [skill for skill in job_skills if skill not in matching_skills],
            "skill_gaps": ["API integration experience", "Cloud deployment"],
            "strengths": matching_skills,
            "summary": f"You match {len(matching_skills)} out of {len(job_skills)} key skills.",
            "recommendations": [
                "Highlight your matching skills in your application",
                "Consider learning the missing skills",
                "Network with current employees"
            ],
            "interview_prep_tips": ["Prepare examples of your technical work", "Practice explaining complex concepts simply"],
            "application_focus": ["Emphasize relevant project experience", "Quantify your achievements"]
        }

    async def _mock_generate_user_insights(self, applications: List[Dict[str, Any]], 
                                         user_goals: Dict[str, int]) -> Dict[str, Any]:
        """Mock implementation for user insights"""
        total_apps = len(applications)
        successful_apps = len([app for app in applications if app.get("status") in ["interview", "offer"]])
        
        return {
            "insights": [
                f"You've applied to {total_apps} positions recently",
                f"Your success rate is {(successful_apps/total_apps*100):.1f}%" if total_apps > 0 else "Keep applying to track success rate",
                "Most applications are in technology sector",
                "Your application frequency is consistent"
            ],
            "recommendations": [
                "Follow up on pending applications",
                "Diversify the types of roles you apply for",
                "Network more within target companies",
                "Customize each application"
            ],
            "success_patterns": ["Consistent application tracking"],
            "improvement_areas": ["Follow-up strategy", "Application customization"],
            "goal_assessment": "Your goals are achievable with consistent effort",
            "next_steps": [
                "Set up Google Alerts for relevant job postings",
                "Update your LinkedIn profile",
                "Practice interviewing skills"
            ],
            "market_positioning": "Well-positioned for mid-level roles",
            "application_strategy": "Focus on quality over quantity",
            "skill_development": ["Cloud technologies", "System design"],
            "networking_advice": "Attend local tech meetups and conferences"
        }

    async def _mock_analyze_resume_job_fit(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Mock implementation for resume analysis"""
        return {
            "overall_match_score": 72,
            "strengths": ["Strong technical background", "Relevant project experience"],
            "weaknesses": ["Limited leadership experience", "No industry-specific certifications"],
            "missing_keywords": ["agile", "scrum", "kubernetes"],
            "resume_improvements": [
                "Add more quantified achievements",
                "Include relevant keywords naturally",
                "Reorganize skills section"
            ],
            "experience_alignment": "Good match for mid-level roles",
            "skill_match_breakdown": {
                "technical_skills": {"matched": ["Python", "SQL"], "missing": ["Docker", "AWS"]},
                "soft_skills": {"matched": ["Communication"], "missing": ["Leadership"]}
            },
            "ats_optimization": ["Use standard section headers", "Include more industry keywords"],
            "cover_letter_focus": ["Highlight relevant projects", "Show enthusiasm for company mission"]
        }

    async def _mock_generate_job_recommendations(self, user_profile: Dict[str, Any], 
                                               recent_applications: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mock implementation for job recommendations"""
        return {
            "recommended_roles": [
                {
                    "title": "Software Engineer",
                    "reasoning": "Strong match with your technical skills",
                    "growth_potential": "Clear path to senior and lead roles",
                    "skill_alignment": "95% match with your current skillset"
                }
            ],
            "recommended_companies": [
                {
                    "type": "startup",
                    "reasoning": "Fast-paced environment matches your adaptability",
                    "examples": ["TechCorp", "InnovateLabs"]
                }
            ],
            "skill_development_plan": [
                {
                    "skill": "Kubernetes",
                    "priority": "high",
                    "learning_path": "Complete online course, then hands-on projects",
                    "timeline": "3-6 months to proficiency"
                }
            ],
            "market_opportunities": ["AI/ML integration roles", "Cloud migration specialists"],
            "application_strategy": "Focus on companies undergoing digital transformation",
            "networking_targets": ["Senior engineers at target companies", "Tech meetup organizers"],
            "portfolio_projects": ["Build a microservices app", "Contribute to open source"]
        }

    async def _mock_optimize_application_content(self, job_description: str, current_resume: str, 
                                               cover_letter: str = "") -> Dict[str, Any]:
        """Mock implementation for application optimization"""
        return {
            "resume_optimizations": [
                {
                    "section": "summary",
                    "current": "Software developer with experience",
                    "optimized": "Full-stack software engineer with 5+ years building scalable web applications",
                    "reasoning": "More specific and quantified"
                }
            ],
            "keyword_additions": ["microservices", "CI/CD", "RESTful APIs"],
            "content_reordering": "Move technical skills section higher",
            "quantification_opportunities": ["Add metrics to project descriptions", "Include team sizes"],
            "cover_letter_framework": {
                "opening": "Express specific interest in the role and company",
                "body_points": ["Highlight relevant technical experience", "Show cultural fit"],
                "closing": "Mention specific contribution you can make"
            },
            "interview_prep": ["Prepare system design examples", "Practice behavioral questions"],
            "portfolio_highlights": ["Feature projects using job's tech stack", "Include live demos"],
            "overall_strategy": "Emphasize both technical skills and business impact"
        }
    
    # Helper methods
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from text using simple pattern matching"""
        skills = []
        common_skills = [
            "Python", "JavaScript", "Java", "SQL", "React", "Node.js", "AWS", "Docker",
            "Communication", "Leadership", "Problem-solving", "Teamwork", "Project Management"
        ]
        
        text_lower = text.lower()
        for skill in common_skills:
            if skill.lower() in text_lower:
                skills.append(skill)
        
        return skills
    
    def _is_technical_skill(self, skill: str) -> bool:
        """Determine if a skill is technical"""
        technical_keywords = ["python", "javascript", "sql", "aws", "docker", "react", "node"]
        return any(keyword in skill.lower() for keyword in technical_keywords)
    
    def _guess_experience_level(self, title: str, description: str) -> str:
        """Guess experience level from job title and description"""
        title_lower = title.lower()
        if "senior" in title_lower or "lead" in title_lower:
            return "senior"
        elif "junior" in title_lower or "entry" in title_lower:
            return "junior"
        else:
            return "mid"
    
    def _extract_salary(self, text: str) -> Optional[str]:
        """Extract salary information from text"""
        salary_pattern = r'\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?'
        match = re.search(salary_pattern, text)
        return match.group() if match else None
    
    def _extract_experience(self, text: str) -> str:
        """Extract experience requirements"""
        exp_pattern = r'(\d+)\+?\s*years?\s*(?:of\s*)?experience'
        match = re.search(exp_pattern, text.lower())
        return f"{match.group(1)} years" if match else "Not specified"
    
    def _extract_education(self, text: str) -> str:
        """Extract education requirements"""
        if "bachelor" in text.lower():
            return "Bachelor's degree"
        elif "master" in text.lower():
            return "Master's degree"
        elif "phd" in text.lower():
            return "PhD"
        else:
            return "Not specified"