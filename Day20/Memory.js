class Memory {
    constructor() {
        this.storage = new Map();
    }

    /**
     * 지정된 주소에 값을 씁니다.
     * @param {number} address - 값을 쓸 메모리 주소.
     * @param {number} value - 16비트 값.
     */
    write(address, value) {
        this.storage.set(address, value & 0xFFFF); // 16비트 값만 저장
    }

    /**
     * 지정된 주소에서 값을 읽습니다.
     * @param {number} address - 값을 읽을 메모리 주소.
     * @returns {number} - 16비트 값. 해당 주소에 값이 없으면 0을 반환합니다.
     */
    read(address) {
        return this.storage.get(address) || 0;
    }

    /**
     * 프로그램을 메모리에 로드합니다.
     * @param {number[]} program - 16비트 기계어 코드의 배열.
     */
    load(program) {
        program.forEach((instruction, index) => {
            this.write(index, instruction);
        });
    }
}

module.exports = Memory;
