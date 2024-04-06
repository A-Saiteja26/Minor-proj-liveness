const jwt = require('jsonwebtoken');
const secretKey = 'ThisIsASampleSecretKeyForJWTAuthentication428!'; 
const dashboard = (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    if (!user || !pass) {
        return res.status(400).send('Both username and password are required.');
    }

    console.log(user);
    console.log(pass);
    
    if (user === "saiteja" && pass === "1234") {
        
        const token = jwt.sign({ user: user }, secretKey, { expiresIn: '30m' });

        
        res.status(200).json({
            token: token,
            message: `${user} Welcome, You Are Admin`
        });
    } else {
        res.status(401).send(`${user} You entered invalid credentials`);
    }
}
module.exports = {dashboard}