const Character = require('./Character');

class Thor extends Character {
    constructor(position, team) {
        super('Thor', 900, 50, position, team);
    }

    /**
     * 토르의 이동 규칙:
     * - 상, 하, 좌, 우, 대각선 모든 방향으로 원하는 만큼 이동
     * - 경로에 다른 말이 있으면 이동 불가
     */
    move(to, board) {
        const from = this.position;
        const dRow = Math.abs(to.row - from.row);
        const dCol = Math.abs(to.col - from.col);

        // 상하좌우 또는 대각선 이동인지 확인
        if (!(from.row === to.row || from.col === to.col || dRow === dCol)) {
            throw new Error("토르는 상, 하, 좌, 우, 대각선으로만 이동할 수 있습니다.");
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

module.exports = Thor;
