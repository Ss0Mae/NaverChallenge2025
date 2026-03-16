const fs = require('fs');

function readIndexHeader() {
  const data = fs.readFileSync('.git/index');

  const signature = data.toString('utf-8', 0, 4);
  const version = data.readUInt32BE(4);
  const entryCount = data.readUInt32BE(8);

  console.log(`🔹 Signature: ${signature}`); // DIRC
  console.log(`🔹 Version: ${version}`); // usually 2
  console.log(`📦 Entry Count: ${entryCount}`);
}

readIndexHeader();
