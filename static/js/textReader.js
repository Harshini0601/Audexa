class TextReader {
    constructor() {
        this.speech = new SpeechSynthesisUtterance();
        this.speech.rate = 1;
        this.speech.pitch = 1;
        this.speech.volume = 1;
        this.isReading = false;
        this.currentElement = null;
        this.highlightClass = 'reading-highlight';
        this.sentences = [];
        this.currentSentenceIndex = 0;
    }

    // Initialize the reader
    init() {
        this.setupEventListeners();
        this.addHighlightStyles();
    }

    // Add CSS styles for highlighting
    addHighlightStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .${this.highlightClass} {
                background-color: var(--primary-color);
                color: white;
                padding: 2px 4px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        this.speech.onboundary = (event) => {
            if (event.name === 'sentence') {
                this.highlightCurrentSentence(event.charIndex);
            }
        };

        this.speech.onend = () => {
            this.isReading = false;
            this.removeHighlight();
            this.currentSentenceIndex = 0;
        };
    }

    // Split text into sentences
    splitIntoSentences(text) {
        return text.split(/([.!?]+\s+)/)
            .filter(sentence => sentence.trim().length > 0)
            .map(sentence => sentence.trim());
    }

    // Get all readable text from the page
    getPageText() {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div');
        let text = '';
        const elements = [];

        textElements.forEach(element => {
            if (element.textContent.trim() && !element.closest('nav, header, footer')) {
                text += element.textContent + ' ';
                elements.push(element);
            }
        });

        return { text, elements };
    }

    // Start reading the page
    startReading() {
        if (this.isReading) {
            window.speechSynthesis.cancel();
            this.isReading = false;
            this.removeHighlight();
            this.currentSentenceIndex = 0;
            return;
        }

        const { text, elements } = this.getPageText();
        if (!text) return;

        this.isReading = true;
        this.sentences = this.splitIntoSentences(text);
        this.elements = elements;
        
        this.readNextSentence();
    }

    // Read the next sentence
    readNextSentence() {
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.isReading = false;
            return;
        }

        const sentence = this.sentences[this.currentSentenceIndex];
        this.speech.text = sentence;
        window.speechSynthesis.speak(this.speech);
        this.currentSentenceIndex++;
    }

    // Highlight the current sentence
    highlightCurrentSentence() {
        this.removeHighlight();

        if (this.currentSentenceIndex === 0) return;

        const currentSentence = this.sentences[this.currentSentenceIndex - 1];
        let found = false;

        for (let i = 0; i < this.elements.length && !found; i++) {
            const element = this.elements[i];
            const text = element.textContent;
            
            if (text.includes(currentSentence)) {
                const startIndex = text.indexOf(currentSentence);
                const endIndex = startIndex + currentSentence.length;

                const beforeText = text.substring(0, startIndex);
                const highlightedText = <span class="${this.highlightClass}">${currentSentence}</span>;
                const afterText = text.substring(endIndex);

                element.innerHTML = beforeText + highlightedText + afterText;
                this.currentElement = element;
                found = true;
            }
        }
    }

    // Remove highlight from current sentence
    removeHighlight() {
        if (this.currentElement) {
            const highlight = this.currentElement.querySelector(.${this.highlightClass});
            if (highlight) {
                highlight.outerHTML = highlight.textContent;
            }
            this.currentElement = null;
        }
    }

    // Control methods
    pauseReading() {
        if (this.isReading) {
            window.speechSynthesis.pause();
        }
    }

    resumeReading() {
        if (this.isReading) {
            window.speechSynthesis.resume();
        }
    }

    stopReading() {
        window.speechSynthesis.cancel();
        this.isReading = false;
        this.removeHighlight();
        this.currentSentenceIndex = 0;
    }

    // Settings methods
    setRate(rate) {
        this.speech.rate = rate;
    }

    setPitch(pitch) {
        this.speech.pitch = pitch;
    }

    setVolume(volume) {
        this.speech.volume = volume;
    }
}

// Initialize the text reader
const textReader = new TextReader();
textReader.init();

// Export for use in other files
window.textReader = textReader;