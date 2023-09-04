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
      if(dbData.isAdmin){
        res.render('new_dashboard_admin',Object.assign({title:'ダッシュボード'},dbData));
      } else {
        res.render('new_dashboard_nippo',Object.assign({title:'ダッシュボード'},dbData));
      }
    // console.log(dbData)
    nipposhukei(db);
  }else{
    res.redirect('../');
  }
});


//カレンダーに会社独自の休暇を設定できる機能
router.get('/settings/holiday/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      let myCollection = db.collection('users')
      let users = await new Promise((resolve,reject)=>{
        myCollection.find().toArray((err, results) => { resolve(results); });
      });
      res.render('new_settings_holidays',Object.assign({title:'カレンダー(所定休日、法定休日)を設定する',users},dbData));
    }else{
      res.redirect('/dashboard');
    }
});

router.get('/input_nippo/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req);
  if(dbData.isLogin){
    res.render('dashboard_nippo_new_v2',Object.assign({title:'日報入力'},dbData));
    nipposhukei(db);
  }else{
    res.redirect('../');
  }
});
router.get('/nippo1',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req);
  if(dbData.isLogin){
    res.render('dashboard_nippo_new',Object.assign({title:'日報入力'},dbData));
    nipposhukei(db);
  }else{
    res.redirect('../');
  }
});
router.get('/ichiran',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin){
    let selectid  = 0
    if(req.query.genbaID!=undefined){
      SelectGenbaID=req.query.selectid
    }
    res.render('dashboard_nippo_ichiran',Object.assign({type:req.query.type,selectid:selectid},dbData));
  }else{
    res.redirect('../');
  }
});
// ADMIN ONLY
router.get('/nippoichiranevery/',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
    res.render('dashboard_nippo_every',Object.assign({title:'CSV作成'},dbData));
  }else{
    res.redirect('../');
  }
});
router.get('/nipposhukei',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
    res.render('dashboard_nippo_shukei', Object.assign({title:'日報集計',error: false},dbData));
  }else{
    res.redirect('/dashboard');
  }
});
router.get('/settings',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
    res.redirect('/dashboard/settings/nippo')
  }else{
    res.redirect('/dashboard');
  }
});
router.get('/settings/nippo',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      let types = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('type')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let places = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('place')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let koushu = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('koushu')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      elementTypes = [
        {name:'type',nameJP:'作業種類',data:types},
        {name:'place',nameJP:'場所',data:places},
        {name:'koushu',nameJP:'工種',data:koushu},
      ]
      res.render('settings_update',Object.assign({elementTypes:elementTypes,title:'日報設定'},dbData));
    }else{
      if(dbData.isLogin && !dbData.isAdmin){
        let koushu = await new Promise((resolve,reject)=>{
          let myCollection = db.collection('koushu')
          myCollection.find().toArray((err, results) => {
            resolve(results);
          });
        })
        elementTypes = [
          {name:'koushu',nameJP:'工種',data:koushu},
        ]
        res.render('settings_update',Object.assign({elementTypes:elementTypes,title:'日報設定'},dbData));
      }else{
        res.redirect('/dashboard');
      }
    }
});
router.get('/settings/global',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
    res.render('settings_global', Object.assign({title:'基本設定'},dbData));
  }else{
    res.redirect('/dashboard');
  }
});
router.get('/settings/genba',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin){
      let genbaID = req.query.genbaID
      if( genbaID ){
        if( genbaID != '0'){
          res.render('settings_genba_update',Object.assign({title:'現場情報を更新',isNew:false},dbData));
        }else{
          res.render('settings_genba_update',Object.assign({title:'新しい現場を登録する',isNew:false},dbData));
        }
      }else{
        res.render('settings_genba',Object.assign({title:'現場一覧'},dbData));
      }
    }else{
      res.redirect('/dashboard');
    }
});
router.get('/settings/genbastructure',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      let genbastructure = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('genbastructure')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let worklaw = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('worklaw')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let buildingtype = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('buildingtype')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let withdrawal = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('withdrawal')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      let company = await new Promise((resolve,reject)=>{
        let myCollection = db.collection('company')
        myCollection.find().toArray((err, results) => {
          resolve(results);
        });
      })
      elementTypes = [
        {name:'genbastructure',nameJP:'構造',data:genbastructure},
        {name:'worklaw',nameJP:'工法',data:worklaw},
        {name:'buildingtype',nameJP:'建物種類',data:buildingtype},
        {name:'withdrawal',nameJP:'撤去',data:withdrawal},
        {name:'company',nameJP:'業社名',data:company},
      ]
      res.render('settings_update',Object.assign({title:'現場項目設定',elementTypes:elementTypes},dbData));
    }else{
      res.redirect('/dashboard');
    }
});
router.get('/settings/company',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin){
      let companyID = req.query.companyID
      if( companyID ){
        if( companyID != '0'){
          res.render('settings_company_update',Object.assign({title:'業者情報を更新',isNew:false,companyID:companyID},dbData));
        }else{
          res.render('settings_company_update',Object.assign({title:'新しい業社を登録する',isNew:true},dbData));
        }
      }else{
        res.render('settings_company',Object.assign({title:'業者一覧'},dbData));
      }
    }else{
      res.redirect('/dashboard');
    }
});

//USER
router.get('/settings/users',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      let myCollection = db.collection('users')
      let users = await new Promise((resolve,reject)=>{
      myCollection.find().toArray((err, results) => { resolve(results); });
      });
      res.render('settings_users',Object.assign({title:'ユーザ管理',users:users},dbData));
    }else{
      res.redirect('/dashboard');
    }
});
router.get('/settings/users/new',urlencodedParser, async(req, res) => {
  const db = req.app.locals.db;let dbData = await initData(req)
  if(dbData.isLogin && dbData.isAdmin){
      res.render('settings_users_new',Object.assign({title:'新しいユーザを登録する'},dbData));
    }else{
      res.redirect('/dashboard');
    }
});
router.get('/settings/users/edit/:searchuserID',urlencodedParser, async(req, res) => {
  let searchuserID = req.params.searchuserID
  const db = req.app.locals.db;let dbData = await initData(req)
  if((dbData.isLogin && dbData.isAdmin) || (dbData.isLogin && (searchuserID ==dbData.userID)) ){
      let myCollection = db.collection('users')
      myCollection.findOne({'_id':new ObjectId(searchuserID)}, (err, result) => {
        if(result){
          res.render('settings_users_edit',Object.assign({title:'プロフィール',data:result},dbData));
        }else{
          console.log('userID not founded')
          res.redirect('/dashboard/settings/users')
        }
      })
    }else{
      res.redirect('/dashboard');
    }
});

//DB UTILIZATION
function HowToUseMongoDB (){


  let myCollection = db.collection('meigara')

  //Find all documents
  myCollection.find().toArray((err, results) => { console.log(results); });
  //Find a document
  myCollection.find({'コード':code}).sort({'コード':1}).toArray(function(err, meigara) {})
  myCollection.findOne({'コード':code}, (err, meigara) => {})
  //Insert data to a collection
  myCollection.insertOne({ name: 'Web Security' }, (err, result) => { });
  myCollection.insertMany([
    { name: 'Web Design' },
    { name: 'Distributed Database' },
    { name: 'Artificial Intelligence' }
  ], (err, results) => { });
  //Update an existing document
  myCollection.updateOne({ name: 'Web Design' }, { $set: { name: 'Web Analytics' } },
    (err, result) => {  console.log(result);  });
  //Delete a document
  myCollection.deleteOne({ name: 'Distributed Database' }, (err, result) => { console.log(result); });
}


module.exports = router;
