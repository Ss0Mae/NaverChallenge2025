# 🛠️ Day 13-14: Git 내부 동작 재구현을 통한 원리 탐구

## 🎯 미션 목표

Git이 어떻게 버전 관리를 하는지 그 내부 동작 원리를 파헤쳐보는 것을 목표로 합니다. 실제 `git` 명령어를 실행했을 때, `.git` 디렉토리 내의 객체(Object), 인덱스(Index), 참조(Refs) 파일들이 어떻게 변화하는지 직접 눈으로 확인하고 분석할 수 있는 학습용 CLI 도구를 Node.js를 기반으로 개발합니다.

---

## 🤔 "분석"을 넘어 "구현"을 선택한 이유

처음 미션의 요구사항을 접했을 때, 저는 두 가지 길을 고민했습니다.

1.  **Git 분석기 (Analyzer):** 실제 `git` 명령어로 생성된 `.git` 파일들을 읽어 그 의미를 해설해주는 도구.
2.  **Git 재구현 (Implementer):** `init`, `add` 등 핵심 기능을 코드로 직접 구현하여 `.git` 파일들을 생성하고 조작하는 도구.
최종 목표는 "실제 `git` 명령어와 호환되는 수준으로 `.git` 디렉토리를 직접 읽고 쓸 수 있는 도구를 만드는 것"으로 했습니다. 

단순히 결과물을 '보는' 것을 넘어, 그 복잡한 과정을 만들어보는 경험을 해보고 싶었기 때문입니다. `zlib` 압축, 바이너리 `index` 파일의 정교한 구조, `tree` 객체의 재귀적 생성 등, Git의 핵심 로직을 직접 코드로 구현하며 마주하는 문제들을 해결하는 과정 자체가 이번 미션의 가장 큰 배운점이었습니다.


---

## 🚀 핵심 기능 구현 상세

저는 `init`, `add`, `commit`, `log`, `branch` 다섯 가지 핵심 명령어를 직접 구현했습니다.

### 1. `init`: 저장소의 뼈대 세우기

모든 Git 저장소의 시작입니다. `init` 명령어는 Git이 버전 관리에 필요한 파일과 디렉토리를 생성하는 역할을 합니다.

- **로직:**
    1.  현재 경로에 `.git` 디렉토리가 있는지 확인하여 중복 실행을 방지합니다.
    2.  `.git` 디렉토리를 생성합니다.
    3.  객체 파일들을 저장할 `.git/objects` 디렉토리와 브랜치 정보를 담을 `.git/refs/heads` 디렉토리를 만듭니다.
    4.  현재 브랜치가 무엇인지 가리키는 `.git/HEAD` 파일을 생성하고, 기본 브랜치인 `main`을 가리키도록 `ref: refs/heads/main` 내용을 기록합니다.

- **코드 스니펫:**
    ```javascript
    function init() {
      const gitDir = path.join(process.cwd(), '.git');
      if (fs.existsSync(gitDir)) return;

      fs.mkdirSync(path.join(gitDir, 'objects'), { recursive: true, mode: 0o755 });
      fs.mkdirSync(path.join(gitDir, 'refs', 'heads'), { recursive: true, mode: 0o755 });

      fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');
      console.log(`빈 Git 저장소를 초기화했습니다: ${gitDir}`);
    }
    ```

### 2. `add`

`add`는 Git의 가장 중요한 개념 중 하나인 스테이징(Staging)을 수행합니다. 파일의 현재 상태를 스냅샷으로 만들어 `.git/objects`에 저장하고, 이 정보를 `.git/index` 파일에 기록합니다.

