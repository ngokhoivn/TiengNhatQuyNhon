const sentences = [
    {
        target: "先生が学生に話しています。",
        words: ["先生", "が", "学生", "に", "話し", "て", "い", "ます", "。"],
        translation: "Thầy giáo đang nói chuyện với học sinh."
    },
    {
        target: "学生はどんな運動をしますか。",
        words: ["学生", "は", "どんな", "運動", "を", "し", "ます", "か", "。"],
        translation: "Học sinh sẽ tập bài thể dục nào?"
    },
    {
        target: "首の横を伸ばす運動をします。",
        words: ["首", "の", "横", "を", "伸ばす", "運動", "を", "し", "ます", "。"],
        translation: "Chúng ta sẽ tập kéo giãn bên cổ."
    },
    {
        target: "右手で頭の左側を持ってください。",
        words: ["右手", "で", "頭", "の", "左側", "を", "持っ", "て", "ください", "。"],
        translation: "Hãy dùng tay phải giữ phía bên trái đầu."
    },
    {
        target: "首を右に曲げます。",
        words: ["首", "を", "右", "に", "曲げ", "ます", "。"],
        translation: "Hãy nghiêng đầu sang bên phải."
    }
];

// Game state
let currentSentenceIndex = 0;
let score = 0;
let streak = 0;
let placedWords = [];

// DOM elements
const elements = {
    wordBank: document.getElementById('word-bank'),
    sentenceArea: document.getElementById('sentence-area'),
    translation: document.getElementById('translation'),
    result: document.getElementById('result'),
    score: document.getElementById('score'),
    currentSentence: document.getElementById('current-sentence'),
    totalSentences: document.getElementById('total-sentences'),
    streak: document.getElementById('streak'),
    checkBtn: document.getElementById('check-btn'),
    clearBtn: document.getElementById('clear-btn'),
    celebration: document.getElementById('celebration'),
    prevArrow: document.querySelector('.prev-arrow'),
    nextArrow: document.querySelector('.next-arrow')
};

// Initialize game
function init() {
    loadSentence();
    updateScoreBoard();
    setupEventListeners();
}

// Event listeners setup
function setupEventListeners() {
    elements.checkBtn.addEventListener('click', checkSentence);
    elements.clearBtn.addEventListener('click', clearSentence);
    elements.prevArrow.addEventListener('click', prevSentence);
    elements.nextArrow.addEventListener('click', nextSentence);
}

// Navigation functions
function prevSentence() {
    if (currentSentenceIndex > 0) {
        currentSentenceIndex--;
        loadSentence();
    }
}

function nextSentence() {
    if (currentSentenceIndex < sentences.length - 1) {
        currentSentenceIndex++;
        loadSentence();
    } else {
        showFinalScore();
    }
}

// Load current sentence
function loadSentence() {
    const sentence = sentences[currentSentenceIndex];
    
    // Update UI
    elements.translation.textContent = sentence.translation;
    elements.currentSentence.textContent = currentSentenceIndex + 1;
    elements.totalSentences.textContent = sentences.length;
    
    // Load words
    loadWordBank(shuffleArray(sentence.words));
    
    // Reset sentence area
    resetSentenceArea();
    
    // Update navigation arrows
    updateNavigationArrows();
    
    // Show check button
    elements.checkBtn.style.display = 'inline-flex';
}

function loadWordBank(words) {
    elements.wordBank.innerHTML = '';
    words.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word';
        wordEl.textContent = word;
        wordEl.addEventListener('click', () => toggleWord(wordEl, word));
        elements.wordBank.appendChild(wordEl);
    });
}

function resetSentenceArea() {
    placedWords = [];
    elements.sentenceArea.innerHTML = '';
    elements.result.className = 'result';
    elements.result.textContent = '';
}

function updateNavigationArrows() {
    elements.prevArrow.style.visibility = currentSentenceIndex > 0 ? 'visible' : 'hidden';
    elements.nextArrow.style.visibility = currentSentenceIndex < sentences.length - 1 ? 'visible' : 'hidden';
}

// Word selection functions
function toggleWord(element, word) {
    element.classList.toggle('selected');
    if (element.classList.contains('selected')) {
        addWordToSentence(word);
    } else {
        removeWordFromSentence(word);
    }
}

