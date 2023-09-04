const express = require('express');
const router = express.Router();
const fs = require('fs');
require('dotenv').config({ path: './.env' });
const cookieParser = require('cookie-parser');router.use(cookieParser('horiken'));
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false })  
const initData = require('../modules/initData')

const currVersion = '8.0'

router.get('/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;
  let dbData = await initData(req)
  if((dbData.isLogin == true )){
    res.redirect('/new_dashboard')
  }else{
    res.render('login', {title:'堀健データベース',version:currVersion,error: false});
  }
});


module.exports = router;
