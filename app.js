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
app.use(express.static(path.join(__dirname, 'public')))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); 
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors({
    origin: "*"
}));

app.get('/myapp', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home.html'));
})

const employeeRoutes = require('./routes/employeeRoutes.js')
app.use('/myapp/employee', employeeRoutes);

const adminRoutes = require('./routes/adminRoutes.js')
const recogRoutes =  require('./routes/RecogRoutes.js')
app.use('/myapp/admin', adminRoutes)
app.use('/myapp/',recogRoutes)
const port = process.env.PORT || 4005
app.listen(port, () => console.log(`http://localhost:${port}`)) 