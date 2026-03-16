const fs = require('fs');

class VectorDatabase {
    /**
     * 데이터베이스 파일을 지정하여 VectorDatabase 인스턴스를 생성합니다.
     * 파일이 존재하지 않으면 새로 생성합니다.
     * @param {string} vectorFilePath - 벡터 데이터가 저장된 JSON 파일 경로
     * @param {string} metadataFilePath - 메타데이터가 저장된 JSON 파일 경로
     */
    constructor(vectorFilePath, metadataFilePath) {
        this.vectorFilePath = vectorFilePath;
        this.metadataFilePath = metadataFilePath;
        this.vectors = this.loadData(this.vectorFilePath);
        this.metadata = this.loadData(this.metadataFilePath);
    }

    /**
     * 파일 경로에서 데이터를 로드합니다.
     * @param {string} filePath - 로드할 파일 경로
     * @returns {object | Array} 로드된 데이터
     */
    loadData(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            }
            // 파일이 없으면, 기본 데이터 구조를 반환합니다.
            return filePath.includes('vectors') ? [] : {};
        } catch (error) {
            console.error(`${filePath} 로드 중 오류 발생:`, error);
            return filePath.includes('vectors') ? [] : {};
        }
    }

    /**
     * 현재 데이터를 파일에 저장합니다.
     */
    saveData() {
        try {
            fs.writeFileSync(this.vectorFilePath, JSON.stringify(this.vectors, null, 2));
            fs.writeFileSync(this.metadataFilePath, JSON.stringify(this.metadata, null, 2));
        } catch (error) {
            console.error('데이터 저장 중 오류 발생:', error);
        }
    }

    /**
     * 새로운 벡터와 메타데이터를 추가합니다.
     * @param {string} id - 데이터의 고유 ID
     * @param {number[]} vector - 추가할 벡터
     * @param {object} metadata - 벡터에 대한 메타데이터
     */
    add(id, vector, metadata) {
        const index = this.vectors.findIndex(item => item.id === id);

        if (index > -1) {
            // ID가 존재하면, 벡터를 업데이트합니다.
            this.vectors[index].vector = vector;
        } else {
            // ID가 없으면, 새로 추가합니다.
            this.vectors.push({ id, vector });
        }

        // 메타데이터를 추가하거나 업데이트합니다.
        this.metadata[id] = metadata;

        this.saveData();
        console.log(`데이터 ID '${id}'이(가) 추가/업데이트되었습니다.`);
    }

    /**
     * ID를 기반으로 벡터와 메타데이터를 삭제합니다.
     * @param {string} id - 삭제할 데이터의 ID
     */
    delete(id) {
        const index = this.vectors.findIndex(item => item.id === id);

        if (index > -1) {
            this.vectors.splice(index, 1);
            delete this.metadata[id];
            this.saveData();
            console.log(`데이터 ID '${id}'이(가) 삭제되었습니다.`);
            return true;
        } else {
            console.log(`삭제할 데이터 ID '${id}'을(를) 찾을 수 없습니다.`);
            return false;
        }
    }

    /**
     * 주어진 쿼리 벡터와 가장 유사한 k개의 결과를 찾습니다.
     * @param {number[]} queryVector - 검색할 쿼리 벡터
     * @param {number} k - 반환할 결과의 수
     * @returns {Array<{id: string, score: number}>} 유사도 점수와 함께 정렬된 결과 리스트
     */
    search(queryVector, k) {
        if (!this.vectors || this.vectors.length === 0) {
            return [];
        }

        const similarities = this.vectors.map(item => ({
            id: item.id,
            score: this.cosineSimilarity(queryVector, item.vector)
        }));

        // 유사도 점수를 기준으로 내림차순 정렬
        similarities.sort((a, b) => b.score - a.score);

        // 상위 k개의 결과를 반환
        return similarities.slice(0, k);
    }

    /**
     * 두 벡터 간의 코사인 유사도를 계산합니다.
     * @param {number[]} vecA 
     * @param {number[]} vecB 
     * @returns {number} -1과 1 사이의 유사도 점수
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }

        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);

        if (magA === 0 || magB === 0) {
            return 0;
        }

        return dotProduct / (magA * magB);
    }
}

module.exports = VectorDatabase;
