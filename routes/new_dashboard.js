const fs = require('fs');
const express = require('express');
const router = express.Router();
const initData = require('../modules/initData');
const nipposhukei = require('../modules/nipposhukei')
const ObjectId = require('mongodb').ObjectId;
const cookieParser = require('cookie-parser');router.use(cookieParser('horiken'));
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
require('dotenv').config({ path: './.env' });

router.get('/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req);
  if(dbData.isLogin){
    res.render('new_dashboard_nippo',Object.assign({title:'ダッシュボード'},dbData));
    // console.log(dbData)
    nipposhukei(db);
  }else{
    res.redirect('../');
  }
});

// ADMIN ONLY
router.get('/admin/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
    res.render('new_dashboard_admin',Object.assign({title:'ダッシュボード'},dbData));
  }else{
    res.redirect('../');
  }
});

//USER
router.get('/settings/holiday/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      let myCollection = db.collection('users')
      let users = await new Promise((resolve,reject)=>{
        myCollection.find().toArray((err, results) => { resolve(results); });
      });
      res.render('new_settings_holidays',Object.assign({title:'カレンダー(所定休日、法定休日)を設定する',users},dbData));
    }else{
      res.redirect('/new_dashboard');
    }
});


module.exports = router;
