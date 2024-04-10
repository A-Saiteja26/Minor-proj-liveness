const express= require('express')
const router=express.Router()
const path=require('path')
const bodyParser=require('body-parser')
const jwt = require('jsonwebtoken');
const secretKey = 'ThisIsASampleSecretKeyForJWTAuthentication428!'; 
const cookieParser = require('cookie-parser');
const pendingController = require('../controller/pendingController');
const {indexFacesAndStore,rejectRequest} =require('../controller/registerController');
const {dashboard} = require('../controller/dashboardController')
const {accept,reject} = require('../controller/accrejController')
router.use(cookieParser());
router.use(bodyParser.json());

// Middleware to parse incoming request bodies
router.use(bodyParser.urlencoded({ extended: true }));
const {temp} = require('../controller/cookieController');


router.post("/validatejwt" , temp)

router.post('/dashboard', dashboard);

router.get('/pending-requests',pendingController.pendingRequests);

const viewController = require('../controller/viewController');
//router.get('/view-requests',viewController.getPendingRequests)

router.get('/view-requests', (req, res) => {
    viewController.getPendingRequests(req, res);
});




router.post('/accept', accept);
router.post('/reject', reject);
const getMembers = require('../controller/getMembers');
router.get('/get-members',async (req,res)=>{
     await getMembers.members(req,res);
})
module.exports=router