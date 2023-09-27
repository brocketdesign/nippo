var express = require('express');
var router = express.Router();
const fs = require('fs');
const converter = require('json-2-csv');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const initData = require('../modules/initData');
const genbatoday = require('../modules/genbatoday');
const geoip = require('geoip-lite');
const moment = require('moment');
const genbaModule = require('../modules/genbaModule'); // Import the refactored module
const urlencodedParser = bodyParser.urlencoded({ extended: true })
require('dotenv').config({ path: './.env' });
router.use(cookieParser('horiken'));

// GET CALENDAR DATA ON ADMIN DASHBOARD PAGE
router.get('/genbaStatistic', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req);
  if (dbData.isLogin) {
    let today = req.query.today;
    let userID = req.query.userID;
    let dbName = "genba";
    let start_period = req.query.start;
    let end_period = req.query.end;
    let genbaCollection = db.collection(dbName);
    let userData = await db.collection('users').findOne({'_id':new ObjectId(userID)})
    let userGenba = userData.genba || []
    genbaCollection.find({ '工事名': { $in: userGenba } }).sort({ 'updatedAt': 1 }).limit(10).toArray()
        .then(async (genbaList10) => {
        //工事名 is in userGenba
        let result = [];
        if (genbaList10.length) {
          for (let i = 0; i < genbaList10.length; i++) {
            let data = [];
            let nippoCollection = db.collection(genbaList10[i]._id + '_genbanippo');
            let genbaNippoList = await nippoCollection.find().sort({ 'today': -1 }).toArray();
    
            if (genbaNippoList.length > 0) {
              genbaNippoList.forEach((element, index) => {
                if ((start_period != 'false') && (end_period != 'false')) {
                  if ((new Date(element.today) >= new Date(start_period)) && (new Date(element.today) <= new Date(end_period))) {
                    data.push(element);
                  }
                } 
                if ((index + 1) >= genbaNippoList.length) {
                  result.push({
                    label: genbaList10[i].工事名,
                    data
                  });
                }
              });
            } else {
              result.push({
                label: genbaList10[i].工事名,
                data: []
              });
            }
    
            if (i + 1 >= genbaList10.length) {
              res.send(result);
            }
          }
        } else {
          res.send([]);
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
      });
  } else {
    res.sendStatus(403);
  }
});

// GET USERS' NIPPO DATA
router.get('/userStatistic', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req);
  if (dbData.isLogin) {
    let today = req.query.today;
    let start_period = req.query.start;
    let dbName = "users";
    let end_period = req.query.end;
    let userCollection = db.collection(dbName);
    let result = [];
    let users = await userCollection.find().sort({ '_id': 1 }).toArray();
    if (users.length) {
      for (let i = 0; i < users.length; i++) {
        let userID = users[i]._id;
        let nippoCollection = db.collection(userID + '_nippo')
        let userNippoData = await nippoCollection.find().sort({ 'today': -1 }).toArray();
        if(userNippoData) {
          let data = [];
          userNippoData.forEach((element, index) => {
            if (element.日付) {
              if ((start_period != 'false') && (end_period != 'false')) {
                const end_full_date = end_period.split('/');
                const end_month = parseInt(end_full_date[0]) - 1;
                const end_date = parseInt(end_full_date[1]);
                const end_year = parseInt(end_full_date[2]);
                if ((new Date(element.日付).getFullYear() == new Date(start_period).getFullYear() && (new Date(element.日付).getMonth() > new Date(start_period).getMonth() || new Date(element.日付).getMonth() == new Date(start_period).getMonth() && new Date(element.日付).getDate() >= new Date(start_period).getDate()))
                && (new Date(element.日付).getFullYear() == end_year && (new Date(element.日付).getMonth() < end_month || new Date(element.日付).getMonth() == end_month && new Date(element.日付).getDate() <= end_date))) {
                  data.push(element)
                }
              }
            }
          });
          result.push({user: users[i], nippo:data })
        } else {
          result.push({user: users[i], nippo:[]})
        }
        if (i + 1 >= users.length) {
          res.send(result);
        }
      }
    } else {
      res.send([]);
    }
  } else {
    res.sendStatus(403);
  }
});

