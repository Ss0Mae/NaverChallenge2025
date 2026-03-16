const Uploader = require('./Uploader');
const Converter = require('./Converter');
const Validator = require('./Validator');
const Dashboard = require('./Dashboard');
const Looper = require('./Looper');
const Manager = require('./Manager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

let videoIdCounter = 1;
const VIDEO_TYPES = { 1: '단편', 2: '중편', 3: '장편' };

const uploader = new Uploader();
const dashboard = new Dashboard();
const looper = new Looper(1000);

let converters = [];
let validators = [];
let manager;

function setupEventListeners() {
  uploader.on('new_request', (video) => dashboard.addVideo(video));

  converters.forEach((converter) => {
    converter.on('conversion_start', (video) => dashboard.updateToConverting(video));
    converter.on('conversion_complete', (video) => manager.onConversionComplete(video));
  });

  validators.forEach((validator) => {
    validator.on('validation_start', (video) => dashboard.updateToValidating(video));
    validator.on('validation_complete', (video) => dashboard.updateToPublic(video));
  });
}

function startLooper() {
  looper.add(() => manager.checkUploadQueue());
  looper.add(() => manager.checkConversionQueue());
  looper.add(() => {
    dashboard.print();
    rl.prompt(true); // 프롬프트를 다시 표시
  });
  looper.start();
}

function handleUserInput() {
  rl.on('line', (input) => {
    if (input.toLowerCase() === 'exit') {
      looper.stop();
      rl.close();
      return;
    }

    try {
      const [customer, ...requests] = input.split(',');
      if (!customer || requests.length === 0) throw new Error();

      requests.forEach((req) => {
        const [type, count] = req.split(':');
        const videoType = VIDEO_TYPES[type];
        const videoCount = parseInt(count, 10);

        if (!videoType || isNaN(videoCount) || videoCount <= 0) {
          console.log(`잘못된 요청 형식입니다: ${req}`);
          return;
        }

        for (let i = 0; i < videoCount; i++) {
          const video = {
            id: videoIdCounter++,
            name: `${customer}_영상${videoIdCounter - 1}`,
            type: videoType,
            customerId: customer,
          };
          uploader.requestUpload(video);
        }
      });
    } catch (e) {
      console.log("잘못된 입력입니다. '고객ID,유형:개수,유형:개수' 형식으로 입력해주세요. (예: A,1:2,2:1)");
    }
    rl.prompt();
  });
}

function run() {
  console.clear();
  rl.question('변환 모듈 개수를 입력하세요: ', (converterCount) => {
    rl.question('검증 모듈 개수를 입력하세요: ', (validatorCount) => {
      const numConverters = parseInt(converterCount, 10) || 1;
      const numValidators = parseInt(validatorCount, 10) || 1;

      for (let i = 0; i < numConverters; i++) {
        converters.push(new Converter(i + 1));
      }
      for (let i = 0; i < numValidators; i++) {
        validators.push(new Validator(i + 1));
      }

      manager = new Manager(uploader, converters, validators);

      console.clear();
      console.log(`--- 동영상 처리 시뮬레이터 시작 ---`);
      console.log(`변환 모듈 ${numConverters}개, 검증 모듈 ${numValidators}개`);
      console.log('고객별로 업로드할 영상을 입력하세요. 예) A,1:2,2:1 (종료: exit)');
      console.log('\n'); // 대시보드와 구분을 위한 공백

      setupEventListeners();
      handleUserInput();
      startLooper(); // 루퍼를 가장 마지막에 시작

      rl.prompt();
    });
  });
}

run();
