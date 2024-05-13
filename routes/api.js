var express = require('express');
const app = express();
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
const {siharaCostsOfPeriod, siharaSalesOfPeriod, siharaBudgetSumOfPeriod, siharaCompanies} = require('../public/js/helper/sihara-ichiran-helper')
const {rouhiOfPeriod} = require('../public/js/helper/sihara-ichiran-rouhi-helper')
const { yosanKeiyakukingaku, yosanYosanTable, yosanYosan, yosanUriage, yosanGenka } = require('../public/js/helper/yosan-helper')
const readline = require("readline");
const { resolve } = require('path');

require('dotenv').config({ path: './.env' });
router.use(cookieParser('horiken'));

// GET CALENDAR DATA ON ADMIN DASHBOARD PAGE
const getGenbaList = async (db, userGenba) => {
  const genbaCollection = db.collection('genba');
  return await genbaCollection.find({'_id': { $in: userGenba } }).sort({'updatedAt': 1}).limit(10).toArray();
};

const getNippoList = async (db, genbaId) => {
  const nippoCollection = db.collection(genbaId + '_genbanippo');
  return await nippoCollection.find().sort({'today': -1}).toArray();
};

const filterNippoByDate = (nippoList, start_period, end_period) => {
  
  const isValidDate = (dateStr) => !isNaN(new Date(dateStr).getTime());
  
  if (isValidDate(start_period) && isValidDate(end_period)) {
    const startDate = new Date(start_period);
    const endDate = new Date(end_period);

    return nippoList.filter(element => {
      const elementDate = new Date(element.today);
      return elementDate >= startDate && elementDate <= endDate;
    });
  }
  return nippoList;
};


