# Chrome Screenshot Extension

A Chrome extension that adds a floating, draggable button to take screenshots of web pages.

## Features

- 📸 **Floating Screenshot Button**: A beautiful, draggable button that appears on all web pages
- 🖱️ **Drag and Drop**: Move the button anywhere on the screen
- 💾 **Auto-Save**: Screenshots are automatically saved to your Downloads/screenshots folder
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations
- 📱 **Cross-Site**: Works on any website

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this folder
4. The extension will be installed and ready to use

## How to Use

1. After installation, you'll see a floating 📸 button on all web pages
2. **To take a screenshot**: Click the button
3. **To move the button**: Drag it to any position on the screen
4. Screenshots are automatically saved to your Downloads/screenshots folder with timestamp

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main functionality for the floating button
- `content.css` - Styles for the button and notifications
- `background.js` - Handles screenshot capture and downloads
- `popup.html` - Extension popup interface
- `icons/` - Extension icons

## Permissions

- `activeTab` - To capture screenshots of the current tab
- `downloads` - To save screenshots to Downloads/screenshots folder
- `storage` - To store user preferences

## Browser Compatibility

- Chrome (Manifest V3)
- Chromium-based browsers

## Screenshot Features

- High-quality PNG format
- Automatic filename with timestamp
- Instant feedback notifications
- Error handling for failed captures

## Button Features

- Responsive hover effects
- Smooth drag animation
- Stays within viewport bounds
- Non-intrusive design
- High z-index to stay on top

Enjoy taking screenshots with ease! 📸
