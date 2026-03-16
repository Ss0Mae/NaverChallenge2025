const readline = require('readline');

class Dashboard {
    constructor() {
        this.customers = {}; // 고객별 영상 목록을 관리
    }

    addVideo(video) {
        if (!this.customers[video.customerId]) {
            this.customers[video.customerId] = [];
        }
        this.customers[video.customerId].push({ ...video, status: '대기중' });
    }

    _updateVideoStatus(video, status) {
        const customerVideos = this.customers[video.customerId];
        if (!customerVideos) return;

        const videoToUpdate = customerVideos.find(v => v.id === video.id);
        if (videoToUpdate) {
            videoToUpdate.status = status;
            if (video.converterId) videoToUpdate.converterId = video.converterId;
            if (video.validatorId) videoToUpdate.validatorId = video.validatorId;
        }
    }

    updateToConverting(video) {
        this._updateVideoStatus(video, `변환중(모듈${video.converterId})`);
    }

    updateToValidating(video) {
        this._updateVideoStatus(video, `검증중(모듈${video.validatorId})`);
    }

    updateToPublic(video) {
        this._updateVideoStatus(video, '공개중');
        this.checkIfCustomerDone(video.customerId);
    }

    checkIfCustomerDone(customerId) {
        const customerVideos = this.customers[customerId];
        if (!customerVideos) return;

        const allDone = customerVideos.every(v => v.status === '공개중');
        if (allDone) {
            // 커서를 아래로 옮기고 메시지를 출력해야 입력 줄과 겹치지 않습니다.
            readline.cursorTo(process.stdout, 0, 15); // 충분한 공간 확보
            console.log(`
🎉 [${customerId}] 고객님의 모든 영상이 공개되었습니다! 🎉
`);
            // 다시 프롬프트 위치로 커서 이동
            readline.cursorTo(process.stdout, 0, 4);
            process.stdout.write('> ');
        }
    }

    print() {
        readline.cursorTo(process.stdout, 0, 4);
        readline.clearScreenDown(process.stdout);

        console.log("--- 영상 처리 현황판 ---");
        if (Object.keys(this.customers).length === 0) {
            console.log("처리할 영상이 없습니다.");
        } else {
            for (const customerId in this.customers) {
                console.log(`\n[고객: ${customerId}]`);
                this.customers[customerId].forEach(video => {
                    console.log(`  - ${video.name} (${video.type}): ${video.status}`);
                });
            }
        }
        console.log("\n----------------------");
    }
}

module.exports = Dashboard;