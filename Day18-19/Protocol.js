function formatRequest(type, payload) {
    const message = { type, payload };
    const messageString = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(messageString)}\r\n\r\n`;
    return header + messageString;
}

function formatResponse(type, payload, status = 'success') {
    const message = { status, type, payload };
    const messageString = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(messageString)}\r\n\r\n`;
    return header + messageString;
}

module.exports = {
    formatRequest,
    formatResponse,
};