- **로직:**
    1.  **Blob 객체 생성 및 저장 (`hashObject`):**
        -   `add`할 파일의 내용을 읽습니다.
        -   `blob [내용 크기]\0[파일 내용]` 형식의 헤더와 내용을 합쳐 `blob` 객체를 만듭니다.
        -   `blob` 객체 전체의 SHA-1 해시를 계산합니다.
        -   `zlib`으로 객체를 압축한 뒤, 계산된 해시의 앞 2자리를 디렉토리 이름, 나머지를 파일 이름으로 하여 `.git/objects`에 저장합니다.
    2.  인덱스 업데이트 (`updateIndex`):
        -   `.git/index` 파일이 있다면 읽어서 기존 엔트리 정보를 모두 파싱합니다. (`readIndex`)
        -   `add`할 파일의 메타데이터(파일 상태, 권한 등)와 위에서 생성한 `blob` 객체의 해시를 이용해 새 인덱스 엔트리를 만듭니다.
        -   기존에 있던 파일이면 엔트리를 교체하고, 새 파일이면 추가합니다.
        -   전체 엔트리를 다시 바이너리 형식으로 변환하여 `.git/index` 파일에 덮어씁니다. (`writeIndex`)

- **코드 스니펫:**
    ```javascript
    function add(filePath) {
      const hash = hashObject(filePath); // 1. Blob 객체 생성 및 저장
      updateIndex(filePath, hash);      // 2. 인덱스 업데이트
      console.log(`파일이 객체로 저장되고 인덱스가 업데이트되었습니다.`);
    }
    ```

### 3. `commit`

`commit`은 현재 스테이징된 상태(`index` 파일)를 영구적인 역사로 기록하는 과정입니다. 이 과정에서 `tree` 객체와 `commit` 객체가 생성됩니다.

- **로직:**
    1.  **Tree 객체 생성 (`writeTree`):**
        -   `.git/index` 파일을 읽어 스테이징된 파일 목록을 가져옵니다.
        -   각 파일의 모드, 이름, `blob` 해시를 조합하여 `tree` 객체의 내용을 만듭니다.
        -   `tree` 객체 역시 헤더를 붙여 해시를 계산하고, 압축하여 `.git/objects`에 저장합니다.
    2.  **Commit 객체 생성 및 저장:**
        -   방금 만든 `tree` 객체의 해시, 부모 커밋의 해시(`HEAD` 참조), 작성자 정보, 커밋 메시지를 조합하여 `commit` 객체의 내용을 만듭니다.
        -   `commit` 객체도 동일한 방식으로 해시를 계산하고, 압축하여 `.git/objects`에 저장합니다.
    3.  **브랜치 업데이트 (`updateHead`):**
        -   `.git/HEAD`가 가리키는 현재 브랜치 파일(예: `.git/refs/heads/main`)을 찾아, 그 내용을 새로 만든 `commit` 객체의 해시로 덮어씁니다.
    4.  **정리:** 커밋이 완료되었으므로, 다음 커밋을 위해 `.git/index` 파일을 삭제합니다.

- **코드 스니펫:**
    ```javascript
    function commit(message) {
      const treeHash = writeTree(); // 1. Tree 객체 생성
      const parentCommit = getHeadCommit();
      // 2. Commit 객체 생성 및 저장 (로직 생략)
      const commitHash = createCommitObject(treeHash, parentCommit, message);
      updateHead(commitHash); // 3. 브랜치 업데이트
      fs.unlinkSync(path.join(process.cwd(), '.git', 'index')); // 4. 인덱스 정리
      console.log(`[${getHeadRef().split('/').pop()} ${commitHash.slice(0, 7)}] ${message}`);
    }
    ```

### 4. `log`: 커밋 히스토리 조회

`log`는 `commit`으로 쌓아온 기록을 거슬러 올라가며 보여주는 기능입니다.

- **로직:**
    1.  `.git/HEAD`를 통해 현재 브랜치의 최신 커밋 해시를 알아냅니다.
    2.  해당 커밋 객체 파일을 `.git/objects`에서 읽어 압축을 풀고, 내용을 파싱합니다. (`readObject`)
    3.  작성자, 날짜, 커밋 메시지를 보기 좋게 출력합니다.
    4.  커밋 내용에 포함된 `parent` 해시를 찾아, 다음으로 조회할 커밋으로 지정합니다.
    5.  부모 커밋이 없을 때(최초 커밋)까지 이 과정을 반복합니다.

