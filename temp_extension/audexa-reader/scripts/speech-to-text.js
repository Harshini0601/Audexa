class SpeechToTextWidget {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.transcription = '';
        this.container = null;
        this.statusElement = null;
        this.transcriptElement = null;
        this.copyButton = null;
        this.clearButton = null;
        this.toggleButton = null;
        this.initialize();
    }

    initialize() {
        // Create widget container
        this.container = document.createElement('div');
        this.container.className = 'speech-to-text-widget';
        this.container.innerHTML = `
            <div class="stt-header">
                <span class="stt-title">Speech to Text</span>
                <button class="stt-close-btn">×</button>
            </div>
            <div class="stt-status">Click microphone to start</div>
            <div class="stt-controls">
                <button class="stt-toggle-btn">
                    <div class="microphone-icon"></div>
                </button>
                <button class="stt-copy-btn" title="Copy text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <button class="stt-clear-btn" title="Clear text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div class="stt-transcript" contenteditable="true"></div>
        `;

        // Get elements
        this.statusElement = this.container.querySelector('.stt-status');
        this.transcriptElement = this.container.querySelector('.stt-transcript');
        this.toggleButton = this.container.querySelector('.stt-toggle-btn');
        this.copyButton = this.container.querySelector('.stt-copy-btn');
        this.clearButton = this.container.querySelector('.stt-clear-btn');
        const closeButton = this.container.querySelector('.stt-close-btn');

        // Add event listeners
        this.toggleButton.addEventListener('click', () => this.toggleListening());
        this.copyButton.addEventListener('click', () => this.copyTranscript());
        this.clearButton.addEventListener('click', () => this.clearTranscript());
        closeButton.addEventListener('click', () => this.hide());

        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.toggleButton.classList.add('listening');
                this.updateStatus('Listening...');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.toggleButton.classList.remove('listening');
                this.updateStatus('Click microphone to start');
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    this.transcription += finalTranscript;
                    this.updateTranscript();
                }
                
                if (interimTranscript) {
                    this.transcriptElement.innerHTML = this.transcription + 
                        '<span class="interim">' + interimTranscript + '</span>';
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('Error: ' + event.error);
                this.isListening = false;
                this.toggleButton.classList.remove('listening');
            };
        } else {
            this.updateStatus('Speech recognition not supported in this browser');
            this.toggleButton.disabled = true;
        }

        // Add to page
        document.body.appendChild(this.container);
        this.hide();
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
        if (this.isListening) {
            this.toggleListening();
        }
    }

    toggleListening() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    updateTranscript() {
        this.transcriptElement.innerHTML = this.transcription;
        this.transcriptElement.scrollTop = this.transcriptElement.scrollHeight;
    }

    copyTranscript() {
        navigator.clipboard.writeText(this.transcription).then(() => {
            const originalText = this.copyButton.title;
            this.copyButton.title = 'Copied!';
            setTimeout(() => {
                this.copyButton.title = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    clearTranscript() {
        this.transcription = '';
        this.updateTranscript();
    }
}

// Initialize the widget
const sttWidget = new SpeechToTextWidget();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleSpeechToText') {
        if (sttWidget.container.style.display === 'none') {
            sttWidget.show();
        } else {
            sttWidget.hide();
        }
    }
}); 