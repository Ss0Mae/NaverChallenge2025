class Node {
  constructor(data, next = null) {
    this.data = data;
    this.next = next;
  }
}

class ImmutableLinkedList {
  constructor(head = null) {
    this.head = head;
  }
  /**
   * 리스트의 맨 끝에 데이터를 추가하고, "새로운" 리스트를 반환합니다.
   * 재귀를 사용하여 기존 리스트를 복사하고 마지막에 새 노드를 추가합니다.
   * @param {*} data 추가할 데이터
   * @returns {ImmutableLinkedList} 새로운 리스트 인스턴스
   */
  append(data) {
    // 리스트가 비어있다면, 새 노드를 head로 하는 새 리스트를 반환합니다.
    if (!this.head) {
      return new ImmutableLinkedList(new Node(data));
    }

    // 재귀적으로 노드를 복사하는 헬퍼 함수
    const copyAndAppend = (node) => {
      // 재귀의 끝(마지막 노드)에 도달하면,
      // 기존 노드를 복사하고 그 next에 새로운 노드를 연결합니다.
      if (!node.next) {
        return new Node(node.data, new Node(data));
      }
      // 다음 노드로 이동하며 재귀적으로 복사본을 생성합니다.
      const newNextNode = copyAndAppend(node.next);
      return new Node(node.data, newNextNode);
    };

    const newHead = copyAndAppend(this.head);
    return new ImmutableLinkedList(newHead);
  }

  /**
   * 특정 인덱스에 데이터를 삽입하고, "새로운" 리스트를 반환합니다.
   * @param {number} at 삽입할 위치의 인덱스
   * @param {*} data 삽입할 데이터
   * @returns {ImmutableLinkedList} 새로운 리스트 인스턴스
   */
  insert(at, data) {
    if (at < 0) return this; // 유효하지 않은 인덱스면 원본 반환

    // 재귀적으로 노드를 복사하며 삽입 위치를 찾는 헬퍼 함수
    const insertRec = (node, currentIndex) => {
      // 삽입 위치에 도달하면, 새 노드를 생성하고 원본 리스트의 현재 노드를 연결합니다.
      if (currentIndex === at) {
        return new Node(data, node);
      }
      // 삽입 위치를 찾기 전까지, 또는 인덱스가 범위를 벗어날 때까지 재귀 호출
      if (node === null) {
        return null; // 인덱스가 리스트 크기를 벗어나면 null 반환
      }

      const newNext = insertRec(node.next, currentIndex + 1);
      return new Node(node.data, newNext);
    };

    const newHead = insertRec(this.head, 0);
    return new ImmutableLinkedList(newHead);
  }

  /**
   * 특정 인덱스의 노드를 제거하고, "새로운" 리스트를 반환합니다.
   * @param {number} at 제거할 위치의 인덱스
   * @returns {ImmutableLinkedList} 새로운 리스트 인스턴스
   */
  remove(at) {
    if (at < 0 || !this.head) return this; // 유효하지 않거나 빈 리스트면 원본 반환

    // 재귀적으로 노드를 복사하며 제거할 노드를 건너뛰는 헬퍼 함수
    const removeRec = (node, currentIndex) => {
      if (node === null) return null;
      // 제거할 노드를 찾으면, 그 다음 노드를 반환하여 연결에서 제외시킵니다.
      if (currentIndex === at) {
        return node.next;
      }
      // 제거할 노드가 아니면, 현재 노드를 복사하고 다음 노드에 대한 재귀 호출 결과를 연결합니다.
      const newNext = removeRec(node.next, currentIndex + 1);
      return new Node(node.data, newNext);
    };

    const newHead = removeRec(this.head, 0);
    return new ImmutableLinkedList(newHead);
  }

  /**
   * 특정 인덱스의 데이터를 반환합니다. (상태를 변경하지 않음)
   * @param {number} at 찾을 위치의 인덱스
   * @returns {*} 해당 위치의 데이터 또는 undefined
   */
  item(at) {
    if (at < 0) return undefined;

    const findAt = (node, currentIndex) => {
      if (!node) return undefined; // 인덱스 범위 벗어남
      if (currentIndex === at) return node.data; // 노드 찾음
      return findAt(node.next, currentIndex + 1); // 다음 노드로 이동
    };

    return findAt(this.head, 0);
  }

  /**
   * 리스트를 비우고, "새로운" 빈 리스트를 반환합니다.
   * @returns {ImmutableLinkedList} 비어있는 새로운 리스트 인스턴스
   */
  clear() {
    return new ImmutableLinkedList();
  }

  /**
   * (Helper) 리스트를 배열로 변환하여 쉽게 확인하도록 돕습니다.
   * @returns {Array}
   */
  toArray() {
    const arr = [];
    let node = this.head;
    while (node) {
      arr.push(node.data);
      node = node.next;
    }
    return arr;
  }
}

module.exports = ImmutableLinkedList;
