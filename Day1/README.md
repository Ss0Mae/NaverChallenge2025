# **밋업 스케줄러**

## **1. 학습 목표**

- VS Code에서 JavaScript 프로그램을 구현하고, Node.js로 실행할 수 있다.
- git과 GitHub 서비스를 활용해서 소스 코드를 관리할 수 있다.

## **2. 기능 요구사항**

- **`arrange(meetupId, timeSlots, userNames)`**: 새로운 밋업을 설정합니다.
- **`vote(meetupId, userName, voteTimes)`**: 특정 밋업에 참석 가능한 시간을 제출합니다. (중복 제출 시 마지막 제출만 유효)
- **`close(meetupId)`**: 밋업을 마감하고 최종 결과를 출력합니다.
- 동시에 여러 밋업을 관리할 수 있어야 합니다.

### **출력 요구사항**

- `close` 함수 호출 시, 고정폭 글꼴을 사용한 시간표를 콘솔에 출력합니다.
- 시간표에는 각 시간대별 참석자와 총인원을 표시합니다.
- 가장 유력한 시간대를 추천하여 출력합니다.

### **추천 시간대 선정 기준**

1. 참여 인원이 가장 많은 시간대를 우선합니다.
2. 참여 인원이 같을 경우, 다음 시간대에 연속해서 참석 가능한 인원이 더 많은 시간대를 우선합니다.
3. 그 외 합리적인 기준을 추가하여 적용할 수 있습니다.

## **3. 프로그래밍 요구사항**

- Node.js 환경에서 실행 가능한 JavaScript 코드로 작성합니다.
- 함수는 10줄을 넘지 않도록 하고, 들여쓰기는 3단계를 초과하지 않도록 구현합니다.
- 입력값은 소스코드 내에서 함수 호출로 처리합니다.
- 데이터 구조(매개변수, 반환값)는 직접 설계합니다.

## **4. 할 일 체크리스트 (README)**

- [x]  1. 프로젝트 기본 구조 설정 (README, 체크포인트, 학습정리 파일 생성)
- [x]  2. 데이터 구조 설계 (밋업 정보, 투표 정보 저장 방식)
- [x]  3. `arrange` 함수 구현
- [x]  4. `vote` 함수 구현
- [x]  5. `close` 함수 구현
    - [x]  5-1. 전체 시간표 생성 로직 구현
    - [x]  5-2. 시간대별 참석자 및 총인원 계산 로직 구현
    - [x]  5-3. 추천 시간대 선정 로직 구현
    - [x]  5-4. 최종 결과 포맷에 맞춰 출력하는 로직 구현
- [x]  6. 예시 데이터로 기능 테스트 및 최종 결과 확인
- [x]  7. Gist 연동 및 코드 제출

## **5. 개발 과정**

### **1) 분석**

- **핵심 기능**: `arrange`, `vote`, `close` 세 함수를 중심으로 밋업의 생성, 투표, 마감 및 결과 출력을 관리해야 함을 파악했습니다.
- **데이터 관리**: 여러 밋업이 동시에 진행될 수 있으므로, 모든 밋업 데이터를 관리할 중앙 저장소가 필요하다고 판단했습니다. `meetupId`를 키로 사용하는 객체가 적합하다고 생각했습니다.
- **핵심 로직**: `close` 시점의 결과 출력 로직이 가장 복잡할 것으로 예상했습니다. 특히, 시간표를 만들고, 투표를 집계하며, 두 가지 기준(총인원, 연속 참석 인원)에 따라 최적 시간을 추천하는 로직의 구현이 핵심 과제라고 분석했습니다.

### **2) 설계**

- **데이터 구조**:
    - `meetups` 라는 전역 객체를 두어 모든 밋업 정보를 저장하는 In-Memory DB처럼 사용하기로 설계했습니다.
    - 각 밋업 정보는 `availableTimes`, `invitedUsers`, `votes` 세 가지 속성을 갖도록 했습니다.
    - 시간 문자열(`월10-12`)은 계산 및 비교가 용이하도록 `{day: '월', start: 10, end: 12}` 형태의 객체로 파싱하여 다루기로 결정했습니다. 이를 위해 `parseTime` 헬퍼 함수를 설계했습니다.