router.get('/genbaStatistic', urlencodedParser, async (req, res) => {
  try {
      const db = req.app.locals.db;
      const dbData = await initData(req);
      
      if (!dbData.isLogin) {
          return res.sendStatus(403);
      }

      const { today, userID, start, end } = req.query;
      const userData = await db.collection('users').findOne({'_id': new ObjectId(userID)});
      const userGenba = getUserGenbaIds(userData.genba);
      const genbaList10 = await getGenbaList(db, userGenba);
      
      if (!genbaList10.length) {
          return res.send([]);
      }

      const result = await Promise.all(genbaList10.map(async genba => {
          const nippoList = await getNippoList(db, genba._id);
          const filteredNippo = filterNippoByDate(nippoList, start, end);

          return {
              label: genba.工事名,
              data: filteredNippo
          };
      }));

      res.send(result);

  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


function getUserGenbaIds(userData) {
  if (!Array.isArray(userData)) {
      console.log("userData is not defined, is not an array, or is empty.");
      return [];
  }

  // Extract all ids
  let ids = userData.map(user => user.id);

  // Filter out empty or whitespace-only strings
  let validStrings = ids.filter(id => id && id.trim() !== '');

  return validStrings.map(id => {
      // Validate if id can be converted to ObjectId
      if (id.length !== 24 || !(/^[0-9a-fA-F]{24}$/).test(id)) {
          console.error(`Invalid id found: "${id}"`);
          return null; // placeholder for invalid ids
      }
      return new ObjectId(id);
  }).filter(id => id !== null);  // remove null placeholders
}



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
            const elementisBetweenPeriod = isBetweenPeriod(start_period,end_period,element)
            if(elementisBetweenPeriod){
              data.push(elementisBetweenPeriod)
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
            
            const elementisBetweenPeriod = isBetweenPeriod(start_period,end_period,element)
            if(elementisBetweenPeriod){
              data.push(elementisBetweenPeriod)
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
        return new Date(b.date) - new Date(a.date);
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
                reject()
              }
            }
          });
        } else {
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
const fetchGenbaData = async (db, genbaID) => {
  const nippoCollection = db.collection(genbaID + '_genbanippo');
  return nippoCollection.find().sort({ 'today': -1 }).toArray();
};
const isDateWithinRange = (date, startPeriod, endPeriod) => {
  const [startMonth, startDate, startYear] = startPeriod.split('/').map(Number);
  const [endMonth, endDate, endYear] = endPeriod.split('/').map(Number);

  const startDateObj = new Date(startYear, startMonth - 1, startDate);  // Months are 0-indexed in JavaScript
  const endDateObj = new Date(endYear, endMonth - 1, endDate);
  const dateObj = new Date(date);

  return dateObj >= startDateObj && dateObj <= endDateObj;
};


router.get('/genbaichiranDateRange', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db;
  const dbData = await initData(req);

  if (!dbData.isLogin) {
      return res.redirect('../');
  }

  const { genbaID, today, start: start_period, end: end_period } = req.query;

  try {
      const results = await fetchGenbaData(db, genbaID);

      if (results.length === 0) {
          console.log({
              event: 'genbaichiran',
              res: 'Nothing at all'
          });
          return res.send(false);
      }

      const data = results.filter(element => element.日付 && isDateWithinRange(element.日付, start_period, end_period));

      if (data.length === 0) {
          console.log({
              event: 'genbaichiran',
              res: 'Nothing for today'
          });
          return res.send(false);
      }

      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.send(data);

  } catch (err) {
      console.error('Error fetching data:', err);
      res.send(false);
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


    value.save_date =  dataTimeJapan();    

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
      value.save_date =  dataTimeJapan();    
      value.date = date
      value.today = today
      value.todayJP = todayJP
      let totalLine = parseInt(value.totalLine)
      if (totalLine > 0) {
        for (let i = 1; i <= totalLine; i++) {
          //Adding company ID
          try {
            if (value['業社名-' + i] != undefined) {
              let company = await db.collection('company').findOne({ el: value['業社名-' + i] })
              let companyID = company._id
              value['業社ID-' + i] = companyID
              //addGenbaIdToCompanyGenbaList(db,companyID,value.genbaID)
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
function dataTimeJapan(){
  const options = {
    //year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }
  // Get the current date and time
  const currentDate = new Date();

  // Format the date to Japanese locale
  const date = currentDate.toLocaleDateString('ja-JP');

  // Format the date to Japanese locale
  const dateJP = currentDate.toLocaleDateString('ja-JP',options);

  // Format the time to Japanese locale
  const time = currentDate.toLocaleTimeString('ja-JP');

  return {date,dateJP,time}
}

async function addGenbaIdToCompanyGenbaList(db, companyID, genbaID) {
  // Log the input IDs
  //console.log("Adding genbaID to company's genbaList", { companyID, genbaID });

  // Convert string IDs to ObjectIDs, if they are strings
  if (typeof companyID === 'string') {
    companyID = new ObjectId(companyID);
  }

  if (typeof genbaID === 'string') {
    genbaID = new ObjectId(genbaID);
  }

  try {
    
    // Update the company document
    const updateResult = await db.collection('company').updateOne(
      { _id: companyID },
      { $addToSet: { genbaList: genbaID } }
    );

    // Check if the update was successful
    if (updateResult.modifiedCount === 1) {
      //console.log(`Successfully added genbaID ${genbaID} to company ${companyID}`);
    } else {
      //console.log(`Could not add genbaID ${genbaID} to company ${companyID}`);
    }
  } catch (error) {
    //console.error(`An error occurred: ${error}`);
  }
}

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


//////////////////////////////////////////////////////////////////////
// new[monkey]
//////////////////////////////////////////////////////////////////////
// Get user info(lname, fname, email)
router.post('/user/simple-info', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    var ids = req.body.userIDs
    if (Array.isArray(ids)) {

      var nIds = ids.length || 0
      if (nIds == 0) {
        res.sendStatus(300)
        return
      }

      for (var i = 0; i < nIds; i++) {
        ids[i] = new ObjectId(ids[i])
      }
  
      db.collection('users').aggregate([
        { $match: { _id: {$in: ids} } },
        { $project: { _id:0, lname:1, fname:1 } }
      ]).toArray((err, result) => {
        res.send(result)
      })

    } else {
      db.collection('users').aggregate([
        { $match: { _id: new ObjectId(ids) } },
        { $project: { _id:0, lname:1, fname:1 } }
      ]).next((err, result) => {
        res.send(result)
      })
    }
  } else {
    res.sendStatus(403)
  }
});

// Get genba infomation
router.post('/genba-detail', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let genba = await db.collection('genba').findOne({ '_id': new ObjectId(req.body.genbaID) })
    res.send(genba)
    // console.log(req.body.genbaID);
  } else {
    res.sendStatus(403)
  }
});

// Save genba status
router.post('/update/genba-status', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let genbaID = new ObjectId(req.body.genbaID)
    let genbaStatus = req.body.status || '進行中'
    
    db.collection('genba').updateOne({ '_id': genbaID }, { $set: {'完了状況':genbaStatus} }, 
    (err, result) => {
      if (err)
        res.send({error:err})
      else
        res.sendStatus(200)
    })
    
  } else {
    res.sendStatus(403);
  }
});
// Get filtered daityou
router.post('/daityou', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    var body = req.body

    var userID = body.userID
    var status = body.status
    var today = body.today
    var includeTax = body.includeTax
    var keyword = body.keyword
    var period_min = body.period_min
    var period_max = body.period_max
    var depositMin = body.depositMin
    var depositMax = body.depositMax

    // res.send(userID)
    // return

    var userCriteria = null
    if (userID) {
      // userID = "61121694a5605df54de93e5a"
      userCriteria = { $or: [{担当者: userID}, {担当者: {$elemMatch: {$eq:userID}} }] }
    }

    var depositCriteria = null
    if (depositMin) {
      if (depositMax) {
        depositCriteria = {契約金額: {$gte:parseInt(depositMin), $lte:parseInt(depositMax)}}
      } else {
        depositCriteria = {契約金額: {$gte:parseInt(depositMin)}}
      }
    } else {
      if (depositMax) {
        depositCriteria = {契約金額: {$lte:parseInt(depositMax)}}
      }
    }

    var periodCriteria = null
    if (period_min || period_max) {
      if (!period_min) {
        periodCriteria = {'工期(至)': {$gte:period_max}}
      } else if (period_max) {
        periodCriteria = { $and: [ {'工期(至)': {$gte:period_min}}, {'工期(至)': {$lte:period_max}} ] }
      } else { // error
      }
    }

    // res.send(periodCriteria)
    // return

    var statusCriteria = null
    // if (status == 'inprogress') { // in progress => from < today < to
    //   statusCriteria = { $and: [ {'工期(自)': {$lte:today}}, {'工期(至)': {$gte:today}} ] }
    // } else if (status == 'finished') { // finished | not started => to < today
    //   // statusCriteria = { $or: [ {'工期(至)': {$lte:today}}, {'工期(自)': {}} ] }
    //   statusCriteria = {'工期(至)': {$lte:today}}
    // } else { // all
    // }
    // res.send(status)
    if (status == 'inprogress') { // in progress => from < today < to
      statusCriteria = { '完了状況': { $not: /完了/} }
    } else if (status == 'finished') { // finished | not started => to < today
      statusCriteria = { '完了状況': '完了' }
    } else { // all
    }

    // res.send(statusCriteria)
    // return

    var keywordCriteria = null
    if (keyword) {
      keywordCriteria = {
        $or: [ {工事名: new RegExp(keyword, 'i')}, {工事名kana: new RegExp(keyword, 'i')} ]
        // 工事名: new RegExp(keyword, 'i'),
      }
    }

    var match = []
    if (userCriteria)
      match.push(userCriteria)
    if (depositCriteria)
      match.push(depositCriteria)
    if (periodCriteria)
      match.push(periodCriteria)
    if (statusCriteria)
      match.push(statusCriteria)
    if (keywordCriteria)
      match.push(keywordCriteria)

    var project = { $project: { 工事名:1, 工事名kana:1, 契約金額:1, '工期(自)':1, '工期(至)':1, 担当者:1, 完了状況:1 } }
    
    var sort = { $sort: {'工期(自)': -1} }

    var aggregation
    if (match.length > 0) {
      match = { $match: { $and: match } }
      aggregation = [match, project, sort]
    } else {
      aggregation = [project, sort]
    }

    // res.send(aggregation)
    // return

    db.collection('genba').aggregate(aggregation).toArray((err, results) => {
      if (err || !results || results.length == 0)
        res.send([])
      else {
        // res.send(results)
        processGetUserInfo(err, results)
      }
    })

    function processGetUserInfo(err, results) {
      if (err) {
        sendStatus(300)
        return
      }

      let nResult = results.length
      let count = 0
      let usersCache = {}
      for (let i = 0; i < nResult; i++) {
        let item = results[i]
        var responsibles = item['担当者']
        if (responsibles) {

          let match
          let project = { $project: { _id:0, lname:1, fname:1 } }
          
          if (Array.isArray(responsibles)) {
            var nIds = responsibles.length || 0
            if (nIds == 0) {
              res.sendStatus(300)
              return
            }
            for (var j = 0; j < nIds; j++) {
              responsibles[j] = new ObjectId(responsibles[j])
            }
            match = { $match: { _id: {$in: responsibles} } }
          } else {
            responsibles = new ObjectId(responsibles)
            match = { $match: { _id: responsibles } }
          }

          db.collection('users').aggregate([
            match,
            project
          ]).toArray((err, result) => {
            if (result && result.length > 0) {
              var userNames = []
              for (var userName of result) {
                userNames.push(userName.lname)
              }
              if (userNames.length == 1) {
                item.userName = userNames[0]
              } else {
                item.userNames = userNames
              }
            }
            count ++
            if (count >= nResult) {
              processYosan(results)
            }
          })
        }
      }
    }

    function processYosan(results) {
      let nResult = results.length
      let count = 0
      for (let i = 0; i < nResult; i++) {
        let item = results[i]
        var params = { genbaID: item._id }
        yosanYosan(db, params, function (err, budget) {
          item.budget = budget
          count ++
          if (count >= nResult) {
            // res.send(results)
            processSales(results)
          }
        })
      }
    }

    function processSales(results) {
      let nResult = results.length
      let count = 0
      for (let i = 0; i < nResult; i++) {
        let item = results[i]
        var params = { genbaID: item._id, type: '収入', includeTax: includeTax }
        yosanUriage(db, params, function (err, sale) {
          item.sale = sale
          count ++
          if (count >= nResult) {
            // res.send(results)
            processCosts(results)
          }
        })
      }
    }

    function processCosts(results) {
      let nResult = results.length
      let count = 0
      for (let i = 0; i < nResult; i++) {
        let item = results[i]
        var params = { genbaID: item._id, type: '支出', includeTax: includeTax }
        yosanGenka(db, params, function (err, cost) {
          item.cost = cost
          item.profit = item.sale - cost
          if (item.sale > 0)
            item.profitRate = parseFloat((item.sale / cost * 100).toFixed(2))
          // item.status = getRandomIntInclusive(0, 1) // TODO
          count ++
          if (count >= nResult) {
            res.send(results)
          }
        })
      }
    }

  } else {
    res.sendStatus(403)
  }

  function sortit(arr, sel) {
    if (arr[0].el == undefined) { sel = '工事名kana' }
    arr.sort(function (a, b) {
        if (a[sel] && b[sel]) {
            a = katakanaToHiragana(a[sel].toString());
            b = katakanaToHiragana(b[sel].toString());
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
        } else {
            return -1;
        }
        return 0;
    });
    return arr
  }

  function katakanaToHiragana(src) {
      return src.replace(/[\u30a1-\u30f6]/g, function (match) {
          var chr = match.charCodeAt(0) - 0x60;
          return String.fromCharCode(chr);
      });
  }

  // TODO - debug
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  }
});

