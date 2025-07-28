const { File, Directory, FileSystem } = require("./vfs-core.js");
const path = require("path");

describe("Virtual File System", () => {
  let fs;

  beforeEach(() => {
    fs = new FileSystem(1000); // 테스트 크기
  });

  test("루트디렉토리를 초기화 해야합니다", () => {
    expect(fs.root).toBeInstanceOf(Directory);
    expect(fs.root.name).toBe("/");
    expect(fs.maxSize).toBe(1000);
  });

  describe("mkdir", () => {
    test("루트 디렉토리 밑에 파일 만들기", () => {
      const parent = fs.root;
      const dirName = "test-dir";
      parent.children.set(dirName, new Directory(dirName));
      const foundNode = fs._findNode("/test-dir");
      expect(foundNode).toBeInstanceOf(Directory);
      expect(foundNode.name).toBe(dirName);
    });

    test("중첩 디렉토리 만들기", () => {
      fs.root.children.set("parent", new Directory("parent"));
      const parent = fs._findNode("/parent");
      parent.children.set("child", new Directory("child"));
      const foundNode = fs._findNode("/parent/child");
      expect(foundNode).toBeInstanceOf(Directory);
      expect(foundNode.name).toBe("child");
    });

    test("존재하지 않는 디렉토리 찾기", () => {
      const foundNode = fs._findNode("/non-existent");
      expect(foundNode).toBeNull();
    });
  });

  describe("create (file)", () => {
    test("파일 만들기", () => {
      const parent = fs.root;
      const fileName = "test.txt";
      const content = "hello world";
      const newFile = new File(fileName, content, "utf8");
      parent.children.set(fileName, newFile);
      fs.usedSize += newFile.size;

      const foundNode = fs._findNode("/test.txt");
      expect(foundNode).toBeInstanceOf(File);
      expect(foundNode.name).toBe(fileName);
      expect(foundNode.content).toBe(content);
      expect(fs.usedSize).toBe(content.length);
    });

    test("공간이 부족할때 파일이 안만들어지는지 테스트", () => {
      const largeContent = "a".repeat(1001);
      const newFile = new File("large.txt", largeContent);
      expect(fs.usedSize + newFile.size > fs.maxSize).toBe(true);
    });
  });

  describe("_findNode", () => {
    beforeEach(() => {
      // 구조 생성
      const docs = new Directory("docs");
      const guide = new Directory("guide");
      const file = new File("getting-started.txt", "...");
      guide.children.set(file.name, file);
      docs.children.set(guide.name, guide);
      fs.root.children.set(docs.name, docs);
    });

    test("루트 디렉토리를 찾아야합니다", () => {
      expect(fs._findNode("/").name).toBe("/");
    });

    test("탑레벨의 디렉토리를 찾습니다", () => {
      expect(fs._findNode("/docs").name).toBe("docs");
    });

    test("중첩 디렉토리 테스트", () => {
      expect(fs._findNode("/docs/guide").name).toBe("guide");
    });

    test("원하는 파일 찾기", () => {
      const found = fs._findNode("/docs/guide/getting-started.txt");
      expect(found.name).toBe("getting-started.txt");
      expect(found).toBeInstanceOf(File);
    });

    test("존재하지 않는 경로에 대해서 테스트", () => {
      expect(fs._findNode("/docs/unknown")).toBeNull();
      expect(fs._findNode("/docs/guide/other.txt")).toBeNull();
      expect(fs._findNode("/invalid")).toBeNull();
    });

    test("파일통해서 존재하지 않는 경로 테스트", () => {
      expect(
        fs._findNode("/docs/guide/getting-started.txt/invalid")
      ).toBeNull();
    });
  });
});
