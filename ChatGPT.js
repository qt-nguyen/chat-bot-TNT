var OPENAI_API_KEY = "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";
var text_to_speech_is_supported = false;
var speech_is_in_progress = false;
var speech_recognizer = null
var speech_utterance = null;
var voice_input = null;

// ???c g?i ngay khi trang web ???c t?i 
function OnLoad() {
    // Ki?m tra tr�nh duy?t c� h? tr? nh?n d?ng gi?ng n�i kh�ng
    if ("webkitSpeechRecognition" in window) {
    }
    else {
        //speech to text not supported
        lblSpeak.style.display = "none";
    }

    // Ki?m tra tr�nh duy?t c� h? tr? chuy?n ??i v?n b?n th�nh gi?ng n�i kh�ng
    if ('speechSynthesis' in window) {
        text_to_speech_is_supported = true;
        speechSynthesis.onvoiceschanged = function () {
            // Thay ??i gi?ng n�i theo t�y ch?nh c?a ng??i d�ng
            voice_input = window.speechSynthesis.getVoices();
            for (var i = 0; i < voice_input.length; i++) {
                selVoices[selVoices.length] = new Option(voice_input[i].name, i);
            }
        };
    }
}

// Thay ??i ng�n ng? c?a �m thanh ??u v�o
function ChangeLang(o) {
    if (speech_recognizer) {
        speech_recognizer.lang = selLang.value;
        //SpeechToText()
    }
}


// Bi?n l?u l?ch s? ?? truy?n ti?p
const conversation_history = []


// H�m Send l� back-end
function Send() {
    // str_input: input text ??n thu?n
    // chat-input: ??i t??ng input
    var str_input = $("#chat-input").val();


    if (str_input == "") { // B�o l?i v� tho�t kh?i ch??ng tr�nh n?u prompt r?ng
        alert("Type in your question!");
        chat-input.focus(); // ??t con tr? so?n th?o v�o h?p nh?p
        return;
    }


    $("#chat-input").val('');

    let html_data = '';
    html_data += `
            <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                 <div class="d-flex gap-2 w-100 justify-content-end">
                     <div>
                         <p class="mb-1 opacity-70">${str_input}</p>
                     </div>
                     <img src="../images/Logo_HCMUS.png" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
                 </div>
              </a>
            `;
    //Clear the  input box 
    $("#chat-input").val('');
    //Append prompt text to history
    $("#list-group").append(html_data);

    // G?i y�u c?u d? li?u ??n m�y ch?
    var oHttp = new XMLHttpRequest();

    oHttp.open("POST", "https://api.openai.com/v1/chat/completions"); // M�y ch? ?? g?i y�u c?u POST

    // Header c?a y�u c?u
    oHttp.setRequestHeader("Accept", "application/json"); // Y�u c?u ??u v�o ch? ch?p nh?n m�i tr??ng javascrpt
    oHttp.setRequestHeader("Content-Type", "application/json"); // K?t qu? ??u v�o tu�n theo  c� ph�p javascript
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY) // X�c th?c truy c?p, s? d?ng API c?a OpenAI

    conversation_history[conversation_history.length] = { "role": "user", "content": str_input };
    // D? li?u trong y�u c?u ???c g?i l�n m�y ch?
    var data = {
        "model": "gpt-3.5-turbo", // Model GPT-3.5-turbo, model hi?n h�nh c?a ChatGPT
        "messages": conversation_history, // Th�ng ?i?p ?? g?i API ph?n h?i
    }

    // Truy?n th�ng ?i?p c?a ng??i d�ng v�o stream xu?t
    txtOutput = '';
    txtOutput += "User: " + str_input + "\n"



    // ??nh ngh?a h�nh vi x?y ra n?u tr?ng th�i c?a bi?n oHttp thay ??i (??ng ngh?a v?i vi?c ?� nh?n d? li?u t? m�y ch?)
    // (ch?a bi?t l� d? li?u ?�ng hay kh�ng)

    // Th?c thi kh?i l?nh sau khi tr?ng th�i oHttp thay ??i:
    oHttp.onreadystatechange = function () {

        // XMLHttpRequest.readyState cho bi?t tr?ng th�i  y�u c?u ?� g?i t? m�y kh�ch.
        // Gi� tr? 0 (ch?a ti?n h�nh) -> 4 (?� ho�n th�nh) bi?u th? m?c ?? ho�n th�nh c?a y�u c?u. 
        if (oHttp.readyState === 4) {
            var oJson = {} // oJson l?u d? li?u ???c m�y ch? g?i v?

            // N?u stream output r?ng, th�m k� t? xu?ng d�ng v�o stream.
            if (txtOutput != "") txtOutput += "\n";

            // Test d�ng l?nh sau v� tr? v? th�ng b�o l?i (n?u c�)
            try {
                // L?u oHttp.responseText (d? li?u ???c m�y ch? tr? v?) v�o bi?n oJson
                oJson = JSON.parse(oHttp.responseText);
            }
            catch (ex) // N?u qu� tr�nh parse kh�ng th�nh c�ng: 
            {
                // Bi?n ex t?m th?i l?u th�ng b�o l?i
                txtOutput += "Error: " + ex.message + "\n" // L?u th�ng b�o l?i v�o stream output.
            }

            if (oJson.error && oJson.error.message) // N?u c� l?i x?y ra
            {
                txtOutput += "Error: " + oJson.error.message + "\n"; // L?u th�ng ?i?p l?i v�o k?t qu? ??u ra
            }
            else  // Kh�ng c� l?i, qu� tr�nh parse th�nh c�ng
                if (oJson.choices && oJson.choices[0].message.content) {
                    // s l?u k?t qu? d??i d?ng v?n b?n th� 
                    var s = oJson.choices[0].message.content

                    // N?u k?t qu? v?n b?n l� r?ng, th�ng b�o
                    if (s == "")
                        s = "No responses";

                    // Truy?n k?t qu? v?n b?n v�o stream ??u ra
                    txtOutput += "Chat GPT: " + s + '\n';
                    s = s.replace(/\n/g, "<br>");
                    while ( s.includes("```")) {
                         // Wrap code block in <pre> tags 
                        s = s.replace("```", "<pre>", 1);
                        s = s.replace("```", "</pre>", 1);
                    }
                    let gpt_data = '';
                    gpt_data += `
                    <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                        <img src = "../images/openai.jpg" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">        
                        <div class="d-flex gap-2 w-100 justify-content-start">
                            <div style="text-align: left;">
                             <span class="mb-1 opacity-80"> ${s} </span>
                            </div>
                        </div>
                    </a>
                    `;
                    $("#list-group").append(gpt_data);

                    // L?u k?t qu? v�o l?ch s?
                    conversation_history[conversation_history.length] = { "role": "assistant", "content": s };
                    // N�i
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