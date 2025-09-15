// voiceAuth.js

let storedPhrase = "";
let storedVolume = 0;

// 🎙️ Speech Recognition
function recognizeSpeech(callback, statusElement) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    if (statusElement) statusElement.textContent = "🎤 Listening...";

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("You said:", transcript);
        if (statusElement) statusElement.textContent = "✅ Captured: " + transcript;
        callback(transcript);
    };

    recognition.onerror = () => {
        if (statusElement) statusElement.textContent = "❌ Error capturing speech";
    };
}

// 🎚️ Analyze Voice (Volume)
async function analyzeVoice(duration = 2000) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let volumes = [];

    return new Promise((resolve) => {
        const start = Date.now();

        function analyze() {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            volumes.push(avg);

            if (Date.now() - start < duration) {
                requestAnimationFrame(analyze);
            } else {
                const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
                resolve(avgVolume);
            }
        }
        analyze();
    });
}

// 🛡️ Enrollment
async function enrollVoice() {
    const status = document.getElementById("recording-status");

    recognizeSpeech(async (phrase) => {
        storedPhrase = phrase.toLowerCase();
        storedVolume = await analyzeVoice();

        document.getElementById("save-enrollment").style.display = "block";
        status.textContent = "✅ Voiceprint ready to save!";
    }, status);
}

// Save enrollment
function saveEnrollment() {
    document.getElementById("enrollment-section").style.display = "none";
    document.getElementById("authentication-section").style.display = "block";
}

// 🛡️ Authentication
async function authenticateVoice() {
    const status = document.getElementById("auth-status");

    recognizeSpeech(async (phrase) => {
        const loginVolume = await analyzeVoice();

        const phraseMatch = phrase.toLowerCase() === storedPhrase;
        const volumeMatch = Math.abs(loginVolume - storedVolume) < 15;

        const score = Math.round((phraseMatch && volumeMatch ? 100 : 50));
        document.getElementById("similarity-display").style.display = "block";
        document.getElementById("score-value").textContent = score + "%";
        document.getElementById("similarity-fill").style.width = score + "%";

        if (phraseMatch && volumeMatch) {
            status.textContent = "✅ Authenticated!";
            document.getElementById("auth-result").textContent = "🔓 Access Granted";
        } else {
            status.textContent = "❌ Authentication failed";
            document.getElementById("auth-result").textContent = "🔒 Access Denied";
        }
    }, status);
}

// 🛡️ Reset
function resetEnrollment() {
    storedPhrase = "";
    storedVolume = 0;
    document.getElementById("enrollment-section").style.display = "block";
    document.getElementById("authentication-section").style.display = "none";
    document.getElementById("save-enrollment").style.display = "none";
    document.getElementById("similarity-display").style.display = "none";
    document.getElementById("auth-result").textContent = "";
}

// Attach events
document.getElementById("record-enrollment").addEventListener("click", enrollVoice);
document.getElementById("save-enrollment").addEventListener("click", saveEnrollment);
document.getElementById("record-auth").addEventListener("click", authenticateVoice);
document.getElementById("reset-enrollment").addEventListener("click", resetEnrollment);
