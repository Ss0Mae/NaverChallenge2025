const EventEmitter = require('events');
const Queue = require('./Queue');

const CONVERSION_TIME = {
    '단편': 3000,
    '중편': 7000,
    '장편': 15000,
};

class Converter extends EventEmitter {
    constructor(id, timer = global) { // 기본값으로 실제 setTimeout을 가진 global 객체 사용
        super();
        this.id = id;
        this.queue = new Queue();
        this.processingCount = 0;
        this.capacity = 2; // 동시에 2개 처리 가능
        this.timer = timer; // 의존성 주입
    }

    convert(video) {
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

            this.emit('conversion_start', { ...video, converterId: this.id });

            this.timer.setTimeout(() => { // 주입받은 타이머 사용
                this.processingCount--;
                this.emit('conversion_complete', video);
                this.processQueue(); // 다음 작업 처리
            }, CONVERSION_TIME[video.type]);
        }
    }

    getQueueLength() {
        return this.queue.isEmpty() ? 0 : this.queue.items.length;
    }

    isBusy() {
        return this.processingCount >= this.capacity;
    }
}

module.exports = Converter;