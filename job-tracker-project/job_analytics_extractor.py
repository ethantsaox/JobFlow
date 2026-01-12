"""
Job Market Intelligence Dashboard - Data Extraction & Transformation
Extracts data from PostgreSQL, performs analytics, exports to Tableau-ready CSVs
"""

import pandas as pd
import psycopg2
import re
from datetime import datetime, timedelta
import numpy as np
import os

# Configuration

DB_CONFIG = {
    'host': 'localhost',
    'database': 'job_tracker',
    'user': 'job_user',
    'password': 'job_pass',
    'port': '5432'
}

OUTPUT_DIR = 'tableau_exports'

# Expanded skills keywords for better job market analysis
SKILLS_KEYWORDS = {
    # Programming Languages
    'Python': r'\bPython\b|\bpandas\b|\bnumpy\b|\bscikit-learn\b|\bdjango\b|\bflask\b',
    'JavaScript': r'\bJavaScript\b|\bJS\b|\bNode\.js\b|\bReact\b|\bVue\b|\bAngular\b',
    'Java': r'\bJava\b|\bSpring\b|\bHibernate\b',
    'C++': r'\bC\+\+\b|\bCPP\b',
    'C#': r'\bC#\b|\b\.NET\b|\bASP\.NET\b',
    'Go': r'\bGolang\b|\bGo\b',
    'Rust': r'\bRust\b',
    'Swift': r'\bSwift\b|\biOS\b',
    'Kotlin': r'\bKotlin\b|\bAndroid\b',
    'R': r'\b R \b|\bR programming\b|\bggplot\b|\bshiny\b',
    'MATLAB': r'\bMATLAB\b',
    'Scala': r'\bScala\b',
    'PHP': r'\bPHP\b|\bLaravel\b|\bSymfony\b',
    'Ruby': r'\bRuby\b|\bRails\b',
    
    # Databases & Data Storage
    'SQL': r'\bSQL\b|\bMySQL\b|\bPostgreSQL\b|\bT-SQL\b|\bSQL Server\b',
    'NoSQL': r'\bNoSQL\b|\bMongoDB\b|\bCassandra\b|\bRedis\b|\bElasticsearch\b',
    'Oracle': r'\bOracle\b|\bOracle DB\b',
    'Snowflake': r'\bSnowflake\b',
    'BigQuery': r'\bBigQuery\b',
    'Redshift': r'\bRedshift\b',
    'DynamoDB': r'\bDynamoDB\b',
    
    # Cloud Platforms
    'AWS': r'\bAWS\b|\bAmazon Web Services\b|\bS3\b|\bEC2\b|\bLambda\b',
    'Azure': r'\bAzure\b|\bMicrosoft Azure\b',
    'GCP': r'\bGCP\b|\bGoogle Cloud\b|\bGoogle Cloud Platform\b',
    
    # Data Tools & Visualization
    'Tableau': r'\bTableau\b',
    'Power BI': r'\bPower BI\b|\bPowerBI\b',
    'Excel': r'\bExcel\b|\bVBA\b|\bPivot Tables\b',
    'Looker': r'\bLooker\b',
    'Qlik': r'\bQlik\b|\bQlikSense\b',
    'D3.js': r'\bD3\.js\b|\bD3\b',
    'Plotly': r'\bPlotly\b',
    
    # Machine Learning & AI
    'Machine Learning': r'\bMachine Learning\b|\bML\b|\bDeep Learning\b|\bNLP\b',
    'TensorFlow': r'\bTensorFlow\b',
    'PyTorch': r'\bPyTorch\b',
    'Keras': r'\bKeras\b',
    'Scikit-learn': r'\bScikit-learn\b|\bsklearn\b',
    'OpenAI': r'\bOpenAI\b|\bGPT\b|\bChatGPT\b',
    'Computer Vision': r'\bComputer Vision\b|\bCV\b|\bOpenCV\b',
    
    # Data Engineering & ETL
    'ETL': r'\bETL\b|\bELT\b|\bdata pipeline\b|\bdata ingestion\b',
    'Apache Spark': r'\bSpark\b|\bPySpark\b|\bApache Spark\b',
    'Hadoop': r'\bHadoop\b|\bHDFS\b',
    'Kafka': r'\bKafka\b|\bApache Kafka\b',
    'Airflow': r'\bAirflow\b|\bApache Airflow\b',
    'dbt': r'\bdbt\b|\bdata build tool\b',
    
    # DevOps & Infrastructure
    'Docker': r'\bDocker\b|\bcontainer\b',
    'Kubernetes': r'\bKubernetes\b|\bK8s\b',
    'Git': r'\bGit\b|\bGitHub\b|\bGitLab\b',
    'CI/CD': r'\bCI/CD\b|\bJenkins\b|\bGitHub Actions\b',
    'Terraform': r'\bTerraform\b',
    'Linux': r'\bLinux\b|\bUnix\b|\bBash\b',
    
    # Web Technologies
    'REST API': r'\bREST\b|\bRESTful\b|\bAPI\b',
    'GraphQL': r'\bGraphQL\b',
    'HTML/CSS': r'\bHTML\b|\bCSS\b|\bSASS\b|\bLESS\b',
    'React': r'\bReact\b|\bReact\.js\b|\bNext\.js\b',
    'Vue': r'\bVue\b|\bVue\.js\b|\bNuxt\b',
    'Angular': r'\bAngular\b|\bAngularJS\b',
    
    # Analytics & Statistics
    'Statistics': r'\bStatistics\b|\bStatistical\b|\bRegression\b|\bANOVA\b',
    'A/B Testing': r'\bA/B Testing\b|\bA/B test\b|\bExperimentation\b',
    'Hypothesis Testing': r'\bHypothesis Testing\b|\bt-test\b|\bchi-square\b',
    'Predictive Analytics': r'\bPredictive Analytics\b|\bForecasting\b',
    'Time Series': r'\bTime Series\b|\bARIMA\b|\bSeasonal\b',
    
    # Business Intelligence
    'Data Warehousing': r'\bData Warehouse\b|\bData Warehousing\b|\bDWH\b',
    'Business Intelligence': r'\bBusiness Intelligence\b|\bBI\b',
    'Data Mining': r'\bData Mining\b|\bKDD\b',
    'Data Governance': r'\bData Governance\b|\bData Quality\b',
    
    # Project Management & Methodologies
    'Agile': r'\bAgile\b|\bScrum\b|\bKanban\b|\bSprint\b',
    'JIRA': r'\bJIRA\b|\bAtlassian\b',
    'Confluence': r'\bConfluence\b',
    'Slack': r'\bSlack\b',
    
    # Industry-Specific
    'Financial Modeling': r'\bFinancial Modeling\b|\bValuation\b|\bDCF\b',
    'Risk Management': r'\bRisk Management\b|\bVaR\b|\bCredit Risk\b',
    'Healthcare Analytics': r'\bHealthcare\b|\bClinical Data\b|\bEHR\b',
    'Marketing Analytics': r'\bMarketing Analytics\b|\bCustomer Analytics\b|\bSEO\b',
}

