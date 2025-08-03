# Local Extension Testing Guide

## How to Test the Extension Locally

### Method 1: Chrome Developer Mode (Recommended)

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in Chrome
   - Or click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to `/Users/ethantsao/job-tracker-project/extension/` folder
   - Select the entire extension folder
   - Click "Select Folder"

4. **Extension Should Load**
   - You'll see the extension appear in the list
   - Note the Extension ID (save this for testing)
   - Check for any errors in red

### Method 2: Pack Extension (Alternative)

1. **Pack the Extension**
   - In `chrome://extensions/`
   - Click "Pack extension"
   - Extension root directory: `/Users/ethantsao/job-tracker-project/extension/`
   - Leave private key file blank (first time)
   - Click "Pack Extension"

2. **Install Packed Extension**
   - Click "Load unpacked" and select the generated .crx file
   - Or drag and drop the .crx file into Chrome

## Testing the Extension

### 1. Basic Functionality Test

**Check Extension Installation:**
```bash
# Verify extension appears in toolbar
# Click extension icon to see popup (if implemented)
# Check chrome://extensions/ for any errors
```

**Test Extension Permissions:**
- Extension should request only necessary permissions
- Check that activeTab and storage permissions are granted

### 2. Job Site Testing

**Test on LinkedIn Jobs:**
1. Go to https://www.linkedin.com/jobs/
2. Search for any job and click on a job posting
3. Look for the "Track Job" button injection
4. Click the button and verify it tracks the job

**Test on Indeed:**
1. Go to https://www.indeed.com/
2. Search for jobs and click on a posting
3. Verify button appears and functions

**Test on Other Supported Sites:**
- Glassdoor: https://www.glassdoor.com/Jobs/
- Google Jobs: https://jobs.google.com/
- Dice: https://www.dice.com/
- Monster: https://www.monster.com/

### 3. Data Extraction Testing

**Verify Job Data Extraction:**
1. Click "Track Job" on various job postings
2. Check browser console (F12) for any errors
3. Verify data is being extracted correctly:
   - Job title
   - Company name
   - Location
   - Job description
   - Salary (if available)

**Check Local Storage:**
1. Open Developer Tools (F12)
2. Go to Application tab → Storage → Local Storage
3. Look for extension data being saved

### 4. Background Script Testing

**Test Service Worker:**
1. Go to `chrome://extensions/`
2. Click "service worker" link next to your extension
3. Check for console errors
4. Test message passing between content script and background

### 5. API Integration Testing

**Start Backend Server First:**
```bash
cd /Users/ethantsao/job-tracker-project/backend
# Make sure your FastAPI server is running
uvicorn main:app --reload --host localhost --port 8000
```

**Test API Connectivity:**
1. Track a job from any job site
2. Check browser console for API calls
3. Verify data appears in backend/database
4. Test authentication if implemented

## Debugging Common Issues

### Extension Won't Load
```bash
# Check manifest.json syntax
cd /Users/ethantsao/job-tracker-project/extension
cat manifest.json | python -m json.tool

# Common issues:
# - Invalid JSON syntax
# - Missing required fields
# - Incorrect file paths
```

### Button Not Appearing
1. **Check Content Script Injection:**
   - Open job site
   - Press F12 → Console
   - Look for content script errors
   - Verify site is in host_permissions

2. **Check Site Detection:**
   ```javascript
   // In browser console on job site:
   console.log(window.location.hostname);
   // Should match a site in your detector list
   ```

### Data Not Saving
1. **Check Storage Permissions:**
   - Verify "storage" permission in manifest.json
   - Check for storage quota errors in console

2. **Test Storage Manually:**
   ```javascript
   // In extension console:
   chrome.storage.local.set({test: "hello"}, () => {
     console.log("Storage test complete");
   });
   
   chrome.storage.local.get("test", (result) => {
     console.log("Retrieved:", result.test);
   });
   ```

### API Calls Failing
1. **Check CORS Settings:**
   - Ensure backend allows extension origin
   - Check network tab in DevTools for CORS errors

2. **Verify Backend is Running:**
   ```bash
   curl http://localhost:8000/health
   # Should return server status
   ```

