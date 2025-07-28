const ImmutableHashMap = require('./hash_map.js');

describe('ImmutableHashMap', () => {
  let map;

  beforeEach(() => {
    map = new ImmutableHashMap();
  });

  test('새 맵은 비어있어야 한다', () => {
    expect(map.keys()).toEqual([]);
  });

  describe('put', () => {
    test('키-값 쌍을 추가하면 새로운 맵을 반환해야 한다', () => {
      const newMap = map.put('name', 'Alice');
      expect(newMap.get('name')).toBe('Alice');
      // 원본 맵은 변경되지 않아야 한다 (불변성 체크)
      expect(map.get('name')).toBeUndefined();
    });

    test('동일한 키로 값을 추가하면 값이 수정된 새로운 맵을 반환해야 한다', () => {
      const mapWithOne = map.put('name', 'Alice');
      const mapWithTwo = mapWithOne.put('name', 'Bob');
      expect(mapWithTwo.get('name')).toBe('Bob');
      // 원본 맵은 변경되지 않아야 한다
      expect(mapWithOne.get('name')).toBe('Alice');
    });

    test('해시 충돌이 발생해도 값을 잘 저장하고 조회해야 한다', () => {
      const originalHash = ImmutableHashMap.prototype._hash;
      try {
        // _hash 메소드를 프로토타입에 직접 패치하여 모든 인스턴스에 적용
        ImmutableHashMap.prototype._hash = (key) => (key === 'key1' || key === 'key2') ? 1 : 10;
        
        let map = new ImmutableHashMap();
        const newMap = map.put('key1', 'value1').put('key2', 'value2');

        expect(newMap.get('key1')).toBe('value1');
        expect(newMap.get('key2')).toBe('value2');
        expect(map.keys().length).toBe(0);
      } finally {
        // 테스트가 성공하든 실패하든 원본 메소드로 복원
        ImmutableHashMap.prototype._hash = originalHash;
      }
    });
  });

  describe('get', () => {
    test('존재하는 키의 값을 정확히 반환해야 한다', () => {
      const newMap = map.put('age', 30);
      expect(newMap.get('age')).toBe(30);
    });

    test('존재하지 않는 키에 대해 undefined를 반환해야 한다', () => {
      expect(map.get('address')).toBeUndefined();
    });
  });

  describe('contains', () => {
    beforeEach(() => {
      map = map.put('city', 'Seoul');
    });

    test('존재하는 키에 대해 true를 반환해야 한다', () => {
      expect(map.contains('city')).toBe(true);
    });

    test('존재하지 않는 키에 대해 false를 반환해야 한다', () => {
      expect(map.contains('country')).toBe(false);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      map = map.put('name', 'Alice').put('age', 30);
    });

    test('키를 제거하면 해당 키가 없는 새로운 맵을 반환해야 한다', () => {
      const newMap = map.remove('age');
      expect(newMap.contains('age')).toBe(false);
      expect(newMap.get('name')).toBe('Alice');
      // 원본 맵은 변경되지 않아야 한다
      expect(map.contains('age')).toBe(true);
    });

    test('존재하지 않는 키를 제거 시도 시 원본 맵을 그대로 반환해야 한다', () => {
      const newMap = map.remove('country');
      expect(newMap).toBe(map); // 동일한 인스턴스여야 함
    });
  });

  describe('keys', () => {
    test('맵의 모든 키를 배열로 반환해야 한다', () => {
      map = map.put('a', 1).put('b', 2).put('c', 3);
      // 순서는 해시값에 따라 달라질 수 있으므로, 정렬하여 비교
      expect(map.keys().sort()).toEqual(['a', 'b', 'c']);
    });

    test('빈 맵에서는 빈 배열을 반환해야 한다', () => {
      expect(map.keys()).toEqual([]);
    });
  });
});
