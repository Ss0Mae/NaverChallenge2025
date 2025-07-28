const Character = require('./Character');

class Loki extends Character {
    constructor(position, team) {
        super('Loki', 500, 30, position, team);
    }

    /**
     * 로키의 이동 규칙:
     * - 대각선 방향으로 원하는 만큼 이동
     * - 경로에 다른 말이 있으면 이동 불가
     */
    move(to, board) {
        const from = this.position;
        const dRow = Math.abs(to.row - from.row);
        const dCol = Math.abs(to.col - from.col);

        // 대각선 이동인지 확인 (행 변화량과 열 변화량이 같아야 함)
        if (dRow !== dCol) {
            throw new Error("로키는 대각선으로만 이동할 수 있습니다.");
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

module.exports = Loki;
