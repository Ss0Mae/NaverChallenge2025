class EventManager {
  // 싱글톤 인스턴스를 저장할 private 정적 변수
  static #instance = null;

  // 구독자 정보를 저장할 배열
  #subscribers;

  /**
   * EventManager의 생성자는 private으로 처리하여
   * 외부에서 `new` 키워드로 인스턴스를 생성하는 것을 방지합니다.
   */
  constructor() {
    if (EventManager.#instance) {
      throw new Error('싱글톤 클래스는 new로 인스턴스를 생성할 수 없습니다. sharedInstance()를 사용하세요.');
    }
    this.#subscribers = [];
    console.log('EventManager 인스턴스가 생성되었습니다.');
  }

  /**
   * EventManager의 싱글톤 인스턴스를 반환합니다.
   * @returns {EventManager}
   */
  static sharedInstance() {
    if (!EventManager.#instance) {
      EventManager.#instance = new EventManager();
    }
    return EventManager.#instance;
  }

  /**
   * 이벤트 구독자를 추가합니다.
   * @param {object} subscriber - 구독을 요청하는 객체 (고유 식별용)
   * @param {string} eventName - 구독할 이벤트 이름. ""는 모든 이벤트를 의미.
   * @param {object | null} sender - 이벤트를 발행하는 객체. null은 모든 발행자를 의미.
   * @param {function} handler - 이벤트 발생 시 실행될 콜백 함수.
   */
  add(subscriber, eventName, sender, handler) {
    const subscription = {
      subscriber,
      eventName: eventName || '',
      sender,
      handler,
    };
    this.#subscribers.push(subscription);
    console.log(`[구독 추가] ${subscriber.constructor.name}가 "${eventName || '모든'}" 이벤트를 구독했습니다.`);
  }

  /**
   * 특정 구독자의 모든 구독을 제거합니다.
   * @param {object} subscriber - 구독을 취소할 객체
   */
  remove(subscriber) {
    const initialCount = this.#subscribers.length;
    this.#subscribers = this.#subscribers.filter(
      (sub) => sub.subscriber !== subscriber
    );
    const removedCount = initialCount - this.#subscribers.length;
    if (removedCount > 0) {
      console.log(`[구독 제거] ${subscriber.constructor.name}의 구독 ${removedCount}건이 제거되었습니다.`);
    }
  }

  /**
   * 이벤트를 동기적으로 발행합니다.
   * @param {string} eventName - 발행할 이벤트 이름
   * @param {object} sender - 이벤트를 발행하는 객체
   * @param {object} [userData={}] - 함께 전달할 추가 데이터
   */
  postEvent(eventName, sender, userData = {}) {
    console.log(`\n[이벤트 발행] "${eventName}" from ${sender.constructor.name}`);

    const event = {
      name: eventName,
      sender: sender,
      userData: userData,
      completed: true, // 동기 방식에서는 항상 true
    };

    const targetSubscribers = this.#subscribers.filter(sub => {
      const eventNameMatch = sub.eventName === '' || sub.eventName === eventName;
      const senderMatch = sub.sender === null || sub.sender === sender;
      return eventNameMatch && senderMatch;
    });

    if (targetSubscribers.length === 0) {
        console.log('-> 해당 이벤트를 수신할 구독자가 없습니다.');
        return;
    }

    targetSubscribers.forEach(sub => {
        sub.handler.call(sub.subscriber, event);
    });
  }

  /**
   * 이벤트를 비동기적으로 발행합니다.
   * @param {string} eventName - 발행할 이벤트 이름
   * @param {object} sender - 이벤트를 발행하는 객체
   * @param {object} [userData={}] - 함께 전달할 추가 데이터
   * @param {boolean} [completed=true] - 연속된 이벤트의 마지막인지 여부
   */
  postEventAsync(eventName, sender, userData = {}, completed = true) {
    console.log(`\n[이벤트 발행 (비동기)] "${eventName}" from ${sender.constructor.name}`);
    this.#postEventWithDelay(eventName, sender, userData, 0, completed);
  }

  /**
   * 이벤트를 지정된 시간 후에 비동기적으로 발행합니다.
   * @param {string} eventName - 발행할 이벤트 이름
   * @param {object} sender - 이벤트를 발행하는 객체
   * @param {object} [userData={}] - 함께 전달할 추가 데이터
   * @param {number} [delayInMs=0] - 지연 시간 (밀리초)
   */
  postEventWithDelay(eventName, sender, userData = {}, delayInMs = 0) {
    console.log(`\n[이벤트 발행 (지연 ${delayInMs}ms)] "${eventName}" from ${sender.constructor.name}`);
    this.#postEventWithDelay(eventName, sender, userData, delayInMs, true);
  }

  #postEventWithDelay(eventName, sender, userData, delayInMs, completed) {
    const event = {
      name: eventName,
      sender: sender,
      userData: userData,
      completed: completed,
    };

    const targetSubscribers = this.#subscribers.filter(sub => {
      const eventNameMatch = sub.eventName === '' || sub.eventName === eventName;
      const senderMatch = sub.sender === null || sub.sender === sender;
      return eventNameMatch && senderMatch;
    });

    if (targetSubscribers.length === 0) {
        console.log('-> 해당 이벤트를 수신할 구독자가 없습니다.');
        return;
    }

    setTimeout(() => {
        console.log(`\n[이벤트 처리 (${delayInMs}ms 지연)] "${eventName}" from ${sender.constructor.name}`);
        targetSubscribers.forEach(sub => {
            sub.handler.call(sub.subscriber, event);
        });
    }, delayInMs);
  }

  /**
   * 현재 모든 구독자 정보를 문자열로 반환합니다.
   * @returns {string}
   */
  description() {
    if (this.#subscribers.length === 0) {
      return '현재 등록된 구독자가 없습니다.';
    }
    return this.#subscribers
      .map((sub, index) => {
        const senderName = sub.sender ? sub.sender.constructor.name : 'null';
        return `Subscriber#${index + 1}: eventName = "${sub.eventName || ''}", sender = ${senderName}`;
      })
      .join('\n');
  }
}

module.exports = EventManager;
