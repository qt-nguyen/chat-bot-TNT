var OPENAI_API_KEY = "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";
var text_to_speech_is_supported = false;
var speech_is_in_progress = false;
var speech_recognizer = null
var speech_utterance = null;
var voice_input = null;

// Được gọi ngay khi trang được load
function OnLoad() {
    // Kiểm tra trình duyệt có hỗ trợ giọng nói không
    if ("webkitSpeechRecognition" in window) {
    }
    else {
        // Truyền thông tin rằng giọng nói không được hỗ trợ
        lblSpeak.style.display = "none";
    }

    // Kiểm tra trình duyệt có hỗ trợ chuyển đổi văn bản thành giọng nói hay không 
    if ('speechSynthesis' in window) {
        text_to_speech_is_supported = true;
        speechSynthesis.onvoiceschanged = function () {
            // Thay đổi giọng nói theo tùy chỉnh của người dùng
            voice_input = window.speechSynthesis.getVoices();
            for (var i = 0; i < voice_input.length; i++) {
                selVoices[selVoices.length] = new Option(voice_input[i].name, i);
            }
        };
    }
}

// Thay đổi ngôn ngữ của âm thanh đầu vào
function ChangeLang(o) {
    if (speech_recognizer) {
        speech_recognizer.lang = selLang.value;
        //SpeechToText()
    }
}


// Biến lưu lịch sử để truyền lại cho bot sau mỗi lần gọi API
const conversation_history = []


// Hàm Send là back-end
function Send() {
    // str_input: input text đơn thuần
    // txtMsg: đối tượng input
    var str_input = $("#chat-input").val();


    if (str_input == "") {  // Báo lỗi và thoát khỏi chương trình nếu prompt rỗng
        alert("Type in your question!");
        chat-input.focus(); // Đặt con trỏ soạn thảo vào hộp nhập
        return;
    }


    $("#chat-input").val('');

    let html_data = '';
    html_data += `
            <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                 <div class="d-flex gap-2 w-100 justify-content-end">
                     <div>
                         <p class="mb-0 opacity-75">${str_input}</p>
                     </div>
                     <img src="images/HCMUS.png" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
                 </div>
              </a>
            `;
    //Clear the  input box 
    $("#chat-input").val('');
    //Append prompt text to history
    $("#list-group").append(html_data);

    // Gửi yêu cầu dữ liệu đến máy chủ
    var oHttp = new XMLHttpRequest();

    oHttp.open("POST", "https://api.openai.com/v1/chat/completions"); // Máy chủ để gửi yêu cầu POST

    // Header c?a y�u c?u
    oHttp.setRequestHeader("Accept", "application/json"); // Y�u c?u ??u v�o ch? ch?p nh?n m�i tr??ng javascrpt
    oHttp.setRequestHeader("Content-Type", "application/json"); // K?t qu? ??u v�o tu�n theo  c� ph�p javascript
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY) // X�c th?c truy c?p, s? d?ng API c?a OpenAI

    conversation_history[conversation_history.length] = {"role": "user", "content": str_input};
    // Dữ liệu trong yêu cầu được gửi lên máy chủ
    var data = {
        "model": "gpt-3.5-turbo", // Model GPT-3.5-turbo, model hiện hành của ChatGPT
        "messages": conversation_history, // Thông điệp để gọi API phản hồi
    }

    // Truyền thông điệp của người dùng vào stream xuất 
    txtOutput = '';
    txtOutput += "User: " + str_input + "\n"



    // Định nghĩa hành vi xảy ra nếu trạng thái của biến oHttp thay đổi (đồng nghĩa với việc đã nhận dữ liệu từ máy chủ)
    // (chưa biết là dữ liệu đúng hay không)

    // Thực thi khối lệnh sau khi trạng thái oHttp thay đổi:
    oHttp.onreadystatechange = function () {

        // XMLHttpRequest.readyState cho biết trạng thái  yêu cầu đã gửi từ máy khách.
        // Giá trị 0 (chưa tiến hành) -> 4 (đã hoàn thành) biểu thị mức độ hoàn thành của yêu cầu. 
        if (oHttp.readyState === 4) {
            var oJson = {} // oJson lưu dữ liệu được máy chủ gửi về

            // Nếu stream output có chứa dữ liệu, thêm ký tự xuống dòng vào stream.
            if (txtOutput != "") txtOutput += "\n";

            // Test dòng lệnh sau và trả về thông báo lỗi (nếu có)
            try {
                // Lưu oHttp.responseText (dữ liệu được máy chủ trả về) vào biến oJson
                oJson = JSON.parse(oHttp.responseText);
            }
            catch (ex) // Nếu quá trình parse không thành công: 
            {
                // Biến ex tạm thời lưu thông báo lỗi
                txtOutput += "Error: " + ex.message + "\n" // Lưu thông báo lỗi vào stream output.
            }

            if (oJson.error && oJson.error.message) // Nếu có lỗi xảy ra
            {
                txtOutput += "Error: " + oJson.error.message + "\n"; // Lưu thông điệp lỗi vào kết quả đầu ra
            }
            else // Không có lỗi, quá trình parse thành công
                if (oJson.choices && oJson.choices[0].message.content) {
                    // s lưu kết quả dưới dạng văn bản thô 
                    var s = oJson.choices[0].message.content

                    // Nếu kết quả văn bản là rỗng, thông báo "no response"
                    if (s == "")
                        s = "No response";

                    // Truyền kết quả văn bản vào stream đầu ra
                    txtOutput += "Chat GPT: " + s + '\n';

                    // Format ký tự xuống dòng html
                    s = s.replace(/\n/g, "<br>");
                    let gpt_data = '';
                    gpt_data += `
                    <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                        <img src = "images/openai.jpg" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
                        <div class="d-flex gap-2 w-100 justify-content-start">
                            <div style="text-align: left;">
                             <span class="mb-0 opacity-75"> ${s} </span>
                            </div>
                        </div>
                    </a>
                    `;
                    $("#list-group").append(gpt_data);

                    // Lưu kết quả vào lịch sử
                    conversation_history[conversation_history.length] = { "role": "assistant", "content": s };
                    // Nói
                    TextToSpeech(s);
                }
        }
    };
    

    // Chuy?n data th�nh d?ng v?n b?n v� g?i y�u c?u ?i
    oHttp.send(JSON.stringify(data));

    // N?u stream xu?t c� d? li?u, th�m k� t? xu?ng d�ng v�o stream
    if (txtOutput != "")
        txtOutput += "\n"



    // D?n d?p prompt ??u v�o
    $("#chat-input").val() = "";
}






