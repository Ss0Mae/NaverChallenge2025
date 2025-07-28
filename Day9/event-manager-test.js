const EventManager = require('./EventManager');

// --- 테스트용 클래스 정의 ---
class Publisher {
    constructor(name) { this.name = name; }
}

class Subscriber {
  constructor(name) {
    this.name = name;
  }

  handleEvent(event) {
    const senderName = event.sender ? event.sender.constructor.name : 'null';
    console.log(` -> [${this.name}]가 "${event.name}" 이벤트를 받음 (from: ${senderName}, data: ${JSON.stringify(event.userData)}, completed: ${event.completed})`);
  }
}

// --- 테스트 시작 ---
console.log('--- EventManager 테스트 시작 ---');

const em = EventManager.sharedInstance();

// --- 테스트 객체 생성 ---
const publisher = new Publisher('테스트 발행자');
const subscriber = new Subscriber('테스트 구독자');

// --- 구독 추가 ---
em.add(subscriber, "test_event", publisher, subscriber.handleEvent);

// --- 이벤트 발행 테스트 ---
console.log('\n--- 동기/비동기/지연 발행 테스트 --- ');

// 1. 동기 발행
em.postEvent("test_event", publisher, { info: '동기 호출' });

// 2. 비동기 발행 (completed = false)
em.postEventAsync("test_event", publisher, { info: '비동기 호출 1' }, false);

// 3. 비동기 발행 (completed = true)
em.postEventAsync("test_event", publisher, { info: '비동기 호출 2' }, true);

// 4. 500ms 지연 발행
em.postEventWithDelay("test_event", publisher, { info: '500ms 지연 호출' }, 500);

console.log('\n이벤트 발행 요청 완료. 비동기/지연된 이벤트 처리를 기다립니다...');

// 비동기 작업이 모두 완료될 수 있도록 1초간 대기 후 테스트를 종료합니다.
setTimeout(() => {
    console.log('\n--- EventManager 테스트 종료 ---');
}, 1000);
