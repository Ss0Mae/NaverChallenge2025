const { workerData, parentPort } = require('worker_threads');

const { sharedBuffer, workerId, iterations } = workerData;
const sharedArray = new Int32Array(sharedBuffer);

function randomDelay() {
  // 0~5ms 사이의 랜덤 지연을 주어 경쟁 상태 발생 확률을 높입니다.
  return new Promise(resolve => setTimeout(resolve, Math.random() * 5));
}

async function run() {
  for (let i = 0; i < iterations; i++) {
    // --- 경쟁 상태 발생 구간 (Read-Modify-Write) ---
    // 1. 읽기 (Read)
    const currentValue = sharedArray[0];
    console.log(`[워커 ${workerId}] 값 읽음: ${currentValue}`);

    // 2. 수정 (Modify) - 비동기 지연 추가
    await randomDelay();
    const newValue = currentValue + 1;

    // 3. 쓰기 (Write)
    sharedArray[0] = newValue;
    console.log(`[워커 ${workerId}] 값 씀: ${newValue}`);
    // --------------------------------------------------
  }
}

run().then(() => parentPort.close());