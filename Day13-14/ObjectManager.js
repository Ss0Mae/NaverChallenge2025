
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

function hashObject(repo, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const header = `blob ${fileContent.length}\0`;
  const store = Buffer.concat([Buffer.from(header), fileContent]);

  const hash = crypto.createHash('sha1').update(store).digest('hex');

  const objectDir = path.join(repo.objectsDir, hash.slice(0, 2));
  const objectFile = path.join(objectDir, hash.slice(2));

  if (!fs.existsSync(objectDir)) {
    fs.mkdirSync(objectDir, { recursive: true, mode: 0o755 });
  }

  fs.writeFileSync(objectFile, zlib.deflateSync(store), { mode: 0o444 });

  return hash;
}

function readObject(repo, sha1) {
  const objectPath = path.join(repo.objectsDir, sha1.slice(0, 2), sha1.slice(2));

  if (!fs.existsSync(objectPath)) {
    return null;
  }

  const compressed = fs.readFileSync(objectPath);
  const decompressed = zlib.inflateSync(compressed);

  const nullByteIndex = decompressed.indexOf(0);
  const header = decompressed.slice(0, nullByteIndex).toString();
  const content = decompressed.slice(nullByteIndex + 1);
  const [type] = header.split(' ');

  return { type, content };
}

module.exports = { hashObject, readObject };
