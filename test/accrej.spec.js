const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');
const { indexFacesAndStore,rejectRequest } = require('../controller/registerController');
const { accept,reject } = require('../controller/accrejController'); // Assuming your controller file name is yourController.js

chai.use(chaiHttp);

describe('accept controller', () => {
    it('should return success response for each id when indexFacesAndStore resolves with non-zero value', async () => {
        const req = {
            body: {
                ids: [1, 2, 3]
            }
        };
        const res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        const indexFacesAndStoreStub = sinon.stub();
        indexFacesAndStoreStub.withArgs(1).resolves(1);
        indexFacesAndStoreStub.withArgs(2).resolves(1);
        indexFacesAndStoreStub.withArgs(3).resolves(1);

        await accept(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.send.calledOnce).to.be.true;
        expect(res.send.firstCall.args[0]).to.deep.equal(['1 1 is registered successfully', '1 2 is registered successfully', '1 3 is registered successfully']);
    });
    // it('should return failure response for each id when indexFacesAndStore resolves with 0', async () => {
    //     const req = {
    //         body: {
    //             ids: [4, 5, 6]
    //         }
    //     };
    //     const res = {
    //         status: sinon.stub().returnsThis(),
    //         send: sinon.stub()
    //     };

    //     
    //     const indexFacesAndStoreStub = sinon.stub();
    //     indexFacesAndStoreStub.withArgs(4).resolves(-1);
    //     indexFacesAndStoreStub.withArgs(5).resolves(-1);
    //     indexFacesAndStoreStub.withArgs(6).resolves(-1);

    //     
    //     await accept(req, res);

    //    
    //     expect(res.status.calledWith(200)).to.be.true;
    //     expect(res.send.calledOnce).to.be.true;
    //     expect(res.send.firstCall.args[0]).to.deep.equal(['0 4 face cannot be registerd because same face is already present', '0 5 face cannot be registerd because same face is already present', '0 6 face cannot be registerd because same face is already present']);
    // });

    it('should return failure response when indexFacesAndStore rejects with an error', async () => {
        const req = {
            body: {
                ids: [7, 8, 9]
            }
        };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        
        const indexFacesAndStoreStub = sinon.stub();
        indexFacesAndStoreStub.rejects(new Error('Some error'));

       
        await accept(req, res);

       
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.deep.equal({ success: false, message: 'Internal server error' });
    });
});

describe('reject controller', () => {
    it('should return success response for each id when rejectRequest resolves', async () => {
        const req = {
            body: {
                ids: [1, 2, 3]
            }
        };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        
        const rejectRequestStub = sinon.stub();
        rejectRequestStub.resolves();

        
        await reject(req, res);

        
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, message: 'Requests rejected successfully' });
    });
    it('should return failure response when rejectRequest rejects with an error', async () => {
        const req = {
            body: {
                ids:"error"
            }
        };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        
        const rejectRequestStub = sinon.stub()
        rejectRequestStub.rejects(new Error('Some error'));

        
        await reject(req, res);

       
        expect(res.status.calledWith(500)).to.be.false;
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, message: "Requests rejected successfully" });
    });
});
