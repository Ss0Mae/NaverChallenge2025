const net = require('net');
const MessageParser = require('./parser.js');
const SessionManager = require('./SessionManager.js');
const GroupManager = require('./GroupManager.js');
const ProductManager = require('./ProductManager.js');
const ChatManager = require('./ChatManager.js');
const { formatResponse } = require('./Protocol.js');

class Server {
    constructor() {
        this.sessionManager = new SessionManager();
        this.groupManager = new GroupManager();
        this.productManager = new ProductManager();
        this.chatManager = new ChatManager();
        this.mdSocket = null;
        this.MD_TOKEN = 'boostcamp_md_token';

        this.productManager.initProducts(); // 서버 시작 시 초기 상품 로드

        this.server = net.createServer((socket) => {
            const session = this.sessionManager.createSession(socket);
            const parser = new MessageParser((message) => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`📥 [세션 ${session.id}] 메시지 수신:`, message);
                }
                this.handleRequest(socket, message);
            });

            if (process.env.NODE_ENV !== 'test') {
                console.log('✅ 클라이언트 접속:', socket.remoteAddress, socket.remotePort, `(세션 ID: ${session.id})`);
            }

            socket.on('data', (data) => {
                parser.parse(data);
            });

            socket.on('close', () => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`❌ [세션 ${session.id}] 클라이언트 접속 종료`);
                }
                const loggedOutSession = this.sessionManager.logout(socket);
                if (loggedOutSession) {
                    this.groupManager.leaveGroup(loggedOutSession.groupId, loggedOutSession.campId);
                }
                this.sessionManager.removeSession(socket);
            });

            socket.on('error', (err) => {
                if (process.env.NODE_ENV !== 'test') {
                    console.error(`TCP 소켓 오류 (세션 ${session.id}):`, err);
                }
            });
        });

        this.udpServer = require('dgram').createSocket('udp4');
        this.BROADCAST_PORT = 41234;
    }

    sendResponse(socket, type, payload, status = 'success') {
        const response = formatResponse(type, payload, status);
        socket.write(response);
    }

    sendToGroup(groupId, message, fromCampId) {
        const members = this.groupManager.getGroupMembers(groupId);
        const sessions = Array.from(this.sessionManager.sessions.values());

        for (const memberCampId of members) {
            if (memberCampId !== fromCampId) {
                const targetSession = sessions.find((s) => s.isLoggedIn && s.campId === memberCampId);
                if (targetSession) {
                    this.sendResponse(targetSession.socket, 'chat_message', { from: fromCampId, message });
                }
            }
        }
    }

    broadcastMessage(message) {
        const messageString = JSON.stringify({ type: 'broadcast', payload: { message } });
        const buffer = Buffer.from(messageString);
        this.udpServer.send(buffer, this.BROADCAST_PORT, '127.0.0.1', (err) => {
            if (err && process.env.NODE_ENV !== 'test') console.error('UDP 메시지 전송 오류:', err);
            else if (process.env.NODE_ENV !== 'test') console.log('UDP 브로드캐스트 메시지 전송 완료');
        });
    }

    handleRequest(socket, message) {
        const { type, payload } = message;
        const session = this.sessionManager.getSession(socket);

        if (socket === this.mdSocket) {
            if (type === 'add') {
                const { name, stock } = payload;
                if (!name || !stock || stock <= 0) {
                    return this.sendResponse(socket, 'add_fail', { message: '상품명과 재고를 정확히 입력하세요.' }, 'error');
                }
                this.productManager.addProduct(name, stock);
                return this.sendResponse(socket, 'add_ok', { message: `상품 추가/업데이트 완료: ${name}` });
            } else if (type === 'broadcast') {
                this.broadcastMessage(payload.text);
                return this.sendResponse(socket, 'broadcast_ok', { message: '브로드캐스트 완료' });
            }
        }

        if (session && !session.isLoggedIn && !['login', 'auth'].includes(type)) {
            return this.sendResponse(socket, 'error', { message: '로그인이 필요합니다.' }, 'error');
        }

        switch (type) {
            case 'auth':
                if (this.mdSocket !== null) {
                    return this.sendResponse(socket, 'auth_fail', { message: '이미 MD 클라이언트가 연결되어 있습니다.' }, 'error');
                }
                if (payload.token !== this.MD_TOKEN) {
                    return this.sendResponse(socket, 'auth_fail', { message: '인증 토큰이 유효하지 않습니다.' }, 'error');
                }
                this.mdSocket = socket;
                this.sessionManager.removeSession(socket);
                if (process.env.NODE_ENV !== 'test') console.log('🤝 MD 클라이언트 인증 성공');
                this.sendResponse(socket, 'auth_ok', { message: 'MD 인증 성공' });
                break;

            case 'login':
                const campIdRegex = /^S\d{3}$/;
                if (!payload.campId || !campIdRegex.test(payload.campId)) {
                    return this.sendResponse(socket, 'login_fail', { message: '유효하지 않은 campId입니다.' }, 'error');
                }
                if (session.isLoggedIn) {
                    return this.sendResponse(socket, 'login_fail', { message: '이미 로그인 상태입니다.' }, 'error');
                }
                const { session: loggedInSession, error } = this.sessionManager.login(socket, payload.campId);
                if (error) {
                    return this.sendResponse(socket, 'login_fail', { message: error }, 'error');
                }
                const groupId = this.groupManager.joinGroup(payload.campId);
                loggedInSession.groupId = groupId;
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`[세션 ${loggedInSession.id}] 로그인 성공: ${payload.campId}, 그룹: ${groupId}`);
                }
                this.sendResponse(socket, 'login_ok', { groupId });
                break;

            case 'logout':
                const loggedOutSession = this.sessionManager.logout(socket);
                if (loggedOutSession) {
                    this.groupManager.leaveGroup(loggedOutSession.groupId, loggedOutSession.campId);
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`[세션 ${session.id}] 로그아웃: ${loggedOutSession.campId}`);
                    }
                    this.sendResponse(socket, 'logout_ok', { message: '로그아웃되었습니다.' });
                    socket.end();
                } else {
                    this.sendResponse(socket, 'logout_fail', { message: '로그인 상태가 아닙니다.' }, 'error');
                }
                break;

            case 'catalog':
                const products = this.productManager.getProducts();
                if (products.length < 15) {
                    return this.sendResponse(socket, 'catalog_fail', { message: '상품 준비 중입니다 (15개 미만).' }, 'error');
                }
                this.sendResponse(socket, 'catalog_ok', { products });
                break;

            case 'buy':
                const { productId, quantity } = payload;
                if (!productId || !quantity || quantity <= 0) {
                    return this.sendResponse(socket, 'buy_fail', { message: '상품 ID와 수량을 정확히 입력하세요.' }, 'error');
                }
                const success = this.productManager.purchaseProduct(productId, quantity);
                if (success) {
                    const product = this.productManager.getProduct(productId);
                    this.sendResponse(socket, 'buy_ok', { message: `${product.name} ${quantity}개 구매 완료.` });
                } else {
                    this.sendResponse(socket, 'buy_fail', { message: '재고가 부족합니다.' }, 'error');
                }
                break;

            case 'snapchat':
                const { maxCount } = payload;
                if (!maxCount || maxCount <= 0) {
                    return this.sendResponse(socket, 'snapchat_fail', { message: 'maxCount를 정확히 입력하세요.' }, 'error');
                }
                const started = this.chatManager.startChat(session.groupId, maxCount, session.campId);
                if (started) {
                    this.sendResponse(socket, 'snapchat_ok', { message: '채팅이 시작되었습니다.' });
                    this.sendToGroup(session.groupId, '채팅이 시작되었습니다.', session.campId);
                } else {
                    this.sendResponse(socket, 'snapchat_fail', { message: '이미 채팅이 진행 중입니다.' }, 'error');
                }
                break;

            case 'finish':
                const finished = this.chatManager.finishChat(session.groupId, session.campId);
                if (finished) {
                    this.sendResponse(socket, 'finish_ok', { message: '채팅이 종료되었습니다.' });
                    this.sendToGroup(session.groupId, '채팅이 종료되었습니다.', session.campId);
                } else {
                    this.sendResponse(socket, 'finish_fail', { message: '채팅을 종료할 수 없습니다 (개설자가 아님).' }, 'error');
                }
                break;

            case 'message':
                if (!this.chatManager.isChatting(session.groupId)) {
                    return this.sendResponse(socket, 'message_fail', { message: '채팅이 활성화되지 않았습니다.' }, 'error');
                }
                const sent = this.chatManager.incrementMessageCount(session.groupId);
                if (sent) {
                    this.sendToGroup(session.groupId, payload.text, session.campId);
                } else {
                    this.sendResponse(socket, 'message_fail', { message: '최대 메시지 개수를 초과했습니다.' }, 'error');
                }
                break;

            default:
                this.sendResponse(socket, 'error', { message: '알 수 없는 요청 타입입니다.' }, 'error');
                break;
        }
    }

    listen(port, callback) {
        return this.server.listen(port, callback);
    }

    close(callback) {
        this.sessionManager.closeAllSessions();
        this.server.close(() => {
            this.udpServer.close(() => {
                if (callback) callback();
            });
        });
    }
}

const PORT = 2025;
if (require.main === module) {
    const serverInstance = new Server();
    serverInstance.listen(PORT, () => {
        console.log(`🚀 서버가 ${PORT} 포트에서 실행 중입니다.`);
    });
}

module.exports = Server;