router.get('/updd', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db;
  res.send('done')
})

router.get('/localbackup', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db;
  const localbackup = require('../modules/localbackup')
  localbackup(db, 'daily')
  res.send('done')
})

router.get('/nippoichiran', urlencodedParser, async (req, res) => {

  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    //RETURN DATA UNTIL YESTERDAY
    let userID = req.query.userID
    let today = req.query.today
    let start_period = req.query.start
    let end_period = req.query.end
    let myCollection = db.collection('users')
    let getDatas = new Promise((resolve, reject) => {
      let nippoCollection = db.collection(userID + '_nippo')
      nippoCollection.find().sort({ 'today': -1 }).toArray((err, results) => {
        if (results.length > 0) {
          let data = count = []
          results.forEach((element, index) => {
            if ((count.includes(element.日付) == false) && (element.日付)) {
              if ((start_period != 'false') && (end_period != 'false')) {
                const end_full_date = end_period.split('/');
                const end_month = parseInt(end_full_date[0]) - 1;
                const end_date = parseInt(end_full_date[1]);
                const end_year = parseInt(end_full_date[2]);
                if ((new Date(element.日付).getFullYear() == new Date(start_period).getFullYear() && (new Date(element.日付).getMonth() > new Date(start_period).getMonth() || new Date(element.日付).getMonth() == new Date(start_period).getMonth() && new Date(element.日付).getDate() >= new Date(start_period).getDate()))
                && (new Date(element.日付).getFullYear() == end_year && (new Date(element.日付).getMonth() < end_month || new Date(element.日付).getMonth() == end_month && new Date(element.日付).getDate() <= end_date))) {
                  data.push(element)
                  //console.log(element)
                  //count.push(element.日付)
                }
              } else {
                //data.push(element)
                //count.push(element.日付)
              }
            }
            if ((index + 1) >= results.length) {
              if (data.length > 0) {
                resolve(data)
              } else {
                console.log({
                  event: 'nippoichiran',
                  res: 'Nothing for today',
                })
                reject()
              }
            }
          });
        } else {
          console.log({
            event: 'nippoichiran',
            res: 'Nothing at all',
          })
          reject()
        }
      });
    })
    await getDatas.then((data) => {
      data = data.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      //console.log(data)
      res.send(data)
    }).catch((e) => {
      res.send(false)
    })
  } else {
    res.redirect('../');
  }
});
router.get('/genbaichiran', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let genbaID = req.query.genbaID
    let today = req.query.today
    let start_period = req.query.start
    let end_period = req.query.end
    let myCollection = db.collection('users')
    let getDatas = new Promise((resolve, reject) => {
      let nippoCollection = db.collection(genbaID + '_genbanippo')
      nippoCollection.find().sort({ 'today': -1 }).toArray((err, results) => {
        if (results.length > 0) {
          let data = count = []
          results.forEach((element, index) => {
            if ((count.includes(element.日付) == false) && (element.日付)) {
              data.push(element)
            }
            if ((index + 1) >= results.length) {
              if (data.length > 0) {
                resolve(data)
              } else {
                console.log({
                  event: 'genbaichiran',
                  res: 'Nothing for today',
                })
                reject()
              }
            }
          });
        } else {
          console.log({
            event: 'genbaichiran',
            res: 'Nothing at all',
          })
          reject()
        }
      });
    })
    await getDatas.then((data) => {
      data = data.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      res.send(data)
    }).catch((e) => {
      res.send(false)
    })
  } else {
    res.redirect('../');
  }
});
router.get('/genbaichiranDateRange', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let genbaID = req.query.genbaID
    let today = req.query.today
    let start_period = req.query.start
    let end_period = req.query.end

    console.log({
      event: 'genbaichiran',
      genbaID: genbaID,
      today: today,
      start_period: start_period,
      end_period: end_period,
    })

    let myCollection = db.collection('users')
    let getDatas = new Promise((resolve, reject) => {
      let nippoCollection = db.collection(genbaID + '_genbanippo')
      nippoCollection.find().sort({ 'today': -1 }).toArray((err, results) => {
        if (results.length > 0) {
          let data = count = []
          results.forEach((element, index) => {
            if ((count.includes(element.日付) == false) && (element.日付)) {
              if((start_period != 'false') && (end_period != 'false' )){
                const end_full_date = end_period.split('/');
                const end_month = parseInt(end_full_date[0]) - 1;
                const end_date = parseInt(end_full_date[1]);
                const end_year = parseInt(end_full_date[2]);
                if ((new Date(element.日付).getFullYear() == new Date(start_period).getFullYear() && new Date(element.日付).getMonth() >= new Date(start_period).getMonth() && new Date(element.日付).getDate() >= new Date(start_period).getDate())
                && (new Date(element.日付).getFullYear() == end_year && new Date(element.日付).getMonth() <= end_month && new Date(element.日付).getDate() <= end_date)) {
                  data.push(element)
                  //count.push(element.日付)
                }
              }
            }
            if ((index + 1) >= results.length) {
              if (data.length > 0) {
                resolve(data)
              } else {
                console.log({
                  event: 'genbaichiran',
                  res: 'Nothing for today',
                })
                reject()
              }
            }
          });
        } else {
          console.log({
            event: 'genbaichiran',
            res: 'Nothing at all',
          })
          reject()
        }
      });
    })
    await getDatas.then((data) => {
      data = data.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      res.send(data)
    }).catch((e) => {
      res.send(false)
    })
  } else {
    res.redirect('../');
  }
});
router.get('/nippochart/:id', urlencodedParser, async (req, res) => {

  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let today = req.query.day
    let userID = req.params.id
    let isLogin = req.signedCookies.isLogin
    if (isLogin != undefined) {
      if (isLogin.statut == true) {
        let userID = isLogin.userID
        let myCollection = db.collection('users')
        let getDatas = new Promise((resolve, reject) => {
          let nippoCollection = db.collection(userID + '_nippo')
          nippoCollection.find().sort({ '_id': -1 }).toArray((err, results) => {
            let data = count = []
            results.forEach((element, index) => {
              if ((count.includes(element.today) == false) && (element.today)) {
                let month = new Date(element.today).getMonth()
                let currMont = new Date(today).getMonth()
                if (month == currMont) {
                  data.push(element)
                  count.push(element.today)
                }
              }
              if ((index + 1) >= results.length) { resolve(data) }
            });
          });
        })
        let data = await getDatas
        //HOURS / GENBA 工事名-
        let obj = {}
        data.forEach(element => {
          let keys = Object.keys(element)
          keys.forEach(item => {
            if (item.indexOf('工事名-') >= 0) {
              let st = element['日-' + item.substring(item.indexOf('-') + 1)]
              if (st != undefined) {
                if (obj[element[item]] == undefined) {
                  obj[element[item]] = 0
                }
                obj[element[item]] += parseFloat(st)
              }
            }
          });
        });
        res.send(obj)
      }
    }
  } else {
    res.redirect('../');
  }
});