function addWordToSentence(word) {
    placedWords.push(word);
    
    const placedWordEl = document.createElement('div');
    placedWordEl.className = 'placed-word';
    placedWordEl.textContent = word;
    placedWordEl.addEventListener('click', () => {
        const wordEl = [...elements.wordBank.querySelectorAll('.word')].find(el => el.textContent === word);
        if (wordEl) wordEl.classList.remove('selected');
        removeWordFromSentence(word);
    });
    
    elements.sentenceArea.appendChild(placedWordEl);
}

function removeWordFromSentence(word) {
    placedWords = placedWords.filter(w => w !== word);
    const placedWordEl = [...elements.sentenceArea.querySelectorAll('.placed-word')].find(el => el.textContent === word);
    if (placedWordEl) placedWordEl.remove();
}

// Game logic functions
function checkSentence() {
    const userSentence = placedWords.join('');
    const currentSentence = sentences[currentSentenceIndex];
    
    elements.result.classList.add('show');
    
    if (userSentence === currentSentence.target) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer(currentSentence.target);
    }
    
    updateScoreBoard();
}

function handleCorrectAnswer() {
    score += 100 + (streak * 10);
    streak++;
    
    elements.result.className = 'result show correct';
    elements.result.innerHTML = `<i class="fas fa-check-circle"></i> Chính xác! +${100 + ((streak - 1) * 10)} điểm`;
    
    createConfetti();
    elements.checkBtn.style.display = 'none';
    
    setTimeout(() => {
        nextSentence();
    }, 2000);
}

function handleIncorrectAnswer(correctAnswer) {
    streak = 0;
    elements.result.className = 'result show incorrect';
    elements.result.innerHTML = `<i class="fas fa-times-circle"></i> Sai rồi!<br><strong>Câu đúng:</strong> "${correctAnswer}"`;
}

function clearSentence() {
    resetSentenceArea();
    [...elements.wordBank.querySelectorAll('.word')].forEach(el => el.classList.remove('selected'));
}

// Game state functions
function showFinalScore() {
    elements.result.className = 'result show correct';
    elements.result.innerHTML = `
        <i class="fas fa-trophy"></i> Hoàn thành!<br>
        Điểm cuối cùng: <strong>${score}</strong><br>
        <button class="btn btn-next" onclick="restartGame()" style="margin-top: 15px;">
            <i class="fas fa-redo"></i> Chơi lại
        </button>
    `;
    elements.checkBtn.style.display = 'none';
    elements.clearBtn.style.display = 'none';
}

function restartGame() {
    currentSentenceIndex = 0;
    score = 0;
    streak = 0;
    updateScoreBoard();
    loadSentence();
    elements.checkBtn.style.display = 'inline-flex';
    elements.clearBtn.style.display = 'inline-flex';
}

function updateScoreBoard() {
    elements.score.textContent = score;
    elements.streak.textContent = streak;
}

// Utility functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createConfetti() {
    const colors = ['#bb86fc', '#03dac6', '#4caf50', '#ff9800', '#f44336'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            elements.celebration.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

// Data import function
function parseSheetInput() {
    const raw = document.getElementById("sheet-input").value.trim();
    if (!raw) {
        alert("Vui lòng dán dữ liệu!");
        return;
    }

    sentences.length = 0;
    const lines = raw.split('\n');

    lines.forEach(line => {
        const parts = line.split('/');
        if (parts.length < 2) {
            console.warn("Dòng không đúng định dạng, bỏ qua:", line);
            return;
        }
        
        sentences.push({
            target: parts[0].trim(),
            words: shuffleArray(parts[1].split(',').map(w => w.trim()).filter(Boolean)),
            translation: parts[2] ? parts[2].trim() : ""
        });
    });

    currentSentenceIndex = 0;
    score = 0;
    streak = 0;
    updateScoreBoard();
    loadSentence();
    
    elements.result.className = 'result show correct';
    elements.result.innerHTML = `<i class="fas fa-check-circle"></i> Đã nạp thành công ${sentences.length} câu!`;

    setTimeout(() => {
        elements.result.className = 'result';
        elements.result.textContent = '';
    }, 2000);
}

// Initialize the game
init();