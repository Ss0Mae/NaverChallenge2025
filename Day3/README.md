# Day 3: XML 파서(Parser) 구현

## 1. 과제 목표

- **XML 파싱:** 순수 JavaScript(라이브러리 미사용)를 사용하여 다양한 형태의 XML 문자열을 분석하고, 의미 있는 트리(Tree) 형태의 데이터 구조로 변환하는 파서를 구현합니다.
- **데이터 활용:** 생성된 트리 구조를 탐색하고 분석하는 유틸리티 함수(JSON 변환, 속성 검색, 태그 개수 리포트, XPath 검색)를 구현합니다.
- **핵심 원리 학습:** 파서의 핵심 동작 원리인 토큰화(Tokenization)와 재귀적 트리 구축(Recursive Tree Building) 과정을 직접 구현하며 학습합니다.

---

## 2. 핵심 동작 원리

본 파서는 크게 **2단계**로 동작합니다.

1.  **토큰화 (Tokenization):** 입력된 XML 문자열을 더 이상 나눌 수 없는 의미 있는 조각, 즉 **토큰(Token)**으로 분해합니다. (`_tokenize` 메서드)
2.  **트리 구축 (Tree Building):** 생성된 토큰 스트림을 순회하며, 태그의 중첩 관계를 반영한 **트리 구조**를 재귀적으로 만들어나갑니다. (`_buildTree` 메서드)

### 전체 흐름도

<img width="3840" height="2509" alt="Untitled diagram _ Mermaid Chart-2025-07-16-075130" src="https://gist.github.com/user-attachments/assets/f08dc129-697e-4d5c-869c-6bfa60668885" />

---

## 3. 최종 데이터 구조

파싱이 완료되면, 결과는 다음과 같은 구조를 가진 객체로 저장됩니다.

```json
{
  "prolog": {
    "version": "1.0",
    "encoding": "utf-8"
  },
  "elements": [
    {
      "name": "LinearLayout",
      "attributes": [
        { "name": "xmlns:android", "value": "..." },
        { "name": "android:layout_width", "value": "match_parent" }
      ],
      "children": [
        {
          "name": "TextView",
          "attributes": [{ "name": "android:id", "value": "@+id/text" }],
          "children": [],
          "value": ""
        },
        {
          "name": "Spacer",
          "attributes": [],
          "children": [],
          "value": "blank"
        }
      ],
      "value": ""
    }
  ]
}
```

- **prolog:** XML의 메타 정보(버전, 인코딩 등)를 담는 객체입니다.
- **elements:** 최상위(root) 엘리먼트 노드들을 담는 배열입니다.
- **각 엘리먼트(노드) 객체:**
  - **name:** 태그의 이름 (e.g., `"LinearLayout"`)
  - **attributes:** 속성 객체들을 담는 배열
  - **children:** 자식 엘리먼트 노드들을 담는 배열 (중첩 구조)
  - **value:** 태그 내의 텍스트 값. 자식이 텍스트 노드 하나뿐일 경우, 편의를 위해 이곳에 저장됩니다.

---

## 4. 구현된 기능 명세

`XMLParser` 클래스는 다음과 같은 public 메서드를 제공합니다.

| 메서드                         | 설명                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `parse(xmlString)`             | XML 문자열을 받아 파싱을 수행하고, 최종 결과 객체를 반환합니다.                                                                       |
| `displayJSON()`                | 파싱된 결과 객체를 보기 좋게 포맷팅된 JSON 문자열로 변환하여 반환합니다.                                                              |
| `elementByAttribute(attrName)` | 트리 전체에서 `attrName`과 일치하는 속성 이름을 가진 모든 엘리먼트를 찾아 배열로 반환합니다.                                          |
| `reportByClass()`              | 트리 전체의 엘리먼트들을 태그 이름별로 카운트하여 `{ tagName: count }` 형태의 객체로 반환합니다.                                      |
| `findXPath(path)`              | `"/HTML/BODY/P[1]"`와 같은 XPath 형식의 경로를 받아 해당하는 엘리먼트 객체를 반환합니다. 인덱스가 없으면 첫 번째 엘리먼트를 찾습니다. |

---

## 5. 실행 방법

디렉토리에서 다음 명령어를 실행하여 파서의 모든 기능을 테스트할 수 있습니다.

```bash
node test-parser.js
```

