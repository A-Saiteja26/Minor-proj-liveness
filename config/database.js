const { MongoClient } = require('mongodb');
require('dotenv').config()
const mongoClient = new MongoClient('mongodb+srv://saiteja4032:Saiteja%404599@cluster0.ziea3hm.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
module.exports = { mongoClient };