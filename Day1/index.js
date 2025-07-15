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
vote(meetupId3, "A", ["월10-11"]);
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
