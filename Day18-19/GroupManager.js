class GroupManager {
    constructor() {
        this.groups = new Map(); // groupId -> Set of campIds
        this.nextGroupId = 1;
    }

    joinGroup(campId) {
        let targetGroupId = -1;

        // 빈 자리가 있는 그룹 찾기
        for (const [groupId, members] of this.groups.entries()) {
            if (members.size < 4) {
                targetGroupId = groupId;
                break;
            }
        }

        if (targetGroupId === -1) {
            // 새 그룹 생성
            targetGroupId = this.nextGroupId++;
            this.groups.set(targetGroupId, new Set());
        }

        this.groups.get(targetGroupId).add(campId);
        if (process.env.NODE_ENV !== 'test') {
            console.log(`${campId}님이 ${targetGroupId}번 그룹에 참여했습니다.`);
        }
        return targetGroupId;
    }

    leaveGroup(groupId, campId) {
        if (this.groups.has(groupId)) {
            const members = this.groups.get(groupId);
            members.delete(campId);
            if (process.env.NODE_ENV !== 'test') {
                console.log(`${campId}님이 ${groupId}번 그룹에서 나갔습니다.`);
            }
            if (members.size === 0) {
                this.groups.delete(groupId);
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`${groupId}번 그룹이 비어있어 삭제됩니다.`);
                }
            }
        }
    }

    getGroupMembers(groupId) {
        return this.groups.get(groupId) || new Set();
    }
}

module.exports = GroupManager;