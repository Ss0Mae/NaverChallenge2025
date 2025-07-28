const Position = require('./Position');

/**
 * 모든 캐릭터의 기반이 되는 추상 클래스
 * @abstract
 */
class Character {
    /**
     * @param {string} name - 캐릭터 이름
     * @param {number} maxHp - 최대 HP
     * @param {number} attackPower - 공격력
     * @param {Position} position - 초기 위치
     * @param {string} team - 소속 팀 ('player' 또는 'computer')
     */
    constructor(name, maxHp, attackPower, position, team) {
        if (new.target === Character) {
            throw new TypeError("추상 클래스인 Character는 직접 인스턴스화할 수 없습니다.");
        }

        this.name = name;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.attackPower = attackPower;
        this.position = position;
        this.team = team;
        this.stone = null; // 초기에는 스톤 없음
    }

    /**
     * 지정된 위치로 캐릭터를 이동시키는 메서드. (자식 클래스에서 반드시 오버라이드 필요)
     * @abstract
     * @param {Position} to - 이동할 목표 위치
     * @param {Board} board - 현재 게임 보드
     */
    move(to, board) {
        throw new Error("move() 메소드는 서브클래스에서 반드시 구현되어야 합니다.");
    }

    /**
     * 대상 캐릭터를 공격하는 메서드.
     * @param {Character} target - 공격 대상 캐릭터
     */
    attack(target) {
        console.log(`${this.name}(${this.team})이(가) ${target.name}(${target.team})을(를) 공격합니다.`);
        target.takeDamage(this.attackPower);
    }

    /**
     * 데미지를 받아 HP를 감소시키는 메서드.
     * @param {number} damage - 받을 데미지
     */
    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        console.log(`${this.name}이(가) ${damage}의 데미지를 입었습니다. (현재 HP: ${this.hp})`);

        // HP가 0이 되면 보드에서 제거되어야 함 (Game 클래스에서 처리)
    }

    /**
     * 캐릭터가 살아있는지 확인합니다.
     * @returns {boolean}
     */
    isAlive() {
        return this.hp > 0;
    }

    /**
     * 캐릭터에 스톤을 장착합니다.
     * @param {Stone} stone
     */
    setStone(stone) {
        this.stone = stone;
        console.log(`${this.name}이(가) ${stone.type} 스톤을 획득했습니다.`);
    }

    /**
     * 캐릭터의 스톤을 제거하고 반환합니다.
     * @returns {Stone | null}
     */
    removeStone() {
        const stone = this.stone;
        this.stone = null;
        if (stone) {
            console.log(`${this.name}이(가) ${stone.type} 스톤을 빼앗겼습니다.`);
        }
        return stone;
    }
}

module.exports = Character;
