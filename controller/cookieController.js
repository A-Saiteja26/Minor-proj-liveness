// cookieController.js
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path=require('path')
function checkCookie(req, res, next) {
    const cookieName = 'user'; 
    if (req.cookies && req.cookies[cookieName] !== null && req.cookies[cookieName] !== undefined) {
        
        //next();
    } else {
        
        res.sendFile(path.join(__dirname, '../views/admin/login.html'));
    }
}

module.exports = { checkCookie };
