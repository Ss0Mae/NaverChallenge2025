/**
 * 게임 상태를 화면에 출력하는 모듈
 */
const OutputHandler = {
    /**
     * Board의 displayData를 받아 콘솔에 보드를 출력합니다.
     * @param {Array<Array<object | null>>} displayData - Board.getDisplayData()가 반환한 데이터
     */
    printBoard(displayData) {
        const header = ' |' + Array.from({length: 6}, (_, i) => `0${i+1}`.slice(-2)).join('|') + '|';
        console.log(header);

        displayData.forEach((row, rowIndex) => {
            const rowLabel = String.fromCharCode('A'.charCodeAt(0) + rowIndex);
            const rowString = row.map(cell => {
                if (!cell) return '..';
                // 타노스는 이름이 길어서 특별 처리
                if (cell.name === 'Thanos') return 'THANO';
                return cell.short;
            }).join('|');
            console.log(`${rowLabel}|${rowString}|`);
        });
        console.log(header);
    },

    /**
     * 게임 메시지를 출력합니다.
     * @param {string} message
     */
    printMessage(message) {
        console.log(`\n> ${message}\n`);
    }
};

module.exports = OutputHandler;
