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


let currentSentenceIndex = 0;
let score = 0;
let streak = 0;
let placedWords = [];

const wordBank = document.getElementById('word-bank');
const sentenceArea = document.getElementById('sentence-area');
const targetSentenceEl = document.getElementById('target-sentence');
const translationEl = document.getElementById('translation');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const currentSentenceEl = document.getElementById('current-sentence');
const totalSentencesEl = document.getElementById('total-sentences');
const streakEl = document.getElementById('streak');
const checkBtn = document.getElementById('check-btn');
const clearBtn = document.getElementById('clear-btn');
const celebration = document.getElementById('celebration');

function shuffleArray(array) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

function loadSentence() {
	const sentence = sentences[currentSentenceIndex];
	translationEl.textContent = sentence.translation;
	
	const shuffledWords = shuffleArray(sentence.words);
	wordBank.innerHTML = '';
	
	shuffledWords.forEach(word => {
		const wordEl = document.createElement('div');
		wordEl.className = 'word';
		wordEl.textContent = word;
		wordEl.addEventListener('click', () => toggleWord(wordEl, word));
		wordBank.appendChild(wordEl);
	});
	
	placedWords = [];
	sentenceArea.innerHTML = '';
	resultEl.className = 'result';
	resultEl.textContent = '';
	
	currentSentenceEl.textContent = currentSentenceIndex + 1;
	totalSentencesEl.textContent = sentences.length;
	
	checkBtn.style.display = 'inline-flex';
}

function toggleWord(element, word) {
	const isSelected = element.classList.contains('selected');
	
	if (isSelected) {
		element.classList.remove('selected');
		removeWordFromSentence(word);
	} else {
		element.classList.add('selected');
		addWordToSentence(word);
	}
}

function addWordToSentence(word) {
	placedWords.push(word);
	
	const placedWordEl = document.createElement('div');
	placedWordEl.className = 'placed-word';
	placedWordEl.textContent = word;
	placedWordEl.addEventListener('click', () => {
		const wordEl = [...wordBank.querySelectorAll('.word')].find(el => el.textContent === word);
		if (wordEl) {
			wordEl.classList.remove('selected');
		}
		removeWordFromSentence(word);
	});
	
	sentenceArea.appendChild(placedWordEl);
}

function removeWordFromSentence(word) {
	placedWords = placedWords.filter(w => w !== word);
	const placedWordEl = [...sentenceArea.querySelectorAll('.placed-word')].find(el => el.textContent === word);
	if (placedWordEl) {
		placedWordEl.remove();
	}
}

function checkSentence() {
	const userSentence = placedWords.join('');
	const currentSentence = sentences[currentSentenceIndex];
	const targetSentence = currentSentence.target;

	resultEl.classList.add('show');

	if (userSentence === targetSentence) {
		score += 100 + (streak * 10);
		streak++;
		resultEl.className = 'result show correct';
		resultEl.innerHTML = `<i class="fas fa-check-circle"></i> Chính xác! +${100 + ((streak - 1) * 10)} điểm`;

		createConfetti();
		checkBtn.style.display = 'none';

		setTimeout(() => {
			nextSentence();
		}, 2000);
	} else {
		streak = 0;
		resultEl.className = 'result show incorrect';
		resultEl.innerHTML = `<i class="fas fa-times-circle"></i> Sai rồi!<br><strong>Câu đúng:</strong> "${targetSentence}"`;
	}

	updateScoreBoard();
}


function clearSentence() {
	placedWords = [];
	sentenceArea.innerHTML = '';
	
	const wordEls = wordBank.querySelectorAll('.word');
	wordEls.forEach(el => el.classList.remove('selected'));
	
	resultEl.className = 'result';
	resultEl.textContent = '';
}

function nextSentence() {
	currentSentenceIndex++;
	if (currentSentenceIndex >= sentences.length) {
		showFinalScore();
		return;
	}
	loadSentence();
}

function showFinalScore() {
	resultEl.className = 'result show correct';
	resultEl.innerHTML = `
		<i class="fas fa-trophy"></i> Hoàn thành!<br>
		Điểm cuối cùng: <strong>${score}</strong><br>
		<button class="btn btn-next" onclick="restartGame()" style="margin-top: 15px;">
			<i class="fas fa-redo"></i> Chơi lại
		</button>
	`;
	checkBtn.style.display = 'none';
	clearBtn.style.display = 'none';
}

function restartGame() {
	currentSentenceIndex = 0;
	score = 0;
	streak = 0;
	updateScoreBoard();
	loadSentence();
	checkBtn.style.display = 'inline-flex';
	clearBtn.style.display = 'inline-flex';
}

function updateScoreBoard() {
	scoreEl.textContent = score;
	streakEl.textContent = streak;
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
			celebration.appendChild(confetti);
			
			setTimeout(() => {
				confetti.remove();
			}, 3000);
		}, i * 50);
	}
}

function parseSheetInput() {
	const raw = document.getElementById("sheet-input").value.trim();
	if (!raw) {
		alert("Vui lòng dán dữ liệu!");
		return;
	}

	sentences.length = 0;
	const lines = raw.split('\n');

	lines.forEach(line => {
		// Tách thành 3 phần: target / words / translation
		const parts = line.split('/');
		if (parts.length < 2) {
			console.warn("Dòng không đúng định dạng, bỏ qua:", line);
			return;
		}
		const target = parts[0].trim();
		const words = parts[1].split(',').map(w => w.trim()).filter(Boolean);
		const translation = parts[2] ? parts[2].trim() : "";

		sentences.push({
			target,
			words: shuffleArray(words),
			translation
		});
	});

	currentSentenceIndex = 0;
	score = 0;
	streak = 0;
	updateScoreBoard();
	loadSentence();
	
	 // Hiển thị thông báo thành công
	resultEl.className = 'result show correct';
	resultEl.innerHTML = `<i class="fas fa-check-circle"></i> Đã nạp thành công ${sentences.length} câu!`;

	setTimeout(() => {
		resultEl.className = 'result';
		resultEl.textContent = '';
	}, 2000);
}
	
checkBtn.addEventListener('click', checkSentence);
clearBtn.addEventListener('click', clearSentence);

// Nếu không có dòng loadSentence ở nơi nào khác, gọi ở đây để khởi động lần đầu
loadSentence();
updateScoreBoard();