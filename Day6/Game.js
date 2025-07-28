const StoneManager = require('./StoneManager');
const readline = require('readline');
const Board = require('./Board');
const Position = require('./Position');
const Thanos = require('./Thanos');
const BlackWidow = require('./BlackWidow');
const Hulk = require('./Hulk');
const DrStrange = require('./DrStrange');
const SpiderMan = require('./SpiderMan');
const Loki = require('./Loki');
const Thor = require('./Thor');
const InputHandler = require('./InputHandler');
const OutputHandler = require('./OutputHandler');

/**
 * 게임의 전체 흐름을 관리하는 클래스
 */
class Game {
    constructor() {
        this.playerBoard = new Board();
        this.computerBoard = new Board();
        this.currentPlayer = 'player';
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 게임을 시작하고 메인 루프를 실행합니다.
     */
    run() {
        console.log("마블 보드게임을 시작합니다!");
        this._initializeBoard(this.playerBoard, 'player');
        this._initializeBoard(this.computerBoard, 'computer');
        
        OutputHandler.printMessage("플레이어 보드");
        OutputHandler.printBoard(this.playerBoard.getDisplayData());

        this._gameLoop();
    }

    _gameLoop() {
        if (this._isGameOver()) {
            OutputHandler.printMessage(`게임 종료! ${this.winner}의 승리입니다!`);
            this.rl.close();
            return;
        }

        const currentTeam = this.currentPlayer === 'player' ? '플레이어' : '컴퓨터';
        OutputHandler.printMessage(`${currentTeam}의 턴입니다.`);

        this.rl.question(`명령을 입력하세요 (${this.currentPlayer})> `, (command) => {
            try {
                this.playTurn(command);
            } catch (error) {
                OutputHandler.printMessage(`오류: ${error.message}`);
            }
            this._gameLoop(); // 다음 턴 진행
        });
    }

    /**
     * 요구사항에 따라 캐릭터를 랜덤으로 생성하고 보드에 배치합니다.
     * @param {Board} board - 초기화할 보드
     * @param {string} team - 보드의 소속 팀 ('player' 또는 'computer')
     * @private
     */
    _initializeBoard(board, team) {
        const charactersToCreate = this._generateCharacterList();
        const emptyPositions = this._getEmptyPositions();

        // 1. 타노스 2개 A-C열에 배치
        this._placeCharacters(board, team, [Thanos, Thanos], emptyPositions.thanosZone);

        // 2. 나머지 히어로 6개 D-E열에 배치
        this._placeCharacters(board, team, charactersToCreate, emptyPositions.heroZone);
    }

    /**
     * 배치할 캐릭터 6종의 리스트를 생성합니다.
     * @returns {Array<Character>}
     * @private
     */
    _generateCharacterList() {
        const characterClasses = {
            BW: BlackWidow, HK: Hulk, DS: DrStrange, 
            SP: SpiderMan, LK: Loki, TR: Thor
        };
        const maxCounts = { BW: 2, HK: 2, DS: 3, LK: 3, SP: 1, TR: 1 };
        const required = ['BW', 'DS', 'TR'];

        let creationList = ['BW', 'DS', 'TR'];
        let availablePool = [];

        // 최대 개수에 맞춰 추가 가능한 캐릭터 풀 생성
        for (const char in maxCounts) {
            const currentCount = creationList.filter(c => c === char).length;
            for (let i = 0; i < maxCounts[char] - currentCount; i++) {
                availablePool.push(char);
            }
        }

        // 남은 3자리 채우기 (6 - 3)
        while (creationList.length < 6) {
            if (availablePool.length === 0) break;
            const randomIndex = Math.floor(Math.random() * availablePool.length);
            const selected = availablePool.splice(randomIndex, 1)[0];
            creationList.push(selected);
        }

        return creationList.map(name => characterClasses[name]);
    }

    /**
     * 보드의 비어있는 위치 목록을 반환합니다.
     * @returns {{thanosZone: Position[], heroZone: Position[]}}
     * @private
     */
    _getEmptyPositions() {
        const thanosZone = []; // A-C열 (0-2)
        const heroZone = [];   // D-E열 (3-4)

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                const pos = new Position(row, col);
                if (row <= 2) {
                    thanosZone.push(pos);
                } else {
                    heroZone.push(pos);
                }
            }
        }
        return { thanosZone, heroZone };
    }

    /**
     * 지정된 위치에 캐릭터들을 랜덤하게 배치합니다.
     * @private
     */
    _placeCharacters(board, team, characters, positions) {
        characters.forEach(CharClass => {
            if (positions.length === 0) {
                console.error("배치할 위치가 부족합니다.");
                return;
            }
            const randIndex = Math.floor(Math.random() * positions.length);
            const pos = positions.splice(randIndex, 1)[0];
            const character = new CharClass(pos, team);
            this._assignInitialStone(character);
            board.placeCharacter(character, pos);
        });
    }

    /**
     * 캐릭터에게 초기 스톤을 부여합니다.
     * @private
     */
    _assignInitialStone(character) {
        const stoneMap = {
            BlackWidow: 'ORANGE',
            Loki: 'BLUE',
            Hulk: 'WHITE',
            SpiderMan: 'RED',
            Thor: 'VIOLET',
            DrStrange: 'GREEN'
        };
        const stoneType = stoneMap[character.name];
        if (stoneType) {
            character.setStone(StoneManager.getStone(stoneType));
        }
    }

    /**
     * 게임 턴을 진행합니다.
     * @param {string | null} command - 플레이어의 입력 명령어 (컴퓨터 턴일 경우 null)
     */
    playTurn(command) {
        if (command === '?') {
            const opponentBoard = this.currentPlayer === 'player' ? this.computerBoard : this.playerBoard;
            const totalHp = opponentBoard.grid.flat()
                .filter(c => c)
                .reduce((sum, c) => sum + c.hp, 0);
            OutputHandler.printMessage(`상대방의 총 HP는 ${totalHp} 입니다.`);
            return; // 턴을 소모하지 않음
        }

        const move = InputHandler.parseMoveCommand(command);
        if (!move) {
            throw new Error("명령어가 유효하지 않습니다.");
        }

        const { from, to } = move;
        const currentBoard = this.currentPlayer === 'player' ? this.playerBoard : this.computerBoard;
        const opponentBoard = this.currentPlayer === 'player' ? this.computerBoard : this.playerBoard;

        const character = currentBoard.getCharacterAt(from);

        if (!character || character.team !== this.currentPlayer) {
            throw new Error(`해당 위치에 당신의 캐릭터가 없습니다. (${this.currentPlayer}의 턴)`);
        }

        const opponent = opponentBoard.getCharacterAt(to);

        if (opponent) { // HIT
            const initialOpponentHp = opponent.hp;
            character.attack(opponent);
            OutputHandler.printMessage(`HIT! ${character.name}이(가) ${opponent.name}을(를) 공격! (상대 HP: ${initialOpponentHp} -> ${opponent.hp})`);

            if (opponent.hp <= opponent.maxHp / 2 && opponent.stone) {
                const stolenStone = opponent.removeStone();
                if (character.name === 'Thanos') {
                    character.addStone(stolenStone);
                } else {
                    character.setStone(stolenStone);
                }
            }

            if (!opponent.isAlive()) {
                opponentBoard.removeCharacterAt(to);
                OutputHandler.printMessage(`${opponent.name}이(가) 쓰러졌습니다!`);
            }
        } else { // MISS
            OutputHandler.printMessage("MISS! 해당 위치로 이동합니다.");
            character.move(to, currentBoard);
        }

        // 턴 결과 출력
        console.log("\n[플레이어 보드]");
        OutputHandler.printBoard(this.playerBoard.getDisplayData());
        console.log("\n[컴퓨터 보드]");
        OutputHandler.printBoard(this.computerBoard.getDisplayData());
        
        // 턴 전환
        this.currentPlayer = this.currentPlayer === 'player' ? 'computer' : 'player';
    }

    _isGameOver() {
        const playerHasThanos = this.playerBoard.grid.flat().some(c => c && c.name === 'Thanos');
        const computerHasThanos = this.computerBoard.grid.flat().some(c => c && c.name === 'Thanos');

        if (!computerHasThanos) {
            this.winner = 'player';
            return true;
        }
        if (!playerHasThanos) {
            this.winner = 'computer';
            return true;
        }

        return false;
    }
}

module.exports = Game;
