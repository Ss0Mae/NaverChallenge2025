const { expect } = require('chai');
const Validator = require('./Validator');

// 테스트를 위한 가짜 타이머 (Mock Timer)
class MockTimer {
  constructor() {
    this.callbacks = [];
  }

  setTimeout(callback, ms) {
    this.callbacks.push(callback);
  }

  tickOne() {
    if (this.callbacks.length > 0) {
      this.callbacks.shift()();
    }
  }
}

describe('Validator', () => {
  let mockTimer;

  beforeEach(() => {
    mockTimer = new MockTimer();
  });

  it('should process a video correctly', (done) => {
    const validator = new Validator(1, mockTimer);
    const video = { id: 1, name: 'video.mp4' };

    let startEventCalled = false;

    validator.on('validation_start', (v) => {
      expect(v.id).to.equal(video.id);
      expect(v.validatorId).to.equal(1);
      startEventCalled = true;
    });

    validator.on('validation_complete', (v) => {
      expect(startEventCalled).to.be.true;
      expect(v.id).to.equal(video.id);
      done();
    });

    validator.validate(video);
    mockTimer.tickOne();
  });
});
