document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById("start");
  const pauseBtn = document.getElementById("pause");
  const resumeBtn = document.getElementById("resume");
  const stopBtn = document.getElementById("stop");
  const forwardBtn = document.getElementById("forward");
  const backwardBtn = document.getElementById("backward");
  const speedSelect = document.getElementById("speed");
  const progressFill = document.querySelector(".progress-fill");

  // Initialize state
  let isPlaying = false;
  let currentProgress = 0;

  // Toggle play/pause/resume states
  function togglePlayState(playing) {
    isPlaying = playing;
    if (playing) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
      resumeBtn.style.display = 'none';
    } else {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'block';
    }
  }

  // Update progress bar
  function updateProgress(progress) {
    currentProgress = progress;
    progressFill.style.width = `${progress}%`;
  }

  // Send message to content script
  async function sendAction(action, data = {}) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action, ...data });
      console.log('Received response:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error communicating with the page. Please refresh the page and try again.');
      throw error;
    }
  }

  // Event listeners
  startBtn.onclick = async () => {
    try {
      await sendAction("startReading", { speed: parseFloat(speedSelect.value) });
      togglePlayState(true);
    } catch (error) {
      console.error('Start error:', error);
    }
  };

  pauseBtn.onclick = async () => {
    try {
      await sendAction("pause");
      togglePlayState(false);
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  resumeBtn.onclick = async () => {
    try {
      await sendAction("resume", { speed: parseFloat(speedSelect.value) });
      togglePlayState(true);
    } catch (error) {
      console.error('Resume error:', error);
    }
  };

  stopBtn.onclick = async () => {
    try {
      await sendAction("stop");
      startBtn.style.display = 'block';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
      updateProgress(0);
      isPlaying = false;
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  forwardBtn.onclick = async () => {
    try {
      await sendAction("forward");
    } catch (error) {
      console.error('Forward error:', error);
    }
  };

  backwardBtn.onclick = async () => {
    try {
      await sendAction("backward");
    } catch (error) {
      console.error('Backward error:', error);
    }
  };

  speedSelect.onchange = async () => {
    if (isPlaying) {
      try {
        await sendAction("changeSpeed", { speed: parseFloat(speedSelect.value) });
      } catch (error) {
        console.error('Speed change error:', error);
      }
    }
  };

  // Message listener
  chrome.runtime.onMessage.addListener((msg) => {
    console.log('Popup received message:', msg);
    
    switch (msg.action) {
      case "showSentence":
        document.getElementById("current-text").innerText = msg.text;
        break;
      case "updateProgress":
        updateProgress(msg.progress);
        break;
      case "readingComplete":
        startBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
        updateProgress(100);
        isPlaying = false;
        break;
      case "error":
        alert(msg.message);
        break;
    }
  });

  // Check if we can access the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url.startsWith('http')) {
      document.body.innerHTML = `
        <div class="error-message">
          <p>Audexa Reader can only be used on web pages.</p>
          <p>Please navigate to a web page to use this extension.</p>
        </div>
      `;
    }
  });
});