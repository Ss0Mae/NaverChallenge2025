const BaseClient = require('./BaseClient');
const net = require('net');
const readline = require('readline');

jest.mock('net');
jest.mock('readline');

describe('BaseClient', () => {
    let client;
    let mockSocket;
    let mockRl;

    beforeEach(() => {
        client = new BaseClient(2025);
        mockSocket = {
            write: jest.fn(),
            on: jest.fn(),
        };
        net.createConnection.mockReturnValue(mockSocket);

        mockRl = {
            on: jest.fn(),
            close: jest.fn(),
        };
        readline.createInterface.mockReturnValue(mockRl);
    });

    test('should connect to the server', () => {
        process.env.NODE_ENV = 'test';
        client.connect();
        expect(net.createConnection).toHaveBeenCalledWith({ port: 2025 }, expect.any(Function));
        expect(readline.createInterface).not.toHaveBeenCalled();
    });

    test('should send a message', () => {
        client.connect(); // connect를 먼저 호출해야 client.client (mockSocket)가 설정됩니다.
        const type = 'test';
        const payload = { data: 'test-data' };
        client.sendMessage(type, payload);

        const expectedMessage = JSON.stringify({ type, payload });
        const expectedHeader = `Content-Length: ${Buffer.byteLength(expectedMessage)}\r\n\r\n`;
        expect(mockSocket.write).toHaveBeenCalledWith(expectedHeader + expectedMessage);
    });

    test('should handle user input and send a message', () => {
        client.connect();
        client.registerCommand('test', (args) => ({
            type: 'test',
            payload: { data: args[0] },
        }));

        client.handleUserInput('test my-data');

        const expectedMessage = JSON.stringify({ type: 'test', payload: { data: 'my-data' } });
        const expectedHeader = `Content-Length: ${Buffer.byteLength(expectedMessage)}\r\n\r\n`;
        expect(mockSocket.write).toHaveBeenCalledWith(expectedHeader + expectedMessage);
    });
});