// Global variables
let vocabulary = [];
let currentIndex = 0;
let wrongWords = [];
let currentCycle = 1;
let totalCycles = 2;
let isChecking = false;
let speechSynthesis = window.speechSynthesis;
let autoSpeakEnabled = true; // New variable to control auto-speaking
let lastCheckTime = 0;

const DEBOUNCE_TIME = 1000; // 1 giây
const apiCache = {};
// API keys declaration
const apiKeys = [
    'AIzaSyDjgTk4uZQUCpFH5Zt8ZgP2CW-jhmkLv8o',
    'AIzaSyDaROReiR48rjfavf8Lk6XvphC6QxKPZo4',
    'AIzaSyD-LQ7BMIl85o0Tq3LogG2rBmtYjkOpogU'
];
let currentApiKeyIndex = 0; // Added to track the current API key

// Element references
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const vocabularyInput = document.getElementById('vocabularyInput');
const shuffleCheckbox = document.getElementById('shuffleCheckbox');
const cycleCountInput = document.getElementById('cycleCount');
const kanjiDisplay = document.getElementById('kanjiDisplay');
const answerInput = document.getElementById('answerInput');
const checkAnswerBtn = document.getElementById('checkAnswer');
const skipWordBtn = document.getElementById('skipWord');
const resultDisplay = document.getElementById('result');
const meaningDisplay = document.getElementById('meaning');
const progressText = document.getElementById('progressText');
const cycleText = document.getElementById('cycleText');
const progressBarFill = document.querySelector('.progress-bar-fill');
const restartLearningBtn = document.getElementById('restartLearning');
const wrongWordsTextarea = document.getElementById('wrongWords');
const copyAndRelearnBtn = document.getElementById('copyAndRelearn');
const clearVocabularyBtn = document.getElementById('clearVocabulary');
const voiceButton = document.getElementById('voiceButton');
const outputDiv = document.getElementById('output');
const speakCurrentWord = document.getElementById('speakCurrentWord');
const startLearningBtn = document.getElementById('startLearning');
const autoSpeakToggle = document.getElementById('autoSpeakToggle'); // New element for toggling auto-speak

// Initialize restart learning button
if (restartLearningBtn) {
    restartLearningBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn bắt đầu lại từ đầu? Tiến độ hiện tại sẽ bị mất.')) {
            // Reset entire state
            vocabulary = [];
            currentIndex = 0;
            wrongWords = [];
            currentCycle = 1;
            isChecking = false;
            
            // Clear saved data
            localStorage.removeItem('vocabularyLearnerState');
            
            // Reset UI
            answerInput.value = '';
            resultDisplay.classList.add('hidden');
            meaningDisplay.textContent = '';
            progressText.textContent = '0/0';
            progressBarFill.style.width = '0%';
            cycleText.textContent = `Chu kỳ: 0/${totalCycles}`;
            
            // Switch to input tab and focus on input field
            document.querySelector('[data-tab="input"]').click();
            vocabularyInput.focus();
        }
    });
}

// Setup auto-speak toggle if it exists
if (autoSpeakToggle) {
    autoSpeakToggle.addEventListener('change', () => {
        autoSpeakEnabled = autoSpeakToggle.checked;
        localStorage.setItem('autoSpeakEnabled', autoSpeakEnabled);
    });
    
    // Load saved preference
    const savedAutoSpeak = localStorage.getItem('autoSpeakEnabled');
    if (savedAutoSpeak !== null) {
        autoSpeakEnabled = savedAutoSpeak === 'true';
        autoSpeakToggle.checked = autoSpeakEnabled;
    }
}

const speakButton = document.getElementById('speakButton');

// Add check answer event listener
if (checkAnswerBtn) {
    checkAnswerBtn.addEventListener('click', () => {
        if (!isChecking) checkAnswer();
    });
}

