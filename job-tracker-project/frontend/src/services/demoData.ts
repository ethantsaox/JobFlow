import { JobApplication, Company } from '../types'

export const DEMO_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Google',
    industry: 'Technology',
    size: 'Large',
    location: 'Mountain View, CA',
    website: 'https://google.com',
    logo_url: 'https://logo.clearbit.com/google.com',
    description: 'Multinational technology company',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Microsoft',
    industry: 'Technology',
    size: 'Large',
    location: 'Redmond, WA',
    website: 'https://microsoft.com',
    logo_url: 'https://logo.clearbit.com/microsoft.com',
    description: 'Technology corporation',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Netflix',
    industry: 'Entertainment',
    size: 'Large',
    location: 'Los Gatos, CA',
    website: 'https://netflix.com',
    logo_url: 'https://logo.clearbit.com/netflix.com',
    description: 'Streaming entertainment service',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Stripe',
    industry: 'Fintech',
    size: 'Medium',
    location: 'San Francisco, CA',
    website: 'https://stripe.com',
    logo_url: 'https://logo.clearbit.com/stripe.com',
    description: 'Online payment processing',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Airbnb',
    industry: 'Travel',
    size: 'Large',
    location: 'San Francisco, CA',
    website: 'https://airbnb.com',
    logo_url: 'https://logo.clearbit.com/airbnb.com',
    description: 'Online marketplace for lodging',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Apple',
    industry: 'Technology',
    size: 'Large',
    location: 'Cupertino, CA',
    website: 'https://apple.com',
    logo_url: 'https://logo.clearbit.com/apple.com',
    description: 'Consumer electronics and software',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Meta',
    industry: 'Social Media',
    size: 'Large',
    location: 'Menlo Park, CA',
    website: 'https://meta.com',
    logo_url: 'https://logo.clearbit.com/meta.com',
    description: 'Social technology company',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Amazon',
    industry: 'E-commerce',
    size: 'Large',
    location: 'Seattle, WA',
    website: 'https://amazon.com',
    logo_url: 'https://logo.clearbit.com/amazon.com',
    description: 'E-commerce and cloud computing',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    name: 'Tesla',
    industry: 'Automotive',
    size: 'Large',
    location: 'Austin, TX',
    website: 'https://tesla.com',
    logo_url: 'https://logo.clearbit.com/tesla.com',
    description: 'Electric vehicles and clean energy',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    name: 'Shopify',
    industry: 'E-commerce',
    size: 'Medium',
    location: 'Ottawa, ON',
    website: 'https://shopify.com',
    logo_url: 'https://logo.clearbit.com/shopify.com',
    description: 'Commerce platform for businesses',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const DEMO_APPLICATIONS: JobApplication[] = [
  {
    id: '1',
    company_id: '1',
    company: DEMO_COMPANIES[0],
    position: 'Senior Software Engineer',
    status: 'interviewing',
    priority: 'high',
    application_date: '2025-01-03',
    job_url: 'https://careers.google.com/jobs/results/123',
    salary_min: 160000,
    salary_max: 220000,
    salary_text: '$160k - $220k',
    location: 'Mountain View, CA',
    job_type: 'Full-time',
    description: 'Join our team building next-generation search infrastructure. Work with cutting-edge technologies and solve problems at massive scale.',
    requirements: 'BS in Computer Science, 5+ years experience, Python, Go, distributed systems',
    benefits: 'Comprehensive health insurance, 401k matching, free meals, stock options',
    notes: 'Really excited about this opportunity. Team seems great from the recruiter call.',
    interview_date: '2025-01-10',
    interview_time: '14:00',
    interview_type: 'virtual',
    interview_notes: 'Technical interview with the team lead. Focus on system design and algorithms.',
    created_at: '2025-01-03T10:00:00Z',
    updated_at: '2025-01-05T15:30:00Z'
  },
  {
    id: '2',
    company_id: '2',
    company: DEMO_COMPANIES[1],
    position: 'Full Stack Developer',
    status: 'interviewing',
    priority: 'medium',
    application_date: '2025-01-02',
    job_url: 'https://careers.microsoft.com/us/en/job/456',
    salary_min: 140000,
    salary_max: 180000,
    salary_text: '$140k - $180k',
    location: 'Redmond, WA',
    job_type: 'Full-time',
    description: 'Build web applications for Microsoft 365 suite. Work with React, TypeScript, and Azure services.',
    requirements: 'Experience with React, TypeScript, REST APIs, cloud platforms',
    benefits: 'Health insurance, retirement savings, employee stock purchase plan',
    notes: 'Applied through LinkedIn. Seems like a good fit for my background.',
    created_at: '2025-01-02T09:00:00Z',
    updated_at: '2025-01-02T09:00:00Z'
  },
  {
    id: '3',
    company_id: '3',
    company: DEMO_COMPANIES[2],
    position: 'Frontend Engineer',
    status: 'offer',
    priority: 'high',
    application_date: '2024-12-28',
    job_url: 'https://jobs.netflix.com/jobs/789',
    salary_min: 150000,
    salary_max: 200000,
    salary_text: '$150k - $200k + equity',
    location: 'Los Gatos, CA',
    job_type: 'Full-time',
    description: 'Help build the next generation of Netflix user interface. Work on web and TV applications.',
    requirements: 'Strong React skills, performance optimization, cross-platform development',
    benefits: 'Unlimited PTO, top-tier health insurance, stock options, free Netflix',
    notes: 'Got the offer! Need to respond by end of week. Very competitive package.',
    offer_amount: 175000,
    offer_details: 'Base: $175k, Bonus: $25k, Equity: $50k/year',
    offer_deadline: '2025-01-15',
    created_at: '2024-12-28T11:00:00Z',
    updated_at: '2025-01-04T16:45:00Z'
  },
  {
    id: '4',
    company_id: '4',
    company: DEMO_COMPANIES[3],
    position: 'Backend Engineer',
    status: 'rejected',
    priority: 'medium',
    application_date: '2024-12-20',
    job_url: 'https://stripe.com/jobs/backend-engineer',
    salary_min: 130000,
    salary_max: 170000,
    salary_text: '$130k - $170k',
    location: 'San Francisco, CA',
    job_type: 'Full-time',
    description: 'Build and maintain payment processing systems. Work with high-volume, mission-critical infrastructure.',
    requirements: 'Experience with distributed systems, databases, API design, Go or Java',
    benefits: 'Health insurance, 401k, commuter benefits, learning budget',
    notes: 'Technical interview was challenging. Got feedback about system design knowledge.',
    rejection_reason: 'Strong candidate but looking for more distributed systems experience',
    rejection_feedback: 'Impressed by coding skills, but need deeper knowledge of distributed systems architecture',
    created_at: '2024-12-20T14:00:00Z',
    updated_at: '2025-01-02T10:15:00Z'
  },
  {
    id: '5',
    company_id: '5',
    company: DEMO_COMPANIES[4],
    position: 'Software Engineer II',
    status: 'interviewing',
    priority: 'low',
    application_date: '2025-01-01',
    job_url: 'https://careers.airbnb.com/positions/software-engineer-ii',
    salary_min: 145000,
    salary_max: 185000,
    salary_text: '$145k - $185k',
    location: 'San Francisco, CA',
    job_type: 'Full-time',
    description: 'Work on host and guest experience platforms. Build features that connect millions of travelers.',
    requirements: 'Full-stack development, React, Python, API development',
    benefits: 'Travel credits, health insurance, equity, flexible work arrangements',
    notes: 'Interesting company culture. Would love to work on travel-related products.',
    created_at: '2025-01-01T13:30:00Z',
    updated_at: '2025-01-01T13:30:00Z'
  },
  {
    id: '6',
    company_id: '6',
    company: DEMO_COMPANIES[5],
    position: 'iOS Developer',
    status: 'interviewing',
    priority: 'high',
    application_date: '2024-12-30',
    job_url: 'https://jobs.apple.com/ios-developer',
    salary_min: 155000,
    salary_max: 205000,
    salary_text: '$155k - $205k',
    location: 'Cupertino, CA',
    job_type: 'Full-time',
    description: 'Develop innovative iOS applications that impact millions of users worldwide. Work on cutting-edge mobile experiences.',
    requirements: 'Swift, iOS SDK, 4+ years mobile development experience, UI/UX design principles',
    benefits: 'Stock options, comprehensive health coverage, employee discounts, wellness programs',
    notes: 'Dream company! Really want this position. Interview went well.',
    interview_date: '2025-01-08',
    interview_time: '11:00',
    interview_type: 'onsite',
    interview_notes: 'Code review and system design interview. They loved my portfolio.',
    created_at: '2024-12-30T16:00:00Z',
    updated_at: '2025-01-04T09:20:00Z'
  },
  {
    id: '7',
    company_id: '7',
    company: DEMO_COMPANIES[6],
    position: 'React Developer',
    status: 'interviewing',
    priority: 'medium',
    application_date: '2024-12-29',
    job_url: 'https://careers.meta.com/react-developer',
    salary_min: 145000,
    salary_max: 195000,
    salary_text: '$145k - $195k + RSUs',
    location: 'Menlo Park, CA',
    job_type: 'Full-time',
    description: 'Build the future of social connection through innovative web applications. Work on React and GraphQL.',
    requirements: 'React, GraphQL, JavaScript/TypeScript, state management, testing frameworks',
    benefits: 'RSUs, health insurance, transportation, free meals, gym membership',
    notes: 'Recruiter reached out on LinkedIn. Initial screening scheduled for next week.',
    created_at: '2024-12-29T14:30:00Z',
    updated_at: '2025-01-03T10:15:00Z'
  },
  {
    id: '8',
    company_id: '8',
    company: DEMO_COMPANIES[7],
    position: 'Cloud Solutions Architect',
    status: 'interviewing',
    priority: 'high',
    application_date: '2024-12-31',
    job_url: 'https://amazon.jobs/cloud-architect',
    salary_min: 170000,
    salary_max: 230000,
    salary_text: '$170k - $230k',
    location: 'Seattle, WA',
    job_type: 'Full-time',
    description: 'Design and implement scalable cloud solutions using AWS services. Lead technical discussions with enterprise clients.',
    requirements: 'AWS certifications, 6+ years cloud experience, microservices, DevOps, leadership skills',
    benefits: 'Stock options, comprehensive benefits, relocation assistance, career development',
    notes: 'Perfect role for my AWS background. Applied on New Year\'s Eve!',
    created_at: '2024-12-31T18:00:00Z',
    updated_at: '2024-12-31T18:00:00Z'
  },
  {
    id: '9',
    company_id: '9',
    company: DEMO_COMPANIES[8],
    position: 'Embedded Software Engineer',
    status: 'interviewing',
    priority: 'medium',
    application_date: '2025-01-04',
    job_url: 'https://tesla.com/careers/embedded-engineer',
    salary_min: 140000,
    salary_max: 180000,
    salary_text: '$140k - $180k + equity',
    location: 'Austin, TX',
    job_type: 'Full-time',
    description: 'Develop software for Tesla vehicles and energy products. Work on autonomous driving and battery management systems.',
    requirements: 'C/C++, embedded systems, real-time programming, automotive experience preferred',
    benefits: 'Stock options, health insurance, employee vehicle discount, relocation assistance',
    notes: 'Excited about working on autonomous vehicles. Phone screening this week.',
    created_at: '2025-01-04T12:00:00Z',
    updated_at: '2025-01-05T09:30:00Z'
  },
  {
    id: '10',
    company_id: '10',
    company: DEMO_COMPANIES[9],
    position: 'Full Stack Developer',
    status: 'interviewing',
    priority: 'low',
    application_date: '2025-01-05',
    job_url: 'https://shopify.com/careers/fullstack',
    salary_min: 120000,
    salary_max: 160000,
    salary_text: '$120k - $160k CAD',
    location: 'Ottawa, ON',
    job_type: 'Full-time',
    description: 'Build merchant-facing tools and customer experiences for Shopify\'s e-commerce platform.',
    requirements: 'Ruby on Rails, React, GraphQL, PostgreSQL, e-commerce experience',
    benefits: 'Health insurance, stock options, flexible work arrangements, learning budget',
    notes: 'Remote-friendly company. Good work-life balance from what I hear.',
    created_at: '2025-01-05T11:00:00Z',
    updated_at: '2025-01-05T11:00:00Z'
  },
  {
    id: '11',
    company_id: '1',
    company: DEMO_COMPANIES[0],
    position: 'Product Manager',
    status: 'interviewing',
    priority: 'high',
    application_date: '2024-12-27',
    job_url: 'https://careers.google.com/product-manager',
    salary_min: 180000,
    salary_max: 250000,
    salary_text: '$180k - $250k + equity',
    location: 'Mountain View, CA',
    job_type: 'Full-time',
    description: 'Lead product strategy for Google Search features. Work with engineers, designers, and data scientists.',
    requirements: 'MBA or equivalent experience, 3+ years PM experience, technical background',
    benefits: 'Comprehensive benefits, stock options, wellness programs',
    notes: 'Transitioning from engineering to PM. Second Google application.',
    created_at: '2024-12-27T16:00:00Z',
    updated_at: '2024-12-27T16:00:00Z'
  },
  {
    id: '12',
    company_id: '2',
    company: DEMO_COMPANIES[1],
    position: 'DevOps Engineer',
    status: 'rejected',
    priority: 'medium',
    application_date: '2024-12-25',
    job_url: 'https://careers.microsoft.com/devops',
    salary_min: 135000,
    salary_max: 175000,
    salary_text: '$135k - $175k',
    location: 'Redmond, WA',
    job_type: 'Full-time',
    description: 'Manage and optimize Azure infrastructure. Build CI/CD pipelines and monitoring systems.',
    requirements: 'Azure, Docker, Kubernetes, Infrastructure as Code, monitoring tools',
    benefits: 'Health insurance, stock purchase plan, flexible schedule',
    notes: 'Unfortunately didn\'t make it past initial screening. Need more Azure experience.',
    rejection_reason: 'Looking for more hands-on Azure experience',
    rejection_feedback: 'Strong candidate overall, but role requires deeper Azure expertise',
    created_at: '2024-12-25T10:00:00Z',
    updated_at: '2025-01-03T14:00:00Z'
  }
]

