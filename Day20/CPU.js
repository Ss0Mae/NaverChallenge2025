const Memory = require('./Memory.js');
const Registers = require('./Registers.js');
const { decode, INSTRUCTION_TYPE } = require('./InstructionDecoder.js');

class CPU {
    constructor() {
        this.memory = new Memory();
        this.registers = new Registers();
    }

    loadProgram(program) {
        this.memory.load(program);
    }

    fetch() {
        const pc = this.registers.get('PC');
        const instruction = this.memory.read(pc);
        this.registers.incrementPC();
        return instruction;
    }

    execute(instruction) {
        if (instruction === 0) { // 프로그램 종료 조건
            return false;
        }

        const decoded = decode(instruction);

        switch (decoded.type) {
            case INSTRUCTION_TYPE.LOAD:
                const baseAddr = this.registers.get(decoded.src1);
                const offsetAddr = this.registers.get(decoded.src2);
                const loadAddr = baseAddr + offsetAddr;
                const dataToLoad = this.memory.read(loadAddr);
                this.registers.set(decoded.dst, dataToLoad);
                break;

            case INSTRUCTION_TYPE.STORE:
                const dataToStore = this.registers.get(decoded.dst); // Note: dst is used as src
                const baseAddrStore = this.registers.get(decoded.src1);
                const offsetAddrStore = this.registers.get(decoded.src2);
                const storeAddr = baseAddrStore + offsetAddrStore;
                this.memory.write(storeAddr, dataToStore);
                break;

            case INSTRUCTION_TYPE.ADD:
                const val1Add = this.registers.get(decoded.src1);
                const val2Add = this.registers.get(decoded.src2);
                this.registers.set(decoded.dst, val1Add + val2Add);
                break;

            case INSTRUCTION_TYPE.SUB:
                const val1Sub = this.registers.get(decoded.src1);
                const val2Sub = decoded.src2;
                this.registers.set(decoded.dst, val1Sub - val2Sub);
                break;

            case INSTRUCTION_TYPE.MOV:
                this.registers.set(decoded.dst, decoded.src1);
                break;

            case INSTRUCTION_TYPE.UNKNOWN:
                console.error(`알 수 없는 명령어입니다: ${instruction.toString(2).padStart(16, '0')}`);
                return false; // 실행 중단
        }
        return true;
    }

    run() {
        let running = true;
        while(running) {
            const instruction = this.fetch();
            running = this.execute(instruction);
        }
        console.log("프로그램 실행이 종료되었습니다.");
        this.dumpRegisters();
    }

    dumpRegisters() {
        console.log('\n--- 레지스터 상태 ---');
        this.registers.registerNames.forEach(name => {
            console.log(`${name}: 0x${this.registers.get(name).toString(16).padStart(4, '0')} (${this.registers.get(name)})`);
        });
        console.log('--------------------\n');
    }
}

module.exports = CPU;