// Add skip word event listener - This was missing
if (skipWordBtn) {
    skipWordBtn.addEventListener('click', async () => {
        if (isChecking) return; // Prevent skipping during checking
        
        isChecking = true;
        skipWordBtn.disabled = true;
        checkAnswerBtn.disabled = true;
        
        const currentWord = vocabulary[currentIndex];
        resultDisplay.textContent = `Đã bỏ qua: ${currentWord.hiragana}`;
        resultDisplay.className = "result skip";
        resultDisplay.classList.remove("hidden");
        meaningDisplay.textContent = currentWord.meaning || "";
        
        // Add the word to wrong words list for review
        if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
            wrongWords.push(currentWord);
        }
        
        // Wait a moment before moving to next word
        await new Promise(resolve => setTimeout(resolve, 1000));
        await moveToNextWord();
        
        skipWordBtn.disabled = false;
        checkAnswerBtn.disabled = false;
    });
}

// Add Enter key shortcut for checking answer
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('learning').classList.contains('active') && !isChecking) {
        e.preventDefault();
        checkAnswer();
    } else if (e.key === 'ArrowRight' && document.getElementById('learning').classList.contains('active') && !isChecking) {
        // Add right arrow key shortcut for skipping
        e.preventDefault();
        if (skipWordBtn) skipWordBtn.click();
    }
});

// Setup speak current word button
if (speakCurrentWord) {
    speakCurrentWord.addEventListener('click', () => {
        if (currentIndex < vocabulary.length) {
            speakWord(vocabulary[currentIndex].hiragana);
        }
    });
}

// Speech recognition variables
let recognition = null;
let isListening = false;
let interimResult = "";
let recognitionTimeout = null;

// Function to speak a word
function speakWord(text) {
    if (!speechSynthesis) {
        console.error("Speech synthesis not supported");
        return;
    }

    // Cancel current speech if any
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    
    // Get available voices and find a Japanese one
    const voices = speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => 
        voice.lang.includes('ja') || voice.lang.includes('JP')
    );
    
    if (japaneseVoice) {
        utterance.voice = japaneseVoice;
    }
    
    // Add error handling for speech synthesis
    utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
    };
    
    speechSynthesis.speak(utterance);
}

// Initialize speak button
if (speakButton) {
    speakButton.addEventListener('click', () => {
        if (currentIndex < vocabulary.length) {
            speakWord(vocabulary[currentIndex].hiragana);
        }
    });
}

// Voice recognition setup
function setupVoiceRecognition() {
    if (!recognition) {
        try {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'ja-JP';
            recognition.interimResults = true;
            recognition.continuous = true;
            recognition.maxAlternatives = 3;

            recognition.onstart = () => {
                isListening = true;
                voiceButton.classList.add('recording');
                outputDiv.textContent = "Đang nghe...";
                outputDiv.classList.remove('hidden');
                
                if (recognitionTimeout) {
                    clearTimeout(recognitionTimeout);
                }
            };

            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                
                if (event.error === 'no-speech') {
                    outputDiv.textContent = "Không nghe thấy gì. Vui lòng nói to hơn.";
                } else if (event.error === 'network') {
                    outputDiv.textContent = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.";
                } else {
                    outputDiv.textContent = "Lỗi: " + event.error;
                }
                
                if (isListening && event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
                    setTimeout(() => {
                        if (isListening) recognition.start();
                    }, 1000);
                } else {
                    stopVoiceRecognition();
                }
            };

            recognition.onend = () => {
                if (isListening) {
                    setTimeout(() => {
                        if (isListening) recognition.start();
                    }, 500);
                } else {
                    voiceButton.classList.remove('recording');
                }
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;
                    
                    if (result.isFinal) {
                        finalTranscript += transcript;
                        if (answerInput.value) {
                            answerInput.value += ' ' + finalTranscript;
                        } else {
                            answerInput.value = finalTranscript;
                        }
                        outputDiv.textContent = "Đã nhận: " + answerInput.value;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (interimTranscript && !finalTranscript) {
                    outputDiv.textContent = "Đang nghe: " + interimTranscript;
                }
                
                if (recognitionTimeout) {
                    clearTimeout(recognitionTimeout);
                }
                recognitionTimeout = setTimeout(() => {
                    stopVoiceRecognition();
                }, 1500);
            };
        } catch (error) {
            console.error("Error setting up voice recognition:", error);
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome hoặc Edge.");
        }
    }
}

