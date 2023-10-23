const ObjectId = require('mongodb').ObjectId

// get cost list of period | cost sum of period
//  - if params.need_cost_sum => cost sum of period
//  - else => cost list of period
var siharaCostsOfPeriod = function (db, params, callback) {

  // get 原価
  var match = { genba_id: new ObjectId(params.genbaID), type: '支出' }
  if (params.company_el) {
    match.取引先 = params.company_el
  }
  match = { $match: match }

  var yearFrom, yearTo
  if (params.yearBase) {
    yearFrom = params.yearBase
    yearTo = yearFrom + 1
  }

  var group
  var groupCostField = { $sum: {
    $add: [ '$査定金額',
      { $trunc: { $divide: [ { $multiply: [ '$査定金額', { $cond: [{ $eq: ['$税率', NaN] }, 0, '$税率'] }] }, 100 ] } }
    ] }, // 原価 = SUM(支出)
  }
  if (params.need_cost_sum) {
    group = { $group: {
      _id: null,
      cost: groupCostField
    }}

  } else {
    group = { $group: {
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
      cost: groupCostField
    }
  }}

  var resultMatch
  if (yearFrom) {
    resultMatch = { $match: { $or: [
      {'_id.year': yearFrom, '_id.month': { $gte: 9 } },
      {'_id.year': yearTo, '_id.month': { $lte: 8 } }
      ] }
    }
  }

  var sort
  if (!params.need_cost_sum) {
    sort = { $sort: { _id: 1 } }
  }

  var aggregation = []
  if (match) aggregation.push(match)
  if (group) aggregation.push(group)
  if (resultMatch) aggregation.push(resultMatch)
  if (sort) aggregation.push(sort)

  var aggregated = db.collection('inoutcomeDaityou').aggregate(aggregation)
  if (params.need_cost_sum) {
    aggregated.next((err, result) => {
      if (callback) { callback(err, result) }
    })
  } else {
    aggregated.toArray((err, results) => {
      if (callback) { callback(err, results) }
    })
  }
}

var siharaSalesOfPeriod = function (db, params, callback) {

  var match = { genba_id: new ObjectId(params.genbaID), type: '収入' }
  if (params.company_el) {
    match.取引先 = params.company_el
  }
  match = { $match: match }
  
  // {
    //   $project: { month: { $month: new Date('$日付') } }
    // },

  var yearFrom, yearTo
  if (params.yearBase) {
    yearFrom = params.yearBase
    yearTo = yearFrom + 1
  }

  var group = {
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
          { $trunc: { $divide: [ { $multiply: [ '$査定金額', '$税率' ] }, 100 ] } }
        ] }, // 売上 = SUM(収入)
      }
    }
  }

  var resultMatch
  if (yearFrom) {
    resultMatch = { $match: { $or: [
      {'_id.year': yearFrom, '_id.month': { $gte: 9 } },
      {'_id.year': yearTo, '_id.month': { $lte: 8 } }
      ] }
    }
  }

  var sort = { $sort: { _id: 1 } }
  
  var aggregation = []
  if (match) aggregation.push(match)
  if (group) aggregation.push(group)
  if (resultMatch) aggregation.push(resultMatch)
  if (sort) aggregation.push(sort)

  // get 売上
  db.collection('inoutcomeDaityou').aggregate(aggregation)
  .toArray((err, results) => {

    if (callback) {
      callback(err, results)
    }
  })
}

var siharaBudgetSumOfPeriod = function (db, params, callback) {

  // params.company_id = '62047eb103b858e5da580a99'

  let match = {
    genba: new ObjectId(params.genbaID),
    'company._id': new ObjectId(params.company_id),
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
    if (!err) {
      if (result) {
        if (callback) {
          callback(null, result.total)
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

var siharaCompanies = function (db, params, callback) {
  db.collection('inoutcomeDaityou').aggregate([
    { $match: { genba_id: new ObjectId(params.genbaID), type: '支出' } },
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


module.exports = {siharaCostsOfPeriod, siharaSalesOfPeriod, siharaBudgetSumOfPeriod, siharaCompanies}