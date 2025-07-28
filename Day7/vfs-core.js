class File {
  constructor(name, content = "", encoding = "utf8") {
    this.type = "file";
    this.name = name;
    this.content = content;
    this.encoding = encoding; // 'utf8' or 'base64'
    this.size = Buffer.byteLength(content, encoding);
  }
}

class Directory {
  constructor(name) {
    this.type = "directory";
    this.name = name;
    this.children = new Map();
  }
}

class FileSystem {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.usedSize = 0;
    this.root = new Directory("/");
  }

  _findNode(p) {
    if (p === "/") return this.root;
    const parts = p.split("/").filter(Boolean);
    let currentNode = this.root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!currentNode.children.has(part)) {
        return null; // Not found
      }
      currentNode = currentNode.children.get(part);
      if (currentNode.type === "file" && i < parts.length - 1) {
        return null; // Path goes through a file
      }
    }
    return currentNode;
  }
}

module.exports = { File, Directory, FileSystem };
