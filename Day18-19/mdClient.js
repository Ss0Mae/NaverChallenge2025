const BaseClient = require('./BaseClient');

class MdClient extends BaseClient {
    constructor(port) {
        super(port);
        this.setupCommands();
    }

    setupCommands() {
        this.registerCommand('auth', (args) => ({
            type: 'auth',
            payload: { token: args[0] },
        }));

        this.registerCommand('add', (args) => {
            const stock = parseInt(args.pop(), 10);
            const name = args.join(' ').replace(/^"|"$/g, ''); // 따옴표 제거
            return { type: 'add', payload: { name, stock } };
        });

        this.registerCommand('broadcast', (args) => ({
            type: 'broadcast',
            payload: { text: args.join(' ') },
        }));

        this.registerCommand('logout', () => ({ type: 'logout', payload: {} }));
    }

    onConnect() {
        if (process.env.NODE_ENV !== 'test') {
            console.log('명령어를 입력하세요 (예: auth <token>)');
        }
    }

    onMessage(message) {
        const { status, type, payload } = message;
        let output = '< ';
        if (type === 'auth_ok') {
            output += 'MD auth success';
        } else if (type === 'add_ok') {
            output += payload.message;
        } else if (type === 'broadcast_ok') {
            output += `broadcast "${payload.message}"`;
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
    const mdClient = new MdClient(2025);
    mdClient.connect();
}

module.exports = MdClient;