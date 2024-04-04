const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const {mongoClient} = require('../config/database')
const axios = require('axios');
const rekognition = require('../config/aws');
const app = require('../app');
const expect = chai.expect;
const {attendance} =require('../controller/attendanceView');
const {members} = require('../controller/getMembers')
const AWS = require('aws-sdk');
const {getPendingRequests} = require('../controller/viewController')
const {pendingRequests} = require('../controller/pendingController')
const {searchFacesAndDelete} =require('../controller/deleteController')
const {searchFacesAndRetrieve} = require('../controller/recognitionController')
chai.use(chaiHttp);
const s3 = require('../config/s3');
const {registerNewUser} = require('../controller/requestController')
describe('attendanceView Controller',()=>{
    let sandbox;
    beforeEach(()=>{
        sandbox = sinon.createSandbox();
    });


    afterEach(()=>{
        sandbox.restore();
    });

    it('should return checkIn Data for valid uname',async()=>{
        const req = {
            query : {
                uname : 'testUser'
            }
        };

        const res = {
            status : sinon.stub().returnsThis(),
            send:sinon.stub(),
            json:sinon.stub
        };

        sandbox.stub(mongoClient,'connect').resolves({
            db: ()=> ({
                collection :()=>({
                    findOne: sandbox.stub().resolves({username:'testuser',password:'1234'})
                })
            })
            
        });

        sandbox.stub(axios,'post').callsFake(async(url,data)=>{
            if(url==='https://mobile1.qa.darwinbox.io./Mobileapi/auth'){
                return {status :200,data:{token : 'teststokens1234'}};
            }

            else if(url === 'https://mobile1.qa.darwinbox.io/Mobileapi/CheckInData'){
                return {data:{checkin_details: {
                    "01-Apr": {
                        "a660a3889a6d7d": {
                            "timestamp": 1711945865,
                            "lat_long": "",
                            "location": "",
                            "time": "10:01:05",
                            "title": "",
                            "description": "",
                            "status": "PENDING",
                            "checkin_status": 0,
                            "user_id": "959236",
                            "in_out": "Check IN",
                            "tag_name": "",
                            "purpose": "",
                            "location_type": "",
                            "show_app_rej": 1,
                            "show_checkout": false
                        }
                    }
                }}}
            }

            else{
                throw new Error('Unexpected API Call');
            }
        });
        await attendance(req,res);
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.send.calledOnce).to.be.true;
    });
})

describe('getMembers Controller',()=>{
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return list of usernames',async()=>{
        const req={};
        const res={
            status:sinon.stub().returnsThis(),
            send:sinon.stub(),
            json:sinon.stub()
        };
        const fakeUsernames = ['user1','user2','user3'];
        sandbox.stub(mongoClient,'connect').resolves({
            db:()=>({
                collection:()=>({
                    find:sandbox.stub().returns({
                        forEach:async(callback)=>{
                            await Promise.all(fakeUsernames.map(username=>callback({username})));
                        }
                    })
                })
            })
        });

        await members(req,res);
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.send.calledOnceWith(fakeUsernames)).to.be.true;

    })

    it('should handle errors while fetching members', async () => {
        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub(),
            json: sinon.stub()
        };

        const errorMessage = 'Error fetching members';


        sandbox.stub(mongoClient, 'connect').rejects(new Error(errorMessage));

        await members(req, res);

        expect(res.status.calledOnceWith(403)).to.be.true;
        expect(res.json.calledOnceWith({ success: false, message: 'error in fetching data' })).to.be.true;
    });



});



// describe('Delete Controller', () => {
//   describe('searchFacesAndDelete', () => {
//     it('should delete face and associated document when a matching face is found', async () => {
//       // Mocking dependencies
//       const validImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAWElEQVQ4y2P4z8AdwC6AzB+XACMNBD/JI0BMQgIBA4YOZjfDGmPM0wAAIRYDBGBgYA4mDhjGfBvkwzGAAAhGQDAwA8BKD+h2yvAAAAAElFTkSuQmCC';
//       const rekognition = {
//         detectFaces: sinon.stub().returns({
//           promise: sinon.stub().resolves({
//             FaceDetails: [{ "123":"abcd" }]
//           })
//         }),
//         searchFacesByImage: sinon.stub().returns({
//           promise: sinon.stub().resolves({
//             FaceMatches: [{ Face: { FaceId: 'mockFaceId' } }]
//           })
//         }),
//         deleteFaces: sinon.stub().returns({
//           promise: sinon.stub().resolves({
//             DeletedFaces: ['mockFaceId']
//           })
//         })
//       };
      
