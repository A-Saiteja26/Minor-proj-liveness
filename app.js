require('dotenv').config()
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', 'ejs');
// app.use(bodyParser());
app.use(bodyParser({limit: '50mb'}));
app.use(express.static(path.join(__dirname, 'public')))//to access static files like images and html
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // limit used to handle images which have large size
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors({
    origin: "*"
}));
//initial start of project 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home.html'));
})
//route for employee actions
const employeeRoutes = require('./routes/employeeRoutes.js')
app.use('/employee', employeeRoutes);
//route for admin actions
const adminRoutes = require('./routes/adminRoutes.js')
app.use('/admin', adminRoutes)
const port = process.env.PORT || 4005
app.listen(port, () => console.log(`http://localhost:${port}`)) 