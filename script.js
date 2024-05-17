const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send');
const fileUpload = document.getElementById('file-upload');
const fileUploadIcon = document.getElementById('file-upload-icon');
const newChatButton = document.getElementById('new-chat');

let chatHistory = [];
let conversationId = generateRandomId();

chatSendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});
fileUpload.addEventListener('change', handleFileUpload);
fileUploadIcon.addEventListener('click', () => fileUpload.click());
newChatButton.addEventListener('click', newChat);

function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (userMessage) {
    addMessage('user', userMessage);
    chatInput.value = '';
    getBotResponse(userMessage);
  }
}

function addMessage(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', sender);
  messageElement.innerHTML = `<div class="chat-message-text">${message}</div>`;
  chatMessages.appendChild(messageElement);

  chatHistory.push({ sender, message });

  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 0);
}

function getBotResponse(userMessage) {
  fetch('https://api.coze.com/open_api/v2/chat', {
    method: 'POST',
    headers: {
      'Authorization': 'Add your API key here',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Host': 'api.coze.com',
      'Connection': 'keep-alive'
    },
    body: JSON.stringify({
      "conversation_id": conversationId,
      "bot_id": "add id bot here",
      "user": "29032201862555",
      "query": userMessage,
      "stream": false,
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.msg === 'success' && data.code === 0) {
        data.messages.forEach(message => {
          if (message.type === 'answer') {
            addMessage('bot', message.content);
          }
        });
      } else {
        console.error('Error:', data);
        addMessage('bot', "Lỗi kết nối. Vui lòng thử lại.");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      addMessage('bot', "Lỗi kết nối. Vui lòng thử lại.");
    });
}

function newChat() {
  chatHistory = [];
  conversationId = generateRandomId();
  chatMessages.innerHTML = `
    <div class="chat-message bot">
      <div class="chat-message-text">Hello! I'm your chatbot </div>
    </div>`;
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 9);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    let textContent = '';

    if (file.type === 'application/pdf') {
      textContent = await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      textContent = await extractTextFromImage(file);
    }

    if (textContent) {
      addMessage('user', `File uploaded: ${file.name}`);
      getBotResponse(textContent);
    } else {
      addMessage('bot', "Oops! Unable to extract text from the uploaded file.");
    }

    fileUpload.value = '';
  }
}

async function extractTextFromImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        try {
          const text = OCRAD(canvas);
          resolve(text);
        } catch (error) {
          console.error('Error extracting text from image:', error);
          reject('');
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

async function extractTextFromPDF(file) {
  try {
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let textContent = '';

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContentPage = await page.getTextContent();
      textContentPage.items.forEach((item) => {
        textContent += item.str + ' ';
      });
    }

    return textContent.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}
