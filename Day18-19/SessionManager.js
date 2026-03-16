class SessionManager {
    constructor() {
        this.sessions = new Map(); // socket -> session info
        this.loggedInCampIds = new Set(); // 로그인된 campId 관리
        this.nextSessionId = 1;
    }

    createSession(socket) {
        const sessionId = this.nextSessionId++;
        const session = {
            id: sessionId,
            socket: socket,
            isLoggedIn: false,
            campId: null,
            groupId: null,
        };
        this.sessions.set(socket, session);
        if (process.env.NODE_ENV !== 'test') {
            console.log(`세션 생성: ${sessionId}`);
        }
        return session;
    }

    getSession(socket) {
        return this.sessions.get(socket);
    }

    removeSession(socket) {
        const session = this.getSession(socket);
        if (session) {
            if (session.isLoggedIn) {
                this.loggedInCampIds.delete(session.campId);
            }
            this.sessions.delete(socket);
            if (process.env.NODE_ENV !== 'test') {
                console.log(`세션 제거: ${session.id}`);
            }
        }
    }

    // 로그인 처리
    login(socket, campId) {
        if (this.loggedInCampIds.has(campId)) {
            return { error: '이미 접속 중인 ID입니다.' };
        }

        const session = this.getSession(socket);
        if (session && !session.isLoggedIn) {
            session.isLoggedIn = true;
            session.campId = campId;
            this.loggedInCampIds.add(campId);
            return { session };
        }
        return { error: '세션 처리 중 오류가 발생했습니다.' };
    }

    // 로그아웃 처리
    logout(socket) {
        const session = this.getSession(socket);
        if (session && session.isLoggedIn) {
            this.loggedInCampIds.delete(session.campId);
            session.isLoggedIn = false;
            return session;
        }
        return null;
    }

    closeAllSessions() {
        if (process.env.NODE_ENV !== 'test') {
            console.log('모든 세션을 종료합니다.');
        }
        for (const session of this.sessions.values()) {
            session.socket.end(); // 클라이언트 소켓 종료
            session.socket.destroy(); // 소켓 즉시 파괴
        }
        this.sessions.clear();
        this.loggedInCampIds.clear();
    }
}

module.exports = SessionManager;