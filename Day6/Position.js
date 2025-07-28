class Position {
    /**
     * @param {number} row - 0부터 시작하는 행 (0 = A, 1 = B, ...)
     * @param {number} col - 0부터 시작하는 열 (0 = 01, 1 = 02, ...)
     */
    constructor(row, col) {
        // 5x6 보드 크기에 맞는지 확인
        if (row < 0 || row >= 5 || col < 0 || col >= 6) {
            throw new Error(`유효하지 않은 위치입니다: (${row}, ${col}). 행은 0-4, 열은 0-5 사이여야 합니다.`);
        }
        this.row = row;
        this.col = col;
    }

    /**
     * "A1"과 같은 문자열로부터 Position 객체를 생성합니다.
     * @param {string} posStr - 위치를 나타내는 문자열 (예: "A1", "E6")
     * @returns {Position}
     */
    static fromString(posStr) {
        const rowChar = posStr.charAt(0).toUpperCase();
        const colStr = posStr.substring(1);

        const row = rowChar.charCodeAt(0) - 'A'.charCodeAt(0);
        const col = parseInt(colStr, 10) - 1;

        return new Position(row, col);
    }

    /**
     * 현재 Position 객체를 문자열로 변환합니다.
     * @returns {string}
     */
    toString() {
        const rowStr = String.fromCharCode('A'.charCodeAt(0) + this.row);
        const colStr = String(this.col + 1);
        return `${rowStr}${colStr}`;
    }
}

module.exports = Position;
