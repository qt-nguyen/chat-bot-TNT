var OPENAI_API_KEY = "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";
var text_to_speech_is_supported = false;
var speech_is_in_progress = false;
var speech_recognizer = null
var speech_utterance = null;
var voice_input = null;

// ???c g?i ngay khi trang web ???c t?i 
function OnLoad() {
    // Ki?m tra trình duy?t có h? tr? nh?n d?ng gi?ng nói không
    if ("webkitSpeechRecognition" in window) {
    }
    else {
        //speech to text not supported
        lblSpeak.style.display = "none";
    }

    // Ki?m tra trình duy?t có h? tr? chuy?n ??i v?n b?n thành gi?ng nói không
    if ('speechSynthesis' in window) {
        text_to_speech_is_supported = true;
        speechSynthesis.onvoiceschanged = function () {
            // Thay ??i gi?ng nói theo tùy ch?nh c?a ng??i dùng
            voice_input = window.speechSynthesis.getVoices();
            for (var i = 0; i < voice_input.length; i++) {
                selVoices[selVoices.length] = new Option(voice_input[i].name, i);
            }
        };
    }
}

// Thay ??i ngôn ng? c?a âm thanh ??u vào
function ChangeLang(o) {
    if (speech_recognizer) {
        speech_recognizer.lang = selLang.value;
        //SpeechToText()
    }
}


// Bi?n l?u l?ch s? ?? truy?n ti?p
const conversation_history = []


