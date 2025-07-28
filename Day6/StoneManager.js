const Stone = require('./Stone');

const STONE_TYPES = ['WHITE', 'BLUE', 'RED', 'GREEN', 'ORANGE', 'VIOLET'];

/**
 * 모든 스톤 인스턴스의 생성과 접근을 관리하는 클래스
 * 각 종류의 스톤이 단 하나의 인스턴스만 갖도록 보장합니다. (싱글턴 패턴)
 */
class StoneManager {
    constructor() {
        if (StoneManager.instance) {
            return StoneManager.instance;
        }

        this._stones = new Map();
        STONE_TYPES.forEach(type => {
            this._stones.set(type, new Stone(type));
        });

        StoneManager.instance = this;
    }

    /**
     * 지정된 타입의 스톤 인스턴스를 반환합니다.
     * @param {'WHITE' | 'BLUE' | 'RED' | 'GREEN' | 'ORANGE' | 'VIOLET'} type
     * @returns {Stone}
     */
    getStone(type) {
        if (!this._stones.has(type)) {
            throw new Error(`${type}은(는) 유효한 스톤 타입이 아닙니다.`);
        }
        return this._stones.get(type);
    }

    /**
     * 모든 스톤의 리스트를 반환합니다.
     * @returns {Array<Stone>}
     */
    getAllStones() {
        return Array.from(this._stones.values());
    }
}

// 클래스의 유일한 인스턴스를 생성하여 내보냅니다.
const instance = new StoneManager();
Object.freeze(instance); // 인스턴스가 변경되지 않도록 동결

module.exports = instance;
