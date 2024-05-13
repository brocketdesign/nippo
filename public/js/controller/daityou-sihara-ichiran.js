const monthFrom = 9
const monthTo = 8

$(document).ready(async function () {

    let genbaID = getUrlParameter('genbaID')
    let genbaName = getUrlParameter('genbaName')
    let includeTax = getUrlParameter('includeTax')
    // let genbaID = "610c7d73c3640304088b6735"

    let costsFull = null;
    let salesFull = null;
    let rouhisFull = null;

    //NIPPO FORM PAGE
    if (!!document.querySelector('#daityouSiharaIchiran')) {
        initNavBar()
        tableInit()
        SUA({ event: '支払一覧ページ' })
    }

    if (!!document.querySelector('#includeTaxNotify')) {
        if (includeTax == "true") {
            $('#includeTaxNotify').html('税込')
            $('#includeTaxNotify').removeClass('badge-danger')
            $('#includeTaxNotify').addClass('badge-primary')
        }
        else {
            $('#includeTaxNotify').html('税抜')
            $('#includeTaxNotify').removeClass('badge-primary')
            $('#includeTaxNotify').addClass('badge-danger')
        }
    }

    function initNavBar() {
        $('#title').html(genbaName)
        var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName + '&includeTax=' + includeTax
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
            genbaName: genbaName,
            includeTax: includeTax
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
            includeTax: includeTax,
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

        let htmlHeader = ''
        let htmlBody = ''

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
            // console.log(costs)
            var costsFull = paddingCosts(dates, costs)
            // console.log(costsFull)

            htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">' + item.company_el + '</td>'
            for (var i = 0; i < nRange; i++) {
                var cost = costsFull[i].cost
                costSum += cost
                var files = costsFull[i].files
                if (files !== undefined) {
                    var nameArry = files.map(o => o.file)
                    var dateArry = files.map(o => o.date)
                    var fileNames = nameArry.join("\\")
                    var fileDates = dateArry.join("\\")
                    htmlBody += `<td class="pr-1 cell-file" style="position:relative;cursor:pointer" data-files=${fileNames} data-dates=${fileDates}><span class="badge badge-primary" style="position:absolute;top:0;left:0;border-radius:0">${files.length}</span><span style="padding-left:15px">${numberFormat(cost)}</span></td>`
                }
                else {
                    htmlBody += `<td class="pr-1">${numberFormat(cost)}</td>`
                }
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

        $(".cell-file").on("click", function () {
            var fileNames = $(this).attr('data-files').split("\\")
            var fileDates = $(this).attr('data-dates').split("\\")
            // let win = window.open(`/api/download/${files[0]}`)
            let html = ''
            fileNames.forEach(function (fileName, i) {
                var fileDate = fileDates[i]
                html += `<tr>
                    <td class="td-file py-2 px-2 align-middle" data-file="${fileName}"><i class="fa fa-file-text px-2 align-middle" style="font-size:1.5rem;color:gray;"></i>
                        <span class="text-dark">${fileName}</span>
                    </td>
                    <td class="text-right pr-2" style="font-size:13px">
                        ${fileDate}
                    </td>
                </tr>`
            })
            $('#file-content').html(html)
            $('#file-modal').modal('show')

            $(".td-file").on("click", function () {
                let fileName = $(this).attr('data-file')
                let win = window.open(`/api/download/${fileName}`)
            })
        })

        let query = {
            genbaID: genbaID,
            genbaName: genbaName,
            yearMin: yearMin,
            monthMin: monthMin,
            yearMax: yearMax,
            monthMax: monthMax
        }
        $.post('/api/sihara-ichiran-rouhi/', query, function (data) {
            let rouhi_ = data.rouhi;
            let rouhis_by_month = data.rouhis_by_month
            let rouhis_by_user = data.rouhis_by_user
            let total = data.total
            // console.log(rouhis_by_month)
            var rouhis = paddingRouhis(dates, rouhis_by_month)
            // console.log(rouhis)

            var htmlBodyRouhi = '<tr class="bg-light"><td class="py-2 pl-1 text-left">労務費</td>'
            // for (var i = 0; i < nRange; i++) {
            //     htmlBodyRouhi += '<td></td>'
            // }
            if (rouhisFull == null)
                rouhisFull = []
            Object.keys(rouhis).forEach(key => {
                var rouhi = rouhis[key] * rouhi_
                rouhisFull.push(rouhi)
                // htmlBodyRouhi += '<td class="pr-1 bg-light">' + numberFormat(rouhi) + '</td>'
                htmlBodyRouhi += '<td class="pr-1">' + numberFormat(rouhi) + '</td>'
            })
            // htmlBodyRouhi += '<td class="pr-1 bg-secondary text-white">' + numberFormat(total * rouhi_) + '</td>'
            htmlBodyRouhi += '<td class="pr-1 bg-light">' + numberFormat(total * rouhi_) + '</td>'
            // htmlBodyRouhi += '<td class="bg-secondary"></td><td class="bg-secondary"></td></tr>'
            htmlBodyRouhi += '<td class="bg-light"></td><td class="bg-light"></td></tr>'
            tbody.append(htmlBodyRouhi)
            setSummaryData(nRange)
        })
    }

    function updateSummaryTableOnResponse(data) {
        var theader = $('#sihara-ichiran-summary-theader')
        var tbody = $('#sihara-ichiran-summary-tbody')

        var costs = data.costs
        var sales = data.sales
        // var costSum = 0
        // var saleSum = 0
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

        var fromCost = yearMinCost + ('' + monthMinCost).padStart(2, '0', monthMinCost)
        var toCost = yearMaxCost + ('' + monthMaxCost).padStart(2, '0', monthMaxCost)
        var fromSale = yearMinSale + ('' + monthMinSale).padStart(2, '0', monthMinSale)
        var toSale = yearMaxSale + ('' + monthMaxSale).padStart(2, '0', monthMaxSale)
        var from = Math.min(parseInt(fromCost), parseInt(fromSale))
        var to = Math.max(parseInt(toCost), parseInt(toSale))
        var yearMin = Math.floor(from/100), monthMin = from - yearMin * 100
        var yearMax = Math.floor(to/100), monthMax = to - yearMax * 100

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

        // var costsFull = paddingCosts(dates, costs)
        costsFull = paddingCosts(dates, costs)
        salesFull = paddingSales(dates, sales)

        theader.html(htmlHeader)
        setSummaryData(nRange)
    }

    function setSummaryData(nRange) {
        if (costsFull != null && salesFull != null && rouhisFull != null) {

            var costSum = 0;
            var saleSum = 0;
            var htmlBody = "";
            if (costsFull.length > 0) {
                htmlBody += '<tr><td class="py-2 pl-1 bg-light text-left">原価合計</td>'
                for (var i = 0; i < nRange; i++) {
                    // var cost = costsFull[i]
                    var cost = costsFull[i].cost + rouhisFull[i]
                    costSum += cost
                    htmlBody += '<td class="pr-1">' + numberFormat(cost) + '</td>'
                }
                htmlBody += '<td class="pr-1 bg-light">' + numberFormat(costSum) + '</td>'
                htmlBody += '</tr>'
            }

            // var salesFull = paddingSales(dates, sales)
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
    
            // theader.html(htmlHeader)
            // tbody.html(htmlBody)
            $('#sihara-ichiran-summary-tbody').append(htmlBody)
        }
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
            dates.push(yearMin + ('' + i).padStart(2, '0', i))
        }
    } else {
        for (var i = monthMin; i <= 12; i++) {
            dates.push(yearMin + ('' + i).padStart(2, '0', i))
        }
        for (var i = yearMin + 1; i < yearMax; i++) {
            for (var j = 1; j <= 12 ;j++) {
                dates.push(i + ('' + j).padStart(2, '0', j))
            }
        }
        for (var i = 1; i <= monthMax; i++) {
            dates.push(yearMax + ('' + i).padStart(2, '0', i))
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
        var date = element._id.year + ('' + element._id.month).padStart(2, '0', element._id.month)
        while (dates[idxE] != date) idxE ++
        for (var j = idxS; j < idxE; j++) costsFull.push({cost: 0})
        idxE ++
        idxS = idxE
        if (!cost) cost = 0
        var files_ = element.files
        var files = []
        files_.forEach(function (file) {
            if (file.file !== undefined) {
                files.push(file)
            }
        })
        if (files.length > 0)
            costsFull.push({cost: cost, files: files})
        else
            costsFull.push({cost: cost})
    }
    for (var i = idxS; i < dates.length; i++) {
        costsFull.push({cost: 0})
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
        var date = element._id.year + ('' + element._id.month).padStart(2, '0', element._id.month)
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

function paddingRouhis(dates, rouhis) {
    if (rouhis === undefined) {
        return {}
    }

    // var keys = Object.keys(rouhis)
    // if (keys.length == 0) {
    //     return {}
    // }
    
    var rouhisFull = {}
    for (var i = 0; i < dates.length; i++) {
        var date = dates[i]
        if (rouhis[date]) {
            rouhisFull[date] = rouhis[date]
        } else {
            rouhisFull[date] = 0
        }
    }

    return rouhisFull
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