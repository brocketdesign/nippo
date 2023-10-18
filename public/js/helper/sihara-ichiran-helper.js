
var siharaCostsOfPeriod = function (db, params, callback) {

  // get 原価
  let match = { genba_id: params.genbaID, type: '支出' }
  if (params.company_el) {
    match.取引先 = params.company_el
  }
  let yearFrom = params.yearBase
  let yearTo = yearFrom + 1

  db.collection('inoutcomeDaityou').aggregate([

    { $match: match },
    // {
    //   $project: { month: { $month: new Date('$日付') } }
    // },
    {
      $group: {
        _id: {
          year: { $year: {
            $dateFromString: {
              dateString: '$日付',
              timezone: 'Asia/Tokyo'
            }
          } },
          month: { $month: {
            $dateFromString: {
              dateString: '$日付',
              timezone: 'Asia/Tokyo'
            }
          } }
        },
        cost: { $sum: {
          $add: [ '$査定金額',
                  { $divide: [ { $multiply: [ '$査定金額', '$税率' ] }, 100 ] }
          ] }, // 原価 = SUM(支出)
        }
      }
    },
    { $match: { $or: [
      {'_id.year': yearFrom, '_id.month': { $gte: 9 } },
      {'_id.year': yearTo, '_id.month': { $lte: 8 } }
      ] }
    },
    {
      $sort: { _id: 1 }
    }

  ])
  .toArray((err, results) => {

    if (callback) {
      callback(err, results)
    }
  })
}

var siharaSalesOfPeriod = function (db, params, callback) {

  let match = { genba_id: params.genbaID, type: '収入' }
  if (params.company_el) {
    match.取引先 = params.company_el
  }
  let yearFrom = params.yearBase
  let yearTo = yearFrom + 1
  
  // get 売上
  db.collection('inoutcomeDaityou').aggregate([

    { $match: match },
    // {
    //   $project: { month: { $month: new Date('$日付') } }
    // },
    {
      $group: {
        _id: {
          year: { $year: {
            $dateFromString: {
              dateString: '$日付',
              timezone: 'Asia/Tokyo'
            }
          } },
          month: { $month: {
            $dateFromString: {
              dateString: '$日付',
              timezone: 'Asia/Tokyo'
            }
          } }
        },
        sale: { $sum: {
          $add: [ '$査定金額',
                  { $divide: [ { $multiply: [ '$査定金額', '$税率' ] }, 100 ] }
          ] }, // 売上 = SUM(収入)
        }
      }
    },
    { $match: { $or: [
      {'_id.year': yearFrom, '_id.month': { $gte: 9 } },
      {'_id.year': yearTo, '_id.month': { $lte: 8 } }
      ] }
    },
    {
      $sort: { _id: 1 }
    }

  ])
  .toArray((err, results) => {

    if (callback) {
      callback(err, results)
    }
  })
}

var siharaYosanSumOfPeriod = function (db, params, callback) {

  // params.company_id = '62047eb103b858e5da580a99'

  let match = {
    genba: params.genbaID,
    'company._id': params.company_id,
    date: { $gte: params.dateFrom, $lte: params.dateTo }
  }

  // get 実行予算
  db.collection('jitkouyosan').aggregate([

    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: '$小計'}
      }
    }
  ])
  .next((err, result) => {
    if (callback)
      callback(err, result)
  })
}

var siharaCompanies = function (db, params, callback) {
  db.collection('inoutcomeDaityou').aggregate([
    { $match: { genba_id: params.genbaID, type: '支出' } },
    {
      $group: {
        _id: '$取引先',
        data: { $first: { _id: '$torihiki_id'}}
      }
    }
  ]).toArray((err, results) => {
    if (callback) {
      callback(err, results)
    }
  })
}


module.exports = {siharaCostsOfPeriod, siharaSalesOfPeriod, siharaYosanSumOfPeriod, siharaCompanies}