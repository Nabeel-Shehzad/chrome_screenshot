# Installation Instructions for Chrome Screenshot Extension

## Step 1: Enable Developer Mode in Chrome

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. In the top-right corner, toggle **"Developer mode"** to ON

## Step 2: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to and select the `chrome_screenshot` folder
3. Click **"Select Folder"**

**Important**: After loading the extension, you need to **reload/refresh** any existing open tabs to see the floating button. New tabs will automatically show the button.

## Step 3: Verify Installation

1. You should see the "Screenshot Capture" extension in your extensions list
2. Make sure it's enabled (toggle should be blue/on)
3. You may see the extension icon in your Chrome toolbar

## Step 4: Icon Files ✅ Already Done!

Great! You already have the proper icon files in place:
- `icons/screenshot16.png` ✅
- `icons/screenshot48.png` ✅ 
- `icons/screenshot128.png` ✅

Your extension will display these custom icons in Chrome!

## Step 5: Test the Extension

1. **Refresh any existing open tabs** (press F5 or Ctrl+R)
2. Navigate to any website (or use an existing tab after refresh)
3. You should see a floating 📸 button on the page
4. Try clicking it to take a screenshot
5. Try dragging it to move it around
6. Check your Downloads folder for saved screenshots

**Note**: The floating button will automatically appear on all new tabs. For existing tabs, you need to refresh them once after installing the extension.

## Troubleshooting

### No floating button appears:
- **Reload the extension**: Go to `chrome://extensions/`, find "Screenshot Capture", click the refresh button 🔄
- **Refresh the webpage** after installing/reloading the extension
- Check if the extension is enabled in `chrome://extensions/`
- Make sure Developer mode is turned on
- Try the test page: Open `test.html` in your browser

### Screenshots not saving:
- Open browser console (F12) and check for error messages
- Check Chrome's download settings
- Ensure the extension has proper permissions
- Try refreshing the page and reloading the extension

### Permission Errors:
1. **Reload the extension** first: Go to `chrome://extensions/` → find "Screenshot Capture" → click refresh 🔄
2. **Refresh any open tabs** where you want to use the extension
3. Check browser console (F12) for detailed error messages
4. Make sure the extension has all required permissions in `chrome://extensions/`

### Debug Steps:
1. Open `test.html` in Chrome for debugging information
2. Open browser console (F12) to see detailed logs
3. Check `chrome://extensions/` → "Screenshot Capture" → "Errors" for any extension errors

### Button not draggable:
- Make sure you're clicking and holding to drag
- The button should only take a screenshot if you click without dragging

## Features

✅ **Floating Button**: Appears on all websites  
✅ **Drag & Drop**: Move the button anywhere on screen  
✅ **Auto-Save**: Screenshots saved to Downloads folder  
✅ **Timestamp**: Files named with date/time  
✅ **Visual Feedback**: Success/error notifications  

## File Naming

Screenshots are saved as: `screenshot-YYYY-MM-DDTHH-MM-SS.png`

Example: `screenshot-2025-05-29T14-30-45.png`

Enjoy your new screenshot extension! 📸
