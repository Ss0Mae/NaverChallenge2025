const Character = require('./Character');

class Hulk extends Character {
    constructor(position, team) {
        super('Hulk', 800, 50, position, team);
    }

    /**
     * 헐크의 이동 규칙:
     * - 상, 하 방향으로 원하는 만큼 이동
     * - 경로에 다른 말이 있으면 이동 불가
     */
    move(to, board) {
        const from = this.position;
        
        // 상하 이동인지 확인 (열이 같아야 함)
        if (from.col !== to.col) {
            throw new Error("헐크는 상, 하로만 이동할 수 있습니다.");
        }

        if (!board.isPathClear(from, to)) {
            throw new Error("이동 경로에 다른 캐릭터가 있어 이동할 수 없습니다.");
        }

        if (board.getCharacterAt(to)) {
            throw new Error("이동하려는 위치에 다른 캐릭터가 있어 이동할 수 없습니다.");
        }

        board.moveCharacter(from, to);
    }
}

module.exports = Hulk;