// Hàm Send là back-end
function Send() {
    // str_input: input text ??n thu?n
    // chat-input: ??i t??ng input
    var str_input = $("#chat-input").val();


    if (str_input == "") { // Báo l?i và thoát kh?i ch??ng trình n?u prompt r?ng
        alert("Type in your question!");
        chat-input.focus(); // ??t con tr? so?n th?o vào h?p nh?p
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
                     <img src="images/Logo_HCMUS.png" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
                 </div>
              </a>
            `;
    //Clear the  input box 
    $("#chat-input").val('');
    //Append prompt text to history
    $("#list-group").append(html_data);

    // G?i yêu c?u d? li?u ??n máy ch?
    var oHttp = new XMLHttpRequest();

    oHttp.open("POST", "https://api.openai.com/v1/chat/completions"); // Máy ch? ?? g?i yêu c?u POST

    // Header c?a yêu c?u
    oHttp.setRequestHeader("Accept", "application/json"); // Yêu c?u ??u vào ch? ch?p nh?n môi tr??ng javascrpt
    oHttp.setRequestHeader("Content-Type", "application/json"); // K?t qu? ??u vào tuân theo  cú pháp javascript
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY) // Xác th?c truy c?p, s? d?ng API c?a OpenAI

    conversation_history[conversation_history.length] = { "role": "user", "content": str_input };
    // D? li?u trong yêu c?u ???c g?i lên máy ch?
    var data = {
        "model": "gpt-3.5-turbo", // Model GPT-3.5-turbo, model hi?n hành c?a ChatGPT
        "messages": conversation_history, // Thông ?i?p ?? g?i API ph?n h?i
    }

    // Truy?n thông ?i?p c?a ng??i dùng vào stream xu?t
    txtOutput = '';
    txtOutput += "User: " + str_input + "\n"



    // ??nh ngh?a hành vi x?y ra n?u tr?ng thái c?a bi?n oHttp thay ??i (??ng ngh?a v?i vi?c ?ã nh?n d? li?u t? máy ch?)
    // (ch?a bi?t là d? li?u ?úng hay không)

    // Th?c thi kh?i l?nh sau khi tr?ng thái oHttp thay ??i:
    oHttp.onreadystatechange = function () {

        // XMLHttpRequest.readyState cho bi?t tr?ng thái  yêu c?u ?ã g?i t? máy khách.
        // Giá tr? 0 (ch?a ti?n hành) -> 4 (?ã hoàn thành) bi?u th? m?c ?? hoàn thành c?a yêu c?u. 
        if (oHttp.readyState === 4) {
            var oJson = {} // oJson l?u d? li?u ???c máy ch? g?i v?

            // N?u stream output r?ng, thêm ký t? xu?ng dòng vào stream.
            if (txtOutput != "") txtOutput += "\n";

            // Test dòng l?nh sau và tr? v? thông báo l?i (n?u có)
            try {
                // L?u oHttp.responseText (d? li?u ???c máy ch? tr? v?) vào bi?n oJson
                oJson = JSON.parse(oHttp.responseText);
            }
            catch (ex) // N?u quá trình parse không thành công: 
            {
                // Bi?n ex t?m th?i l?u thông báo l?i
                txtOutput += "Error: " + ex.message + "\n" // L?u thông báo l?i vào stream output.
            }

            if (oJson.error && oJson.error.message) // N?u có l?i x?y ra
            {
                txtOutput += "Error: " + oJson.error.message + "\n"; // L?u thông ?i?p l?i vào k?t qu? ??u ra
            }
            else  // Không có l?i, quá trình parse thành công
                if (oJson.choices && oJson.choices[0].message.content) {
                    // s l?u k?t qu? d??i d?ng v?n b?n thô 
                    var s = oJson.choices[0].message.content

                    // N?u k?t qu? v?n b?n là r?ng, thông báo
                    if (s == "")
                        s = "No response";

                    // Truy?n k?t qu? v?n b?n vào stream ??u ra
                    txtOutput += "Chat GPT: " + s + '\n';
                    s.replace("\n", "<br>");
                    let gpt_data = '';
                    gpt_data += `
                    <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                        <img src = "images/openai.jpg" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
                        <div class="d-flex gap-2 w-100 justify-content-start">
                            <div>
                             <p class="mb-0 opacity-75"> ${s} </p>
                            </div>
                        </div>
                    </a>
                    `;
                    $("#list-group").append(gpt_data);

                    // L?u k?t qu? vào l?ch s?
                    conversation_history[conversation_history.length] = { "role": "assistant", "content": s };
                    // Nói
                    TextToSpeech(s);
                }
        }
    };
    

    // Chuy?n data thành d?ng v?n b?n và g?i yêu c?u ?i
    oHttp.send(JSON.stringify(data));

    // N?u stream xu?t có d? li?u, thêm ký t? xu?ng dòng vào stream
    if (txtOutput != "")
        txtOutput += "\n"



    // D?n d?p prompt ??u vào
    $("#chat-input").val() = "";
}






// Ph??ng th?c chuy?n ??i thông ?i?p v?n b?n thành gi?ng nói
function TextToSpeech(s) {
    // N?u không có h? tr? gi?ng nói, thoát.
    if (text_to_speech_is_supported == false)
        return;

    // N?u âm thanh ??u ra b? t?t, thoát.
    if (chkMute.checked) return;

    // T?o ??i t??ng c?a Web Speech API ?? ti?n hành g?i & nh?n yêu c?u chuy?n ??i gi?ng nói <---> v?n b?n  
    speech_utterance = new SpeechSynthesisUtterance();

    // ??i t??ng voice_input l?u tr? âm thanh ??u vào (???c ng??i dùng nh?p t? microphone)
    if (voice_input) {
        // N?u có âm thanh ??u vào ???c l?u b?i ??i t??ng selVoice, l?u âm thanh vào bi?n sVoice
        var sVoice = selVoices.value;
        if (sVoice != "") // N?u có âm thanh, l?y gi?ng t??ng ?ng ?? truy?n vào bi?n ph?n h?i
        {
            speech_utterance.voice = voice_input[parseInt(sVoice)];
        }
    }


    // ??nh ngh?a hành ??ng s? th?c thi khi máy ?ã nói xong
    speech_utterance.onend = function () {
        // N?u có âm thanh ??u vào t? ng??i dùng, b?t ??u thu âm
        if (speech_recognizer && chkSpeak.checked) {
            speech_recognizer.start();
        }
    }

    // N?u máy ?ang nói mà mic ?ang m?
    if (speech_recognizer && chkSpeak.checked) {
        // Không thu âm
        speech_recognizer.stop();
    }

    // ??nh d?ng ngôn ng? ??u ra c?a máy
    speech_utterance.lang = selLang.value;

    // ??nh d?ng n?i dung mà máy s? phát
    speech_utterance.text = s;

    // Máy ti?n hành nói
    window.speechSynthesis.speak(speech_utterance);
}


// Nút t?t âm
function Mute(b) {
    if (b) {
        selVoices.style.display = "none";
    }
    else {
        selVoices.style.display = "";
    }
}


// Hàm chuy?n  âm thanh ??u vào thành v?n b?n
function SpeechToText() {
    // N?u trình nh?n d?ng gi?ng nói ?ang ???c b?t
    if (speech_recognizer) {
        // Ghi âm n?u nút microphone ?ang b?t, và ng?ng ghi âm n?u nút ???c t?t ?i
        if (chkSpeak.checked) {
            speech_recognizer.start();
        }
        else {
            speech_recognizer.stop();
        }
        return;
    }


    // Kh?i t?o m?t ??i t??ng thu?c v? API nh?n d?ng gi?ng nói c?a trình duy?t 
    speech_recognizer = new webkitSpeechRecognition();
    speech_recognizer.continuous = true; // Nh?n d?ng cho ??n khi d?ng thì thôi
    speech_recognizer.interimResults = true; // Nh?n d?ng ngay khi ng??i dùng ?ang nói
    speech_recognizer.lang = selLang.value; // Ngôn ng? ??u vào
    speech_recognizer.start(); // B?t ??u nh?n d?ng


    // ??nh ngh?a hành vi khi sinh ra k?t qu?
    speech_recognizer.onresult = function (event) {
        var interimTranscripts = ""; // Bi?n t?m l?u v?n b?n ??u ra
        for (var i = event.resultIndex; i < event.results.length; i++) // Duy?t t? ??u ??n cu?i c?a m?ng k?t qu?
        {
            var transcript = event.results[i][0].transcript; // L?y k?t qu? t?i ?u nh?t

            if (event.results[i].isFinal) // N?u ?ã duy?t h?t
            {
                // Truy?n toàn b? k?t qu? nh?n di?n vào chat-input
                $("#chat-input").val(transcript);
                // Truy?n thông ?i?p vào yêu c?u ?? g?i lên API c?a OpenAI
                Send();
            }
            else // Ch?a duy?t h?t
            {
                // ??nh d?ng xu?ng dòng ?? hi?n th? xu?ng dòng trong html
                transcript.replace("\n", "<br>");
                // Ch?ng k?t qu? lên nhau 
                interimTranscripts += transcript;
            }


            // K?t qu? t?m th?i c?a thông ?i?p thu âm ???c nh?n d?ng
            var oDiv = document.getElementById("idText");
            oDiv.innerHTML = '<span style="color: #999;">' + interimTranscripts + '</span>';
        }
    };

    // N?u có l?i x?y ra, không làm gì c?
    speech_recognizer.onerror = function (event) {

    };
}