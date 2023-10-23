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
            genbaID: genbaID
        }

        var now = new Date()
        if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
            query.period = 'now'
        } else { // from prev-year.9月 to 8月
            query.period = 'before'
        }
        
        $.post('/api/sihara-ichiran-summary/', query, function (data) {
            // console.log(data)
            updateSummaryTableOnResponse(data)
        })
    }

    function initFullTable() {
        
        var query = {
            genbaID: genbaID,
            need_budgets: 1
        }

        var now = new Date()
        if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
            query.period = 'now'
        } else { // from prev-year.9月 to 8月
            query.period = 'before'
        }

        $.post('/api/sihara-ichiran/', query, function (data) {
            console.log(data)
            updateFullTableOnResponse(data)
        })
    }

    function updateFullTableOnResponse(data) {
        var theader = $('#sihara-ichiran-theader')
        var tbody = $('#sihara-ichiran-tbody')

        var yearBase = data.yearBase
        var items = data.items
        var htmlHeader = ''
        var htmlBody = ''

        var datesHeader = periodHeaderDates(yearBase)
        var dates = periodDates(yearBase)

        htmlHeader += '<tr><th style="width:10%">業者名</th><th class="py-2">' + datesHeader[0] + '</th>'
        for (var i = 1; i < 12; i++) {
            htmlHeader += '<th>' + datesHeader[i] + '</th>'
        }
        htmlHeader += '<th class="bg-light" style="color:#212529">小計</th><th class="bg-light" style="color:#212529">実行予算</th><th class="bg-light" style="color:#212529">進捗率</th></tr>'

        if (items) {
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
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(item.budget) + '</td>'
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(parseFloat((costSum * 100 / item.budget).toFixed(2))) + '%</td>'
                htmlBody += '</tr>'
            })
        }
   
        theader.html(htmlHeader)
        tbody.html(htmlBody)
    }

    function updateSummaryTableOnResponse(data) {
        var theader = $('#sihara-ichiran-summary-theader')
        var tbody = $('#sihara-ichiran-summary-tbody')

        var yearBase = data.yearBase
        var costs = data.costs
        var sales = data.sales
        var costSum = 0
        var saleSum = 0
        var htmlHeader = ''
        var htmlBody = ''

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

})

function numberFormat(number) {
    return new Intl.NumberFormat('ja-JP').format(number)
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