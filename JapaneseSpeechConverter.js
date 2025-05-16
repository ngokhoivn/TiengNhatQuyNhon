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
        elements.speakBtn.addEventListener('click', speakText);
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
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
    function speakText() {
        const text = elements.japaneseTextDiv.textContent;
        if (!text) return;
        
        if (!window.speechSynthesis) {
            updateStatus('Trình duyệt không hỗ trợ đọc văn bản', 'error');
            return;
        }
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        
        // Try to find Japanese female voice
        const japaneseVoice = speechSynthesis.getVoices().find(voice => 
            voice.lang === 'ja-JP' && voice.name.includes('Female')
        );
        if (japaneseVoice) utterance.voice = japaneseVoice;
        
        // Update button during speech
        updateButtonState(elements.speakBtn, 'volume-up', '', '', 0, ' Đang phát...');
        
        utterance.onend = () => {
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
        const prompt = `Hãy dịch đoạn văn bản sau từ tiếng Việt sang tiếng Nhật một cách tự nhiên:
        
        "${text}"
        
        Yêu cầu:
        1. Dịch chính xác nội dung
        2. Sử dụng ngôn ngữ tự nhiên, phù hợp văn nói
        3. Thêm các từ ngữ biểu cảm phù hợp
        4. Giữ nguyên tên riêng, thuật ngữ chuyên môn
        5. Trả về chỉ văn bản dịch, không giải thích thêm`;

        const response = await fetchFromGemini(prompt);
        return response.candidates[0].content.parts[0].text;
    }

    async function optimizeForJapaneseSpeech(japaneseText) {
        const prompt = `Tối ưu đoạn văn sau thành bài phát biểu tiếng Nhật trang trọng:
        
        "${japaneseText}"
        
        Yêu cầu:
        1. Thêm mở đầu/kết thúc phù hợp
        2. Điều chỉnh ngữ điệu tự nhiên hơn
        3. Chia thành các câu ngắn dễ đọc
        4. Thêm từ nối phù hợp
        5. Giữ nguyên nội dung chính
        6. Trả về chỉ văn bản hoàn thiện`;

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