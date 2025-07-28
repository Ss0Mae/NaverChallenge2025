const Character = require('./Character');

class SpiderMan extends Character {
    constructor(position, team) {
        super('SpiderMan', 600, 20, position, team);
    }

    /**
     * 스파이더맨의 이동 규칙:
     * - 보드 위의 어디로든 이동 가능
     * - 경로에 다른 말이 있어도 통과 가능
     */
    move(to, board) {
        const from = this.position;

        // 어디로든 이동 가능하므로 위치 제약 없음
        // 경로 방해를 받지 않으므로 isPathClear 체크 안 함

        if (board.getCharacterAt(to)) {
            throw new Error("이동하려는 위치에 다른 캐릭터가 있어 이동할 수 없습니다.");
        }

        board.moveCharacter(from, to);
    }
}

module.exports = SpiderMan;