// Delete inoutcome
router.post('/delete/inoutcome', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    var ids = req.body.ids
    if (Array.isArray(ids)) {
      var nIds = ids.length || 0
      if (nIds == 0) {
        res.sendStatus(300)
        return
      }
      for (var i = 0; i < nIds; i++) {
        ids[i] = new ObjectId(ids[i])
      }
      
      await new Promise((resolve, reject) => {
        db.collection('inoutcomeDaityou').deleteMany({ _id: {$in: ids} }, (err, result) => {
          resolve()
        });
      })
    }
    res.sendStatus(200)
    
  } else {
    res.sendStatus(403);
  }
});

// Save inoutcome
router.post('/update/inoutcome', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    // let kouza = req.body.口座
    let torihikiID = new ObjectId(req.body.torihiki_id)
    let torihiki = req.body.取引先
    let date = req.body.日付
    let items_ = req.body.data
    let items = JSON.parse(items_)

    date = date

    let files = req.files
    let fileName = null
    if (files && files.length > 0) {
      let file = files[0]
      let path = file.path
      fileName = file.originalname
      fs.rename(path, './uploads/' + fileName, function (err) {
        if (err) throw err;
      })
    }
    
    items.forEach(item => {
      item.genba_id = new ObjectId(item.genba_id)
      // item.口座 = kouza
      item.torihiki_id = torihikiID
      item.取引先 = torihiki
      item.日付 = date
      item.査定金額 = parseInt(item.査定金額)
      if (item.消費税)
        item.消費税 = parseInt(item.消費税)
      else
        item.税率 = parseInt(item.税率)

      if (fileName != null)
        item.file = fileName


      db.collection('inoutcomeDaityou').insert(item)
    })

    res.sendStatus(200)
    
  } else {
    res.sendStatus(403);
  }
});