`test-parser.js` 파일은 3가지 다른 형태의 XML(HTML, Android Layout, Property List) 샘플에 대해 모든 기능이 정상적으로 동작하는지 검증하는 테스트 스위트를 포함하고 있습니다.

---

## 6. 상세 구현 과정

이 파서는 XML 문자열을 분석하여 트리 구조로 변환하고, 이를 활용하는 유틸리티 함수를 제공합니다. 전체 과정은 토큰화, 트리 구축, 데이터 활용의 세 단계로 구성됩니다.

### 1단계: 토큰화 - `_tokenize`

`_tokenize` 메서드는 XML 문자열을 입력받아 파서가 이해할 수 있는 최소 단위인 '토큰'의 배열로 변환합니다.

- **문자열 순회:** 먼저 입력된 XML 문자열의 공백을 정규화하고, 문자열의 시작부터 끝까지 순차적으로 탐색합니다.
- **토큰 식별:**
  - **태그 (`<`):** `<` 문자를 만나면 `_handleTag` 헬퍼 함수를 호출하여 태그의 종류를 세부적으로 식별합니다.
    - `_handleTag`는 `<?`(prolog), `<!--`(주석), `</`(닫는 태그), `<`(여는 태그 또는 자체 종료 태그) 등의 패턴을 순차적으로 검사합니다.
    - 각 종류에 맞는 토큰(e.g., `{type: 'prolog', ...}`, `{type: 'tag_open', ...}`)을 생성합니다.
    - 여는 태그의 경우, `_parseAttributes`를 호출하여 태그 내 속성 문자열을 `name`/`value` 쌍의 객체 배열로 변환해 토큰에 포함시킵니다.
  - **텍스트:** 태그가 아닌 일반 텍스트를 만나면 `_handleText` 함수를 호출하여 `{type: 'text', ...}` 토큰을 생성합니다.
- **결과:** 이 과정을 통해 복잡한 XML 문자열은 `[{type: 'tag_open', ...}, {type: 'text', ...}, {type: 'tag_close', ...}]` 와 같은 명확한 구조의 토큰 배열로 변환됩니다.

### 2단계: 트리 구축 - `_buildTree`

`_buildTree` 메서드는 토큰화된 배열을 기반으로 XML의 중첩 구조를 반영하는 계층적 트리(Tree)를 생성합니다.

- **재귀 함수 `parseElement`:** `_buildTree` 내부에 정의된 `parseElement` 함수가 실제 트리 조립을 수행합니다. 이 함수는 토큰 배열의 현재 처리 위치를 가리키는 `tokenIndex`를 공유하며 진행 상태를 관리합니다.
- **동작 원리:**
  1.  **`tag_open` 토큰 발견 시:**
      - 해당 태그 이름으로 새로운 노드(객체)를 생성합니다.
      - 자식 노드를 처리하기 위해 `parseElement` 함수를 **재귀적으로 호출**합니다.
      - 재귀 호출은 해당 태그의 짝이 맞는 `tag_close` 토큰을 만날 때까지 계속되며, 그 사이 발견되는 모든 노드는 현재 노드의 `children` 배열에 추가됩니다.
  2.  **`tag_close` 토큰 발견 시:**
      - 재귀 호출을 종료하는 **Base Case** 역할을 합니다. 이는 현재 노드의 자식 탐색이 완료되었음을 의미하며, 상위 노드로 제어권을 반환합니다.
  3.  **`text` 또는 `tag_self_closing` 토큰 발견 시:**
      - 자식이 없는 단순 노드를 생성하여 반환합니다.
- **결과:** 모든 토큰을 순회하고 나면, `this.parseData.elements`에는 XML의 전체 구조를 표현하는 완전한 트리 객체가 저장됩니다.

### 3단계: 데이터 활용

파싱이 완료된 트리는 다양한 유틸리티 메서드를 통해 분석이 가능합니다.

- **`parse(xmlString)`:** 토큰화와 트리 구축 과정을 순차적으로 실행하는 메인 진입점 함수입니다.
- **`displayJSON()`:** `JSON.stringify`를 이용해 완성된 트리 객체를 포맷팅된 JSON 문자열로 변환합니다.
- **`elementByAttribute(attrName)`:** 재귀적으로 트리를 순회하며, 주어진 `attrName`과 일치하는 속성을 가진 모든 노드를 찾아 배열로 반환합니다.
- **`reportByClass()`:** 재귀적으로 트리를 순회하며 모든 노드의 태그 이름을 카운트하여, `{ tagName: count }` 형태의 리포트 객체를 생성합니다.
- **`findXPath(path)`:** `"/HTML/BODY/P[1]"`와 같은 경로 문자열을 받아, 각 단계별로 트리를 탐색하여 최종 경로에 해당하는 노드를 반환합니다.

