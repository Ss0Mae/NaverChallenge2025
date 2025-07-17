const TEXT_SIZE = 1024; // 1KB code
const STACK_SIZE = 1024; // 1KB stack
const HEAP_SIZE = 1024 * 10; // 10KB heap

class Simulator {
  constructor() {
    // 순수한 메모리 영역할당
    this.text = new ArrayBuffer(TEXT_SIZE);
    this.stack = new ArrayBuffer(STACK_SIZE);
    this.heap = new ArrayBuffer(HEAP_SIZE);

    // 메모리 뷰 생성 (DataView는 ArrayBuffer의 뷰로, 메모리의 특정 부분을 읽고 쓸 수 있게 해줌)
    this.textMemory = new Uint8Array(this.text);
    this.stackMemory = new Uint8Array(this.stack);
    this.heapMemory = new Uint8Array(this.heap);

    // 메모리 해석용 뷰 생성
    this.textView = new DataView(this.text);
    this.stackView = new DataView(this.stack);
    this.heapView = new DataView(this.heap);

    this.reset();
  }

  /**
   * 시뮬레이터의 상태를 초기화합니다.
   * 이 함수는 메모리 영역을 초기화하고 레지스터를 리셋합니다.
   * - TEXT 영역: 코드 저장
   * - STACK 영역: 함수 호출 스택
   * - HEAP 영역: 동적 메모리 할당
   */
  reset() {
    // Phase 1-3: reset() 함수 구현
    // 메모리 영역 초기화
    this.textMemory.fill(0);
    this.stackMemory.fill(0);
    this.heapMemory.fill(0);

    // 레지스터 초기화
    this.pc = 0;
    this.sp = 0;

    // 메타데이터 초기화
    this.typeSizes = new Map(); // INT, FLOAT 등 데이터 타입과 크기 매핑
    this.functions = new Map(); // 함수 이름과 주소 매핑
    this.heapPointer = 0; // HEAP 영역에서 현재 사용 중인 위치
    this.callStackInfo = []; // 함수 호출 스택 정보
    this.codes = []; // locate로 들어온 코드 원본을 저장하는 배열
    this.variables = {}; // 변수 이름과 스택 주소를 매핑
  }

  /**
   * 메모리 영역에 특정 타입의 크기를 설정합니다.
   * @param {string} type 데이터의 타입 (예: 'INT', 'FLOAT').
   * @param {number} length 데이터 타입의 크기 (1, 2, 4, 8, 16, 32 중 하나).
   */
  setSize(type, length) {
    //타입과 크기를 매핑하여 저장
    if (this.typeSizes.has(type)) {
      throw new Error(`Type "${type}"은 이미 저장되어 있습니다.`);
    }
    const validSizes = [1, 2, 4, 8, 16, 32];
    if (!validSizes.includes(length)) {
      throw new Error(`크기는  ${validSizes.join(", ")} 중 하나여야 합니다.`);
    }
    this.typeSizes.set(type, length);
  }

  /**
   * [내부 함수] 스택에 값을 저장하고 스택 포인터를 이동시킵니다.
   * @param {number} value - 스택에 저장할 값.
   * @param {number} bytes - 값의 크기 (기본값 4바이트).
   */
  _push(value, bytes = 4) {
    if (this.sp + bytes > STACK_SIZE) {
      throw new Error("스택 오버플로우 발생!");
    }

    this.stackView.setInt32(this.sp, value);
    this.sp += bytes; // 스택 포인터를 이동시킵니다.
  }

  /**
   * [내부 함수] 스택에서 값을 꺼내고 스택 포인터를 이동시킵니다.
   * @param {number} bytes - 꺼낼 값의 크기 (기본값 4바이트).
   * @returns {number} 스택에서 꺼낸 값.
   */
  _pop(bytes = 4) {
    if (this.sp - bytes < 0) {
      throw new Error("스택 언더플로우 발생!");
    }
    this.sp -= bytes; // 스택 포인터를 이동시킵니다.
    return this.stackView.getInt32(this.sp);
  }

  /**
   * [내부 함수] 힙 영역에 메모리를 할당합니다.
   * @param {string} type - 할당할 메모리의 타입 (e.g., "INT").
   * @param {number} count - 할당할 타입의 개수.
   * @returns {number} 할당된 힙 메모리의 시작 주소.
   */
  alloc(type, count) {
    if (!this.typeSizes.has(type)) {
      throw new Error(`알 수 없는 타입: ${type}`);
    }

    let typeSize = this.typeSizes.get(type);
    // 요구사항: 타입 크기가 8바이트보다 작으면 8바이트로 패딩합니다.
    let paddedSize = Math.max(typeSize, 8);
    const totalSize = paddedSize * count;

    if (this.heapPointer + totalSize > HEAP_SIZE) {
      throw new Error("힙 메모리 부족!");
    }

    const allocatedAddress = this.heapPointer;
    // 할당된 힙 공간의 시작 주소를 스택에 push하여 포인터 변수처럼 사용합니다.
    this._push(allocatedAddress);

    this.heapPointer += totalSize;
    return allocatedAddress;
  }

  /**
   * [내부 함수] 힙 메모리를 해제합니다.
   * @param {number} stackAddress - 해제할 힙 포인터가 저장된 스택 주소.
   */
  free(stackAddress) {
    if (stackAddress >= this.sp || stackAddress < 0) {
      throw new Error(`잘못된 스택 주소: ${stackAddress}`);
    }
    const heapAddress = this.stackView.getInt32(stackAddress);
    if (heapAddress >= this.heapPointer || heapAddress < 0) {
      throw new Error(
        `스택에 저장된 힙 주소(${heapAddress})가 유효하지 않습니다.`
      );
    }
    this.stackView.setInt32(stackAddress, 0);
  }