router.post('/update/inoutcome/element', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    // let items = req.body.data
    console.log(req.body);
    let _id = new ObjectId(req.body._id)
    var _set = {}


    let files = req.files
    let fileName = null
    if (files && files.length > 0) {
      let file = files[0]
      let path = file.path
      fileName = file.originalname
      await new Promise((resolve, reject) => {
        fs.rename(path, './uploads/' + fileName, function (err) {
          if (err) reject()
          else resolve()
        })
      })
      _set['file'] = fileName

    } else {
      
      // let items = req.body.data
      if (req.body.取引先 !== undefined)
        _set['取引先'] = req.body.取引先
      if (req.body.torihiki_id !== undefined)
        _set['torihiki_id'] = new ObjectId(req.body.torihiki_id)
      if (req.body.勘定科目 !== undefined)
        _set['勘定科目'] = req.body.勘定科目
      if (req.body.現場名 !== undefined)
        _set['現場名'] = req.body.現場名
      if (req.body.genba_id !== undefined)
        _set['genba_id'] = new ObjectId(req.body.genba_id)
      if (req.body.備考 !== undefined)
        _set['備考'] = req.body.備考
      if (req.body.査定金額 !== undefined)
        _set['査定金額'] = parseInt(req.body.査定金額)
      if (req.body.消費税 !== undefined)
        _set['消費税'] = parseInt(req.body.消費税)
      if (req.body.日付 !== undefined)
        _set['日付'] = req.body.日付
    }

    if (Object.keys(_set).length > 0) {

      await new Promise((resolve, reject) => {
        db.collection('inoutcomeDaityou').updateOne({ '_id': _id }, { $set: _set }, (err, result) => {
          resolve()
        });
      })
      res.sendStatus(200)

    } else {
      res.sendStatus(300)
    }

  } else {
    res.sendStatus(403)
  }
});

