class Registers {
    constructor() {
        this.storage = new Map();
        this.registerNames = ['PC', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
        this.registerNames.forEach(name => this.storage.set(name, 0));
    }

    /**
     * 지정된 레지스터의 값을 가져옵니다.
     * @param {string} name - 레지스터 이름 (e.g., 'PC', 'R1').
     * @returns {number} - 16비트 값.
     */
    get(name) {
        if (!this.storage.has(name)) {
            throw new Error(`알 수 없는 레지스터 이름입니다: ${name}`);
        }
        return this.storage.get(name);
    }

    /**
     * 지정된 레지스터에 값을 설정합니다.
     * @param {string} name - 레지스터 이름.
     * @param {number} value - 16비트 값.
     */
    set(name, value) {
        if (!this.storage.has(name)) {
            throw new Error(`알 수 없는 레지스터 이름입니다: ${name}`);
        }
        this.storage.set(name, value & 0xFFFF); // 16비트 값만 저장
    }

    /**
     * PC 레지스터 값을 1 증가시킵니다.
     */
    incrementPC() {
        const currentPC = this.get('PC');
        this.set('PC', currentPC + 1);
    }
}

module.exports = Registers;
