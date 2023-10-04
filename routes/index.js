const express = require('express');
const router = express.Router();
const fs = require('fs');
require('dotenv').config({ path: './.env' });
const cookieParser = require('cookie-parser');router.use(cookieParser('horiken'));
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false })  
const initData = require('../modules/initData')

const currVersion = '1.0'

router.get('/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;
  let dbData = await initData(req)
  if((dbData.isLogin == true )){
    res.redirect('/dashboard')
  }else{
    res.render('login', {title:'堀健データベース',version:currVersion,error: false});
  }
});
router.get('/forgot-password',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;
  let dbData = await initData(req)
  if((dbData.isLogin == true )){
    res.redirect('/dashboard')
  }else{
    res.render('forgot_password', {title:'堀健データベース',version:currVersion,error: false});
  }
});
router.get('/reset-password',urlencodedParser, async (req, res) => {
  const db = req.app.locals.db;
  let dbData = await initData(req)
  if((dbData.isLogin == true )){
    res.redirect('/dashboard')
  }else{
    if (req.cookies.email_for_verification) {
      const cookie = req.cookies.email_for_verification;
      res.render('reset_password', {title:'新しいパスワードの設定', version:currVersion, email:cookie.email});
    } else {
      res.redirect('/');
    }
  }
});
module.exports = router;
