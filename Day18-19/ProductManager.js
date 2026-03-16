class ProductManager {
    constructor() {
        this.products = new Map();
        this.nextProductId = 1;
    }

    // 15개 이상의 초기 상품 데이터 생성
    initProducts() {
        const initialProducts = [
            { name: '프리미엄 유기농 우유', stock: 10 },
            { name: '수제 초콜릿 캔디', stock: 20 },
            { name: '바삭한 감자칩 (오리지널)', stock: 8 },
            { name: '숙성 등심 스테이크', stock: 5 },
            { name: '아오리 사과 (1kg)', stock: 5 },
            { name: '장미 꽃다발', stock: 10 },
            { name: '천연 과일 젤리', stock: 20 },
            { name: '고당도 바나나 (한송이)', stock: 30 },
            { name: '플로리다 오렌지', stock: 15 },
            { name: '샤인머스캣 포도', stock: 7 },
            { name: '제로 칼로리 스프라이트', stock: 15 },
            { name: '클래식 코카콜라', stock: 20 },
            { name: '아이폰 20 Pro', stock: 7 },
            { name: '맥북 에어 M5', stock: 3 },
            { name: '아이패드 프로 13인치', stock: 10 },
            { name: '에어팟 프로 3세대', stock: 12 },
        ];

        initialProducts.forEach(p => this.addProduct(p.name, p.stock));
    }

    addProduct(name, stock) {
        // 이미 존재하는 상품인지 확인
        for (const [id, product] of this.products.entries()) {
            if (product.name === name) {
                product.stock += stock;
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`재고 추가: ${name}, 현재 재고: ${product.stock}`);
                }
                return id;
            }
        }

        // 새 상품 추가
        const productId = `#${this.nextProductId++}`;
        this.products.set(productId, { name, stock });
        if (process.env.NODE_ENV !== 'test') {
            console.log(`신규 상품 등록: ${productId} - ${name}, 재고: ${stock}`);
        }
        return productId;
    }

    getProducts() {
        return Array.from(this.products.entries()).map(([id, { name, stock }]) => ({ id, name, stock }));
    }

    getProduct(productId) {
        return this.products.get(productId);
    }

    purchaseProduct(productId, quantity) {
        const product = this.getProduct(productId);
        if (!product || product.stock < quantity) {
            return false; // 구매 실패
        }
        product.stock -= quantity;
        if (process.env.NODE_ENV !== 'test') {
            console.log(`상품 구매: ${product.name}, 남은 재고: ${product.stock}`);
        }
        return true; // 구매 성공
    }
}

module.exports = ProductManager;