//       const db = {
//         collection: sinon.stub().returns({
//           findOne: sinon.stub().resolves({ userId: 'mockUserId' }),
//           deleteOne: sinon.stub().resolves({ deletedCount: 1 })
//         })
//       };

//       const req = {
//         body: {
//           photoData: validImageData        }
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.stub()
//       };

//       // Call the function
//       await searchFacesAndDelete(req, res);

//       // Assertions
//       expect(rekognition.detectFaces.calledOnce).to.be.true;
//       expect(rekognition.searchFacesByImage.calledOnce).to.be.true;
//       expect(rekognition.deleteFaces.calledOnce).to.be.true;
//       expect(db.collection.calledTwice).to.be.true; // Once for findOne and once for deleteOne
//       expect(res.status.calledOnceWith(200)).to.be.true;
//       expect(res.json.calledOnceWith({
//         success: true,
//         message: 'Face and associated document deleted successfully',
//         name:'mockUserId'
//       })).to.be.true;
      
//     });
//   });
// });




describe('getPendingRequests', () => {
    let clientStub;
    let dbStub;
    let collectionStub;
    let findStub;
    let closeStub;
    let sendStub;
    let statusStub;

    beforeEach(() => {
        clientStub = sinon.stub(mongoClient, 'connect');
        dbStub = sinon.stub();
        collectionStub = sinon.stub();
        findStub = sinon.stub();
        closeStub = sinon.stub();
        sendStub = sinon.stub();
        statusStub = sinon.stub();
        //statusStub = sinon.stub().returns({ send: sendStub });
        clientStub.returns({
            db: dbStub.returns({
                collection: collectionStub.returns({
                    find: findStub,
                }),
            }),
            close: closeStub,
        });
        //statusStub = sinon.stub().returns({ send: sendStub });
        statusStub.returns({ send: sendStub });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return pending requests when there are pending requests', async () => {
        const pendingRequests = [{ request: 'pending', imageUrl: 'someImageUrl' }];
        findStub.returns({
            toArray: sinon.stub().resolves(pendingRequests),
        });

        const s3GetObjectStub = sinon.stub(s3, 'getObject').returns({
            promise: sinon.stub().resolves({ Body: Buffer.from('imageData') }),
        });

        const req = {};
        const res = { status: statusStub };

        await getPendingRequests(req, res);
        expect(sendStub.calledOnce).to.be.true;
        expect(sendStub.firstCall.args[0]).to.have.property('pendingRequests').that.is.an('array').and.has.lengthOf(1);
        expect(sendStub.firstCall.args[0].pendingRequests[0]).to.have.property('request', 'pending');
        expect(sendStub.firstCall.args[0].pendingRequests[0]).to.have.property('image').that.is.a('string');

    });

    it('should return "no pending requests" when there are no pending requests', async () => {
        findStub.returns({
            toArray: sinon.stub().resolves([]),
        });

        const req = {};
        const res = { status: statusStub };

        await getPendingRequests(req, res);

        expect(sendStub.calledWith('no pending requests')).to.be.true;
    });

    it('should handle errors and return internal server error', async () => {
        clientStub.throws(new Error('Connection error'));
    
        const req = {};
        const res = { status: statusStub };
    
        await getPendingRequests(req, res);
    
        expect(statusStub.calledWith(500)).to.be.true;
        //expect(sendStub.calledWithMatch({ success: true, message: 'Internal server error' })).to.be.true;
    });
    
});


