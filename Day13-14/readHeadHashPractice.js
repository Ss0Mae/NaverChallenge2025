const fs = require('fs');
const path = require('path');

function readHeadCommit() {
  const gitDir = path.join(process.cwd(), '.git');
  const headPath = path.join(gitDir, 'HEAD');

  const headContent = fs.readFileSync(headPath, 'utf-8').trim();

  if (headContent.startsWith('ref:')) {
    const refPath = headContent.split(' ')[1];
    const fullRefPath = path.join(gitDir, refPath);
    const commitHash = fs.readFileSync(fullRefPath, 'utf-8').trim();

    console.log(`🧭 현재 브랜치: ${refPath.split('/').pop()}`);
    console.log(`🔗 최신 커밋 해시: ${commitHash}`);
  } else {
    console.log(`🧷 Detached HEAD 상태입니다.`);
    console.log(`🔗 현재 HEAD 커밋 해시: ${headContent}`);
  }
}

readHeadCommit();
