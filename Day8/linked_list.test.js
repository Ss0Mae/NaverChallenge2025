const ImmutableLinkedList = require('./linked_list.js');

describe('ImmutableLinkedList', () => {
  let list;

  beforeEach(() => {
    list = new ImmutableLinkedList();
  });

  test('새 리스트는 비어있어야 한다', () => {
    expect(list.head).toBeNull();
    expect(list.toArray()).toEqual([]);
  });

  describe('append', () => {
    test('비어있는 리스트에 아이템을 추가하면 새 리스트를 반환해야 한다', () => {
      const newList = list.append(10);
      expect(newList.toArray()).toEqual([10]);
      // 원본 리스트는 변경되지 않아야 한다 (불변성 체크)
      expect(list.toArray()).toEqual([]);
    });

    test('아이템이 있는 리스트에 아이템을 추가하면 새 리스트를 반환해야 한다', () => {
      const listWithOne = list.append(10);
      const listWithTwo = listWithOne.append(20);

      expect(listWithTwo.toArray()).toEqual([10, 20]);
      // 원본 리스트는 변경되지 않아야 한다 (불변성 체크)
      expect(listWithOne.toArray()).toEqual([10]);
    });
  });

  describe('insert', () => {
    beforeEach(() => {
      list = list.append(10).append(30);
    });

    test('중간에 아이템을 삽입한 새 리스트를 반환해야 한다', () => {
      const newList = list.insert(1, 20);
      expect(newList.toArray()).toEqual([10, 20, 30]);
      // 원본 리스트는 변경되지 않아야 한다
      expect(list.toArray()).toEqual([10, 30]);
    });

    test('맨 앞에 아이템을 삽입한 새 리스트를 반환해야 한다', () => {
      const newList = list.insert(0, 5);
      expect(newList.toArray()).toEqual([5, 10, 30]);
      expect(list.toArray()).toEqual([10, 30]);
    });

    test('유효하지 않은 인덱스에 삽입 시도 시 원본 리스트를 반환해야 한다', () => {
      const newList = list.insert(-1, 99);
      expect(newList).toBe(list); // 동일한 인스턴스여야 함
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      list = list.append(10).append(20).append(30);
    });

    test('중간 아이템을 제거한 새 리스트를 반환해야 한다', () => {
      const newList = list.remove(1);
      expect(newList.toArray()).toEqual([10, 30]);
      // 원본 리스트는 변경되지 않아야 한다
      expect(list.toArray()).toEqual([10, 20, 30]);
    });

    test('첫번째 아이템을 제거한 새 리스트를 반환해야 한다', () => {
      const newList = list.remove(0);
      expect(newList.toArray()).toEqual([20, 30]);
      expect(list.toArray()).toEqual([10, 20, 30]);
    });

    test('마지막 아이템을 제거한 새 리스트를 반환해야 한다', () => {
      const newList = list.remove(2);
      expect(newList.toArray()).toEqual([10, 20]);
      expect(list.toArray()).toEqual([10, 20, 30]);
    });

    test('유효하지 않은 인덱스 제거 시도 시 원본 리스트를 반환해야 한다', () => {
      const newList = list.remove(99);
      expect(newList.toArray()).toEqual([10, 20, 30]);
    });
  });

  describe('item', () => {
    beforeEach(() => {
      list = list.append(10).append(20).append(30);
    });

    test('특정 인덱스의 아이템을 정확히 반환해야 한다', () => {
      expect(list.item(0)).toBe(10);
      expect(list.item(1)).toBe(20);
      expect(list.item(2)).toBe(30);
    });

    test('유효하지 않은 인덱스 조회 시 undefined를 반환해야 한다', () => {
      expect(list.item(99)).toBeUndefined();
      expect(list.item(-1)).toBeUndefined();
    });
  });

  describe('clear', () => {
    test('리스트를 비운 새로운 빈 리스트를 반환해야 한다', () => {
      list = list.append(10).append(20);
      const newList = list.clear();

      expect(newList.head).toBeNull();
      expect(newList.toArray()).toEqual([]);
      // 원본 리스트는 변경되지 않아야 한다
      expect(list.toArray()).toEqual([10, 20]);
    });
  });
});
