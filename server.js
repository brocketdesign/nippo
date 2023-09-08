const express = require('express');
const app = express();
const bodyParser = require("body-parser");
require('dotenv').config({ path: './.env' });
const MongoClient = require('mongodb').MongoClient;
var index = require('./routes/index');
var api = require('./routes/api.js');
var dashboard = require('./routes/dashboard');
// var new_dashboard = require('./routes/new_dashboard');
var users = require('./routes/users.js');
const cronjob = require('./modules/cronjob')
app.use(express.static('public'));  
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug');

app.use('/', index);
app.use('/api', api);
app.use('/dashboard', dashboard);
// app.use('/new_dashboard', new_dashboard);
app.use('/users', users);

app.use((req, res,next) => {
  res.status(404).redirect('/')
});

MongoClient.connect(process.env.MONGODB_URL)
.then(client =>{
  const db = client.db('horiken');
  app.locals.db = db;
  cronjob(db)
  console.log('DB connect successful')
});

const port = process.env.PORT || 4000
const server = app.listen(port, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});