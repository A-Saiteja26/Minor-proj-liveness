// //"test": "mocha --watch 'test/**/*.js'",
// const sinon = require('sinon');
// const { expect } = require('chai');
// const { ObjectId } = require('mongodb');
// //const { mongoClient, rekognition, s3 } = require('../controller'); // Import necessary dependencies
// //const {mongoClient} = require('../config/database')
// //const s3 = require('../config/s3');
// //const rekognition = require('../config/aws');
// const { indexFacesAndStore,rejectRequest} = require('../controller/registerController')
// //const { ObjectId } = require('mongodb');

// // Generate a valid ObjectID
// const id = new ObjectId();

// const mongoClient = {
//     connect: sinon.stub().resolves({
//         db: sinon.stub().returnsThis(),
//         close: sinon.stub().resolves(),
//         collection: sinon.stub().returnsThis(),
//         findOne: sinon.stub().resolves({ imageUrl: 'testImageUrl' }),
//         updateOne: sinon.stub().resolves(),
//         insertOne: sinon.stub().resolves()
//     })
// };
// const s3 = {
//     getObject: sinon.stub().returns({
//         promise: sinon.stub().resolves({ Body: 'testImageData' })
//     })
// };
// const rekognition = {
//     detectFaces: sinon.stub().returns({
//         promise: sinon.stub().resolves({ FaceDetails: [{}, {}] })
//     }),
//     searchFacesByImage: sinon.stub().returns({
//         promise: sinon.stub().resolves({ FaceMatches: [{}, {}] })
//     }),
//     indexFaces: sinon.stub().returns({
//         promise: sinon.stub().resolves({ FaceRecords: [{ Face: { FaceId: 'testFaceId' } }] })
//     })
// };

// const dependencies = {
//     mongoClient,
//     s3,
//     rekognition
// };

// describe('indexFacesAndStore', () => {
//     it('should execute all branches', async () => {
//         // Stub process.env.COLLECTION_ID
//         const collectionId = 'testCollectionId';
//         process.env.COLLECTION_ID = collectionId;

//         // Call the function
//         const result = await indexFacesAndStore(id.toHexString(), dependencies);

//         // Assertions
//         expect(result).to.be.oneOf([0, 1,"request not found"]);
//         sinon.assert.callCount(mongoClient.connect, 1);
//         sinon.assert.callCount(mongoClient.connect().db().collection, 2);
//         sinon.assert.calledOnce(s3.getObject);
//         sinon.assert.calledOnce(rekognition.detectFaces);
//         sinon.assert.calledOnce(rekognition.searchFacesByImage);
//         sinon.assert.calledOnce(rekognition.indexFaces);

//         // Clean up
//         delete process.env.COLLECTION_ID;
//     }).timeout(5000);
// });
