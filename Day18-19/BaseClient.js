const net = require('net');
const readline = require('readline');
const MessageParser = require('./parser.js');
const { formatRequest } = require('./Protocol.js');
const EventEmitter = require('events');

class BaseClient extends EventEmitter {
    constructor(port) {
        super();
        this.port = port;
        this.client = null;
        this.rl = null;
        this.parser = null;
        this.commands = new Map();
    }

    registerCommand(command, handler) {
        this.commands.set(command, handler);
    }

    connect() {
        this.client = net.createConnection({ port: this.port }, () => {
            if (process.env.NODE_ENV !== 'test') {
                console.log('✅ 서버에 연결되었습니다.');
            }
            this.onConnect();
            this.emit('connect');
        });

        this.parser = new MessageParser((message) => {
            this.onMessage(message);
            this.emit('message', message);
        });

        this.client.on('data', (data) => {
            this.parser.parse(data);
        });

        this.client.on('close', () => {
            if (process.env.NODE_ENV !== 'test') {
                console.log('❌ 서버와 연결이 끊어졌습니다.');
                process.exit();
            }
        });

        this.client.on('error', (err) => {
            if (process.env.NODE_ENV !== 'test') {
                console.error('TCP 소켓 오류:', err);
            }
            this.emit('error', err);
        });

        if (process.env.NODE_ENV !== 'test') {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            this.rl.on('line', this.handleUserInput.bind(this));
        }
    }

    onConnect() {
        // 각 클라이언트에서 구현
    }

    onMessage(message) {
        // 각 클라이언트에서 구현
    }

    handleUserInput(line) {
        const [command, ...args] = line.trim().split(' ');
        const handler = this.commands.get(command);

        if (handler) {
            const { type, payload } = handler(args);
            this.sendMessage(type, payload);
            if (process.env.NODE_ENV !== 'test') {
                console.log(`> ${line}`);
            }
        } else {
            if (process.env.NODE_ENV !== 'test') {
                console.log('알 수 없는 명령어입니다.');
            }
        }
    }

    sendMessage(type, payload) {
        const message = formatRequest(type, payload);
        this.client.write(message);
    }

    disconnect() {
        return new Promise((resolve) => {
            if (!this.client || this.client.destroyed) {
                return resolve();
            }
            this.client.once('close', () => {
                resolve();
            });
            this.client.end();
        });
    }
}

module.exports = BaseClient;