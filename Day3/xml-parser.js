/**
 * 노드를 생성하는 함수
 * @param {string} name - 태그의 이름
 * @param {Array} attributes -  속성 배열
 * @param {Array} children - 자식 노드 배열
 * @param {string} value - 텍스트 노드의 값
 * @returns {Object} 생성된 노드 객체
 */
function createNode(name, attributes = [], children = [], value = "") {
  return {
    name,
    attributes,
    children,
    value,
  };
}

class XMLParser {
  constructor() {
    this.parseData = {
      prolog: {},
      elements: [],
    };
  }

  /**
   * XML 문자열을 파싱하는 메인 함수
   * @param {string} xmlString - 파싱할 XML 문자열
   * @returns {Object} 파싱된 XML 데이터 객체
   */
  parse(xmlString) {
    // 파싱 전에 항상 데이터를 초기화하여 재사용 시에도 문제가 없도록 함
    this.parseData = {
      prolog: {},
      elements: [],
    };
    const tokens = this._tokenize(xmlString);
    this._buildTree(tokens);
    return this.parseData;
  }

  /**
   * 속성 문자열을 파싱하여 배열로 반환하는 헬퍼 함수
   * @param {string} attrString - 속성 문자열 (예: 'lang="ko" name="Seoul"')
   * @returns {Array} 파싱된 속성 객체 배열
   */
  _parseAttributes(attrString) {
    const attributes = [];
    // 정규표현식을 사용하여 name="value" 쌍을 찾음
    const regex = /([\w:-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
      attributes.push({ name: match[1].trim(), value: match[2] });
    }
    return attributes;
  }

  /**
   * 문자열을 토큰 배열로 분해
   * @param {string} xmlString - XML 문자열
   * @returns {Array} 토큰 배열
   */
  _tokenize(xmlString) {
    const tokens = [];
    let i = 0;
    const processedXml = xmlString.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    while (i < processedXml.length) {
      if (processedXml[i] === "<") {
        i = this._handleTag(processedXml, i, tokens);
      } else {
        i = this._handleText(processedXml, i, tokens);
      }
    }
    return tokens;
  }

  _handleTag(xml, i, tokens) {
    if (xml.startsWith("!--", i + 1) || xml.startsWith("!DOCTYPE", i + 1)) {
      return this._handleCommentOrDoctype(xml, i);
    } else if (xml.startsWith("?", i + 1)) {
      return this._handleProlog(xml, i, tokens);
    } else if (xml.startsWith("/", i + 1)) {
      return this._handleClosingTag(xml, i, tokens);
    } else {
      return this._handleOpeningOrSelfClosingTag(xml, i, tokens);
    }
  }

  _handleCommentOrDoctype(xml, i) {
    const endTag = xml.startsWith("!--", i + 1) ? "-->" : ">";
    const endIndex = xml.indexOf(endTag, i + 1);
    return endIndex === -1 ? xml.length : endIndex + endTag.length;
  }

  _handleProlog(xml, i, tokens) {
    const endIndex = xml.indexOf("?>", i + 2);
    if (endIndex === -1) return xml.length;

    const value = xml.substring(i + 2, endIndex).trim();
    tokens.push({ type: "prolog", value });
    return endIndex + 2;
  }

  _handleClosingTag(xml, i, tokens) {
    const endIndex = xml.indexOf(">", i + 2);
    if (endIndex === -1) return xml.length;

    const tagName = xml.substring(i + 2, endIndex).trim();
    tokens.push({ type: "tag_close", tagName });
    return endIndex + 1;
  }

  _handleOpeningOrSelfClosingTag(xml, i, tokens) {
    const endIndex = xml.indexOf(">", i + 1);
    if (endIndex === -1) return xml.length;

    let tagContent = xml.substring(i + 1, endIndex);
    const isSelfClosing = tagContent.endsWith("/");
    if (isSelfClosing) {
      tagContent = tagContent.slice(0, -1).trim();
    }

    const parts = tagContent.split(" ");
    const tagName = parts.shift();
    const attributes = this._parseAttributes(parts.join(" "));
    const type = isSelfClosing ? "tag_self_closing" : "tag_open";

    tokens.push({ type, tagName, attributes });
    return endIndex + 1;
  }

  _handleText(xml, i, tokens) {
    const nextTagOpen = xml.indexOf("<", i);
    if (nextTagOpen === -1) {
      const text = xml.substring(i).trim();
      if (text) tokens.push({ type: "text", value: text });
      return xml.length;
    } else {
      const text = xml.substring(i, nextTagOpen).trim();
      if (text) tokens.push({ type: "text", value: text });
      return nextTagOpen;
    }
  }

  /**
   * 토큰 배열을 기반으로 XML 트리 구조를 생성
   * @param {Array} tokens - 토큰 배열
   */
  _buildTree(tokens) {
    const rootElements = [];
    let tokenIndex = 0; // 현재 처리 중인 토큰의 인덱스 (클로저를 통해 공유)

    // 재귀적으로 노드를 파싱하는 헬퍼 함수
    const parseElement = () => {
      if (tokenIndex >= tokens.length) {
        return null; // 모든 토큰을 다 처리했으면 종료
      }

      const token = tokens[tokenIndex]; // 현재 토큰을 미리 확인

      // 프롤로그는 최상위에서만 처리하고, 트리에 포함되지 않음
      if (token.type === "prolog") {
        this.parseData.prolog = this._parseProlog(token.value);
        tokenIndex++; // 프롤로그 토큰 소비
        return null; // 노드 생성 안함
      }

      // 닫는 태그는 현재 노드의 자식 파싱을 종료하는 신호
      if (token.type === "tag_close") {
        // 이 닫는 태그는 상위 호출에서 처리될 것이므로, 여기서 소비만 하고 null 반환
        tokenIndex++; // 닫는 태그 소비
        return null;
      }

      // 이제 노드를 형성하는 토큰들 (tag_open, text, tag_self_closing) 처리
      tokenIndex++; // 현재 토큰을 소비 (다음 토큰으로 인덱스 이동)

      if (token.type === "tag_open") {
        const node = createNode(token.tagName, token.attributes);

        // 현재 태그의 닫는 태그를 만날 때까지 자식 노드들을 재귀적으로 파싱
        while (tokenIndex < tokens.length) {
          const nextToken = tokens[tokenIndex]; // 다음 토큰을 미리 확인

          // 닫는 태그를 만나면 현재 노드의 자식 파싱 종료
          if (nextToken.type === "tag_close") {
            if (nextToken.tagName === node.name) {
              tokenIndex++; // 닫는 태그 소비
              break; // 현재 노드의 자식 파싱 루프 종료
            } else {
              console.error(
                `오류: ${node.name} 태그의 닫는 태그가 일치하지 않습니다. (${nextToken.tagName})`
              );
              tokenIndex++; // 불일치하는 닫는 태그도 소비하고 계속 진행
              break; // 현재 노드의 자식 파싱 루프 종료
            }
          }
          // 다른 종류의 토큰 (여는 태그, 텍스트, 자체 종료 태그)은 자식으로 파싱
          else {
            const child = parseElement(); // 재귀 호출
            if (child) {
              // 유효한 노드가 반환되었을 경우에만 추가
              node.children.push(child);
            }
            // parseElement 내부에서 tokenIndex가 이미 증가했으므로 여기서 추가 증가 불필요
          }
        }

        // 후처리: 자식 노드가 텍스트 하나뿐이면 값으로 올리고 자식 배열에서 제거
        if (node.children.length === 1 && node.children[0].name === null) {
          node.value = node.children[0].value;
          node.children = [];
        }
        return node;
      }
      // 텍스트 토큰 처리
      else if (token.type === "text") {
        return createNode(null, [], [], token.value); // 텍스트 노드는 이름이 없고 값만 가짐
      }
      // 자체 종료 태그 처리
      else if (token.type === "tag_self_closing") {
        return createNode(token.tagName, token.attributes);
      }

      // 예상치 못한 토큰 타입 (이미 위에서 처리되었어야 함)
      return null;
    };

    // 최상위 요소들을 파싱
    while (tokenIndex < tokens.length) {
      const node = parseElement(); // 최상위 노드 파싱 시작
      if (node) {
        // 유효한 노드가 반환되었을 경우에만 추가
        rootElements.push(node);
      }
    }
    this.parseData.elements = rootElements;
  }

  _parseProlog(prologString) {
    const prolog = {};
    const regex = /(\w+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = regex.exec(prologString)) !== null) {
      prolog[match[1]] = match[2];
    }
    return prolog;
  }

