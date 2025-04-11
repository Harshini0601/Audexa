const style = document.createElement('style');
style.textContent = `
  .text-reader-highlight {
    background-color: rgba(255, 255, 0, 0.3) !important;
    transition: background-color 0.3s ease !important;
    border-radius: 3px !important;
  }
  
  body.text-reader-active {
    position: relative !important;
  }
  
  body.text-reader-active::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9998;
    pointer-events: none;
    background: transparent !important;
  }

  .text-reader-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .text-reader-widget button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    font-size: 16px;
  }

  .text-reader-widget button:hover {
    opacity: 0.8;
  }

  .text-reader-progress {
    flex-grow: 1;
    height: 4px;
    background: #eee;
    border-radius: 2px;
    margin: 0 10px;
  }

  .text-reader-progress-bar {
    height: 100%;
    background: #4CAF50;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;
document.head.appendChild(style);

let utterance;
let currentIndex = 0;
let sentences = [];
let currentHighlight = null;
let isPlaying = false;
let isVoicesReady = false;
let readingSpeed = 1.0;

// Initialize voices
window.speechSynthesis.onvoiceschanged = () => {
  isVoicesReady = window.speechSynthesis.getVoices().length > 0;
  debugLog(`Voices ready: ${isVoicesReady}`);
};

// Create reading widget
function createReadingWidget() {
  const widget = document.createElement('div');
  widget.className = 'text-reader-widget';
  widget.innerHTML = `
    <button id="reader-pause" title="Pause">⏸</button>
    <button id="reader-resume" title="Resume">▶</button>
    <button id="reader-stop" title="Stop">⏹</button>
    <div class="text-reader-progress">
      <div class="text-reader-progress-bar"></div>
    </div>
    <button id="reader-speed" title="Change Speed">1.0x</button>
  `;
  document.body.appendChild(widget);

  // Add event listeners
  widget.querySelector('#reader-pause').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'pause' });
  });
  widget.querySelector('#reader-resume').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resume' });
  });
  widget.querySelector('#reader-stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop' });
  });
  widget.querySelector('#reader-speed').addEventListener('click', () => {
    readingSpeed = readingSpeed === 1.0 ? 1.5 : readingSpeed === 1.5 ? 0.75 : 1.0;
    widget.querySelector('#reader-speed').textContent = `${readingSpeed}x`;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      speakCurrentSentence();
    }
  });
}

// Fallback to chrome.tts if speechSynthesis fails
function speakWithFallback(text) {
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = readingSpeed;
    
    utterance.onstart = () => {
      debugLog("Started speaking: " + text.substring(0, 50) + "...");
    };
    
    utterance.onend = () => {
      debugLog("Finished speaking");
      if (isPlaying) {
        currentIndex++;
        updateProgress();
        speakCurrentSentence();
      }
    };
    
    utterance.onerror = (error) => {
      debugLog("Speech synthesis error: " + error.error);
      chrome.runtime.sendMessage({ action: "error", message: "Error in speech synthesis" });
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    chrome.tts.speak(text, {
      lang: 'en-US',
      rate: readingSpeed
    });
  }
}

// Update progress bar
function updateProgress() {
  const progressBar = document.querySelector('.text-reader-progress-bar');
  if (progressBar) {
    const progress = (currentIndex / sentences.length) * 100;
    progressBar.style.width = `${progress}%`;
  }
}

// Debug function
function debugLog(message) {
  console.log('[TextReader] ' + message);
  chrome.runtime.sendMessage({ action: "debug", message: message });
}

function getArticleText() {
  try {
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content',
      '.story-content',
      '.post',
      '.article',
      '.blog-post',
      '.news-article',
      '.page-content',
      '.article-body',
      '.story-body',
      '.post-body',
      '.entry-body',
      '.article-text',
      '.post-text',
      '.entry-text',
      '.article-main',
      '.post-main',
      '.entry-main',
      '.article-container',
      '.post-container',
      '.entry-container'
    ];

    let article = null;
    for (const selector of contentSelectors) {
      article = document.querySelector(selector);
      if (article) {
        debugLog(`Found content using selector: ${selector}`);
        break;
      }
    }

    if (!article) {
      article = document.body;
      debugLog('Using document body as fallback');
    }

    const clone = article.cloneNode(true);
    
    // Remove unwanted elements
    const unwanted = [
      'script', 'style', 'noscript', 'iframe', 'nav', 'footer', 
      '.ad', '.related-stories', 'form', 'button', 'input', 
      'select', 'textarea', '.social-share', '.comments', 
      '.newsletter', '.cookie-banner', '.popup'
    ];
    unwanted.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract text from headings and paragraphs
    const elements = clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');
    let text = '';
    elements.forEach(el => {
      const elementText = el.textContent.trim();
      if (elementText && elementText.length > 10) {
        if (el.tagName.toLowerCase().startsWith('h')) {
          text += `\n${elementText}\n`;
        } else {
          text += ` ${elementText}`;
        }
      }
    });

    return text.trim();
  } catch (error) {
    debugLog("Error getting article text: " + error.message);
    return document.body.textContent;
  }
}

function highlightCurrentSentence() {
  // Remove previous highlight
  const oldHighlights = document.querySelectorAll('.text-reader-highlight');
  oldHighlights.forEach(el => {
    el.classList.remove('text-reader-highlight');
  });

  if (!sentences[currentIndex]) return;

  // Mark the body temporarily
  document.body.classList.add('text-reader-active');
  
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.nodeValue.includes(sentences[currentIndex]) ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    // Create wrapper span without modifying layout
    const span = document.createElement('span');
    span.className = 'text-reader-highlight';
    node.parentNode.replaceChild(span, node);
    span.appendChild(node);
    
    // Scroll to the element smoothly
    span.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }
  
  document.body.classList.remove('text-reader-active');
}

// Replace your entire speakSentences function with this:
function speakCurrentSentence() {
  if (currentIndex >= sentences.length || currentIndex < 0) {
    debugLog("Reached end of content");
    isPlaying = false;
    return;
  }

  const sentence = sentences[currentIndex];
  if (!sentence || sentence.trim() === '') {
    navigateToSentence(currentIndex + 1);
    return;
  }

  debugLog((isPlaying ? "Playing: " : "Showing: ") + sentence.substring(0, 50) + "...");
  chrome.runtime.sendMessage({ action: "showSentence", text: sentence });
  
  if (!isPlaying) return;

  speakWithFallback(sentence);
  
  highlightCurrentSentence();
  
}

// Navigation functions - add after speakCurrentSentence
function navigateToSentence(index) {
  if (index >= sentences.length) {
    index = sentences.length - 1;
  } else if (index < 0) {
    index = 0;
  }
  
  currentIndex = index;
  highlightCurrentSentence();
}

function goForward() {
  navigateToSentence(currentIndex + 1);
  if (isPlaying) {
    window.speechSynthesis.cancel();
    speakCurrentSentence();
  }
}

function goBackward() {
  navigateToSentence(currentIndex - 1);
  if (isPlaying) {
    window.speechSynthesis.cancel();
    speakCurrentSentence();
  }
}

function resetReader() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentHighlight) {
    currentHighlight.classList.remove('reading-now');
  }
  currentIndex = 0;
  sentences = [];
}

// Message listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Content script received message:', msg);
  
  // Handle the message synchronously
  const handleMessage = () => {
    switch (msg.action) {
      case "startReading":
        debugLog("Starting to read");
        isPlaying = true;
        resetReader();
        createReadingWidget();
        const articleText = getArticleText();
        sentences = articleText.match(/[^.!?]+[.!?]+/g) || [articleText];
        speakCurrentSentence();
        return { status: "started" };
        
      case "pause":
        debugLog("Pausing");
        isPlaying = false;
        if (window.speechSynthesis) {
          window.speechSynthesis.pause();
        }
        return { status: "paused" };
        
      case "resume":
        debugLog("Resuming");
        isPlaying = true;
        if (window.speechSynthesis) {
          window.speechSynthesis.resume();
        }
        speakCurrentSentence();
        highlightCurrentSentence();
        return { status: "resumed" };
        
      case "stop":
        debugLog("Stopping");
        isPlaying = false;
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        resetReader();
        const widget = document.querySelector('.text-reader-widget');
        if (widget) {
          widget.remove();
        }
        chrome.runtime.sendMessage({ action: "showSentence", text: "" });
        chrome.runtime.sendMessage({ action: "updateProgress", progress: 0 });
        return { status: "stopped" };
        
      case "forward":
        debugLog("Moving forward");
        goForward();
        return { status: "moved forward" };
        
      case "backward":
        debugLog("Moving backward");
        goBackward();
        return { status: "moved backward" };

      case "changeSpeed":
        debugLog(`Changing speed to ${msg.speed}`);
        readingSpeed = msg.speed;
        if (isPlaying) {
          window.speechSynthesis.cancel();
          speakCurrentSentence();
        }
        return { status: "speed changed" };
        
      default:
        debugLog("Unknown action: " + msg.action);
        return { status: "unknown action" };
    }
  };

  // Execute the handler and send response synchronously
  const response = handleMessage();
  sendResponse(response);
});