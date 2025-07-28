const Position = require("./Position");

class Board {
  constructor() {
    // 5x6 크기의 2차원 배열을 생성하고 null로 초기화
    this.grid = Array(5)
      .fill(null)
      .map(() => Array(6).fill(null));
  }

  /**
   * 지정된 위치에 캐릭터를 배치합니다.
   * @param {Character} character - 배치할 캐릭터
   * @param {Position} position - 배치할 위치
   */
  placeCharacter(character, position) {
    if (this.getCharacterAt(position)) {
      throw new Error(
        `${position.toString()} 위치에 이미 다른 캐릭터가 존재합니다.`
      );
    }
    this.grid[position.row][position.col] = character;
    character.position = position; // 캐릭터의 위치 정보도 업데이트
  }

  /**
   * 지정된 위치의 캐릭터를 반환합니다.
   * @param {Position} position - 확인할 위치
   * @returns {Character | null}
   */
  getCharacterAt(position) {
    return this.grid[position.row][position.col];
  }

  /**
   * 캐릭터를 새로운 위치로 이동시킵니다.
   * @param {Position} from - 시작 위치
   * @param {Position} to - 목표 위치
   */
  moveCharacter(from, to) {
    const character = this.getCharacterAt(from);
    if (!character) {
      throw new Error(`${from.toString()} 위치에 이동할 캐릭터가 없습니다.`);
    }

    // 목표 위치에 캐릭터가 있어도 일단 덮어쓰기 (공격/이동 결정은 Game 클래스에서)
    this.grid[to.row][to.col] = character;
    this.grid[from.row][from.col] = null; // 이전 위치는 비움
    character.position = to; // 캐릭터 위치 정보 업데이트
  }

  /**
   * 지정된 위치의 캐릭터를 보드에서 제거합니다.
   * @param {Position} position
   */
  removeCharacterAt(position) {
    this.grid[position.row][position.col] = null;
  }

  /**
   * 두 위치 사이의 경로가 비어있는지 확인합니다. (직선 및 대각선)
   * @param {Position} from
   * @param {Position} to
   * @returns {boolean}
   */
  isPathClear(from, to) {
    const dRow = Math.sign(to.row - from.row);
    const dCol = Math.sign(to.col - from.col);
    let currentRow = from.row + dRow;
    let currentCol = from.col + dCol;

    while (currentRow !== to.row || currentCol !== to.col) {
      if (this.grid[currentRow][currentCol]) {
        return false; // 경로상에 캐릭터가 존재
      }
      currentRow += dRow;
      currentCol += dCol;
    }

    return true; // 경로가 깨끗함
  }

  /**
   * 화면 출력을 위한 데이터 구조를 반환합니다.
   * Board 클래스는 출력 형식을 몰라야 합니다. (SRP 원칙)
   * @returns {Array<Array<object | null>>} - 2차원 배열. 각 요소는 캐릭터 정보 객체 또는 null.
   */
  getDisplayData() {
    return this.grid.map((row) =>
      row.map((character) => {
        if (!character) return null;

        // 타노스는 두 칸을 차지하므로, 이름으로 식별
        if (character.name === "Thanos") {
          return { name: "Thanos", short: "THANO", team: character.team };
        }

        // 다른 캐릭터는 약어로 표시
        const shortName =
          {
            BlackWidow: "BW",
            Hulk: "HK",
            DrStrange: "DS",
            SpiderMan: "SP",
            Loki: "LK",
            Thor: "TR",
          }[character.name] || "??";

        return { name: character.name, short: shortName, team: character.team };
      })
    );
  }
}

module.exports = Board;
