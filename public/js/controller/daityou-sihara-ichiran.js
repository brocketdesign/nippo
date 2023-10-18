const monthFrom = 9
const monthTo = 8

$(document).ready(async function () {

    // let genbaID = getUrlParameter('genbaID')
    let genbaID = "610c7d73c3640304088b6735"

    //NIPPO FORM PAGE
    if (!!document.querySelector('#daityouSiharaIchiran')) {
        tableInit()
        SUA({ event: '支払一覧ページ' })
    }

    function tableInit() {
    
        if (document.querySelector('#sihara-ichiran-summary-tbody')) {
            initSummaryTable($('#sihara-ichiran-summary-tbody'))
        }

        if (document.querySelector('#sihara-ichiran-tbody')) {
            initFullTable($('#sihara-ichiran-tbody'))
        }
    }

    function initSummaryTable(tbody) {
        
        let query = {
            genba_id: genbaID
        }

        let now = new Date()
        if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
            query.period = 'now'
        } else { // from prev-year.9月 to 8月
            query.period = 'before'
        }
        
        request2GetSummaryData(query)
    }

    function initFullTable(tbody) {
        
        let query = {
            genba_id: genbaID
        }

        let now = new Date()
        if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
            query.period = 'now'
        } else { // from prev-year.9月 to 8月
            query.period = 'before'
        }

        request2GetFullData(query)
    }

    function updateFullTableOnResponse(data) {
        var theader = $('#sihara-ichiran-theader')
        var tbody = $('#sihara-ichiran-tbody')

        var yearBase = data.yearBase
        var items = data.items
        let htmlHeader = ''
        let htmlBody = ''

        var datesHeader = periodHeaderDates(yearBase)
        var dates = periodDates(yearBase)

        htmlHeader += '<tr><th style="width:10%">業者名</th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < 12; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th><th class="bg-light" style="color:#212529">実行予算</th><th class="bg-light" style="color:#212529">進捗率</th></tr>'

        items.forEach(function (item) {
            
            var costSum = 0
            
            var costs = item.costs
            var costsFull = paddingCosts(dates, costs)

            htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">' + item.company_el + '</td>'
            for (var i = 0; i < 12; i++) {
                var cost = costsFull[i]
                costSum += cost
                htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
            }
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(item.yosan) + '</td>'
            htmlBody += '<td class="pr-1 bg-light">' + numberFormat(parseFloat((costSum * 100 / item.yosan).toFixed(2))) + '%</td>'
            htmlBody += '</tr>'
        })
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

    function updateSummaryTableOnResponse(data) {
        let theader = $('#sihara-ichiran-summary-theader')
        let tbody = $('#sihara-ichiran-summary-tbody')

        let yearBase = data.yearBase
        let costs = data.costs
        let sales = data.sales
        let costSum = 0
        let saleSum = 0
        let htmlHeader = ''
        let htmlBody = ''

        var datesHeader = periodHeaderDates(yearBase)
        var dates = periodDates(yearBase)

        htmlHeader += '<tr><th></th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < 12; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th></tr>'

        var costsFull = paddingCosts(dates, costs)
        htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">原価合計</td>'
        for (var i = 0; i < 12; i++) {
            var cost = costsFull[i]
            costSum += cost
            htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
        }
        htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
        htmlBody += '</tr>'

        var salesFull = paddingSales(dates, sales)
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

    function request2GetSummaryData(query, callback) {
        $.post('/api/sihara-ichiran-summary/', query, function (data) {
            // console.log(data)
            updateSummaryTableOnResponse(data)
        })
    }

    function request2GetFullData(query, callback) {
        $.post('/api/sihara-ichiran/', query, function (data) {
            console.log(data)
            updateFullTableOnResponse(data)
        })
    }

})

function numberFormat(number) {
    return new Intl.NumberFormat('ja-JP').format(number)
}

function paddingNumber(number, padding) {
    var num = "" + number
    while(num.length < padding) num = "0" + num
    return num
}

function periodHeaderDates(yearBase) {
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

function periodDates(yearBase) {
    var dates = []
    for (var i = monthFrom; i <= 12; i++) {
        dates.push(yearBase + '' + i)
    }
    for (var i = 1; i <= monthTo; i++) {
        dates.push((yearBase + 1) + '' + i)
    }
    return dates
}

function paddingCosts(dates, costs) {
    var costsFull = []
    if (costs === undefined || costs.length == 0) {
        for (var i = 0; i < 12; i++) {
            costsFull.push(i)
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
            costsFull.push(cost)
        }
        for (var i = idxS; i < 12; i++) {
            costsFull.push(0)
        }
    }
    return costsFull
}

function paddingSales(dates, sales) {
    var salesFull = []
    if (sales === undefined || sales.length == 0) {
        for (var i = 0; i < 12; i++) {
            salesFull.push(i)
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
            salesFull.push(sale)
        }
        for (var i = idxS; i < 12; i++) {
            salesFull.push(0)
        }
    }
    return salesFull
}