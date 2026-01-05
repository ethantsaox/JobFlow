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
    application_date: '2024-12-15',
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
    interview_date: '2024-12-20',
    interview_time: '14:00',
    interview_type: 'virtual',
    interview_notes: 'Technical interview with the team lead. Focus on system design and algorithms.',
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-18T15:30:00Z'
  },
  {
    id: '2',
    company_id: '2',
    company: DEMO_COMPANIES[1],
    position: 'Full Stack Developer',
    status: 'applied',
    priority: 'medium',
    application_date: '2024-12-10',
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
    created_at: '2024-12-10T09:00:00Z',
    updated_at: '2024-12-10T09:00:00Z'
  },
  {
    id: '3',
    company_id: '3',
    company: DEMO_COMPANIES[2],
    position: 'Frontend Engineer',
    status: 'offer',
    priority: 'high',
    application_date: '2024-11-25',
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
    offer_deadline: '2024-12-22',
    created_at: '2024-11-25T11:00:00Z',
    updated_at: '2024-12-17T16:45:00Z'
  },
  {
    id: '4',
    company_id: '4',
    company: DEMO_COMPANIES[3],
    position: 'Backend Engineer',
    status: 'rejected',
    priority: 'medium',
    application_date: '2024-11-20',
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
    created_at: '2024-11-20T14:00:00Z',
    updated_at: '2024-12-05T10:15:00Z'
  },
  {
    id: '5',
    company_id: '5',
    company: DEMO_COMPANIES[4],
    position: 'Software Engineer II',
    status: 'applied',
    priority: 'low',
    application_date: '2024-12-12',
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
    created_at: '2024-12-12T13:30:00Z',
    updated_at: '2024-12-12T13:30:00Z'
  },
  {
    id: '6',
    company_id: '1',
    company: DEMO_COMPANIES[0],
    position: 'Product Manager',
    status: 'interviewing',
    priority: 'high',
    application_date: '2024-12-08',
    job_url: 'https://careers.google.com/jobs/results/pm-456',
    salary_min: 180000,
    salary_max: 250000,
    salary_text: '$180k - $250k',
    location: 'Mountain View, CA',
    job_type: 'Full-time',
    description: 'Lead product strategy for Google Search features. Work with engineers, designers, and data scientists.',
    requirements: 'MBA or equivalent experience, 3+ years PM experience, technical background',
    benefits: 'Comprehensive benefits, stock options, wellness programs',
    notes: 'Transitioning from engineering to PM. Really excited about this opportunity.',
    interview_date: '2024-12-19',
    interview_time: '10:00',
    interview_type: 'onsite',
    interview_notes: 'Product sense interview with senior PM. Will cover case studies.',
    created_at: '2024-12-08T16:00:00Z',
    updated_at: '2024-12-16T09:20:00Z'
  }
]

export const loadDemoData = () => {
  localStorage.setItem('jobtracker_companies', JSON.stringify(DEMO_COMPANIES))
  localStorage.setItem('jobtracker_applications', JSON.stringify(DEMO_APPLICATIONS))
  localStorage.setItem('jobtracker_demo_loaded', 'true')
  
  // Set some demo stats
  localStorage.setItem('jobtracker_current_streak', '5')
  localStorage.setItem('jobtracker_total_applications', '6')
  localStorage.setItem('jobtracker_this_week_applications', '3')
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