function startVoiceRecognition() {
    setupVoiceRecognition();
    if (recognition) {
        try {
            isListening = true;
            recognition.start();
        } catch (error) {
            console.error("Error starting voice recognition:", error);
        }
    }
}

function stopVoiceRecognition() {
    if (recognition) {
        isListening = false;
        recognition.stop();
        
        if (interimResult && !answerInput.value) {
            answerInput.value = interimResult;
            outputDiv.textContent = "Đã nhận: " + interimResult;
        }
        
        interimResult = "";
        voiceButton.classList.remove('recording');
        
        if (recognitionTimeout) {
            clearTimeout(recognitionTimeout);
            recognitionTimeout = null;
        }
    }
}

function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// Initialize voice button
if (voiceButton) {
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceButton.title = "Nhấn để bắt đầu nhận diện giọng nói (F3)";
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
    // F3 keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            toggleVoiceRecognition();
        }
    });
}

// Save and load state from localStorage
function saveState() {
    const state = {
        vocabulary,
        currentIndex,
        wrongWords,
        currentCycle,
        totalCycles,
        inputText: vocabularyInput.value,
        autoSpeakEnabled
    };
    localStorage.setItem('vocabularyLearnerState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('vocabularyLearnerState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            vocabulary = state.vocabulary || [];
            currentIndex = state.currentIndex || 0;
            wrongWords = state.wrongWords || [];
            currentCycle = state.currentCycle || 1;
            totalCycles = state.totalCycles || 2;
            
            if (state.autoSpeakEnabled !== undefined) {
                autoSpeakEnabled = state.autoSpeakEnabled;
                if (autoSpeakToggle) {
                    autoSpeakToggle.checked = autoSpeakEnabled;
                }
            }
            
            if (state.inputText) {
                vocabularyInput.value = state.inputText;
            }
            
            return vocabulary.length > 0;
        } catch (e) {
            console.error("Error loading state:", e);
            return false;
        }
    }
    return false;
}

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.disabled) return;

        const tabId = tab.getAttribute('data-tab');

        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Add a beforeunload event handler to warn user before leaving
window.addEventListener('beforeunload', (event) => {
    // If there's an active learning session, show a confirmation dialog
    if (vocabulary.length > 0 && currentCycle <= totalCycles) {
        event.preventDefault();
        event.returnValue = "Bạn có muốn rời khỏi trang? Tiến độ học có thể bị mất.";
        return event.returnValue;
    }
});

// Handle finishing a learning session
async function finishLearning() {
    // Stop active features
    if (isListening) stopVoiceRecognition();
    speechSynthesis.cancel();

    // Exit fullscreen if active
    if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (error) {
            console.error("Error exiting fullscreen:", error);
        }
    }

    // Reset UI
    answerInput.value = '';
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    progressText.textContent = '0/0';
    progressBarFill.style.width = '0%';
    cycleText.textContent = `Chu kỳ: 0/${totalCycles}`;
    wrongWordsTextarea.value = '';

    // Handle wrong words
    if (wrongWords.length > 0) {
        document.querySelector('[data-tab="wrong"]').disabled = false;
        document.querySelector('[data-tab="wrong"]').click();
        wrongWordsTextarea.value = wrongWords.map(word =>
            `${word.kanji}=${word.hiragana}=${word.meaning}`
        ).join('\n');
        
        // Show congratulations with wrong word count
        alert(`Hoàn thành! Bạn có ${wrongWords.length} từ cần ôn tập lại.`);
    } else {
        alert('Chúc mừng! Bạn đã học tất cả từ vựng đúng!');
        document.querySelector('[data-tab="input"]').click();
    }

    // Clear saved state
    localStorage.removeItem('vocabularyLearnerState');
}

