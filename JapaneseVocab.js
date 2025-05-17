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
const startLearningBtn = document.getElementById('startLearning');
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

// Khai báo biến recognition toàn cục
let recognition = null;
let isListening = false;
let interimResult = "";
let recognitionTimeout = null;

// Cập nhật hàm nhận diện giọng nói
function setupVoiceRecognition() {
    if (!recognition) {
        try {
            // Tạo đối tượng nhận diện giọng nói
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'ja-JP';
            recognition.interimResults = true; // Bật kết quả tạm thời để hiển thị ngay lập tức
            recognition.continuous = true; // Cho phép nhận diện liên tục
            recognition.maxAlternatives = 3; // Lấy nhiều kết quả thay thế

            // Xử lý sự kiện khi bắt đầu nhận diện
            recognition.onstart = () => {
                isListening = true;
                voiceButton.classList.add('recording');
                outputDiv.textContent = "Đang nghe...";
                outputDiv.classList.remove('hidden');
                
                // Xóa timeout trước đó nếu có
                if (recognitionTimeout) {
                    clearTimeout(recognitionTimeout);
                }
            };

            // Xử lý sự kiện có lỗi
            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                
                if (event.error === 'no-speech') {
                    outputDiv.textContent = "Không nghe thấy gì. Vui lòng nói to hơn.";
                } else if (event.error === 'network') {
                    outputDiv.textContent = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.";
                } else {
                    outputDiv.textContent = "Lỗi: " + event.error;
                }
                
                if (isListening) {
                    // Tự động thử lại sau 1 giây nếu không phải lỗi nghiêm trọng
                    if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
                        setTimeout(() => {
                            if (isListening) {
                                try {
                                    recognition.start();
                                } catch (e) {
                                    console.error("Không thể khởi động lại recognition:", e);
                                }
                            }
                        }, 1000);
                    } else {
                        stopVoiceRecognition();
                    }
                }
            };

            // Xử lý sự kiện kết thúc nhận diện
			recognition.onend = () => {
				if (isListening) {
					try {
						// Thêm delay trước khi khởi động lại
						setTimeout(() => {
							if (isListening && !recognitionTimeout) {
								recognition.start();
							}
						}, 500);
					} catch (e) {
						console.error("Không thể khởi động lại recognition:", e);
						stopVoiceRecognition();
					}
				} else {
					voiceButton.classList.remove('recording');
				}
			};

            // Xử lý kết quả nhận diện
			recognition.onresult = (event) => {
				let finalTranscript = '';
				let interimTranscript = '';
				
				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i];
					const transcript = result[0].transcript;
					
					if (result.isFinal) {
						finalTranscript += transcript;
						// Ưu tiên sử dụng kết quả cuối cùng
						interimResult = ''; // Xóa kết quả tạm thời khi có kết quả cuối
					} else {
						interimTranscript += transcript;
					}
				}
				
				// Chỉ cập nhật kết quả tạm thời nếu chưa có kết quả cuối
				if (interimTranscript && !finalTranscript) {
					interimResult = interimTranscript;
					outputDiv.textContent = "Đang nghe: " + interimTranscript;
				}
				
				if (finalTranscript) {
					outputDiv.textContent = "Đã nhận: " + finalTranscript;
					answerInput.value = finalTranscript;
					
					// Đặt timeout dài hơn (3 giây) để cho phép nói liên tục
					if (recognitionTimeout) {
						clearTimeout(recognitionTimeout);
					}
					recognitionTimeout = setTimeout(() => {
						stopVoiceRecognition();
					}, 3000);
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
						// Ưu tiên sử dụng kết quả cuối cùng
						interimResult = ''; // Xóa kết quả tạm thời khi có kết quả cuối
					} else {
						interimTranscript += transcript;
					}
				}
				
				// Chỉ cập nhật kết quả tạm thời nếu chưa có kết quả cuối
				if (interimTranscript && !finalTranscript) {
					interimResult = interimTranscript;
					outputDiv.textContent = "Đang nghe: " + interimTranscript;
				}
				
				if (finalTranscript) {
					outputDiv.textContent = "Đã nhận: " + finalTranscript;
					answerInput.value = finalTranscript;
					
					// Đặt timeout dài hơn (3 giây) để cho phép nói liên tục
					if (recognitionTimeout) {
						clearTimeout(recognitionTimeout);
					}
					recognitionTimeout = setTimeout(() => {
						stopVoiceRecognition();
					}, 3000);
				}
			};
            
            console.log("Voice recognition setup completed");
        } catch (error) {
            console.error("Error setting up voice recognition:", error);
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói hoặc bạn chưa cấp quyền. Vui lòng sử dụng Chrome, Safari hoặc Edge mới nhất.");
        }
    }
}

