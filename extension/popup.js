// Popup script for Opportune extension
const API_URL_KEY = 'opportune_api_url';
const API_KEY_KEY = 'opportune_api_key';

// DOM elements
const form = document.getElementById('jobForm');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');
const settingsToggle = document.getElementById('settingsToggle');
const settingsForm = document.getElementById('settingsForm');
const saveSettingsBtn = document.getElementById('saveSettings');
const apiKeyInput = document.getElementById('apiKey');
const apiUrlInput = document.getElementById('apiUrl');

// Load settings on startup
async function loadSettings() {
  const result = await chrome.storage.local.get([API_URL_KEY, API_KEY_KEY]);
  if (result[API_URL_KEY]) {
    apiUrlInput.value = result[API_URL_KEY];
  }
  if (result[API_KEY_KEY]) {
    apiKeyInput.value = result[API_KEY_KEY];
  }
}

// Save settings
saveSettingsBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({
    [API_URL_KEY]: apiUrlInput.value.trim() || 'http://localhost:4321',
    [API_KEY_KEY]: apiKeyInput.value.trim(),
  });
  showMessage('Settings saved!', 'success');
  settingsForm.classList.remove('show');
});

// Toggle settings
settingsToggle.addEventListener('click', () => {
  settingsForm.classList.toggle('show');
});

// Show message
function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  setTimeout(() => {
    message.className = 'message';
  }, 3000);
}

// Get API config
async function getApiConfig() {
  const result = await chrome.storage.local.get([API_URL_KEY, API_KEY_KEY]);
  return {
    url: result[API_URL_KEY] || 'http://localhost:4321',
    key: result[API_KEY_KEY],
  };
}

// Auto-fill from current page
async function autoFillFromPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    // Execute content script to get page data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData,
    });

    if (results[0]?.result) {
      const data = results[0].result;
      document.getElementById('company').value = data.company || '';
      document.getElementById('role').value = data.role || '';
      document.getElementById('location').value = data.location || '';
      document.getElementById('link').value = data.url || tab.url || '';
    }
  } catch (err) {
    console.error('Failed to auto-fill:', err);
  }
}

// Function to run in page context
function getPageData() {
  const data = {
    company: '',
    role: '',
    location: '',
    url: window.location.href,
  };

  // Try to extract from common job site patterns
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
  // Greenhouse
  else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
    const roleEl = document.querySelector('.app-title');
    const companyEl = document.querySelector('.company-name');
    const locationEl = document.querySelector('.location');

    if (roleEl) data.role = roleEl.textContent.trim();
    if (companyEl) data.company = companyEl.textContent.trim();
    if (locationEl) data.location = locationEl.textContent.trim();
  }
  // Lever
  else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
    const roleEl = document.querySelector('.posting-headline h2');
    const companyEl = document.querySelector('.main-header-logo');
    const locationEl = document.querySelector('.sort-by-time .posting-category');

    if (roleEl) data.role = roleEl.textContent.trim();
    if (companyEl) data.company = companyEl.alt || companyEl.textContent.trim();
    if (locationEl) data.location = locationEl.textContent.trim();
  }
  // Generic fallback - try common selectors
  else {
    // Try to find job title in h1
    const h1 = document.querySelector('h1');
    if (h1) data.role = h1.textContent.trim();

    // Try to find company name
    const companySelectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[data-testid*="company"]',
    ];
    for (const selector of companySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.company = el.textContent.trim();
        break;
      }
    }

    // Try to find location
    const locationSelectors = [
      '[class*="location"]',
      '[class*="place"]',
      '[data-testid*="location"]',
    ];
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
  }

  return data;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const config = await getApiConfig();
  if (!config.key) {
    showMessage('Please set your API key in Settings', 'error');
    settingsForm.classList.add('show');
    return;
  }

  const formData = {
    company: document.getElementById('company').value.trim(),
    role: document.getElementById('role').value.trim(),
    location: document.getElementById('location').value.trim() || null,
    link: document.getElementById('link').value.trim() || null,
    salaryRange: document.getElementById('salaryRange').value.trim() || null,
    status: document.getElementById('status').value,
    notes: null,
    dateApplied: new Date().toISOString().slice(0, 10),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    const response = await fetch(`${config.url}/api/extension/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Application added successfully!', 'success');
      form.reset();
      // Re-fill the URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        document.getElementById('link').value = tab.url;
      }
    } else {
      showMessage(result.error?.formErrors?.join?.(', ') || result.error || 'Failed to add', 'error');
    }
  } catch (err) {
    showMessage('Network error. Is the server running?', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add to Tracker';
  }
});

// Initialize
loadSettings();
autoFillFromPage();
