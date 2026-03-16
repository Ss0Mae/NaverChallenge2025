const INSTRUCTION_TYPE = {
    LOAD: 'LOAD',
    STORE: 'STORE',
    ADD: 'ADD',
    SUB: 'SUB',
    MOV: 'MOV',
    UNKNOWN: 'UNKNOWN'
};

function toRegisterName(regNumber) {
    if (regNumber >= 1 && regNumber <= 7) {
        return `R${regNumber}`;
    }
    throw new Error(`유효하지 않은 레지스터 번호입니다: ${regNumber}`);
}

function decode(instruction) {
    const opcode = (instruction >> 12) & 0xF;

    try {
        switch (opcode) {
            case 0b0001: { // LOAD
                const dst = toRegisterName((instruction >> 9) & 0x7);
                const base = toRegisterName((instruction >> 6) & 0x7);
                const offset = toRegisterName(instruction & 0x7);
                return { type: INSTRUCTION_TYPE.LOAD, dst, src1: base, src2: offset };
            }
            case 0b0011: { // STORE
                const src = toRegisterName((instruction >> 9) & 0x7);
                const base = toRegisterName((instruction >> 6) & 0x7);
                const offset = toRegisterName(instruction & 0x7);
                return { type: INSTRUCTION_TYPE.STORE, dst: src, src1: base, src2: offset }; // dst is used as src here
            }
            case 0b0111: { // ADD
                const dst = toRegisterName((instruction >> 9) & 0x7);
                const src1 = toRegisterName((instruction >> 6) & 0x7);
                const src2 = toRegisterName(instruction & 0x7);
                return { type: INSTRUCTION_TYPE.ADD, dst, src1, src2 };
            }
            case 0b1010: { // SUB
                const dst = toRegisterName((instruction >> 9) & 0x7);
                const src1 = toRegisterName((instruction >> 6) & 0x7);
                const value = instruction & 0b11111;
                return { type: INSTRUCTION_TYPE.SUB, dst, src1, src2: value };
            }
            case 0b1011: { // MOV
                const dst = toRegisterName((instruction >> 9) & 0x7);
                const value = instruction & 0x1FF;
                return { type: INSTRUCTION_TYPE.MOV, dst, src1: value };
            }
            default:
                return { type: INSTRUCTION_TYPE.UNKNOWN };
        }
    } catch (error) {
        console.error(`명령어 디코딩 오류: ${error.message}, 명령어: ${instruction.toString(2).padStart(16, '0')}`);
        return { type: INSTRUCTION_TYPE.UNKNOWN };
    }
}

module.exports = { decode, INSTRUCTION_TYPE };