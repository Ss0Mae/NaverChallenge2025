const ImmutableLinkedList = require('./linked_list.js');

class ImmutableHashMap {
  /**
   * @param {Array<ImmutableLinkedList>} buckets 해시 버킷 (연결 리스트의 배열)
   */
  constructor(buckets = []) {
    // 기본 버킷 크기를 정합니다. (소수 사용이 충돌을 줄이는 데 도움이 될 수 있음)
    this.bucketSize = 31;
    this.buckets = buckets.length > 0 ? buckets : Array(this.bucketSize).fill(null).map(() => new ImmutableLinkedList());
  }

  /**
   * 간단한 문자열 해시 함수입니다.
   * 키를 해시값(숫자)으로 변환합니다.
   * @param {string} key
   * @returns {number}
   */
  _hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 키-값 쌍을 추가/수정하고, "새로운" 해시맵을 반환합니다.
   * @param {string} key
   * @param {*} value
   * @returns {ImmutableHashMap}
   */
  put(key, value) {
    const index = this._hash(key) % this.bucketSize;
    const bucket = this.buckets[index];

    // 버킷(연결 리스트)에서 기존 키를 찾아 인덱스를 확인합니다.
    const existingNodeIndex = bucket.toArray().findIndex(node => node.key === key);

    let newBucket;
    if (existingNodeIndex > -1) {
      // 키가 이미 존재하면, 해당 노드를 제거하고 새로 추가(수정 효과)
      newBucket = bucket.remove(existingNodeIndex).append({ key, value });
    } else {
      // 키가 없으면, 맨 뒤에 추가
      newBucket = bucket.append({ key, value });
    }

    // buckets 배열을 복사하고, 해당 인덱스만 새로운 버킷으로 교체합니다.
    const newBuckets = [...this.buckets];
    newBuckets[index] = newBucket;

    return new ImmutableHashMap(newBuckets);
  }

  /**
   * 키에 해당하는 값을 찾아서 반환합니다.
   * @param {string} key
   * @returns {*} 해당 키의 값 또는 undefined
   */
  get(key) {
    const index = this._hash(key) % this.bucketSize;
    const bucket = this.buckets[index];

    if (!bucket || !bucket.head) {
      return undefined;
    }

    // 연결 리스트를 순회하며 키를 찾습니다.
    const foundNode = bucket.toArray().find(node => node.key === key);

    return foundNode ? foundNode.value : undefined;
  }

  /**
   * 특정 키를 포함하는지 여부를 반환합니다.
   * @param {string} key
   * @returns {boolean}
   */
  contains(key) {
    const index = this._hash(key) % this.bucketSize;
    const bucket = this.buckets[index];

    if (!bucket || !bucket.head) {
      return false;
    }

    // 연결 리스트에 해당 키를 가진 노드가 있는지 확인합니다.
    return bucket.toArray().some(node => node.key === key);
  }

  /**
   * 특정 키를 제거하고, 새로운 해시맵을 반환합니다.
   * @param {string} key
   * @returns {ImmutableHashMap}
   */
  remove(key) {
    const index = this._hash(key) % this.bucketSize;
    const bucket = this.buckets[index];

    if (!bucket || !bucket.head) {
      return this; // 키가 없으므로 원본 반환
    }

    const nodeIndexToRemove = bucket.toArray().findIndex(node => node.key === key);

    // 키를 찾지 못했으면 원본을 반환합니다.
    if (nodeIndexToRemove === -1) {
      return this;
    }

    // 키를 찾았으면, 해당 노드를 제거한 새 버킷을 만듭니다.
    const newBucket = bucket.remove(nodeIndexToRemove);

    // buckets 배열을 복사하고, 해당 인덱스만 새로운 버킷으로 교체합니다.
    const newBuckets = [...this.buckets];
    newBuckets[index] = newBucket;

    return new ImmutableHashMap(newBuckets);
  }

  /**
   * 모든 키를 배열로 반환합니다.
   * @returns {Array<string>}
   */
  keys() {
    const allKeys = [];
    for (const bucket of this.buckets) {
      if (bucket && bucket.head) {
        // 각 버킷(연결 리스트)의 모든 노드를 순회하며 키를 추출합니다.
        const bucketKeys = bucket.toArray().map(node => node.key);
        allKeys.push(...bucketKeys);
      }
    }
    return allKeys;
  }
}

module.exports = ImmutableHashMap;