# Database Connection

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Successfully connected to PostgreSQL database")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

# Data Extraction

def extract_data(conn):
    print("\n🔍 Extracting data from database")

    query = """
    SELECT 
        ja.id,
        ja.title,
        ja.description,
        ja.requirements,
        ja.applied_date,
        ja.status,
        ja.location,
        ja.location_type,
        ja.salary_info,
        ja.source_platform,
        ja.source_url,
        ja.job_type,
        ja.notes,
        ja.created_at,
        ja.updated_at,
        c.name as company_name,
        c.website as company_website,
        c.description as company_description,
        c.industry,
        c.size as company_size
    FROM job_applications ja
    LEFT JOIN companies c ON ja.company_id = c.id
    ORDER BY ja.applied_date DESC;
    """
    
    df = pd.read_sql(query, conn)
    
    print(f"Extracted {len(df)} job applications")
    
    return df

# Data Transformation

def parse_skills(description, requirements):
    text = str(description) + " " + str(requirements)
    text = text.upper()

    skills_found = []
    for skill, pattern in SKILLS_KEYWORDS.items():
        if re.search(pattern, text, re.IGNORECASE):
            skills_found.append(skill)
    
    return skills_found

def calculate_time_metrics(df):
    """Calculate time-based metrics"""
    
    print("\n📊 Calculating time metrics")
    
    # Convert dates to datetime
    df['applied_date'] = pd.to_datetime(df['applied_date'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['updated_at'] = pd.to_datetime(df['updated_at'])
    
    # Calculate days since application
    today = pd.Timestamp.now(tz='UTC')
    df['days_since_application'] = (today - df['applied_date']).dt.days
    
    # Calculate days to response (updated_at - applied_date if status changed)
    df['days_to_response'] = (df['updated_at'] - df['applied_date']).dt.days
    # Set to null if status is still 'applied' (no response yet)
    df.loc[df['status'] == 'applied', 'days_to_response'] = np.nan
    
    # Extract date components for time series analysis
    df['application_year'] = df['applied_date'].dt.year
    df['application_month'] = df['applied_date'].dt.month
    df['application_month_name'] = df['applied_date'].dt.month_name()
    df['application_week'] = df['applied_date'].dt.isocalendar().week
    df['application_day_of_week'] = df['applied_date'].dt.day_name()
    
    return df

def extract_skills_columns(df):
    """Create binary columns for each skill"""
    
    print("\n🛠️ Extracting skills from job descriptions")
    
    # Extract skills for each row
    skills_list = []
    for idx, row in df.iterrows():
        skills = parse_skills(row['description'], row['requirements'])
        skills_list.append(skills)
    
    df['skills_list'] = skills_list
    df['skills_count'] = df['skills_list'].apply(len)
    df['skills_text'] = df['skills_list'].apply(lambda x: ', '.join(x) if x else '')
    
    # Create binary columns for each skill
    for skill in SKILLS_KEYWORDS.keys():
        df[f'skill_{skill.replace(" ", "_").replace("/", "_").replace(".", "_").lower()}'] = df['skills_list'].apply(
            lambda x: 1 if skill in x else 0
        )
    
    print(f"Extracted {len(SKILLS_KEYWORDS)} skill categories")
    
    return df

def calculate_response_metrics(df):
    """Calculate response-related metrics"""
    
    print("\n📈 Calculating response metrics")
    
    # Response flag (1 if not 'applied' or 'no_response', 0 otherwise)
    df['got_response'] = df['status'].apply(
        lambda x: 0 if x in ['applied', 'no_response'] else 1
    )
    
    # Rejection flag
    df['was_rejected'] = df['status'].apply(lambda x: 1 if x == 'rejected' else 0)
    
    # Active flag (still in process)
    df['is_active'] = df['status'].apply(
        lambda x: 1 if x in ['screening', 'interview', 'offer'] else 0
    )
    
    # Status category for grouping
    def status_category(status):
        if status in ['applied', 'no_response']:
            return 'No Response'
        elif status == 'rejected':
            return 'Rejected'
        elif status in ['screening', 'interview']:
            return 'In Progress'
        elif status == 'offer':
            return 'Offer'
        else:
            return 'Other'
    
    df['status_category'] = df['status'].apply(status_category)
    
    return df

def clean_company_data(df):
    """Clean and standardize company information"""
    
    print("\n🏢 Cleaning company data")
    
    # Fill missing values
    df['company_size'] = df['company_size'].fillna('Unknown')
    df['industry'] = df['industry'].fillna('Unknown')
    df['location'] = df['location'].fillna('Unknown')
    df['location_type'] = df['location_type'].fillna('Unknown')
    df['salary_info'] = df['salary_info'].fillna('Not Specified')
    df['job_type'] = df['job_type'].fillna('Unknown')
    
    return df

def transform_data(df):
    """Apply all transformations to the dataframe"""
    
    print("\n🔄 Starting data transformation...")
    
    df = calculate_time_metrics(df)
    df = extract_skills_columns(df)
    df = calculate_response_metrics(df)
    df = clean_company_data(df)
    
    print("✅ Data transformation complete")
    
    return df

# Aggregations for Tableau

def create_weekly_metrics(df):
    """Create weekly aggregated metrics"""
    
    print("\n📅 Creating weekly metrics...")
    
    # Group by week
    weekly = df.groupby(['application_year', 'application_week']).agg({
        'id': 'count',  # Total applications
        'got_response': 'sum',  # Total responses
        'was_rejected': 'sum',  # Total rejections
        'is_active': 'sum',  # Active applications
        'days_to_response': 'mean',  # Avg days to response
        'skills_count': 'mean',  # Avg skills per posting
    }).reset_index()
    
    weekly.columns = [
        'year', 'week', 'total_applications', 'total_responses',
        'total_rejections', 'active_applications', 'avg_days_to_response',
        'avg_skills_per_posting'
    ]
    
    # Calculate response rate
    weekly['response_rate'] = (weekly['total_responses'] / weekly['total_applications'] * 100).round(2)
    
    print(f"Created {len(weekly)} weeks of data")
    
    return weekly

def create_skills_analysis(df):
    """Create skills correlation analysis"""
    
    print("\n🛠️ Creating skills analysis...")
    
    skills_data = []
    
    for skill in SKILLS_KEYWORDS.keys():
        skill_col = f'skill_{skill.replace(" ", "_").replace("/", "_").replace(".", "_").lower()}'
        
        # Filter applications mentioning this skill
        with_skill = df[df[skill_col] == 1]
        without_skill = df[df[skill_col] == 0]
        
        if len(with_skill) > 0:
            skills_data.append({
                'skill_name': skill,
                'total_mentions': len(with_skill),
                'responses_with_skill': with_skill['got_response'].sum(),
                'response_rate_with': (with_skill['got_response'].mean() * 100).round(2),
                'response_rate_without': (without_skill['got_response'].mean() * 100).round(2) if len(without_skill) > 0 else 0,
            })
    
    skills_df = pd.DataFrame(skills_data)
    
    # Calculate response rate difference
    skills_df['response_rate_diff'] = (
        skills_df['response_rate_with'] - skills_df['response_rate_without']
    ).round(2)
    
    # Sort by response rate difference
    skills_df = skills_df.sort_values('response_rate_diff', ascending=False)
    
    print(f"Analyzed {len(skills_df)} skills")
    
    return skills_df

def create_company_dimension(df):
    """Create clean company dimension table"""
    
    print("\n🏢 Creating company dimension...")
    
    company_dim = df[['company_name', 'industry', 'company_size', 'company_website']].drop_duplicates()
    company_dim = company_dim.dropna(subset=['company_name'])
    
    # Add aggregated metrics per company
    company_metrics = df.groupby('company_name').agg({
        'id': 'count',
        'got_response': 'sum',
        'was_rejected': 'sum',
    }).reset_index()
    
    company_metrics.columns = [
        'company_name', 'total_applications', 'total_responses',
        'total_rejections'
    ]
    
    company_dim = company_dim.merge(company_metrics, on='company_name', how='left')
    
    print(f"✅ Created dimension for {len(company_dim)} companies")
    
    return company_dim

# Export to CSV

def export_to_csv(df, weekly, skills, companies):
    """Export all dataframes to CSV files for Tableau"""
    
    print(f"\n📁 Exporting data to {OUTPUT_DIR}/...")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Select columns for main export (remove redundant columns)
    main_cols = [
        'id', 'title', 'company_name', 'industry', 'company_size', 'location', 
        'location_type', 'salary_info', 'applied_date', 'application_year', 
        'application_month', 'application_month_name', 'application_week', 
        'application_day_of_week', 'status', 'status_category', 'source_platform', 
        'job_type', 'days_since_application', 'days_to_response', 'got_response',
        'was_rejected', 'is_active', 'skills_count', 'skills_text'
    ]
    
    # Add skill binary columns
    skill_cols = [col for col in df.columns if col.startswith('skill_')]
    main_cols.extend(skill_cols)
    
    # Export main fact table
    df[main_cols].to_csv(f'{OUTPUT_DIR}/job_applications_main.csv', index=False)
    print(f"✅ Exported job_applications_main.csv ({len(df)} rows)")
    
    # Export weekly metrics
    weekly.to_csv(f'{OUTPUT_DIR}/weekly_metrics.csv', index=False)
    print(f"✅ Exported weekly_metrics.csv ({len(weekly)} rows)")
    
    # Export skills analysis
    skills.to_csv(f'{OUTPUT_DIR}/skills_analysis.csv', index=False)
    print(f"✅ Exported skills_analysis.csv ({len(skills)} rows)")
    
    # Export company dimension
    companies.to_csv(f'{OUTPUT_DIR}/companies_dimension.csv', index=False)
    print(f"✅ Exported companies_dimension.csv ({len(companies)} rows)")
    
    print("\n🎉 All exports complete!")

# Main Execution

def main():
    """Main execution function"""
    
    print("=" * 70)
    print("JOB MARKET INTELLIGENCE DASHBOARD - DATA EXTRACTION")
    print("=" * 70)
    
    try:
        # Connect to database
        conn = get_db_connection()
        
        # Extract data
        df = extract_data(conn)
        
        # Transform data
        df_transformed = transform_data(df)
        
        # Create aggregations
        weekly_metrics = create_weekly_metrics(df_transformed)
        skills_analysis = create_skills_analysis(df_transformed)
        company_dimension = create_company_dimension(df_transformed)
        
        # Export to CSV
        export_to_csv(df_transformed, weekly_metrics, skills_analysis, company_dimension)
        
        # Print summary statistics
        print("\n" + "=" * 70)
        print("📊 SUMMARY STATISTICS")
        print("=" * 70)
        print(f"📋 Total Applications: {len(df_transformed)}")
        print(f"📅 Date Range: {df_transformed['applied_date'].min().date()} to {df_transformed['applied_date'].max().date()}")
        print(f"📧 Total Responses: {df_transformed['got_response'].sum()}")
        print(f"📊 Response Rate: {(df_transformed['got_response'].mean() * 100):.2f}%")
        print(f"❌ Total Rejections: {df_transformed['was_rejected'].sum()}")
        print(f"⏳ Active Applications: {df_transformed['is_active'].sum()}")
        print(f"🏢 Unique Companies: {df_transformed['company_name'].nunique()}")
        print(f"🛠️ Total Skills Mentions: {df_transformed['skills_count'].sum()}")
        print(f"📍 Application Sources: {', '.join(df_transformed['source_platform'].unique())}")
        print(f"💼 Job Types: {', '.join(df_transformed['job_type'].unique())}")
        print(f"🏠 Location Types: {', '.join(df_transformed['location_type'].unique())}")
        
        # Close connection
        conn.close()
        print("\n🔌 Database connection closed")
        print("\n🎯 Data extraction complete! Ready for Tableau import.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()