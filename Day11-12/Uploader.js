const EventEmitter = require('events');
const Queue = require('./Queue');

class Uploader extends EventEmitter {
    constructor() {
        super();
        this.uploadQueue = new Queue();
    }

    requestUpload(video) {
        console.log(`'${video.name}' 업로드 요청이 등록되었습니다.`);
        this.uploadQueue.enqueue(video);
        this.emit('new_request', video);
    }

    getQueue() {
        return this.uploadQueue;
    }
}

module.exports = Uploader;