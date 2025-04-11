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

// Export the manager
window.SpeechToTextManager = SpeechToTextManager; 