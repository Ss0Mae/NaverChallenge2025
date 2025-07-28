const Character = require('./Character');
const Position = require('./Position');

class Thanos extends Character {
    constructor(position, team) {
        super('Thanos', 1000, 100, position, team);
        // 타노스는 스톤을 공유해야 하므로, static 변수를 사용할 수 있습니다.
        if (!Thanos.stones) {
            Thanos.stones = [];
        }
    }

    /**
     * 타노스의 이동 규칙:
     * - 보드 위의 어디로든 이동 가능
     * - 단, 이동할 두 칸이 모두 비어 있어야 함
     */
    move(to, board) {
        const from = this.position;

        // 타노스는 두 칸을 차지하므로, 이동할 두 칸이 비어있는지 확인해야 함
        // (단순화를 위해 to와 to의 바로 아래 칸만 확인)
        const secondPos = new Position(to.row + 1, to.col);

        if (board.getCharacterAt(to) || (secondPos && board.getCharacterAt(secondPos))) {
             throw new Error("타노스가 이동하려는 위치가 비어있지 않습니다.");
        }

        // 기존 위치 두 칸을 비워야 함 (이 로직은 더 정교해져야 함)
        board.removeCharacterAt(from);
        // board.removeCharacterAt(타노스의 다른칸);

        board.placeCharacter(this, to);
        // board.placeCharacter(this, secondPos); // 두 번째 칸에도 배치

        console.log("Thanos moved");
    }

    // 스톤 획득 시 능력치 강화
    addStone(stone) {
        Thanos.stones.push(stone);
        this.hp += 50;
        this.attackPower += 10;
        console.log(`타노스가 ${stone.type} 스톤을 획득하여 강화됩니다! (HP: ${this.hp}, 공격력: ${this.attackPower})`);
    }
}

module.exports = Thanos;
ㅇ