// import csv
router.post('/import-csv/inoutcome', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    if (!req.files) {
      res.redirect('/dashboard/inoutcome')
    } else {
      // console.log("file", req.files)
      let files = req.files
      let n = files.length
      for (let i = 0; i < n; i++) {
        let file = files[i]
        var rlFirst = readline.createInterface({
          input: fs.createReadStream(file.path),
          output: null,
          terminal: false
        })
        
        let genbaName
        let genbaID = 0
        let genbaHattyu = null
        var lines = []

        var nLine = 0
        rlFirst.on("line", function(line) {
          nLine ++
          
          if (nLine == 8) {
            var cols = line.split(',')
            // genba name
            if (cols.length > 0 && cols[1].length > 0) {
              genbaName = (cols[1][0] == '"') ? cols[1].substring(1, cols[1].length - 1) : cols[1];
              // genba ID
              genbaID = cols[2]
            }
            else {
              genbaName = ''
            }
            // genba hattyu
            genbaHattyu
          } else if (nLine > 8) {
            lines.push(line)
          }
        })

        await new Promise((resolve, reject) => {
          rlFirst.on("close", function () {
            resolve()
          })
        })

        // console.log("file: " + file.path);
        if (genbaName == '') continue;
        var result
        result = await db.collection('genba').findOne({ '工事名': genbaName })
        if (result) {
          genbaID = new ObjectId(result._id)
          genbaHattyu = result.発注者
          console.log("genbaID: " + genbaID);
        } else {
          console.log("No genba")
          continue
        }

        // if (genbaID == 0) {
        //   var newGenba = {'工事名': genbaName}
        //   result = await db.collection('genba').insertOne(newGenba)
        //   if (result) {
        //     genbaID = result.insertedId
        //   }
        // }

        nLine = lines.length
        for (var j = 0; j < nLine; j++) {
          let error = false
          var line = lines[j]

          let cols = line.split(',')
          let date = cols[0]
          if (!date.startsWith('令和')) {
            continue
          }

          let year = date.substring(2, 4)
          year = parseInt(year) + 2018
          let month = date.substring(5, 7)
          let day = date.substring(8, 10)

          // date
          date = year + "/" + month + "/" + day
          // console.log("date: " + date)

          // torihiki
          let torihiki
          let bikou = (cols.length > 0 && cols[11].length > 0 && cols[11][0] == '"') ? cols[11].substring(1, cols[11].length - 1) : cols[11]; // L
          var re = /^[0-9０１２３４５６７８９]/
          if (re.test(bikou)) {
            re = /[0-9０１２３４５６７８９]+[／/][0-9０１２３４５６７８９]+[ 　]/g
            torihiki = bikou.replace(re, '')
            if (!torihiki) {
              errror = true
              console.log("torihiki error")
            } else {
              torihiki = torihiki.split(/[　 ]/)
              torihiki = torihiki[0]
            }
          } else {
            torihiki = bikou.split(/[　 ]/)
            torihiki = torihiki[0]
          }

          // TODO <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          if (false) {
            torihiki = bikou
          }
          // TODO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

          if (error) {
            console.log("error")
            continue
          }
          
          if ('鬼塚道矢他' == torihiki) { // 労務費
            // ignore
          } else {

            // genbaName, bikou, date, torihiki
            let item = {
              genba_id: genbaID,
              現場名: genbaName,
              備考: '',
              日付: date
            }
            // res.send(JSON.stringify({item:item}))
            // return

            // let colI = cols[8] // I
            // if ('未成工事受入金' == colI) {
              // let income = cols[18] // 売上
            let colS = cols[18] // S
            let income = parseInt(colS)
            if (income > 0) {
              item.type = '収入'
              item.勘定科目 = '売上'
              item.査定金額 = parseInt((income / 1.1).toFixed(0))
              item.税率 = 10
              item.取引先 = genbaHattyu
              item.torihiki_id = genbaID
              await db.collection('inoutcomeDaityou').insertOne(item)
            }
// continue
            let outZaryou = cols[13] // 材料費 // N
            let outGaityuu = cols[15] // 外注費 // P
            let outGei = cols[16] // 経費 // Q
            outZaryou = parseInt(outZaryou)
            outGaityuu = parseInt(outGaityuu)
            outGei = parseInt(outGei)
            if (outZaryou > 0) {
              item.type = '支出'
              item.勘定科目 = '材料費'
              item.査定金額 = outZaryou
              item.税率 = 0
              result = await db.collection('company').findOne({ 'el': torihiki })
              if (result) {
                item.取引先 = torihiki
                item.torihiki_id = result._id
                // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: result._id}}, {multi: true})
              } else {
                var newCompany = {'el': torihiki}
                result = await db.collection('company').insertOne(newCompany)
                if (result) {
                  item.取引先 = torihiki
                  item.torihiki_id = result.insertedId
                  // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: torihiki_id}}, {multi: true})
                } else {
                  console.log("error on inserting new company")
                  continue
                }
              }
              await db.collection('inoutcomeDaityou').insertOne(item)
            }
            // continue

            if (outGaityuu > 0) {
              item.type = '支出'
              item.勘定科目 = '外注費'
              item.査定金額 = outGaityuu
              item.税率 = 0
              result = await db.collection('company').findOne({ 'el': torihiki })
              if (result) {
                item.取引先 = torihiki
                item.torihiki_id = result._id
                // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: result._id}}, {multi: true})
              } else {
                var newCompany = {'el': torihiki}
                result = await db.collection('company').insertOne(newCompany)
                if (result) {
                  item.取引先 = torihiki
                  item.torihiki_id = result.insertedId
                  // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: torihiki_id}}, {multi: true})
                } else {
                  console.log("error on inserting new company")
                  continue
                }
              }
              await db.collection('inoutcomeDaityou').insertOne(item)
            }

            if (outGei > 0) {
              item.type = '支出'
              item.勘定科目 = '経費'
              item.査定金額 = outGei
              item.税率 = 0
              result = await db.collection('company').findOne({ 'el': torihiki })
              if (result) {
                item.取引先 = torihiki
                item.torihiki_id = result._id
                // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: result._id}}, {multi: true})
              } else {
                var newCompany = {'el': torihiki}
                result = await db.collection('company').insertOne(newCompany)
                if (result) {
                  item.取引先 = torihiki
                  item.torihiki_id = result.insertedId
                  // db.collection('inoutcomeDaityou').update({取引先: torihiki}, {$set: {torihiki_id: torihiki_id}}, {multi: true})
                } else {
                  console.log("error on inserting new company")
                  continue
                }
              }
              db.collection('inoutcomeDaityou').insertOne(item)
            }
          }
        }
        console.log("file: " + file.path + " done!")
      
      }

      for (var j = 0; j < n; j++) {
        let file = files[j]
        fs.unlink(file.path, function (err) {
          if (err)
            console.log("cannot delete file: " + err)
          else
            console.log("deleted: " + file.path)
        })
      }
      console.log("all done!")

      res.redirect('/dashboard/inoutcome')
    }
  }
});

