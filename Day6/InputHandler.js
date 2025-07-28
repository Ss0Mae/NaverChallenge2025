const Position = require('./Position');

/**
 * 사용자 입력을 처리하는 모듈 (객체 리터럴로 구현)
 */
const InputHandler = {
    /**
     * "A1->B2" 형식의 명령어를 파싱하여 시작 위치와 목표 위치를 반환합니다.
     * @param {string} command - 사용자가 입력한 명령어
     * @returns {{from: Position, to: Position} | null}
     */
    parseMoveCommand(command) {
        if (!command) return null;

        const commandRegex = /^([A-E][1-6])->([A-E][1-6])$/i;
        const match = command.match(commandRegex);

        if (!match) {
            throw new Error('잘못된 명령어 형식입니다. "A1->B2"와 같이 입력해주세요.');
        }

        const fromPos = Position.fromString(match[1]);
        const toPos = Position.fromString(match[2]);

        return { from: fromPos, to: toPos };
    }
};

module.exports = InputHandler;
