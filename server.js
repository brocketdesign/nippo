const express = require('express');
const bodyParser = require("body-parser");
const MongoClient = require('mongodb').MongoClient;
const ip = require('ip');
const cronjob = require('./modules/cronjob');
const index = require('./routes/index');
const api = require('./routes/api.js');
const dashboard = require('./routes/dashboard');
const users = require('./routes/users.js');
require('dotenv').config({ path: './.env' });

// Initialize Express app
const app = express();

// Middleware and configurations
configureApp(app);

// Route definitions
setupRoutes(app);

// Database connection
connectToDatabase()
  .then(db => {
    app.locals.db = db;
    cronjob(db);console.log(`Successfully connected to MongoDB database: ${db.databaseName}`);
    // Start server
    startServer(app);
  });



function configureApp(app) {
  app.use(express.static('public'));
  app.set('view engine', 'pug');
  console.log('App configured');
}

function setupRoutes(app) {
  app.use('/', index);
  app.use('/api', api);
  app.use('/dashboard', dashboard);
  app.use('/users', users);
  app.use(handle404);
  console.log('Routes setup');
}

function handle404(req, res, next) {
  res.status(404).redirect('/');
  console.log('404 error handled');
}

async function connectToDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URL);
  return client.db('horiken');
}

function startServer(app) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express running → PORT http://${ip.address()}:${port}`);
  });
}
