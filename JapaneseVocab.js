// Global variables
let vocabulary = [];
let currentIndex = 0;
let wrongWords = [];
let currentCycle = 1;
let totalCycles = 2;
let isChecking = false;

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
            console.error("Error loading saved state:", e);
            return false;
        }
    }
    return false;
}

// Check for saved state on page load
window.addEventListener('load', () => {
    if (loadState()) {
        if (confirm('Phát hiện dữ liệu học tập đã lưu. Bạn có muốn tiếp tục không?')) {
            document.querySelector('[data-tab="learning"]').disabled = false;
            document.querySelector('[data-tab="learning"]').click();
            answerInput.focus();
        }
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
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
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
    document.querySelector('[data-tab="input"]').click();
    startLearningBtn.focus();
});

// Answer input enter key
answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswer();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const learningTab = document.getElementById('learning');
    if (!learningTab.classList.contains('active')) return;

    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        skipWord();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        if (confirm('Bạn có muốn thoát chế độ học không?')) {
            document.querySelector('[data-tab="input"]').click();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    } else if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }
});

// Function to check answer (OFFLINE VERSION)
function checkAnswer() {
    if (isChecking || currentIndex >= vocabulary.length) return;

    isChecking = true;
    const currentWord = vocabulary[currentIndex];
    const userAnswer = answerInput.value.trim();

    // Simple normalization for comparison
    const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s+/g, '');
    const normalizedCorrect = currentWord.hiragana.toLowerCase().replace(/\s+/g, '');

    if (normalizedUserAnswer === normalizedCorrect) {
        resultDisplay.textContent = "✓ Chính xác!";
        resultDisplay.className = "result correct";
        
        if (currentWord.meaning) {
            meaningDisplay.textContent = currentWord.meaning;
        }
        
        setTimeout(() => {
            moveToNextWord();
            isChecking = false;
        }, 800);
    } else {
        resultDisplay.textContent = `✗ Sai rồi! Đáp án đúng là: ${currentWord.hiragana}`;
        resultDisplay.className = "result incorrect";
        
        if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
            wrongWords.push(currentWord);
        }
        
        if (currentWord.meaning) {
            meaningDisplay.textContent = currentWord.meaning;
        }
        
        answerInput.value = '';
        answerInput.focus();
        isChecking = false;
    }
    
    saveState();
}

// Function to skip word
function skipWord() {
    if (isChecking) return;

    const currentWord = vocabulary[currentIndex];
    if (!wrongWords.some(word => word.kanji === currentWord.kanji)) {
        wrongWords.push(currentWord);
    }

    moveToNextWord();
    saveState();
}

// Function to move to next word
function moveToNextWord() {
    currentIndex++;

    if (currentIndex >= vocabulary.length) {
        currentIndex = 0;
        currentCycle++;

        if (currentCycle > totalCycles) {
            finishLearning();
            return;
        }
    }

    resultDisplay.classList.add('hidden');
    meaningDisplay.textContent = '';
    answerInput.value = '';
    updateProgressUI();
    showCurrentWord();
    answerInput.focus();
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
        const wrongWordsTab = document.querySelector('[data-tab="wrong"]');
        wrongWordsTab.disabled = false;
        wrongWordsTab.click();

        wrongWordsTextarea.value = wrongWords.map(word =>
            `${word.kanji}=${word.hiragana}=${word.meaning}`
        ).join('\n');
    } else {
        alert('Chúc mừng! Bạn đã học tất cả từ vựng đúng!');
        document.querySelector('[data-tab="input"]').click();
    }

    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    
    localStorage.removeItem('vocabularyLearnerState');
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