// Ph??ng th?c chuy?n ??i th�ng ?i?p v?n b?n th�nh gi?ng n�i
function TextToSpeech(s) {
    // N?u kh�ng c� h? tr? gi?ng n�i, tho�t.
    if (text_to_speech_is_supported == false)
        return;

    // N?u �m thanh ??u ra b? t?t, tho�t.
    if (chkMute.checked) return;

    // T?o ??i t??ng c?a Web Speech API ?? ti?n h�nh g?i & nh?n y�u c?u chuy?n ??i gi?ng n�i <---> v?n b?n  
    speech_utterance = new SpeechSynthesisUtterance();

    // ??i t??ng voice_input l?u tr? �m thanh ??u v�o (???c ng??i d�ng nh?p t? microphone)
    if (voice_input) {
        // N?u c� �m thanh ??u v�o ???c l?u b?i ??i t??ng selVoice, l?u �m thanh v�o bi?n sVoice
        var sVoice = selVoices.value;
        if (sVoice != "") // N?u c� �m thanh, l?y gi?ng t??ng ?ng ?? truy?n v�o bi?n ph?n h?i
        {
            speech_utterance.voice = voice_input[parseInt(sVoice)];
        }
    }


    // ??nh ngh?a h�nh ??ng s? th?c thi khi m�y ?� n�i xong
    speech_utterance.onend = function () {
        // N?u c� �m thanh ??u v�o t? ng??i d�ng, b?t ??u thu �m
        if (speech_recognizer && chkSpeak.checked) {
            speech_recognizer.start();
        }
    }

    // N?u m�y ?ang n�i m� mic ?ang m?
    if (speech_recognizer && chkSpeak.checked) {
        // Kh�ng thu �m
        speech_recognizer.stop();
    }

    // ??nh d?ng ng�n ng? ??u ra c?a m�y
    speech_utterance.lang = selLang.value;

    // ??nh d?ng n?i dung m� m�y s? ph�t
    speech_utterance.text = s;

    // M�y ti?n h�nh n�i
    window.speechSynthesis.speak(speech_utterance);
}


// N�t t?t �m
function Mute(b) {
    if (b) {
        selVoices.style.display = "none";
    }
    else {
        selVoices.style.display = "";
    }
}


// H�m chuy?n  �m thanh ??u v�o th�nh v?n b?n
function SpeechToText() {
    // N?u tr�nh nh?n d?ng gi?ng n�i ?ang ???c b?t
    if (speech_recognizer) {
        // Ghi �m n?u n�t microphone ?ang b?t, v� ng?ng ghi �m n?u n�t ???c t?t ?i
        if (chkSpeak.checked) {
            speech_recognizer.start();
        }
        else {
            speech_recognizer.stop();
        }
        return;
    }


    // Kh?i t?o m?t ??i t??ng thu?c v? API nh?n d?ng gi?ng n�i c?a tr�nh duy?t 
    speech_recognizer = new webkitSpeechRecognition();
    speech_recognizer.continuous = true; // Nh?n d?ng cho ??n khi d?ng th� th�i
    speech_recognizer.interimResults = true; // Nh?n d?ng ngay khi ng??i d�ng ?ang n�i
    speech_recognizer.lang = selLang.value; // Ng�n ng? ??u v�o
    speech_recognizer.start(); // B?t ??u nh?n d?ng


    // ??nh ngh?a h�nh vi khi sinh ra k?t qu?
    speech_recognizer.onresult = function (event) {
        var interimTranscripts = ""; // Bi?n t?m l?u v?n b?n ??u ra
        for (var i = event.resultIndex; i < event.results.length; i++) // Duy?t t? ??u ??n cu?i c?a m?ng k?t qu?
        {
            var transcript = event.results[i][0].transcript; // L?y k?t qu? t?i ?u nh?t

            if (event.results[i].isFinal) // N?u ?� duy?t h?t
            {
                // Truy?n to�n b? k?t qu? nh?n di?n v�o chat-input
                $("#chat-input").val(transcript);
                // Truy?n th�ng ?i?p v�o y�u c?u ?? g?i l�n API c?a OpenAI
                Send();
            }
            else // Ch?a duy?t h?t
            {
                // ??nh d?ng xu?ng d�ng ?? hi?n th? xu?ng d�ng trong html
                transcript.replace("\n", "<br>");
                // Ch?ng k?t qu? l�n nhau 
                interimTranscripts += transcript;
            }


            // K?t qu? t?m th?i c?a th�ng ?i?p thu �m ???c nh?n d?ng
            var oDiv = document.getElementById("idText");
            oDiv.innerHTML = '<span style="color: #999;">' + interimTranscripts + '</span>';
        }
    };

    // N?u c� l?i x?y ra, kh�ng l�m g� c?
    speech_recognizer.onerror = function (event) {

    };
}