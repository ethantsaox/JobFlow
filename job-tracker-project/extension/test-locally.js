// Quick test script to make extension work without backend
// Paste this into any job site console to test the extension locally

// Mock the background script response for testing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TRACK_JOB') {
    console.log('🎯 Mock: Tracking job locally:', request.data);
    
    // Save to local storage for testing
    chrome.storage.local.get('tracked_jobs', (result) => {
      const trackedJobs = result.tracked_jobs || [];
      const newJob = {
        id: Date.now(),
        ...request.data,
        trackedAt: new Date().toISOString()
      };
      
      trackedJobs.push(newJob);
      
      chrome.storage.local.set({ tracked_jobs: trackedJobs }, () => {
        console.log('✅ Job saved locally:', newJob);
        sendResponse({ 
          success: true, 
          data: newJob,
          message: 'Job tracked locally!' 
        });
      });
    });
    
    return true; // Keep message channel open
  }
});

// Test if job extractor is loaded
if (window.JobExtractor) {
  console.log('✅ JobExtractor is loaded');
} else {
  console.log('❌ JobExtractor not found');
}

// Check for track button
setTimeout(() => {
  const button = document.getElementById('job-tracker-btn');
  if (button) {
    console.log('✅ Track button found:', button);
  } else {
    console.log('❌ Track button not found - might not be a job page');
  }
}, 2000);

console.log('🧪 Test script loaded. Check console for results.');