- **모듈화**:
    - 프로그래밍 요구사항(함수 10줄 제한, 들여쓰기 3단계 제한)을 준수하기 위해 `close` 함수의 복잡한 로직을 여러 개의 하위 함수로 분리하기로 결정했습니다.
    - `createTimeTable`: 주최자가 설정한 시간 범위를 1시간 단위로 분할하여 시간표의 기본 틀을 생성합니다.
    - `buildSchedule`: 생성된 시간표 틀에 사용자의 투표 정보를 바탕으로 참석자 명단과 총인원을 채워 넣습니다.
    - `findBestTime`: 완성된 스케줄 표를 분석하여 두 가지 우선순위에 따라 최적의 시간을 찾아냅니다.
    - `printSchedule`: 최종 결과를 요구사항의 포맷에 맞게 콘솔에 출력합니다.
    
    ---
[![](https://mermaid.ink/img/pako:eNqNVV1P20gU_Suj6QtIgcYfEOKHlYAU9WWfYF_WQcixJ4lVx47sMS0bRQpqqGihWiq1hVWTKq1oqSqkeilbUYn-ofjmP3QmdhInDd36yb6-58zxuecmNaw7BsEKLrlatYw2cnkbscvzC1EBDlrw-llU5NeyqrmuZpcI6p1cwZfWJpqb-w3lVtSZCiHUr3qoG7Th4nJ2c4RZUbcdOgkYvV5VdcvxJt7X4tqLD7B_wlSc9l4-rkcYYht5e0JmHodPA2hf9poBgouT8P056h0e8sLzZti-hvZVHo9OzLEzUBgcwPEegs6L8PNl_9A1QdVdolGyYVbIhlawSOIj1gQOymNmSDdo9p61UHi9Hx420IwQlVB48AFaTQRPzsM3n2bzOOIU1YJvWsa6XiaGP84oxozBFTTbsZBu0EDwbxNeHcIZ5zqF6wacNgdsklo0bWOFeJRrTJJJMdl_LejsokjSACWrVde06TQNcr_jjspxb_dQ9yLofr5G8O0EHj1HbBxh593mz2yHh7vQvELhmxac7SY9TvSMGYAiRLJ1ZEY3GEgPz_bDg9M4E32Nd8UtYaZE6DKlTAoh3prjrlsOnR0n4m1DqlYHOo2pVGLN9P7wiLu8rZkWH3X9B5q-ot7-OZ81HJ-HXxoz1PXJ7aJmeWR2qGn68dFQ4fURCj_usWTEYRg1J-ycsCs54ZvcGk2bR5DFG16xk_7-BzpH3MB48HclZtmAbtWxPaL71Nwm02yTtuKARyyMctokRsRiTdcs3bfYuiSZdcf9wUppa5D04wAePUXDwB-x3U5IvUlRnE148pX7OR5t6VccHUv_TZbK_xtAeUuIF4n5tzkNzkBwxgL3GI6PJqBiBJ2yun3dkxtGd5jS3Aoqmpal3CpmiymPus49otySJCm-n7tvGrSsiNUHSdCdGFMo_ByDU-w33zSwwkOdwhXiVjT-iGucLY9pmVRIHivs1iBFzbcot6zOYFXN_tNxKgOk6_ilMlb6a5HCftVgkciZGjO_MqxqPnXWd2x9iOEr7K46vk2xIsiZpT4rVmr4AVYy8vxiOiMupKX0kizL4mIK72BFlDLzUlpaXEgLmQVBTAtyPYX_6usQ5tPSUlbOCpkM689ks9kUJoZJHff36M9Nd-yiWcL17-hmmOw?type=png)](https://mermaid.live/edit#pako:eNqNVV1P20gU_Suj6QtIgcYfEOKHlYAU9WWfYF_WQcixJ4lVx47sMS0bRQpqqGihWiq1hVWTKq1oqSqkeilbUYn-ofjmP3QmdhInDd36yb6-58zxuecmNaw7BsEKLrlatYw2cnkbscvzC1EBDlrw-llU5NeyqrmuZpcI6p1cwZfWJpqb-w3lVtSZCiHUr3qoG7Th4nJ2c4RZUbcdOgkYvV5VdcvxJt7X4tqLD7B_wlSc9l4-rkcYYht5e0JmHodPA2hf9poBgouT8P056h0e8sLzZti-hvZVHo9OzLEzUBgcwPEegs6L8PNl_9A1QdVdolGyYVbIhlawSOIj1gQOymNmSDdo9p61UHi9Hx420IwQlVB48AFaTQRPzsM3n2bzOOIU1YJvWsa6XiaGP84oxozBFTTbsZBu0EDwbxNeHcIZ5zqF6wacNgdsklo0bWOFeJRrTJJJMdl_LejsokjSACWrVde06TQNcr_jjspxb_dQ9yLofr5G8O0EHj1HbBxh593mz2yHh7vQvELhmxac7SY9TvSMGYAiRLJ1ZEY3GEgPz_bDg9M4E32Nd8UtYaZE6DKlTAoh3prjrlsOnR0n4m1DqlYHOo2pVGLN9P7wiLu8rZkWH3X9B5q-ot7-OZ81HJ-HXxoz1PXJ7aJmeWR2qGn68dFQ4fURCj_usWTEYRg1J-ycsCs54ZvcGk2bR5DFG16xk_7-BzpH3MB48HclZtmAbtWxPaL71Nwm02yTtuKARyyMctokRsRiTdcs3bfYuiSZdcf9wUppa5D04wAePUXDwB-x3U5IvUlRnE148pX7OR5t6VccHUv_TZbK_xtAeUuIF4n5tzkNzkBwxgL3GI6PJqBiBJ2yun3dkxtGd5jS3Aoqmpal3CpmiymPus49otySJCm-n7tvGrSsiNUHSdCdGFMo_ByDU-w33zSwwkOdwhXiVjT-iGucLY9pmVRIHivs1iBFzbcot6zOYFXN_tNxKgOk6_ilMlb6a5HCftVgkciZGjO_MqxqPnXWd2x9iOEr7K46vk2xIsiZpT4rVmr4AVYy8vxiOiMupKX0kizL4mIK72BFlDLzUlpaXEgLmQVBTAtyPYX_6usQ5tPSUlbOCpkM689ks9kUJoZJHff36M9Nd-yiWcL17-hmmOw)

### **3) 구현 및 개선**

`close(meetupId)`: 전체 작업 지휘 이 함수는 밋업 마감의 전체 과정을 제어합니다.

1. `meetups` 저장소에서 해당 `meetupId`의 밋업 정보를 가져옵니다.
2. `createTimeTable`을 호출하여 시간표의 기본 틀(뼈대)을 만듭니다.
3. 만들어진 시간표 뼈대를 `buildSchedule`에 넘겨주어 투표 결과를 채워넣고 참석자 정보를 계산합니다.
4. 완성된 스케줄 표를 `findBestTime`에 넘겨주어 가장 좋은 시간대를 찾아냅니다.
5. 마지막으로, 완성된 모든 데이터(밋업 정보, 스케줄 표, 최적 시간)를 `printSchedule`에 넘겨주어 최종 결과를 화면에 출력합니다.
    1. `createTimeTable(meetup)`: 시간표 뼈대 생성 이 함수는 주최자가 `arrange` 단계에서 입력한 `availableTimes` `(예: ["월10-16", "수12-16"])`를 받아, 이를 1시간 단위로 잘게 쪼개어 시간표의 행(row)들을 만듭니다.
        - 입력: { day: '월', start: 10, end: 16 }
        - 처리: for 루프를 돌면서 start부터 end 직전까지 1시간씩 증가시킵니다.
        - 출력 (배열):
    
    ```jsx
    [ 
    	{ day: '월', start: 10, end: 11 }, 
    	{ day: '월', start: 11, end: 12 }, 
    	{ day: '월', start: 12, end: 13 }, 
    	 ...
    ]
    ```
    
    이 단계의 결과물은 아직 비어있는, 시간대만 나열된 "시간표 템플릿"입니다.
    
    ---
    
    1. `buildSchedule(meetup, timeTable)`: 투표 결과 집계
    
    이 함수는 `createTimeTable`이 만든 시간표 템플릿에 살을 붙이는 역할을 합니다. 각 시간대별로 누가 참석하는지, 총 몇 명이 참석하는지를 계산합니다.
    
    - `timeTable`의 각 시간대(slot)를 순회합니다.
    - 각 `slot`마다 `getAttendeesForSlot` 함수를 호출하여 해당 시간대에 참석 가능한 모든 사용자 명단을 받아옵니다.
    - 원래의 `slot` 정보에 `attendees`(참석자 명단)와 `total`(총인원)을 추가하여 새로운 객체를 만듭니다.
    
    하위 함수들:
    
    - `getAttendeesForSlot(meetup, slot)`: 특정 시간대(slot)에 참석 가능한 사람을 찾습니다.
        - 초대된 모든 사용자를 순회하면서, 각 사용자에 대해 `isUserAvailable`을 호출하여 참석 가능 여부를 확인합니다.
        - 가능한 사용자들만 모아서 명단을 반환합니다.
    - `isUserAvailable(userVotes, slot)`: 실질적인 투표 확인 로직입니다.
        - 한 명의 사용자가 투표한 시간대 목록(`userVotes`)과 현재 확인하려는 1시간짜리 `slot`을 비교합니다.
        - 사용자가 투표한 시간(예: 수12-15)이 현재 slot(예: 수13-14)을 완전히 포함하는지 확인합니다. `(vote.start <= slot.start && vote.end >= slot.end)`
        - 포함하는 투표가 하나라도 있으면 true를 반환합니다.
    
    ---
    
    2. `findBestTime(schedule)`: 최적 시간대 선정
    
    이 함수는 모든 정보가 채워진 `schedule` 데이터를 분석하여 "가장 좋은 시간"을 선정하는 역할을 합니다.
    
    1. 1차 기준 (최대 인원):
        - `schedule`을 전부 순회하며 가장 높은 `total` 값을 찾습니다.
        - 가장 높은 `total` 값을 가진 시간대(slot)들을 모두 `bestSlots` 배열에 저장합니다.
    2. 2차 기준 (연속 참석 인원):
        - 만약 `bestSlots`에 후보가 1개뿐이면, 그 시간대가 바로 최적 시간으로 결정됩니다.
        - 후보가 여러 개(동점)이면, `findBestConsecutiveSlot`을 호출하여 우선순위 계산을 합니다.
    
    하위 함수들:
    
    - `findBestConsecutiveSlot(schedule, bestSlots)`: 동점 후보들 중에서 최종 결과를 가립니다.
        - 동점인 `bestSlots`들을 순회하면서 각 slot에 대해 `calculateConsecutiveScore`를 호출하여 "연속 점수"를 계산합니다.
        - "연속 점수"가 가장 높은 `slot`을 최종 최적 시간으로 선정합니다.
    - `calculateConsecutiveScore(schedule, currentSlot)`: "연속 점수"를 계산합니다.
        - 현재 시간대(currentSlot)의 바로 다음 시간대를 schedule에서 찾습니다.
        - 현재 시간대 참석자와 다음 시간대 참석자 명단을 비교하여, 두 시간대 모두에 참석하는 공통 인원수를 계산하여 반환합니다. 이 값이 "연속 점수"가 됩니다.
    
    ---
    
    3. `printSchedule(meetup, schedule, bestTime)`: 최종 결과 출력
    
    모든 계산이 끝나고, 이 함수가 최종 결과를 콘솔에 그려주는 역할을 합니다.
    
    1. 표의 헤더(밋업M1 | A | B | ...)를 출력합니다.
    2. schedule 데이터를 한 줄씩 순회하며 `printSlot`을 호출하여 각 시간대 정보를 출력합니다.
    3. 요일이 바뀔 때마다 구분선(----)을 출력합니다.
    4. 표 출력이 모두 끝나면, `printBestTime`을 호출하여 최종 추천 시간대를 별도로 출력합니다.
    
    하위 함수들:
    
    - `printSlot(...)`: 표의 한 행을 형식에 맞춰 출력합니다.
        - 시간(월 10-11), 사용자별 참석 여부(🁢🁢🁢 또는 ), 총인원(3)을 조합합니다.
        - 만약 해당 slot이 최적 시간(bestTime)이라면, 맨 뒤에 별표(*)를 추가합니다.
    - `printBestTime(...)`: 최종 추천 메시지를 출력합니다.
        - M1 추천 시간대\n수 12-13 : 4명 A, B, C, D 와 같은 형식으로 최종 결과를 출력합니다.
 ## 전체 코드 및 출력 결과

```jsx
/**
 * @typedef {object} TimeObject
 * @property {string} day - 요일 (e.g., '월')
 * @property {number} start - 시작 시간
 * @property {number} end - 종료 시간
 */

/**
 * @typedef {object} Meetup
 * @property {TimeObject[]} availableTimes - 주최자가 설정한 전체 가능 시간
 * @property {string[]} invitedUsers - 초대된 사용자 목록
 * @property {Object.<string, TimeObject[]>} votes - 사용자별 투표 정보. { userName: TimeObject[] }
 */

/**
 * @typedef {object} ScheduleSlot
 * @property {string} day - 요일
 * @property {number} start - 시작 시간
 * @property {number} end - 종료 시간
 * @property {string[]} attendees - 해당 시간대에 참석 가능한 사용자 목록
 * @property {number} total - 총 참석 인원
 */

/** @type {Object.<string, Meetup>} */
const meetups = {};

/**
 * 시간 문자열(e.g., "월10-12")을 TimeObject로 파싱합니다.
 * @param {string} timeStr - 파싱할 시간 문자열
 * @returns {TimeObject} 파싱된 시간 객체
 */
const parseTime = (timeStr) => {
  const day = timeStr.slice(0, 1);
  const [start, end] = timeStr.slice(1).split("-").map(Number);
  return { day, start, end };
};

/**
 * 새로운 밋업을 생성하고 초기화합니다.
 * @param {string} meetupId - 밋업을 식별하는 고유 ID
 * @param {string[]} timeSlots - 주최자가 설정한 가능 시간대 문자열 배열
 * @param {string[]} userNames - 밋업에 초대된 사용자 이름 배열
 */
function arrange(meetupId, timeSlots, userNames) {
  meetups[meetupId] = {
    availableTimes: timeSlots.map(parseTime),
    invitedUsers: userNames,
    votes: {},
  };
}

/**
 * 특정 밋업에 사용자의 참석 가능 시간을 투표합니다.
 * @param {string} meetupId - 투표할 밋업의 ID
 * @param {string} userName - 투표하는 사용자의 이름
 * @param {string[]} voteTimes - 사용자가 참석 가능한 시간대 문자열 배열
 */
function vote(meetupId, userName, voteTimes) {
  if (
    !meetups[meetupId] ||
    !meetups[meetupId].invitedUsers.includes(userName)
  ) {
    return;
  }
  meetups[meetupId].votes[userName] = voteTimes.map(parseTime);
}

/**
 * 특정 밋업을 마감하고, 최종 시간표와 추천 시간대를 콘솔에 출력합니다.
 * @param {string} meetupId - 마감할 밋업의 ID
 */
function close(meetupId) {
  const meetup = meetups[meetupId];
  if (!meetup) return;

  const timeTable = createTimeTable(meetup);
  const schedule = buildSchedule(meetup, timeTable);
  const bestTime = findBestTime(schedule);

  printSchedule(meetupId, meetup, schedule, bestTime);
}

/**
 * 밋업의 전체 가능 시간대를 1시간 단위의 슬롯으로 분할하여 시간표의 뼈대를 생성합니다.
 * @param {Meetup} meetup - 밋업 정보 객체
 * @returns {TimeObject[]} 1시간 단위로 분할된 시간 슬롯 배열
 */
function createTimeTable(meetup) {
  const timeTable = [];
  meetup.availableTimes.forEach(({ day, start, end }) => {
    for (let i = start; i < end; i++) {
      timeTable.push({ day, start: i, end: i + 1 });
    }
  });
  return timeTable;
}

/**
 * 시간표 뼈대에 사용자들의 투표 정보를 채워 전체 스케줄을 생성합니다.
 * @param {Meetup} meetup - 밋업 정보 객체
 * @param {TimeObject[]} timeTable - 1시간 단위로 분할된 시간 슬롯 배열
 * @returns {ScheduleSlot[]} 각 시간 슬롯별 참석자 정보가 포함된 전체 스케줄 배열
 */
function buildSchedule(meetup, timeTable) {
  return timeTable.map((slot) => {
    const attendees = getAttendeesForSlot(meetup, slot);
    return { ...slot, attendees, total: attendees.length };
  });
}

/**
 * 특정 시간 슬롯에 참석 가능한 모든 사용자의 목록을 반환합니다.
 * @param {Meetup} meetup - 밋업 정보 객체
 * @param {TimeObject} slot - 확인할 1시간 단위 시간 슬롯
 * @returns {string[]} 참석 가능한 사용자 이름 배열
 */
function getAttendeesForSlot(meetup, slot) {
  return meetup.invitedUsers.filter((user) => {
    return isUserAvailable(meetup.votes[user] || [], slot);
  });
}

/**
 * 특정 사용자가 주어진 시간 슬롯에 참석 가능한지 확인합니다.
 * @param {TimeObject[]} userVotes - 특정 사용자의 전체 투표 시간 배열
 * @param {TimeObject} slot - 확인할 1시간 단위 시간 슬롯
 * @returns {boolean} 참석 가능하면 true, 아니면 false
 */
function isUserAvailable(userVotes, slot) {
  return userVotes.some(
    (vote) =>
      vote.day === slot.day && vote.start <= slot.start && vote.end >= slot.end
  );
}

/**
 * 전체 스케줄에서 가장 유력한 시간대를 찾습니다.
 * 1순위: 총 참석 인원, 2순위: 연속 참석 가능 인원.
 * @param {ScheduleSlot[]} schedule - 참석자 정보가 포함된 전체 스케줄 배열
 * @returns {ScheduleSlot | null} 가장 유력한 시간 슬롯 객체. 없으면 null.
 */
function findBestTime(schedule) {
  if (schedule.length === 0) return null;

  let bestSlots = [];
  let maxTotal = 0;

  schedule.forEach((slot) => {
    if (slot.total > maxTotal) {
      maxTotal = slot.total;
      bestSlots = [slot];
    } else if (slot.total === maxTotal && maxTotal > 0) {
      bestSlots.push(slot);
    }
  });

  if (bestSlots.length <= 1) {
    return bestSlots[0];
  }

  return findBestConsecutiveSlot(schedule, bestSlots);
}

/**
 * 최대 참석 인원이 동점인 시간들 중에서, 연속 참석 점수가 가장 높은 시간대를 찾습니다.
 * @param {ScheduleSlot[]} schedule - 전체 스케줄 배열
 * @param {ScheduleSlot[]} bestSlots - 최대 참석 인원으로 동점인 시간 슬롯들의 배열
 * @returns {ScheduleSlot} 최종적으로 선택된 최적의 시간 슬롯
 */
function findBestConsecutiveSlot(schedule, bestSlots) {
  let bestSlot = bestSlots[0];
  let maxConsecutiveScore = 0;

  bestSlots.forEach((slot) => {
    const consecutiveScore = calculateConsecutiveScore(schedule, slot);
    if (consecutiveScore > maxConsecutiveScore) {
      maxConsecutiveScore = consecutiveScore;
      bestSlot = slot;
    }
  });

  return bestSlot;
}

/**
 * 특정 시간 슬롯의 "연속 참석 점수"를 계산합니다.
 * 점수는 현재 슬롯과 다음 슬롯에 모두 참석하는 인원수입니다.
 * @param {ScheduleSlot[]} schedule - 전체 스케줄 배열
 * @param {ScheduleSlot} currentSlot - 점수를 계산할 현재 시간 슬롯
 * @returns {number} 계산된 연속 참석 점수
 */
function calculateConsecutiveScore(schedule, currentSlot) {
  const nextSlotIndex = schedule.findIndex(
    (s) => s.day === currentSlot.day && s.start === currentSlot.end
  );

  if (nextSlotIndex === -1) return 0;

  const nextSlot = schedule[nextSlotIndex];
  const commonAttendees = currentSlot.attendees.filter((attendee) =>
    nextSlot.attendees.includes(attendee)
  );

  return commonAttendees.length;
}

/**
 * 최종 집계된 스케줄을 콘솔에 표 형태로 출력합니다.
 * @param {string} meetupId - 출력할 밋업의 ID
 * @param {Meetup} meetup - 밋업 정보 객체
 * @param {ScheduleSlot[]} schedule - 참석자 정보가 포함된 전체 스케줄 배열
 * @param {ScheduleSlot | null} bestTime - 가장 유력한 시간 슬롯 객체
 */
function printSchedule(meetupId, meetup, schedule, bestTime) {
  const { invitedUsers } = meetup;
  const header = `밋업${meetupId}   |  ${invitedUsers.join("  |  ")}  | Total`;
  console.log(header);
  console.log("-".repeat(header.length));

  let currentDay = "";
  schedule.forEach((slot) => {
    if (slot.day !== currentDay) {
      currentDay = slot.day;
      console.log("-".repeat(header.length));
    }
    printSlot(slot, invitedUsers, bestTime);
  });

  console.log("-".repeat(header.length));
  printBestTime(meetupId, bestTime);
}

/**
 * 스케줄 표의 한 행(시간 슬롯)을 형식에 맞게 콘솔에 출력합니다.
 * @param {ScheduleSlot} slot - 출력할 시간 슬롯 정보
 * @param {string[]} users - 전체 초대 사용자 목록 (표의 열 순서를 위해 필요)
 * @param {ScheduleSlot | null} bestTime - 최적 시간 정보 (해당 슬롯에 '*' 표시를 위해 필요)
 */
function printSlot(slot, users, bestTime) {
  const timeStr = `${slot.day} ${String(slot.start).padStart(2, "0")}-${String(
    slot.end
  ).padStart(2, "0")}`.padEnd(8);
  const userMarks = users
    .map((user) =>
      slot.attendees.includes(user) ? "🁢🁢🁢".padEnd(3) : "   ".padEnd(3)
    )
    .join(" | ");
  const total = String(slot.total).padEnd(2);
  const isBest =
    bestTime && bestTime.day === slot.day && bestTime.start === slot.start
      ? "*"
      : "";
  console.log(`${timeStr}| ${userMarks} | ${total}${isBest}`);
}

/**
 * 최종 추천 시간대 정보를 콘솔에 출력합니다.
 * @param {string} meetupId - 밋업 ID
 * @param {ScheduleSlot | null} bestTime - 가장 유력한 시간 슬롯 객체
 */
function printBestTime(meetupId, bestTime) {
  if (!bestTime) {
    console.log("\n추천 시간대를 찾을 수 없습니다.");
    return;
  }
  const timeStr = `${bestTime.day} ${String(bestTime.start).padStart(
    2,
    "0"
  )}-${String(bestTime.end).padStart(2, "0")}`;
  const attendees = bestTime.attendees.join(", ");
  console.log(
    `\n${meetupId} 추천 시간대\n${timeStr} : ${bestTime.total}명 ${attendees}`
  );
}

// --- 테스트 코드 ---
const meetupId = "M1";
const availableTimes = ["월10-16", "화10-13", "수12-16", "수17-18", "금19-20"];
const invitedUsers = ["A", "B", "C", "D"];

arrange(meetupId, availableTimes, invitedUsers);

vote(meetupId, "A", ["월10-11", "화10-11", "수12-13", "수17-18"]);
vote(meetupId, "B", ["월10-12", "수12-14", "목16-17"]); // 목16-17은 없는 시간이므로 무시됨
vote(meetupId, "C", ["화10-12", "수12-15", "금19-20"]);
vote(meetupId, "D", ["월10-15", "수12-16", "수17-18", "금19-20"]);

close(meetupId);

console.log("\n\n--- 추가 테스트 케이스 ---");

// 테스트 케이스 1: 연속 점수가 더 높은 '화10-11'이 선택되어야 함
console.log("\n--- 테스트 1: 연속성 점수 비교 ---");
const meetupId2 = "M2";
arrange(meetupId2, ["월10-12", "화10-12"], ["A", "B", "C"]);
vote(meetupId2, "A", ["월10-11", "화10-12"]);
vote(meetupId2, "B", ["월10-11", "화10-12"]);
vote(meetupId2, "C", ["월11-12"]);
// 월10-11 (2명), 월11-12 (1명) -> 연속 점수: 1명 (C는 연속참여X)
// 화10-11 (2명), 화11-12 (2명) -> 연속 점수: 2명
// 결과: 화10-11이 추천되어야 함
close(meetupId2);

// 테스트 케이스 2: 동점이지만 연속 점수가 0인 경우, 먼저 나온 시간이 선택됨
console.log("\n--- 테스트 2: 연속성 0점 동점 ---");
const meetupId3 = "M3";
arrange(meetupId3, ["월10-12", "화10-12"], ["A", "B"]);
vote(meetup3, "A", ["월10-11"]);
vote(meetupId3, "B", ["화10-11"]);
// 월10-11 (1명), 월11-12 (0명) -> 연속 점수: 0
// 화10-11 (1명), 화11-12 (0명) -> 연속 점수: 0
// 결과: 먼저 나온 월10-11이 추천되어야 함
close(meetupId3);

// 테스트 케이스 3: 동점이고, 연속 점수도 같은 경우, 먼저 나온 시간이 선택됨
console.log("\n--- 테스트 3: 연속성 점수까지 동일 ---");
const meetupId4 = "M4";
arrange(meetupId4, ["월10-13", "화10-13"], ["A", "B", "C"]);
vote(meetupId4, "A", ["월10-12", "화10-12"]);
vote(meetupId4, "B", ["월10-12", "화10-12"]);
vote(meetupId4, "C", ["월12-13", "화12-13"]);
// 월10-11 (2명), 월11-12 (2명), 월12-13 (1명) -> 연속 점수: 2명
// 화10-11 (2명), 화11-12 (2명), 화12-13 (1명) -> 연속 점수: 2명
// 결과: 먼저 나온 월10-11이 추천되어야 함
close(meetupId4);

```

```jsx
밋업M1   |  A  |  B  |  C  |  D  | Total
--------------------------------------
--------------------------------------
월 10-11 | 🁢🁢🁢 | 🁢🁢🁢 |     | 🁢🁢🁢 | 3 
월 11-12 |     | 🁢🁢🁢 |     | 🁢🁢🁢 | 2 
월 12-13 |     |     |     | 🁢🁢🁢 | 1 
월 13-14 |     |     |     | 🁢🁢🁢 | 1 
월 14-15 |     |     |     | 🁢🁢🁢 | 1 
월 15-16 |     |     |     |     | 0 
--------------------------------------
화 10-11 | 🁢🁢🁢 |     | 🁢🁢🁢 |     | 2 
화 11-12 |     |     | 🁢🁢🁢 |     | 1 
화 12-13 |     |     |     |     | 0 
--------------------------------------
수 12-13 | 🁢🁢🁢 | 🁢🁢🁢 | 🁢🁢🁢 | 🁢🁢🁢 | 4 *
수 13-14 |     | 🁢🁢🁢 | 🁢🁢🁢 | 🁢🁢🁢 | 3 
수 14-15 |     |     | 🁢🁢🁢 | 🁢🁢🁢 | 2 
수 15-16 |     |     |     | 🁢🁢🁢 | 1 
수 17-18 | 🁢🁢🁢 |     |     | 🁢🁢🁢 | 2 
--------------------------------------
금 19-20 |     |     | 🁢🁢🁢 | 🁢🁢🁢 | 2 
--------------------------------------

M1 추천 시간대
수 12-13 : 4명 A, B, C, D

--- 추가 테스트 케이스 ---

--- 테스트 1: 연속성 점수 비교 ---
밋업M2   |  A  |  B  |  C  | Total
--------------------------------
--------------------------------
월 10-11 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 
월 11-12 |     |     | 🁢🁢🁢 | 1 
--------------------------------
화 10-11 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 *
화 11-12 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 
--------------------------------

M2 추천 시간대
화 10-11 : 2명 A, B

--- 테스트 2: 연속성 0점 동점 ---
밋업M3   |  A  |  B  | Total
--------------------------
--------------------------
월 10-11 | 🁢🁢🁢 |     | 1 *
월 11-12 |     |     | 0 
--------------------------
화 10-11 |     | 🁢🁢🁢 | 1 
화 11-12 |     |     | 0 
--------------------------

M3 추천 시간대
월 10-11 : 1명 A

--- 테스트 3: 연속성 점수까지 동일 ---
밋업M4   |  A  |  B  |  C  | Total
--------------------------------
--------------------------------
월 10-11 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 *
월 11-12 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 
월 12-13 |     |     | 🁢🁢🁢 | 1 
--------------------------------
화 10-11 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 
화 11-12 | 🁢🁢🁢 | 🁢🁢🁢 |     | 2 
화 12-13 |     |     | 🁢🁢🁢 | 1 
--------------------------------

M4 추천 시간대
월 10-11 : 2명 A, B
```

## 개선사항

- 사용자 투표에 잘못된 시간정보 (이용가능한 시간이 아닌 시간대)가 들어왔을때 어떻게 처리해야할지에 관한 고민이 있습니다.
- 현재는 입력 데이터들을 코드 내부에서 정의한 이후 함수들을 호출하는 방식으로 구현이 되어있는데 readline을 이용하여 실제 입력값을 받아 처리하는 식으로 개선하면 좋을것 같습니다. (입력값에 대한 Validation 검증이 더 필요함)