router.get('/genba/today/:usersID', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db;
  let dbData = await initData(req);
  let userID = req.params.usersID;
  let today = moment().format('M/D/YYYY'); // Today's date
  let ct = today; // Initialize current time (ct) to today

  if (req.query.today !== undefined) {
    ct = req.query.today; // Update ct if today query param is provided
  }

  let weekspan = [];
  // Generating weekspan
  for (let i = 0; i <= 7; i++) {
    let wd = moment().subtract(i, 'days').format('M/D/YYYY');
    weekspan.push(wd);
  }
  if (dbData.isLogin) {
    let isGenbaRes;
    // Decide which function to call based on the value of ct
    if (ct === today) {
      isGenbaRes = await genbaModule.getGenbaToday(db, userID, ct, weekspan);
    } else {
      isGenbaRes = await genbaModule.getGenbaOtherDays(db, userID, ct);
    }
    res.send(isGenbaRes);
  } else {
    res.send(false);
  }
});


router.get('/filter', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

    let promise_data = []
    let myCollection = db.collection('users')
    let usersID = await myCollection.find().toArray();
    if (req.query.responsible != 'null') {
      usersID = [{ _id: req.query.responsible }]
    }
    console.log(req.query)
    usersID.forEach(user => {
      let userID = user._id
      let prs = new Promise((resolve, reject) => {
        db.collection(userID + '_nippo').find().sort({ '_id': -1 }).toArray((err, results) => {
          if (results.length > 0) {
            let result = []
            results.forEach(el => {
              if ((req.query.genba == 'null') && (req.query.type == 'null')) {
                result.push(el)
              } else {
                for (let i = 1; i <= el.totalLine; i++) {
                  if ((req.query.genba != null) && (req.query.genba == el['工事名-' + i])) {
                    result.push(el)
                  }
                  if ((req.query.type != null) && (req.query.type == el['作業名-' + i])) {
                    result.push(el)
                  }
                }
              }
            });
            resolve(result)
          } else {
            resolve([])
          }
        })
      })
      promise_data.push(prs)
    });
    let data = await Promise.all(promise_data)
    let dataRes = []
    try {
      data.forEach(element => {
        element.forEach(el => {

          let startDate = new Date(req.query.startDate).toLocaleString('ja-JP')
          startDate = new Date(startDate.substring(0, startDate.indexOf(' ')))
          let endDate = new Date(req.query.endDate).toLocaleString('ja-JP')
          endDate = new Date(endDate.substring(0, endDate.indexOf(' ')))
          let currDate = new Date(el.date).toLocaleString('ja-JP')
          currDate = new Date(currDate.substring(0, currDate.indexOf(' ')))
          var timestamp = Date.parse(el.date);
          if (isNaN(timestamp) == true) { return }

          if ((startDate <= currDate) && (endDate >= currDate)) {
            dataRes.push(el)
          }

        });
      });
      let exRes = []
      let exCSV = []
      dataRes = dataRes.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
      for (let i = 0; i < dataRes.length; i++) {
        let el = dataRes[i]
        if (el.userName == undefined) {
          let myCollection = db.collection('users')
          el.作業者名 = await myCollection.findOne({ '_id': new ObjectId(el.userID) })
          el.作業者名 = el.作業者名.lname + ' ' + el.作業者名.fname
          el.userName = el.作業者名
        }
        for (let i = 1; i <= el.totalLine; i++) {
          let obj = {}
          if (el['工事名-' + i]) {
            obj.日付 = el.todayJP
            obj.作業者名 = el.userName
            obj['工事名'] = el['工事名-' + i]
            obj['作業名'] = el['作業名-' + i]
            obj['日'] = el['日-' + i]
            obj['作業内容'] = el['作業内容-' + i] || ''
            exCSV.push(obj)
          }
        }
        exRes.push(el)
      };

      exRes = exRes.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
      exCSV = exCSV.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      let filterCSV = db.collection('filterCSV')
      filterCSV.remove({})
      filterCSV.insertOne({ data: exCSV }, (err, result) => { });
      res.send(exRes)
    } catch (err) {
      console.log(err)
      res.send(false)
    }
  } else {
    res.redirect('../');
  }
});