describe('registerNewUser', () => {
    let clientStub;
    let dbStub;
    let collectionStub;
    let insertOneStub;
    let updateOneStub;
    let uploadStub;
    let detectFacesStub;

    beforeEach(() => {
        clientStub = sinon.stub(mongoClient, 'connect');
        dbStub = sinon.stub();
        collectionStub = sinon.stub();
        insertOneStub = sinon.stub();
        updateOneStub = sinon.stub();
        //uploadStub = sinon.stub(s3, 'upload');
        detectFacesStub = sinon.stub();

        clientStub.returns({
            db: dbStub.returns({
                collection: collectionStub,
            }),
            close: sinon.stub(),
        });

        collectionStub.returns({
            insertOne: insertOneStub,
            updateOne: updateOneStub,
        });
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        });
        uploadStub = sinon.stub().returns({
            promise: () => Promise.resolve({
                Location: `https://media.istockphoto.com/id/1200677760/photo/portrait-of-handsome-smiling-young-man-with-crossed-arms.jpg?s=612x612&w=0&k=20&c=g_ZmKDpK9VEEzWw4vJ6O577ENGLTOcrvYeiLxi8mVuo=`
            })
        });
    
        sinon.stub(s3, 'upload').callsFake(params => {
            return {
                promise: () => uploadStub(params)
            };
        });
        insertOneStub.resolves({ insertedId: '123' });

        //sinon.stub(rekognition, 'detectFaces').callsFake(detectFacesStub);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should register a new user successfully', async () => {
        const userData = 'John Doe';
        const photoData = 'base64EncodedImageData';

        insertOneStub.resolves({ insertedId: '123' });
        uploadStub.resolves({ Location: 'https://media.istockphoto.com/id/1200677760/photo/portrait-of-handsome-smiling-young-man-with-crossed-arms.jpg?s=612x612&w=0&k=20&c=g_ZmKDpK9VEEzWw4vJ6O577ENGLTOcrvYeiLxi8mVuo=' });
        detectFacesStub.resolves({
            promise: () => Promise.resolve({ FaceDetails: [{ "confidence":90}] })
        });
        


        const registrationResult = await registerNewUser(userData, photoData);

        expect(insertOneStub.calledOnceWithExactly({ name: userData, request: 'pending' })).to.be.true;
        expect(uploadStub.calledOnce).to.be.true;
        //expect(detectFacesStub.calledOnce).to.be.true;
    });

    it('should throw an error when exactly 1 face is not detected', async () => {
        const userData = 'John Doe';
        const photoData = 'base64EncodedImageData';

        detectFacesStub.resolves({ FaceDetails: undefined });

        try {
            await registerNewUser(userData, photoData);
            
            expect.fail('Exactly 1 face must be detected in the provided image.');
        } catch (error) {
            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('Exactly 1 face must be detected in the provided image.');
        }
    });

    it('should handle errors and throw the error', async () => {
        const userData = 'John Doe';
        const photoData = 'base64EncodedImageData';

        insertOneStub.rejects(new Error('Database error'));

        try {
            await registerNewUser(userData, photoData);
            
            expect.fail('Expected an error to be thrown');
        } catch (error) {
            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('Database error');
        }
    });
});

describe('pendingRequests', () => {
    let connectStub;
    let dbStub;
    let collectionStub;
    let findStub;
    let toArrayStub;

    beforeEach(() => {
        // Stub MongoDB functions
        toArrayStub = sinon.stub().resolves([]);
        findStub = sinon.stub().returns({
            toArray: toArrayStub
        });
        collectionStub = sinon.stub().returns({
            find: findStub
        });
        dbStub = sinon.stub().returns({
            collection: collectionStub
        });
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: dbStub,
            close: sinon.stub().resolves()
        });
    });

    afterEach(() => {
        // Restore original functions
        sinon.restore();
    });

    it('should return not found if no pending requests', async () => {
        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await pendingRequests(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'No pending requests found.'
        })).to.be.true;
    });

    it('should return pending requests if found', async () => {
        toArrayStub.resolves([{ request: 'pending', data: 'someData1' }, { request: 'pending', data: 'someData2' }]);

        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await pendingRequests(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({
            success: true,
            message: 'There are pending requests.',
            pendingRequests: [
                { request: 'pending', data: 'someData1' },
                { request: 'pending', data: 'someData2' }
            ]
        })).to.be.true;
    });

    it('should handle errors while fetching pending requests', async () => {
        findStub.throws(new Error('Database error'));

        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await pendingRequests(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });

    it('should handle errors while closing the database connection', async () => {
        connectStub.resolves({
            db: dbStub,
            close: sinon.stub().throws(new Error('Connection error'))
        });

        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await pendingRequests(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });
});

