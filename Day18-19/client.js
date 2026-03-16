const BaseClient = require('./BaseClient');
const dgram = require('dgram');

const BROADCAST_PORT = 41234;

class CustomerClient extends BaseClient {
    constructor(port) {
        super(port);
        this.udpClient = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.setupUDP();
        this.setupCommands();
    }

    setupCommands() {
        this.registerCommand('login', (args) => ({
            type: 'login',
            payload: { campId: args[0] },
        }));

        this.registerCommand('logout', () => ({ type: 'logout', payload: {} }));

        this.registerCommand('catalog', () => ({ type: 'catalog', payload: {} }));

        this.registerCommand('buy', (args) => ({
            type: 'buy',
            payload: { productId: args[0], quantity: parseInt(args[1], 10) },
        }));

        this.registerCommand('snapchat', (args) => {
            const maxCountArg = args[0] ? args[0].split('=')[1] : '0';
            return {
                type: 'snapchat',
                payload: { maxCount: parseInt(maxCountArg, 10) },
            };
        });

        this.registerCommand('finish', () => ({ type: 'finish', payload: {} }));

        this.registerCommand('message', (args) => ({
            type: 'message',
            payload: { text: args.join(' ') },
        }));
    }

    setupUDP() {
        this.udpClient.on('listening', () => {
            const address = this.udpClient.address();
            if (process.env.NODE_ENV !== 'test') {
                console.log(`UDP 클라이언트가 ${address.address}:${address.port}에서 수신 대기 중...`);
            }
        });

        this.udpClient.on('message', (msg, rinfo) => {
            try {
                const message = JSON.parse(msg.toString());
                if (message.type === 'broadcast') {
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`
< 📢 브로드캐스트 메시지 수신: ${message.payload.message}`);
                    }
                }
            } catch (e) {
                if (process.env.NODE_ENV !== 'test') {
                    console.error('UDP 메시지 파싱 오류:', e);
                }
            }
        });

        this.udpClient.bind(BROADCAST_PORT);
    }

    onConnect() {
        if (process.env.NODE_ENV !== 'test') {
            console.log('명령어를 입력하세요 (예: login S001):');
        }
    }

    onMessage(message) {
        const { status, type, payload } = message;
        let output = '< ';
        if (type === 'login_ok') {
            output += `login success to group#${payload.groupId}`;
        } else if (type === 'catalog_ok') {
            output += 'items are ';
            output += payload.products.map(p => `${p.id}, ${p.name}, ${p.stock}`).join('\n');
        } else if (type === 'buy_ok') {
            output += `${payload.message}`;
        } else if (type === 'buy_fail') {
            output += `${payload.message}`;
        } else if (type === 'chat_message') {
            output += `message from ${payload.from}, "${payload.message}"`;
        } else if (type === 'logout_ok') {
            output += 'logout (disconnected)';
        } else if (status === 'error') {
            output += `Error: ${payload.message}`;
        } else {
            output += JSON.stringify(message);
        }
        if (process.env.NODE_ENV !== 'test') {
            console.log(output);
        }
    }
}

if (require.main === module) {
    const client = new CustomerClient(2025);
    client.connect();
}

module.exports = CustomerClient;
