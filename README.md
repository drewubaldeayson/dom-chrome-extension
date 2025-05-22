# 🔧 DOM to Slack Extractor

A powerful Chrome Extension that extracts structured data from any webpage and sends it directly to your Slack channels. Perfect for content curation, research, and team collaboration.

## ✨ Features

- **Smart DOM Extraction**: Automatically detects and extracts page titles, summaries, and metadata
- **Slack Integration**: Send extracted data directly to Slack channels via webhooks
- **Visual Feedback**: Highlights extracted elements with smooth animations
- **Quick Actions**: Right-click context menu for instant extraction
- **Secure**: No data stored on external servers - direct browser-to-Slack communication
- **Beautiful UI**: Modern, responsive popup interface with real-time preview

## 📦 Installation

### Method 1: Load Unpacked (Development)

1. **Clone this repository:**
   ```bash
   git clone https://github.com/drewubaldeayson/dom-chrome-extension.git
   cd dom-chrome-extension
   ```

2. **Open Chrome Extensions page:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

3. **Load the extension:**
   - Click "Load unpacked"
   - Select the project folder
   - The extension icon should appear in your toolbar


## ⚙️ Setup

### 1. Create a Slack Webhook

1. **Go to your Slack workspace:**
   - Visit [Slack API](https://api.slack.com/)
   - Click "Create New App" → "From scratch"
   - Name it "DOM Extractor" and select your workspace

2. **Configure Incoming Webhook:**
   - Go to "Incoming Webhooks" in the left sidebar
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select the channel where you want messages sent
   - Copy the webhook URL (starts with `https://hooks.slack.com/...`)

### 2. Configure the Extension

1. Click the extension icon in your Chrome toolbar
2. Paste your webhook URL in the configuration field
3. Click "Save" - you should see a success message

## 🎯 How to Use

### Option 1: Extension Popup
1. Navigate to any webpage (Wikipedia, news sites, blogs, etc.)
2. Click the extension icon in your toolbar
3. Preview the extracted data in the popup
4. Click "📄 Capture & Send to Slack"
5. Elements will be highlighted and data sent to Slack!

### Option 2: Highlight Preview
1. Click "🎯 Highlight Elements" to preview what will be extracted
2. Elements are highlighted with colored borders for 5 seconds

## 📊 What Gets Extracted

The extension intelligently extracts:

- **📝 Page Title**: Main heading (H1) or document title
- **📄 Summary**: First meaningful paragraph (filtered for quality)
- **🔗 URL**: Current page URL with clickable link
- **📅 Publish Date**: Publication date (when available)
- **⏰ Timestamp**: When the extraction occurred

## 🎨 Slack Message Format

Messages are sent with rich formatting including:

```
📄 DOM Data Extracted

🔹 Title: [Page Title]
🔹 URL: [Clickable Link]
🔹 Summary: [First paragraph or description]

Extracted on [Date/Time] • DOM to Slack Extension
```

## 🔧 Supported Websites

The extension works on any website but is optimized for:

- 📰 News sites (CNN, BBC, TechCrunch, etc.)
- 📚 Wikipedia articles
- 📝 Blog platforms (Medium, WordPress, etc.)
- 🔬 Research papers and documentation
- 🛒 E-commerce product pages
- 📖 Educational content

## 🛡️ Privacy & Security

- 🔒 **No external servers**: Direct browser-to-Slack communication
- 🚫 **No data storage**: No personal data stored or tracked
- 🔐 **Secure webhooks**: Uses HTTPS for all communications
- 👤 **Local only**: All processing happens in your browser

## 🐛 Troubleshooting

### Extension not working?
- **Check permissions**: Ensure the extension has access to the current site
- **Refresh the page**: Sometimes a page refresh helps
- **Verify webhook**: Test your webhook URL in a REST client
- **Check console**: Open Developer Tools → Console for error messages

### Webhook errors?
- **Verify URL format**: Must start with `https://hooks.slack.com/`
- **Check workspace permissions**: Ensure the webhook is still active
- **Test in Slack**: Try sending a test message to verify the webhook works

### Data not extracting properly?
- **Try different sites**: Some sites have unique structures
- **Check for content**: Ensure the page has text content
- **Disable ad blockers**: Sometimes they interfere with DOM access

## 🔧 Development

### Project Structure

```
dom-chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup logic and UI handling
├── content.js            # DOM extraction and highlighting
├── content.css           # Content script styling
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Key Components

- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Injected into web pages for DOM access
- **Service Worker**: Background processing and context menus
- **Popup Interface**: User-friendly configuration and control
- **Message Passing**: Secure communication between components

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon next to the extension
4. Test your changes

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- [Slack API](https://api.slack.com/) for webhook functionality
- Chrome Extensions API for browser integration
- Modern CSS for beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

- Check the [troubleshooting section](#-troubleshooting) above
- [Open an issue](https://github.com/drewubaldeayson/dom-chrome-extension/issues) on GitHub
- Contact the maintainer via email

---

Made by Andrew Ayson and with ❤️ for productivity and team collaboration