// Hàm để bắt đầu nhận diện giọng nói
function startVoiceRecognition() {
    setupVoiceRecognition();
    
    if (recognition) {
        try {
            isListening = true;
            recognition.start();
        } catch (error) {
            console.error("Error starting voice recognition:", error);
            alert("Không thể bắt đầu nhận diện giọng nói. Vui lòng làm mới trang và thử lại.");
        }
    }
}

// Hàm dừng nhận diện giọng nói
function stopVoiceRecognition() {
    if (recognition) {
        try {
            isListening = false;
            recognition.stop();
            
            // Nếu có kết quả tạm thời và không có kết quả cuối cùng, sử dụng kết quả tạm thời
            if (interimResult && !answerInput.value) {
                answerInput.value = interimResult;
                outputDiv.textContent = "Đã nhận: " + interimResult;
            }
            
            interimResult = "";

            voiceButton.classList.remove('recording');
            
            // Xóa timeout nếu có
            if (recognitionTimeout) {
                clearTimeout(recognitionTimeout);
                recognitionTimeout = null;
            }
        } catch (error) {
            console.error("Error stopping voice recognition:", error);
        }
    }
}

// Cập nhật lại hàm toggle
function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// Khởi tạo nút nhận diện giọng nói
function initVoiceButton() {
    // Thêm biểu tượng vào nút
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceButton.title = "Nhấn để bắt đầu nhận diện giọng nói (F3)";
    
    // Thêm sự kiện click
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
       
    // Cập nhật output div
    outputDiv.classList.add('hidden');
}

// Kiểm tra sự hỗ trợ của trình duyệt
function checkBrowserSupport() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        console.warn("Browser does not support speech recognition");
        voiceButton.disabled = true;
        voiceButton.title = "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói";
        return false;
    }
    return true;
}

// Hàm khởi tạo
function initVoiceRecognition() {
    // Kiểm tra sự hỗ trợ
    if (!checkBrowserSupport()) return;
    
    // Khởi tạo giao diện
    initVoiceButton();
    
    // Thêm sự kiện phím tắt
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            toggleVoiceRecognition();
        } else if (e.key === 'Escape' && isListening) {
            e.preventDefault();
            stopVoiceRecognition();
        }
    });
    
    console.log("Voice recognition initialized");
}

// Khởi tạo khi trang đã tải xong
window.addEventListener('DOMContentLoaded', initVoiceRecognition);

// Làm sạch khi thoát trang
window.addEventListener('beforeunload', () => {
    if (recognition && isListening) {
        stopVoiceRecognition();
    }
});

// Thêm sự kiện click cho nút xóa
clearVocabularyBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ danh sách từ vựng hiện tại không?')) {
        vocabularyInput.value = '';
        vocabulary = [];
        currentIndex = 0;
        wrongWords = [];
        currentCycle = 1;
        
        // Xóa trạng thái đã lưu
        localStorage.removeItem('vocabularyLearnerState');
        
        // Vô hiệu hóa các tab không cần thiết
        document.querySelector('[data-tab="learning"]').disabled = true;
        document.querySelector('[data-tab="wrong"]').disabled = true;
        
        // Focus lại vào textarea nhập liệu
        vocabularyInput.focus();
    }
});
// Save/load learning state from localStorage
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
    console.log("State saved successfully:", state);
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
            
            // Restore input text
            if (state.inputText) {
                vocabularyInput.value = state.inputText;
            }
            
            console.log("State loaded successfully:", state);
            return vocabulary.length > 0;
        } catch (e) {
            console.error("Error loading saved state:", e);
            return false;
        }
    }
    return false;
}

