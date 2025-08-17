const speechKey = '5b2c3265067a4be38a1d14e046d341bf';
const speechRegion = 'eastasia';

// let isPlaying = false;
// let audio; // 用于存储播放的音频对象

let isPlaying = false; // 是否正在播放
let isPaused = false;  // 是否处于暂停状态
let audio;             // 用于存储播放的音频对象

// 获取按钮元素和文本/图标元素
const readAloudBtn = document.getElementById("read-aloud-button");
const stopAloudBtn = document.getElementById("stop-aloud-button");
const btnIcon = readAloudBtn ? readAloudBtn.querySelector("i") : null;
const btnText = readAloudBtn ? readAloudBtn.querySelector("span") : null;

function updateButton(status) {
    if (!btnIcon || !btnText) return;

    if (status === 'play') {
        btnIcon.className = "fas fa-pause";
        btnText.innerText = "暂停朗读";
    } else if (status === 'pause') {
        btnIcon.className = "fas fa-play";
        btnText.innerText = "继续朗读";
    } else if (status === 'stop') {
        btnIcon.className = "fas fa-play";
        btnText.innerText = "朗读文章";
    }
}

// 步骤二：定义朗读和停止逻辑
function speakText() {
  const textContent = document.querySelector(".post-content").innerText;

  // 步骤A：检查朗读内容是否为空。如果为空，则不进行朗读。
  if (!textContent || textContent.trim() === '') {
    console.error('朗读内容为空。');
    return;
  }

  // 步骤B：对内容进行转义，确保其在SSML中是有效的XML文本。
  const sanitizedText = textContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // 使用转义后的内容构建SSML。
  const ssml = `
    <speak version='1.0' xml:lang='zh-CN'>
        <voice xml:lang='zh-CN' xml:gender='Female' name='zh-CN-XiaoxiaoNeural'>
            ${sanitizedText}
        </voice>
    </speak>`;

  fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'blog-read-aloud'
    },
    body: ssml
  })
  .then(response => {
    if (response.ok) {
      return response.blob(); // 请求成功，获取音频数据
    }
    // 步骤C：如果请求失败，获取服务器返回的详细错误信息。
    return response.text().then(text => {
      console.error('API 请求失败，状态码：', response.status, '，详细信息：', text);
      throw new Error('API request failed');
    });
  })

    .then(blob => {
            // 播放音频。
            audio = new Audio(URL.createObjectURL(blob));
            audio.play();
            
            isPlaying = true;
            isPaused = false;
            updateButton('play');

            // 监听音频播放结束，重置按钮状态。
            audio.addEventListener('ended', () => {
                isPlaying = false;
                isPaused = false;
                updateButton('stop');
            });
        })
  .catch(error => {
    console.error('语音朗读出错:', error);
  });
}

function pauseSpeaking() {
    if (audio) {
        audio.pause();
        isPaused = true;
        updateButton('pause');
    }
}

function resumeSpeaking() {
    if (audio && isPaused) {
        audio.play();
        isPaused = false;
        updateButton('play');
    }
}

function stopSpeaking() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // 将播放进度归零
        audio = null;
        isPlaying = false;
        isPaused = false;
        updateButton('stop');
    }
}

// 步骤三：绑定按钮事件
document.addEventListener("DOMContentLoaded", function() {
    if (readAloudBtn) {
        readAloudBtn.addEventListener("click", function() {
            if (isPaused) {
                resumeSpeaking();
            } else if (isPlaying) {
                pauseSpeaking();
            } else {
                speakText();
            }
        });
    }

    // 为停止按钮绑定事件
    if (stopAloudBtn) {
        stopAloudBtn.addEventListener("click", function() {
            stopSpeaking();
        });
    }

    // 监听页面离开事件
    window.addEventListener('beforeunload', stopSpeaking);
});