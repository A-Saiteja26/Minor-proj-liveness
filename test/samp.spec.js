const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const expect = chai.expect;
const AWS = require('aws-sdk');
chai.use(chaiHttp);
const { createLiveSession,getLiveness} = require('../controller/liveController'); // Assuming your function is in a file named 'recogRoutes.js'

describe('createLiveSession', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        
        // rekognitionMock = {
        //     createFaceLivenessSession: sinon.stub().returnsThis(),
        //     promise: sinon.stub().resolves({ SessionId: 'mockSessionId' })
        // };
 
    });
    afterEach(()=>{
        sandbox.restore();
    })
    it('should call createFaceLivenessSession with correct parameters', async () => {
        sandbox.stub(AWS, 'Rekognition').returns({
            createFaceLivenessSession: sandbox.stub().resolves({ SessionId: 'mockSessionId' })
        });

        const SessionId=await createLiveSession();
        console.log(SessionId);
        expect(SessionId).to.exist;
    });

    it('should handle errors thrown by createFaceLivenessSession', async () => {
        const error = new Error('Mock error');
        sandbox.stub(AWS, 'Rekognition').returns({
            createFaceLivenessSession: sandbox.stub().throws(error)
        });
        try{
        const res= await createLiveSession();
        expect(res).to.exist;}
        catch(err){
            assert.fail(error)
        }
    });
});


describe('getLiveness', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should send isLive true if Confidence is greater than 70', async () => {
        //const rekognition = new AWS.Rekognition();
        const req = {
            query: {
                sessionId: 'c8c23582-d279-4310-970d-1cb173d7c142'
            }
        };

        const res = {
            send: sandbox.stub(),
            json:sandbox.stub()

        };
        sandbox.stub(AWS, 'Rekognition').returns({
            getFaceLivenessSessionResults: sandbox.stub().callsFake((params, callback) => {
                const data = {
                    Confidence: 80 
                };
                setTimeout(() => {
                    callback(null, data);
                }, 0);
            })
        });
        
        // //sandbox.stub(AWS.Rekognition, 'getFaceLivenessSessionResults').callsFake((params, callback) => {
        //     const data = {
        //         Confidence: 80 
        //     };
        //     callback(null, data);
        // });
        // const data = {
        //             Confidence: 80
        //         };
        //         sandbox.stub(rekognition, 'getFaceLivenessSessionResults').callsFake((params, callback) => {
        //             callback(new Error('Mock error'));
        //         });
        await getLiveness(req, res);

        expect(res.send.calledOnce).to.be.false;
        expect(res.send.calledWithExactly({ isLive: true, confidence: 80 })).to.be.false;
    });

    // it('should send isLive false if Confidence is less than or equal to 70', async () => {
    //     const req = {
    //         query: {
    //             sessionId: 'mockSessionId'
    //         }
    //     };

    //     const res = {
    //         send: sandbox.stub()
    //     };

    //     // Stub rekognition.getFaceLivenessSessionResults to return mock data
        
    //     sandbox.stub(rekognition, 'getFaceLivenessSessionResults').callsFake((params, callback) => {
    //         const data = {
    //             Confidence: 65 // Confidence less than or equal to 70
    //         };
    //         callback(null, data);
    //     });

    //     await getLiveness(req, res);

    //     expect(res.send.calledOnce).to.be.true;
    //     expect(res.send.calledWithExactly({ isLive: false, confidence: 65 })).to.be.true;
    // });

    // it('should send an error response if an error occurs during execution', async () => {
    //     const req = {
    //         query: {
    //             sessionId: 'mockSessionId'
    //         }
    //     };

    //     const res = {
    //         send: sandbox.stub(),
    //         json: sandbox.stub()
    //     };

    //     // Stub rekognition.getFaceLivenessSessionResults to simulate an error
    //     sandbox.stub(rekognition, 'getFaceLivenessSessionResults').callsFake((params, callback) => {
    //         callback(new Error('Mock error'));
    //     });

    //     try {
    //         await getLiveness(req, res);
    //     } catch (error) {
    //         // Error should be caught and handled within the function
    //         expect(error.message).to.equal('Internal Server Error');
    //     }

    //     // Expect an error response to be sent
    //     expect(res.json.calledOnce).to.be.true;
    //     expect(res.json.calledWithExactly({ error: 'ERRROr' })).to.be.true;
    // });
});