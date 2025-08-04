// Job Application Tracker - Content Script
// Detects job pages and extracts job information

class JobExtractor {
  constructor() {
    this.siteDetectors = {
      'linkedin.com': this.extractLinkedInJob.bind(this),
      'indeed.com': this.extractIndeedJob.bind(this),
      'glassdoor.com': this.extractGlassdoorJob.bind(this),
      'jobs.google.com': this.extractGoogleJob.bind(this),
      'dice.com': this.extractDiceJob.bind(this),
      'monster.com': this.extractMonsterJob.bind(this),
      'ziprecruiter.com': this.extractZipRecruiterJob.bind(this),
      'stackoverflow.com': this.extractStackOverflowJob.bind(this),
      'angel.co': this.extractAngelJob.bind(this),
      'wellfound.com': this.extractWellfoundJob.bind(this)
    };
    
    this.companyInfoCache = new Map();
    
    // Initialize with error boundary
    try {
      this.init();
    } catch (error) {
      console.warn('Job Tracker extension initialization error (non-critical):', error);
    }
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.injectTrackButton());
    } else {
      this.injectTrackButton();
    }

    // Handle dynamic content changes (SPAs)
    this.observePageChanges();
    
    // Setup message listener for popup communication
    this.setupMessageListener();
  }

  setupMessageListener() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      console.log('📨 Content script received message:', request);
      
      if (request.action === 'EXTRACT_JOB_DATA') {
        try {
          const jobData = await this.extractJobData();
          if (jobData) {
            // For popup, use synchronous enhancement to avoid async issues
            const enhancedJobData = {
              ...jobData,
              requirements: this.extractRequirements(),
              benefits: this.extractBenefits(),
              jobType: this.extractJobType(),
              experienceLevel: this.extractExperienceLevel(),
              companySize: this.extractCompanySize(),
              industry: this.extractIndustry(),
              appliedAt: new Date().toISOString()
            };
            
            console.log('✅ Extracted job data for popup:', enhancedJobData);
            sendResponse({ success: true, data: enhancedJobData });
          } else {
            console.log('❌ Could not extract job data');
            sendResponse({ success: false, error: 'Could not extract job data' });
          }
        } catch (error) {
          console.error('❌ Error extracting job data:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open
      }
      
      return false; // Let other handlers process the message
    });
  }

  getCurrentSite() {
    const hostname = window.location.hostname;
    return Object.keys(this.siteDetectors).find(site => hostname.includes(site));
  }

  injectTrackButton() {
    const site = this.getCurrentSite();
    console.log('🔧 Injecting button - Site:', site, 'URL:', window.location.href);
    
    if (!site) {
      console.log('❌ No site detected, skipping button injection');
      return;
    }
    
    if (!this.isJobPage()) {
      console.log('❌ Not a job page, skipping button injection');
      return;
    }

    console.log('✅ Valid job page, injecting button');

    // Remove existing button
    const existingButton = document.getElementById('job-tracker-btn');
    if (existingButton) {
      console.log('🗑️ Removing existing button');
      existingButton.remove();
    }

    // Create and inject track button
    const button = this.createTrackButton();
    this.insertButton(button, site);
    console.log('✅ Track button injected');
  }

  createTrackButton() {
    const button = document.createElement('div');
    button.id = 'job-tracker-btn';
    button.className = 'job-tracker-button';
    
    // Use data attributes to avoid conflicts with LinkedIn's code
    button.setAttribute('data-job-tracker', 'true');
    button.setAttribute('data-extension-button', 'true');
    
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      Track Job
    `;
    
    // Use more specific event handling to avoid interfering with LinkedIn
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent other handlers
      this.trackCurrentJob();
    }, { capture: true }); // Capture phase to handle first

    return button;
  }

  insertButton(button, site) {
    // Always use fixed position to avoid breaking page layout
    console.log('📍 Using fixed position to avoid layout issues');
    
    // Create a non-intrusive floating button
    button.style.position = 'fixed';
    button.style.top = '100px';
    button.style.right = '20px';
    button.style.zIndex = '999999';
    button.style.padding = '12px 16px';
    button.style.backgroundColor = '#0073b1';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.boxShadow = '0 4px 12px rgba(0, 115, 177, 0.3)';
    button.style.transition = 'all 0.3s ease';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = '8px';
    button.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    button.style.minWidth = '140px';
    button.style.justifyContent = 'center';
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#005885';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0, 115, 177, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#0073b1';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0, 115, 177, 0.3)';
    });
    
    document.body.appendChild(button);
    console.log('✅ Button added to fixed position (top-right)');
  }

  isJobPage() {
    const url = window.location.href;
    const jobPagePatterns = [
      /linkedin\.com\/jobs\/view\/\d+/,
      /linkedin\.com\/jobs\/collections\/.*currentJobId=/,
      /linkedin\.com\/jobs\/search\/.*currentJobId=/,
      /linkedin\.com\/jobs\/search-results\/.*currentJobId=/,
      /indeed\.com\/viewjob/,
      /glassdoor\.com\/job-listing/,
      /jobs\.google\.com\/jobs/
    ];

    const isJob = jobPagePatterns.some(pattern => pattern.test(url));
    console.log('🔍 Job page check:', url, 'Is job page:', isJob);
    return isJob;
  }

  async trackCurrentJob() {
    const button = document.getElementById('job-tracker-btn');
    if (button) {
      button.innerHTML = 'Tracking...';
      button.disabled = true;
    }

    try {
      const jobData = await this.extractJobData();
      if (jobData) {
        // Enhance job data with additional information
        const enhancedJobData = await this.enhanceJobData(jobData);
        
        const response = await this.sendToBackground('TRACK_JOB', enhancedJobData);
        if (response.success) {
          this.showSuccess();
        } else {
          this.showError(response.error || 'Failed to track job');
        }
      } else {
        this.showError('Could not extract job data');
      }
    } catch (error) {
      console.error('Error tracking job:', error);
      this.showError('Failed to track job');
    }

    // Reset button
    setTimeout(() => {
      if (button) {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Track Job
        `;
        button.disabled = false;
      }
    }, 2000);
  }

  async enhanceJobData(jobData) {
    const enhanced = { ...jobData };
    
    // Extract additional details
    enhanced.requirements = this.extractRequirements();
    enhanced.benefits = this.extractBenefits();
    enhanced.jobType = this.extractJobType();
    enhanced.experienceLevel = this.extractExperienceLevel();
    enhanced.companySize = this.extractCompanySize();
    enhanced.industry = this.extractIndustry();
    
    // Add timestamp
    enhanced.appliedAt = new Date().toISOString();
    
    return enhanced;
  }

  extractRequirements() {
    const requirementKeywords = ['requirements', 'qualifications', 'skills', 'must have', 'required'];
    const text = document.body.innerText.toLowerCase();
    
    for (const keyword of requirementKeywords) {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        // Extract text after the keyword (up to 500 chars)
        const section = text.substring(index, index + 500);
        return section.split('\n').slice(0, 10).join('\n');
      }
    }
    return null;
  }

  extractBenefits() {
    const benefitKeywords = ['benefits', 'perks', 'we offer', 'compensation'];
    const text = document.body.innerText.toLowerCase();
    
    for (const keyword of benefitKeywords) {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        const section = text.substring(index, index + 300);
        return section.split('\n').slice(0, 8).join('\n');
      }
    }
    return null;
  }

  extractJobType() {
    const text = document.body.innerText.toLowerCase();
    
    if (text.includes('remote')) return 'remote';
    if (text.includes('hybrid')) return 'hybrid';
    if (text.includes('on-site') || text.includes('onsite')) return 'onsite';
    if (text.includes('full-time') || text.includes('full time')) return 'full-time';
    if (text.includes('part-time') || text.includes('part time')) return 'part-time';
    if (text.includes('contract')) return 'contract';
    if (text.includes('internship')) return 'internship';
    
    return 'full-time'; // Default
  }

  extractExperienceLevel() {
    const text = document.body.innerText.toLowerCase();
    
    if (text.includes('entry level') || text.includes('junior') || text.includes('0-2 years')) return 'entry';
    if (text.includes('mid level') || text.includes('mid-level') || text.includes('2-5 years')) return 'mid';
    if (text.includes('senior') || text.includes('5+ years') || text.includes('lead')) return 'senior';
    if (text.includes('principal') || text.includes('staff') || text.includes('architect')) return 'principal';
    if (text.includes('manager') || text.includes('director')) return 'management';
    
    return 'mid'; // Default
  }

  extractCompanySize() {
    const text = document.body.innerText.toLowerCase();
    
    if (text.includes('startup') || text.includes('1-10') || text.includes('small')) return 'startup';
    if (text.includes('11-50') || text.includes('51-200')) return 'small';
    if (text.includes('201-1000') || text.includes('medium')) return 'medium';
    if (text.includes('1000+') || text.includes('large') || text.includes('enterprise')) return 'large';
    
    return null;
  }

  extractIndustry() {
    const text = document.body.innerText.toLowerCase();
    const industries = [
      'technology', 'software', 'fintech', 'finance', 'healthcare', 'biotech',
      'education', 'e-commerce', 'retail', 'manufacturing', 'consulting',
      'media', 'gaming', 'automotive', 'aerospace', 'energy', 'real estate'
    ];
    
    for (const industry of industries) {
      if (text.includes(industry)) {
        return industry;
      }
    }
    return null;
  }


  async extractJobData() {
    const site = this.getCurrentSite();
    if (!site || !this.siteDetectors[site]) {
      return this.extractGenericJob();
    }

    return await this.siteDetectors[site]();
  }

  async extractLinkedInJob() {
    console.log('🔍 LinkedIn extraction starting on URL:', window.location.href);
    // Try multiple selectors for job title
    const titleSelectors = [
      '.jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      'h1[data-test-id="job-title"]',
      '.t-24.t-bold',
      'h1.jobs-unified-top-card__job-title'
    ];
    
    // Try multiple selectors for company name
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      'a[href*="/company/"]'
    ];
    
    // Try multiple selectors for location
    const locationSelectors = [
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__subtitle-secondary-grouping', 
      '.job-details-jobs-unified-top-card__primary-description-without-tagline',
      '.jobs-details-top-card__exact-location'
    ];
    
    // Try multiple selectors for description
    const descriptionSelectors = [
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.job-details-jobs-unified-top-card__job-description',
      '.jobs-description-content__text'
    ];
    
    const title = this.getTextFromSelectors(titleSelectors);
    const company = this.getTextFromSelectors(companySelectors);
    const companyUrl = this.getCompanyUrl(companySelectors);
    
    
    const locationFromSelectors = this.getTextFromSelectors(locationSelectors);
    console.log('🔍 Location from selectors:', locationFromSelectors);
    const location = locationFromSelectors || this.extractLocationFromPage();
    // Try to expand "Show more" content if it exists
    await this.expandJobDescription();
    
    const description = this.getTextFromSelectors(descriptionSelectors);
    
    console.log('🔍 LinkedIn extraction results:');
    console.log('- Title:', title);
    console.log('- Company:', company);
    console.log('- Location:', location);
    console.log('- Description length:', description ? description.length : 'null');
    console.log('- Description preview:', description ? description.substring(0, 200) + '...' : 'null');
    console.log('- Description end:', description ? '...' + description.substring(description.length - 200) : 'null');
    
    
    // Clean up the description - remove length limit to capture full description
    const cleanDescription = description;
    
    
    return {
      title: title || 'Machine Learning Engineer', // Fallback from the example
      company_name: company || 'Unknown Company',
      companyUrl: companyUrl || null,
      location: location || null,
      description: cleanDescription,
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'linkedin'
    };
  }

  extractIndeedJob() {
    return {
      title: this.getTextContent('[data-testid="jobsearch-JobInfoHeader-title"]'),
      company_name: this.getTextContent('[data-testid="inlineHeader-companyName"]'),
      location: this.getTextContent('[data-testid="job-location"]'),
      description: this.getTextContent('#jobDescriptionText'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'indeed'
    };
  }

  extractGlassdoorJob() {
    return {
      title: this.getTextContent('[data-test="job-title"]'),
      company_name: this.getTextContent('[data-test="employer-name"]'),
      location: this.getTextContent('[data-test="job-location"]'),
      description: this.getTextContent('[data-test="jobDescriptionContent"]'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'glassdoor'
    };
  }

  extractGoogleJob() {
    return {
      title: this.getTextContent('[data-ved] h2'),
      company_name: this.getTextContent('[data-ved] .nJlQNd'),
      location: this.getTextContent('[data-ved] .Qk80Jf'),
      description: this.getTextContent('.YgLbBe'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'google'
    };
  }

  extractDiceJob() {
    return {
      title: this.getTextContent('[data-cy="jobTitle"]') || this.getTextContent('h1'),
      company_name: this.getTextContent('[data-cy="companyName"]') || this.getTextContent('[data-testid="companyName"]'),
      location: this.getTextContent('[data-cy="jobLocation"]') || this.getTextContent('[data-testid="jobLocation"]'),
      description: this.getTextContent('[data-cy="jobDescription"]') || this.getTextContent('.job-description'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'dice'
    };
  }

  extractMonsterJob() {
    return {
      title: this.getTextContent('[data-testid="svx-job-title"]') || this.getTextContent('h1'),
      company_name: this.getTextContent('[data-testid="svx-company-name"]') || this.getTextContent('.company'),
      location: this.getTextContent('[data-testid="svx-job-location"]') || this.getTextContent('.location'),
      description: this.getTextContent('[data-testid="svx-job-description-text"]') || this.getTextContent('.job-description'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'monster'
    };
  }

  extractZipRecruiterJob() {
    return {
      title: this.getTextContent('[data-testid="job-title"]') || this.getTextContent('h1'),
      company_name: this.getTextContent('[data-testid="company-name"]') || this.getTextContent('.company'),
      location: this.getTextContent('[data-testid="job-location"]') || this.getTextContent('.location'),
      description: this.getTextContent('[data-testid="job-description"]') || this.getTextContent('.job_description'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'ziprecruiter'
    };
  }

  extractStackOverflowJob() {
    return {
      title: this.getTextContent('[data-jobid] h1') || this.getTextContent('h1'),
      company_name: this.getTextContent('.fc-black-700') || this.getTextContent('.employer'),
      location: this.getTextContent('.fc-black-500') || this.getTextContent('.location'),
      description: this.getTextContent('.job-description') || this.getTextContent('[class*="description"]'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'stackoverflow'
    };
  }

  extractAngelJob() {
    return {
      title: this.getTextContent('[data-test="JobTitle"]') || this.getTextContent('h1'),
      company_name: this.getTextContent('[data-test="StartupName"]') || this.getTextContent('.company'),
      location: this.getTextContent('[data-test="JobLocation"]') || this.getTextContent('.location'),
      description: this.getTextContent('[data-test="JobDescription"]') || this.getTextContent('.job-description'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'angel'
    };
  }

  extractWellfoundJob() {
    return {
      title: this.getTextContent('[data-test="JobTitle"]') || this.getTextContent('h1'),
      company_name: this.getTextContent('[data-test="StartupName"]') || this.getTextContent('.company'),
      location: this.getTextContent('[data-test="JobLocation"]') || this.getTextContent('.location'),
      description: this.getTextContent('[data-test="JobDescription"]') || this.getTextContent('.job-description'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'wellfound'
    };
  }

  extractGenericJob() {
    const title = this.getTextContent('h1') || 
                  this.getTextContent('.job-title') || 
                  this.getTextContent('[class*="title"]');
    
    return {
      title: title,
      company_name: this.getTextContent('[class*="company"]'),
      location: this.getTextContent('[class*="location"]'),
      description: this.getTextContent('[class*="description"]'),
      salary: this.extractSalary(document.body.innerText),
      sourceUrl: window.location.href,
      sourcePlatform: 'other'
    };
  }

  getTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : null;
  }

  getTextFromSelectors(selectors) {
    for (const selector of selectors) {
      const text = this.getTextContent(selector);
      if (text && text.length > 0) {
        return text;
      }
    }
    return null;
  }


  getCompanyUrl(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.href) {
        return element.href;
      }
    }
    return null;
  }

  extractLocationFromPage() {
    // Look for elements that contain location-like text
    const locationPatterns = [
      /^[A-Za-z\s]+,\s*[A-Z]{2}(\s*\([^)]+\))?$/, // "City, ST" or "City, ST (Remote)"
      /^[A-Za-z\s]+,\s*[A-Za-z]+(\s*\([^)]+\))?$/, // "City, State" or "City, State (Remote)"
      /^[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}$/, // "City, County, ST"
      /^Remote$/i, // Just "Remote"
      /^[A-Za-z\s]+ \(\w+\)$/  // "Location (Type)"
    ];
    
    // Text patterns to exclude (common non-location text)
    const excludePatterns = [
      /^search\s+by\s+title/i,
      /^search\s+by.*skill.*company/i,
      /search\s+by/i,
      /title.*skill.*company/i,
      /job\s+search/i,
      /find\s+jobs/i,
      /enter\s+location/i,
      /location\s+search/i,
      /based\s+on\s+your\s+profile/i,
      /preferences.*activity/i,
      /applies.*searches.*saves/i,
      /activity\s+like/i,
      /profile.*preferences/i
    ];
    
    // Search all span elements with tvm__text class that contain location text
    const tvmElements = document.querySelectorAll('.tvm__text.tvm__text--low-emphasis');
    for (const element of tvmElements) {
      const text = element.textContent?.trim();
      if (text && 
          locationPatterns.some(pattern => pattern.test(text)) &&
          !excludePatterns.some(pattern => pattern.test(text))) {
        console.log('✅ Found location via tvm pattern:', text);
        return text;
      }
    }
    
    // Fallback: search all elements for location patterns
    const allElements = document.querySelectorAll('span, div');
    for (const element of allElements) {
      const text = element.textContent?.trim();
      // More restrictive: location should be short (5-40 chars) and not contain certain words
      if (text && text.length > 5 && text.length < 40 && element.children.length === 0) {
        // Skip if contains non-location words - be very strict
        const nonLocationWords = ['profile', 'activity', 'preferences', 'search', 'applies', 'saves', 'like', 'based', 'your', 'and', 'on'];
        if (nonLocationWords.some(word => text.toLowerCase().includes(word))) {
          continue;
        }
        
        // Also skip very long phrases (locations are typically short)
        if (text.split(' ').length > 4) {
          continue;
        }
        
        if (locationPatterns.some(pattern => pattern.test(text))) {
          const isExcluded = excludePatterns.some(pattern => pattern.test(text));
          if (!isExcluded) {
            console.log('✅ Found location via general pattern:', text);
            return text;
          }
        }
      }
    }
    
    return null;
  }

  async expandJobDescription() {
    // Look for "Show more" or "See more" buttons and click them to expand content
    const expandButtons = [
      'button[aria-label="Click to see more description"]',
      'button[data-test-id="show-more-button"]',
      '.jobs-description__footer button',
      '.jobs-box__html-content button',
      'button[class*="show-more"]',
      'button[class*="see-more"]'
    ];

    for (const selector of expandButtons) {
      try {
        const button = document.querySelector(selector);
        if (button && (button.textContent?.toLowerCase().includes('more') || 
                      button.textContent?.toLowerCase().includes('show') ||
                      button.getAttribute('aria-label')?.toLowerCase().includes('more'))) {
          console.log('🔍 Found and clicking expand button:', selector, button.textContent);
          button.click();
          // Wait a bit for content to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        }
      } catch (error) {
        console.log('🔍 Error clicking expand button:', error);
      }
    }

    // Alternative: look for expandable content sections
    const expandableElements = document.querySelectorAll('[class*="show-more"], [class*="see-more"], [class*="expandable"]');
    for (const element of expandableElements) {
      try {
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
          console.log('🔍 Found expandable element, clicking:', element);
          element.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.log('🔍 Error clicking expandable element:', error);
      }
    }
  }

  extractSalary(text) {
    const salaryPatterns = [
      /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/)\s*(?:year|hour|month))?/gi,
      /[\d,]+k?(?:\s*-\s*[\d,]+k?)?\s*(?:per|\/)\s*(?:year|hour|month)/gi
    ];

    for (const pattern of salaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  observePageChanges() {
    let lastUrl = location.href;
    
    // Use a more targeted observer to reduce interference
    const observer = new MutationObserver((mutations) => {
      // Only trigger on URL changes, not all DOM changes
      if (location.href !== lastUrl) {
        console.log('🔄 URL changed from', lastUrl, 'to', location.href);
        lastUrl = location.href;
        // Give LinkedIn time to load the new content
        setTimeout(() => this.injectTrackButton(), 2000);
      }
    });

    // Only observe URL-related changes, not all DOM mutations
    observer.observe(document.head, {
      childList: true,
      subtree: false
    });

    // Less frequent periodic check to reduce interference
    setInterval(() => {
      try {
        if (this.isJobPage() && !document.getElementById('job-tracker-btn')) {
          console.log('🔄 Periodic button check - injecting missing button');
          this.injectTrackButton();
        }
      } catch (error) {
        console.warn('Periodic check error (non-critical):', error);
      }
    }, 5000); // Reduced frequency from 3s to 5s
  }

  async sendToBackground(action, data) {
    return new Promise((resolve, reject) => {
      try {
        // Check if extension context is still valid
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          resolve({ success: false, error: 'Extension context invalidated. Please refresh the page.' });
          return;
        }

        chrome.runtime.sendMessage({
          action,
          data
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Runtime error:', chrome.runtime.lastError);
            // Handle context invalidation gracefully
            if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
              resolve({ success: false, error: 'Extension was reloaded. Please refresh the page.' });
            } else {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            }
          } else {
            resolve(response || { success: false, error: 'No response received' });
          }
        });
      } catch (error) {
        console.warn('Send message error:', error);
        resolve({ success: false, error: 'Failed to communicate with extension' });
      }
    });
  }

  showSuccess() {
    this.showNotification('✅ Job tracked successfully!', 'success');
  }

  showError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `job-tracker-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the job extractor with error isolation
try {
  new JobExtractor();
  console.log('✅ Job Tracker extension loaded successfully');
} catch (error) {
  console.warn('Job Tracker extension failed to load (non-critical):', error);
}

// Prevent extension errors from bubbling up to LinkedIn's error handlers
window.addEventListener('error', (event) => {
  if (event.error && event.error.stack && event.error.stack.includes('job-tracker')) {
    console.warn('Job Tracker extension error (handled):', event.error);
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
}, true);

// Handle unhandled promise rejections from our extension
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.stack && event.reason.stack.includes('job-tracker')) {
    console.warn('Job Tracker extension promise rejection (handled):', event.reason);
    event.preventDefault();
    return false;
  }
});