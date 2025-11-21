// Popup script for managing settings

document.addEventListener('DOMContentLoaded', async () => {
  // Load and display current save path
  await loadSavePath();

  // Set up reset button
  document.getElementById('resetBtn').addEventListener('click', resetSavePath);
});

async function loadSavePath() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getDownloadPath' });

    const savePathElement = document.getElementById('savePath');

    if (response.isSet && response.path) {
      savePathElement.textContent = response.path;
    } else {
      savePathElement.textContent = 'Not set - you will be prompted on first screenshot';
    }
  } catch (error) {
    console.error('Error loading save path:', error);
    document.getElementById('savePath').textContent = 'Error loading path';
  }
}

async function resetSavePath() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'resetDownloadPath' });

    if (response.success) {
      // Show success message
      showMessage('Save location reset! You will be prompted on your next screenshot.', 'success');

      // Update the displayed path
      document.getElementById('savePath').textContent = 'Not set - you will be prompted on first screenshot';
    } else {
      showMessage('Error resetting path: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error resetting save path:', error);
    showMessage('Error resetting path', 'error');
  }
}

function showMessage(text, type) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = text;
  messageElement.style.display = 'block';

  if (type === 'success') {
    messageElement.style.background = 'rgba(76, 175, 80, 0.3)';
  } else {
    messageElement.style.background = 'rgba(244, 67, 54, 0.3)';
  }

  // Hide message after 3 seconds
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}
