// LinkedIn Job Data Extraction Debug Script
// Run this in the browser console on a LinkedIn job page to test extraction

console.log('🔍 LinkedIn Job Extraction Debug Script');
console.log('Current URL:', window.location.href);

// Company name selectors (in order of preference) - Updated with new patterns
const companySelectors = [
  // Top header company name (newest LinkedIn layout)
  '.job-details-top-card__company-name',
  '.job-details-top-card__company-name a',
  '.job-details-top-card__company-url',
  'h4.job-details-top-card__company-name',
  
  // Header breadcrumb patterns
  '.job-details-top-card .t-16.t-black.t-normal',
  '.job-details-top-card .org-top-card-summary__title',
  '.job-details-top-card .org-top-card-summary-info-list__info-item:first-child',
  
  // Modern LinkedIn selectors (2024+)
  '.job-details-jobs-unified-top-card__company-name a',
  '.job-details-jobs-unified-top-card__company-name',
  '.jobs-unified-top-card__company-name a',
  '.jobs-unified-top-card__company-name',
  
  // Alternative patterns
  '.jobs-unified-top-card__subtitle-primary-grouping a',
  '.jobs-unified-top-card__subtitle-primary-grouping',
  '.jobs-unified-top-card__primary-description a',
  '.job-details-jobs-unified-top-card__primary-description a',
  
  // Data attributes and fallbacks
  'a[data-test-id="company-name"]',
  'a[data-tracking-control-name*="company"]',
  '.jobs-poster__name',
  '.jobs-details-top-card__company-info a',
  
  // Generic patterns
  '.t-black .t-normal',
  '.jobs-unified-top-card .ember-view a[href*="/company/"]',
  '.jobs-search__job-details--container .jobs-unified-top-card__company-name',
  'a[href*="/company/"]:not([href*="/jobs/"]):not([href*="/posts/"])',
  
  // Breadcrumb and navigation patterns  
  '.job-details__company-name',
  '.jobs-company__company-name',
  '.jobs-unified-top-card__subtitle a'
];

// Test each selector
console.log('\n📋 Testing Company Name Selectors:');
console.log('=' * 50);

let foundCompany = null;
companySelectors.forEach((selector, index) => {
  const element = document.querySelector(selector);
  const text = element ? element.textContent.trim() : null;
  
  const status = text ? '✅' : '❌';
  console.log(`${index + 1}. ${status} "${selector}"`);
  
  if (text && text.length > 0) {
    console.log(`   Text: "${text}"`);
    if (!foundCompany) {
      foundCompany = text;
    }
  }
});

console.log('\n🏢 Best Company Result:', foundCompany || 'NOT FOUND');

// Test header extraction
console.log('\n🎯 Header Extraction Test:');
const headerSelectors = [
  'header h1', 'header h2', 'header h3', 'header h4',
  '.artdeco-entity-lockup__title', 
  '.org-top-card-summary__title',
  '.top-card-layout__title',
  '.job-details-top-card h1',
  '.job-details-top-card h2', 
  '.job-details-top-card h3',
  '.job-details-top-card h4'
];

headerSelectors.forEach((selector, index) => {
  const element = document.querySelector(selector);
  const text = element ? element.textContent.trim() : null;
  
  const status = text ? '✅' : '❌';
  console.log(`${index + 1}. ${status} "${selector}"`);
  
  if (text && text.length > 0) {
    console.log(`   Text: "${text}"`);
  }
});

// Test page title extraction
console.log('\n📄 Page Title Test:');
console.log('Page title:', document.title);
const titleMatch = document.title.match(/^([^|]+)\s*\|/);
if (titleMatch) {
  console.log('✅ Extracted from title:', titleMatch[1].trim());
} else {
  console.log('❌ No company pattern found in title');
}

// Test URL extraction
console.log('\n🔗 URL-based extraction:');
const urlMatch = window.location.href.match(/\/company\/([^\/\?]+)/);
if (urlMatch) {
  const urlCompany = decodeURIComponent(urlMatch[1]).replace(/-/g, ' ');
  console.log('✅ Company from URL:', urlCompany);
} else {
  console.log('❌ No company found in URL');
}

// Test company links
console.log('\n🔗 Company Link Analysis:');
const companyLinks = document.querySelectorAll('a[href*="/company/"]');
console.log(`Found ${companyLinks.length} company links:`);

companyLinks.forEach((link, index) => {
  const text = link.textContent.trim();
  const href = link.getAttribute('href');
  if (index < 10) { // Show first 10 only
    console.log(`${index + 1}. "${text}" → ${href}`);
  }
});

// Test job title extraction
console.log('\n📝 Job Title Test:');
const titleSelectors = [
  '.jobs-unified-top-card__job-title h1',
  '.jobs-unified-top-card__job-title',
  '.job-details-jobs-unified-top-card__job-title h1',
  '.job-details-jobs-unified-top-card__job-title',
  'h1[data-test-id="job-title"]',
  '.t-24.t-bold',
  'h1.jobs-unified-top-card__job-title'
];

let foundTitle = null;
titleSelectors.forEach((selector, index) => {
  const element = document.querySelector(selector);
  const text = element ? element.textContent.trim() : null;
  
  if (text && !foundTitle) {
    foundTitle = text;
    console.log(`✅ Title found with selector ${index + 1}: "${text}"`);
  }
});

console.log('\n📋 Final Results:');
console.log('====================');
console.log('Job Title:', foundTitle || 'NOT FOUND');
console.log('Company:', foundCompany || 'NOT FOUND');
console.log('URL:', window.location.href);

// Extension test
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('\n🧪 Testing Extension Message:');
  chrome.runtime.sendMessage({action: 'EXTRACT_JOB_DATA'}, (response) => {
    console.log('Extension Response:', response);
  });
} else {
  console.log('\n❌ Extension not available or not installed');
}

console.log('\n✅ Debug script complete!');