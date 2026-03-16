class ChatManager {
    constructor() {
        // groupId -> { isActive: boolean, maxCount: number, currentCount: number, owner: string }
        this.chatRooms = new Map();
    }

    startChat(groupId, maxCount, ownerCampId) {
        if (this.isChatting(groupId)) {
            return false; // 이미 채팅 중
        }
        this.chatRooms.set(groupId, {
            isActive: true,
            maxCount: maxCount,
            currentCount: 0,
            owner: ownerCampId
        });
        if (process.env.NODE_ENV !== 'test') {
            console.log(`${groupId}번 그룹 채팅 시작 (개설자: ${ownerCampId}, 최대 메시지: ${maxCount})`);
        }
        return true;
    }

    finishChat(groupId, requesterCampId) {
        const room = this.chatRooms.get(groupId);
        if (!room || !room.isActive || room.owner !== requesterCampId) {
            return false; // 채팅 중이 아니거나 개설자가 아님
        }
        room.isActive = false;
        if (process.env.NODE_ENV !== 'test') {
            console.log(`${groupId}번 그룹 채팅 종료 (요청자: ${requesterCampId})`);
        }
        return true;
    }

    isChatting(groupId) {
        const room = this.chatRooms.get(groupId);
        return room && room.isActive;
    }

    incrementMessageCount(groupId) {
        const room = this.chatRooms.get(groupId);
        if (this.isChatting(groupId) && room.currentCount < room.maxCount) {
            room.currentCount++;
            if (process.env.NODE_ENV !== 'test') {
                console.log(`${groupId}번 그룹 메시지 카운트 증가: ${room.currentCount}/${room.maxCount}`);
            }
            return true;
        }
        return false;
    }
}

module.exports = ChatManager;