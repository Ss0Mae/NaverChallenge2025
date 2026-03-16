const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const fse = require('fs-extra');

const GitRepository = require('./GitRepository');
const { hashObject, readObject } = require('./ObjectManager');
const { readIndex, writeIndex, updateIndex } = require('./IndexManager');
const { getHeadCommit, getHeadRef, updateHead } = require('./RefsManager');

function init() {
  try {
    new GitRepository();
    console.log('이미 Git 저장소가 초기화되어 있습니다.');
  } catch (e) {
    const gitDir = path.join(process.cwd(), '.git');
    fs.mkdirSync(gitDir, { recursive: true, mode: 0o755 });
    fs.mkdirSync(path.join(gitDir, 'objects'), { recursive: true, mode: 0o755 });
    fs.mkdirSync(path.join(gitDir, 'refs', 'heads'), { recursive: true, mode: 0o755 });
    fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');
    console.log(`빈 Git 저장소를 초기화했습니다: ${gitDir}`);
  }
}

function add(filePath) {
  if (!filePath) {
    console.log('추가할 파일을 지정해주세요.');
    return;
  }

  try {
    const repo = new GitRepository();
    const hash = hashObject(repo, filePath);
    console.log(`파일이 객체로 저장되었습니다: ${hash}`);

    updateIndex(repo, filePath, hash);
    console.log(`인덱스가 업데이트되었습니다.`);
  } catch (e) {
    console.error(e.message);
  }
}

function writeTree(repo) {
  const entries = readIndex(repo);

  const treeEntries = entries.map(entry => {
    const mode = entry.mode.toString(8);
    const pathBuffer = Buffer.from(entry.path);
    const sha1Buffer = Buffer.from(entry.sha1, 'hex');
    
    return Buffer.concat([
      Buffer.from(`${mode} `),
      pathBuffer,
      Buffer.from('\0'),
      sha1Buffer
    ]);
  });

  const treeContent = Buffer.concat(treeEntries);
  const header = `tree ${treeContent.length}\0`;
  const treeObject = Buffer.concat([Buffer.from(header), treeContent]);

  const hash = crypto.createHash('sha1').update(treeObject).digest('hex');

  const objectDir = path.join(repo.objectsDir, hash.slice(0, 2));
  const objectFile = path.join(objectDir, hash.slice(2));

  if (!fs.existsSync(objectDir)) {
    fs.mkdirSync(objectDir, { recursive: true, mode: 0o755 });
  }

  fs.writeFileSync(objectFile, zlib.deflateSync(treeObject), { mode: 0o444 });

  return hash;
}

function commit(message) {
  if (!message) {
    console.log("커밋 메시지를 입력해주세요. 예: node my-git.js commit \"커밋 메시지\"");
    return;
  }

  try {
    const repo = new GitRepository();
    const treeHash = writeTree(repo);
    const parentCommit = getHeadCommit(repo);

    const authorName = 'ssomae'; 
    const authorEmail = 'ssomae@example.com';
    const timestamp = Math.floor(Date.now() / 1000);
    const timezone = '+0900'; 

    let commitContent = `tree ${treeHash}\n`;
    if (parentCommit) {
      commitContent += `parent ${parentCommit}\n`;
    }
    commitContent += `author ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n`;
    commitContent += `committer ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n\n`;
    commitContent += `${message}\n`;

    const header = `commit ${Buffer.byteLength(commitContent)}\0`;
    const commitObject = Buffer.concat([Buffer.from(header), Buffer.from(commitContent)]);
    const commitHash = crypto.createHash('sha1').update(commitObject).digest('hex');

    const objectDir = path.join(repo.objectsDir, commitHash.slice(0, 2));
    const objectFile = path.join(objectDir, commitHash.slice(2));

    if (!fs.existsSync(objectDir)) {
      fs.mkdirSync(objectDir, { recursive: true, mode: 0o755 });
    }

    fs.writeFileSync(objectFile, zlib.deflateSync(commitObject), { mode: 0o444 });

    updateHead(repo, commitHash);

    // 커밋 후 인덱스 초기화
    fs.unlinkSync(path.join(repo.gitDir, 'index'));

    console.log(`[${getHeadRef(repo).split('/').pop()} ${commitHash.slice(0, 7)}] ${message}`);
  } catch (e) {
    console.error(e.message);
  }
}

function log() {
  try {
    const repo = new GitRepository();
    let commitHash = getHeadCommit(repo);
    if (!commitHash) {
      console.log('아직 커밋이 없습니다.');
      return;
    }

    while (commitHash) {
      const commitObject = readObject(repo, commitHash);
      if (!commitObject || commitObject.type !== 'commit') break;

      const commitContent = commitObject.content.toString();
      const authorLine = commitContent.match(/^author (.*)$/m);
      const date = new Date(parseInt(authorLine[1].match(/ (\d+) /)[1]) * 1000);
      const message = commitContent.split('\n\n')[1].trim();

      console.log(`\x1b[33mcommit ${commitHash}\x1b[0m`); // 노란색으로 출력
      console.log(`Author: ${authorLine[1]}`);
      console.log(`Date:   ${date.toUTCString()}`);
      console.log(`\n    ${message}\n`);

      const parentMatch = commitContent.match(/^parent (.*)$/m);
      commitHash = parentMatch ? parentMatch[1] : null;
    }
  } catch (e) {
    console.error(e.message);
  }
}