// Start learning button handler
startLearningBtn.addEventListener('click', () => {
    // Reset UI
    answerInput.value = '';
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    wrongWordsTextarea.value = '';

    // Validate input
    const inputText = vocabularyInput.value.trim();
    if (!inputText) {
        alert('Vui lòng nhập danh sách từ vựng!');
        return;
    }

    // Process vocabulary
    const lines = inputText.split('\n');
    vocabulary = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.trim().split('=');
        if (parts.length < 2) {
            alert(`Định dạng không hợp lệ: ${line}\nVui lòng sử dụng định dạng: Kanji=Hiragana=Nghĩa`);
            return;
        }

        vocabulary.push({
            kanji: parts[0].trim(),
            hiragana: parts[1].trim(),
            meaning: parts.length > 2 ? parts[2].trim() : ''
        });
    }

    if (vocabulary.length === 0) {
        alert('Không có từ vựng nào được nhập!');
        return;
    }

    // Setup learning session
    totalCycles = Math.max(1, parseInt(cycleCountInput.value) || 2);
    if (shuffleCheckbox.checked) shuffleArray(vocabulary);

    currentIndex = 0;
    currentCycle = 1;
    wrongWords = [];
    isChecking = false;

    saveState();

    // Start session
    document.querySelector('[data-tab="learning"]').disabled = false;
    document.querySelector('[data-tab="learning"]').click();
    updateProgressUI();
    showCurrentWord();
    answerInput.focus();

    // Enter fullscreen
    try {
        document.documentElement.requestFullscreen().catch(console.error);
    } catch (error) {
        console.error("Error requesting fullscreen:", error);
        // Continue even if fullscreen fails
    }
});

// Copy and relearn wrong words button
copyAndRelearnBtn.addEventListener('click', () => {
    if (wrongWords.length === 0) {
        alert('Không có từ nào để học lại!');
        return;
    }

    const wrongWordsText = wrongWords.map(word =>
        `${word.kanji}=${word.hiragana}=${word.meaning}`
    ).join('\n');

    // Reset UI and state
    vocabularyInput.value = wrongWordsText;
    answerInput.value = '';
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    
    // Reset state variables
    currentIndex = 0;
    currentCycle = 1;
    wrongWords = [];
    isChecking = false;
    
    // Reset API cache
    Object.keys(apiCache).forEach(key => {
        delete apiCache[key];
    });
    
    saveState();

    // Switch tab and focus
    document.querySelector('[data-tab="input"]').click();
    vocabularyInput.focus();
    alert('Đã chuẩn bị danh sách từ sai để học lại. Nhấn "Bắt đầu học" khi sẵn sàng!');
});

// Improved check answer function
async function checkAnswer() {
    const now = Date.now();
    if (isChecking || now - lastCheckTime < DEBOUNCE_TIME) return;
    lastCheckTime = now;
    
    isChecking = true;
    disableButtons();
    
    const currentWord = vocabulary[currentIndex];
    const userAnswer = answerInput.value.trim();
	
	if (userAnswer === "") {
		await handleIncorrectAnswer(currentWord);
		return;
	}

    
    try {
        // Hiển thị trạng thái kiểm tra
        showCheckingUI();
        
        // Tự động phát âm nếu được bật
        if (autoSpeakEnabled) {
            speakWord(currentWord.hiragana);
        }
        
        // Kiểm tra đáp án
        const isCorrect = await checkAnswerWithFallback(userAnswer, currentWord);
        
        if (isCorrect) {
            await handleCorrectAnswer(currentWord);
        } else {
            await handleIncorrectAnswer(currentWord);
        }
    } catch (error) {
        console.error("Unexpected error in checkAnswer:", error);
        resultDisplay.textContent = "Lỗi hệ thống! Vui lòng thử lại";
        resultDisplay.className = "result error";
    } finally {
        // Luôn enable lại nút và lưu trạng thái
        if (!isChecking) { // Chỉ enable nếu không chuyển từ
            enableButtons();
        }
        saveState();
    }
}

