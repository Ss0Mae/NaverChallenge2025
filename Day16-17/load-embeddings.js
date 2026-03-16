// load-embeddings.js
import fs from 'fs';
import readline from 'readline';

async function convertNdjsonToStream() {
  const inputPath = './use-embeddings.ndjson';
  const outputPath = './vectors.json';

  if (!fs.existsSync(inputPath)) {
    console.error(`오류: ${inputPath} 파일을 찾을 수 없습니다.`);
    return;
  }

  console.log(`⏳ ${inputPath} 파일을 스트림으로 읽어 ${outputPath} 파일로 변환을 시작합니다...`);

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const outputStream = fs.createWriteStream(outputPath);
  
  let isFirstLine = true;
  let count = 0;

  // JSON 배열 시작
  outputStream.write('[' + '\n');

  for await (const line of rl) {
    try {
      const { question, embedding } = JSON.parse(line);
      const dataToWrite = JSON.stringify([question, embedding]);

      if (!isFirstLine) {
        outputStream.write(',' + '\n');
      }
      
      outputStream.write(dataToWrite);
      isFirstLine = false;
      count++;

      if (count % 10000 === 0) {
        console.log(`  - 처리된 임베딩: ${count}개`);
      }

    } catch (e) {
      console.error('JSON 파싱 오류:', line, e);
    }
  }

  // JSON 배열 종료
  outputStream.write('\n' + ']' + '\n');
  outputStream.end();

  return new Promise((resolve, reject) => {
    outputStream.on('finish', () => {
      console.log(`✅ 변환 완료! 총 ${count}개의 임베딩을 ${outputPath}에 스트림으로 저장했습니다.`);
      resolve();
    });
    outputStream.on('error', reject);
  });
}

convertNdjsonToStream().catch(err => {
  console.error('스크립트 실행 중 오류 발생:', err);
});