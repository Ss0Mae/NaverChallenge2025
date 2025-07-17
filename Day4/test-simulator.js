const Simulator = require('./simulator');

function test() {
    console.log('--- 시뮬레이터 테스트 시작 ---');
    const sim = new Simulator();

    try {
        // --- Phase 1: 설정 테스트 ---
        console.log('\n[Phase 1] setSize, reset 테스트');
        sim.setSize("INT", 4);
        sim.setSize("BOOL", 1);
        console.log('✅ setSize 성공: INT, BOOL 타입 등록');
        console.assert(sim.typeSizes.get('INT') === 4, 'INT 사이즈 오류');

        // --- Phase 3: 명령어 실행 테스트 ---
        console.log('\n[Phase 3] locate 및 명령어 실행 테스트');
        sim.locate("main", [
            "VAR A: BOOL[4]", 
            "VAR B: INT", 
            "CALL foo", 
            "SET B = $RETURN"
        ]);
        sim.locate("foo", [
            "VAR K: INT", 
            "RETURN 10"
        ]);
        console.log('✅ locate 성공: main, foo 함수 코드 적재');
        console.assert(sim.functions.get('main') === 0, 'main 함수 주소 오류');
        console.assert(sim.functions.get('foo') === 16, 'foo 함수 주소 오류 (4 * 4)');

        // 실행 시작점(main)으로 PC 설정
        sim.pc = sim.functions.get('main');
        console.log(`\n--- 실행 시작 (PC: ${sim.pc}) ---`);

        // 1. VAR A: BOOL[4]
        sim.execute();
        console.log(`  sp: ${sim.sp}, heapPointer: ${sim.heapPointer}`);
        console.assert(sim.sp === 4, 'VAR A 후 sp 오류');
        console.assert(sim.heapPointer === 32, 'VAR A 후 heapPointer 오류 (8 * 4)');
        console.assert(sim.variables['A'] === 0, '변수 A의 스택 주소 오류');

        // 2. VAR B: INT
        sim.execute();
        console.log(`  sp: ${sim.sp}, heapPointer: ${sim.heapPointer}`);
        console.assert(sim.sp === 8, 'VAR B 후 sp 오류');
        console.assert(sim.heapPointer === 40, 'VAR B 후 heapPointer 오류 (32 + 8)');
        console.assert(sim.variables['B'] === 4, '변수 B의 스택 주소 오류');

        // 3. CALL foo
        const pcBeforeCall = sim.pc; // 8
        const spBeforeCall = sim.sp; // 8
        const expectedReturnAddr = pcBeforeCall + 4; // 12
        sim.execute();
        console.log(`  pc: ${sim.pc}, sp: ${sim.sp}`);
        console.assert(sim.pc === sim.functions.get('foo'), 'CALL 후 pc 점프 오류');
        console.assert(sim.sp === spBeforeCall + 8, 'CALL 후 sp 오류 (FP, 복귀 주소 저장)');
        console.assert(sim.stackView.getInt32(spBeforeCall) === spBeforeCall, '프레임 포인터(FP) 스택 저장 오류');
        console.assert(sim.stackView.getInt32(spBeforeCall + 4) === expectedReturnAddr, '복귀 주소 스택 저장 오류');
        console.assert(sim.callStackInfo[0].name === 'foo', 'callstack 정보 오류');

        // 4. (foo) VAR K: INT
        const spBeforeVarK = sim.sp;
        sim.execute();
        console.log(`  sp: ${sim.sp}, heapPointer: ${sim.heapPointer}`);
        console.assert(sim.sp === spBeforeVarK + 4, 'VAR K 후 sp 오류');
        console.assert(sim.heapPointer === 48, 'VAR K �� heapPointer 오류 (40 + 8)');

        // 5. (foo) RETURN 10
        sim.execute();
        console.log(`  pc: ${sim.pc}, sp: ${sim.sp}`);
        console.assert(sim.pc === expectedReturnAddr, 'RETURN 후 pc 복귀 오류');
        // RETURN 후 sp는 호출자 sp(8) + 반환값(4) = 12가 되어야 함
        console.assert(sim.sp === spBeforeCall + 4, 'RETURN 후 sp 오류'); 
        console.assert(sim.callStackInfo.length === 0, 'RETURN 후 callstack 정보 오류');

        // 6. SET B = $RETURN
        sim.execute();
        const b_stackAddr = sim.variables['B'];
        const b_heapAddr = sim.stackView.getInt32(b_stackAddr);
        const valueInHeap = sim.heapView.getInt32(b_heapAddr);
        console.log(`  B의 힙 주소(${b_heapAddr})에 저장된 값: ${valueInHeap}`);
        console.assert(valueInHeap === 10, 'SET B = $RETURN 값 저장 오류');
        // $RETURN 값을 pop 했으므로 sp는 호출자 sp(8)로 돌아와야 함
        console.assert(sim.sp === spBeforeCall, 'SET 후 sp 오류');

        console.log('\n--- 모든 테스트 통과! ---');

    } catch (e) {
        console.error('\n--- 테스트 실패! ---');
        console.error(e);
    }
}

test();