// Get filtered inoutcomeDaityou
router.post('/inoutcome', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    let body = req.body

    let inoutType = body.inoutType
    let kanjoukamoku = body.勘定科目
    let dateFrom = body.dateFrom
    let dateTo = body.dateTo
    let kouza = body.口座
    let torihiki = body.取引先
    let genba = body.現場名
    let bikou = body.備考
    let priceFrom = body.priceFrom
    let priceTo = body.priceTo
    let offset = body.offset
    let limit = body.limit

    // res.send(body)
    // return

    let criteria = {}

    if (inoutType) {
      criteria.type = inoutType
    }

    if (kanjoukamoku) {
      criteria.勘定科目 = kanjoukamoku
    }

    // if (dateFrom) {
    //   if (dateTo) {
    //     criteria.日付 = {$gte:new Date(dateFrom), $lte:new Date(dateTo)}
    //   } else {
    //     criteria.日付 = {$gte:new Date(dateFrom)}
    //   }
    // } else {
    //   if (dateTo) {
    //     criteria.日付 = {$lte:new Date(dateTo)}
    //   }
    // }
    if (dateFrom) {
      if (dateTo) {
        criteria.日付 = {$gte:dateFrom, $lte:dateTo}
      } else {
        criteria.日付 = {$gte:dateFrom}
      }
    } else {
      if (dateTo) {
        criteria.日付 = {$lte:dateTo}
      }
    }

    if (kouza) {
      criteria.口座 = kouza
    }

    if (torihiki) {
      criteria.取引先 = torihiki
    }

    if (genba) {
      criteria.現場名 = genba
    }

    if (bikou) {
      criteria.備考 = bikou
    }

    //////////////////////////////////////////////////////////////
    // TODO - rate * price
    //////////////////////////////////////////////////////////////
    if (priceFrom) {
      if (priceTo) {
        criteria.査定金額 = {$gte:priceFrom, $lte:priceTo}
      } else {
        criteria.査定金額 = {$gte:priceFrom}
      }
    } else {
      if (priceTo) {
        criteria.査定金額 = {$lte:priceTo}
      }
    }

    // res.send(criteria)
    // return

    if (!limit) limit = 0
    else limit = parseInt(limit)

    if (!offset) offset = 0
    else offset = parseInt(offset)

    if (Object.keys(criteria).length == 0) {
      // res.send('non condition')
      db.collection('inoutcomeDaityou').find().sort({日付: -1}).skip(offset).limit(limit).toArray((err, results) => {
        res.send(results)
      })
    } else {
      // res.send(JSON.stringify(criteria))
      db.collection('inoutcomeDaityou').find(criteria).sort({日付: -1}).skip(offset).limit(limit).toArray((err, results) => {
        // res.send(JSON.stringify(criteria))
        res.send(results)
      })
    }

  } else {
    res.sendStatus(403)
  }
});

// Save jitkouyosan
router.post('/update/yosan', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    // console.log(req.body)
    let items = req.body.data
    items.forEach(item => {
      item.company._id = new ObjectId(item.company._id)
      sanitizedItem = {
        genba: new ObjectId(item.genba),
        company: item.company,
        date: item.date,
        小計: parseInt(item.小計),
        工種: item.工種
      }
      if (item.摘要) {
        sanitizedItem.摘要 = item.摘要
      }

      db.collection('jitkouyosan').insert(sanitizedItem)
    })
    // res.send(JSON.stringify(items))
    res.sendStatus(200)

  } else {
    res.sendStatus(403)
  }
});

// delete jitkouyosan
router.post('/delete/yosan', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    var _id = new ObjectId(req.body._id)
    await new Promise((resolve, reject) => {
      db.collection('jitkouyosan').deleteOne({ '_id': _id }, (err, result) => {
        resolve()
      });
    })
    res.send({result:'ok'})

  } else {
    res.sendStatus(403)
  }
});

router.post('/update/yosan/element', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    // console.log(req.body)
    // let items = req.body.data
    let _id = new ObjectId(req.body._id)
    var _set = {}
    if (req.body.工種)
        _set['工種'] = req.body.工種
    if (req.body.摘要)
        _set['摘要'] = req.body.摘要
    if (req.body.小計)
        _set['小計'] = parseInt(req.body.小計)
    if (req.body.date)
        _set['date'] = req.body.date

    if (Object.keys(_set).length > 0) {

      await new Promise((resolve, reject) => {
        db.collection('jitkouyosan').updateOne({ '_id': _id }, { $set: _set }, (err, result) => {
          resolve()
        });
      })
      res.sendStatus(200)

    } else {
      res.sendStatus(300)
    }

  } else {
    res.sendStatus(403)
  }
});

// Get 実行予算 full table: daityou-yosan bottom table
router.post('/yosan', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    let params = { genbaID: req.body.genbaID }
    yosanYosanTable(db, params, function (err, results) {
      if (err) {
        res.sendStatus(300)
        return
      }

      res.send(results)
    })
    
  } else {
    res.sendStatus(403)
  }
});

// Get 実行予算 summary table: daityou-yosan top table
router.post('/yosan-summary', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let genbaID = req.body.genbaID
    let includeTax = req.body.includeTax
    let resultAll = {}
    let isEstimate = req.body.estimate

    let params = { genbaID: genbaID, includeTax: includeTax }

    // get 契約金額
    let deposit = await yosanKeiyakukingaku(db, params)
    resultAll.契約金額 = deposit

    // get 実行予算
    yosanYosan(db, params, function (err, budget) {
      if (err) {
        res.sendStatus(300)
        return
      }
      
      resultAll.実行予算 = budget

      let cost = 0
      let sale = 0

      // get 原価
      params.type = '支出'
      yosanGenka(db, params, function (err, cost) {
        if (err) {
          res.sendStatus(300)
          return
        }

        resultAll.原価 = cost

        if (isEstimate) {

          // calculate 予想粗利, 粗利率
          let profit = deposit - budget
          resultAll.予想粗利 = profit
          resultAll.粗利率 = parseFloat((profit / deposit * 100).toFixed(2))

          res.send(resultAll)

        } else {
          
          // get 売上
          params.type = '収入'
          yosanUriage(db, params, function (err, sale) {
            if (err) {
              res.sendStatus(300)
              return
            }
  
            resultAll.売上 = sale
  
            // calculate 予想粗利, 粗利率
            resultAll.予想粗利 = sale - cost
            resultAll.粗利率 = parseFloat((sale / cost * 100).toFixed(2))
  
            res.send(resultAll)
          })
        }
      })

    })

  } else {
    res.sendStatus(403)
  }
});

