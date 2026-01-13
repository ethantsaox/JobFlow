# **📊 JobFlow: Job Application Intelligence Platform**

> A full-stack job tracking system with integrated market analytics dashboard built to optimize my data role job search strategy

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/ethantsaox/JobFlow)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5)](https://linkedin.com/in/ethandtsao)

---

## **🎯 Project Overview**

**JobFlow** is a comprehensive job search intelligence platform I built to transform my job hunting process from reactive to data-driven. The system combines a full-stack application for tracking applications with an advanced analytics dashboard for market insights.

**Key Achievement:** Tracked 80+ applications across 86 companies, performing in-depth analysis using advanced SQL queries and through Tableau dashboards.

---

## **📁 Project Structure**

```
JobFlow/
├── frontend/          # React application
├── backend/           # FastAPI server
├── database/          # PostgreSQL schema & migrations
├── analytics/         # Python ETL scripts
├── tableau_exports/   # CSV files for Tableau
└── dashboards/        # Tableau workbooks (.twbx)
```

---

## **✨ Features**

### **1. Full-Stack Application**
- 📝 **Application Tracking:** Comprehensive job application management system
- 🎯 **Smart Categorization:** Automatic job role classification (Data Engineer, Data Scientist, Data Analyst)
- 💰 **Salary Intelligence:** Automatic salary parsing and standardization across formats
- 🏆 **Gamification:** Achievement system with milestones and streak tracking
- 📊 **Real-time Analytics:** Dashboard with KPIs and progress visualization
- 🔍 **Advanced Filtering:** Search and filter by status, company, location, salary range

### **2. Market Intelligence Dashboard (Tableau)**
- 📈 **Market Overview:** Job category distribution, salary analysis, work mode trends
- 🛠️ **Skills Intelligence:** Heatmap showing skill requirements by role
- 💵 **Compensation Analysis:** Salary breakdown by company size, work mode, and skills
- 🏢 **Industry Insights:** Top hiring industries and salary comparisons

---

## **🖼️ Application Screenshots**

### **Dashboard Overview**
![Dashboard](job-tracker-project/docs/images/dashboard-overview.png)
*Main dashboard showing application progress, streaks, and achievements*

### **Application Management**
![Applications](job-tracker-project/docs/images/applications-list.png)
*Comprehensive application tracking with company details, salary info, and status updates*

### **Analytics Dashboard**
![Analytics](job-tracker-project/docs/images/analytics-dashboard.png)
*Deep insights into application timeline, status distribution, and success metrics*

### **Network & Achievements**
![Network](job-tracker-project/docs/images/network-achievements.png)
*Gamification features with milestone tracking and achievement system*

### **Application Details**
![Details](job-tracker-project/docs/images/application-detail.png)
*Detailed view of individual applications with notes and job descriptions*

### **LinkedIn Integration**
![LinkedIn](job-tracker-project/docs/images/linkedin-integration.png)
*Browser extension integration for one-click job tracking from LinkedIn*

---

## **📊 Tableau Dashboard**

### **Page 1: Market Overview**
![Market Overview](job-tracker-project/docs/images/Market-Intelligence.png)

**Key Insights:**
- Data Engineer roles comprise 33% of the market
- Average salary: $129K (range: $48K-$330K)
- 75% of jobs require Python
- Full-time positions dominate at 75%
- Remote work accounts for 36% of opportunities

### **Page 2: Skills Intelligence**
![Skills Intelligence](job-tracker-project/docs/images/Skills-Intelligence.png)

**Key Findings:**
- **Universal Skills:** Python (75%) and SQL (70%) are non-negotiable
- **Data Science:** 100% require ML, 65% require Statistics
- **Data Engineering:** 65% require ETL, 50% require Snowflake
- **Data Analyst:** 71% require Business Intelligence tools

### **Page 3: Salary Breakdown**
![Compensation](job-tracker-project/docs/images/Salary-Breakdown.png)

**Salary Drivers:**
- Mid-sized companies (500-1K employees) pay highest: $160K avg
- Hybrid work commands 17% premium over remote
- Full-time roles pay 14% more than contract positions

### **Page 4: Industry Breakdown**
![Industry Breakdown](job-tracker-project/docs/images/Industry-Breakdown.png)

**Industry Insights:**
- Software dominates at 63% of opportunities (50 positions)
- Technology sector commands premium compensation at $135K average
- Manufacturing emerging as secondary market at 11% (9 positions)
- Consulting balances accessibility with competitive pay at $96K average

**Strategic Recommendations:**
- Target Software/Technology industries for 71% of market opportunities
- Mid-sized tech companies offer optimal compensation ($160K average)
- Pursue hybrid and on-site roles for 17% salary premium over remote
- Develop Airflow/Snowflake expertise for Data Engineering differentiation

---

## **🛠️ Technical Stack**

### **Frontend**
- **Framework:** React 18
- **State Management:** React Context API
- **Routing:** React Router v6
- **Styling:** CSS Modules + Modern CSS
- **HTTP Client:** Axios
- **UI Components:** Custom components with responsive design

### **Backend**
- **Framework:** FastAPI
- **Database:** PostgreSQL 14
- **ORM:** SQLAlchemy
- **Authentication:** JWT tokens
- **API Documentation:** OpenAPI/Swagger (auto-generated)

### **Analytics Pipeline**
- **ETL:** Python 3.11
- **Data Processing:** Pandas
- **Text Analysis:** Regex + NLP for skill extraction
- **Visualization:** Tableau Desktop 2025.3
- **Exports:** CSV format for Tableau integration

### **Deployment**
- **Frontend:** Vercel
- **Backend:** Railway / Render
- **Database:** Railway PostgreSQL
- **Version Control:** Git + GitHub

---

## **🚀 Getting Started**

### **Prerequisites**
```bash
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Git
```

### **Installation**

#### **1. Clone the Repository**
```bash
git clone https://github.com/ethantsao/JobFlow.git
cd JobFlow
```

#### **2. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/jobflow
SECRET_KEY=your-secret-key-here
```

Run migrations:
```bash
alembic upgrade head
python -m uvicorn main:app --reload
```

#### **3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

#### **4. Database Setup**
```bash
# Create database
createdb jobflow

# Run schema
psql jobflow < database/schema.sql
```

---

## **📈 Analytics Pipeline**

### **Running the ETL Script**

The analytics pipeline extracts data from PostgreSQL and generates Tableau-ready CSV files:

```bash
cd analytics
python job_analytics_extractor.py
```

**Generated Files:**
- `job_applications_main.csv` - Main dataset with all applications
- `skills_analysis.csv` - Skill frequency and response rate analysis
- `weekly_metrics.csv` - Time-series application metrics
- `companies_dimension.csv` - Company reference data

### **Key ETL Features**

**1. Job Categorization**
```python
def classify_job_category(title):
    # Data Science (most specific - check first)
    # Data Engineer (mid-level specificity)
    # Data Analyst (broadest - check last)
    # Other (everything else)
```

**2. Salary Standardization**
- Handles yearly, hourly, and monthly formats
- Converts all to annual salary
- Averages salary ranges
- Example: "$75K/yr - $85K/yr" → $80,000

**3. Skills Extraction**
- 90+ technical skills tracked
- Binary encoding (0/1) for each skill
- Pattern matching with regex
- Handles variations (e.g., "Python", "python", "Python3")

---

## **🎨 Dashboard Design Principles**

### **Color Scheme**
- **Primary:** Blue (#4A90E2) - Trust, professionalism
- **Success:** Green (#27AE60) - Positive metrics
- **Warning:** Orange (#F39C12) - Attention items  
- **Error:** Red (#E74C3C) - Rejections

### **Typography**
- **Headers:** 24-32pt, Bold
- **KPIs:** 64-80pt, Bold
- **Body:** 12-14pt, Regular
- **Labels:** 12pt, Medium Gray

### **Layout Philosophy**
- Clean, scannable interfaces
- Strategic use of white space
- Mobile-responsive design
- Accessibility-first approach

---

## **📊 Key Insights & Learnings**

### **Market Intelligence**
1. **Skills Hierarchy:** Python + SQL are table stakes (70%+ of jobs)
2. **Company Size Paradox:** Mid-sized firms pay 31% more than enterprises
3. **Work Mode Economics:** Hybrid roles command 17% salary premium
4. **Industry Concentration:** Software/Tech represents 71% of opportunities

### **Technical Learnings**
1. **Data Quality:** Salary parsing required handling 10+ different formats
2. **Job Classification:** Order matters - check specific categories before broad ones
3. **Skill Extraction:** Simple regex outperformed complex NLP for structured data
4. **Dashboard Performance:** Pre-aggregated data dramatically improved Tableau load times

### **Job Search Strategy**
- **Target Profile:** 500-1K employee companies, hybrid roles, Software/Tech industry
- **Skill Investment:** Mastered Python/SQL, then specialized in ETL for Data Engineering
- **Application Velocity:** 2.7 apps/day average, peaking at 7 apps/day during active periods
- **Response Optimization:** 43% response rate by targeting mid-sized companies

---

## **🔮 Future Enhancements**

### **Planned Features**
- [ ] Machine learning model to predict application success
- [ ] Automated email parsing for status updates
- [ ] Chrome extension for one-click application tracking
- [ ] Integration with Glassdoor API for company reviews
- [ ] Network visualization of company connections
- [ ] Automated cover letter generation using GPT-4

### **Technical Improvements**
- [ ] Add Redis caching layer
- [ ] Implement real-time WebSocket updates
- [ ] Add comprehensive test suite (Jest + Pytest)
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Containerize with Docker
- [ ] Add Prometheus + Grafana monitoring

---

## **📝 Project Timeline**

- **Dec 2025:** Initial concept and architecture design
- **Week 1-2:** Built React frontend with core tracking features
- **Week 3:** Developed FastAPI backend with PostgreSQL integration
- **Week 4:** Created Python ETL pipeline for analytics
- **Jan 2026:** Built Tableau dashboards (4 pages, 15+ visualizations)
- **Total Development Time:** ~40 hours over 5 weeks

---

## **🤝 Contributing**

This is a personal project, but I'm open to suggestions! Feel free to:
- Open an issue for bugs or feature requests
- Submit a pull request with improvements
- Share your own job search data for anonymized analysis

---

## **📄 License**

MIT License - feel free to use this project as inspiration for your own job search tools!

---

## **👤 About Me**

**Ethan Tsao**  
Statistics & Data Science @ UCSB | Graduating June 2026

I built JobFlow to solve my own problem: turning the chaos of job hunting into actionable data. This project combines my interests in full-stack development, data engineering, and visual analytics.

**Connect with me:**
- 💼 [LinkedIn](https://linkedin.com/in/ethantsao)
- 🐙 [GitHub](https://github.com/ethantsao)

---

## **🙏 Acknowledgments**

- **Inspiration:** Frustrated by scattered job application tracking across spreadsheets
- **Data Source:** My own 80+ job applications (Dec 2025 - Jan 2026)
- **Tools:** React, FastAPI, PostgreSQL, Tableau, Python, lots of coffee ☕

---

**⭐ If this project helped you, please star the repo!**

---

*Last Updated: January 2026*

---

## **NEXT STEPS TO IMPLEMENT THIS:**

1. **Save the README:**
   ```bash
   cd ~/job-tracker-project
   # Copy the above content into README.md
   ```

2. **Add Screenshots:**
   - Create a `/docs/images/` folder
   - Save your 7 screenshots there
   - Update the image paths in README

3. **Push to GitHub:**
   ```bash
   git add README.md docs/
   git commit -m "Add comprehensive README with screenshots"
   git push origin main
   ```

4. **Optional Enhancements:**
   - Add badges (GitHub stars, build status, license)
   - Create a CONTRIBUTING.md file
   - Add a LICENSE file (MIT recommended)
   - Create a docs/ folder with technical documentation
