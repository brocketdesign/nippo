const monthFrom = 9
const monthTo = 8

$(document).ready(async function () {

    let genbaID = getUrlParameter('genbaID')
    let genbaName = getUrlParameter('genbaName')
    // let genbaID = "610c7d73c3640304088b6735"

    //NIPPO FORM PAGE
    if (!!document.querySelector('#daityouSiharaIchiran')) {
        initNavBar()
        tableInit()
        SUA({ event: '支払一覧ページ' })
    }

    function initNavBar() {
        $('#title').html(genbaName)
        var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName
        $('#nav-genba').attr('href', '/dashboard/daityou/genba?' + urlParams)
        // $('#nav-sihara').attr('href', '/dashboard/daityou/sihara_ichiran?' + urlParams)
        $('#nav-ichiran').attr('href', '/dashboard/daityou/genba_ichiran?' + urlParams)
        $('#nav-yosan').attr('href', '/dashboard/daityou/yosan?' + urlParams)
    }

    function tableInit() {
    
        if (document.querySelector('#sihara-ichiran-summary-tbody')) {
            initSummaryTable()
        }

        if (document.querySelector('#sihara-ichiran-tbody')) {
            initFullTable()
        }
    }

    function initSummaryTable() {
        
        var query = {
            genbaID: genbaID,
            genbaName: genbaName
        }

        // var now = new Date()
        // if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
        //     query.period = 'now'
        // } else { // from prev-year.9月 to 8月
        //     query.period = 'before'
        // }
        
        $.post('/api/sihara-ichiran-summary/', query, function (data) {
            // console.log({summary:data})
            // updateSummaryTableOnResponse_period_old_version(data)
            updateSummaryTableOnResponse(data)
        })
    }

    function initFullTable() {
        
        var query = {
            genbaID: genbaID,
            genbaName: genbaName,
            need_budgets: 1
        }

        // var now = new Date()
        // if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
        //     query.period = 'now'
        // } else { // from prev-year.9月 to 8月
        //     query.period = 'before'
        // }

        $.post('/api/sihara-ichiran/', query, function (data) {
            // console.log({full:data})
            // updateFullTableOnResponse_period_old_version(data)
            updateFullTableOnResponse(data)
        })
    }

    function updateFullTableOnResponse_period_old_version(data) {
        var theader = $('#sihara-ichiran-theader')
        var tbody = $('#sihara-ichiran-tbody')

        var yearBase = data.yearBase
        var items = data.items
        var htmlHeader = ''
        var htmlBody = ''

        var datesHeader = periodHeaderDatesYearBase(yearBase)
        var dates = periodDatesYearBase(yearBase)

        htmlHeader += '<tr><th style="width:10%">業者名</th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < 12; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th><th class="bg-light" style="color:#212529">実行予算</th><th class="bg-light" style="color:#212529">進捗率</th></tr>'

        if (items) {
            items.forEach(function (item) {
                
                var costSum = 0
                
                var costs = item.costs
                var costsFull = paddingCostsYearBase(dates, costs)
    
                htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">' + item.company_el + '</td>'
                for (var i = 0; i < 12; i++) {
                    var cost = costsFull[i]
                    costSum += cost
                    htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
                }
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(item.budget) + '</td>'
                if (item.budget == 0) {
                    htmlBody += '<td class="pr-1 bg-light">ー</td>'
                } else {
                    htmlBody += '<td class="pr-1 bg-light">' + numberFormat(parseFloat((costSum * 100 / item.budget).toFixed(2))) + '%</td>'
                }
                htmlBody += '</tr>'
            })
        }
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

    function updateSummaryTableOnResponse_period_old_version(data) {
        var theader = $('#sihara-ichiran-summary-theader')
        var tbody = $('#sihara-ichiran-summary-tbody')

        var yearBase = data.yearBase
        var costs = data.costs
        var sales = data.sales
        var costSum = 0
        var saleSum = 0
        var htmlHeader = ''
        var htmlBody = ''

        var datesHeader = periodHeaderDatesYearBase(yearBase)
        var dates = periodDatesYearBase(yearBase)

        htmlHeader += '<tr><th></th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < 12; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th></tr>'

        var costsFull = paddingCostsYearBase(dates, costs)
        htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">原価合計</td>'
        for (var i = 0; i < 12; i++) {
            var cost = costsFull[i]
            costSum += cost
            htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
        }
        htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
        htmlBody += '</tr>'

        var salesFull = paddingSalesYearBase(dates, sales)
        htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">売上合計</td>'
        for (var i = 0; i < 12; i++) {
            var sale = salesFull[i]
            saleSum += sale
            htmlBody += '<td class="pr-1">' + numberFormat(sale) + '</td>'
        }
        htmlBody += '<td class="pr-1 bg-light">' + numberFormat(saleSum) + '</td>'
        htmlBody += '</tr>'
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

    function updateFullTableOnResponse(data) {
        var theader = $('#sihara-ichiran-theader')
        var tbody = $('#sihara-ichiran-tbody')

        var items = data.items
        if (!items || items.length == 0) {
            return
        }

        var htmlHeader = ''
        var htmlBody = ''

        // calculate date range
        var yearMin = 10000, monthMin = 10000
        var yearMax = 0, monthMax = 0
        items.forEach(function (item) {
            var costs = item.costs
            if (costs !== undefined && costs.length > 0) {
                for (var i = 0; i < costs.length; i++) {
                    var element = costs[i]
                    var year = element._id.year
                    var month = element._id.month
                    if (year < yearMin) {
                        yearMin = year
                        monthMin = month
                    } else {
                        if (year == yearMin && month < monthMin) {
                            monthMin = month
                        }
                    }

                    if (year > yearMax) {
                        yearMax = year
                        monthMax = month
                    } else {
                        if (year == yearMax && month > monthMax) {
                            monthMax = month
                        }
                    }
                }
            }
        })

        var datesHeader = periodHeaderDates(yearMin, monthMin, yearMax, monthMax)
        var dates = periodDates(yearMin, monthMin, yearMax, monthMax)
        // console.log(datesHeader)
        // console.log(dates)
        var nRange = dates.length
        if (nRange == 0) { // error
            return
        }

        htmlHeader += '<tr><th class="col-title">業者名</th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < nRange; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th><th class="bg-light" style="color:#212529">実行予算</th><th class="bg-light" style="color:#212529">進捗率</th></tr>'

        items.forEach(function (item) {
            
            var costSum = 0
            
            var costs = item.costs
            var costsFull = paddingCosts(dates, costs)
            // console.log(costsFull)

            htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">' + item.company_el + '</td>'
            for (var i = 0; i < nRange; i++) {
                var cost = costsFull[i]
                costSum += cost
                htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
            }
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(item.budget) + '</td>'
            if (item.budget == 0) {
                htmlBody += '<td class="pr-1 bg-light">ー</td>'
            } else {
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(parseFloat((costSum * 100 / item.budget).toFixed(2))) + '%</td>'
            }
            htmlBody += '</tr>'
        })
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

    function updateSummaryTableOnResponse(data) {
        var theader = $('#sihara-ichiran-summary-theader')
        var tbody = $('#sihara-ichiran-summary-tbody')

        var costs = data.costs
        var sales = data.sales
        var costSum = 0
        var saleSum = 0
        var htmlHeader = ''
        var htmlBody = ''

        // calculate date range
        var yearMinCost = 10000, monthMinCost = 10000
        var yearMaxCost = 0, monthMaxCost = 0
        if (costs !== undefined && costs.length > 0) {
            for (var i = 0; i < costs.length; i++) {
                var element = costs[i]
                var year = element._id.year
                var month = element._id.month
                if (year < yearMinCost) {
                    yearMinCost = year
                    monthMinCost = month
                } else {
                    if (year == yearMinCost && month < monthMinCost) {
                        monthMinCost = month
                    }
                }

                if (year > yearMaxCost) {
                    yearMaxCost = year
                    monthMaxCost = month
                } else {
                    if (year == yearMaxCost && month > monthMaxCost) {
                        monthMaxCost = month
                    }
                }
            }
        }

        var yearMinSale = 10000, monthMinSale = 10000
        var yearMaxSale = 0, monthMaxSale = 0
        if (sales !== undefined && sales.length > 0) {
            for (var i = 0; i < sales.length; i++) {
                var element = sales[i]
                var year = element._id.year
                var month = element._id.month
                if (year < yearMinSale) {
                    yearMinSale = year
                    monthMinSale = month
                } else {
                    if (year == yearMinSale && month < monthMinSale) {
                        monthMinSale = month
                    }
                }

                if (year > yearMaxSale) {
                    yearMaxSale = year
                    monthMaxSale = month
                } else {
                    if (year == yearMaxSale && month > monthMaxSale) {
                        monthMaxSale = month
                    }
                }
            }
        }

        var yearMin = Math.min(yearMinCost, yearMinSale), monthMin = Math.min(monthMinCost, monthMinSale)
        var yearMax = Math.max(yearMaxCost, yearMaxSale), monthMax = Math.max(monthMaxCost, monthMaxSale)

        var datesHeader = periodHeaderDates(yearMin, monthMin, yearMax, monthMax)
        var dates = periodDates(yearMin, monthMin, yearMax, monthMax)
        // console.log(datesHeader)
        // console.log(dates)
        var nRange = dates.length
        if (nRange == 0) { // error
            return
        }
        // return;

        htmlHeader += '<tr><th class="col-title-small"></th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < nRange; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th></tr>'

        var costsFull = paddingCosts(dates, costs)
        if (costsFull.length > 0) {
            htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">原価合計</td>'
            for (var i = 0; i < nRange; i++) {
                var cost = costsFull[i]
                costSum += cost
                htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
            }
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
            htmlBody += '</tr>'
        }

        var salesFull = paddingSales(dates, sales)
        if (salesFull.length > 0) {
            htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">売上合計</td>'
            for (var i = 0; i < nRange; i++) {
                var sale = salesFull[i]
                saleSum += sale
                htmlBody += '<td class="pr-1">' + numberFormat(sale) + '</td>'
            }
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(saleSum) + '</td>'
            htmlBody += '</tr>'
        }
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

})

function numberFormat(number) {
    return new Intl.NumberFormat('ja-JP').format(number)
}

function periodHeaderDates(yearMin, monthMin, yearMax, monthMax) {
    var dates = []
    if (yearMin == 10000 || monthMin == 10000 || yearMax == 0 || monthMax == 0) {
        return dates
    }
    dates.push(yearMin + '年' + monthMin + '月')
    if (yearMin == yearMax) {
        for (var i = monthMin + 1; i <= monthMax; i++) {
            dates.push(i + '月')
        }
    } else {

        for (var i = monthMin + 1; i <= 12; i++) {
            dates.push(i + '月')
        }
        for (var i = yearMin + 1; i < yearMax; i++) {
            dates.push(i + '年1月')
            for (var j = 2; j <= 12 ;j++) {
                dates.push(j + '月')
            }
        }
        dates.push(yearMax + '年1月')
        for (var i = 2; i <= monthMax; i++) {
            dates.push(i + '月')
        }
    }
    
    return dates
}

function periodDates(yearMin, monthMin, yearMax, monthMax) {
    var dates = []
    if (yearMin == 10000 || monthMin == 10000 || yearMax == 0 || monthMax == 0) {
        return dates
    }
    if (yearMin == yearMax) {
        for (var i = monthMin; i <= monthMax; i++) {
            dates.push(yearMin + '' + i)
        }
    } else {
        for (var i = monthMin; i <= 12; i++) {
            dates.push(yearMin + '' + i)
        }
        for (var i = yearMin + 1; i < yearMax; i++) {
            for (var j = 1; j <= 12 ;j++) {
                dates.push(i + '' + j)
            }
        }
        for (var i = 1; i <= monthMax; i++) {
            dates.push(yearMax + '' + i)
        }
    }
    return dates
}

function paddingCosts(dates, costs) {
    var costsFull = []
    if (costs === undefined || costs.length == 0) {
        return costsFull
    }

    var idxS = 0
    var idxE = 0
    for (var i = 0; i < costs.length; i++) {
        var element = costs[i]
        var cost = element.cost
        var date = element._id.year + '' + element._id.month
        while (dates[idxE] != date) idxE ++
        for (var j = idxS; j < idxE; j++) costsFull.push(0)
        idxE ++
        idxS = idxE
        if (!cost) cost = 0
        costsFull.push(cost)
    }
    for (var i = idxS; i < dates.length; i++) {
        costsFull.push(0)
    }

    return costsFull
}

function paddingSales(dates, sales) {
    var salesFull = []
    if (sales === undefined || sales.length == 0) {
        return salesFull
    }

    var idxS = 0
    var idxE = 0
    for (var i = 0; i < sales.length; i++) {
        var element = sales[i]
        var sale = element.sale
        var date = element._id.year + '' + element._id.month
        while (dates[idxE] != date) idxE ++
        for (var j = idxS; j < idxE; j++) salesFull.push(0)
        idxE ++
        idxS = idxE
        if (!sale) sale = 0
        salesFull.push(sale)
    }
    for (var i = idxS; i < dates.length; i++) {
        salesFull.push(0)
    }

    return salesFull
}

function periodHeaderDatesYearBase(yearBase) {
    var dates = []
    dates.push(yearBase + '年' + monthFrom + '月')
    for (var i = monthFrom + 1; i <= 12; i++) {
        dates.push(i + '月')
    }
    dates.push((yearBase + 1) + '年1月')
    for (var i = 2; i <= monthTo; i++) {
        dates.push(i + '月')
    }
    return dates
}

function periodDatesYearBase(yearBase) {
    var dates = []
    for (var i = monthFrom; i <= 12; i++) {
        dates.push(yearBase + '' + i)
    }
    for (var i = 1; i <= monthTo; i++) {
        dates.push((yearBase + 1) + '' + i)
    }
    return dates
}

function paddingCostsYearBase(dates, costs) {
    var costsFull = []
    if (costs === undefined || costs.length == 0) {
        for (var i = 0; i < 12; i++) {
            costsFull.push(0)
        }
    } else {
        var idxS = 0
        var idxE = 0
        for (var i = 0; i < costs.length; i++) {
            var element = costs[i]
            var cost = element.cost
            var date = element._id.year + '' + element._id.month
            while (dates[idxE] != date) idxE ++
            for (var j = idxS; j < idxE; j++) costsFull.push(0)
            idxE ++
            idxS = idxE
            if (!cost) cost = 0
            costsFull.push(cost)
        }
        for (var i = idxS; i < 12; i++) {
            costsFull.push(0)
        }
    }
    return costsFull
}

function paddingSalesYearBase(dates, sales) {
    var salesFull = []
    if (sales === undefined || sales.length == 0) {
        for (var i = 0; i < 12; i++) {
            salesFull.push(0)
        }
    } else {
        var idxS = 0
        var idxE = 0
        for (var i = 0; i < sales.length; i++) {
            var element = sales[i]
            var sale = element.sale
            var date = element._id.year + '' + element._id.month
            while (dates[idxE] != date) idxE ++
            for (var j = idxS; j < idxE; j++) salesFull.push(0)
            idxE ++
            idxS = idxE
            if (!sale) sale = 0
            salesFull.push(sale)
        }
        for (var i = idxS; i < 12; i++) {
            salesFull.push(0)
        }
    }
    return salesFull
}