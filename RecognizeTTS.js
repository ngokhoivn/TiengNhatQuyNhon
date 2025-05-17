let recognition;
let isRecording = false;

function initSpeechRecognition(lang = 'vi-VN') {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Trình duyệt không hỗ trợ nhận diện giọng nói');
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = function (event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript + ' ';
            }
        }

        console.log("Kết quả tạm:", interimTranscript);
        console.log("Kết quả cuối:", finalTranscript);
        document.getElementById('output').textContent = finalTranscript || interimTranscript;
    };

    recognition.onerror = function (event) {
        console.error("Lỗi:", event.error);
    };

    recognition.onend = function () {
        isRecording = false;
        console.log("Đã dừng ghi âm");
    };
}

function toggleMic(lang = 'vi-VN') {
    if (!recognition) initSpeechRecognition(lang);
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.lang = lang;
        recognition.start();
    }
    isRecording = !isRecording;
}

<script>
function speakJapanese(text) {
    if (!text || typeof text !== 'string') return;

    // Hủy phát âm hiện tại nếu đang nói
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; // Ngôn ngữ tiếng Nhật

    // Chọn giọng tiếng Nhật (nếu có)
    const voices = speechSynthesis.getVoices();
    const japaneseVoice = voices.find(v => v.lang === 'ja-JP');
    if (japaneseVoice) {
        utterance.voice = japaneseVoice;
    }

    speechSynthesis.speak(utterance);
}
</script>

