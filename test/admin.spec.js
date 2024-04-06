const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const {temp} = require('../controller/cookieController'); // Assuming your controller is in tempController.js
const {dashboard} = require('../controller/dashboardController')
const sinonChai = require('sinon-chai'); // Import sinon-chai

chai.use(sinonChai); // Add sinon-chai to Chai
const {accept,reject} = require('../controller/accrejController');
describe('temp controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        token: 'valid_token'
      }
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      send: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return success message for valid token', async () => {
    const decodedToken = {};

    sinon.stub(jwt, 'verify').returns(decodedToken);

    await temp(req, res);

    
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledOnceWithExactly({ success: true, message: 'jwt token verified' })).to.be.true;
  });

  it('should return error message for invalid token', async () => {
    sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

    await temp(req, res);

    
    expect(res.status.calledOnceWithExactly(401)).to.be.true;
    expect(res.send.calledOnceWithExactly('Invalid Token')).to.be.true;
  });
});

describe('dashboard controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        user: 'saiteja',
        pass: '1234'
      }
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      send: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return token for valid credentials', () => {
    const token = 'generated_token';
    sinon.stub(jwt, 'sign').returns(token);

    dashboard(req, res);

    //expect(jwt.sign.calledOnceWithExactly({ user: 'saiteja' }, 'your_secret_key', { expiresIn: '30m' })).to.be.true;
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledOnceWithExactly({
      token: token,
      message: 'saiteja Welcome, You Are Admin'
    })).to.be.true;
  });

  it('should return error message for invalid credentials', () => {
    req.body.user = 'invalid_user';
    req.body.pass = 'invalid_pass';

    dashboard(req, res);

    expect(res.status.calledOnceWithExactly(401)).to.be.true;
    expect(res.send.calledOnceWithExactly('invalid_user You entered invalid credentials')).to.be.true;
  });

  it('should return error message if username or password is missing', () => {
    req.body.user = null;
    req.body.pass = null;

    dashboard(req, res);

    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.send.calledOnceWithExactly('Both username and password are required.')).to.be.true;
  });
});


