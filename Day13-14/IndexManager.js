
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readIndex(repo) {
  const indexPath = path.join(repo.gitDir, 'index');
  if (!fs.existsSync(indexPath)) {
    return [];
  }

  const buffer = fs.readFileSync(indexPath);
  const signature = buffer.slice(0, 4).toString();
  if (signature !== 'DIRC') {
    throw new Error('잘못된 인덱스 파일 시그니처입니다.');
  }

  const version = buffer.readInt32BE(4);
  if (version !== 2) {
    throw new Error(`지원하지 않는 인덱스 버전입니다: ${version}`);
  }

  const entryCount = buffer.readInt32BE(8);
  const entries = [];
  let offset = 12;

  for (let i = 0; i < entryCount; i++) {
    const entry = {};
    entry.ctime = buffer.readInt32BE(offset);
    entry.ctime_nsec = buffer.readInt32BE(offset + 4);
    entry.mtime = buffer.readInt32BE(offset + 8);
    entry.mtime_nsec = buffer.readInt32BE(offset + 12);
    entry.dev = buffer.readInt32BE(offset + 16);
    entry.ino = buffer.readInt32BE(offset + 20);
    entry.mode = buffer.readInt32BE(offset + 24);
    entry.uid = buffer.readInt32BE(offset + 28);
    entry.gid = buffer.readInt32BE(offset + 32);
    entry.size = buffer.readInt32BE(offset + 36);
    entry.sha1 = buffer.slice(offset + 40, offset + 60).toString('hex');
    const flags = buffer.readInt16BE(offset + 60);
    const pathNameLength = flags & 0xfff;

    const pathNameStart = offset + 62;
    const pathNameEnd = pathNameStart + pathNameLength;
    entry.path = buffer.slice(pathNameStart, pathNameEnd).toString();

    const entryLength = 62 + pathNameLength;
    const padding = 8 - (entryLength % 8) || 8;
    offset += entryLength + padding;

    entries.push(entry);
  }

  return entries;
}

function writeIndex(repo, entries) {
  const indexPath = path.join(repo.gitDir, 'index');
  let buffer = Buffer.alloc(12);

  buffer.write('DIRC', 0);
  buffer.writeInt32BE(2, 4);
  buffer.writeInt32BE(entries.length, 8);

  const entryBuffers = [];
  entries.forEach(entry => {
    const pathBuffer = Buffer.from(entry.path);
    const pathLength = pathBuffer.length;
    const entryLength = 62 + pathLength;
    const padding = 8 - (entryLength % 8) || 8;
    const totalLength = entryLength + padding;

    const entryBuffer = Buffer.alloc(totalLength);
    let offset = 0;

    entryBuffer.writeInt32BE(entry.ctime, offset);
    entryBuffer.writeInt32BE(entry.ctime_nsec, offset + 4);
    entryBuffer.writeInt32BE(entry.mtime, offset + 8);
    entryBuffer.writeInt32BE(entry.mtime_nsec, offset + 12);
    entryBuffer.writeInt32BE(entry.dev, offset + 16);
    entryBuffer.writeInt32BE(entry.ino, offset + 20);
    entryBuffer.writeInt32BE(entry.mode, offset + 24);
    entryBuffer.writeInt32BE(entry.uid, offset + 28);
    entryBuffer.writeInt32BE(entry.gid, offset + 32);
    entryBuffer.writeInt32BE(entry.size, offset + 36);
    Buffer.from(entry.sha1, 'hex').copy(entryBuffer, offset + 40);
    entryBuffer.writeInt16BE(pathLength, offset + 60);
    pathBuffer.copy(entryBuffer, offset + 62);

    entryBuffers.push(entryBuffer);
  });

  const contentBuffer = Buffer.concat([buffer, ...entryBuffers]);
  const hash = crypto.createHash('sha1').update(contentBuffer).digest();
  const finalBuffer = Buffer.concat([contentBuffer, hash]);

  fs.writeFileSync(indexPath, finalBuffer);
}

function updateIndex(repo, filePath, sha1) {
  const entries = readIndex(repo);
  const stats = fs.statSync(filePath);

  const newEntry = {
    ctime: Math.floor(stats.ctimeMs / 1000),
    ctime_nsec: (stats.ctimeMs % 1000) * 1e6,
    mtime: Math.floor(stats.mtimeMs / 1000),
    mtime_nsec: (stats.mtimeMs % 1000) * 1e6,
    dev: stats.dev,
    ino: stats.ino,
    mode: stats.mode,
    uid: stats.uid,
    gid: stats.gid,
    size: stats.size,
    sha1: sha1,
    path: filePath,
  };

  const entryIndex = entries.findIndex(e => e.path === filePath);
  if (entryIndex > -1) {
    entries[entryIndex] = newEntry;
  } else {
    entries.push(newEntry);
  }

  // 경로 순으로 정렬
  entries.sort((a, b) => a.path.localeCompare(b.path));

  writeIndex(repo, entries);
}

module.exports = { readIndex, writeIndex, updateIndex };
