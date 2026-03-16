const EventEmitter = require('events');
const Queue = require('./Queue');

const VALIDATION_TIME = 10000;

class Validator extends EventEmitter {
    constructor(id, timer = global) { // 기본값으로 실제 setTimeout을 가진 global 객체 사용
        super();
        this.id = id;
        this.queue = new Queue();
        this.processingCount = 0;
        this.capacity = 1; // 동시에 1개 처리 가능 (요구사항 유지)
        this.timer = timer; // 의존성 주입
    }

    validate(video) {
        this.queue.enqueue(video);
        this.processQueue();
    }

    processQueue() {
        if (this.queue.isEmpty() || this.isBusy()) {
            return;
        }

        while (!this.queue.isEmpty() && !this.isBusy()) {
            this.processingCount++;
            const video = this.queue.dequeue();

            this.emit('validation_start', { ...video, validatorId: this.id });

            this.timer.setTimeout(() => { // 주입받은 타이머 사용
                this.processingCount--;
                this.emit('validation_complete', video);
                this.processQueue(); // 다음 작업 처리
            }, VALIDATION_TIME);
        }
    }

    getQueueLength() {
        return this.queue.isEmpty() ? 0 : this.queue.items.length;
    }

    isBusy() {
        return this.processingCount >= this.capacity;
    }
}

module.exports = Validator;