# Day 2: Linux/Unix 환경과 친숙해지기

## 🚀 미션 요구사항 분석

- **학습 목표:** 리눅스/유닉스 환경에 익숙해지고, 터미널을 통해 서버 환경에 원격으로 접속하여 원하는 작업을 수행할 수 있도록 한다.
- **핵심 과제:**
  1. 가상 머신(VM)에 리눅스(Ubuntu 24.04 권장)를 설치한다.
  2. SSH 설정을 통해 원격으로 접속하고, 사용자 계정을 관리한다.
  3. 파일 시스템에 디렉토리를 생성하고 권한을 관리한다.
  4. 시스템의 시간대를 설정한다.
  5. Node.js 런타임을 설치하고, 이전 과제 코드를 실행한다.
  6. 모든 과정을 `README.md`에 기록하고, `나만의체크포인트.md`를 작성하여 스스로의 진행 상황을 관리하며, `학습정리.md`를 통해 배운 점을 정리한다.
  7. 모든 결과물(스크립트, 문서, 이미지 등)을 Gist에 저장한다.

## 📝 학습 및 구현 계획

### 🐧 첫 번째 미션: Linux/Unix 환경과 친숙해지기

1.  **가상 환경 준비 및 Ubuntu 설치 (VMware 사용)**

    - Ubuntu 24.04 Desktop 버전과 Server 버전의 차이점을 알아보고, Sever 버전으로 설치를 진행한다. (CLI 환경에 익숙함)
    - 설치 과정에서 파티션 설정, 초기 사용자 생성 등의 옵션을 확인하고 기록한다.

2.  **원격 접속(SSH) 설정**

    - `openssh-server` 패키지를 설치한다.
    - SSH 서비스 상태를 확인하고, 방화벽(ufw)이 활성화된 경우 SSH 포트(22)를 허용한다.
    - `ip addr` 또는 `ifconfig` 명령어로 VM의 IP 주소를 확인한다.
    - 로컬 터미널에서 `ssh` 명령어를 사용하여 VM에 접속한다.

3.  **사용자 및 디렉토리 권한 관리**

    - `adduser` 명령어로 새로운 사용자 계정을 생성한다.
    - `sudo mkdir /monitoring` 명령어로 디렉토리를 생성한다.
    - `sudo chmod 764 /monitoring` 명령어로 권한을 변경한다.
    - `ls -l /` 명령어로 `/monitoring` 디렉토리의 권한이 정상적으로 변경되었는지 확인하고 스크린샷을 촬영한다.

4.  **시스템 환경 설정**

    - `sudo timedatectl set-timezone 'Asia/Seoul'` 명령어로 시간대를 서울로 변경한다.
    - `date` 명령어로 현재 날짜와 시간이 올바르게 표시되는지 확인하고 스크린샷을 촬영한다.

5.  **Node.js 설치 및 스크립트 실행**

    - `nvm`(Node Version Manager)을 사용하여 최신 LTS 버전의 Node.js를 설치한다. (버전 관리에 용이)
    - `node -v` 명령어로 설치된 버전을 확인한다.
    - `scp` 또는 `sftp`를 사용하여 Day1 미션의 `.js` 파일을 VM으로 복사한다.
    - `node <파일명>.js` 명령어로 스크립트를 실행하고 결과를 확인한다.

6.  **문서화 및 Gist에 업로드**
    - 각 단계별 수행한 명령어, 실행 결과, 스크린샷, 발생한 문제 및 해결 과정을 `README.md`에 상세히 기록한다.
    - `나만의체크포인트.md`를 기반으로 진행 상황을 체크한다.
    - 모든 파일을 Gist에 업로드하고, Gist URL을 제출한다.

### 🚀 두 번째 미션: 쉘 스크립트와 sLLM 자동화

1.  **ollama 설치 및 설정**

    - `ollama`를 설치하고 시스템 재부팅 시 자동 실행되도록 설정합니다.
    - 외부에서 `ollama`에 접근할 수 있도록 방화벽 및 네트워크 설정을 확인합니다.
    - `gemma:1b` 모델을 다운로드하고 실행합니다.
    - `curl` 명령어를 사용하여 외부에서 모델 API가 정상적으로 동작하는지 확인하고 스크린샷을 촬영합니다.

2.  **데이터 수집 자동화**

    - 시스템 로그(`dmesg`)를 주기적으로 수집하는 쉘 스크립트(`collect_logs.sh`)를 작성합니다.
    - `crontab`을 사용하여 `collect_logs.sh` 스크립트가 매 분마다 실행되도록 설정합니다.
    - 수집된 로그는 `/monitoring` 디렉토리에 타임스탬프 형식의 파일명으로 저장합니다.

