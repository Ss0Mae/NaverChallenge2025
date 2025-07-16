# **학습 목표**

- XML 데이터 구조를 트리 형태 데이터 구조로 만들고, 다시 JSON으로 변환하는 도구를 만드는 것이 목표이다.
- 트리 형태 데이터 구조를 분석을 위한 기본 동작을 구현해야 한다.
- Parser가 데이터를 처리하는 방식과 만들어 내는 데이터 구조에 대해 학습해야 한다.

## **왜 필요한가?**

XML 이나 JSON 형태 데이터를 분석하고 구조화해서 저장하는 것은 매우 중요한 경험으로, 원하는 데이터를 원하는 형식으로 만들기 위해서 Parser를 직접 만들어보는 것은 효과적인 학습 방법이다.

# **사전지식**

없음

# **기능요구사항**

- 여러 XML 샘플을 분석해서 요소별로 분리하는 Parser를 구현해야 한다.
- Parser가 어떤 데이터 흐름으로 어떻게 동작하는지 설계 결과를 작성한다.
- Parser가 만든 데이터 구조를 탐색해서 JSON 문자열로 출력하도록 구현해야 한다.
- 아래 예제 XML 코드만 처리하는 파서를 만드는 게 아니라, 어떤 형태 XML을 입력하더라도 XML 태그(혹은 토큰)을 구분해서 원하는 형태로 처리할 수 있어야 한다.

# **프로그래밍 요구사항**

- 기존에 구현되어 있는 xmldom 이나 XML 파서 라이브러리나 파서용 모듈을 사용할 수 없으며, 이와 유사한 파싱을 처리해주는 외부 라이브러리를 모두 사용할 수 없다.
- 정규표현식은 추출하고 분석하기 위한 용도로 사용할 수 있다. (이건 선택사항이라 반드시 사용하지 않아도 된다.)
- XML 분석을 위해서 필요한 분석 단계별로 역할을 나눠서 처리한다.
- 함수가 길어지거나 너무 많은 역할을 하지 않도록 하위 함수로 나눈다.
- XML 태그(요소)가 중첩 가능하기 때문에 데이터를 중첩해서 생성하거나 탐색할 수 있도록 구현해야 한다.
- 저장하는 데이터 구조를 어떤 단위로 어떻게 저장하고 구조화할 것인가 결정하고 구현한다.
- 출력하는 양식은 표준 JSON 구조에 맞춰서 문자열로 출력한다.

### **지원하는 XML 태그 스펙**

- 도입부 Prolog : **`<?xml>`** 처럼 앞이 **`?`**로 시작하면 XML에 대한 정보. 내부에 저장할 때는 prolog 항목에 저장한다.
- 주석 Comment : **`<!DOCTYPE>`** 처럼 앞에 **`!`**로 시작하면 XML 주석으로 처리하고 저장하지 않는다.
- 요소 Element : **`<HTML>`** 또는 **`<plist>`** 처럼 **`<`** 바로 다음에 나오는 한 단어는 요소 element로 처리한다.
    - 모든 요소는 시작 태그로 시작해서 종료 태그로 끝난다. **`<HTML> ... </HTML>`**
    - 시작 태그와 종료 태그 사이에는 값 Value 또는 다른 태그를 중첩해서 포함할 수 있다.
        - **`<P>Hello</P>`**
        - **`<P><IMG SRC="camp.jpg">camp</IMG></P>`**
    - 값이 없어도 되는 특정한 태그들은 **`</br>`** 형태로 시작-종료 태그를 한꺼번에 표시한다.
    - 시작 태그 **`>`** 좌측 부분에는 해당 태그의 속성을 명시할 수 있다. **`<FONT name="Newyork">Big Apple</FONT>`**

### **내부 데이터 구조**

- 다음과 같은 정보를 포함하는 데이터 구조를 생성해야 한다
- **`prolog`** 항목 : Map 또는 Dictionary
    - XML 메타 데이터를 기록한다.
    - **`{ "version" : "1.0" , "encoding" : "utf-8" }`**
- **`elements`** 항목 : Array
    - 최상위 태그 요소부터 위에서 아래로 순서대로 태그 단위로 기록한다.
- **`element`** 태그 : Map 또는 Dictionary
    - **`element`** 항목에 태그 이름
    - attributes 항목 : Array
        - 태그의 모든 속성을 attribute 구조로 저장한다.
- **`attribute`** 속성 : Map 또는 Dictionary
    - **`name`** 속성 이름
    - **`value`** 속성 값

### **데이터 변환 함수**

### **displayJSON() 함수**

저장한 데이터 구조를 표준 JSON 형식으로 변환해서 문자열로 리턴한다.

### **elementByAttribute() 함수**

파싱한 트리에서 attribute.name 값을 기준으로 모든 element를 찾아서 배열로 리턴한다.

### **reportByClass() 함수**

파싱한 트리에서 element 종류별로 개수를 카운트해서 리턴한다.

### **findXPath() 함수**

경로가 너무 깊어지면 찾기 어렵기 때문에 XPath 라는 형식으로 원하는 요소를 지정할 수 있다. 예를 들어 XPath가 **`"/HTML/BODY/P[1]"`** 라면 HTML 태그 아래 BODY 태그 아래 첫번째 P 태그 요소를 의미한다.

출력 예제처럼 P 요소가 여러 개일 때 XPath가 **`"/HTML/BODY/P"`** 형태로 인덱스가 주어지지 않으면 항상 첫 번째 요소를 의미한다.

단, 태그 대소문자는 구분하지 않아도 된다. HTML 이나 html 은 동일하게 처리한다.

# **예상결과 및 동작예시**

### **XML 샘플**

### **HTML 형태**

```html
<!DOCTYPE html><HTML lang="ko"><BODY><P>BOOST<IMG SRC=\"codesquad.kr\"></IMG><BR/></P><FONT name="Seoul">CAMP</FONT></BODY></HTML>
```

### **Android Layout 형태**

```xml
<?xml version="1.0" encoding="utf-8"?>
  <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"android:layout_width="match_parent"android:layout_height="match_parent"android:orientation="vertical" ><TextView android:id="@+id/text"android:layout_width="wrap_content"android:layout_height="wrap_content"android:text="Hello, I am a TextView" /><Spacer>blank</Spacer><Button android:id="@+id/button"android:layout_width="wrap_content"android:layout_height="wrap_content"android:text="Hello, I am a Button" /></LinearLayout>
```

### **Property List 형태**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>boost</string><blank/><key>CFBundleName</key><string>camp</string><blank/><key>Classes</key><array><string>Web</string><string>iOS</string><string>Android</string></array></dict></plist>
```