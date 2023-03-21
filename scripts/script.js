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
                         <p class="mb-1 opacity-70">${str_input}</p>
                     </div>
                     <img src="../images/Seal.png" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">
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

    // Header của yêu cầu
    oHttp.setRequestHeader("Accept", "application/json"); // Yêu cầu đầu vào cho chấpp nhận môi trường javascrpt
    oHttp.setRequestHeader("Content-Type", "application/json"); // Kết quả đầu vào tuân theo  cú phápp javascript
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY) // Xác thực truy cập, sử dụng API của OpenAI

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
                        s = "No responses";

                    // Truyền kết quả văn bản vào stream đầu ra
                    txtOutput += "Chat GPT: " + s + '\n';

                    var tmp = s

                    // Format ký tự xuống dòng html
                    tmp = tmp.replace(/\n/g, "<br>");
                    while ( tmp.includes("```")) {
                        // Wrap code block in <pre> tags 
                        tmp = tmp.replace("```", "<pre>", 1);
                        tmp = tmp.replace("```", "</pre>", 1);
                    }
                    let gpt_data = '';
                    gpt_data += `
                    <a href = "#" class="list-group-item list-group-item-action d-flex gap-3 py-3">
                        <img src = "../images/openai.jpg" alt = "twbs" width = "32" height = "32" class="rounded-circle flex-shrink-0">        
                        <div class="d-flex gap-2 w-100 justify-content-start">
                            <div style="text-align: left;">
                             <span class="mb-1 opacity-90"> ${tmp} </span>
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
    

    // Chuyển data thành dạng văn bản và gửi yêu cầu đi
    oHttp.send(JSON.stringify(data));

    // Nếu stream xuất có dữ liệu, thêm ký tự xuống dòng vào stream
    if (txtOutput != "")
        txtOutput += "\n"



    // Dọn dẹp prompt đầu vào
    $("#chat-input").val() = "";
}





// Phương thức chuyển đổi thông điệp văn bản thành giọng nói
function TextToSpeech(s) {
    // Nếu không có hỗ trợ giọng nói, thoát.
    if (text_to_speech_is_supported == false) 
        return;
    
    // Nếu âm thanh đầu ra bị tắt, thoát.
    if (chkMute.checked) return;

    // Tạo đối tượng của Web Speech API để tiến hành gửi & nhận yêu cầu chuyển đổi giọng nói <---> văn bản  
    speech_utterance = new SpeechSynthesisUtterance();

    // Đối tượng voice_input lưu trữ âm thanh đầu vào (được người dùng nhập từ microphone)
    if (voice_input) 
    { 
        // Nếu có âm thanh đầu vào được lưu bởi đối tượng selVoice, lưu âm thanh vào biến sVoice
        var sVoice = selVoices.value;  
        if (sVoice != "") // Nếu có âm thanh, lấy giọng tương ứng để truyền vào biến phản hồi
        {
            speech_utterance.voice = voice_input[parseInt(sVoice)];
        }        
    }    


    // Định nghĩa hành động sẽ thực thi khi máy đã nói xong
    speech_utterance.onend = function () {
        // Nếu có âm thanh đầu vào từ người dùng, bắt đầu thu âm
        if (speech_recognizer && chkSpeak.checked) {
            speech_recognizer.start();
        }
    }

    // Nếu máy đang nói mà mic đang mở
    if (speech_recognizer && chkSpeak.checked) {
        // Không thu âm
        speech_recognizer.stop();
    }

    // Định dạng ngôn ngữ đầu ra của máy
    speech_utterance.lang = selLang.value;

    // Định dạng nội dung mà máy sẽ phát
    speech_utterance.text = s;

    // Máy tiến hành nói
    window.speechSynthesis.speak(speech_utterance);
}


// Nút tắt âm
function Mute(b)
{
    if (b) 
    {
        selVoices.style.display = "none";
    } 
    else
    {
        selVoices.style.display = "";
    }
}


// Hàm chuyển  âm thanh đầu vào thành văn bản
function SpeechToText() {
    // Nếu trình nhận dạng giọng nói đang được bật
    if (speech_recognizer) {
        // Ghi âm nếu nút microphone đang bật, và ngừng ghi âm nếu nút được tắt đi
        if (chkSpeak.checked) 
        {
            speech_recognizer.start();
        } 
        else
        {
            speech_recognizer.stop();
        }
        return;
    }    


    // Khởi tạo một đối tượng thuộc về API nhận dạng giọng nói của trình duyệt 
    speech_recognizer = new webkitSpeechRecognition();
    speech_recognizer.continuous = true; // Nhận dạng cho đến khi dừng thì thôi
    speech_recognizer.interimResults = true; // Nhận dạng ngay khi người dùng đang nói
    speech_recognizer.lang = selLang.value; // Ngôn ngữ đầu vào
    speech_recognizer.start(); // Bắt đầu nhận dạng


    // Định nghĩa hành vi khi sinh ra kết quả
    speech_recognizer.onresult = function (event) {
        var interimTranscripts = ""; // Biến tạm lưu văn bản đầu ra
        for (var i = event.resultIndex; i < event.results.length; i++) // Duyệt từ đầu đến cuối của mảng kết quả
        {
            var transcript = event.results[i][0].transcript; // Lấy kết quả tối ưu nhất

            if (event.results[i].isFinal) // Nếu đã duyệt hết
            {
                // Truyền toàn bộ kết quả nhận diện vào txtMsg
                $("#chat-input").val(transcript);
                // Truyền thông điệp vào yêu cầu để gửi lên API của OpenAI
                Send();
            } 
            else // Chưa duyệt hết
            {
                // Định dạng xuống dòng để hiển thị xuống dòng trong html
                transcript.replace("\n", "<br>");
                // Chồng kết quả lên nhau 
                interimTranscripts += transcript;
            }


            // Kết quả tạm thời của thông điệp thu âm được nhận dạng
            var oDiv = document.getElementById("idText");
            oDiv.innerHTML = '<span style="color: #999;">' + interimTranscripts + '</span>';
        }
    };

    // Nếu có lỗi xảy ra, không làm gì cả
    speech_recognizer.onerror = function (event) {

    };
}