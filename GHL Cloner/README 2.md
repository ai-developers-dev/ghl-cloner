# GHL Page Cloner

A Chrome extension to clone Go High Level (GHL) funnel and website pages.

## Features

- 📋 **Copy** any public GHL funnel or website page
- 📥 **Paste** copied data into your GHL builder
- 🎨 Preserves custom CSS and styles
- 📊 Extracts all sections, rows, columns, and elements
- 🔒 All data stays in your browser

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `ghl-page-cloner` folder
6. The extension icon should appear in your toolbar

### Important

After installing, you may need to **restart your browser** for all permissions to take effect.

## Usage

### Copying a Page

1. Navigate to any public GHL funnel or website page
2. Click the extension icon in your toolbar
3. The extension will detect the page type
4. Click **Copy Page Data**
5. Wait for extraction to complete

### Pasting a Page

1. Open your GHL builder (funnel or website editor)
2. Click the extension icon
3. Click **Paste Page Data**
4. Wait for injection to complete
5. Your page structure should appear in the builder

## How It Works

1. **Detection**: The extension identifies GHL pages by checking URL patterns and DOM elements
2. **Extraction**: When copying, it parses the DOM structure to extract:
   - Page sections and their settings
   - Rows and column layouts
   - Individual elements (text, images, buttons, etc.)
   - Inline styles and CSS
   - Custom tracking codes
3. **Storage**: Extracted data is stored locally in Chrome's storage
4. **Injection**: When pasting, the extension reconstructs the page structure in the builder

## File Structure

```
ghl-page-cloner/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Background script
├── content-scripts/
│   └── detector.js         # Page detection and extraction
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── utils/
│   └── helpers.js          # Utility functions
└── assets/
    └── icons/              # Extension icons
```

## Limitations

- Only works with publicly accessible GHL pages
- Some complex elements may not transfer perfectly
- Forms and surveys need to be reconfigured after pasting
- Images remain linked to original URLs
- Does not transfer backend connections (automations, products, etc.)

## Troubleshooting

### "Page not detected"
- Make sure you're on a public GHL page (not behind a login)
- Try refreshing the page and waiting for it to fully load
- Check the browser console for error messages

### "Failed to copy"
- The page structure may not be standard
- Try on a simpler page first
- Check if the page is fully loaded

### "Failed to paste"
- Make sure you're in the GHL builder
- The builder must be fully loaded
- Try refreshing the builder page

## Development

### Prerequisites
- Chrome browser
- Basic understanding of Chrome extensions

### Testing Changes
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Test your changes

### Debugging
- Right-click the extension icon → "Inspect popup" for popup console
- Check the page console for content script logs
- Service worker logs appear in `chrome://extensions/` → "Service worker"

## Legal Notice

This tool is for inspiration and template purposes only. Always:
- Obtain permission before cloning someone else's design
- Customize copied content to make it your own
- Respect intellectual property rights
- Do not clone and republish content as-is

## License

MIT License - See LICENSE file for details.

## Support

For issues and feature requests, please open an issue on GitHub.

---

Built for GHL Agencies
