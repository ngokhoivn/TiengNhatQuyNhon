document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const elements = {
        vietnameseTextArea: document.getElementById('vietnameseText'),
        japaneseTextDiv: document.getElementById('japaneseText'),
        translateBtn: document.getElementById('translateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        copyBtn: document.getElementById('copyBtn'),
        saveBtn: document.getElementById('saveBtn'),
        speakBtn: document.getElementById('speakBtn'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        statusDiv: document.getElementById('status'),
        loadingDiv: document.getElementById('loading'),
        outputContainer: document.getElementById('outputContainer'),
        historyList: document.getElementById('historyList'),
        tabs: document.querySelectorAll('.tab'),
        tabViews: document.querySelectorAll('.tab-view')
    };

    // App state
    const state = {
        history: JSON.parse(localStorage.getItem('japaneseConverterHistory')) || []
    };

    // Initialize app
    function init() {
        setupEventListeners();
        updateHistoryUI();
        updateStatus('Nhập văn bản tiếng Việt để chuyển đổi...', 'info');
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Tab switching
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab));
        });

        // Input and buttons
        elements.vietnameseTextArea.addEventListener('input', handleInputChange);
        elements.translateBtn.addEventListener('click', translateText);
        elements.clearBtn.addEventListener('click', clearText);
        elements.copyBtn.addEventListener('click', copyToClipboard);
        elements.saveBtn.addEventListener('click', saveToHistory);
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
		// Sửa sự kiện click
		elements.speakBtn.addEventListener('click', toggleSpeech);
    }
	
	function toggleSpeech() {
		if (speechSynthesis.speaking) {
			speechSynthesis.cancel();
			updateButtonState(elements.speakBtn, 'volume-up', '', '', 0, ' Đọc văn bản');
		} else {
			const text = elements.japaneseTextDiv.textContent;
			speakJapanese(text);
		}
	}

	function init() {
		// Load voices khi khởi tạo (cần thiết cho một số trình duyệt)
		speechSynthesis.onvoiceschanged = function() {
			console.log('Voices loaded:', speechSynthesis.getVoices());
		};
		
		// Nếu voices đã sẵn sàng
		if (speechSynthesis.getVoices().length > 0) {
			console.log('Voices already available:', speechSynthesis.getVoices());
		}

		setupEventListeners();
		updateHistoryUI();
		updateStatus('Nhập văn bản tiếng Việt để chuyển đổi...', 'info');
	}


    // Tab switching logic
    function switchTab(clickedTab) {
        const tabId = clickedTab.getAttribute('data-tab');
        
        // Update active tab
        elements.tabs.forEach(t => t.classList.remove('active'));
        clickedTab.classList.add('active');
        
        // Show active tab view
        elements.tabViews.forEach(view => {
            view.classList.remove('active');
            if (view.id === tabId) view.classList.add('active');
        });
    }

    // Handle text input changes
    function handleInputChange() {
        const text = elements.vietnameseTextArea.value.trim();
        
        if (text) {
            elements.translateBtn.disabled = false;
            updateStatus('Sẵn sàng chuyển đổi', 'success');
        } else {
            elements.translateBtn.disabled = true;
            updateStatus('Nhập văn bản tiếng Việt để chuyển đổi...', 'info');
            elements.outputContainer.classList.add('hidden');
        }
    }

    // Translate Vietnamese to Japanese
    async function translateText() {
        const vietnameseText = elements.vietnameseTextArea.value.trim();
        if (!vietnameseText) return;
        
        showLoading(true);
        
        try {
            const japaneseText = await convertVietnameseToJapaneseSpeech(vietnameseText);
            displayTranslationResult(japaneseText);
            updateStatus('Chuyển đổi thành công!', 'success');
        } catch (error) {
            console.error('Translation error:', error);
            updateStatus('Lỗi khi chuyển đổi: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Display translation result
    function displayTranslationResult(text) {
        elements.japaneseTextDiv.textContent = text;
        elements.outputContainer.classList.remove('hidden');
    }

    // Show/hide loading indicator
    function showLoading(show) {
        if (show) {
            elements.loadingDiv.classList.remove('hidden');
            elements.outputContainer.classList.add('hidden');
        } else {
            elements.loadingDiv.classList.add('hidden');
        }
    }

    // Update status message
    function updateStatus(message, type = 'info') {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            error: 'exclamation-triangle'
        };
        
        elements.statusDiv.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${message}</span>`;
        elements.statusDiv.className = `status ${type}`;
    }

    // Clear text fields
    function clearText() {
        elements.vietnameseTextArea.value = '';
        elements.japaneseTextDiv.textContent = '';
        elements.outputContainer.classList.add('hidden');
        handleInputChange();
    }

    // Copy Japanese text to clipboard
    async function copyToClipboard() {
        const text = elements.japaneseTextDiv.textContent;
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            updateButtonState(elements.copyBtn, 'fa-check', '#4caf50', 'white', 1500);
        } catch (error) {
            console.error('Copy failed:', error);
            updateStatus('Lỗi khi sao chép', 'error');
        }
    }

    // Speak Japanese text	
	function speakJapanese(text) {
		if (!text || typeof text !== 'string') {
			updateStatus('Không có văn bản để đọc', 'error');
			return;
		}

		if (!window.speechSynthesis) {
			updateStatus('Trình duyệt không hỗ trợ đọc văn bản', 'error');
			return;
		}

		// Hủy phát âm hiện tại nếu đang nói
		speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'ja-JP';

		// Chọn giọng tiếng Nhật (ưu tiên giọng nữ nếu có)
		const voices = speechSynthesis.getVoices();
		const japaneseVoice = voices.find(v => 
			v.lang === 'ja-JP' && v.name.includes('Female')
		) || voices.find(v => v.lang === 'ja-JP');
		
		if (japaneseVoice) {
			utterance.voice = japaneseVoice;
		}

		// Cập nhật trạng thái khi bắt đầu đọc
		elements.speakBtn.classList.add('btn-reading');
		updateButtonState(elements.speakBtn, 'volume-up', '#ff4081', 'white', 0, ' Đang đọc...');
		
		// Sự kiện khi kết thúc đọc hoặc bị hủy
		utterance.onend = utterance.onerror = () => {
			elements.speakBtn.classList.remove('btn-reading');
			updateButtonState(elements.speakBtn, 'volume-up', '', '', 0, ' Đọc văn bản');
		};

		speechSynthesis.speak(utterance);
	}

    // Save to history
    function saveToHistory() {
        const vietnameseText = elements.vietnameseTextArea.value.trim();
        const japaneseText = elements.japaneseTextDiv.textContent;
        
        if (!vietnameseText || !japaneseText) return;
        
        const newEntry = {
            id: Date.now(),
            vietnamese: vietnameseText,
            japanese: japaneseText,
            timestamp: new Date().toLocaleString()
        };
        
        // Add to beginning of history array
        state.history.unshift(newEntry);
        
        // Limit history size
        if (state.history.length > 50) {
            state.history = state.history.slice(0, 50);
        }
        
        // Save to localStorage
        localStorage.setItem('japaneseConverterHistory', JSON.stringify(state.history));
        
        // Update UI
        updateHistoryUI();
        
        // Show confirmation
        updateButtonState(elements.saveBtn, 'check', '', '', 1500, ' Đã lưu!');
    }

    // Clear history
    function clearHistory() {
        if (confirm('Bạn có chắc muốn xóa tất cả lịch sử?')) {
            state.history = [];
            localStorage.removeItem('japaneseConverterHistory');
            updateHistoryUI();
        }
    }

    // Update history UI
    function updateHistoryUI() {
        if (state.history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="status">
                    <i class="fas fa-history"></i>
                    <span>Không có bản ghi lịch sử nào</span>
                </div>
            `;
            elements.clearHistoryBtn.disabled = true;
            return;
        }
        
        elements.historyList.innerHTML = '';
        elements.clearHistoryBtn.disabled = false;
        
        state.history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-text">${truncateText(entry.vietnamese, 60)}</div>
                <div class="history-meta">
                    <span>${entry.timestamp}</span>
                    <span><i class="fas fa-language"></i> JP</span>
                </div>
            `;
            
            item.addEventListener('click', () => loadHistoryEntry(entry));
            elements.historyList.appendChild(item);
        });
    }

    // Load history entry
    function loadHistoryEntry(entry) {
        elements.vietnameseTextArea.value = entry.vietnamese;
        elements.japaneseTextDiv.textContent = entry.japanese;
        elements.outputContainer.classList.remove('hidden');
        // Switch to converter tab
        document.querySelector('.tab[data-tab="converter"]').click();
    }

    // Helper function to update button state temporarily
    function updateButtonState(button, icon, bgColor, textColor, timeout, text = '') {
        button.innerHTML = `<i class="fas fa-${icon}"></i>${text}`;
        if (bgColor) button.style.backgroundColor = bgColor;
        if (textColor) button.style.color = textColor;
        
        if (timeout > 0) {
            setTimeout(() => {
                button.innerHTML = `<i class="fas fa-${button === elements.copyBtn ? 'copy' : 
                                  button === elements.saveBtn ? 'save' : 'volume-up'}"></i>${text || ''}`;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, timeout);
        }
    }

    // Helper function to truncate text
    function truncateText(text, maxLength) {
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    }

    // Translation functions
    async function convertVietnameseToJapaneseSpeech(vietnameseText) {
        try {
            const translatedText = await translateVietnameseToJapanese(vietnameseText);
            return await optimizeForJapaneseSpeech(translatedText);
        } catch (error) {
            console.error('Conversion error:', error);
            throw error;
        }
    }

	async function translateVietnameseToJapanese(text) {
		const prompt = `Please translate the following Vietnamese text into natural Japanese:

	"${text}"

	Requirements:
	1. Translate the content accurately
	2. Use simple and clear vocabulary that is suitable for non-native speakers
	3. Maintain a natural tone as if for a spoken presentation
	4. Keep all proper nouns and technical terms unchanged
	5. Return only the translated text, without any explanation or additional information`;

		const response = await fetchFromGemini(prompt);
		return response.candidates[0].content.parts[0].text;
	}

	async function optimizeForJapaneseSpeech(japaneseText) {
		const prompt = `Please rewrite the following Japanese text to make it sound like a natural, smooth, and beginner-friendly spoken presentation for non-native speakers:

	"${japaneseText}"

	Requirements:
	1. Add a polite and natural greeting at the beginning and a closing remark at the end.
	2. Use clear and simple vocabulary that is suitable for Japanese learners.
	3. Rewrite the text into about 10–15 logically flowing sentences, avoiding overly short or choppy phrases.
	4. Use natural-sounding conjunctions, adverbs, and onomatopoeic/repetitive expressions (such as「まず」「たとえば」「ゆっくりと」「実は」「もちろん」「少しずつ」) to make the speech feel smooth and expressive.
	5. Keep the core meaning and structure of the original content.
	6. Avoid unnatural literal translations; instead, adapt the phrasing so it sounds like a real spoken Japanese speech.
	7. Return only the final optimized Japanese text, with no explanations or commentary.

	The goal is to create a smooth, polished, and expressive Japanese speech that feels natural for oral delivery, while remaining accessible to intermediate Japanese learners.`;
		
		const response = await fetchFromGemini(prompt);
		return response.candidates[0].content.parts[0].text;
	}



    async function fetchFromGemini(promptText) {
        const GEMINI_API_KEY = "AIzaSyD-LQ7BMIl85o0Tq3LogG2rBmtYjkOpogU";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    // Initialize the app
    init();
});