// Global variables
let vocabulary = [];
let currentIndex = 0;
let wrongWords = [];
let currentCycle = 1;
let totalCycles = 2;
let isChecking = false;
let speechSynthesis = window.speechSynthesis;

const apiCache = {};
// API keys declaration
const apiKeys = [
    'AIzaSyDjgTk4uZQUCpFH5Zt8ZgP2CW-jhmkLv8o',
    'AIzaSyDaROReiR48rjfavf8Lk6XvphC6QxKPZo4',
    'AIzaSyD-LQ7BMIl85o0Tq3LogG2rBmtYjkOpogU'
];

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
if (restartLearningBtn) {
    restartLearningBtn.addEventListener('click', () => {
        // Reset toàn bộ trạng thái
        vocabulary = [];
        currentIndex = 0;
        wrongWords = [];
        currentCycle = 1;
        isChecking = false;
        
        // Xóa dữ liệu đã lưu
        localStorage.removeItem('vocabularyLearnerState');
        
        // Reset UI
        answerInput.value = '';
        resultDisplay.classList.add('hidden');
        meaningDisplay.textContent = '';
        progressText.textContent = '0/0';
        progressBarFill.style.width = '0%';
        cycleText.textContent = `Chu kỳ: 0/${totalCycles}`;
        
        // Chuyển về tab Nhập từ vựng và focus vào ô input
        document.querySelector('[data-tab="input"]').click(); // Quan trọng: Chuyển tab!
        vocabularyInput.focus();
    });
}

const speakButton = document.getElementById('speakButton');
// Thêm sự kiện click cho nút kiểm tra
if (checkAnswerBtn) {
    checkAnswerBtn.addEventListener('click', checkAnswer);
}

// Thêm phím tắt Enter để kiểm tra
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('learning').classList.contains('active')) {
        e.preventDefault();
        checkAnswer();
    }
});

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

// Hàm phát âm từ
function speakWord(text) {
    if (!speechSynthesis) {
        console.error("Speech synthesis not supported");
        return;
    }

    // Dừng phát âm hiện tại nếu có
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    
    // Tìm giọng đọc tiếng Nhật
    const voices = speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => 
        voice.lang.includes('ja') || voice.lang.includes('JP')
    );
    
    if (japaneseVoice) {
        utterance.voice = japaneseVoice;
    }
    
    speechSynthesis.speak(utterance);
}

// Khởi tạo nút phát âm
if (speakButton) {
    speakButton.addEventListener('click', () => {
        if (currentIndex < vocabulary.length) {
            speakWord(vocabulary[currentIndex].hiragana);
        }
    });
}


// Hàm nhận diện giọng nói
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

// Khởi tạo nút nhận diện giọng nói
if (voiceButton) {
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceButton.title = "Nhấn để bắt đầu nhận diện giọng nói (F3)";
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
    // Phím tắt F3
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            toggleVoiceRecognition();
        }
    });
}

// Save/load state
function saveState() {
    const state = {
        vocabulary,
        currentIndex,
        wrongWords,
        currentCycle,
        totalCycles,
        inputText: vocabularyInput.value
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

function finishLearning() {
    // Dừng các tính năng đang chạy
    if (isListening) stopVoiceRecognition();
    speechSynthesis.cancel();

    // Thoát fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
    }

    // Reset UI
    answerInput.value = '';
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    progressText.textContent = '0/0';
    progressBarFill.style.width = '0%';
    cycleText.textContent = `Chu kỳ: 0/${totalCycles}`;
    wrongWordsTextarea.value = '';

    // Xử lý từ sai
    if (wrongWords.length > 0) {
        document.querySelector('[data-tab="wrong"]').disabled = false;
        document.querySelector('[data-tab="wrong"]').click();
        wrongWordsTextarea.value = wrongWords.map(word =>
            `${word.kanji}=${word.hiragana}=${word.meaning}`
        ).join('\n');
    } else {
        alert('Chúc mừng! Bạn đã học tất cả từ vựng đúng!');
        document.querySelector('[data-tab="input"]').click();
    }

    // Xóa trạng thái lưu
    localStorage.removeItem('vocabularyLearnerState');
}

// Start learning
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
    document.documentElement.requestFullscreen().catch(console.error);
});

copyAndRelearnBtn.addEventListener('click', () => {
    if (wrongWords.length === 0) {
        alert('Không có từ nào để học lại!');
        return;
    }

    const wrongWordsText = wrongWords.map(word =>
        `${word.kanji}=${word.hiragana}=${word.meaning}`
    ).join('\n');

    // Reset toàn bộ UI và trạng thái
    vocabularyInput.value = wrongWordsText;
    answerInput.value = ''; // Xóa cache ô trả lời
    resultDisplay.classList.add('hidden'); // Ẩn kết quả kiểm tra trước đó
    meaningDisplay.textContent = ''; // Xóa nghĩa từ cũ
    
    // Reset biến trạng thái
    currentIndex = 0;
    currentCycle = 1;
    wrongWords = [];
    isChecking = false;
    shuffleCheckbox.checked = false;
    cycleCountInput.value = 2;
    
    // Xóa cache API
    for (const key in apiCache) {
        delete apiCache[key];
    }
    
    saveState();

    // Chuyển tab và focus
    document.querySelector('[data-tab="input"]').click();
    vocabularyInput.focus();
    alert('Đã chuẩn bị danh sách từ sai để học lại. Nhấn "Bắt đầu học" khi sẵn sàng!');
});

