<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SubRealtime - Nhận dạng và dịch giọng nói thời gian thực</title>
	<style>
		:root {
			--primary-color: #4a148c;
			--secondary-color: #7b1fa2;
			--text-color: #f5f5f5;
			--background-dark: #121212;
			--background-light: #1e1e1e;
			--accent-color: #aa00ff;
			--danger-color: #d32f2f;
			--success-color: #388e3c;
			--warning-color: #f57f17;
			--info-color: #0288d1;
		}

		body {
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
			margin: 0;
			padding: 0;
			background-color: var(--background-dark);
			color: var(--text-color);
			line-height: 1.6;
		}

		.container {
			max-width: 900px;
			margin: 0 auto;
			padding: 20px;
		}

		header {
			text-align: center;
			padding: 10px 0;
			margin-bottom: 20px;
			border-bottom: 1px solid var(--accent-color);
		}

		h1 {
			margin: 0;
			color: var(--accent-color);
		}

		.status-bar {
			background-color: var(--background-light);
			padding: 10px;
			margin-bottom: 15px;
			border-radius: 5px;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.status-message {
			flex-grow: 1;
		}

		.status-bar.recording {
			background-color: rgba(170, 0, 255, 0.3);
			border-left: 4px solid var(--accent-color);
		}

		.status-bar.error {
			background-color: rgba(211, 47, 47, 0.3);
			border-left: 4px solid var(--danger-color);
		}

		.status-bar.success {
			background-color: rgba(56, 142, 60, 0.3);
			border-left: 4px solid var(--success-color);
		}

		.status-bar.warning {
			background-color: rgba(245, 127, 23, 0.3);
			border-left: 4px solid var(--warning-color);
		}

		.status-bar.info {
			background-color: rgba(2, 136, 209, 0.3);
			border-left: 4px solid var(--info-color);
		}

		.status-bar.processing {
			background-color: rgba(3, 169, 244, 0.3);
			border-left: 4px solid #03a9f4;
		}

		.language-tabs {
			display: flex;
			margin-bottom: 15px;
			border-radius: 5px;
			overflow: hidden;
			background-color: var(--background-light);
		}

		.language-tab {
			flex-grow: 1;
			padding: 10px;
			text-align: center;
			cursor: pointer;
			border: none;
			background-color: var(--background-light);
			color: var(--text-color);
			transition: all 0.3s ease;
		}

			.language-tab:hover {
				background-color: rgba(170, 0, 255, 0.3);
			}

			.language-tab.active {
				background-color: var(--accent-color);
				color: white;
			}

		.action-buttons {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 15px;
		}

		.btn {
			padding: 10px 15px;
			border: none;
			border-radius: 5px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			background-color: var(--primary-color);
			color: white;
			transition: all 0.3s ease;
			min-width: 120px;
		}

			.btn:hover {
				background-color: var(--secondary-color);
				transform: translateY(-2px);
			}

		.btn-mic {
			background-color: var(--accent-color);
		}

			.btn-mic.active {
				background-color: var(--danger-color);
				animation: pulse 1.5s infinite;
			}

        .btn-bilingual.active {
            background-color: var(--danger-color);
            animation: pulse 1.5s infinite;
        }

		@keyframes pulse {
			0% {
				box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
			}

			70% {
				box-shadow: 0 0 0 10px rgba(211, 47, 47, 0);
			}

			100% {
				box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
			}
		}

		.btn-clear {
			background-color: var(--danger-color);
		}

		.btn-correct {
			background-color: var(--success-color);
		}

		.btn-translate {
			background-color: var(--info-color);
		}

		.btn-vocab {
			background-color: var(--warning-color);
		}

		.content-box {
			background-color: var(--background-light);
			padding: 15px;
			border-radius: 5px;
			margin-bottom: 15px;
		}

			.content-box h3 {
				margin-top: 0;
				color: var(--accent-color);
				border-bottom: 1px solid rgba(170, 0, 255, 0.3);
				padding-bottom: 5px;
			}

		.result-box {
			min-height: 80px;
			white-space: pre-wrap;
		}

		.corrected-box, .translation-box, .vocab-box {
			border-left: 4px solid var(--accent-color);
		}

		.hidden {
			display: none;
		}

		textarea {
			width: 100%;
			padding: 10px;
			background-color: var(--background-dark);
			border: 1px solid #333;
			border-radius: 5px;
			color: var(--text-color);
			min-height: 120px;
			resize: vertical;
		}

		@media (max-width: 768px) {
			.action-buttons {
				flex-direction: column;
			}

			.btn {
				width: 100%;
			}
		}

		/* Vocab table styling */
		table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 10px;
		}

		th, td {
			padding: 8px;
			border: 1px solid #333;
		}

		th {
			background-color: var(--background-dark);
			color: var(--accent-color);
		}

		tr:nth-child(even) {
			background-color: rgba(0, 0, 0, 0.2);
		}

        .sentence-pair {
            margin-bottom: 15px;
            border-bottom: 1px dashed #444;
            padding-bottom: 10px;
        }

        .original-sentence {
            color: var(--accent-color);
        }

        .translated-sentence {
            color: #4CAF50;
        }

        /* Thêm vào phần style */
        .floating-action-bar {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            z-index: 1000;
            pointer-events: none; /* Cho phép click xuyên qua vùng trống */
        }

        .action-buttons-scroll {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding: 10px;
            background-color: var(--background-light);
            border-radius: 50px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 90%;
            pointer-events: auto; /* Bật lại click cho vùng nút */
            scrollbar-width: none; /* Ẩn thanh cuộn trên Firefox */
        }

            .action-buttons-scroll::-webkit-scrollbar {
                display: none; /* Ẩn thanh cuộn trên Chrome/Safari */
            }

            .action-buttons-scroll .btn {
                flex: 0 0 auto; /* Không co giãn, không thu nhỏ, kích thước tự động */
                white-space: nowrap; /* Ngăn chữ xuống dòng */
                min-width: 120px;
                padding: 10px 15px;
            }

        /* Hiệu ứng khi cuộn */
        .action-buttons-scroll {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch; /* Cuộn mượt trên iOS */
        }

        /* Ẩn thanh nút khi không cần thiết */
        @media (min-width: 1200px) {
            .action-buttons-scroll {
                overflow-x: visible;
                justify-content: center;
            }
        }

        /* Điều chỉnh cho mobile */
        @media (max-width: 768px) {
            .floating-action-bar {
                bottom: 10px;
            }

            .action-buttons-scroll {
                max-width: 95%;
                padding: 8px;
            }

                .action-buttons-scroll .btn {
                    min-width: 100px;
                    padding: 8px 12px;
                    font-size: 14px;
                }
        }

        /* CSS cũ (giữ nguyên) */
        .copy-spreadsheet-btn {
            background-color: var(--secondary-color);
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
        }

        .copy-spreadsheet-btn:hover {
            background-color: var(--accent-color);
        }

        .copy-spreadsheet-btn.copied {
            background-color: var(--success-color);
        }

        /* === TỐI ƯU CHO NÚT COPY TỪ VỰNG === */
        .vocab-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(170, 0, 255, 0.3);
            padding-bottom: 5px;
        }

        .vocab-header h3 {
            margin: 0;
            color: var(--accent-color);
        }

        .vocab-header .copy-spreadsheet-btn {
            margin-top: 0; /* Ghi đè margin cũ */
            padding: 6px 12px;
            font-size: 14px;
            white-space: nowrap;
            background-color: var(--secondary-color);
        }

        .vocab-header .copy-spreadsheet-btn:hover {
            background-color: var(--accent-color);
        }

        /* === TỐI ƯU CHO NÚT "ĐÃ CHỈNH SỬA" === */
        .corrected-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(170, 0, 255, 0.3);
            padding-bottom: 5px;
        }

        .corrected-header h3 {
            margin: 0;
            color: var(--accent-color);
        }

        .corrected-actions {
            display: flex;
            gap: 8px;
        }

        .corrected-actions .btn {
            padding: 6px 10px;
            font-size: 14px;
            min-width: unset; /* Bỏ width cố định */
        }

        /* === RESPONSIVE CHO MOBILE === */
        @media (max-width: 768px) {
            /* Điều chỉnh nút trên mobile */
            .corrected-actions {
                gap: 4px;
            }

            .corrected-actions .btn {
                padding: 4px 8px;
                font-size: 12px;
            }

            .vocab-header .copy-spreadsheet-btn {
                padding: 4px 8px;
                font-size: 12px;
            }
        }



	</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>SubRealtime</h1>
            <p>Nhận dạng giọng nói thời gian thực với chỉnh sửa và dịch thuật</p>
        </header>

        <div id="statusBar" class="status-bar">
            <span id="statusMessage" class="status-message">Sẵn sàng</span>
        </div>

        <div class="language-tabs">
            <button id="langVi" class="language-tab active" onclick="onLanguageTabClick('vi-VN')">🇻🇳 Tiếng Việt</button>
            <button id="langEn" class="language-tab" onclick="onLanguageTabClick('en-US')">🇺🇸 Tiếng Anh</button>
            <button id="langJa" class="language-tab" onclick="onLanguageTabClick('ja-JP')">🇯🇵 Tiếng Nhật</button>
        </div>

        <div id="resultContainer" class="content-box">
            <h3>Nhận dạng giọng nói</h3>
            <div id="resultBox" class="result-box"></div>
        </div>

        <div id="correctedContainer" class="content-box corrected-box hidden">
            <div class="corrected-header">
                <h3>Đã chỉnh sửa</h3>
                <div class="corrected-actions">
                    <button id="speakButton" class="btn" onclick="onSpeakButtonClick()">🔊 Phát âm</button>
                    <button id="stopSpeakButton" class="btn btn-clear hidden" onclick="onStopSpeakButtonClick()">⏹️ Dừng</button>
                    <button id="translateCorrectedButton" class="btn btn-translate" onclick="onTranslateCorrectedClick()">🔄 Dịch</button>
                </div>
            </div>
            <div id="correctedBox" class="result-box"></div>
        </div>

        <div id="translationContainer" class="content-box translation-box hidden">
            <h3>Bản dịch </h3>
            <div id="translationText" class="result-box"></div>
        </div>

        <div id="vocabContainer" class="content-box vocab-box hidden">
            <div class="vocab-header">
                <h3>Từ vựng gợi ý</h3>
                <button class="copy-spreadsheet-btn" onclick="copyVocabulary()">⎘ Copy từ vựng</button>
            </div>
            <div id="vocabList"></div>
        </div>

        <div class="content-box">
            <h3>Soạn thảo văn bản</h3>
            <textarea id="editableText" placeholder="Nội dung có thể chỉnh sửa ở đây..."></textarea>
        </div>
    </div>

    <script>
        const GEMINI_API_KEY = "AIzaSyDaROReiR48rjfavf8Lk6XvphC6QxKPZo4";
        // Initialize currentLang with default language

        // --- CÁC BIẾN TRẠNG THÁI CHÍNH ---
        let isRecording = false;            // Đang ghi âm hay không
        let finalTranscript = '';           // Kết quả nhận dạng cuối cùng
        let interimTranscript = '';         // Kết quả tạm thời trong quá trình nhận dạng
        let correctedText = '';             // Văn bản đã được chỉnh sửa ngữ pháp
        let translatedText = '';            // Văn bản đã được dịch
        let currentLang = 'vi-VN';          // Ngôn ngữ hiện tại
        let recognitionStoppedManually = false; // Kiểm soát dừng thủ công
        let recognition = null;             // Đối tượng nhận dạng giọng nói
        let isProcessing = false; // Tránh xử lý chồng chéo
        let sentenceBuffer = ""; // Lưu tạm câu đang nhận diện
        let bilingualMode = false;
        let translationWorker;
        let currentUtterance = null;

        // --- QUẢN LÝ DOM ELEMENTS ---
        const elements = {
            statusBar: document.getElementById('statusBar'),
            statusMessage: document.getElementById('statusMessage'),
            resultBox: document.getElementById('resultBox'),
            correctedBox: document.getElementById('correctedBox'),
            correctedContainer: document.getElementById('correctedContainer'),
            translationText: document.getElementById('translationText'),
            translationContainer: document.getElementById('translationContainer'),
            vocabList: document.getElementById('vocabList'),
            vocabContainer: document.getElementById('vocabContainer'),
            editableText: document.getElementById('editableText'),
            translationBox: document.getElementById('translationContainer'),
            vocabBox: document.getElementById('vocabContainer'),
            langTabs: {
                vi: document.getElementById('langVi'),
                en: document.getElementById('langEn'),
                ja: document.getElementById('langJa')
            }
        };

        function initTranslationWorker() {
            if (window.Worker) {
                translationWorker = new Worker('translation-worker.js');
                translationWorker.onmessage = function (e) {
                    elements.translationText.textContent = e.data;
                    elements.translationContainer.classList.remove('hidden');
                };
            } else {
                console.warn('Trình duyệt không hỗ trợ Web Worker');
            }
        }

        // --- KHỞI TẠO NHẬN DẠNG GIỌNG NÓI ---
        function initSpeechRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                showStatus('error', 'Trình duyệt không hỗ trợ nhận diện giọng nói');
                return false;
            }

            try {
                // Tạo đối tượng nhận dạng
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

                // Cấu hình
                recognition.lang = currentLang;
                recognition.interimResults = true;  // Cho phép kết quả tạm thời
                recognition.continuous = true;      // Nhận dạng liên tục
                recognition.maxAlternatives = 3;    // Số lượng phương án thay thế

                // Xử lý các sự kiện
                recognition.onresult = handleRecognitionResult;
                recognition.onstart = handleRecognitionStart;
                recognition.onend = handleRecognitionEnd;
                recognition.onerror = handleRecognitionError;

                return true;
            } catch (error) {
                console.error("Lỗi khởi tạo nhận dạng giọng nói:", error);
                showStatus('error', `Lỗi khởi tạo: ${error.message}`);
                return false;
            }
        }

        // --- XỬ LÝ KẾT QUẢ NHẬN DẠNG ---
        function handleRecognitionResult(event) {
            if (isProcessing) return; // Bỏ qua nếu đang xử lý câu trước

            let interimResult = '';
            let finalResult = '';

            // Lọc kết quả
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();
                if (event.results[i].isFinal) {
                    finalResult += transcript + ' ';
                } else {
                    interimResult += transcript + ' ';
                }
            }

            // Chỉ xử lý khi có câu hoàn chỉnh và độ dài hợp lý
            if (finalResult) {
                const sentence = finalResult.trim();
                if (sentence.split(' ').length < 25) { // Chỉ xử lý câu ngắn
                    sentenceBuffer = sentence;
                    processSentence(sentenceBuffer); // Xử lý pipeline
                }
            }

            // Hiển thị kết quả tạm thời (nếu có)
            if (interimResult) {
                elements.resultBox.textContent = (sentenceBuffer ? sentenceBuffer + ' ' : '') + interimResult;
            }
        }

        // Hàm xử lý pipeline cho mỗi câu
        async function processSentence(sentence) {
            try {
                isProcessing = true;
                showStatus('processing', 'Đang xử lý câu...');

                // 1. Hiển thị câu gốc trong resultBox
                elements.resultBox.textContent = sentence;

                // 2. Thêm vào editableText
                const currentContent = elements.editableText.value.trim();
                elements.editableText.value = currentContent ? currentContent + '\n' + sentence : sentence;

                // 3. Đồng bộ UI
                await new Promise(resolve => requestAnimationFrame(resolve));
                elements.editableText.scrollTop = elements.editableText.scrollHeight;

                // 4. Dịch tự động nếu bật chế độ song ngữ
                if (bilingualMode) {
                    const translated = await translateText(sentence, currentLang, getTargetLanguage(currentLang));
                    elements.translationText.textContent = translated;
                    elements.translationContainer.classList.remove('hidden');
                }

            } catch (error) {
                console.error("Pipeline lỗi:", error);
            } finally {
                isProcessing = false;
                sentenceBuffer = "";
            }
        }

        // --- BẮT ĐẦU NHẬN DẠNG ---
        function startRecognition() {
            try {
                if (!recognition) {
                    if (!initSpeechRecognition()) return;
                }

                // Cấu hình ngôn ngữ hiện tại
                recognition.lang = currentLang;

                // Bắt đầu ghi âm
                recognition.start();
                isRecording = true;
                recognitionStoppedManually = false;

                // Cập nhật UI
                updateMicButtonState(true);
                showStatus('recording', 'Đang nghe... ');

            } catch (error) {
                console.error("Lỗi khi bắt đầu nhận dạng:", error);
                showStatus('error', `Không thể bắt đầu ghi âm: ${error.message}`);
            }
        }

        // --- DỪNG NHẬN DẠNG ---
        function stopRecognition() {
            try {
                recognitionStoppedManually = true;
                if (recognition) {
                    recognition.stop();
                }

                // Cập nhật trạng thái
                isRecording = false;

                // Cập nhật UI
                updateMicButtonState(false);
                showStatus('ready', 'Đã dừng ghi âm');

                // Hiển thị kết quả cuối cùng (bao gồm cả tạm thời nếu có)
                if (interimTranscript.trim()) {
                    finalTranscript += interimTranscript.trim() + ' ';
                    elements.resultBox.textContent = finalTranscript.trim();
                    interimTranscript = '';
                }
            } catch (error) {
                console.error("Lỗi khi dừng nhận dạng:", error);
                showStatus('error', `Lỗi khi dừng ghi âm: ${error.message}`);
            }
        }

        // --- XỬ LÝ KHI NHẬN DẠNG KẾT THÚC ---
        function handleRecognitionEnd() {
            isRecording = false;
            updateMicButtonState(false);

            // Xử lý kết quả tạm thời còn lại nếu có
            if (interimTranscript.trim()) {
                finalTranscript += interimTranscript.trim() + ' ';
                elements.resultBox.textContent = finalTranscript.trim();
                interimTranscript = '';
            }

            // Không tự động lưu vào editable box
            // Không tự động chỉnh sửa hoặc dịch

            // Tự động khởi động lại nếu không dừng thủ công
            if (!recognitionStoppedManually) {
                try {
                    recognition.start();
                    isRecording = true;
                    updateMicButtonState(true);
                    showStatus('recording', 'Đang nghe...');
                } catch (e) {
                    console.error("Lỗi khi khởi động lại:", e);
                    showStatus('error', 'Không thể tiếp tục ghi âm');
                }
            } else {
                recognitionStoppedManually = false; // Đặt lại cờ
            }
        }

        // --- CHỈNH SỬA VĂN BẢN BẰNG GEMINI API ---
        async function correctText(text, sourceLang) {
            if (!text || text.trim() === '') {
                return '';
            }

            showStatus('processing', 'Đang chỉnh sửa câu...');

            try {
                const languageMap = {
                    'vi-VN': 'Vietnamese',
                    'en-US': 'English',
                    'ja-JP': 'Japanese'
                };

                const language = languageMap[sourceLang] || 'English';

                const prompt = `Please correct and improve this ${language} text for natural
                          grammar, flow and accuracy. Only return the corrected text,
                          no explanations:\n\n"${text}"`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
                    correctedText = data.candidates[0].content.parts[0].text.trim();
                    showStatus('success', 'Đã chỉnh sửa câu');
                    return correctedText;
                } else {
                    throw new Error('Không nhận được phản hồi từ API');
                }
            } catch (error) {
                console.error('Lỗi khi chỉnh sửa câu:', error);
                showStatus('error', 'Không thể chỉnh sửa câu');
                return text; // Trả về văn bản gốc nếu lỗi
            }
        }

        // --- DỊCH VĂN BẢN BẰNG GEMINI API ---
        async function translateText(text, sourceLang, targetLang) {
            if (!text.trim()) return '';

            // Sử dụng Worker nếu có (cho bản dịch nền)
            if (window.Worker && translationWorker) {
                showStatus('processing', 'Đang dịch (nền)...');
                translationWorker.postMessage({
                    sentence: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                    apiKey: GEMINI_API_KEY
                });
                return ''; // Worker sẽ xử lý async
            }

            // Fallback khi không có Worker
            return await translateWithAPI(text, sourceLang, targetLang);
        }

        // Hàm riêng cho API call (dùng cả bởi Worker và main thread)
        async function translateWithAPI(text, sourceLang, targetLang) {
            showStatus('processing', 'Đang dịch câu...');

            try {
                const languageMap = {
                    'vi-VN': 'Vietnamese',
                    'en-US': 'English',
                    'ja-JP': 'Japanese'
                };

                const sourceLanguage = languageMap[sourceLang] || 'Vietnamese';
                const targetLanguage = languageMap[targetLang] || 'English';

                const prompt = `Dịch từ ${sourceLanguage} sang ${targetLanguage}, chỉ trả về bản dịch:\n\n${text}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

                if (!translated) throw new Error('Bản dịch trống');

                showStatus('success', 'Đã dịch xong');
                return translated;
            } catch (error) {
                console.error('Lỗi dịch:', error);
                showStatus('error', 'Lỗi dịch: ' + (error.message || ''));
                return '';
            }
        }

        // --- GỢI Ý từ VỰNG ---
        async function suggestVocabulary(text, sourceLang) {
            if (!text || text.trim() === '') {
                return '<i>Không có nội dung để gợi ý từ vựng</i>';
            }

            showStatus('processing', 'Đang lấy từ vựng...');

            try {
                const languageMap = {
                    'vi-VN': 'Vietnamese',
                    'en-US': 'English',
                    'ja-JP': 'Japanese'
                };

                const language = languageMap[sourceLang] || 'English';

                let prompt;
                if (sourceLang === 'ja-JP') {
                    prompt = `Extract Japanese vocabulary from this sentence in format:
                Kanji = Hiragana = Vietnamese meaning.
                If no vocabulary found, reply "No vocabulary".
                Only list vocabulary, no explanations:\n\n"${text}"`;
                } else {
                    prompt = `Extract important vocabulary words from this ${language} sentence
                with Vietnamese translations. Format each as: Word = Translation.
                If none, reply "No vocabulary". Only list words:\n\n"${text}"`;
                }

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 512,
                        }
                    })
                });

                const data = await response.json();

                if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
                    throw new Error('Không nhận được từ vựng từ API');
                }

                const rawText = data.candidates[0].content.parts[0].text.trim();

                if (rawText.toLowerCase().includes('no vocabulary')) {
                    return '<i>Không có từ vựng nào được phát hiện.</i>';
                }

                // Xử lý kết quả cho tiếng Nhật (3 cột)
                if (sourceLang === 'ja-JP') {
                    const rows = rawText.split('\n')
                        .filter(line => line.trim() && line.includes('='))
                        .map(line => {
                            const parts = line.split('=').map(s => s.trim());
                            if (parts.length >= 3) {
                                return `<tr>
                            <td>${parts[0]}</td>
                            <td>${parts[1]}</td>
                            <td>${parts.slice(2).join(' - ')}</td>
                        </tr>`;
                            }
                            return '';
                        })
                        .filter(row => row !== '');

                return `
                <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #222;">
                        <th>Kanji</th>
                        <th>Hiragana</th>
                        <th>Nghĩa</th>
                    </tr>
                    ${rows.join('\n')}
                </table>                
            `;
                }
                // Xử lý cho các ngôn ngữ khác (2 cột)
                else {
                    const rows = rawText.split('\n')
                        .filter(line => line.trim() && line.includes('-'))
                        .map(line => {
                            const parts = line.split('-').map(s => s.trim());
                            return `<tr>
                        <td>${parts[0]}</td>
                        <td>${parts.slice(1).join(' - ')}</td>
                    </tr>`;
                        });

                    return `
                <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #222;">
                        <th>Từ vựng</th>
                        <th>Nghĩa</th>
                    </tr>
                    ${rows.join('\n')}
                </table>
            `;
                }

            } catch (error) {
                console.error('Lỗi khi lấy từ vựng:', error);
                showStatus('error', 'Không thể lấy từ vựng');
                return '<i>Không thể lấy từ vựng</i>';
            }
        }

        // --- CẬP NHẬT TRẠNG THÁI NÚT MIC ---
        function toggleRecognition() {
            if (isRecording) {
                stopRecognition();
            } else {
                startRecognition();
            }
        }

        // --- TOGGLE HIỂN THỊ CÂU CHỈNH SỬA ---
        async function toggleCorrectedText() {
            try {
                // Lấy văn bản hiện tại từ editableText thay vì resultBox
                const rawText = elements.editableText.value.trim();

                if (!rawText) {
                    showStatus('warning', 'Không có nội dung để chỉnh sửa');
                    return;
                }

                // Gọi API chỉnh sửa văn bản
                const corrected = await correctText(rawText, currentLang);

                // Hiển thị trong corrected box
                elements.correctedBox.textContent = corrected;
                elements.correctedContainer.classList.remove('hidden');

                // Cập nhật cả editableText với nội dung đã chỉnh sửa
                elements.editableText.value = corrected;

                showStatus('success', 'Đã hiển thị câu chỉnh sửa');
            } catch (error) {
                console.error('Lỗi toggle chỉnh sửa:', error);
                showStatus('error', 'Lỗi khi hiển thị câu chỉnh sửa');
            }
        }

        // Cập nhật hàm toggleTranslation để dịch từ editable box
        async function toggleTranslation() {
            try {
                const textToTranslate = elements.editableText.value.trim();

                if (!textToTranslate) {
                    showStatus('warning', 'Không có nội dung trong hộp soạn thảo để dịch');
                    return;
                }

                const targetLang = getTargetLanguage(currentLang);
                const translated = await translateText(textToTranslate, currentLang, targetLang);

                elements.translationText.textContent = translated;
                elements.translationContainer.classList.remove('hidden');
                showStatus('success', 'Đã dịch nội dung từ hộp soạn thảo');
            } catch (error) {
                console.error('Lỗi toggle dịch:', error);
                showStatus('error', 'Lỗi khi dịch nội dung từ hộp soạn thảo');
            }
        }

        // --- TOGGLE HIỂN THỊ TỪ VỰNG ---
        async function toggleVocabulary() {
            try {
                // Lấy từ editableText
                const textForVocab = elements.editableText.value.trim();

                if (!textForVocab) {
                    showStatus('warning', 'Không có nội dung để gợi ý từ vựng');
                    return;
                }

                const vocabHTML = await suggestVocabulary(textForVocab, currentLang);
                elements.vocabList.innerHTML = vocabHTML;
                elements.vocabContainer.classList.remove('hidden');
                showStatus('success', 'Đã hiển thị gợi ý từ vựng');
            } catch (error) {
                console.error('Lỗi toggle từ vựng:', error);
                showStatus('error', 'Lỗi khi hiển thị gợi ý từ vựng');
            }
        }

        // --- LƯU VĀN BẢN GỐC VÀO EDITABLE ---
        function saveToEditable() {
            try {
                // Thêm nội dung hiện tại vào editable
                const currentContent = elements.editableText.value.trim();
                const newContent = elements.resultBox.textContent.trim();

                if (!newContent) {
                    showStatus('warning', 'Không có nội dung để lưu');
                    return;
                }

                // Thêm dấu xuống dòng nếu đã có nội dung
                if (currentContent) {
                    elements.editableText.value = currentContent + '\n' + newContent;
                } else {
                    elements.editableText.value = newContent;
                }

                showStatus('success', 'Đã lưu văn bản');
            } catch (error) {
                console.error('Lỗi khi lưu văn bản:', error);
                showStatus('error', 'Không thể lưu văn bản');
            }
        }

        // --- XÓA TẤT CẢ ---
        function clearAll() {
            try {
                // Dừng ghi âm nếu đang chạy
                if (isRecording) {
                    stopRecognition();
                }

                // Xóa nội dung các phần tử
                elements.editableText.value = '';
                elements.resultBox.textContent = '';
                elements.correctedBox.textContent = '';
                elements.translationText.textContent = '';
                elements.vocabList.innerHTML = '';

                // Ẩn các box không cần thiết
                elements.correctedBox.classList.add('hidden');
                elements.translationBox.classList.add('hidden');
                elements.vocabBox.classList.add('hidden');

                // Reset các biến trạng thái
                finalTranscript = '';
                interimTranscript = '';
                correctedText = '';
                translatedText = '';

                showStatus('info', 'Đã xóa tất cả nội dung');
            } catch (error) {
                console.error('Lỗi khi xóa:', error);
                showStatus('error', 'Lỗi khi xóa nội dung');
            }
        }

        // --- PHÁT ÂM BẢN DỊCH ---
        function speakTranslation() {
            try {
                // Xác định văn bản cần phát âm
                const textToSpeak = elements.translationText.textContent.trim();

                if (!textToSpeak) {
                    showStatus('warning', 'Không có nội dung để phát âm');
                    return;
                }

                // Xác định ngôn ngữ cho phát âm
                const speakLanguage = getTargetLanguage(currentLang);

                // Phát âm bằng Web Speech API
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = speakLanguage;
                speechSynthesis.speak(utterance);

                showStatus('info', 'Đang phát âm...');
            } catch (error) {
                console.error('Lỗi khi phát âm:', error);
                showStatus('error', 'Không thể phát âm');
            }
        }

        function getTargetLanguage(sourceLang) {
            // Đảm bảo luôn dịch sang tiếng Việt nếu không phải tiếng Việt
            if (sourceLang !== 'vi-VN') {
                return 'vi-VN';
            }
            // Nếu là tiếng Việt thì dịch sang tiếng Anh
            return 'en-US';
        }

        // --- THAY ĐỔI NGÔN NGỮ ---
        function changeLanguage(newLang) {
            currentLang = newLang;

            // Cập nhật UI
            updateUILanguage(newLang);

            // Cập nhật cấu hình nhận dạng giọng nói
            if (recognition) {
                const wasRecording = isRecording;

                // Dừng nhận dạng hiện tại
                if (wasRecording) {
                    stopRecognition();
                }

                // Cập nhật ngôn ngữ
                recognition.lang = newLang;

                // Khởi động lại nếu đang hoạt động
                if (wasRecording) {
                    setTimeout(() => startRecognition(), 300);
                }
            }

            showStatus('info', `Đã chuyển ngôn ngữ thành ${getLanguageDisplayName(newLang)}`);
        }

        // --- TÊN HIỂN THỊ CHO NGÔN NGỮ ---
        function getLanguageDisplayName(langCode) {
            const names = {
                'vi-VN': 'Tiếng Việt',
                'en-US': 'Tiếng Anh',
                'ja-JP': 'Tiếng Nhật'
            };
            return names[langCode] || langCode;
        }

        // --- LIÊN KẾT SỰ KIỆN VỚI CÁC NÚT ---
        // Các hàm này sẽ được gọi khi sự kiện click xảy ra

        // Nút micro
        function onMicButtonClick() {
            toggleRecognition();
        }

        // Nút hiển thị câu chỉnh sửa
        function onCorrectionButtonClick() {
            toggleCorrectedText();
        }

        // Nút hiển thị bản dịch
        function onTranslateButtonClick() {
            toggleTranslation();
        }

        // Nút hiển thị từ vựng
        function onVocabButtonClick() {
            toggleVocabulary();
        }

        // Nút lưu văn bản
        function onSaveButtonClick() {
            saveToEditable();
        }

        // Nút xóa tất cả
        function onClearButtonClick() {
            clearAll();
        }

        // Hàm phát âm
        function onSpeakButtonClick() {
            try {
                const textToSpeak = elements.correctedBox.textContent.trim();

                if (!textToSpeak) {
                    showStatus('warning', 'Không có nội dung đã chỉnh sửa để phát âm');
                    return;
                }

                // Dừng phát âm hiện tại nếu có
                if (currentUtterance) {
                    speechSynthesis.cancel();
                }

                // Tạo utterance mới
                currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
                currentUtterance.lang = currentLang;

                // Hiển thị nút dừng
                document.getElementById('stopSpeakButton').classList.remove('hidden');
                document.getElementById('speakButton').classList.add('hidden');

                // Sự kiện khi kết thúc phát âm
                currentUtterance.onend = function () {
                    document.getElementById('stopSpeakButton').classList.add('hidden');
                    document.getElementById('speakButton').classList.remove('hidden');
                    currentUtterance = null;
                };

                speechSynthesis.speak(currentUtterance);
                showStatus('info', 'Đang phát âm bản đã chỉnh sửa...');
            } catch (error) {
                console.error('Lỗi khi phát âm:', error);
                showStatus('error', 'Không thể phát âm bản đã chỉnh sửa');
            }
        }

        // Hàm dừng phát âm
        function onStopSpeakButtonClick() {
            try {
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    document.getElementById('stopSpeakButton').classList.add('hidden');
                    document.getElementById('speakButton').classList.remove('hidden');
                    currentUtterance = null;
                    showStatus('info', 'Đã dừng phát âm');
                }
            } catch (error) {
                console.error('Lỗi khi dừng phát âm:', error);
                showStatus('error', 'Không thể dừng phát âm');
            }
        }

        // Nút chuyển tab ngôn ngữ
        function onLanguageTabClick(langCode) {
            changeLanguage(langCode);
        }

        // --- CẬP NHẬT UI THEO NGÔN NGỮ ---
        function updateUILanguage(langCode) {
            // Xóa trạng thái active khỏi tất cả các tab
            for (const key in elements.langTabs) {
                elements.langTabs[key].classList.remove('active');
            }

            // Đặt trạng thái active cho tab hiện tại
            switch (langCode) {
                case 'vi-VN':
                    elements.langTabs.vi.classList.add('active');
                    break;
                case 'en-US':
                    elements.langTabs.en.classList.add('active');
                    break;
                case 'ja-JP':
                    elements.langTabs.ja.classList.add('active');
                    break;
            }
        }

        // --- XỬ LÝ LỖI NHẬN DẠNG ---
        function handleRecognitionError(event) {
            console.error("Lỗi nhận dạng giọng nói:", event.error);

            let errorMessage = "Lỗi nhận dạng giọng nói";
            switch (event.error) {
                case 'no-speech':
                    errorMessage = "Không phát hiện giọng nói";
                    break;
                case 'audio-capture':
                    errorMessage = "Không thể truy cập microphone";
                    break;
                case 'not-allowed':
                    errorMessage = "Quyền truy cập microphone bị từ chối";
                    break;
                case 'network':
                    errorMessage = "Lỗi kết nối mạng";
                    break;
                case 'aborted':
                    errorMessage = "Nhận dạng bị hủy";
                    break;
                case 'language-not-supported':
                    errorMessage = "Ngôn ngữ không được hỗ trợ";
                    break;
            }

            showStatus('error', errorMessage);
            isRecording = false;
            updateMicButtonState(false);
        }

        // --- XỬ LÝ KHI BẮT ĐẦU NHẬN DẠNG ---
        function handleRecognitionStart() {
            showStatus('recording', 'Đang nghe...');
            isRecording = true;
            updateMicButtonState(true);
        }

        // --- HIỂN THỊ TRẠNG THÁI ---
        function showStatus(type, message) {
            // Loại bỏ tất cả các class trạng thái hiện tại
            elements.statusBar.classList.remove('recording', 'error', 'success', 'warning', 'info', 'processing');

            // Thêm class mới tương ứng với loại trạng thái
            elements.statusBar.classList.add(type);

            // Cập nhật nội dung
            elements.statusMessage.textContent = message;
        }


        // --- CẬP NHẬT TRẠNG THÁI NÚT MIC ---
        function updateMicButtonState(isActive) {
            const micButton = document.getElementById('micButton'); // Lấy lại từ DOM trực tiếp mỗi lần

            if (!micButton) return; // Nếu chưa có thì bỏ qua

            if (isActive) {
                micButton.classList.add('active');
                micButton.innerHTML = '🛑 Dừng';
            } else {
                micButton.classList.remove('active');
                micButton.innerHTML = '🎙️ Ghi âm';
            }
        }


        // --- CHẾ ĐỘ SONG NGỮ ---
        function toggleBilingualMode() {
            bilingualMode = !bilingualMode;
            const bilingualButton = document.getElementById('toggleBilingual');

            if (bilingualMode) {
                bilingualButton.classList.add('active');

                // LUÔN hiện bảng dịch khi bật chế độ song ngữ
                elements.translationContainer.classList.remove('hidden');
                showStatus('info', 'Chế độ song ngữ: BẬT');
            } else {
                bilingualButton.classList.remove('active');

                // Ẩn bảng dịch khi tắt chế độ song ngữ
                elements.translationContainer.classList.add('hidden');
                showStatus('info', 'Chế độ song ngữ: TẮT');
            }
        }


        // Hàm dịch nội dung đã chỉnh sửa
        async function onTranslateCorrectedClick() {
            try {
                const textToTranslate = elements.correctedBox.textContent.trim();

                if (!textToTranslate) {
                    showStatus('warning', 'Không có nội dung đã chỉnh sửa để dịch');
                    return;
                }

                const targetLang = getTargetLanguage(currentLang);
                const translated = await translateText(textToTranslate, currentLang, targetLang);

                // Hiển thị trong translation box
                elements.translationText.textContent = translated;
                elements.translationContainer.classList.remove('hidden');
                showStatus('success', 'Đã dịch nội dung đã chỉnh sửa');
            } catch (error) {
                console.error('Lỗi khi dịch nội dung đã chỉnh sửa:', error);
                showStatus('error', 'Lỗi khi dịch nội dung đã chỉnh sửa');
            }
        }

        // Hàm sao chép từ vựng
        async function copyVocabulary() {
            try {
                const vocabTable = document.querySelector('#vocabList table');
                if (!vocabTable) {
                    showStatus('warning', 'Không có từ vựng để sao chép');
                    return;
                }

                let textToCopy = '';
                const rows = vocabTable.querySelectorAll('tr');

                rows.forEach((row, index) => {
                    if (index === 0) return; // Bỏ qua hàng tiêu đề

                    const cells = row.querySelectorAll('td');
                    let rowText = '';

                    cells.forEach((cell, cellIndex) => {
                        rowText += cell.textContent.trim();
                        if (cellIndex < cells.length - 1) {
                            rowText += ' - ';
                        }
                    });

                    textToCopy += rowText + '\n';
                });

                await navigator.clipboard.writeText(textToCopy.trim());

                // Sử dụng class để chọn nút copy
                const copyBtn = document.querySelector('.copy-spreadsheet-btn');
                if (copyBtn) {
                    copyBtn.textContent = '✓ Đã copy';
                    copyBtn.classList.add('copied');
                }

                showStatus('success', 'Đã sao chép từ vựng vào clipboard');

                setTimeout(() => {
                    if (copyBtn) {
                        copyBtn.textContent = '⎘ Copy từ vựng';
                        copyBtn.classList.remove('copied');
                    }
                }, 2000);

            } catch (error) {
                console.error('Lỗi khi sao chép từ vựng:', error);
                showStatus('error', 'Sao chép thất bại: ' + error.message);
            }
        }

    </script>

    <!-- Thêm vào cuối thẻ body, trước khi đóng </body> -->
    <div class="floating-action-bar">
        <div class="action-buttons-scroll">
            <button id="micButton" class="btn btn-mic" onclick="onMicButtonClick()">🎙️ Ghi âm</button>
            <button id="toggleBilingual" class="btn btn-bilingual" onclick="toggleBilingualMode()">🌐 Chế độ song ngữ</button>
            <button id="correctionButton" class="btn btn-correct" onclick="onCorrectionButtonClick()">✏️ Chỉnh sửa</button>
            <button id="translateButton" class="btn btn-translate" onclick="onTranslateButtonClick()">🔄 Dịch</button>
            <button id="vocabButton" class="btn btn-vocab" onclick="onVocabButtonClick()">📚 Từ vựng</button>
            <button id="saveButton" class="btn" onclick="onSaveButtonClick()">💾 Lưu</button>
            <button id="clearButton" class="btn btn-clear" onclick="onClearButtonClick()">🗑️ Xóa tất cả</button>
        </div>
    </div>
</body>
</html>
