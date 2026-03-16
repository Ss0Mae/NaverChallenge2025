class Looper {
    constructor(interval = 1000) {
        this.actions = [];
        this.interval = interval;
        this.timerId = null;
    }

    add(action) {
        this.actions.push(action);
    }

    start() {
        if (this.timerId) return;

        this.timerId = setInterval(() => {
            this.runActions();
        }, this.interval);
    }

    runActions() {
        this.actions.forEach(action => action());
    }

    stop() {
        clearInterval(this.timerId);
        this.timerId = null;
    }
}

module.exports = Looper;