router.post('/nippo', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let value = req.body

    var date = new Date(value.日付);
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    const options = {
      //year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }
    const now = date
    const todayJP = now.toLocaleDateString('ja-JP', options)

    value.date = date
    value.today = today
    value.todayJP = todayJP
    console.log({
      event: 'POST nippo',
      value: value,
    })
    let userID = req.body.userID
    let nippoCollection = db.collection(userID + '_nippo')
    nippoCollection.findOne({ userID: value.userID, today: value.today }, (err, result) => {
      if (result) {
        nippoCollection.deleteOne({ '_id': new ObjectId(result._id) }, (err, result) => { });
        nippoCollection.insertOne(value, (err, result) => {
          res.sendStatus(200);
        });
        /*
       nippoCollection.updateOne({ userID: value.userID,today:value.today }, { $set: value}, (err, result) => {
         res.sendStatus(200);
       });
       */
      } else {
        nippoCollection.insertOne(value, (err, result) => {
          res.sendStatus(200);
        });
      }
    })

  } else {
    res.sendStatus(403);
  }
});
router.post('/genbanippo', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let value = req.body
    if (Object.keys(value).length > 0) {
      var date = new Date(value.日付);
      var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
      const options = {
        //year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }
      const now = date
      const todayJP = now.toLocaleDateString('ja-JP', options)

      value.date = date
      value.today = today
      value.todayJP = todayJP
      let totalLine = parseInt(value.totalLine)
      if (totalLine > 0) {
        for (let i = 1; i <= totalLine; i++) {
          //Adding company ID
          try {
            if (value['業社名-' + i] != undefined) {
              let companyID = await db.collection('company').findOne({ el: value['業社名-' + i] })
              value['業社ID-' + i] = companyID._id
            }
          } catch (e) {
            console.log(e)
          }
          //Adding 工種 ID
          try {
            if (value['工種-' + i] != undefined) {
              let koushuID = await db.collection('koushu').findOne({ el: value['工種-' + i] })
              value['工種ID-' + i] = koushuID._id
            }
          } catch (e) {
            console.log(e)
          }
        }
      }

      console.log({
        event: 'POST genbanippo',
        value: value,
      })

      //genba today
      genbatoday(value, db)

      let nippoCollection = db.collection(value.genbaID + '_genbanippo')
      nippoCollection.findOne({ userID: value.userID, today: value.today }, (err, result) => {
        if (result) {
          nippoCollection.deleteOne({ '_id': new ObjectId(result._id) }, (err, result) => { });
          nippoCollection.insertOne(value, (err, result) => {
            let genbaCollection = db.collection("genba")
            genbaCollection.updateOne({ '_id': new ObjectId(value.genbaID) }, { $set: {updatedAt: new Date()} }, (err, result) => {
              res.sendStatus(200);
            });
          });
          /*
          nippoCollection.updateOne({ userID: value.userID,today:value.today }, { $set: value}, (err, result) => {
            res.sendStatus(200);
          });
          */
        } else {
          nippoCollection.insertOne(value, (err, result) => {
            res.sendStatus(200);
          });
        }
      })
    } else {
      console.log('Error in POST genbaNippo')
      console.log(value)
      res.sendStatus(200)
    }
  } else {
    res.sendStatus(403);
  }
});

