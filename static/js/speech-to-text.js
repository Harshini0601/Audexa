class SpeechToTextManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.onTranscriptUpdate = null;
        this.onStatusChange = null;
        this.initialize();
    }

    initialize() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.setupRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
        } else {
            console.error('Speech recognition is not supported in this browser');
            return false;
        }
        return true;
    }

    setupRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStatusChange) {
                this.onStatusChange('listening');
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onStatusChange) {
                this.onStatusChange('stopped');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.onStatusChange) {
                this.onStatusChange('error', event.error);
            }
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript = finalTranscript;
            
            if (this.onTranscriptUpdate) {
                this.onTranscriptUpdate({
                    final: finalTranscript,
                    interim: interimTranscript
                });
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    clearTranscript() {
        this.transcript = '';
        if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate({
                final: '',
                interim: ''
            });
        }
    }
}

// Initialize speech-to-text functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('micButton');
    const clearButton = document.getElementById('clearButton');
    const statusIndicator = document.getElementById('statusIndicator');
    const finalTranscriptDiv = document.getElementById('finalTranscript');
    const interimTranscriptDiv = document.getElementById('interimTranscript');

    const speechToText = new SpeechToTextManager();

    // Update UI based on recognition status
    speechToText.onStatusChange = (status, error) => {
        switch (status) {
            case 'listening':
                micButton.classList.add('listening');
                micButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3zm0-1a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V4a4 4 0 0 0-4-4z"/>
                        <path d="M10.5 11.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5z"/>
                        <path d="M8 12.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                    Stop Recording
                `;
                statusIndicator.textContent = 'Listening...';
                break;
            case 'stopped':
                micButton.classList.remove('listening');
                micButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3zm0-1a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V4a4 4 0 0 0-4-4z"/>
                        <path d="M10.5 11.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5z"/>
                        <path d="M8 12.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                    Start Recording
                `;
                statusIndicator.textContent = 'Ready';
                break;
            case 'error':
                micButton.classList.remove('listening');
                statusIndicator.textContent = `Error: ${error}`;
                break;
        }
    };

    // Update transcript display
    speechToText.onTranscriptUpdate = ({ final, interim }) => {
        finalTranscriptDiv.textContent = final;
        interimTranscriptDiv.textContent = interim;
    };

    // Button click handlers
    micButton.addEventListener('click', () => {
        speechToText.toggleListening();
    });

    clearButton.addEventListener('click', () => {
        speechToText.clearTranscript();
        finalTranscriptDiv.textContent = '';
        interimTranscriptDiv.textContent = '';
    });
}); 