const XMLParser = require('./xml-parser.js');

// ================== 테스트 스위트 헬퍼 함수 ==================
function runTestSuite(testName, xmlString, attributeToFind, xpathToFind) {
  console.log(`\n--- [테스트 스위트 시작: ${testName}] ---\n`);
  const parser = new XMLParser();

  // 1. 파싱 및 JSON 출력 테스트
  console.log("1. displayJSON() 결과:");
  parser.parse(xmlString);
  console.log(parser.displayJSON());

  // 2. 속성 검색 테스트
  console.log(`\n2. elementByAttribute('${attributeToFind}') 결과:`);
  const elementsByAttr = parser.elementByAttribute(attributeToFind);
  console.log(elementsByAttr);

  // 3. 태그 개수 리포트 테스트
  console.log("\n3. reportByClass() 결과:");
  const report = parser.reportByClass();
  console.log(report);

  // 4. XPath 검색 테스트
  console.log(`\n4. findXPath('${xpathToFind}') 결과:`);
  const elementByXpath = parser.findXPath(xpathToFind);
  console.log(elementByXpath);

  console.log(`\n--- [테스트 스위트 종료: ${testName}] ---\n`);
  console.log("======================================================");
}

// ================== 테스트 케이스 정의 ==================
const test1_html = `
<!DOCTYPE html>
<HTML lang="ko">
<BODY>
<P>BOOST<IMG SRC="codesquad.kr"></IMG>
<BR/></P>
<FONT name="Seoul">CAMP</FONT>
</BODY></HTML>
`;

const test2_android = `
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:layout_width="match_parent"
              android:layout_height="match_parent"
              android:orientation="vertical" >
    <TextView android:id="@+id/text"
              android:layout_width="wrap_content"
              android:layout_height="wrap_content"
              android:text="Hello, I am a TextView" />
    <Spacer>blank</Spacer>
    <Button android:id="@+id/button"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Hello, I am a Button" />
</LinearLayout>
`;

const test3_plist = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key>
<string>boost</string>
<blank/>
<key>CFBundleName</key>
<string>camp</string>
<blank/>
<key>Classes</key>
<array><string>Web</string><string>iOS</string><string>Android</string></array>
</dict></plist>
`;

// ================== 테스트 실행 ==================
runTestSuite("HTML", test1_html, "name", "/HTML/BODY/P");
runTestSuite("Android Layout", test2_android, "android:id", "/LinearLayout/Button");
runTestSuite("Property List", test3_plist, "version", "/plist/dict/key[2]");

console.log("\n모든 테스트 스위트 실행 완료.");