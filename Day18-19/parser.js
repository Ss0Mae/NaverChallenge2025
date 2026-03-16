class MessageParser {
    constructor(onMessage) {
        this.buffer = Buffer.alloc(0);
        this.onMessage = onMessage;
    }

    parse(data) {
        // 새로 도착한 데이터를 기존 버퍼에 합칩니다.
        this.buffer = Buffer.concat([this.buffer, data]);

        const separator = '\r\n\r\n';
        const separatorBuffer = Buffer.from(separator);

        let separatorIndex;
        // 버퍼에서 구분자를 찾습니다.
        while ((separatorIndex = this.buffer.indexOf(separatorBuffer)) !== -1) {
            // 헤더 부분을 추출합니다.
            const headerBuffer = this.buffer.slice(0, separatorIndex);
            const header = headerBuffer.toString('utf8');
            const match = header.match(/Content-Length: (\d+)/);

            if (!match) {
                console.error('오류: Content-Length 헤더를 찾을 수 없습니다.');
                // 문제가 있는 메시지는 건너뛰고, 구분자 다음부터 다시 파싱을 시도합니다.
                this.buffer = this.buffer.slice(separatorIndex + separatorBuffer.length);
                continue;
            }

            const contentLength = parseInt(match[1], 10);
            const messageStartIndex = separatorIndex + separatorBuffer.length;
            const messageEndIndex = messageStartIndex + contentLength;

            // 메시지 전체가 버퍼에 도착했는지 확인합니다.
            if (this.buffer.length < messageEndIndex) {
                // 아직 메시지가 다 도착하지 않았으므로, 다음 데이터 수신을 기다립니다.
                break;
            }

            // 메시지 본문을 추출하고 JSON으로 파싱합니다.
            const bodyBuffer = this.buffer.slice(messageStartIndex, messageEndIndex);
            try {
                const message = JSON.parse(bodyBuffer.toString('utf8'));
                // 완성된 메시지를 콜백으로 전달합니다.
                this.onMessage(message);
            } catch (e) {
                console.error('JSON 파싱 오류:', e);
            }

            // 처리된 메시지만큼 버퍼에서 제거하고, 다음 메시지 처리를 위해 루프를 계속합니다.
            this.buffer = this.buffer.slice(messageEndIndex);
        }
    }
}

module.exports = MessageParser;
