const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
const { deletePerson } = require('../controller/deletePersonController');
const {searchFacesAndDelete} = require('../controller/deleteController')

chai.use(chaiHttp);

describe('deletePerson controller', () => {
    it('should return success response when searchFacesAndDelete resolves', async () => {
        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };


        const searchFacesAndDeleteStub = sinon.stub().resolves();


        await deletePerson(req, res);

 
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        
    });

    it('should return failure response when searchFacesAndDelete rejects with an error', async () => {
        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        
        const searchFacesAndDeleteStub = sinon.stub().rejects(new Error('Some error'));

        
        await deletePerson(req, res);

        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.deep.equal({ success: false, message: 'Internal server error' });
    });
});