```json
    --- [테스트 스위트 시작: HTML] ---

1. displayJSON() 결과:
{
  "prolog": {},
  "elements": [
    {
      "name": "HTML",
      "attributes": [
        {
          "name": "lang",
          "value": "ko"
        }
      ],
      "children": [
        {
          "name": "BODY",
          "attributes": [],
          "children": [
            {
              "name": "P",
              "attributes": [],
              "children": [
                {
                  "name": null,
                  "attributes": [],
                  "children": [],
                  "value": "BOOST"
                },
                {
                  "name": "IMG",
                  "attributes": [
                    {
                      "name": "SRC",
                      "value": "codesquad.kr"
                    }
                  ],
                  "children": [],
                  "value": ""
                },
                {
                  "name": "BR",
                  "attributes": [],
                  "children": [],
                  "value": ""
                }
              ],
              "value": ""
            },
            {
              "name": "FONT",
              "attributes": [
                {
                  "name": "name",
                  "value": "Seoul"
                }
              ],
              "children": [],
              "value": "CAMP"
            }
          ],
          "value": ""
        }
      ],
      "value": ""
    }
  ]
}

2. elementByAttribute('name') 결과:
[
  {
    name: 'FONT',
    attributes: [ [Object] ],
    children: [],
    value: 'CAMP'
  }
]

3. reportByClass() 결과:
{ HTML: 1, BODY: 1, P: 1, IMG: 1, BR: 1, FONT: 1 }

4. findXPath('/HTML/BODY/P') 결과:
{
  name: 'P',
  attributes: [],
  children: [
    { name: null, attributes: [], children: [], value: 'BOOST' },
    { name: 'IMG', attributes: [Array], children: [], value: '' },
    { name: 'BR', attributes: [], children: [], value: '' }
  ],
  value: ''
}

--- [테스트 스위트 종료: HTML] ---

======================================================

--- [테스트 스위트 시작: Android Layout] ---

1. displayJSON() 결과:
{
  "prolog": {
    "version": "1.0",
    "encoding": "utf-8"
  },
  "elements": [
    {
      "name": "LinearLayout",
      "attributes": [
        {
          "name": "xmlns:android",
          "value": "http://schemas.android.com/apk/res/android"
        },
        {
          "name": "android:layout_width",
          "value": "match_parent"
        },
        {
          "name": "android:layout_height",
          "value": "match_parent"
        },
        {
          "name": "android:orientation",
          "value": "vertical"
        }
      ],
      "children": [
        {
          "name": "TextView",
          "attributes": [
            {
              "name": "android:id",
              "value": "@+id/text"
            },
            {
              "name": "android:layout_width",
              "value": "wrap_content"
            },
            {
              "name": "android:layout_height",
              "value": "wrap_content"
            },
            {
              "name": "android:text",
              "value": "Hello, I am a TextView"
            }
          ],
          "children": [],
          "value": ""
        },
        {
          "name": "Spacer",
          "attributes": [],
          "children": [],
          "value": "blank"
        },
        {
          "name": "Button",
          "attributes": [
            {
              "name": "android:id",
              "value": "@+id/button"
            },
            {
              "name": "android:layout_width",
              "value": "wrap_content"
            },
            {
              "name": "android:layout_height",
              "value": "wrap_content"
            },
            {
              "name": "android:text",
              "value": "Hello, I am a Button"
            }
          ],
          "children": [],
          "value": ""
        }
      ],
      "value": ""
    }
  ]
}

2. elementByAttribute('android:id') 결과:
[
  {
    name: 'TextView',
    attributes: [ [Object], [Object], [Object], [Object] ],
    children: [],
    value: ''
  },
  {
    name: 'Button',
    attributes: [ [Object], [Object], [Object], [Object] ],
    children: [],
    value: ''
  }
]

3. reportByClass() 결과:
{ LinearLayout: 1, TextView: 1, Spacer: 1, Button: 1 }

4. findXPath('/LinearLayout/Button') 결과:
{
  name: 'Button',
  attributes: [
    { name: 'android:id', value: '@+id/button' },
    { name: 'android:layout_width', value: 'wrap_content' },
    { name: 'android:layout_height', value: 'wrap_content' },
    { name: 'android:text', value: 'Hello, I am a Button' }
  ],
  children: [],
  value: ''
}

--- [테스트 스위트 종료: Android Layout] ---

======================================================

--- [테스트 스위트 시작: Property List] ---

1. displayJSON() 결과:
{
  "prolog": {
    "version": "1.0",
    "encoding": "UTF-8"
  },
  "elements": [
    {
      "name": "plist",
      "attributes": [
        {
          "name": "version",
          "value": "1.0"
        }
      ],
      "children": [
        {
          "name": "dict",
          "attributes": [],
          "children": [
            {
              "name": "key",
              "attributes": [],
              "children": [],
              "value": "CFBundleExecutable"
            },
            {
              "name": "string",
              "attributes": [],
              "children": [],
              "value": "boost"
            },
            {
              "name": "blank",
              "attributes": [],
              "children": [],
              "value": ""
            },
            {
              "name": "key",
              "attributes": [],
              "children": [],
              "value": "CFBundleName"
            },
            {
              "name": "string",
              "attributes": [],
              "children": [],
              "value": "camp"
            },
            {
              "name": "blank",
              "attributes": [],
              "children": [],
              "value": ""
            },
            {
              "name": "key",
              "attributes": [],
              "children": [],
              "value": "Classes"
            },
            {
              "name": "array",
              "attributes": [],
              "children": [
                {
                  "name": "string",
                  "attributes": [],
                  "children": [],
                  "value": "Web"
                },
                {
                  "name": "string",
                  "attributes": [],
                  "children": [],
                  "value": "iOS"
                },
                {
                  "name": "string",
                  "attributes": [],
                  "children": [],
                  "value": "Android"
                }
              ],
              "value": ""
            }
          ],
          "value": ""
        }
      ],
      "value": ""
    }
  ]
}

2. elementByAttribute('version') 결과:
[
  {
    name: 'plist',
    attributes: [ [Object] ],
    children: [ [Object] ],
    value: ''
  }
]

3. reportByClass() 결과:
{ plist: 1, dict: 1, key: 3, string: 5, blank: 2, array: 1 }

4. findXPath('/plist/dict/key[2]') 결과:
{ name: 'key', attributes: [], children: [], value: 'CFBundleName' }

--- [테스트 스위트 종료: Property List] ---

======================================================

모든 테스트 스위트 실행 완료.
```

