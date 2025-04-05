const BASE_URL = "http://127.0.0.1:8000";

async function summarize() {
  const text = document.getElementById("text").value;
  const res = await fetch(${BASE_URL}/summarize/, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  document.getElementById("summary").innerText = data.summary;
}

async function generateTTS() {
  const text = document.getElementById("text").value;
  const voice = document.getElementById("voice").value;
  const rate = document.getElementById("rate").value;
  const res = await fetch(${BASE_URL}/tts/, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, rate })
  });
  const data = await res.json();
  const audioUrl = BASE_URL + data.audio_url;
  document.getElementById("audioPlayer").src = audioUrl;
}

async function translate() {
  const text = document.getElementById("text").value;
  const lang = document.getElementById("lang").value;
  const res = await fetch(${BASE_URL}/translate/, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang })
  });
  const data = await res.json();
  document.getElementById("translated").innerText = data.translated_text;
}

async function askQuestion() {
  const context = document.getElementById("text").value;
  const question = document.getElementById("question").value;
  const res = await fetch(${BASE_URL}/chatbot/, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, question })
  });
  const data = await res.json();
  document.getElementById("answer").innerText = data.answer;
}