3.  **데이터 분석 및 알림 자동화**
    - 1시간마다 수집된 로그 데이터를 분석하는 쉘 스크립트(`analyze_and_notify.sh`)를 작성합니다.
    - 스크립트는 가장 빈번하게 발생한 이벤트를 추출하여 `ollama` `gemma:1b` 모델에 요약을 요청합니다.
    - 모델로부터 받은 요약 결과를 Slack 웹훅을 통해 지정된 채널로 전송합니다.
    - 알림 전송 시, `/monitoring` 폴더에 `YYYYMMDD-HHMMSS.log` 형식으로 알림 내용을 기록합니다.
    - `crontab`을 사용하여 해당 스크립트가 매 시간 정각에 실행되도록 설정합니다.

## 💻 구현 결과

### 1. 원격 접속 (SSH) 설정

로컬 터미널에서 `ssh` 명령어를 사용하여 성공적으로 VM에 원격 접속한 화면입니다.

<img width="673" height="668" alt="스크린샷 2025-07-15 오후 1 49 13" src="https://gist.github.com/user-attachments/assets/d97e1bc6-03ff-4f47-b370-4ba654ded19b" />

### 2. 사용자 및 디렉토리 권한 관리

`/monitoring` 디렉토리를 생성하고, `chmod 764` 명령어로 권한을 변경한 후 `ls -ld` 명령어로 결과를 확인했습니다.

<img width="441" height="121" alt="스크린샷 2025-07-15 오후 1 51 52" src="https://gist.github.com/user-attachments/assets/00a66552-c924-4ddd-8995-3a3a32e4e52c" />

### 3. 시스템 환경 설정 (시간대)

`timedatectl` 명령어를 사용하여 시스템의 시간대를 'Asia/Seoul'로 변경하고, `date` 명령어로 정상적으로 적용되었는지 확인했습니다.

<img width="476" height="48" alt="스크린샷 2025-07-15 오후 1 52 44" src="https://gist.github.com/user-attachments/assets/94371bef-dded-4318-9179-d162bf8e608a" />

### 4. Node.js 설치 및 스크립트 실행

`nvm`을 통해 Node.js를 설치하고, Day1 미션 코드를 `node` 명령어로 실행한 결과입니다.
<img width="416" height="655" alt="스크린샷 2025-07-15 오후 2 11 37" src="https://gist.github.com/user-attachments/assets/f70d10c2-23bc-463f-80d2-59ecf7ac8ba8" />

### 5. 쉘 스크립트 자동화 및 sLLM 연동

**`collect_logs.sh`**
1분마다 `dmesg` 로그를 수집하여 `/monitoring` 디렉토리에 타임스탬프 형식의 파일로 저장하는 스크립트입니다.
```bash
#!/bin/bash

LOG_DIR="/monitoring"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# sudo와 dmesg의 전체 경로를 사용하고, 에러 로그를 기록합니다.
/usr/bin/sudo /usr/bin/dmesg > "$LOG_DIR/$TIMESTAMP.log" 2>> "$LOG_DIR/cron_error.log"
```

**`analyze_and_notify.sh`**
1시간마다 로그를 분석하고, Ollama(`gemma3:1b`)를 통해 원인 분석 후 Slack으로 알림을 보내는 스크립트입니다.
```bash
#!/bin/bash

# 기본 변수 설정
LOG_DIR="/monitoring"
CAMPER_ID="J251"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." 
OLLAMA_MODEL="gemma3:1b"

# --- 1. dmesg 로그 분석 ---
# ... (생략) ...
PROMPT="다음은 내 리눅스 서버에서 가장 빈번하게 발생한 로그 메시지입니다. 이 문제의 원인과 가능한 해결책을 한 문단 정도로 자세히 설명해줘: '$MOST_COMMON_EVENT'"
# ... (생략) ...

# --- 2. Ollama 프로세스 자원 사용량 모니터링 ---
# ... (생략) ...

# --- 3. Slack으로 통합 알림 전송 ---
# ... (생략) ...
```

**Crontab 등록 내용**
```
* * * * * /home/test/collect_logs.sh
0 * * * * /home/test/analyze_and_notify.sh
```

**최종 실행 결과 (Slack 알림)**
성공적으로 시스템 로그 분석 및 Ollama 프로세스 모니터링 결과를 슬랙으로 수신한 화면입니다.
<img width="583" height="291" alt="스크린샷 2025-07-15 오후 5 19 02" src="https://gist.github.com/user-attachments/assets/4e368b69-e436-4856-8e57-dde316aed1b4" />


## 🤔 트러블슈팅