  /**
   * 함수 코드를 TEXT 영역에 저장하고, 함수의 시작 주소를 기록합니다.
   * @param {string} funcName - 함수의 이름.
   * @param {string[]} codes - 함수를 구성하는 어셈블리 코드 배열.
   */
  locate(funcName, codes) {
    if (this.functions.has(funcName)) {
      throw new Error(`함수 "${funcName}"은 이미 존재합니다.`);
    }

    // 현재 텍스트 포인터(pc) 위치를 이 함수의 시작 주소로 기록합니다.
    const startAddress = this.pc;
    this.functions.set(funcName, startAddress);

    // 코드를 별도 배열에 저장하고, TEXT 영역에는 해당 코드의 인덱스를 저장합니다.
    codes.forEach(code => {
      if (this.pc + 4 > TEXT_SIZE) {
        throw new Error("TEXT 영역 메모리 부족!");
      }

      const codeId = this.codes.length;
      this.codes.push(code); // 코드 원본 저장

      this.textView.setInt32(this.pc, codeId); // TEXT 영역에 코드 ID 저장
      this.pc += 4; // 각 명령어는 4바이트를 차지
    });
  }

  /**
   * 현재 PC가 가리키는 명령어를 한 줄 실행합니다.
   */
  execute() {
    if (this.pc >= this.codes.length * 4) { // TEXT 영역의 끝에 도달했는지 확인
        console.log("프로그램 실행 종료.");
        return;
    }

    const codeId = this.textView.getInt32(this.pc);
    const code = this.codes[codeId];
    this.pc += 4; // 다음 명령어를 가리키도록 PC를 미리 증가

    console.log(`실행: ${code}`); // 디버깅을 위해 현재 실행되는 코드 출력

    const parts = code.split(/\s+/).filter(Boolean); // 공백 기준으로 단어 분리
    const command = parts[0];

    if (command === 'VAR') {
        const varName = parts[1].replace(':', '');
        const typeAndCount = parts[2]; // 'INT' 또는 'BOOL[4]' 형태

        let type;
        let count = 1;

        if (typeAndCount.includes('[')) {
            // 배열 타입인 경우 (e.g., "BOOL[4]")
            const match = typeAndCount.match(/(.+)\[(\d+)\]/);
            type = match[1]; // "BOOL"
            count = parseInt(match[2], 10); // 4
        } else {
            // 기본 타입인 경우 (e.g., "INT")
            type = typeAndCount;
        }

        const stackAddressBeforeAlloc = this.sp;
        this.alloc(type, count);
        this.variables[varName] = stackAddressBeforeAlloc;
    } else if (command === 'CALL') {
        // CALL $FuncName
        const funcName = parts[1];
        if (!this.functions.has(funcName)) {
            throw new Error(`정의되지 않은 함수 호출: ${funcName}`);
        }

        // 1. 현재 프레임 포인터(FP) 역할을 할 sp를 스택에 push
        this._push(this.sp);

        // 2. 복귀 주소(현재 pc)를 스택에 push
        this._push(this.pc);

        // 3. callstack 정보 기록 (sp_base 추가하여 지역 변수 시작 위치 기록)
        this.callStackInfo.push({ name: funcName, address: this.functions.get(funcName), sp_base: this.sp });

        // 4. 해당 함수로 점프
        this.pc = this.functions.get(funcName);

    } else if (command === 'RETURN') {
        // RETURN $Value
        if (this.callStackInfo.length === 0) {
            throw new Error("호출 스택이 비어있는데 RETURN을 할 수 없습니다.");
        }

        // 0. 현재 프레임 정보를 가져옴
        const frameInfo = this.callStackInfo.pop();

        // 1. 현재 함수의 지역 변수를 스택에서 정리 (sp를 프레임 시작 위치로 복원)
        this.sp = frameInfo.sp_base;

        // 2. 복귀 주소를 pop
        const returnAddress = this._pop();

        // 3. 프레임 포인터를 pop하여 sp를 이전(호출자) 상태로 복원
        const framePointer = this._pop();
        this.sp = framePointer;

        // 4. 반환 값을 (정리된) 스택에 push
        const returnValue = parseInt(parts[1], 10);
        this._push(returnValue); // $RETURN 값을 위한 임시 저장

        // 5. 복귀 주소로 점프
        this.pc = returnAddress;

    } else if (command === 'SET') {
        // SET $VarName = $Value 또는 SET $VarName[$Index] = $Value
        const varName = parts[1];
        const valueToSet = parts[3];

        if (!this.variables.hasOwnProperty(varName)) {
            throw new Error(`선언되지 않은 변수: ${varName}`);
        }
        const stackAddress = this.variables[varName];
        const heapAddress = this.stackView.getInt32(stackAddress);

        let finalValue;
        if (valueToSet === '$RETURN') {
            // 이전에 RETURN이 스택에 넣어둔 값을 꺼내서 사용
            finalValue = this._pop();
        } else {
            finalValue = parseInt(valueToSet, 10);
        }

        // 힙에 실제 값을 씀 (지금은 4바이트 정수만 가정)
        this.heapView.setInt32(heapAddress, finalValue);

    } else if (command === 'RELEASE') {
        // RELEASE $VarName
        const varName = parts[1];
        if (!this.variables.hasOwnProperty(varName)) {
            throw new Error(`선언되지 않은 변수: ${varName}`);
        }
        const stackAddress = this.variables[varName];
        this.free(stackAddress);

    } else {
        // 아직 구현되지 않은 명령어
        throw new Error(`알 수 없는 명령어: ${command}`);
    }
  }
}

module.exports = Simulator;
