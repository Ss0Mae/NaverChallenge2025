# Day 8: 함수형 불변 데이터 구조와 도서관 애플리케이션

## 🚀 미션 목표

이번 미션은 함수형 프로그래밍의 핵심 개념인 불변성(Immutability)과 순수 함수(Pure Function)를 이해하고, 이를 바탕으로 직접 불변 데이터 구조(연결 리스트, 해시맵)를 구현하는 것을 목표로 합니다. 더 나아가, 직접 만든 데이터 구조를 활용하여 실제 도서 관리 애플리케이션을 구축함으로써 이론과 실제를 연결하는 경험을 쌓습니다.

## 📝 프로그래밍 요구사항

### 미션 1: 함수형 데이터 구조 구현

- **불변 연결 리스트 (Immutable Linked List)**
    - `append()`, `insert(at)`, `remove(at)`, `item(at)`, `clear()` 필수 기능 구현
    - `Array`나 `List`를 직접 사용하지 않고, 노드 기반으로 구현
    - 모든 데이터 변경 작업은 새로운 연결 리스트 인스턴스를 반환해야 함
- **불변 해시맵 (Immutable HashMap)**
    - `put(key, value)`, `remove(key)`, `get(key)`, `contains(key)`, `keys()` 필수 기능 구현
    - 직접 구현한 **불변 연결 리스트**를 활용하여 해시 충돌(Hash Collision) 처리
    - 모든 데이터 변경 작업은 새로운 해시맵 인스턴스를 반환해야 함
- **공통 요구사항**
    - 모든 함수는 **참조 투명성**을 보장하고 부작용(Side Effect)이 없도록 순수 함수 형태로 작성
    - 반복문(`for`, `while`) 대신 `map`, `filter`, `reduce`와 같은 고차 함수를 적극적으로 활용
    - 구현 내용은 테스트 라이브러리(Jest, Mocha 등)를 통해 검증

### 미션 2: 도서 관리 프로그램 `CampLibrary` 구현

- **기능 요구사항**
    - `add(books)`: 신규 도서 입고
    - `rent(book, person)`: 도서 대여 (재고 관리 포함)
    - `return(book, person)`: 도서 반납
    - `sortByDate()`: 발행년도 기준 오름차순 정렬 (결과: `Array`)
    - `top10rent()`: 대여 횟수 상위 10권 조회 (결과: `Array`)
    - `findBy(author)`: 저자명으로 도서 검색 (결과: `Array`)
    - `totalRent()`: 현재 대여 중인 도서 목록과 권수 조회 (결과: `HashMap`)
- **추가 요구사항 (고차 함수 활용)**
    - `map(lambda)`: 전체 도서 정보를 변환하여 새로운 데이터 구조로 반환
    - `filter(lambda)`: 특정 조건의 도서만 필터링하여 새로운 데이터 구조로 반환
    - `display(lambda)`: 전체 도서 목록을 순회하며 주어진 동작 수행
- **기술 요구사항**
    - **미션 1에서 구현한 불변 데이터 구조를 반드시 활용**
    - 도서 정보 및 프로그램 상태는 불변 타입으로 관리
    - 각 기능의 시간/공간 복잡도를 분석하고 장단점 비교

## 💻 구현 과정 및 트러블슈팅

### 미션 1: 함수형 불변 데이터 구조 구현

#### 1. ImmutableLinkedList 구현 과정

1.  **기본 구조 설계:** `Node` 클래스와 `ImmutableLinkedList` 클래스의 기본 뼈대를 잡았습니다. 핵심은 `this.head` 외에 다른 상태(e.g., `size`)를 직접 가지지 않아 단순함을 유지하는 것이었습니다.
2.  **핵심 원칙 적용:** 모든 변경 메소드(`append`, `insert`, `remove`)가 `this`를 직접 수정하는 대신, 새로운 `ImmutableLinkedList` 인스턴스를 반환하도록 설계했습니다.
3.  **재귀적 접근:** 명령형 `while` 반복문 대신, 재귀 헬퍼 함수를 사용하여 각 노드를 순회하고 복사하는 로직을 구현했습니다. 예를 들어 `append`의 경우, `copyAndAppend`라는 재귀 함수가 마지막 노드에 도달할 때까지 자기 자신을 호출하며 새로운 노드 체인을 생성하고, 마지막에 새 노드를 추가하는 방식으로 구현했습니다.
    ```javascript
    // append의 재귀 헬퍼 함수 예시
    const copyAndAppend = (node) => {
      if (!node.next) { // 재귀의 끝 (Base Case)
        return new Node(node.data, new Node(data));
      }
      const newNextNode = copyAndAppend(node.next);
      return new Node(node.data, newNextNode);
    };
    ```
4.  **단위 테스트 작성:** 각 메소드 구현 직후, Jest를 사용하여 기능의 정확성과 **불변성**을 검증하는 테스트 코드를 작성했습니다. 원본 리스트가 변경되지 않았음을 확인하는 것이 핵심이었습니다.

#### 2. ImmutableHashMap 구현 과정

