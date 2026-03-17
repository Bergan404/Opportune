# Opportune Chrome Extension

Quickly add job applications to Opportune from any job posting page.

## Features

- Auto-detects job details from popular sites (LinkedIn, Indeed, Greenhouse, Lever)
- One-click add to your Opportune tracker
- Works on any site with manual entry fallback
- Secure API key authentication

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension/` folder

## Setup

1. Open the Opportune web app
2. Go to Settings → API Keys
3. Generate a new API key
4. Click the extension icon and paste your API key in Settings
5. Save and start tracking!

## Supported Sites

The extension automatically extracts job data from:
- **LinkedIn** - Company, role, location
- **Indeed** - Company, role, location
- **Greenhouse** - Company, role, location
- **Lever** - Company, role, location
- **Any other site** - Manual entry with URL auto-filled

## Development

To modify the extension:
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Opportune extension
4. Test your changes

## Icons

You need to add icon files:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Place them in this folder.
