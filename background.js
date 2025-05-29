// Background script for handling screenshot capture

// Inject content script into existing tabs when extension is installed/enabled
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Screenshot extension installed');
  await injectIntoExistingTabs();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Screenshot extension started');
  await injectIntoExistingTabs();
});

async function injectIntoExistingTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      // Skip chrome:// pages and other restricted URLs
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('edge://') || 
          tab.url.startsWith('about:')) {
        continue;
      }
      
      try {
        // Inject CSS first
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        
        // Then inject JavaScript
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        console.log(`Injected into tab: ${tab.url}`);
      } catch (error) {
        console.log(`Could not inject into tab ${tab.id}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error injecting into existing tabs:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    captureAndDownloadScreenshot(sender.tab)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Screenshot error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

async function captureAndDownloadScreenshot(tab) {
  try {
    console.log('Attempting to capture screenshot for tab:', tab.id);
    
    // Make sure we have permission for this tab by activating it first
    await chrome.tabs.update(tab.id, { active: true });
    
    // Wait a moment for the tab to be active
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the current active tab to ensure we have the right context
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab:', activeTab.id);
    
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, {
      format: 'png',
      quality: 100
    });

    console.log('Screenshot captured successfully');

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `screenshot-${timestamp}.png`;

    // Convert data URL to blob and download
    await downloadScreenshot(dataUrl, filename);
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw new Error(`Failed to capture screenshot: ${error.message}`);
  }
}

async function downloadScreenshot(dataUrl, filename) {
  try {
    // Download the screenshot
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false // Auto-save to downloads folder
    });

    console.log('Screenshot downloaded with ID:', downloadId);
  } catch (error) {
    console.error('Error downloading screenshot:', error);
    throw error;
  }
}