describe('searchFacesAndDelete', () => {
    let connectStub;
    let dbStub;
    let detectFacesStub;
    let searchFacesByImageStub;
    let deleteFacesStub;

    beforeEach(() => {
        // Stub MongoDB functions
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves({ userId: 'userId123' }),
                deleteOne: sinon.stub().resolves({ deletedCount: 1 })
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
            
        });

        // Stub AWS Rekognition functions
        // detectFacesStub = sinon.stub().returns({
        //     promise: sinon.stub().resolves({ FaceDetails: [{confidence:90}] })
        // });
        // searchFacesByImageStub=sinon.stub().returns({
        //     promise:sinon.stub().resolves({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        // })
        // searchFacesByImageStub = sinon.stub().returns({
        //     promise: sinon.stub().resolves({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        // });
        // sinon.stub(rekognition, 'searchFacesByImage').returns({ promise: () => Promise.resolve(searchFacesByImageStub())});
        // deleteFacesStub = sinon.stub().returns({
        //     promise: sinon.stub().resolves({ DeletedFaces: ['faceId123'] })
        // });

        //important
        // sinon.stub(rekognition, 'detectFaces').returns({
        //     promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        // });
        // sinon.stub(rekognition,'searchFacesByImage').returns({
        //     promise:()=>Promise.resolve({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        // })
        // sinon.stub(rekognition, 'deleteFaces').returns({
        //     promise:()=>Promise.resolve({ DeletedFaces: ['faceId123'] })});
    });                

    afterEach(() => {
        // Restore original functions
        sinon.restore();
    });

    it('should delete face and associated document', async () => {
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        });
        sinon.stub(rekognition,'searchFacesByImage').returns({
            promise:()=>Promise.resolve({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        })
        sinon.stub(rekognition, 'deleteFaces').returns({
            promise:()=>Promise.resolve({ DeletedFaces: ['faceId123'] })});
        
        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}`, _id: 'docId123' } };

        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({
            success: true,
            message: 'Face and associated document deleted successfully',
            name: 'userId123'
        })).to.be.true;
        expect(connectStub.calledOnce).to.be.true;
        expect(dbStub.collection.calledWith('faces')).to.be.true;
        expect(dbStub.collection().findOne.calledWith({ faceId: 'faceId123' })).to.be.true;
        expect(dbStub.collection().deleteOne.calledWith({ faceId: 'faceId123' })).to.be.true;
    });

    it('should handle no matching faces found', async () => {
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        });
        sinon.stub(rekognition,'searchFacesByImage').returns({
            promise:()=>Promise.resolve({ FaceMatches: [] })
        })

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';             

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}`, _id: 'docId123' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'No matching faces found'
        })).to.be.true;
    });

    it('should handle no faces detected in the provided image', async () => {
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [] })
        });

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';             

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}`, _id: 'docId123' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'No faces detected in the provided image'
        })).to.be.true;
    });

    it('should handle invalid image data format', async () => {
        const req = { body: { photoData: 'invalidFormat', _id: 'docId123' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Invalid image data format'
        })).to.be.true;
    });

    it('should handle errors during database operations', async () => {
        dbStub.collection().findOne.throws(new Error('Database error'));

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';             

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}`, _id: 'docId123' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });

    it('should handle errors during closing of database connection', async () => {
        dbStub.close.throws(new Error('Connection error'));
        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';             

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}`, _id: 'docId123' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndDelete(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });
});


describe('searchFacesAndRetrieve', () => {
    let connectStub;
    let dbStub;
    let detectFacesStub;
    let searchFacesByImageStub;

    beforeEach(() => {
        // Stub MongoDB functions
        
        // dbStub = {
        //     collection: sinon.stub().returns({
        //         findOne: sinon.stub().resolves({ userId: 'userId123' })
        //     }),
        //     close: sinon.stub().resolves()
        // };
        // connectStub = sinon.stub(mongoClient, 'connect').resolves({
        //     db: sinon.stub().returns(dbStub),
        //     close: sinon.stub().resolves(),
        // });

        // Stub AWS Rekognition functions
        // sinon.stub(rekognition, 'detectFaces').returns({
        //     promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        // });
        // sinon.stub(rekognition, 'searchFacesByImage').returns({
        //     promise: () => Promise.resolve({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        // });
    });

    afterEach(() => {
        // Restore original functions
        sinon.restore();
    });

    it('should recognize the user and check-in', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves({ userId: 'userId123' })
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        });
        sinon.stub(rekognition, 'searchFacesByImage').returns({
            promise: () => Promise.resolve({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
        });
        const username = 'testUser';
        const password = 'testPassword';
        const token = 'testToken';
        
        sinon.stub(axios, 'post').callsFake((url, data) => {
            // Custom logic based on the URL or data
            if (url === 'https://mobile1.qa.darwinbox.io/Mobileapi/auth') {
                // Return a custom response for authentication
                return Promise.resolve({ status: 200, data: { token: 'your-token' } });
            } else if (url === 'https://mobile1.qa.darwinbox.io/Mobileapi/CheckInPost') {
                // Return a custom response for check-in
                return Promise.resolve({ status: 200, data: { status: 1, token: 'your-token' } });
            } else {
                // Return a default response for other URLs
                return Promise.resolve({ status: 200, data: {} });
            }
        });
        

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        // expect(res.json.calledWith({
        //     success: true,
        //     userId: 'userId123',
        //     token
        // })).to.be.true;
        expect(connectStub.calledOnce).to.be.true;
        expect(dbStub.collection.calledWith('faces')).to.be.true;
        expect(dbStub.collection().findOne.calledWith({ faceId: 'faceId123' })).to.be.true;
    });

    // it('should recognize the user but not a Darwin employee', async () => {
    //     dbStub = {
    //         collection: sinon.stub().returns({
    //             findOne: sinon.stub().resolves([])
    //         }),
    //         close: sinon.stub().resolves()
    //     };
    //     connectStub = sinon.stub(mongoClient, 'connect').resolves({
    //         db: sinon.stub().returns(dbStub),
    //         close: sinon.stub().resolves(),
    //     });
    //     sinon.stub(rekognition, 'detectFaces').returns({
    //         promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
    //     });
    //     sinon.stub(rekognition, 'searchFacesByImage').returns({
    //         promise: () => Promise.resolve({ FaceMatches: [{ Face: { FaceId: 'faceId123' } }] })
    //     });
    //     //sinon.stub(axios, 'post').onFirstCall().resolves({ status: 202 });

    //     const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

    //     const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
    //     const res = {
    //         status: sinon.stub().returnsThis(),
    //         json: sinon.stub()
    //     };

    //     await searchFacesAndRetrieve(req, res);

    //     //expect(res.status.calledWith(202)).to.be.true;
    //     expect(res.statusCode).to.equal(202)
    //     // expect(res.json.calledWith({
    //     //     success: true,
    //     //     userId: undefined,
    //     //     message: 'userId123 is recognized but not a darwin employee'
    //     // })).to.be.true;
    // });

    it('should handle no matching faces found', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves([])
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [{ confidence: 90 }] })
        });
        sinon.stub(rekognition, 'searchFacesByImage').returns({
            promise: () => Promise.resolve({ FaceMatches: [] })
        });

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'No matching faces found'
        })).to.be.true;
    });

    it('should handle no faces detected in the provided image', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves([])
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        sinon.stub(rekognition, 'detectFaces').returns({
            promise: () => Promise.resolve({ FaceDetails: [] })
        });

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'No faces detected in the provided image'
        })).to.be.true;
    });

    it('should handle invalid image data format', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves([])
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        const req = { body: { photoData: 'invalidFormat' } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Invalid image data format'
        })).to.be.true;
    });

    it('should handle errors during database operations', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves([])
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        dbStub.collection().findOne.throws(new Error('Database error'));

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });

    it('should handle errors during closing of database connection', async () => {
        dbStub = {
            collection: sinon.stub().returns({
                findOne: sinon.stub().resolves([])
            }),
            close: sinon.stub().resolves()
        };
        connectStub = sinon.stub(mongoClient, 'connect').resolves({
            db: sinon.stub().returns(dbStub),
            close: sinon.stub().resolves(),
        });
        await dbStub.close.throws(new Error('Connection error'));

        const base64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAHggJ/P7rGwAAAABJRU5ErkJggg==';

        const req = { body: { photoData: `data:image/png;base64,${base64ImageData}` } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        await searchFacesAndRetrieve(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({
            success: false,
            message: 'Internal server error'
        })).to.be.true;
    });
});