router.post('/userinfo', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  var geo = geoip.lookup(req.ip);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }
  let userInfo = {
    userID: dbData.userID,
    _date: new Date(),
    dateJP: new Date(dbData.date).toLocaleDateString('ja-JP'),
    todayJP: new Date(dbData.date).toLocaleDateString('ja-JP', options),
    date: dbData.date,
    today: dbData.today,
    userIP: JSON.stringify(req.ip),
    userAgent: req.headers["user-agent"],
    language: req.headers["accept-language"],
    country: (geo ? geo.country : "Unknown"),
    region: (geo ? geo.region : "Unknown"),
    geo: geo
  }
  userInfo = Object.assign({}, userInfo, req.body)
  //db.collection('userinfo').remove({})
  db.collection('userinfo').insertOne(userInfo, (err, result) => { });

  res.sendStatus(200)
})
// カレンダー(所定休日、法定休日)を設定する
router.post('/saveYearCalendar', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req);
  if (dbData.isLogin) {
    db.collection('calendar').findOne({ year: req.body.year }, (err, result) => {
      if (result) {
        const value = {
          year : req.body.year,
          yearEndAndNewYear : req.body.yearEndAndNewYear,
          legalHolidays : req.body.legalHolidays,
          scheduledHolidays : req.body.scheduledHolidays,
          workDays : req.body.workDays
        };
        db.collection('calendar').deleteOne({ 'year': req.body.year }, (err, result) => { });
        db.collection('calendar').insertOne(value, (err, result) => {
          res.sendStatus(200);
        });
      } else {
        db.collection('calendar').insertOne(req.body, (err, result) => { });
        res.sendStatus(200);
      }
    });
  } else {
    res.sendStatus(403);
  }
});
router.post('/:myAction/:elementType', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let myAction = req.params.myAction
    let elementType = req.params.elementType
    console.log({
      myAction: myAction,
      elementType: elementType,
      elementTypeID: req.query.elementTypeID,
      req: req.body
    })
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    if (myAction == 'editAll') {
      let myCollection = db.collection(elementType)
      await new Promise((resolve, reject) => {
        myCollection.remove({}, () => {
          resolve()
        })
      })
      let data = []
      try {
        req.body.el.forEach(element => {
          data.push({ el: element })
        });
      } catch {
        data.push(req.body)
      }
      //console.log(data)
      await new Promise((resolve, reject) => {
        myCollection.insertMany(data, (err, results) => {
          resolve()
        });
      })
    }//editAll

    if (myAction == 'addone') {
      let myCollection = db.collection(elementType)
      await new Promise((resolve, reject) => {
        myCollection.insertOne(req.body, (err, result) => { resolve() });
      })
    }//ADD ONE

    if (myAction == 'edit') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $set: req.body }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID not founded')
      }
    };//update ONE

    if (myAction == 'replace') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.deleteOne({ '_id': new ObjectId(req.query.elementTypeID) }, (err, result) => { });
          myCollection.insertOne(req.body, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID not founded')
      }
    };//replace ONE

    if (myAction == 'update') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $set: req.body }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID not founded')
      }
    };//update ONE

    if (myAction == 'editField') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $unset: { [req.body.field]: "" } }, { upsert: true }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID not founded')
      }
    };//EDIT ONE

    if (myAction == 'delete') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.deleteOne({ '_id': new ObjectId(req.query.elementTypeID) }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('genbaID not founded')
      }
    }//DELETE
    res.redirect('back')
  } else {
    res.sendStatus(403);
  }
});
router.get('/update/:dbName', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let dbName = req.params.dbName
    let elID = req.query.elID
    let day = req.query.day
    if (elID) {
      db.collection(dbName).findOne({ '_id': new ObjectId(elID) }, (err, result) => {
        res.send(result);
      })
    }
    if (day) {
      db.collection(dbName).find({ 'today': day }).sort({ '_id': -1 }).limit(1).toArray((err, results) => {
        res.send(results);
      });
    }
    if (!day && !elID) {
      db.collection(dbName).find().sort({ '_id': -1 }).toArray((err, results) => {
        results.forEach(element => {
          //db.collection(dbName).updateOne({ _id: new ObjectId(element._id) }, { $set: { nippo: []  } }, (err, result) => {  console.log(result);  });
        });
        res.send(results);
      });
    }

  } else {
    res.sendStatus(403);
  }
});
router.get('/:dbName', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let dbName = req.params.dbName
    let elID = req.query.elID
    let day = req.query.day
    if (elID != undefined) {
      console.log({
        event: 'GET DATA FROM DB',
        dbName: dbName,
        elID: elID,
        day: day,
      })
    }
    if (elID) {
      if (req.query.getGenba) {
        db.collection(dbName).findOne({ '_id': new ObjectId(elID) }, async (err, result) => {
            let genbaList=[]
            let genbaCollection = db.collection("genba");
            const genbaList10 = await genbaCollection.find().toArray();
            if (genbaList10.length) {
              for (let k = 0; k < genbaList10.length; k++) {
                let nippoCollection = db.collection(genbaList10[k]._id + '_genbanippo');
                let genbaNippoList = await nippoCollection.find().toArray();
                if (genbaNippoList.length > 0) {
                  for (let j = 0; j < genbaNippoList.length; j++) {
                    if (genbaList.indexOf(genbaList10[k]) > -1) break;
                    if(genbaNippoList[j].totalLine) {
                      for (let i = 1; i <= parseInt(genbaNippoList[j].totalLine); i++) {
                        if (genbaNippoList[j]['業社名-' + i] === result.el) {
                          if (genbaList.indexOf(genbaList10[k]) > -1) break;
                          genbaList.push(genbaList10[k]);
                          break;
                        } else { continue; }
                      }
                    } else { continue; }
                  }
                }
                if (k + 1 >= genbaList10.length) {
                  res.send({company:result,genba:genbaList});
                }
              }
            } else {
              res.send({company:result,genba:[]});
            }
        })
      } else {
        db.collection(dbName).findOne({ '_id': new ObjectId(elID) }, (err, result) => {
          if (result == undefined) {
            db.collection(dbName).findOne({ '_id': elID }, (err, result) => {
              res.send(result);
            })
          } else {
            res.send(result);
          }
        })        
      }
    }
    if (day) {
      db.collection(dbName).find({ 'today': day }).sort({ '_id': -1 }).toArray((err, results) => {
        res.send(results);
      });
    }
    if (!day && !elID) {
      db.collection(dbName).find().sort({ '_id': 1 }).toArray((err, results) => {
        res.send(results);
      });
    }
  } else {
    res.sendStatus(403);
  }
});


