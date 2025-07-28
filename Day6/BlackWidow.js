const Character = require('./Character');

class BlackWidow extends Character {
    constructor(position, team) {
        super('BlackWidow', 400, 10, position, team);
    }

    /**
     * 블랙 위도우의 이동 규칙:
     * - 상, 하, 좌, 우 1칸씩만 이동 가능
     */
    move(to, board) {
        const from = this.position;
        const dRow = Math.abs(to.row - from.row);
        const dCol = Math.abs(to.col - from.col);

        // 상하좌우 1칸만 이동 가능한지 확인
        if (!((dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1))) {
            throw new Error("블랙 위도우는 상, 하, 좌, 우로 1칸만 이동할 수 있습니다.");
        }

        // 목표 위치에 다른 말이 있으면 이동 불가 (공격은 Game 클래스에서 처리)
        if (board.getCharacterAt(to)) {
            throw new Error("이동하려는 위치에 다른 캐릭터가 있어 이동할 수 없습니다.");
        }

        board.moveCharacter(from, to);
    }
}

module.exports = BlackWidow;
