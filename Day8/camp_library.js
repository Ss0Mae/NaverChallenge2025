const ImmutableLinkedList = require('./linked_list.js');
const ImmutableHashMap = require('./hash_map.js');

/**
 * 도서 정보를 나타내는 클래스입니다.
 * 재고 및 대여 이력 관리를 위한 속성을 포함합니다.
 */
class Book {
  constructor(title, year, author, publisher, isbn, volume, category, stock = 1) {
    this.title = title;
    this.year = year;
    this.author = author;
    this.publisher = publisher;
    this.isbn = isbn;
    this.volume = volume;
    this.category = category;

    // 재고 및 대여 관리를 위한 데이터
    this.stock = stock; // 재고 수량
    this.rentHistory = new ImmutableLinkedList(); // 대여 이력 (person, date 등)
  }
}

/**
 * 부스트캠프 가상 도서관 클래스입니다.
 * 모든 데이터 변경 작업은 새로운 CampLibrary 인스턴스를 반환합니다.
 */
class CampLibrary {
  /**
   * @param {ImmutableLinkedList} books 도서 목록
   */
  constructor(books = new ImmutableLinkedList()) {
    this.books = books;
  }

  /**
   * 새로운 책을 도서관에 입고합니다.
   * @param {Book} book
   * @returns {CampLibrary}
   */
  add(book) {
    // ISBN을 기준으로 기존 도서가 있는지 확인합니다.
    const booksArray = this.books.toArray();
    const existingBookIndex = booksArray.findIndex((b) => b.isbn === book.isbn);

    if (existingBookIndex > -1) {
      // 책이 이미 존재하면, 재고(stock)를 늘린 새 Book 객체를 만듭니다.
      const existingBook = booksArray[existingBookIndex];
      const updatedBook = new Book(
        existingBook.title,
        existingBook.year,
        existingBook.author,
        existingBook.publisher,
        existingBook.isbn,
        existingBook.volume,
        existingBook.category,
        existingBook.stock + book.stock // 입고 수량만큼 재고 증가
      );
      // 기존 책을 업데이트된 책으로 교체한 새 book 리스트를 만듭니다.
      const newBooksList = this.books.remove(existingBookIndex).insert(existingBookIndex, updatedBook);
      return new CampLibrary(newBooksList);
    } else {
      // 새로운 책이면, 리스트에 그냥 추가합니다.
      const newBooksList = this.books.append(book);
      return new CampLibrary(newBooksList);
    }
  }

  /**
   * 특정인이 특정 책을 대여합니다.
   * @param {Book} book
   * @param {string} person
   * @returns {CampLibrary}
   */
  rent(book, person) {
    const booksArray = this.books.toArray();
    const bookIndex = booksArray.findIndex((b) => b.isbn === book.isbn);

    // 책이 없거나 재고가 없으면 대여 불가
    if (bookIndex === -1 || booksArray[bookIndex].stock <= 0) {
      return this;
    }

    const existingBook = booksArray[bookIndex];

    // 대여 정보를 담은 새로운 Book 객체 생성
    const rentedBook = new Book(
      existingBook.title,
      existingBook.year,
      existingBook.author,
      existingBook.publisher,
      existingBook.isbn,
      existingBook.volume,
      existingBook.category,
      existingBook.stock - 1
    );
    // 대여 이력 추가
    rentedBook.rentHistory = existingBook.rentHistory.append({ person, date: new Date() });

    // 기존 책을 대여된 책 정보로 교체
    const newBooksList = this.books.remove(bookIndex).insert(bookIndex, rentedBook);
    return new CampLibrary(newBooksList);
  }

  /**
   * 특정인이 빌려간 책을 반납합니다.
   * @param {Book} book
   * @param {string} person
   * @returns {CampLibrary}
   */
  returnBook(book, person) {
    const booksArray = this.books.toArray();
    const bookIndex = booksArray.findIndex((b) => b.isbn === book.isbn);

    // 반납할 책이 도서관에 없으면 아무것도 하지 않음
    if (bookIndex === -1) {
      return this;
    }

    const existingBook = booksArray[bookIndex];

    // 반납 처리된 새로운 Book 객체 생성
    const returnedBook = new Book(
      existingBook.title,
      existingBook.year,
      existingBook.author,
      existingBook.publisher,
      existingBook.isbn,
      existingBook.volume,
      existingBook.category,
      existingBook.stock + 1
    );
    returnedBook.rentHistory = existingBook.rentHistory;

    // 기존 책을 반납 처리된 책 정보로 교체
    const newBooksList = this.books.remove(bookIndex).insert(bookIndex, returnedBook);
    return new CampLibrary(newBooksList);
  }

  /**
   * 현재 대여중인 도서 정보와 대여 권수를 해시맵으로 리턴합니다.
   * @returns {ImmutableHashMap}
   */
  totalRent() {
    return this.books.toArray().reduce((map, book) => {
      const rentedCount = book.rentHistory.toArray().length;
      if (rentedCount > 0) {
        // reduce의 각 단계에서 새로운 map이 반환되도록 put을 사용합니다.
        return map.put(book.title, rentedCount);
      }
      return map;
    }, new ImmutableHashMap());
  }

  /**
   * 저자 이름으로 책 제목을 검색하여 배열로 리턴합니다.
   * @param {string} author
   * @returns {Array<string>}
   */
  findBy(author) {
    return this.books
      .toArray()
      .filter((book) => book.author === author)
      .map((book) => book.title);
  }

  /**
   * 발행년도 순으로 전체 데이터 배열로 리턴합니다.
   * @returns {Array<Book>}
   */
  sortByDate() {
    const booksArray = this.books.toArray();
    // sort는 원본 배열을 변경하므로, 복사본을 만들어 정렬합니다.
    return [...booksArray].sort((a, b) => a.year - b.year);
  }

  /**
   * 전체 대여 인원을 기준으로 상위 10개 제목을 배열로 리턴합니다.
   * @returns {Array<string>}
   */
  top10rent() {
    const booksArray = this.books.toArray();
    return [...booksArray]
      .sort((a, b) => b.rentHistory.toArray().length - a.rentHistory.toArray().length)
      .slice(0, 10)
      .map((book) => book.title);
  }
}

module.exports = { Book, CampLibrary };