// Các hàm helper mới
function disableButtons() {
    checkAnswerBtn.disabled = true;
    skipWordBtn.disabled = true;
}

function enableButtons() {
    checkAnswerBtn.disabled = false;
    skipWordBtn.disabled = false;
}

function showCheckingUI() {
    resultDisplay.textContent = "Đang kiểm tra...";
    resultDisplay.className = "result checking";
    resultDisplay.classList.remove("hidden");
    meaningDisplay.textContent = "";
}

async function checkAnswerWithFallback(userAnswer, currentWord) {
    try {
        return await checkWithAI(userAnswer, currentWord.hiragana);
    } catch (error) {
        console.error("API check failed, using fallback:", error);
        const normalizedInput = userAnswer.toLowerCase().replace(/\s+/g, '');
        const normalizedCorrect = currentWord.hiragana.toLowerCase().replace(/\s+/g, '');
        return normalizedInput === normalizedCorrect;
    }
}

async function handleCorrectAnswer(currentWord) {
    resultDisplay.textContent = "✓ Chính xác!";
    resultDisplay.className = "result correct";
    meaningDisplay.textContent = currentWord.meaning || "";
    
    // Hiệu ứng visual
    kanjiDisplay.classList.add('correct-animation');
    await new Promise(r => setTimeout(r, 800));
    kanjiDisplay.classList.remove('correct-animation');
    
    // Chờ trước khi chuyển từ
    await new Promise(resolve => setTimeout(resolve, 200));
    await moveToNextWord();
}

async function handleIncorrectAnswer(currentWord) {
    resultDisplay.textContent = `✗ Sai rồi! Đáp án đúng là: ${currentWord.hiragana}`;
    resultDisplay.className = "result incorrect";
    meaningDisplay.textContent = currentWord.meaning || "";
    
    // Thêm vào danh sách từ sai nếu chưa có
    if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
        wrongWords.push(currentWord);
    }
    
    // Reset input
    answerInput.value = '';
    interimResult = "";
    isChecking = false;
    
    // Focus lại ô nhập liệu
    answerInput.focus();
}

// Improved move to next word function
async function moveToNextWord() {
    interimResult = "";
    currentIndex++;

    if (currentIndex >= vocabulary.length) {
        currentIndex = 0;
        currentCycle++;
        
        if (currentCycle > totalCycles) {
            await finishLearning();
            return;
        }
        
        // Reshuffle for the next cycle if shuffle is checked
        if (shuffleCheckbox.checked) {
            shuffleArray(vocabulary);
        }
    }

    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    answerInput.value = '';
    updateProgressUI();
    showCurrentWord();
    answerInput.focus();
    
    isChecking = false;
}

