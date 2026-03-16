
const fs = require('fs');
const path = require('path');

function getHeadCommit(repo) {
  const headRefPath = getHeadRef(repo);
  if (!headRefPath) return null;

  const headFile = path.join(repo.gitDir, headRefPath);
  if (fs.existsSync(headFile)) {
    return fs.readFileSync(headFile, 'utf-8').trim();
  }
  return null;
}

function getHeadRef(repo) {
  const headFile = path.join(repo.gitDir, 'HEAD');
  const content = fs.readFileSync(headFile, 'utf-8').trim();
  if (content.startsWith('ref: ')) {
    return content.split(' ')[1];
  }
  return null; // Detached HEAD 상태는 일단 무시
}

function updateHead(repo, commitHash) {
  const headRefPath = getHeadRef(repo);
  if (headRefPath) {
    fs.writeFileSync(path.join(repo.gitDir, headRefPath), `${commitHash}\n`);
  }
}

module.exports = { getHeadCommit, getHeadRef, updateHead };
