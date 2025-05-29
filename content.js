// Content script that creates the floating screenshot button
class FloatingScreenshotButton {
  constructor() {
    this.button = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.createButton();
    this.addEventListeners();
  }

  createButton() {
    // Remove existing button if it exists
    const existingButton = document.getElementById('floating-screenshot-btn');
    if (existingButton) {
      existingButton.remove();
    }

    // Create the floating button
    this.button = document.createElement('div');
    this.button.id = 'floating-screenshot-btn';
    this.button.innerHTML = '📸';
    this.button.title = 'Take Screenshot';
    
    // Set initial position (top-right corner)
    this.button.style.position = 'fixed';
    this.button.style.top = '20px';
    this.button.style.right = '20px';
    this.button.style.zIndex = '999999';
    
    document.body.appendChild(this.button);
  }

  addEventListeners() {
    // Screenshot functionality
    this.button.addEventListener('click', (e) => {
      if (!this.isDragging) {
        this.takeScreenshot();
      }
    });

    // Drag functionality
    this.button.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      const rect = this.button.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      e.preventDefault();
    });
  }

  handleMouseMove = (e) => {
    this.isDragging = true;
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Keep button within viewport bounds
    const maxX = window.innerWidth - this.button.offsetWidth;
    const maxY = window.innerHeight - this.button.offsetHeight;
    
    this.button.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    this.button.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    this.button.style.right = 'auto';
  }
  handleMouseUp = () => {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    // Reset dragging flag after a short delay to prevent click event
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  };
  
  async takeScreenshot() {
    try {
      console.log('Taking screenshot...');
      
      // Visual feedback on button
      const originalText = this.button.innerHTML;
      const originalBackground = this.button.style.background;
      
      this.button.innerHTML = '📸 Taking...';
      this.button.style.background = 'linear-gradient(135deg, #FFA726, #FF9800)';
      this.button.style.pointerEvents = 'none';
      
      this.showNotification('Taking screenshot...', 'info');
      
      // Send message to background script to capture screenshot
      const response = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
      
      console.log('Screenshot response:', response);
      
      if (response && response.success) {
        this.button.innerHTML = '✅';
        this.button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        this.showNotification('Screenshot saved to Downloads/screenshots folder!', 'success');
      } else {
        const errorMsg = response?.error || 'Unknown error occurred';
        console.error('Screenshot failed:', errorMsg);
        this.button.innerHTML = '❌';
        this.button.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        this.showNotification('Failed to take screenshot: ' + errorMsg, 'error');
      }
      
      // Reset button after 2 seconds
      setTimeout(() => {
        this.button.innerHTML = originalText;
        this.button.style.background = originalBackground;
        this.button.style.pointerEvents = 'auto';
      }, 2000);
      
    } catch (error) {
      console.error('Screenshot error:', error);
      this.button.innerHTML = '❌';
      this.button.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
      this.showNotification('Failed to take screenshot: ' + error.message, 'error');
      
      // Reset button after 3 seconds on error
      setTimeout(() => {
        this.button.innerHTML = '📸';
        this.button.style.background = '';
        this.button.style.pointerEvents = 'auto';
      }, 3000);
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `screenshot-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize the floating button when the page loads
// Prevent multiple instances
if (!window.screenshotButtonInitialized) {
  window.screenshotButtonInitialized = true;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FloatingScreenshotButton();
    });
  } else {
    new FloatingScreenshotButton();
  }
}