---

## 7. 개발 회고 및 학습 정리

### CS 핵심 개념 학습

이번 과제를 통해 파서와 관련된 핵심적인 컴퓨터 과학(CS) 개념들을 직접 구현하며 깊이 있게 학습할 수 있었습니다.

1.  **파서(Parser)와 렉서(Lexer/Tokenizer)**

    - **렉서/토크나이저:** 소스 코드(XML 문자열)를 문법적으로 의미 있는 최소 단위인 '토큰'으로 분해하는 과정입니다. 이번 프로젝트의 `_tokenize` 메서드가 이 역할을 수행하며, 여는 태그, 닫는 태그, 속성, 텍스트 등을 각각의 토큰으로 분리했습니다.
    - **파서:** 렉서가 생성한 토큰 스트림을 바탕으로, 언어의 문법 규칙에 따라 계층적인 자료구조(AST, Abstract Syntax Tree)를 만드는 과정입니다. `_buildTree` 메서드가 이 역할을 하며, 토큰들의 관계를 해석하여 최종적인 트리 구조를 생성했습니다.

2.  **트리(Tree) 자료구조**

    - XML/HTML의 부모-자식 관계를 가진 중첩 구조는 트리 자료구조로 표현하기에 적합합니다.
    - 각 엘리먼트는 `name`, `attributes`, `value` 데이터를 가진 '노드(Node)'가 되고, `children` 배열을 통해 자식 노드들을 참조하며 계층 구조를 형성했습니다. `parseData.elements`는 이 트리의 최상위 노드(Root)들을 담는 역할을 합니다.

3.  **재귀(Recursion)**
    - 트리와 같은 중첩된 자료구조를 탐색하고 생성하는 데 가장 강력한 알고리즘은 재귀입니다.
    - `_buildTree` 내부의 `parseElement` 함수는 여는 태그를 만났을 때, 그 자식들을 처리하기 위해 자기 자신을 다시 호출합니다. 이 재귀 호출은 해당 태그의 닫는 태그를 만나는 'Base Case'에 도달할 때까지 반복되며, 이를 통해 아무리 깊은 중첩 구조라도 효과적으로 처리할 수 있었습니다.