1.  **기반 설계:** 해시 충돌 해결 전략으로 **Separate Chaining**을 채택하고, 이를 위해 직접 구현한 `ImmutableLinkedList`를 버킷으로 사용하는 배열(`this.buckets`)을 설계했습니다.
2.  **해시 함수:** 간단한 문자열 기반 해시 함수(`_hash`)를 구현하여 키를 숫자 해시값으로 변환하고, 버킷 인덱스를 결정하는 데 사용했습니다.
3.  **`put` 메소드 구현:**
    - 키를 해시하여 인덱스를 찾고, `buckets` 배열을 얕게 복사(`[...this.buckets]`)하여 불변성을 확보했습니다.
    - 해당 인덱스의 연결 리스트에 이미 키가 존재하는지 `findIndex`로 확인했습니다.
    - 키가 존재하면 `remove` 후 `append` 하여 수정 효과를 냈고, 없으면 바로 `append` 하여 추가했습니다.
    - 이 과정에서 반환된 **새로운 연결 리스트**를 복사된 `buckets` 배열에 할당하고, 이를 기반으로 **새로운 `ImmutableHashMap`**을 반환했습니다.
4.  **`get`, `contains`, `remove`, `keys` 구현:** `put`과 유사한 원칙을 적용했습니다. 버킷을 찾고, 내부 연결 리스트의 `toArray()`와 고차 함수(`find`, `some`, `map` 등)를 조합하여 간결하고 선언적으로 기능을 구현했습니다.

#### 3. 트러블슈팅

-   **문제:** `ImmutableLinkedList` 테스트 시, `TypeError: ImmutableLinkedList is not a constructor` 에러가 발생했습니다.
    -   **원인:** `linkend_list.js` 파일에서 `ImmutableLinkedList` 클래스를 선언했지만, `module.exports`를 통해 외부로 내보내는(export) 코드가 누락되어 테스트 파일에서 클래스를 인식하지 못했습니다.
    -   **해결:** 파일 맨 마지막에 `module.exports = ImmutableLinkedList;` 코드를 추가하여 문제를 해결했습니다.

-   **문제:** `ImmutableHashMap`의 해시 충돌 테스트가 의도대로 동작하지 않고 실패했습니다.
    -   **원인:** 테스트 코드에서 `map._hash = ...` 와 같이 특정 **인스턴스**의 메소드만 변경했기 때문입니다. `map.put()`이 호출될 때 내부적으로 `new ImmutableHashMap()`을 통해 **새로운 인스턴스**가 생성되면서, 수정된 `_hash`가 아닌 원래의 `_hash` 메소드가 동작했습니다.
    -   **해결:** `ImmutableHashMap.prototype._hash`와 같이 클래스의 **프로토타입**을 직접 수정하여 모든 새 인스턴스가 변경된 메소드를 상속받도록 했습니다. 다른 테스트에 영향을 주지 않도록 `try...finally` 블록을 사용하여 테스트 종료 후 반드시 원본 메소드로 복원하는 처리를 추가했습니다.

### 미션 2: 도서 관리 프로그램 `CampLibrary` 구현

#### 1. CampLibrary 설계 및 구현

1.  **데이터 모델링:** `Book` 클래스를 정의하여 도서의 기본 정보와 함께, 재고 관리를 위한 `stock`, 대여 이력을 추적하기 위한 `rentHistory`(`ImmutableLinkedList`) 속성을 포함시켰습니다.
2.  **핵심 데이터 구조:** `CampLibrary`의 핵심 데이터 저장소로 `ImmutableLinkedList`를 사용하여 `this.books`를 관리하도록 설계했습니다.
3.  **기능 구현 (`add`, `rent`, `returnBook`):**
    - 각 기능은 `this.books` 리스트를 `toArray()`로 변환한 뒤, `findIndex`로 대상 책의 인덱스를 찾는 패턴을 공통적으로 사용했습니다.
    - 책의 상태(재고, 대여 이력)를 변경해야 할 때, 기존 `Book` 객체를 직접 수정하는 대신 필요한 속성만 변경된 **새로운 `Book` 인스턴스**를 생성했습니다.
    - `this.books.remove(index).insert(index, newBook)`와 같이, 기존 책을 새로운 책 인스턴스로 교체한 **새로운 `ImmutableLinkedList`**를 생성하고, 이를 기반으로 **새로운 `CampLibrary`**를 반환하여 불변성을 유지했습니다.
4.  **조회 기능 구현 (`findBy`, `sortByDate`, `top10rent`):**
    - `this.books.toArray()`로 얻은 배열에 `filter`, `map`, `sort` 등 JavaScript의 내장 고차 함수를 적극적으로 활용하여 선언적으로 구현했습니다.
    - 특히 `sort`는 원본 배열을 변경하는 메소드이므로, `[...booksArray].sort(...)`와 같이 배열을 복사한 후 정렬하여 부작용을 방지했습니다.

#### 2. 트러블슈팅

-   **문제:** `return` 메소드 구현 시, JavaScript의 예약어(reserved word)와 충돌하여 문법 에러가 발생했습니다.
    -   **원인:** `return`은 함수나 메소드의 반환을 위해 사용되는 키워드이므로, 메소드 이름으로 사용할 수 없습니다.
    -   **해결:** 메소드 이름을 의도가 명확히 드러나는 `returnBook`으로 변경하여 문제를 해결했습니다.