router.post('/sihara-ichiran-rouhi', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    let rouhi = await new Promise((resolve, reject) => {
      db.collection('globalsetting').aggregate([{$project: {
        _id: 0, rouhi: 1 }}]).toArray((err, results) => {
          if (err || results == undefined || results.length == 0) {

            reject();
          }
          else {
            resolve(results[0]['rouhi'])
          }
        })
    })
    if (rouhi == 0) {
      rouhi = 30000;
    }

    let params = {
      genbaID: req.body.genbaID,
      genbaName: req.body.genbaName,
      yearMin: req.body.yearMin,
      monthMin: req.body.monthMin,
      yearMax: req.body.yearMax,
      monthMax: req.body.monthMax
    }

    rouhiOfPeriod(db, params, function (err, results) {
      if (err) {
        res.sendStatus(300)
        return
      }
      results.rouhi = rouhi;
      res.send(results)
    })

  }
})

// Get 支払一覧 full table: daityou-sihara-ichiran bottom table
// Get 現場まとめ cost graph: daityou-genba cost bar chart
router.post('/sihara-ichiran', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    let genbaID = req.body.genbaID
    let genbaName = req.body.genbaName
    let includeTax = req.body.includeTax
    let period = req.body.period
    let need_budgets = req.body.need_budgets
    let need_cost_sum = req.body.need_cost_sum
    let resultAll = {}
    let data = []

    let yearBase = null
    const monthFrom = 8, monthTo = 9

    if (period) {
      var now = new Date()
      if (period == 'now') { // from 9月 to next-year.8月
        yearBase = now.getFullYear()
      } else { // from prev-year.9月 to 8月
        yearBase = now.getFullYear() - 1
      }
    }

    let params = {
      genbaID: genbaID,
      genbaName: genbaName,
      includeTax: includeTax
    }
    if (yearBase) { params.yearBase = yearBase }
    if (yearBase) { resultAll.yearBase = yearBase }

    // res.send(params)
    // return

    // get distinct company list
    siharaCompanies(db, params, function (err, results) {
      if (err) {
        res.sendStatus(300)
        return
      }
      
      // res.send(results)
      // return

      let nResult = results.length
      if (nResult > 0) {

        if (need_cost_sum) { params.need_cost_sum = need_cost_sum }
        let count = 0;

        for (let i = 0; i < nResult; i++) {

          let company = results[i]
          params.company_el = company._id // company name
          
          // get 原価
          siharaCostsOfPeriod(db, params, function (err, results) {
            if (err) {
              res.sendStatus(300)
              return
            }

            if (need_cost_sum || (!need_cost_sum && results.length > 0)) {

              let result = {
                company_id: company.data._id, // company id
                company_el: company._id, // company name
                costs: results
              }

              if (need_budgets) {

                let params = {
                  genbaID: genbaID,
                  company_id: company.data._id
                  // company_el: company._id
                }

                if (yearBase) {
                  let dateFrom = yearBase + '/09/00'
                  let dateTo = (yearBase + 1) + '/08/00'
                  params.dateFrom = dateFrom
                  params.dateTo = dateTo
                }

                // get 実行予算
                siharaBudgetSumOfPeriod(db, params, function (err, budgetSum) {
                  
                  if (err) {
                    res.sendStatus(300)
                    return
                  }
  
                  result.budget = budgetSum
                  data.push(result)
  
                  count++;
                  if (count == nResult) {

                    resultAll.items = data
                    res.send(resultAll)
                  }

                })

              } else {

                data.push(result)

                count++;
                if (count == nResult) {
                  resultAll.items = data
                  res.send(resultAll)
                }
              }

            } else {

              count++;
              if (count == nResult) {
                resultAll.items = data
                res.send(resultAll)
              }
            }

          })
        }

      } else {
        res.send(resultAll)
      }

    })
      
  } else {
    res.sendStatus(403)
  }
});

// Get 支払一覧 summary table: daityou-sihara-ichiran top table
router.post('/sihara-ichiran-summary', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {

    let genbaID = req.body.genbaID
    let genbaName = req.body.genbaName
    let includeTax = req.body.includeTax
    let period = req.body.period
    let resultAll = {}

    let yearBase = null
    const monthFrom = 8, monthTo = 9

    if (period) {
      var now = new Date()
      if (period == 'now') { // from 9月 to next-year.8月
        yearBase = now.getFullYear()
      } else { // from prev-year.9月 to 8月
        yearBase = now.getFullYear() - 1
      }
    }

    let params = {
      genbaID: genbaID,
      genbaName: genbaName,
      includeTax: includeTax
    }
    if (yearBase) { params.yearBase = yearBase }
    if (yearBase) { resultAll.yearBase = yearBase }

    // res.send(params)
    // return

    // get 原価
    siharaCostsOfPeriod(db, params, function (err, results) {

      // res.send(results)
      // return

      if (err) {
        res.sendStatus(300)
        return
      }
      
      if (results.length > 0) {
        resultAll.costs = results
      }

      // get 売上
      siharaSalesOfPeriod(db, params, function (err, results) {
        if (err) {
          res.sendStatus(300)
          return
        }
        
        if (results.length > 0) {
          resultAll.sales = results
        }

        res.send(resultAll)
      })
    })
      
  } else {
    res.sendStatus(403)
  }
});