### 1. Ubuntu에서 Node.js 스크립트 실행 시 출력 깨짐
- **문제:** Day1에서 작성한 `index.js` 파일을 Ubuntu 서버에서 실행했을 때, 표를 그리는 특수문자(`🁢`)와 한글 주석이 깨져서 출력되었습니다.
- **원인:**
  1. **특수문자 깨짐:** Ubuntu 기본 터미널 폰트가 해당 유니코드 문자를 지원하지 않아서 발생했습니다.
  2. **한글 깨짐:** 파일 인코딩이 UTF-8이 아니거나, 터미널의 문자셋 설정 문제일 수 있습니다.
- **해결:**
  1. **특수문자:** 가독성을 해치지 않으면서 대부분의 터미널에서 지원하는 블록 문자(`■`)로 교체했습니다.
  2. **한글:** 파일 자체를 UTF-8 인코딩으로 다시 저장하여 문제를 해결했습니다.

### 2. `cron`에서 `dmesg` 실행 시 권한 문제 발생
- **문제:** `test` 계정의 `crontab`에 등록된 `collect_logs.sh` 스크립트가 `dmesg` 로그를 수집하지 못하고 0바이트 파일만 생성했습니다.
- **원인:**
  1. **`dmesg` 권한 부족:** 일반 사용자 계정(`test`)은 `dmesg`를 실행하여 커널 로그를 읽을 권한이 없습니다.
  2. **`cron`의 `sudo` 실행 환경:** `cron`은 TTY(가상 터미널) 없이 실행되므로, `sudo` 명령어 실행 시 비밀번호를 입력할 수 없어 권한 상승에 실패합니다.
  3. **스크립트 내 오타:** 초기 스크립트에 `dmesg`를 `dmseg`로 잘못 작성하여 "명령어를 찾을 수 없음" 오류가 발생했습니다.
- **해결:**
  1. **`sudo` 그룹 추가:** `sudo usermod -aG sudo test` 명령으로 `test` 계정을 `sudo` 그룹에 추가하여 `sudo` 명령어 사용 권한을 부여했습니다.
  2. **`sudoers` 파일 수정:** `sudo visudo` 명령을 통해 `sudoers` 파일을 열고, `test ALL=(ALL) NOPASSWD: /usr/bin/dmesg` 라인을 추가하여 `test` 계정이 `dmesg` 명령어에 한해 비밀번호 없이 `sudo`를 사용할 수 있도록 설정했습니다.
  3. **전체 경로 사용:** `cron`의 제한된 실행 환경을 고려하여, 스크립트 내의 모든 명령어(`sudo`, `dmesg`)를 `/usr/bin/sudo`, `/usr/bin/dmesg`와 같이 전체 경로로 명시하여 안정성을 높였습니다.
  4. **오타 수정:** 스크립트의 `dmseg`를 `dmesg`로 바로잡았습니다.

### 3. AI 분석 결과가 의도와 다르게 출력되는 문제
- **문제:** Slack 알림의 "AI 분석 결과" 필드에 Ollama의 요약 대신, 관련 없는 CPU 사용량 목록이 출력되었습니다.
- **원인:** 스크립트 로직의 오류로, Ollama API로부터 받은 응답을 변수에 올바르게 저장하지 않고, 별도로 실행한 프로세스 모니터링 명령어의 결과를 Slack 메시지 변수에 잘못 할당하고 있었습니다.
- **해결:** 스크립트의 변수 할당 로직을 명확하게 수정했습니다. `curl`로 Ollama API를 호출한 결과를 `AI_SUMMARY` 변수에 저장하고, `ps` 명령어로 측정한 Ollama 프로세스의 자원 사용량은 `RESOURCE_USAGE`라는 별도 변수에 저장했습니다. 최종적으로 Slack 메시지를 구성할 때, 이 두 변수를 각각 올바른 위치에 배치하여 두 가지 핵심 정보를 모두 포함하는 통합 보고서 형식으로 개선했습니다.

### 4. 스크립트 실행 시 `jq: command not found` 오류
- **문제:** `analyze_and_notify.sh` 스크립트 실행 시 `jq: command not found` 라는 오류가 발생하며 중단되었습니다.
- **원인:** 스크립트는 Ollama 및 Slack API와 통신하는 과정에서 JSON 데이터를 생성하고 파싱하기 위해 `jq`라는 경량 커맨드라인 JSON 프로세서를 사용합니다. `jq`는 Ubuntu 서버에 기본적으로 설치되어 있지 않은 패키지이므로, 쉘이 해당 명령어를 찾지 못해 오류가 발생했습니다.
- **해결:** `sudo apt-get update && sudo apt-get install -y jq` 명령어를 실행하여 `jq` 패키지를 시스템에 설치했습니다. 이를 통해 스크립트가 정상적으로 JSON 데이터를 처리할 수 있게 되어 문제가 해결되었습니다.