## Automated Testing

### Run the Test Suite
```javascript
// Open extension popup or content script console
// Run the comprehensive test suite
const testSuite = new ExtensionTestSuite();
// Results will be logged to console
```

### Performance Testing
```javascript
// Monitor memory usage
const startMemory = performance.memory.usedJSHeapSize;
// Perform job tracking operations
const endMemory = performance.memory.usedJSHeapSize;
console.log(`Memory used: ${(endMemory - startMemory) / 1024 / 1024} MB`);
```

## Manual Test Checklist

### ✅ Installation and Setup
- [ ] Extension loads without errors
- [ ] Icon appears in Chrome toolbar
- [ ] Permissions granted correctly
- [ ] No console errors on extension pages

### ✅ Core Functionality  
- [ ] Job sites detected correctly
- [ ] Track button injected on job pages
- [ ] Job data extracted accurately
- [ ] Data saved to local storage
- [ ] Background script responds to messages

### ✅ User Interface
- [ ] Button styling looks good
- [ ] Button doesn't break page layout
- [ ] Success/error messages display
- [ ] Extension popup works (if applicable)

### ✅ Error Handling
- [ ] Graceful handling of network errors
- [ ] Proper error messages for users
- [ ] Extension continues working after errors
- [ ] No console spam or uncaught exceptions

### ✅ Performance
- [ ] Page load times not significantly affected
- [ ] Extension doesn't slow down browsing
- [ ] Memory usage remains reasonable
- [ ] No memory leaks after extended use

## Debugging Tools

### Chrome DevTools
```bash
# Content Script Debugging:
# 1. Go to job site
# 2. Press F12
# 3. Sources tab → Content scripts
# 4. Set breakpoints in your content script

# Background Script Debugging:
# 1. Go to chrome://extensions/
# 2. Click "service worker" link
# 3. New DevTools window opens for background script
```

### Extension Console Commands
```javascript
// Check if extension is loaded
console.log(chrome.runtime.getManifest());

// Test message passing
chrome.runtime.sendMessage({action: 'ping'}, response => {
  console.log('Background response:', response);
});

// Check permissions
chrome.permissions.getAll(permissions => {
  console.log('Granted permissions:', permissions);
});
```

## Testing Different Scenarios

### Network Conditions
1. **Offline Testing:**
   - Disconnect internet
   - Verify extension handles offline gracefully
   - Test local storage functionality

2. **Slow Network:**
   - Use Chrome DevTools Network throttling
   - Test with "Slow 3G" setting
   - Verify timeouts and error handling

### Browser Profiles
1. **Fresh Profile Testing:**
   - Create new Chrome profile
   - Install extension in fresh environment
   - Test first-time user experience

2. **Different Chrome Versions:**
   - Test on Chrome stable and beta channels
   - Verify Manifest V3 compatibility

## Production Readiness Check

Before submitting to Chrome Web Store:

### ✅ Final Testing Round
- [ ] Test all supported job sites
- [ ] Verify all features work end-to-end
- [ ] Check for console errors across all scenarios
- [ ] Test with fresh browser profile
- [ ] Performance testing completed
- [ ] Security testing passed

### ✅ Code Quality
- [ ] No debug console.log statements
- [ ] All TODO comments addressed
- [ ] Code follows best practices
- [ ] No sensitive data in code
- [ ] Error handling implemented

### ✅ User Experience
- [ ] Extension provides clear value
- [ ] UI is intuitive and polished
- [ ] Error messages are user-friendly
- [ ] Performance meets expectations

## Getting Help

### Common Testing Resources
- **Chrome Extension Documentation:** https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration:** https://developer.chrome.com/docs/extensions/mv3/
- **Extension API Reference:** https://developer.chrome.com/docs/extensions/reference/

### Debugging Support
If you encounter issues during testing:
1. Check browser console for errors
2. Verify manifest.json syntax
3. Test permissions and host matches
4. Review Chrome extension best practices
5. Check Chrome extension samples on GitHub

---

**Ready to test!** Load the extension using Developer Mode and start testing on real job sites. This will give you confidence before submitting to the Chrome Web Store.