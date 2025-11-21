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
  } else if (request.action === 'testDownload') {
    testDownloadFunction(request.dataUrl)
      .then(() => sendResponse({ success: true, message: 'Test download completed' }))
      .catch(error => {
        console.error('Test download error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  } else if (request.action === 'getDownloadPath') {
    chrome.storage.local.get(['downloadPath', 'downloadPathSet'])
      .then(storage => {
        sendResponse({
          path: storage.downloadPath || 'Not set yet',
          isSet: storage.downloadPathSet || false
        });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });

    return true;
  } else if (request.action === 'resetDownloadPath') {
    chrome.storage.local.remove(['downloadPath', 'downloadPathSet'])
      .then(() => {
        console.log('Download path reset');
        sendResponse({ success: true, message: 'Download path reset. You will be prompted on the next screenshot.' });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
}); async function captureAndDownloadScreenshot(tab) {
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

    // Get saved download path from storage
    const storage = await chrome.storage.local.get(['downloadPath', 'downloadPathSet']);
    let savedPath = storage.downloadPath;
    const pathSet = storage.downloadPathSet;

    // Determine if we should ask user for location
    let saveAs = false;
    let screenshotFilename = filename;

    if (!pathSet) {
      // First time - ask user where to save
      console.log('First time screenshot - will prompt for location');
      saveAs = true;
    } else if (savedPath) {
      // Use saved path
      screenshotFilename = savedPath + '/' + filename;
      console.log('Using saved path:', screenshotFilename);
    }

    // Download options
    const downloadOptions = {
      url: dataUrl,
      filename: screenshotFilename,
      saveAs: saveAs,
      conflictAction: 'uniquify'  // Auto-rename if file exists
    };

    console.log('Download options:', downloadOptions);

    try {
      const downloadId = await chrome.downloads.download(downloadOptions);
      console.log('Screenshot download initiated with ID:', downloadId);

      // If this was the first time, save the chosen path
      if (!pathSet) {
        // Wait for download to complete and get the actual path
        await saveDownloadPath(downloadId);
      }

      // Monitor download progress
      return new Promise((resolve, reject) => {
        const onChanged = (delta) => {
          if (delta.id === downloadId) {
            if (delta.state && delta.state.current === 'complete') {
              chrome.downloads.onChanged.removeListener(onChanged);
              console.log('Screenshot saved successfully');
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
      console.error('Chrome downloads API failed:', downloadError);
      throw downloadError;
    }

  } catch (error) {
    console.error('Error downloading screenshot:', error);
    throw error;
  }
}

// Save the download path after user selects location
async function saveDownloadPath(downloadId) {
  try {
    // Wait a bit for the download to start
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the download item to extract the path
    const downloads = await chrome.downloads.search({ id: downloadId });

    if (downloads.length > 0) {
      const downloadItem = downloads[0];
      const fullPath = downloadItem.filename;

      // Extract directory path (remove filename)
      const lastSlashIndex = fullPath.lastIndexOf('/');
      let directoryPath = '';

      if (lastSlashIndex !== -1) {
        directoryPath = fullPath.substring(0, lastSlashIndex);
      }

      console.log('Saving download path:', directoryPath);

      // Save to storage
      await chrome.storage.local.set({
        downloadPath: directoryPath,
        downloadPathSet: true
      });

      console.log('Download path saved successfully');
    }
  } catch (error) {
    console.error('Error saving download path:', error);
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


