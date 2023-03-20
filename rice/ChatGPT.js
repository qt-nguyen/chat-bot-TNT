var OPENAI_API_KEY = "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";
var text_to_speech_is_supported = false;
var speech_is_in_progress = false;
var speech_recognizer = null
var speech_utterance = null;
var voice_input = null;


// Được gọi ngay khi trang web được tải 
function OnLoad() {
    // Kiểm tra trình duyệt có hỗ trợ nhận dạng giọng nói không
    if ("webkitSpeechRecognition" in window) 
    {
    } 
    else 
    {
        //speech to text not supported
        lblSpeak.style.display = "none";
    }

    // Kiểm tra trình duyệt có hỗ trợ chuyển đổi văn bản thành giọng nói không
    if ('speechSynthesis' in window) 
    {
        text_to_speech_is_supported = true;
        speechSynthesis.onvoiceschanged = function () {
            // Thay đổi giọng nói theo tùy chỉnh của người dùng
            voice_input = window.speechSynthesis.getVoices();
            for (var i = 0; i < voice_input.length; i++) 
            {
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


// Biến lưu lịch sử để truyền tiếp
const conversation_history = []


// Hàm Send là back-end
function Send() {
    // str_input: input text đơn thuần
    // txtMsg: đối tượng input
    var str_input = txtMsg.value; 
    if (str_input == "") { // Báo lỗi và thoát khỏi chương trình nếu prompt rỗng
        alert("Type in your question!");
        txtMsg.focus(); // Đặt con trỏ soạn thảo vào hộp nhập
        return;
    }

    // Gửi yêu cầu dữ liệu đến máy chủ
    var oHttp = new XMLHttpRequest(); 

    oHttp.open("POST", "https://api.openai.com/v1/chat/completions"); // Máy chủ để gửi yêu cầu POST

    // Header của yêu cầu
    oHttp.setRequestHeader("Accept", "application/json"); // Yêu cầu đầu vào chỉ chấp nhận môi trường javascrpt
    oHttp.setRequestHeader("Content-Type", "application/json"); // Kết quả đầu vào tuân theo  cú pháp javascript
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY) // Xác thực truy cập, sử dụng API của OpenAI

    conversation_history[conversation_history.length] = {"role": "user", "content": str_input};
    // Dữ liệu trong yêu cầu được gửi lên máy chủ
    var data = {
        "model": "gpt-3.5-turbo", // Model GPT-3.5-turbo, model hiện hành của ChatGPT
        "messages": conversation_history, // Thông điệp để gọi API phản hồi
    }

    // Truyền thông điệp của người dùng vào stream xuất 
    txtOutput.value += "Me: " + str_input + "<br>"



    // Định nghĩa hành vi xảy ra nếu trạng thái của biến oHttp thay đổi (đồng nghĩa với việc đã nhận dữ liệu từ máy chủ)
    // (chưa biết là dữ liệu đúng hay không)

    // Thực thi khối lệnh sau khi trạng thái oHttp thay đổi:
    oHttp.onreadystatechange = function () {
        
        // XMLHttpRequest.readyState cho biết trạng thái  yêu cầu đã gửi từ máy khách.
        // Giá trị 0 (chưa tiến hành) -> 4 (đã hoàn thành) biểu thị mức độ hoàn thành của yêu cầu. 
        if (oHttp.readyState === 4) {
            var oJson = {} // oJson lưu dữ liệu được máy chủ gửi về

            // Nếu stream output rỗng, thêm ký tự xuống dòng vào stream.
            if (txtOutput.value != "") txtOutput.value += "\n";

            // Test dòng lệnh sau và trả về thông báo lỗi (nếu có)
            try 
            {
                // Lưu oHttp.responseText (dữ liệu được máy chủ trả về) vào biến oJson
                oJson = JSON.parse(oHttp.responseText);
            } 
            catch (ex) // Nếu quá trình parse không thành công: 
            { 
                // Biến ex tạm thời lưu thông báo lỗi
                txtOutput.value += "Error: " + ex.message // Lưu thông báo lỗi vào stream output.
            }

            if (oJson.error && oJson.error.message) // Nếu có lỗi xảy ra
            { 
                txtOutput.value += "Error: " + oJson.error.message + "ERR2"; // Lưu thông điệp lỗi vào kết quả đầu ra
            } 
            else  // Không có lỗi, quá trình parse thành công
            if (oJson.choices && oJson.choices[0].message.content) 
            { 
                // s lưu kết quả dưới dạng văn bản thô 
                var s = oJson.choices[0].message.content 
                
                // Nếu kết quả văn bản là rỗng, thông báo
                if (s == "") 
                    s = "No response";

                // Truyền kết quả văn bản vào stream đầu ra
                txtOutput.value += "Chat GPT: " + s;
                
                // Lưu kết quả vào lịch sử
                conversation_history[conversation_history.length] = {"role": "assistant", "content": s};
                // Nói
                TextToSpeech(s);
            }            
        }
    };


    // Chuyển data thành dạng văn bản và gửi yêu cầu đi
    oHttp.send(JSON.stringify(data));

    // Nếu stream xuất có dữ liệu, thêm ký tự xuống dòng vào stream
    if (txtOutput.value != "") 
        txtOutput.value += "\n"

    
    
    // D?n d?p prompt ??u v�o
    txtMsg.value = ""; 
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
                txtMsg.value = transcript;
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