function branch(branchName) {
  try {
    const repo = new GitRepository();
    const refsDir = repo.headsDir;

    if (!branchName) {
      // 브랜치 목록 보여주기
      const currentRef = getHeadRef(repo);
      const currentBranch = currentRef ? currentRef.split('/').pop() : null;
      const branches = fs.readdirSync(refsDir);
      
      branches.forEach(b => {
        if (b === currentBranch) {
          console.log(`* \x1b[32m${b}\x1b[0m`); // 녹색으로 출력
        } else {
          console.log(`  ${b}`);
        }
      });
    } else {
      // 새 브랜치 생성
      const commitHash = getHeadCommit(repo);
      if (!commitHash) {
        console.log('커밋이 없어 브랜치를 만들 수 없습니다.');
        return;
      }
      const newBranchFile = path.join(refsDir, branchName);
      if (fs.existsSync(newBranchFile)) {
        console.log(`브랜치 '${branchName}'가 이미 존재합니다.`);
        return;
      }
      fs.writeFileSync(newBranchFile, `${commitHash}\n`);
      console.log(`브랜치 '${branchName}'가 생성되었습니다.`);
    }
  } catch (e) {
    console.error(e.message);
  }
}

function clone(sourcePath, destinationPath) {
  if (!sourcePath || !destinationPath) {
    console.log('사용법: node my-git-cli.js clone <source-path> <destination-path>');
    return;
  }

  const absSourcePath = path.resolve(sourcePath);
  const absDestinationPath = path.resolve(destinationPath);

  const sourceGitDir = path.join(absSourcePath, '.git');
  if (!fse.existsSync(sourceGitDir)) {
    console.error('소스 경로는 Git 저장소가 아닙니다.');
    return;
  }

  if (fse.existsSync(absDestinationPath)) {
    console.error('목적지 경로가 이미 존재합니다.');
    return;
  }
  fse.mkdirSync(absDestinationPath, { recursive: true });

  const originalCwd = process.cwd();
  try {
    // 1. init
    process.chdir(absDestinationPath);
    init();

    const destGitDir = path.join(absDestinationPath, '.git');

    // 2. 객체 복사
    fse.copySync(path.join(sourceGitDir, 'objects'), path.join(destGitDir, 'objects'));

    // 3. 참조 복사
    fse.copySync(path.join(sourceGitDir, 'refs', 'heads'), path.join(destGitDir, 'refs', 'heads'));

    // 4. HEAD 설정
    const sourceHead = fse.readFileSync(path.join(sourceGitDir, 'HEAD'), 'utf-8');
    fse.writeFileSync(path.join(destGitDir, 'HEAD'), sourceHead);

    console.log(`'${sourcePath}' 저장소를 '${destinationPath}'(으)로 복제했습니다.`);

    // 5. 체크아웃
    const repo = new GitRepository();
    const headCommit = getHeadCommit(repo);
    if (headCommit) {
      checkout(repo, headCommit);
      console.log('워킹 디렉토리를 성공적으로 체크아웃했습니다.');
    }

  } catch (e) {
    console.error('클론 중 오류가 발생했습니다:', e.message);
  } finally {
    process.chdir(originalCwd);
  }
}

function checkout(repo, commitHash) {
  const commit = readObject(repo, commitHash);
  if (!commit || commit.type !== 'commit') {
    console.error('유효하지 않은 커밋입니다.');
    return;
  }

  const treeHash = commit.content.toString().match(/^tree (.*)$/m)[1];
  restoreTree(repo, treeHash, repo.gitDir.replace('/.git', ''));
}

function restoreTree(repo, treeHash, basePath) {
  const treeObject = readObject(repo, treeHash);
  if (!treeObject || treeObject.type !== 'tree') return;

  let entriesBuffer = treeObject.content;
  let offset = 0;

  while (offset < entriesBuffer.length) {
    const spaceIndex = entriesBuffer.indexOf(' ', offset);
    const nullIndex = entriesBuffer.indexOf('\0', spaceIndex);
    
    const mode = entriesBuffer.slice(offset, spaceIndex).toString();
    const name = entriesBuffer.slice(spaceIndex + 1, nullIndex).toString();
    const sha1 = entriesBuffer.slice(nullIndex + 1, nullIndex + 21).toString('hex');

    const fullPath = path.join(basePath, name);

    if (mode === '40000') { // Directory
      fse.ensureDirSync(fullPath);
      restoreTree(repo, sha1, fullPath);
    } else { // File
      const blob = readObject(repo, sha1);
      if (blob && blob.type === 'blob') {
        fs.writeFileSync(fullPath, blob.content);
      }
    }
    offset = nullIndex + 21;
  }
}

const command = process.argv[2];
const argument1 = process.argv[3];
const argument2 = process.argv[4];

switch (command) {
  case 'init':
    init();
    break;
  case 'add':
    add(argument1);
    break;
  case 'commit':
    commit(argument1);
    break;
  case 'log':
    log();
    break;
  case 'branch':
    branch(argument1);
    
    break;
  case 'clone':
    clone(argument1, argument2);
    break;
  default:
    console.log(`알 수 없는 명령어: ${command}`);
    console.log('사용법: node my-git-cli.js <command>');
    break;
}