//GET kanjoukamoku
router.get('/kanjoukamoku', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let type = req.query.type
    if (type == '収入') { // in
      db.collection('kanjoukamokuIn').find().toArray((err, results) => {
        res.send(results)
      });
    } else if (type == '支出') { // out
      db.collection('kanjoukamokuOut').find().toArray((err, results) => {
        res.send(results)
      });
    } else {
      let resultIn
      let resultOut
      await new Promise((resolve, reject) => {
        db.collection('kanjoukamokuIn').find().toArray((err, results) => {
          resultIn = results
          resolve()
        });
      })
      await new Promise((resolve, reject) => {
        db.collection('kanjoukamokuOut').find().toArray((err, results) => {
          resultOut = results
          resolve()
        });
      })
      res.send({in:resultIn, out:resultOut})
    }
  } else {
    res.sendStatus(403);
  }
});

//GET hattyu
router.get('/daityou/hattyu', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    // db.collection('genba').aggregate([
      // { $match: { '発注者': /.+/ } }
    // ]).distinct('発注者').toArray((err, results) => {

    // let temp = db.collection('genba').distinct('発注者', { '発注者': /.+/ })
    // res.send(temp)

    db.collection('genba')
      .find({ '発注者': /.+/ })
    //   // .distinct('発注者', { '発注者': /.+/ })
      .toArray((err, results) => {
        res.send(results);
      });
    
  } else {
    res.sendStatus(403);
  }
});

//GET company
router.get('/daityou/company', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    db.collection('company').find({ 'el': /.+/ }).toArray((err, results) => {
      res.send(results);
    });
    
  } else {
    res.sendStatus(403);
  }
});
////////////////////////////////////////////////////
////////////// new[monkey] /////////////////////////
////////////////////////////////////////////////////


router.post('/:myAction/:elementType', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let myAction = req.params.myAction
    let elementType = req.params.elementType
    console.log({
      myAction: myAction,
      elementType: elementType,
      elementTypeID: req.query.elementTypeID,
      req: req.body,
    })

    // new[monkey]
    for (var key in req.body) {
      // if (req.body.hasOwnProperty(key)) {
      // }
      var val = req.body[key]
      var iVal = parseInt(val)
      if (iVal == val) {
        req.body[key] = iVal
      }
    }
    
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
    } else if (myAction == 'addone') {
      let myCollection = db.collection(elementType)
      await new Promise((resolve, reject) => {
        myCollection.insertOne(req.body, (err, result) => { resolve() });
      })
    } else if (myAction == 'edit') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $set: req.body }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID is not found')
      }
    } else if (myAction == 'replace') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.deleteOne({ '_id': new ObjectId(req.query.elementTypeID) }, (err, result) => { });
          myCollection.insertOne(req.body, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID is not found')
      }
    } else if (myAction == 'update') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $set: req.body }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID is not found')
      }
    } else if (myAction == 'editField') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.updateOne({ '_id': new ObjectId(req.query.elementTypeID) }, { $unset: { [req.body.field]: "" } }, { upsert: true }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID is not found')
      }
    } else if (myAction == 'delete') {
      if (req.query.elementTypeID) {
        let myCollection = db.collection(elementType)
        await new Promise((resolve, reject) => {
          myCollection.deleteOne({ '_id': new ObjectId(req.query.elementTypeID) }, (err, result) => {
            resolve()
          });
        })
      } else {
        console.log('elementTypeID is not found')
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
          if(result){
            res.send({company:result});
          }else{
            res.sendStatus(300)
          }
        })
      } else {
        db.collection(dbName).findOne({ '_id': new ObjectId(elID) }, (err, result) => {
          if (err) {
            res.sendStatus(300)
          } else {
            if (result == undefined) {
              db.collection(dbName).findOne({ '_id': elID }, (err, result) => {
                res.send(result);
              })
            } else {
              res.send(result);
            }
          }
        })       
      }
    } else if (day) { // new[monkey]
      db.collection(dbName).find({ 'today': day }).sort({ '_id': -1 }).toArray((err, results) => {
        if (err) {
          res.sendStatus(300)
        } else {
          res.send(results);
        }
      });
    } else if (!day && !elID) { // new[monkey]
      db.collection(dbName).find().sort({ '_id': 1 }).toArray((err, results) => {
        if (err) {
          res.sendStatus(300)
        } else {
          res.send(results);
        }
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
            res.send('user is not found')
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

router.get('/download/:fileName', urlencodedParser, async (req, res) => {
  const db = req.app.locals.db; let dbData = await initData(req)
  if (dbData.isLogin) {
    let fileName = req.params.fileName
    console.log(fileName)
    res.sendfile('./uploads/' + fileName)
  } else {
    res.sendStatus(403)
  }
})

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

function isBetweenPeriod(start_period,end_period,element){
  if (element.日付) {
    if ((start_period != 'false') && (end_period != 'false')) {
      const end_full_date = end_period.split('/');
      const end_month = parseInt(end_full_date[0]) - 1;
      const end_date = parseInt(end_full_date[1]);
      const end_year = parseInt(end_full_date[2]);

      let elementYear = new Date(element.日付).getFullYear();
      let startYear = new Date(start_period).getFullYear();
      let endYear = end_year; // assuming this is already a year number
      
      if ((elementYear > startYear && elementYear < endYear) || 
          (elementYear === startYear && (new Date(element.日付).getMonth() > new Date(start_period).getMonth() || (new Date(element.日付).getMonth() === new Date(start_period).getMonth() && new Date(element.日付).getDate() >= new Date(start_period).getDate()))) ||
          (elementYear === endYear && (new Date(element.日付).getMonth() < end_month || (new Date(element.日付).getMonth() === end_month && new Date(element.日付).getDate() <= end_date)))) {

            return element
      }
    }
  }
  return false
}
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