// Improved API checking function with key rotation
async function checkWithAI(userInput, correctHiragana) {
    const cacheKey = `${userInput}:${correctHiragana}`;

    // Check cache first
    if (apiCache[cacheKey] !== undefined) {
        return apiCache[cacheKey];
    }
    
    // Process input (handle romaji)
    let processedInput = userInput;
    if (/^[a-zA-Z0-9\s,.?!;:'"()\-]+$/.test(userInput)) {
        console.log("Latin alphabet input detected, treating as romaji");
    }

    const prompt = `
Evaluate Japanese answer flexibility. Act as a Japanese language teacher evaluating student responses.

Rules for evaluation:
1. ACCEPT different ways of expressing the same meaning in Japanese
2. ACCEPT both hiragana and katakana representations of the same sound
3. ACCEPT romaji (Latin alphabet) input that correctly represents the Japanese sounds
4. ACCEPT particle variations where appropriate (は/wa, へ/e, を/o)
5. ACCEPT answers with different word order if grammatically correct
6. For sentences, focus on meaning equivalence rather than exact character matching
7. For vocabulary words, be stricter about pronunciation but accept alternative forms

Compare:
Student answer: ${processedInput}  
Expected answer: ${correctHiragana}

Considering all the above rules, is the student's answer correct? Output only 'true' or 'false'.
`;

    // Try up to 3 times with different API keys
    let attempts = 0;
    const maxAttempts = apiKeys.length;
    
    while (attempts < maxAttempts) {
        try {
            // Use the current API key
            const currentApiKey = apiKeys[currentApiKeyIndex];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            // Check for API key error or quota exceeded
            if (data.error && (data.error.code === 403 || data.error.message?.includes('quota'))) {
                console.warn(`API key ${currentApiKeyIndex + 1} quota exceeded, trying next key...`);
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                attempts++;
                continue;
            }

            // Process valid response
            if (data && data.candidates && data.candidates[0].content) {
                const resultText = data.candidates[0].content.parts[0].text.trim().toLowerCase();
                const isCorrect = resultText === "true";
                apiCache[cacheKey] = isCorrect;
                return isCorrect;
            } else {
                console.error("Invalid response from API:", data);
                throw new Error("Invalid API response");
            }
        } catch (error) {
            console.error(`Error with API key ${currentApiKeyIndex + 1}:`, error);
            currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
            attempts++;
        }
    }
    
    // All API attempts failed, fall back to direct comparison
    console.warn("All API attempts failed, using direct comparison");
    const normalizedInput = processedInput.toLowerCase().replace(/\s+/g, '');
    const normalizedCorrect = correctHiragana.toLowerCase().replace(/\s+/g, '');
    return normalizedInput === normalizedCorrect;
}

// Helper functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showCurrentWord() {
    if (currentIndex < vocabulary.length) {
        kanjiDisplay.textContent = vocabulary[currentIndex].kanji;
        answerInput.focus();
    } else {
        kanjiDisplay.textContent = '';
    }
}

function updateProgressUI() {
    const total = vocabulary.length;
    const current = currentIndex + 1;
    const percentage = total > 0 ? (currentIndex / total) * 100 : 0;

    progressText.textContent = `${current}/${total}`;
    cycleText.textContent = `Chu kỳ: ${currentCycle}/${totalCycles}`;
    progressBarFill.style.width = `${percentage}%`;
}

// Add clear vocabulary button handler if it exists
if (clearVocabularyBtn) {
    clearVocabularyBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa tất cả từ vựng đã nhập?')) {
            vocabularyInput.value = '';
            vocabularyInput.focus();
        }
    });
}

// Initialize when page loads
window.addEventListener('load', () => {
    // Load voices for speech synthesis
    if (speechSynthesis) {
        // Some browsers need to wait for voices to load
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                console.log("Voices loaded:", speechSynthesis.getVoices().length);
            });
        }
    }
    
    // Load saved state
    if (loadState()) {
        updateProgressUI();
        showCurrentWord();
        
        if (confirm('Phát hiện dữ liệu học tập đã lưu. Bạn có muốn tiếp tục không?')) {
            document.querySelector('[data-tab="learning"]').disabled = false;
            document.querySelector('[data-tab="learning"]').click();
            answerInput.focus();
        }
    }
    
    // Check if browser supports speech synthesis
    if (!speechSynthesis) {
        console.warn("Speech synthesis not supported");
        if (speakButton) speakButton.disabled = true;
        if (speakCurrentWord) speakCurrentWord.disabled = true;
        if (autoSpeakToggle) {
            autoSpeakToggle.disabled = true;
            autoSpeakToggle.checked = false;
            autoSpeakEnabled = false;
        }
    }
    
    // Add fullscreen change event listener
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && vocabulary.length > 0 && currentCycle <= totalCycles) {
            // User manually exited fullscreen during learning
            console.log("User exited fullscreen during learning session");
        }
    });
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (recognition && isListening) {
        stopVoiceRecognition();
    }
    
    // Cancel any ongoing speech
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
});