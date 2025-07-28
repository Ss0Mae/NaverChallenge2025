const Character = require('./Character');

class DrStrange extends Character {
    constructor(position, team) {
        super('DrStrange', 700, 40, position, team);
    }

    /**
     * 닥터 스트레인지의 이동 규칙:
     * - 상, 하, 좌, 우 방향으로 원하는 만큼 이동
     * - 경로에 다른 말이 있어도 통과 가능
     */
    move(to, board) {
        const from = this.position;

        // 상하좌우 이동인지 확인 (행 또는 열이 같아야 함)
        if (from.row !== to.row && from.col !== to.col) {
            throw new Error("닥터 스트레인지는 상, 하, 좌, 우로만 이동할 수 있습니다.");
        }

        // 경로 방해를 받지 않으므로 isPathClear 체크 안 함

        if (board.getCharacterAt(to)) {
            throw new Error("이동하려는 위치에 다른 캐릭터가 있어 이동할 수 없습니다.");
        }

        board.moveCharacter(from, to);
    }
}

module.exports = DrStrange;
