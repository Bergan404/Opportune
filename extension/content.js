// Content script for Opportune extension
// This script runs on all pages and can be used for advanced scraping

console.log('[Opportune] Content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJobData') {
    const data = extractJobData();
    sendResponse(data);
  }
  return true;
});

// Extract job data from the current page
function extractJobData() {
  const data = {
    company: '',
    role: '',
    location: '',
    url: window.location.href,
  };

  const hostname = window.location.hostname;

  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    const companyEl = document.querySelector('.top-card-layout__card a[href*="/company/"]');
    const roleEl = document.querySelector('h1.top-card-layout__title');
    const locationEl = document.querySelector('.top-card-layout__first-subline span');

    if (companyEl) data.company = companyEl.textContent.trim();
    if (roleEl) data.role = roleEl.textContent.trim();
    if (locationEl) data.location = locationEl.textContent.trim();
  }
  // Indeed
  else if (hostname.includes('indeed.com')) {
    const companyEl = document.querySelector('[data-testid="company-name"]');
    const roleEl = document.querySelector('h1');
    const locationEl = document.querySelector('[data-testid="job-location"]');

    if (companyEl) data.company = companyEl.textContent.trim();
    if (roleEl) data.role = roleEl.textContent.trim();
    if (locationEl) data.location = locationEl.textContent.trim();
  }
  // Generic fallback
  else {
    const h1 = document.querySelector('h1');
    if (h1) data.role = h1.textContent.trim();
  }

  return data;
}
