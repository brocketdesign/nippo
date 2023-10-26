const ObjectId = require('mongodb').ObjectId

// get 契約金額
var yosanKeiyakukingaku = async function (db, params) {
  let result = await db.collection('genba').findOne({ '_id': new ObjectId(params.genbaID) })
  if (result) {
    return parseInt(result.契約金額)
  }
  return 0
}

// get 実行予算 table
var yosanYosanTable = function (db, params, callback) {

  let match = { genba: new ObjectId(params.genbaID) }
  db.collection('jitkouyosan').aggregate([
    { $match: match },
    { $sort: { 'company.業社名kana': 1, date: -1 } },
    {
      $group: {
        _id: '$company._id',
        data: { $push: {
            _id: '$_id',
            genba: '$genba',
            company: {
              el: '$company.el',
              業社名kana: '$company.業社名kana'
            },
            工種: '$工種',
            摘要: '$摘要',
            小計: '$小計',
            date: '$date'
          }
        }
      }
    },
  ])
  .toArray((err, results) => {
    if (callback) {
      callback(err, results)
    }
  })
}

// get 実行予算
var yosanYosan = function (db, params, callback) {

  let match = { genba: new ObjectId(params.genbaID) }
  db.collection('jitkouyosan').aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        実行予算: { $sum: '$小計' }
      }
    }
  ])
  .next((err, result) => {
    if (!err) {
      if (result) {
        if (callback) {
          callback(null, result.実行予算)
        }
      } else {
        if (callback) {
          callback(null, 0)
        }
      }
      return
    }
    if (callback) {
      callback(err)
    }
  })
}

// 売上
var yosanUriage = function (db, params, callback) {

  let match = { genba_id: new ObjectId(params.genbaID), type: '収入' }
  db.collection('inoutcomeDaityou').aggregate([

    { $match: match },
    {
      $group: {
        _id: null,
        sale: { $sum: {
          $add: [ '$査定金額',
                  { $divide: [ { $multiply: [ '$査定金額', '$税率' ] }, 100 ] }
          ] }, // 売上 = SUM(収入)
        }
      }
    },

  ])
  .next((err, result) => {
    if (!err) {
      if (result) {
        if (callback) {
          callback(null, parseInt(result.sale))
        }
      } else {
        if (callback) {
          callback(null, 0)
        }
      }
      return
    }
    callback(err)
  })
}

// 原価
var yosanGenka = function (db, params, callback) {

  let match = { genba_id: new ObjectId(params.genbaID), type: '支出' }
  db.collection('inoutcomeDaityou').aggregate([

    { $match: match },
    {
      $group: {
        _id: null,
        cost: { $sum: {
          $add: [ '$査定金額',
                  { $divide: [ { $multiply: [ '$査定金額', '$税率' ] }, 100 ] }
          ] }, // 原価 = SUM(支出)
        }
      }
    }
  
  ])
  .next((err, result) => {
    if (!err) {
      if (result) {
        if (callback) {
          callback(null, parseInt(result.cost))
        }
      } else {
        if (callback) {
          callback(null, 0)
        }
      }
      return
    }
    callback(err)
  })
}

module.exports = { yosanKeiyakukingaku, yosanYosanTable, yosanYosan, yosanUriage, yosanGenka }