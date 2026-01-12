// Job Application Tracker - Background Service Worker
// Handles API communication and extension storage

class JobTrackerBackground {
  constructor() {
    // Production mode - enable API calls
    this.authToken = null;
    this.TESTING_MODE = false;
    this.API_BASE_URL = 'http://localhost:8000';
    
    // Clear any badge immediately
    chrome.action.setBadgeText({ text: '' });
    
    this.setupMessageListeners();
    this.setupInstallListener();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener(() => {
      const mode = this.TESTING_MODE ? 'TESTING MODE (No API calls)' : 'PRODUCTION MODE (API calls enabled)';
      console.log(`🎉 Job Application Tracker v1.0.1 installed - ${mode}`);
      
      // Clear any badge that might be showing
      chrome.action.setBadgeText({ text: '' });
      
      this.initializeExtension();
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'TRACK_JOB':
          await this.trackJob(request.data, sendResponse);
          break;
        case 'GET_STATS':
          await this.getStats(sendResponse);
          break;
        case 'LOGIN':
          await this.login(request.data, sendResponse);
          break;
        case 'LOGOUT':
          await this.logout(sendResponse);
          break;
        case 'CHECK_AUTH':
          await this.checkAuth(sendResponse);
          break;
        case 'ANALYZE_JOB_MATCH':
          await this.analyzeJobMatch(request.data, sendResponse);
          break;
        case 'GET_JOB_INSIGHTS':
          await this.getJobInsights(request.data, sendResponse);
          break;
        case 'OPTIMIZE_APPLICATION':
          await this.optimizeApplication(request.data, sendResponse);
          break;
        case 'GET_RECOMMENDATIONS':
          await this.getJobRecommendations(sendResponse);
          break;
        case 'ping':
          sendResponse({ status: 'pong' });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async initializeExtension() {
    // Load stored auth token
    const stored = await chrome.storage.local.get(['authToken', 'user']);
    if (stored.authToken) {
      this.authToken = stored.authToken;
      console.log('🔐 Loaded stored auth token');
    } else if (this.TESTING_MODE) {
      // For testing: Auto-login with mock credentials
      console.log('🧪 Auto-login for testing mode');
      await this.login({ email: 'test@example.com', password: 'test' }, () => {});
    } else {
      console.log('🔐 No stored auth token - user needs to login');
    }
  }

  async trackJob(jobData, sendResponse) {
    try {
      console.log('🎯 Tracking job:', jobData);
      
      // Clean and validate job data
      const cleanJobData = this.cleanJobData(jobData);
      
      if (this.TESTING_MODE) {
        // Testing mode: Save to local storage
        const stored = await chrome.storage.local.get('tracked_jobs');
        const trackedJobs = stored.tracked_jobs || [];
        
        const newJob = {
          id: Date.now(),
          ...cleanJobData,
          trackedAt: new Date().toISOString()
        };
        
        trackedJobs.push(newJob);
        await chrome.storage.local.set({ tracked_jobs: trackedJobs });
        
        console.log('✅ Job saved locally:', newJob);
        sendResponse({ 
          success: true, 
          data: newJob,
          message: 'Job tracked locally! (Testing mode)'
        });
      } else {
        // Production mode: Send to API
        // Ensure token is loaded from storage
        if (!this.authToken) {
          const stored = await chrome.storage.local.get(['authToken']);
          this.authToken = stored.authToken;
        }
        
        if (!this.authToken) {
          throw new Error('Not authenticated. Please login first.');
        }
        
        const response = await this.makeApiRequest('/api/job-applications/', 'POST', cleanJobData);
        
        if (response.success) {
          console.log('✅ Job saved to backend:', response.data);
          sendResponse({ 
            success: true, 
            data: response.data,
            message: 'Job tracked successfully!'
          });
        } else {
          if (response.error.includes('Not authenticated') || response.error.includes('401') || response.error.includes('Unauthorized')) {
            // Clear invalid token
            console.log('🔐 Authentication expired, clearing token');
            await this.clearAuthData();
            throw new Error('Authentication expired. Please login again.');
          }
          // Ensure error is a string
          const errorMsg = typeof response.error === 'string' ? response.error : 
                          response.error?.message || 
                          response.error?.detail || 
                          JSON.stringify(response.error) || 
                          'Failed to save job';
          throw new Error(errorMsg);
        }
      }
      
    } catch (error) {
      console.error('❌ Error tracking job:', error);
      
      // Ensure we send a string error message, not an object
      let errorMessage;
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle object errors (like validation errors from API)
        if (error.detail) {
          errorMessage = Array.isArray(error.detail) ? error.detail.map(e => e.msg || JSON.stringify(e)).join(', ') : error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else {
        errorMessage = 'Failed to track job';
      }
      
      sendResponse({ success: false, error: errorMessage });
    }
  }

  cleanJobData(jobData) {
    // Truncate source URL if it's too long for database
    let sourceUrl = jobData.sourceUrl || jobData.source_url || null;
    if (sourceUrl && sourceUrl.length > 500) {
      // Try to keep the base URL and job ID if possible
      const url = new URL(sourceUrl);
      const jobId = url.searchParams.get('currentJobId');
      if (jobId) {
        sourceUrl = `${url.origin}${url.pathname}?currentJobId=${jobId}`;
      } else {
        sourceUrl = sourceUrl.substring(0, 500);
      }
    }

    return {
      title: jobData.title || 'Untitled Position',
      company_name: jobData.company_name || jobData.company || 'Unknown Company',
      company_website: jobData.companyUrl || null,
      company_description: null,
      company_industry: jobData.industry || null,
      company_size: jobData.companySize || null,
      location: jobData.location || null,
      location_type: jobData.location_type || null,
      salary_info: jobData.salary_info || null,
      description: jobData.description || null,
      requirements: jobData.requirements || null,
      salary_min: null,
      salary_max: null,
      remote_ok: false,
      job_type: jobData.job_type || jobData.jobType || null,  
      source_url: sourceUrl,
      source_platform: jobData.sourcePlatform || jobData.source_platform || 'other',
      status: 'applied',
      notes: jobData.notes || null
    };
  }

  async makeApiRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.API_BASE_URL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      // Add auth token if available
      if (this.authToken) {
        options.headers.Authorization = `Bearer ${this.authToken}`;
      }

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        // Handle different types of error responses
        let errorMessage;
        if (responseData.detail) {
          if (Array.isArray(responseData.detail)) {
            // Handle validation errors (like Pydantic validation)
            errorMessage = responseData.detail.map(err => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
          } else {
            errorMessage = responseData.detail;
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else {
          errorMessage = `HTTP ${response.status}: API request failed`;
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStats(sendResponse) {
    try {
      if (this.TESTING_MODE) {
        // For testing: Return local stats instead of API
        const stored = await chrome.storage.local.get('tracked_jobs');
        const trackedJobs = stored.tracked_jobs || [];
        
        const stats = {
          total_applications: trackedJobs.length,
          this_week: trackedJobs.filter(job => {
            const jobDate = new Date(job.trackedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return jobDate > weekAgo;
          }).length,
          pending_responses: trackedJobs.length,
          success_rate: trackedJobs.length > 0 ? 25 : 0 // Mock 25% success rate
        };
        
        console.log('📊 Local stats:', stats);
        sendResponse({ success: true, data: stats });
      } else {
        // Production mode: Get stats from API
        const response = await this.makeApiRequest('/api/analytics/summary');
        
        if (response.success) {
          console.log('📊 API stats:', response.data);
          
          // Transform API response to match expected format
          const stats = {
            total_applications: response.data.total_applications || 0,
            current_streak: response.data.current_streak || 0,
            applications_today: response.data.applications_today || 0,
            daily_goal: response.data.daily_goal || 5,
            goal_progress_today: response.data.goal_progress_today || 0,
            recent_applications: response.data.recent_applications || [],
            recent_achievements: response.data.recent_achievements || []
          };
          
          sendResponse({ success: true, data: stats });
        } else {
          throw new Error(response.error || 'Failed to get stats');
        }
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      sendResponse({ success: false, error: error.message || 'Failed to get stats' });
    }
  }

  async login(credentials, sendResponse) {
    try {
      if (this.TESTING_MODE) {
        // Testing mode: Mock login
        console.log('🔐 Mock login for testing:', credentials.email);
        
        const mockUser = {
          email: credentials.email,
          name: credentials.email.split('@')[0],
          id: 'test-user-123'
        };
        
        const mockToken = 'mock-jwt-token-for-testing';
        
        this.authToken = mockToken;
        await chrome.storage.local.set({
          authToken: mockToken,
          user: mockUser
        });

        sendResponse({ 
          success: true, 
          data: {
            access_token: mockToken,
            user: mockUser
          },
          message: 'Logged in successfully! (Testing mode)'
        });
      } else {
        // Production mode: Real API login
        console.log('🔐 Logging in:', credentials.email);
        
        const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          this.authToken = responseData.access_token;
          
          // Get user info
          const userResponse = await this.makeApiRequest('/api/auth/me');
          
          if (userResponse.success) {
            await chrome.storage.local.set({
              authToken: this.authToken,
              user: userResponse.data
            });

            sendResponse({ 
              success: true, 
              data: {
                access_token: this.authToken,
                user: userResponse.data
              },
              message: 'Logged in successfully!'
            });
          } else {
            throw new Error('Failed to get user info');
          }
        } else {
          console.error('Login failed - Response:', responseData);
          const errorMessage = responseData.detail || responseData.message || responseData.error || 'Login failed';
          throw new Error(errorMessage);
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      sendResponse({ success: false, error: error.message || 'Login failed' });
    }
  }

  async logout(sendResponse) {
    try {
      // Clear auth data
      await this.clearAuthData();
      
      console.log('🔐 User logged out successfully');
      sendResponse({ 
        success: true, 
        message: 'Logged out successfully!'
      });
    } catch (error) {
      console.error('Logout error:', error);
      sendResponse({ success: false, error: 'Logout failed' });
    }
  }

  async checkAuth(sendResponse = null) {
    try {
      // Load token from storage if not in memory
      if (!this.authToken) {
        const stored = await chrome.storage.local.get(['authToken']);
        this.authToken = stored.authToken;
      }

      // If no token, definitely not authenticated
      if (!this.authToken) {
        console.log('🔐 No auth token found');
        if (sendResponse) {
          sendResponse({ success: true, authenticated: false });
        }
        return false;
      }

      // In production mode, verify token with backend
      if (!this.TESTING_MODE) {
        try {
          const response = await this.makeApiRequest('/api/auth/me');
          
          if (response.success) {
            console.log('🔐 Token is valid, user authenticated');
            if (sendResponse) {
              sendResponse({ 
                success: true, 
                authenticated: true,
                user: response.data
              });
            }
            return true;
          } else {
            // Token is invalid, clear it
            console.log('🔐 Token validation failed, clearing stored token');
            await this.clearAuthData();
            if (sendResponse) {
              sendResponse({ success: true, authenticated: false });
            }
            return false;
          }
        } catch (error) {
          console.error('🔐 Token validation error:', error);
          // Network error, assume token might still be valid for now
          if (sendResponse) {
            sendResponse({ success: true, authenticated: !!this.authToken });
          }
          return !!this.authToken;
        }
      } else {
        // Testing mode: Just check if token exists
        const isValid = !!this.authToken;
        console.log('🔐 Auth check (testing mode):', isValid ? 'Authenticated' : 'Not authenticated');
        if (sendResponse) {
          sendResponse({ success: true, authenticated: isValid });
        }
        return isValid;
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: 'Auth check failed' });
      }
      return false;
    }
  }

  async clearAuthData() {
    this.authToken = null;
    await chrome.storage.local.remove(['authToken', 'user']);
    console.log('🔐 Cleared auth data from storage');
  }

  // API request function removed for testing mode
  // All API calls now use mock data

  async updateLocalStats() {
    try {
      // For testing: Generate mock stats and save locally
      const stored = await chrome.storage.local.get('tracked_jobs');
      const trackedJobs = stored.tracked_jobs || [];
      
      const stats = {
        total_applications: trackedJobs.length,
        this_week: trackedJobs.filter(job => {
          const jobDate = new Date(job.trackedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return jobDate > weekAgo;
        }).length,
        pending_responses: trackedJobs.length,
        success_rate: trackedJobs.length > 0 ? 25 : 0
      };
      
      await chrome.storage.local.set({ stats });
      console.log('📊 Updated local stats:', stats);
      
    } catch (error) {
      console.error('Error updating local stats:', error);
    }
  }

  async analyzeJobMatch(data, sendResponse) {
    try {
      // For testing: Return mock AI analysis
      const mockAnalysis = {
        match_score: Math.floor(Math.random() * 40) + 60, // 60-100% match
        strengths: [
          'Strong technical background',
          'Relevant experience in the field',
          'Good cultural fit'
        ],
        improvements: [
          'Consider highlighting specific project achievements',
          'Add more keywords from the job description'
        ],
        recommendation: 'High priority - strong match for your profile'
      };
      
      console.log('🤖 Mock AI Analysis:', mockAnalysis);
      sendResponse({ success: true, data: mockAnalysis });
      
    } catch (error) {
      console.error('Error analyzing job match:', error);
      sendResponse({ success: false, error: 'Failed to analyze job match' });
    }
  }

  async getJobInsights(data, sendResponse) {
    try {
      // For testing: Return mock insights
      const mockInsights = {
        market_trends: 'Software engineering roles are in high demand with 15% growth this quarter',
        salary_insights: 'Average salary for this role is 10% above market rate',
        competition_level: 'Medium competition - apply within 3 days for best results',
        success_tips: [
          'Customize your resume for this specific role',
          'Mention relevant technologies in your cover letter',
          'Follow up within one week of applying'
        ]
      };
      
      console.log('💡 Mock Job Insights:', mockInsights);
      sendResponse({ success: true, data: mockInsights });
      
    } catch (error) {
      console.error('Error getting job insights:', error);
      sendResponse({ success: false, error: 'Failed to get insights' });
    }
  }

  async optimizeApplication(data, sendResponse) {
    try {
      // For testing: Return mock optimization suggestions
      const mockOptimization = {
        resume_suggestions: [
          'Add more quantifiable achievements (e.g., "Increased efficiency by 30%")',
          'Include relevant keywords from the job description',
          'Highlight leadership experience more prominently'
        ],
        cover_letter_improvements: [
          'Start with a stronger opening that mentions the company specifically',
          'Connect your experience more directly to their requirements',
          'End with a clear call to action'
        ],
        overall_score: 78,
        priority_changes: 'Focus on quantifying your achievements with specific metrics'
      };
      
      console.log('⚡ Mock Application Optimization:', mockOptimization);
      sendResponse({ success: true, data: mockOptimization });
      
    } catch (error) {
      console.error('Error optimizing application:', error);
      sendResponse({ success: false, error: 'Failed to optimize application' });
    }
  }

  async getJobRecommendations(sendResponse) {
    try {
      // For testing: Return mock job recommendations
      const mockRecommendations = {
        recommendations: [
          {
            title: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            match_score: 92,
            reason: 'Perfect match for your JavaScript and React skills',
            url: 'https://example.com/job1'
          },
          {
            title: 'Full Stack Developer',
            company: 'StartupXYZ',
            match_score: 87,
            reason: 'Great opportunity to use your full-stack experience',
            url: 'https://example.com/job2'
          },
          {
            title: 'Frontend Engineer',
            company: 'BigTech Co.',
            match_score: 84,
            reason: 'Excellent fit for your UI/UX background',
            url: 'https://example.com/job3'
          }
        ],
        total_count: 15,
        search_tips: 'Consider expanding your search to include remote opportunities'
      };
      
      console.log('🎯 Mock Job Recommendations:', mockRecommendations);
      sendResponse({ success: true, data: mockRecommendations });
      
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      sendResponse({ success: false, error: 'Failed to get recommendations' });
    }
  }
}

// Initialize background script
new JobTrackerBackground();