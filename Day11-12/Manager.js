const Queue = require('./Queue');

class Manager {
    constructor(uploader, converters, validators) {
        this.uploadQueue = uploader.getQueue();
        this.converters = converters;
        this.validators = validators;
        this.conversionQueue = new Queue();
    }

    _findLeastBusyModule(modules) {
        return modules.reduce((prev, curr) => {
            return prev.getQueueLength() < curr.getQueueLength() ? prev : curr;
        });
    }

    checkUploadQueue() {
        if (this.uploadQueue.isEmpty()) {
            return;
        }

        const availableConverter = this._findLeastBusyModule(this.converters);

        if (availableConverter.isBusy()) {
            return;
        }

        const video = this.uploadQueue.dequeue();
        availableConverter.convert(video);
    }

    checkConversionQueue() {
        if (this.conversionQueue.isEmpty()) {
            return;
        }

        const availableValidator = this._findLeastBusyModule(this.validators);

        if (availableValidator.isBusy()) {
            return;
        }

        const video = this.conversionQueue.dequeue();
        availableValidator.validate(video);
    }

    onConversionComplete(video) {
        this.conversionQueue.enqueue(video);
    }
}

module.exports = Manager;