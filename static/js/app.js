console.log("app.js loaded");
const BASE_URL = "http://127.0.0.1:8000";

function cleanText(input) {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');
}

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM fully loaded");
  
  // Landing animation sequence
  const icon = document.getElementById('landingIcon');
  const title = document.getElementById('landingTitle');
  const mainContent = document.getElementById('mainContent');

  if (icon && title && mainContent) {
    icon.classList.add('visible');
    setTimeout(() => {
      title.classList.add('visible');
      setTimeout(() => {
        mainContent.classList.add('visible');
        mainContent.classList.remove('hidden');
      }, 700); // after title
    }, 700); // after icon
  }
  
  // Set first tab as active by default
  openTab("textTab");
  
  // Initialize PDF form
  const pdfForm = document.getElementById("pdfForm");
  if (pdfForm) {
    pdfForm.addEventListener("submit", handlePdfSubmit);
    console.log("PDF form event listener attached");
  } else {
    console.error("PDF form element not found");
  }
});

async function summarize() {
  const rawText = document.getElementById("text").value;
  const text = cleanText(rawText);
  const summary = document.getElementById("summary");
  
  if (!text.trim()) {
    summary.innerText = "Please enter some text to summarize.";
    return;
  }
  
  // Set loading state
  summary.innerText = "Summarizing...";
  
  // More sophisticated calculation for sentence count and detailed flag
  const wordCount = text.split(/\s+/).length;
  
  // Dynamic sentence count based on text complexity and length
  let sentence_count;
  let detailed = false;
  
  if (wordCount < 100) {
    // Very short texts need fewer sentences
    sentence_count = 2;
  } else if (wordCount < 300) {
    sentence_count = 3;
  } else if (wordCount < 600) {
    sentence_count = 5;
    detailed = true; // Start using detailed mode for medium length texts
  } else if (wordCount < 1000) {
    sentence_count = 6;
    detailed = true;
  } else if (wordCount < 2000) {
    sentence_count = 7;
    detailed = true;
  } else {
    // Very long texts need more sentences and detailed processing
    sentence_count = 9;
    detailed = true;
  }
                       
  console.log(`Summarizing text with ${wordCount} words using sentence_count=${sentence_count}, detailed=${detailed}`);
  
  try {
    const res = await fetch(`${BASE_URL}/summarize/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, 
        sentence_count,
        detailed
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    if (data.summary) {
      summary.innerText = data.summary;
    } else {
      console.error("Response missing summary:", data);
      summary.innerText = "Failed to generate summary.";
    }
  } catch (error) {
    console.error("Summarization error:", error);
    summary.innerText = `Error: ${error.message}`;
  }
}

async function generateTTS() {
  const text = document.getElementById('text').value.trim();
  const audioPlayer = document.getElementById('audioPlayer');

  if (!text) {
      alert('Please enter some text');
      return;
  }

  try {
      const params = new URLSearchParams({
          text: text,
          lang: 'en'
      });

      const response = await fetch(`${BASE_URL}/tts?${params.toString()}`, {
          method: 'GET'
      });

      if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to generate TTS');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      audioPlayer.src = audioUrl;
      audioPlayer.style.display = "block"; // Make sure it's visible
      audioPlayer.load();
      console.log("Playing audio");
      audioPlayer.play().catch(e => {
        console.error("Audio playback failed:", e);
        alert(`Audio playback failed: ${e.message}`);
      });
  } catch (error) {
      console.error('TTS Error:', error);
      alert(`Error: ${error.message}`);
  }
}

// PDF form submit handler as a separate named function
async function handlePdfSubmit(e) {
  e.preventDefault();
  console.log("PDF form submitted");

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];
  const resultDiv = document.getElementById("pdfTestResult");
  
  resultDiv.textContent = "";
  resultDiv.style.color = "#333";

  if (!file) {
    alert("Please select a PDF file.");
    resultDiv.textContent = "Error: No file selected";
    resultDiv.style.color = "red";
    return;
  }

  console.log("PDF file selected:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB", "Type:", file.type);

  // Check file is a PDF (by extension and type)
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === "application/pdf" || file.type === "application/x-pdf";
  if (!isPdf) {
    alert("Please select a valid PDF file.");
    resultDiv.textContent = `Error: Invalid file type (${file.type})`;
    resultDiv.style.color = "red";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  console.log("FormData created with file");
  console.log("FormData contents:", formData.get("file").name);
  
  // Show loading indicator
  const submitButton = document.querySelector("#pdfForm button[type='submit']");
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Converting...";
  resultDiv.textContent = "Processing PDF...";

  try {
    console.log("Sending PDF to server at:", `${BASE_URL}/tts/pdf`);
    const response = await fetch(`${BASE_URL}/tts/pdf`, {
      method: "POST",
      body: formData
    });
    
    console.log("Server response received:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = "Failed to convert PDF to audio";
      try {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (jsonError) {
          errorMessage = errorText || errorMessage;
        }
      } catch (readError) {
        console.error("Error reading response:", readError);
      }
      
      throw new Error(errorMessage);
    }

    console.log("Starting to read response as blob");
    const blob = await response.blob();
    console.log("Blob received, size:", blob.size, "bytes", "type:", blob.type);
    
    if (blob.size === 0) {
      throw new Error("Received empty audio file");
    }
    
    const audioUrl = URL.createObjectURL(blob);
    console.log("Audio URL created:", audioUrl);

    // Use the correct audio player for the PDF tab
    const audioPlayer = document.getElementById("audioPlayerPdf");
    console.log("Setting audio player source");
    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block";
    
    // Add download link
    const downloadContainer = document.createElement("div");
    downloadContainer.style.marginTop = "10px";
    downloadContainer.innerHTML = `<a href="${audioUrl}" download="${file.name.replace('.pdf', '.mp3')}">Download Audio File</a>`;
    
    // Clear any previous download links
    const existingDownloads = document.querySelectorAll("#pdfTab a[download]");
    existingDownloads.forEach(link => link.parentNode.remove());
    
    audioPlayer.parentNode.insertBefore(downloadContainer, audioPlayer.nextSibling);
    
    resultDiv.textContent = "PDF converted successfully!";
    resultDiv.style.color = "green";
    
    console.log("Loading audio");
    audioPlayer.load();
    console.log("Playing audio");
    audioPlayer.play().catch(e => {
      console.error("Audio playback failed:", e);
      resultDiv.textContent = `Audio loaded, but playback failed: ${e.message}. You can still download the file.`;
    });
  } catch (error) {
    console.error("PDF conversion error:", error);
    alert(`Error: ${error.message || "An error occurred during PDF conversion"}`);
    resultDiv.textContent = `Error: ${error.message || "PDF conversion failed"}`;
    resultDiv.style.color = "red";
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

async function askQuestion() {
  const question = document.getElementById("question").value.trim();
  const answer = document.getElementById("answer");

  if (!question) {
    alert("Please enter a question.");
    return;
  }

  // Show loading indicator
  answer.innerText = "Thinking...";

  try {
    console.log("Sending question to chatbot:", question);
    
    const res = await fetch("/chatbot/", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: question
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`Server returned ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("Chatbot response:", data);
    
    if (data && data.answer) {
      answer.innerText = data.answer;
    } else {
      console.error("Response missing answer property:", data);
      answer.innerText = "No answer received.";
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    answer.innerText = `Error: ${error.message}`;
  }
}

// Tab switching functionality
function openTab(tabName) {
  // Hide all tab contents
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  // Remove active class from all tab buttons
  const tabButtons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }

  // Show the selected tab content and mark its button as active
  document.getElementById(tabName).style.display = "block";
  
  // Find the button that corresponds to this tab and add the active class
  const buttons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute("onclick").includes(tabName)) {
      buttons[i].classList.add("active");
    }
  }
}

async function translateText() {
  const text = document.getElementById('translateText').value.trim();
  const targetLang = document.getElementById('targetLang').value;
  const translatedTextDiv = document.getElementById('translatedText');
  
  if (!text) {
    translatedTextDiv.innerText = "Please enter some text to translate.";
    return;
  }
  
  // Set loading state
  translatedTextDiv.innerText = "Translating...";
  
  try {
    const res = await fetch(`${BASE_URL}/translate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, 
        lang: targetLang
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    if (data.translated_text) {
      translatedTextDiv.innerText = data.translated_text;
    } else {
      console.error("Response missing translated_text:", data);
      translatedTextDiv.innerText = "Failed to translate text.";
    }
  } catch (error) {
    console.error("Translation error:", error);
    translatedTextDiv.innerText = `Error: ${error.message}`;
  }
}

async function downloadExtension() {
    try {
        const response = await fetch('/download-extension');
        if (!response.ok) {
            throw new Error('Failed to download extension');
        }
        
        // Get the filename from the Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'audexa-reader-extension.zip';
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a temporary link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Show success message
        alert('Extension downloaded successfully! Please follow the installation instructions.');
    } catch (error) {
        console.error('Error downloading extension:', error);
        alert('Failed to download extension. Please try again later.');
    }
}