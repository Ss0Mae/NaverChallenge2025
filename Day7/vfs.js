const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { File, Directory, FileSystem } = require("./vfs-core.js");

const VFS_FILE_PATH = path.join(__dirname, "vfs.json");

let fileSystem = null;

function saveFileSystem() {
  if (!fileSystem) return;
  const replacer = (key, value) => {
    if (value instanceof Map) {
      return { _type: "map", data: [...value] };
    }
    return value;
  };
  const data = JSON.stringify(fileSystem, replacer, 2);
  fs.writeFileSync(VFS_FILE_PATH, data);
}

function loadFileSystem() {
  if (!fs.existsSync(VFS_FILE_PATH)) {
    console.log("저장된 파일 시스템이 없습니다.");
    console.log("파일 시스템의 최대 크기를 입력해 주세요. 예: init 500M");
    return;
  }

  const data = fs.readFileSync(VFS_FILE_PATH);
  try {
    const reviver = (key, value) => {
      if (value && value._type === "map") {
        return new Map(value.data);
      }
      return value;
    };

    const parsedData = JSON.parse(data, reviver);
    if (!parsedData) return;

    fileSystem = new FileSystem(parsedData.maxSize);
    fileSystem.usedSize = parsedData.usedSize;

    function reconstructNode(nodeData) {
      if (nodeData.type === "directory") {
        const dir = new Directory(nodeData.name);
        dir.children = new Map();
        if (nodeData.children && nodeData.children.size > 0) {
          for (const [name, childData] of nodeData.children) {
            dir.children.set(name, reconstructNode(childData));
          }
        }
        return dir;
      }
      return new File(nodeData.name, nodeData.content, nodeData.encoding);
    }

    fileSystem.root = reconstructNode(parsedData.root);
    console.log("파일 시스템을 성공적으로 불러왔습니다.");
  } catch (e) {
    console.error("vfs.json 파일을 읽는 중 오류가 발생했습니다. 파일을 삭제하고 다시 시도하세요.", e);
    fileSystem = null;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("my-vfs> ");

loadFileSystem();
rl.prompt();

rl.on("line", (input) => {
  const [command, ...args] = input.trim().split(/\s+/g);

  if (!fileSystem && command !== "init" && command !== "exit") {
    console.log("파일 시스템이 초기화되지 않았습니다. `init <size>` 명령어를 사용하세요.");
    rl.prompt();
    return;
  }

  switch (command) {
    case "init":
      const [maxSizeStr] = args;
      if (!maxSizeStr) {
        console.log("사용법: init <size>");
        break;
      }
      const size = parseInt(maxSizeStr, 10);
      fileSystem = new FileSystem(size);
      saveFileSystem();
      console.log(`${size} 바이트로 파일 시스템 초기화를 완료했습니다.`);
      break;

    case "mkdir":
      const [rawDirPath] = args;
      if (!rawDirPath) {
        console.log("mkdir: 피연산자가 없습니다");
        break;
      }
      const dirPath = rawDirPath.startsWith("/") ? rawDirPath : path.join("/", rawDirPath);
      const parentPath = path.dirname(dirPath);
      const dirName = path.basename(dirPath);
      const parent = fileSystem._findNode(parentPath);

      if (!parent || parent.type !== "directory") {
        console.log(`mkdir: '${parentPath}' 경로를 찾을 수 없습니다.`);
        break;
      }
      if (parent.children.has(dirName)) {
        console.log(`mkdir: '${dirPath}'가 이미 존재합니다.`);
        break;
      }

      parent.children.set(dirName, new Directory(dirName));
      saveFileSystem();
      console.log(`디렉토리 '${dirPath}'를 생성했습니다.`);
      break;

    case "create":
      const [rawCreateDirPath, createFileName, ...createContentParts] = args;
      if (!rawCreateDirPath || !createFileName) {
        console.log('사용법: create <디렉토리 경로> <파일 이름> [내용]');
        break;
      }
      const createDirPath = rawCreateDirPath.startsWith("/") ? rawCreateDirPath : path.join("/", rawCreateDirPath);
      const createParentDir = fileSystem._findNode(createDirPath);
      const createContent = createContentParts.join(" ").replace(/^"|"$/g, "");

      if (!createParentDir || createParentDir.type !== "directory") {
        console.log(`create: '${createDirPath}' 경로를 찾을 수 없습니다.`);
        break;
      }
      if (!createFileName.endsWith(".txt")) {
        console.log("create: 텍스트 파일은 .txt 확장자를 가져야 합니다.");
        break;
      }
      if (fileSystem.usedSize + createContent.length > fileSystem.maxSize) {
        console.log("create: 공간이 부족합니다.");
        break;
      }

      const newFile = new File(createFileName, createContent, "utf8");
      createParentDir.children.set(createFileName, newFile);
      fileSystem.usedSize += newFile.size;
      saveFileSystem();
      console.log(`파일 '${path.join(createDirPath, createFileName)}'를 생성했습니다. 남은 공간: ${fileSystem.maxSize - fileSystem.usedSize} 바이트`);
      break;

    case "list":
      const [rawListPath = "/"] = args;
      const listPath = rawListPath.startsWith("/") ? rawListPath : path.join("/", rawListPath);
      const node = fileSystem._findNode(listPath);

      if (!node || node.type !== "directory") {
        console.log(`list: '${listPath}'를 찾을 수 없거나 디렉토리가 아닙니다.`);
        break;
      }

      if (node.children.size === 0) {
        console.log("파일이 없습니다.");
      } else {
        console.log("이름              타입      크기");
        console.log("----------------------------------");
        for (const [name, child] of node.children) {
          const type = child.type.padEnd(10, " ");
          const size = child.size === undefined ? "" : child.size;
          console.log(`${name.padEnd(18, " ")}${type}${size}`);
        }
      }
      console.log(`\n사용 가능 공간: ${fileSystem.maxSize - fileSystem.usedSize} / ${fileSystem.maxSize} 바이트`);
      break;

    case "read":
      const [rawReadPath] = args;
      if (!rawReadPath) {
        console.log("read: 파일 피연산자가 없습니다");
        break;
      }
      const readPath = rawReadPath.startsWith("/") ? rawReadPath : path.join("/", rawReadPath);
      const fileNode = fileSystem._findNode(readPath);

      if (!fileNode || fileNode.type !== "file") {
        console.log(`read: '${readPath}' 파일을 찾을 수 없습니다.`);
        break;
      }

      if (fileNode.encoding === "base64") {
        console.log("[Binary File]");
      } else {
        console.log(fileNode.content);
      }
      break;

    case "export":
      const [rawVfsPath, hostPath] = args;
      if (!rawVfsPath || !hostPath) {
        console.log("사용법: export <vfsPath> <hostPath>");
        break;
      }
      const vfsPath = rawVfsPath.startsWith("/") ? rawVfsPath : path.join("/", rawVfsPath);
      const nodeToExport = fileSystem._findNode(vfsPath);

      if (!nodeToExport || nodeToExport.type !== "file") {
        console.log(`export: '${vfsPath}'에서 파일을 찾을 수 없습니다.`);
        break;
      }
      try {
        const buffer = Buffer.from(nodeToExport.content, nodeToExport.encoding);
        fs.writeFileSync(hostPath, buffer);
        console.log(`'${vfsPath}'를 '${hostPath}'로 내보냈습니다.`);
      } catch (e) {
        console.log(`파일 내보내기 오류: ${e.message}`);
      }
      break;

    case "import":
      const [hostImportPath, rawVfsImportPath] = args;
      if (!hostImportPath || !rawVfsImportPath) {
        console.log("사용법: import <hostPath> <vfsPath>");
        break;
      }
      const vfsImportPath = rawVfsImportPath.startsWith("/") ? rawVfsImportPath : path.join("/", rawVfsImportPath);

      try {
        if (!fs.existsSync(hostImportPath)) {
          console.log(`import: '${hostImportPath}'에서 호스트 파일을 찾을 수 없습니다.`);
          break;
        }
        const buffer = fs.readFileSync(hostImportPath);
        const content = buffer.toString("base64");
        const fileSize = buffer.byteLength;

        if (fileSystem.usedSize + fileSize > fileSystem.maxSize) {
          console.log("import: 가상 파일 시스템에 공간이 부족합니다.");
          break;
        }
        const vfsParentPath = path.dirname(vfsImportPath);
        const vfsFileName = path.basename(vfsImportPath);
        const parentNode = fileSystem._findNode(vfsParentPath);

        if (!parentNode || parentNode.type !== "directory") {
          console.log(`import: VFS 경로를 찾을 수 없거나 디렉토리가 아닙니다: '${vfsParentPath}'`);
          break;
        }
        if (parentNode.children.has(vfsFileName)) {
          console.log(`import: '${vfsImportPath}'에 파일이나 디렉토리가 이미 존재합니다.`);
          break;
        }

        const newFile = new File(vfsFileName, content, "base64");
        parentNode.children.set(vfsFileName, newFile);
        fileSystem.usedSize += fileSize;
        saveFileSystem();
        console.log(`'${hostImportPath}'를 '${vfsImportPath}'로 가져왔습니다.`);
      } catch (e) {
        console.log(`파일 가져오기 오류: ${e.message}`);
      }
      break;

    case "exit":
      console.log("파일 시스템을 저장하고 종료합니다...");
      saveFileSystem();
      rl.close();
      break;

    default:
      console.log(`알 수 없는 명령어: ${command}`);
      break;
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});