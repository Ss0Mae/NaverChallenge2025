const { Book, CampLibrary } = require('./camp_library.js');

describe('CampLibrary', () => {
  let library;
  const book1 = new Book('FP in JS', 2022, 'Alice', 'BoostPress', '111-1');
  const book2 = new Book('Refactoring', 2018, 'Bob', 'CampBooks', '222-2');
  const book3 = new Book('Clean Code', 2008, 'Alice', 'BoostPress', '333-3');

  beforeEach(() => {
    library = new CampLibrary();
  });

  describe('add', () => {
    test('새로운 책을 추가하면 책 목록이 늘어난 새 라이브러리를 반환한다', () => {
      const newLibrary = library.add(book1);
      expect(newLibrary.books.toArray().length).toBe(1);
      expect(newLibrary.books.item(0).title).toBe('FP in JS');
      // 원본은 변경되지 않아야 함
      expect(library.books.toArray().length).toBe(0);
    });

    test('이미 있는 책(ISBN 기준)을 추가하면 재고가 늘어난 새 라이브러리를 반환한다', () => {
      const libWithBook = library.add(book1);
      const libWithMoreStock = libWithBook.add(new Book('FP in JS', 2022, 'Alice', 'BoostPress', '111-1', null, null, 2)); // 2권 추가 입고
      
      expect(libWithMoreStock.books.item(0).stock).toBe(3);
      expect(libWithBook.books.item(0).stock).toBe(1);
    });
  });

  describe('rent & returnBook', () => {
    beforeEach(() => {
      library = library.add(book1).add(book2);
    });

    test('책을 대여하면 재고가 줄고 대여 이력이 남는 새 라이브러리를 반환한다', () => {
      const rentedLibrary = library.rent(book1, 'J251');
      const rentedBook = rentedLibrary.books.toArray().find(b => b.isbn === '111-1');
      expect(rentedBook.stock).toBe(0);
      expect(rentedBook.rentHistory.toArray().length).toBe(1);
      expect(rentedBook.rentHistory.item(0).person).toBe('J251');
      // 원본은 변경되지 않아야 함
      const originalBook = library.books.toArray().find(b => b.isbn === '111-1');
      expect(originalBook.stock).toBe(1);
    });

    test('재고가 없는 책은 대여할 수 없다', () => {
      const rentedLibrary = library.rent(book1, 'J251');
      const failedLibrary = rentedLibrary.rent(book1, 'SSOMAE');
      expect(failedLibrary).toBe(rentedLibrary); // 인스턴스가 동일해야 함 (변경 없음)
    });

    test('책을 반납하면 재고가 늘어난 새 라이브러리를 반환한다', () => {
      const rentedLibrary = library.rent(book1, 'J251');
      const returnedLibrary = rentedLibrary.returnBook(book1, 'J251');
      const returnedBook = returnedLibrary.books.toArray().find(b => b.isbn === '111-1');
      expect(returnedBook.stock).toBe(1);
    });
  });

  describe('조회 기능', () => {
    beforeEach(() => {
      library = library.add(book1).add(book2).add(book3);
    });

    test('findBy: 저자 이름으로 책 제목 배열을 반환한다', () => {
      const titles = library.findBy('Alice');
      expect(titles.sort()).toEqual(['Clean Code', 'FP in JS'].sort());
    });

    test('sortByDate: 발행년도 순으로 책 객체 배열을 반환한다', () => {
      const sortedBooks = library.sortByDate();
      expect(sortedBooks.map(b => b.year)).toEqual([2008, 2018, 2022]);
    });

    test('totalRent: 현재 대여중인 책 정보를 해시맵으로 반환한다', () => {
      const rentedLibrary = library.rent(book1, 'J251').rent(book3, 'SSOMAE');
      const rentMap = rentedLibrary.totalRent();
      expect(rentMap.get('FP in JS')).toBe(1);
      expect(rentMap.get('Clean Code')).toBe(1);
      expect(rentMap.contains('Refactoring')).toBe(false);
    });

    test('top10rent: 대여 많은 순으로 책 제목 배열을 반환한다', () => {
      const rentedLibrary = library.rent(book1, 'p1').rent(book1, 'p2') // FP in JS (2회)
                               .rent(book3, 'p3'); // Clean Code (1회)
      const topBooks = rentedLibrary.top10rent();
      expect(topBooks[0]).toBe('FP in JS');
      expect(topBooks[1]).toBe('Clean Code');
    });
  });
});
