const { expect } = require('chai');
const Converter = require('./Converter');

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

describe('Converter', () => {
  let mockTimer;

  beforeEach(() => {
    mockTimer = new MockTimer();
  });

  it('should process a short video correctly', (done) => {
    const converter = new Converter(1, mockTimer);
    const shortVideo = { id: 1, name: 'short.mp4', type: '단편' };

    converter.on('conversion_complete', (video) => {
      expect(video.id).to.equal(shortVideo.id);
      done();
    });

    converter.convert(shortVideo);
    mockTimer.tickOne();
  });

  it('should process a medium video correctly', (done) => {
    const converter = new Converter(1, mockTimer);
    const mediumVideo = { id: 2, name: 'medium.mp4', type: '중편' };

    converter.on('conversion_complete', (video) => {
      expect(video.id).to.equal(mediumVideo.id);
      done();
    });

    converter.convert(mediumVideo);
    mockTimer.tickOne();
  });

  it('should process a long video correctly', (done) => {
    const converter = new Converter(1, mockTimer);
    const longVideo = { id: 3, name: 'long.mp4', type: '장편' };

    converter.on('conversion_complete', (video) => {
      expect(video.id).to.equal(longVideo.id);
      done();
    });

    converter.convert(longVideo);
    mockTimer.tickOne();
  });

  it('should process two videos simultaneously and queue the third', (done) => {
    const converter = new Converter(1, mockTimer);
    const video1 = { id: 1, type: '단편' };
    const video2 = { id: 2, type: '단편' };
    const video3 = { id: 3, type: '단편' };

    let completedOrder = [];

    converter.on('conversion_complete', (video) => {
      completedOrder.push(video.id);
      if (completedOrder.length === 3) {
        // 최종적으로 모든 영상이 순서에 상관없이 완료되었는지 확인
        expect(completedOrder).to.have.members([1, 2, 3]);
        expect(converter.processingCount).to.equal(0);
        done();
      }
    });

    converter.convert(video1);
    converter.convert(video2);
    converter.convert(video3);

    // 시작 시점의 상태 확인
    expect(converter.processingCount).to.equal(2);
    expect(converter.getQueueLength()).to.equal(1);

    // 모든 타이머 콜백을 실행하여 전체 프로세스를 완료시킴
    mockTimer.tickOne(); // video1 완료, video3 시작
    mockTimer.tickOne(); // video2 완료
    mockTimer.tickOne(); // video3 완료
  });
});
