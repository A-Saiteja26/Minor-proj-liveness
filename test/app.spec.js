const sinon = require('sinon');
const { expect } = require('chai');
const { deletePerson } = require('../controller/deletePersonController');
const {searchFacesAndDelete} = require('../controller/deleteController')
describe('deletePerson controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {}; // Set up your mock request object as needed
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should handle successful deletion', async () => {
    // Stub searchFacesAndDelete function to resolve successfully
    sinon.stub(searchFacesAndDelete).returns(Promise.resolve('Deleted successfully'));

    await deletePerson(mockReq, mockRes);

    // Assert that the response status is set to 200 and success message is sent
    expect(mockRes.status).to.have.been.calledOnceWith(200);
    expect(mockRes.json).to.have.been.calledOnceWith({ success: true, message: 'Deleted successfully' });
  });

  it('should handle deletion failure', async () => {
    const expectedError = new Error('Deletion failed');

    // Stub searchFacesAndDelete function to throw an error
    sinon.stub(searchFacesAndDelete).rejects(expectedError);

    await deletePerson(mockReq, mockRes);

    // Assert that the response status is set to 500 and error message is sent
    expect(mockRes.status).to.have.been.calledOnceWith(500);
    expect(mockRes.json).to.have.been.calledOnceWith({ success: false, message: 'Internal server error' });

    // Assert that the error is logged
    expect(console.error).to.have.been.calledOnceWith('Error:', expectedError);
  });
});