//GET USER INFO
router.get('/db/userid', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    if (db == undefined) {
      MongoClient.connect(process.env.MONGODB_URL)
        .then(client => {
          db = client.db('horiken');
        })
        .catch((e) => {
          console.log(e)
          console.log('DB connection error !')
        })
    }
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    let isLogin = req.signedCookies.isLogin
    if (isLogin != undefined) {
      if (isLogin.statut == true) {
        let userID = isLogin.userID
        let myCollection = db.collection('users')
        myCollection.findOne({ '_id': new ObjectId(userID) }, (err, user) => {
          if (user) {
            res.send(user._id)
          } else {
            res.send('user not founded')
          }
        })
      }
    }
  } else {
    res.sendStatus(403);
  }
});
router.get('/csv/:typeCSV', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let myCollection = db.collection(req.params.typeCSV)
    myCollection.find().sort({ '_id': -1 }).limit(1).toArray(function (err, result) {
      if (result[0].data != undefined) {
        converter.json2csv(result[0].data, (err, csv) => {
          if (err) { throw err; reject() }
          let rannd = Math.random().toString().substr(2, 8);
          res.setHeader('Content-disposition', 'attachment; filename=' + rannd + '.csv');
          res.set('Content-Type', 'text/csv');
          res.status(200).send(csv);
        })
      } else {
        res.sendStatus(404)
      }
    })
  } else {
    res.sendStatus(403);
  }
});
//ADD DATA TO DB FRON JSON
router.get('/', urlencodedParser, (req, res) => {
  res.send('API V1.0.0');
  //const data = require('./list/csvjson.json')
  //db.collection('company').insertMany(data);

  //res.send('api v1.00');

  //UPDATE DATABASE
  /*
    koushuFile.forEach(koushu => {
        let fileEl = koushu.el
        let fileName = koushu.name

        db.collection('koushu').updateOne({ 'el': fileEl }, { $set: {
          '業者名': fileName
        } },(err, result) => {  });

      });
      res.send('DONE');
  */
  //DELETE DUPLICATE
  /*
    db.collection('koushu').find().toArray((err, results) => {
      let count = []
      results.forEach(element => {
        if( count.includes(element.el) == false ){
          count.push(element.el)
        }else{
          db.collection('koushu').deleteOne({ 'el': element.el }, (err, result) => { });
        }
      });
      res.send(JSON.stringify(count));
    });
  */

});

//DB UTILIZATION
function HowToUseMongoDB() {

  let myCollection = db.collection('meigara')

  //Find all documents
  myCollection.find().toArray((err, results) => { console.log(results); });
  //Find a document
  myCollection.find({ 'コード': code }).sort({ 'コード': 1 }).toArray(function (err, meigara) { })
  myCollection.findOne({ 'コード': code }, (err, meigara) => { })
  //Insert data to a collection
  myCollection.insertOne({ name: 'Web Security' }, (err, result) => { });
  myCollection.insertMany([
    { name: 'Web Design' },
    { name: 'Distributed Database' },
    { name: 'Artificial Intelligence' }
  ], (err, results) => { });
  //Update an existing document
  myCollection.updateOne({ name: 'Web Design' }, { $set: { name: 'Web Analytics' } }, (err, result) => { console.log(result); });
  //Delete a document
  myCollection.deleteOne({ name: 'Distributed Database' }, (err, result) => { console.log(result); });
}


module.exports = router;
