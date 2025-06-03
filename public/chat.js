const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const fileForm = document.getElementById('fileForm');
const fileInput = document.getElementById('fileInput');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', { type: 'text', message: input.value });
        input.value = '';
    }
});

socket.on('chat message', function(msg) {
    const item = document.createElement('div');
    if (msg.type === 'text') {
        item.textContent = msg.name + ': ' + msg.message;
    } else if (msg.type === 'file') {
        const link = document.createElement('a');
        link.href = msg.url;
        link.textContent = msg.name + ' shared a file: ' + msg.filename;
        link.target = '_blank';
        item.appendChild(link);
    }
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

fileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            socket.emit('chat message', {
                type: 'file',
                url: data.url,
                filename: file.name,
                name: data.name
            });
            fileInput.value = '';
        } else {
            alert('File upload failed');
        }
    })
    .catch(() => alert('File upload failed'));
});
