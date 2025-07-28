const { Worker, isMainThread } = require('worker_threads');
const path = require('path');

if (isMainThread) {
  console.log('메인 스레드 시작');

  const NUM_THREADS = 5;
  const ITERATIONS_PER_THREAD = 10;

  // 공유 메모리를 생성합니다. Int32 (4바이트) 크기의 공간 1개를 할당합니다.
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);
  sharedArray[0] = 0; // 카운터를 0으로 초기화

  console.log(`초기 카운터 값: ${sharedArray[0]}`);
  console.log(`${NUM_THREADS}개의 워커가 각각 ${ITERATIONS_PER_THREAD}번씩 카운터를 증가시킵니다.`);
  console.log(`예상 최종 결과: ${NUM_THREADS * ITERATIONS_PER_THREAD}\n`);

  let completedWorkers = 0;

  for (let i = 0; i < NUM_THREADS; i++) {
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: {
        sharedBuffer,
        workerId: i + 1,
        iterations: ITERATIONS_PER_THREAD,
      },
    });

    worker.on('exit', () => {
      completedWorkers++;
      if (completedWorkers === NUM_THREADS) {
        console.log('\n 모든 워커 작업 완료');
        console.log(`최종 카운터 값: ${sharedArray[0]}`);
        console.log('경쟁 상태로 인해 예상 결과와 다른 값이 출력되었습니다.');
      }
    });
  }
}
