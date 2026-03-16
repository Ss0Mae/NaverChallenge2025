const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Git 디렉토리를 찾기 위한 함수
function findGitDir(startDir) {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const gitDir = path.join(currentDir, '.git');
    if (fs.existsSync(gitDir) && fs.lstatSync(gitDir).isDirectory()) {
      return gitDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}


// Git 객체 해시의 앞 2자리와 나머지를 나눔
function readGitObject(hash) {
  const gitDir = findGitDir(process.cwd());

  if (!gitDir) {
    console.error('❌ .git 디렉토리를 찾을 수 없습니다. Git 저장소 내에서 실행해주세요.');
    return;
  }

  const objectPath = path.join(gitDir, 'objects', hash.slice(0, 2), hash.slice(2));

  if (!fs.existsSync(objectPath)) {
    console.error(`❌ Git 객체 '${hash}'를 찾을 수 없습니다.`);
    console.error(`     경로: ${objectPath}`);
    return;
  }


  const compressed = fs.readFileSync(objectPath);
  const decompressed = zlib.inflateSync(compressed);

  const content = decompressed.toString('utf-8');
  const nullByteIndex = content.indexOf('\0');
  const header = content.substring(0, nullByteIndex);
  const body = content.substring(nullByteIndex + 1);
  
  const [type, size] = header.split(' ');

  console.log(`🔹 Type: ${type}`);
  console.log(`🔹 Size: ${size}`);
  console.log(`📦 Content:\n${body}`);
}

// 커맨드라인 인자에서 해시 값을 가져옴
const hash = process.argv[2];

if (!hash) {
  console.log('ℹ️  사용법: node practice.js <git-object-hash>');
  console.log('예: node practice.js 6d9f9aac91e3ec9acf1e611a9c3e483a773e3ebc');
} else {
    readGitObject(hash);
}
