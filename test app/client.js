import { Client } from './module/LiteSocketClient.js';
import { clientPackages, serverPackages } from './packageSpecs.js';

const chatBox = document.getElementById('chatBox'),
    messageHistory = document.getElementById('messageHistory'),

client = new Client({
    url: 'ws://localhost:8080/',
    serverPackages,
    clientPackages
});

client.on('open', event => {
    newMessage(['#8888ff', 'connected to the server']);
    client.send('ping');
});

client.on('pong', () => {
    client.send('ping');
});

client.on('message', message => {
    newMessage([message.nameColor, message.name], ['#ffffff', ': ' + message.content]);
});

client.on('teamMessage', message => {
    newMessage(['#ffffff', '[team] '], [message.nameColor, message.name], ['#ffffff', ': ' + message.content]);
});

client.on('close', event => {
    newMessage(['#8888ff', 'disconnected from the server']);
});

function newMessage(...messageData) {
    let message = document.createElement('p');
    for (let [color, text] of messageData) {
        let segment = document.createElement('span');
        segment.style.color = color;
        segment.textContent = text;
        message.append(segment);
    }
    messageHistory.append(message);
    return message;
}

chatBox.addEventListener('keydown', event => {
    if (!['Enter', 'Escape'].includes(event.key) || !chatBox.value) {
        return;
    }
    if (event.key === 'Enter') {
        if (chatBox.value.startsWith('/team ')) {
            client.send('sendTeamMessage', chatBox.value.slice(6));
        } else {
            client.send('sendMessage', chatBox.value);
        }
    }
    chatBox.value = "";
});