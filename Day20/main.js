const CPU = require('./CPU.js');

// 예제 프로그램 (기계어)
// 0x0000: MOV R4, 0x00A0  => 1011 100 000010100000 => 0xB4A0 (잘못된 표현, 9비트 값)
// MOV R4, 160 => 1011 100 010100000 => 0xB940
const program = [
    0b10111000010100000, // MOV R4, 160 (0xA0)
    0b10111010000000010, // MOV R5, 2
    0b00010011001010000, // LOAD R1, R4, R5 (메모리[162]의 값을 R1으로)
    0b01110100011000000, // ADD R2, R1, R4
    0b10100110010100010, // SUB R3, R1, R2
    0b00110111001010000, // STORE R3, R4, R5 (R3 값을 메모리[162]에 저장)
    0, // Halt
];

function main() {
    const cpu = new CPU();

    // 예제 시나리오에 따라 특정 메모리 주소에 값을 미리 설정
    // (base. Reg + offset. Reg) = 0xA0 + 2 = 0xA2
    cpu.memory.write(0xA2, 123); // 메모리 162번지에 123 저장

    console.log('--- 프로그램 시작 전 ---');
    cpu.dumpRegisters();
    console.log(`메모리 [0xA2]: ${cpu.memory.read(0xA2)}`);
    console.log('----------------------\n');

    cpu.loadProgram(program);
    cpu.run();

    console.log('--- 프로그램 종료 후 ---');
    console.log(`메모리 [0xA2]: ${cpu.memory.read(0xA2)}`);
    console.log('----------------------');
}

main();