// Check for saved state on page load
window.addEventListener('load', () => {
    if (loadState()) {
        console.log("Found saved learning state");
        
        // Make sure UI is updated
        updateProgressUI();
        showCurrentWord();
        
        // Offer to continue from saved state
        if (confirm('Phát hiện dữ liệu học tập đã lưu. Bạn có muốn tiếp tục không?')) {
            // Enable learning tab
            document.querySelector('[data-tab="learning"]').disabled = false;
            document.querySelector('[data-tab="learning"]').click();
            
            // Set focus to answer input
            answerInput.focus();
        }
    } else {
        console.log("No saved learning state found");
    }
});

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

// Start learning button
startLearningBtn.addEventListener('click', () => {
    const inputText = vocabularyInput.value.trim();
    if (!inputText) {
        alert('Vui lòng nhập danh sách từ vựng!');
        return;
    }

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

    // Get cycle count
    totalCycles = parseInt(cycleCountInput.value) || 2;
    if (totalCycles < 1) totalCycles = 1;

    // Shuffle if needed
    if (shuffleCheckbox.checked) {
        shuffleArray(vocabulary);
    }

    // Reset learning state
    currentIndex = 0;
    currentCycle = 1;
    wrongWords = [];
    isChecking = false;

    // Save state
    saveState();

    // Switch to learning tab
    document.querySelector('[data-tab="learning"]').disabled = false;
    document.querySelector('[data-tab="learning"]').click();

    // Update UI
    updateProgressUI();
    showCurrentWord();

    // Set focus to answer input
    answerInput.focus();

    // Enter fullscreen mode
    document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen mode: ${err.message}`);
    });
});

// Check answer button
checkAnswerBtn.addEventListener('click', checkAnswer);

// Skip word button
skipWordBtn.addEventListener('click', skipWord);

// Restart learning button
restartLearningBtn.addEventListener('click', () => {
    currentIndex = 0;
    currentCycle = 1;
    wrongWords = [];
    isChecking = false;

    // Save state
    saveState();

    updateProgressUI();
    showCurrentWord();
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    answerInput.value = '';
    answerInput.focus();
});

// Copy and relearn button
copyAndRelearnBtn.addEventListener('click', () => {
    if (wrongWords.length === 0) return;

    const wrongWordsText = wrongWords.map(word =>
        `${word.kanji}=${word.hiragana}=${word.meaning}`
    ).join('\n');

    vocabularyInput.value = wrongWordsText;

    // Switch to input tab
    document.querySelector('[data-tab="input"]').click();

    // Focus on start button
    startLearningBtn.focus();
});

// Answer input enter key
answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswer();
    }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only process when in learning mode
    const learningTab = document.getElementById('learning');
    if (!learningTab.classList.contains('active')) return;

    if (e.key === 's' && e.ctrlKey) {
        // Ctrl+S - Skip word
        e.preventDefault();
        skipWord();
    } else if (e.key === 'Escape') {
        // ESC - Show exit dialog
        e.preventDefault();
        if (confirm('Bạn có muốn thoát chế độ học không?')) {
            document.querySelector('[data-tab="input"]').click();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    } else if (e.key === 'F11') {
        // F11 - Toggle fullscreen
        e.preventDefault();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }
});

// Function to check answer
async function checkAnswer() {
    if (isChecking || currentIndex >= vocabulary.length) return;

    isChecking = true;
    const currentWord = vocabulary[currentIndex];
    const userAnswer = answerInput.value.trim();

    // Add loading state
    resultDisplay.textContent = "Đang kiểm tra...";
    resultDisplay.className = "result";
    resultDisplay.classList.remove("hidden");

    // Call AI to check
    const isCorrect = await checkWithAI(userAnswer, currentWord.hiragana);

    if (isCorrect) {
        resultDisplay.textContent = "✓ Chính xác!";
        resultDisplay.className = "result correct";
        
        // Show meaning for correct answer too
        if (currentWord.meaning) {
            meaningDisplay.textContent = currentWord.meaning;
        }
        
        // Move to next word after success
        setTimeout(() => {
            moveToNextWord();
            isChecking = false;
        }, 1500);
    } else {
        resultDisplay.textContent = `✗ Sai rồi! Đáp án đúng là: ${currentWord.hiragana}`;
        resultDisplay.className = "result incorrect";
        
        // Add to wrong words list
        if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
            wrongWords.push(currentWord);
        }
        
        // Always show meaning for incorrect answers
        if (currentWord.meaning) {
            meaningDisplay.textContent = currentWord.meaning;
        }
        
        // Clear the answer input to allow the user to try again
        // but keep the hints visible
        answerInput.value = '';
        answerInput.focus();
        
        // Release the checking lock but keep displays visible
        isChecking = false;
    }
    
    // Save state after checking
    saveState();
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
Act as a strict but fair Japanese language teacher. Evaluate if a student's answer matches the expected vocabulary.

Student's answer may be in:
- Hiragana
- Katakana
- Kanji (if semantically equivalent)
- Romaji (if phonetically accurate)

Evaluation rules:
1. ACCEPT Hiragana, Katakana, Kanji, or Romaji if they represent the same Japanese word.
2. ACCEPT small spelling variations or character forms if meaning or sound is preserved.
3. ACCEPT particles (は/wa, を/o) when appropriate.
4. IGNORE punctuation or spacing differences.
5. For vocabulary checking (not full sentences), focus on pronunciation and meaning match.
6. DO NOT reject Kanji just because it is not Hiragana.
7. If the meaning is the same word, regardless of script, it's correct.

Now compare:
Student answer: ${processedInput}  
Expected answer: ${correctHiragana}

Considering all the above, is the student's answer correct? Output only 'true' or 'false'.
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

// Function to skip word
function skipWord() {
    if (isChecking) return;

    const currentWord = vocabulary[currentIndex];

    // Add to wrong words list
    if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
        wrongWords.push(currentWord);
    }

    moveToNextWord();
    
    // Save state after skipping
    saveState();
}

// Function to move to next word
function moveToNextWord() {
    currentIndex++;

    // Check if we need to move to next cycle or finish
    if (currentIndex >= vocabulary.length) {
        currentIndex = 0;
        currentCycle++;

        if (currentCycle > totalCycles) {
            // Learning completed
            finishLearning();
            return;
        }
    }

    // Reset UI for next word
    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    answerInput.value = '';

    // Update progress and show next word
    updateProgressUI();
    showCurrentWord();
    answerInput.focus();
    
    // Save state after moving
    saveState();
}

// Function to show current word
function showCurrentWord() {
    if (currentIndex < vocabulary.length) {
        kanjiDisplay.textContent = vocabulary[currentIndex].kanji;
    } else {
        kanjiDisplay.textContent = '';
    }
}

// Function to update progress UI
function updateProgressUI() {
    const total = vocabulary.length;
    const current = currentIndex + 1;
    const percentage = total > 0 ? (currentIndex / total) * 100 : 0;

    progressText.textContent = `${current}/${total}`;
    cycleText.textContent = `Chu kỳ: ${currentCycle}/${totalCycles}`;
    progressBarFill.style.width = `${percentage}%`;
}

// Function to finish learning
function finishLearning() {
    if (wrongWords.length > 0) {
        // Show wrong words tab
        const wrongWordsTab = document.querySelector('[data-tab="wrong"]');
        wrongWordsTab.disabled = false;
        wrongWordsTab.click();

        // Fill wrong words textarea
        wrongWordsTextarea.value = wrongWords.map(word =>
            `${word.kanji}=${word.hiragana}=${word.meaning}`
        ).join('\n');
    } else {
        // No wrong words, show congratulations
        alert('Chúc mừng! Bạn đã học tất cả từ vựng đúng!');
        document.querySelector('[data-tab="input"]').click();
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    
    // Clear saved state as we've completed
    localStorage.removeItem('vocabularyLearnerState');
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}