  /**
   * 파싱된 데이터를 JSON 문자열로 변환
   * @returns {string} JSON 문자열
   */
  displayJSON() {
    return JSON.stringify(this.parseData, null, 2);
  }

  /**
   * 속성 이름으로 엘리먼트 검색
   * @param {string} attrName - 검색할 속성 이름
   * @returns {Array} 해당 속성을 가진 엘리먼트 배열
   */
  elementByAttribute(attrName) {
    const results = [];
    const findRecursively = (elements) => {
      for (const element of elements) {
        if (element.attributes.some((attr) => attr.name === attrName)) {
          results.push(element);
        }
        if (element.children.length > 0) {
          findRecursively(element.children);
        }
      }
    };
    findRecursively(this.parseData.elements);
    return results;
  }

  /**
   * 태그 이름별로 엘리먼트 개수 리포트
   * @returns {Object} 태그 이름별 개수 객체
   */
  reportByClass() {
    const report = {};
    const countRecursively = (elements) => {
      for (const element of elements) {
        if (element.name) {
          report[element.name] = (report[element.name] || 0) + 1;
        }
        if (element.children.length > 0) {
          countRecursively(element.children);
        }
      }
    };
    countRecursively(this.parseData.elements);
    return report;
  }

  /**
   * XPath로 엘리먼트 검색
   * @param {string} path - XPath 문자열
   * @returns {Object|null} 검색된 엘리먼트 또는 null
   */
  findXPath(path) {
    const parts = path.split("/").filter((p) => p);
    let currentElements = this.parseData.elements;

    for (const part of parts) {
      const match = part.match(/(\w+)(?:\[(\d+)\])?/);
      if (!match) return null;

      const tagName = match[1].toUpperCase();
      const index = match[2] ? parseInt(match[2], 10) - 1 : 0;

      const matchingElements = currentElements.filter(
        (el) => el.name && el.name.toUpperCase() === tagName
      );

      if (matchingElements.length <= index) return null;

      const foundElement = matchingElements[index];
      currentElements = foundElement.children;

      if (parts.indexOf(part) === parts.length - 1) {
        return foundElement;
      }
    }
    return null;
  }
}

module.exports = XMLParser;