- **코드 스니펫:**
    ```javascript
    function log() {
      let commitHash = getHeadCommit(); // 1. HEAD에서 시작
      while (commitHash) {
        const commitObject = readObject(commitHash); // 2. 객체 읽기
        // 3. 정보 출력 (로직 생략)
        printCommitInfo(commitObject);
        // 4. 부모 커밋으로 이동
        commitHash = getParentFromCommit(commitObject);
      }
    }
    ```

### 5. `branch`

브랜치는 특정 커밋을 가리키는 이름표(포인터)에 불과합니다. 이 원리를 이용해 간단하게 구현할 수 있습니다.

- **로직:**
    -   **브랜치 목록 보기 (`branch`):**
        -   `.git/refs/heads` 디렉토리 안의 모든 파일 이름을 읽어서 출력합니다.
        -   `.git/HEAD`가 가리키는 브랜치 이름 앞에는 `*`를 붙여줍니다.
    -   **브랜치 생성 (`branch <이름>`):**
        -   현재 최신 커밋의 해시를 알아냅니다.
        -   `.git/refs/heads/<새 브랜치 이름>` 경로에 파일을 새로 만들고, 그 안에 현재 커밋 해시를 써넣으면 브랜치 생성이 완료됩니다.

- **코드 스니펫:**
    ```javascript
    function branch(branchName) {
      if (!branchName) {
        // 목록 보여주기 로직
      } else {
        const commitHash = getHeadCommit();
        const newBranchFile = path.join(process.cwd(), '.git', 'refs', 'heads', branchName);
        fs.writeFileSync(newBranchFile, `${commitHash}\n`);
        console.log(`브랜치 '${branchName}'가 생성되었습니다.`);
      }
    }
    ```

---

## 🚀 Day 13-14: 코드 구조 개선 및 `clone`을 통한 원격 상호작용 맛보기

Day 13-14에서 구현한 Git의 핵심 기능을 기반으로, 이제 코드를 더 구조적으로 개선합니다.

### 1.  코드 리팩토링

- **목표:** `my-git.js`에 집중된 로직을 역할에 따라 여러 모듈로 분리하여 확장성과 유지보수성을 높입니다.
- **모듈 설계:**
    - `GitRepository.js`: Git 저장소 자체를 표현하고 경로, 설정 등을 관리합니다.
    - `ObjectManager.js`: 객체(blob, tree, commit)의 생성, 직렬화/역직렬화를 전담합니다.
    - `IndexManager.js`: 스테이징 영역(`.git/index`)의 읽기/쓰기를 담당합니다.
    - `RefsManager.js`: `HEAD`, 브랜치 등 참조(`refs`)를 관리합니다.
    - `my-git-cli.js`: 사용자의 입력을 받아 각 모듈을 오케스트레이션하는 진입점 역할을 합니다.

### 2. `clone`의 핵심 원리 구현하기 (로컬 복제)

- **목표:** `git clone`이 원격 저장소의 데이터를 어떻게 로컬로 가져오는지 이해하기 위해, 우선 로컬에 있는 다른 Git 저장소를 복제하는 기능을 구현합니다.
- **구현 단계:**
    1.  **객체 복사:** 원본 저장소의 `.git/objects` 내 모든 객체 파일을 새로운 저장소로 그대로 복사합니다.
    2.  **참조 복사:** 원본의 브랜치 정보(`.git/refs/heads/*`)를 새로운 저장소에 동일하게 생성합니다.
    3.  **`HEAD` 설정:** 원본의 `HEAD`가 가리키는 브랜치를 찾아, 새로운 저장소의 `HEAD`도 해당 브랜치를 가리키도록 설정합니다.
    4.  **워킹 디렉토리 체크아웃:** 복제가 완료된 후, `HEAD`가 가리키는 커밋의 `tree` 객체를 기반으로 실제 파일들을 워킹 디렉토리에 생성(checkout)하여 사용자가 바로 작업할 수 있는 환경을 만듭니다.

---