// Check answer
async function checkAnswer() {
    if (isChecking || currentIndex >= vocabulary.length || vocabulary.length === 0) return;
    isChecking = true;
	checkAnswerBtn.disabled = true; // Vô hiệu hóa nút

    const currentWord = vocabulary[currentIndex];
	speakWord(currentWord.hiragana);
    const userAnswer = answerInput.value.trim();

    // Hiển thị trạng thái kiểm tra
    resultDisplay.textContent = "Đang kiểm tra...";
    resultDisplay.className = "result checking";
    resultDisplay.classList.remove("hidden");
    meaningDisplay.textContent = "";

    try {
        const isCorrect = await checkWithAI(userAnswer, currentWord.hiragana);

        if (isCorrect) {
            resultDisplay.textContent = "✓ Chính xác!";
            resultDisplay.className = "result correct";
            meaningDisplay.textContent = currentWord.meaning || "";

            await new Promise(resolve => setTimeout(resolve, 1000)); // Có thể thay bằng biến cấu hình
            moveToNextWord();
        } else {
            resultDisplay.textContent = `✗ Sai rồi! Đáp án đúng là: ${currentWord.hiragana}`;
            resultDisplay.className = "result incorrect";
            meaningDisplay.textContent = currentWord.meaning || "";

            if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
                wrongWords.push(currentWord);
            }

            answerInput.value = '';
            interimResult = ""; // Clear voice interim result
            answerInput.focus();
        }
    } catch (error) {
        console.error("Lỗi khi kiểm tra:", error);
        resultDisplay.textContent = "Lỗi kết nối. Đang kiểm tra offline...";
        resultDisplay.className = "result error";
        
        // Fallback: So sánh trực tiếp
        const normalizedInput = userAnswer.toLowerCase().replace(/\s+/g, '');
        const normalizedCorrect = currentWord.hiragana.toLowerCase().replace(/\s+/g, '');
        if (normalizedInput === normalizedCorrect) {
            moveToNextWord();
        }
    } finally {
        isChecking = false;
		checkAnswerBtn.disabled = false; // Mở lại nút
        saveState();
    }
}


// Improved AI checking function with better handling of alternative inputs
async function checkWithAI(userInput, correctHiragana) {
    const cacheKey = `${userInput}:${correctHiragana}`;

    // Check cache
    if (apiCache[cacheKey] !== undefined) {
        return apiCache[cacheKey];
    }
    
    // Handle romaji/latin alphabet input
    let processedInput = userInput;
    if (/^[a-zA-Z0-9\s,.?!;:'"()\-]+$/.test(userInput)) {
        // If input is only Latin characters, consider it romaji
        // This is just for checking - we'll still validate with AI
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

    try {
        // Use API key from array (can be rotated if needed)
        const currentApiKey = apiKeys[0]; // Logic for rotating API keys could be added

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Process result from API
        if (data && data.candidates && data.candidates[0].content) {
            const resultText = data.candidates[0].content.parts[0].text.trim().toLowerCase();
            const isCorrect = resultText === "true";
            apiCache[cacheKey] = isCorrect;
            return isCorrect;
        } else {
            console.error("Invalid response from API:", data);
            
            // Fallback to direct comparison if API fails
            const normalizedInput = processedInput.toLowerCase().replace(/\s+/g, '');
            const normalizedCorrect = correctHiragana.toLowerCase().replace(/\s+/g, '');
            return normalizedInput === normalizedCorrect;
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        
        // Fallback to direct comparison if API fails
        const normalizedInput = processedInput.toLowerCase().replace(/\s+/g, '');
        const normalizedCorrect = correctHiragana.toLowerCase().replace(/\s+/g, '');
        return normalizedInput === normalizedCorrect;
    }
}

// Các hàm phụ trợ
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showCurrentWord() {
    if (currentIndex < vocabulary.length) {
        kanjiDisplay.textContent = vocabulary[currentIndex].kanji;
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

function moveToNextWord() {
    // Reset phần nhận diện giọng nói
    if (outputDiv) {
        outputDiv.textContent = "";
        outputDiv.classList.add('hidden');
    }
    
    // Reset kết quả tạm thời
    interimResult = "";
    
    // Chuyển sang từ tiếp theo
    currentIndex++;

    if (currentIndex >= vocabulary.length) {
        currentIndex = 0;
        currentCycle++;

        if (currentCycle > totalCycles) {
            finishLearning();
            return;
        }
    }

    // Reset UI cho từ mới
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    answerInput.value = '';

    // Cập nhật UI
    updateProgressUI();
    showCurrentWord();
    answerInput.focus();
    
    // Lưu trạng thái
    saveState();
}


// Khởi tạo khi trang tải xong
window.addEventListener('load', () => {
    if (loadState()) {
        updateProgressUI();
        showCurrentWord();
        
        if (confirm('Phát hiện dữ liệu học tập đã lưu. Bạn có muốn tiếp tục không?')) {
            document.querySelector('[data-tab="learning"]').disabled = false;
            document.querySelector('[data-tab="learning"]').click();
            answerInput.focus();
        }
    }
    
    // Kiểm tra trình duyệt hỗ trợ speech synthesis
    if (!speechSynthesis) {
        console.warn("Speech synthesis not supported");
        if (speakButton) speakButton.disabled = true;
    }
});

// Xử lý thoát trang
window.addEventListener('beforeunload', () => {
    if (recognition && isListening) {
        stopVoiceRecognition();
    }
});