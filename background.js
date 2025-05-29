// Background script for handling screenshot capture

// Inject content script into existing tabs when extension is installed/enabled
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Screenshot extension installed');
  await checkDownloadSettings();
  await injectIntoExistingTabs();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Screenshot extension started');
  await checkDownloadSettings();
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
  } else if (request.action === 'testDownload') {
    testDownloadFunction(request.dataUrl)
      .then(() => sendResponse({ success: true, message: 'Test download completed' }))
      .catch(error => {
        console.error('Test download error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
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

    console.log('Screenshot captured successfully');    // Generate filename with timestamp (no subdirectory for now)
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
    console.log('Starting download process...');
    
    // Check user's download behavior setting first
    const settings = await new Promise((resolve) => {
      chrome.downloads.getFileIcon ? resolve({ canAutoDownload: true }) : resolve({ canAutoDownload: false });
    });
    
    // Use screenshots subdirectory
    const screenshotFilename = `screenshots/${filename}`;
    
    // Enhanced download options to force automatic download
    const downloadOptions = {
      url: dataUrl,
      filename: screenshotFilename,
      saveAs: false,
      conflictAction: 'uniquify'  // Auto-rename if file exists
    };
    
    console.log('Download options:', downloadOptions);
    
    try {
      const downloadId = await chrome.downloads.download(downloadOptions);
      console.log('Screenshot download initiated with ID:', downloadId);
      
      // Monitor download progress
      return new Promise((resolve, reject) => {
        const onChanged = (delta) => {
          if (delta.id === downloadId) {
            if (delta.state && delta.state.current === 'complete') {
              chrome.downloads.onChanged.removeListener(onChanged);
              console.log('Screenshot saved successfully to Downloads/' + screenshotFilename);
              resolve(downloadId);
            } else if (delta.state && delta.state.current === 'interrupted') {
              chrome.downloads.onChanged.removeListener(onChanged);
              reject(new Error('Download was interrupted'));
            }
          }
        };
        
        chrome.downloads.onChanged.addListener(onChanged);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(downloadId); // Resolve anyway, download might still be proceeding
        }, 30000);
      });
      
    } catch (downloadError) {
      console.error('Chrome downloads API failed, trying alternative method:', downloadError);
      
      // Fallback: Try without subdirectory
      const fallbackOptions = {
        url: dataUrl,
        filename: filename,
        saveAs: false,
        conflictAction: 'uniquify'
      };
      
      const fallbackId = await chrome.downloads.download(fallbackOptions);
      console.log('Fallback download initiated with ID:', fallbackId);
      return fallbackId;
    }
    
  } catch (error) {
    console.error('Error downloading screenshot:', error);
    throw error;
  }
}

// Test download function to help debug download issues
async function testDownloadFunction(dataUrl) {
  try {
    console.log('Testing download with sample image...');
    const filename = `screenshots/test-download-${Date.now()}.png`;
    await downloadScreenshot(dataUrl, filename);
    console.log('Test download successful!');
  } catch (error) {
    console.error('Test download failed:', error);
    throw error;
  }
}

// Check download settings and permissions
async function checkDownloadSettings() {
  try {
    // Test basic download permissions
    const permissions = await chrome.permissions.getAll();
    console.log('Extension permissions:', permissions);
    
    // Check if we can access downloads API
    if (chrome.downloads) {
      console.log('Downloads API available');
      
      // Get recent downloads to test API access
      const recentDownloads = await chrome.downloads.search({limit: 5});
      console.log('Recent downloads count:', recentDownloads.length);
      
      // Try to ensure screenshots directory exists by creating a small test file
      await ensureScreenshotsDirectory();
      
    } else {
      console.error('Downloads API not available');
    }
  } catch (error) {
    console.error('Error checking download settings:', error);
  }
}

// Ensure screenshots directory exists in Downloads folder
async function ensureScreenshotsDirectory() {
  try {
    // Create a tiny placeholder file to ensure directory exists
    const testData = 'data:text/plain;base64,dGVzdA=='; // "test" in base64
    
    await chrome.downloads.download({
      url: testData,
      filename: 'screenshots/.placeholder',
      saveAs: false,
      conflictAction: 'overwrite'
    });
    
    // Clean up the placeholder file after a moment
    setTimeout(async () => {
      try {
        const downloads = await chrome.downloads.search({
          filename: 'screenshots/.placeholder',
          limit: 1
        });
        if (downloads.length > 0) {
          await chrome.downloads.removeFile(downloads[0].id);
          await chrome.downloads.erase({ id: downloads[0].id });
        }
      } catch (cleanupError) {
        console.log('Cleanup of placeholder file failed (this is normal):', cleanupError.message);
      }
    }, 2000);
    
    console.log('Screenshots directory ensured');
  } catch (error) {
    console.log('Could not create screenshots directory (will fall back to Downloads root):', error.message);
  }
}