export const loadDemoData = () => {
  // Clear any existing demo data first
  clearDemoData()
  
  localStorage.setItem('jobtracker_companies', JSON.stringify(DEMO_COMPANIES))
  localStorage.setItem('jobtracker_applications', JSON.stringify(DEMO_APPLICATIONS))
  localStorage.setItem('jobtracker_demo_loaded', 'true')
  
  // Set some demo stats
  localStorage.setItem('jobtracker_current_streak', '7')
  localStorage.setItem('jobtracker_total_applications', '12')
  localStorage.setItem('jobtracker_this_week_applications', '5')
  
  // Create a demo user as well
  const demoUser = {
    id: 'demo-user-1',
    first_name: 'John',
    last_name: 'Developer',
    email: 'john@demo.com',
    daily_goal: 3,
    weekly_goal: 15,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: '2024-12-01T00:00:00Z'
  }
  localStorage.setItem('jobtracker_user', JSON.stringify(demoUser))
  console.log('✅ Demo data loaded: 12 applications across 10 companies')
  console.log('Companies:', DEMO_COMPANIES.length)
  console.log('Applications:', DEMO_APPLICATIONS.length)
}

export const isDemoDataLoaded = () => {
  return localStorage.getItem('jobtracker_demo_loaded') === 'true'
}

export const clearDemoData = () => {
  localStorage.removeItem('jobtracker_companies')
  localStorage.removeItem('jobtracker_applications')
  localStorage.removeItem('jobtracker_demo_loaded')
  localStorage.removeItem('jobtracker_current_streak')
  localStorage.removeItem('jobtracker_total_applications')
  localStorage.removeItem('jobtracker_this_week_applications')
}