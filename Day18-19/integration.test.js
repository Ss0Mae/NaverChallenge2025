const Server = require('./server');
const CustomerClient = require('./client');
const MdClient = require('./mdClient');

describe('Server-Client Integration Test', () => {
    test('MD가 상품을 추가하고 고객이 상품 목록을 조회하는 시나리오', async () => {
        jest.setTimeout(30000);

        const testServerInstance = new Server();
        const testServer = await new Promise((resolve) => {
            const s = testServerInstance.listen(0, () => resolve(s)); // 0번 포트로 임의의 포트 사용
        });

        const port = testServer.address().port;

        try {
            const mdClient = new MdClient(port);
            const customerClient = new CustomerClient(port);

            await new Promise((resolve) => {
                mdClient.on('connect', () => {
                    mdClient.sendMessage('auth', { token: 'boostcamp_md_token' });
                });

                mdClient.on('message', (message) => {
                    if (message.type === 'auth_ok') {
                        for (let i = 1; i <= 15; i++) {
                            mdClient.sendMessage('add', { name: `Test Product ${i}`, stock: 10 });
                        }
                    }
                    if (message.type === 'add_ok' && message.payload.message.includes('Test Product 15')) {
                        customerClient.connect();
                    }
                });

                customerClient.on('connect', () => {
                    customerClient.sendMessage('login', { campId: 'S001' });
                });

                customerClient.on('message', (message) => {
                    if (message.type === 'login_ok') {
                        customerClient.sendMessage('catalog');
                    }
                    if (message.type === 'catalog_ok') {
                        expect(message.payload.products.length).toBeGreaterThanOrEqual(15);
                        expect(message.payload.products).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({ name: 'Test Product 1', stock: 10 }),
                                expect.objectContaining({ name: 'Test Product 15', stock: 10 })
                            ])
                        );
                        resolve();
                    }
                });

                mdClient.connect();
            });

            await mdClient.disconnect();
            await customerClient.disconnect();
        } finally {
            await new Promise((resolve) => testServerInstance.close(resolve));
        }
    });
});