### 주요 트러블슈팅 경험

개발 과정에서 마주친 주요 문제들과 해결 과정을 상세히 기록합니다.

- **문제 1: 프롤로그(`<?xml ...>`) 파싱 오류**

  - **상황:** 토크나이저가 주석이 아닌 모든 태그를 프롤로그로 잘못 인식하는 심각한 버그가 발생했습니다.
  - **원인 분석:** 최초 코드의 조건문 `else if (processedXml.startsWith("", i + 1))` 에서 빈 문자열 `""`을 사용한 것이 원인이었습니다. 빈 문자열은 항상 `true`를 반환하므로, 주석(`<!--`)이 아닌 모든 태그가 이 조건에 걸려 프롤로그로 처리되었습니다.
  - **해결 과정:** 프롤로그의 명확한 시작 패턴인 `<?`를 감지하도록 조건을 `xml.startsWith("?", i + 1)`로 수정했습니다. 이로써 다른 태그와 명확히 구분하여 정확한 토큰을 생성할 수 있게 되었습니다.
  - **교훈:** 파서와 같이 상태를 순차적으로 검사하는 로직에서는 각 조건이 최대한 명확하고 배타적이어야 함을 배웠습니다. 모호한 조건 하나가 전체 시스템의 오작동을 유발할 수 있습니다.

- **문제 2: 리팩토링 중 재귀 로직 파괴 및 파싱 오류**

  - **상황:** 가독성을 높이기 위해 `_buildTree` 메서드를 `_parseChildren`이라는 헬퍼 함수로 분리했으나, 리팩토링 이후 트리 구조가 완전히 잘못 생성되고 테스트가 모두 실패했습니다.
  - **원인 분석:** 기존 `_buildTree`는 클로저(closure)를 통해 `tokenIndex`라는 단일 상태 변수를 모든 재귀 호출이 공유하며 순차적으로 소비하는 방식으로 동작했습니다. 하지만 리팩토링 과정에서 이 상태 공유 매커니즘을 제대로 이해하지 못하고, 각 `_parseChildren` 호출이 독립적인 `tokenIndex`를 갖도록 잘못 설계했습니다. 이로 인해 부모-자식 간의 토큰 소비 상태가 동기화되지 않아 전체 트리 구조가 망가졌습니다.
  - **해결 과정:** 문제의 심각성을 인지하고, 섣부른 리팩토링이 오히려 코드의 안정성을 해쳤다고 판단했습니다. 가장 안정적으로 동작하던 이전 버전의 `_buildTree` 로직으로 즉시 복원했습니다.
  - **교훈:** 재귀, 특히 상태를 공유하는 재귀 함수를 리팩토링할 때는 눈에 보이는 코드 구조뿐만 아니라, 보이지 않는 상태 관리 매커니즘까지 완벽하게 이해해야 합니다. 때로는 단일 책임 원칙을 약간 희생하더라도, 복잡한 상태를 안전하게 관리하는 검증된 패턴(클로저)을 유지하는 것이 더 나은 선택일 수 있다는 점을 배웠습니다.

- **문제 3: Mermaid 다이어그램의 조건문 텍스트 소실**
  - **상황:** 코드 흐름을 시각화하기 위해 작성한 Mermaid 다이어그램에서, 조건문에 해당하는 마름모 도형 안의 텍스트(`<? ?` 등)가 보이지 않았습니다.
  - **원인 분석:** Mermaid 렌더러가 도형 안의 텍스트에 포함된 특수문자 `<`, `>`를 다이어그램의 문법(syntax)으로 오인하여 텍스트를 제대로 렌더링하지 못하는 문제였습니다.
  - **해결 과정:** HTML에서 특수문자를 안전하게 표시하는 것과 동일한 원리를 적용했습니다. `<`는 `&lt;`로, `>`는 `&gt;`와 같은 HTML 엔티티 코드로 치환하여, 렌더러가 이를 문법이 아닌 순수한 텍스트로 인식하도록 수정했습니다. 이 방법으로 모든 텍스트가 정상적으로 표시되는 것을 확인했습니다.
  - **교훈:** 특정 마크업이나 스크립팅 언어를 사용할 때는 해당 언어의 예약어나 특수문자를 항상 인지하고, 이를 문자 그대로 표현해야 할 때는 공식적인 이스케이프(escape) 방법을 따라야 한다는 점을 상기했습니다.
