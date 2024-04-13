const axios = require('axios');
const { expect } = require('chai');
describe('POST /session endpoint', () => {
    it('should return status 200', async () => {
        const requestBody = { sessionId: 'some-session-id' };

        const response = await axios.post('http://localhost:4032/myapp/employee/session', requestBody,{
            timeout: 9000
        });
        console.log(response);
        expect(response.status).to.be.equal(200);
    });
});


