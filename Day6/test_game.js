const Game = require('./Game');
const OutputHandler = require('./OutputHandler');
const Position = require('./Position');

/**
 * 게임 로직을 자동으로 테스트하기 위한 스크립트
 */
class GameTester {
    constructor() {
        this.game = new Game();
        // 테스트 중에는 readline 인터페이스가 아무것도 하지 않도록 설정
        this.game.rl.question = () => {};
        this.game.rl.close = () => {};
    }

    /**
     * 테스트를 실행합니다.
     */
    runTest() {
        console.log("===== 게임 자동 테스트 시작 ======");

        // 수동으로 보드 초기화
        this.game._initializeBoard(this.game.playerBoard, 'player');
        this.game._initializeBoard(this.game.computerBoard, 'computer');

        console.log("\n[초기 상태] 플레이어 보드:");
        OutputHandler.printBoard(this.game.playerBoard.getDisplayData());
        console.log("\n[초기 상태] 컴퓨터 보드:");
        OutputHandler.printBoard(this.game.computerBoard.getDisplayData());

        let turn = 0;
        const MAX_TURNS = 50; // 무한 루프 방지를 위한 최대 턴 수

        while (!this.game._isGameOver() && turn < MAX_TURNS) {
            const currentTeam = this.game.currentPlayer;
            console.log(`\n--- 턴 ${turn + 1} (${currentTeam}) ---`);

            const command = this._generateCommand();
            if (!command) {
                console.log("실행할 유효한 명령을 찾지 못해 테스트를 중단합니다.");
                break;
            }

            console.log(`명령 실행: ${command}`);
            try {
                this.game.playTurn(command);
            } catch (error) {
                console.error(`오류 발생: ${error.stack}`);
            }
            turn++;
        }

        console.log("\n===== 게임 자동 테스트 종료 ======");
        if (this.game._isGameOver()) {
            console.log(`🎉 게임 종료! 최종 승자: ${this.game.winner} 🎉`);
        } else {
            console.log(`최대 턴(${MAX_TURNS})에 도달하여 게임이 종료되었습니다.`);
        }
    }

    /**
     * 현재 게임 상태에 맞는 유효한 공격/이동 명령어를 생성합니다.
     * @returns {string | null}
     */
    _generateCommand() {
        const currentBoard = this.game.currentPlayer === 'player' ? this.game.playerBoard : this.game.computerBoard;
        const opponentBoard = this.game.currentPlayer === 'player' ? this.game.computerBoard : this.playerBoard;

        const attacker = this._findAnAttacker(currentBoard);
        if (!attacker) return null; // 공격할 캐릭터가 없으면 종료

        // 1. 공격 가능한 타노스를 우선적으로 찾음
        const thanosTarget = this._findAThanos(opponentBoard);
        if (thanosTarget) {
            return `${attacker.position.toString()}->${thanosTarget.position.toString()}`;
        }

        // 2. 타노스를 공격할 수 없으면, 다른 캐릭터를 공격
        const anyTarget = this._findAnAttacker(opponentBoard, true);
        if (anyTarget) {
            return `${attacker.position.toString()}->${anyTarget.position.toString()}`;
        }
        
        // 3. 공격할 대상이 없으면, 자신의 보드 내 빈 공간으로 이동
        const emptyPosition = this._findEmptyPosition(currentBoard); // 자신의 보드에서 빈 공간 탐색
        if(emptyPosition){
             return `${attacker.position.toString()}->${emptyPosition.toString()}`;
        }

        return null; // 유효한 명령 생성 불가
    }

    _findAnAttacker(board, canBeThanos = false) {
        if (!board || !board.grid) return null;
        const characters = board.grid.flat().filter(c => c);
        if (canBeThanos) {
            return characters[Math.floor(Math.random() * characters.length)] || null;
        }
        const nonThanos = characters.filter(c => c.name !== 'Thanos');
        if(nonThanos.length > 0) {
            return nonThanos[Math.floor(Math.random() * nonThanos.length)];
        }
        return characters[0] || null;
    }

    _findAThanos(board) {
        if (!board || !board.grid) return null;
        const thanoses = board.grid.flat().filter(c => c && c.name === 'Thanos');
        return thanoses[0] || null;
    }

    _findEmptyPosition(board) {
        if (!board || !board.grid) return null;
        const emptyPositions = [];
        for(let r = 0; r < 5; r++) {
            for(let c = 0; c < 6; c++) {
                if(!board.grid[r][c]) {
                    emptyPositions.push(new Position(r, c));
                }
            }
        }
        if(emptyPositions.length > 0) {
            return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        }
        return null;
    }
}

const tester = new GameTester();
tester.runTest();