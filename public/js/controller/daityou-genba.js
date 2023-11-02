const monthFrom = 9
const monthTo = 8

$(document).ready(async function () {

    let genbaID = getUrlParameter('genbaID')
    let genbaName = getUrlParameter('genbaName')
    // let genbaID = "610c7d73c3640304088b6735"
    let deposit = 0
    let budget = 0
    let profit = 0
    let profitRate = 0
    let sale = 0
    let cost = 0

    //
    let useFlotChart = false
    let useChartScroll = true

    if (!!document.querySelector('#daityouGenbaPage')) {
        initNavBar()
        initForm()
        tableInit()
        chartInit()
        SUA({ event: '現場まとめページ' })
    }

    function initForm() {
        $('body').on('click', '#finishBtn', function() {
            var query = {
                genbaID: genbaID,
                status: '完了'
            }
    
            $.post('/api/update/genba-status/', query, function (data) {
                // console.log(data)
                if (data.error) {
                    console.log(data.error)
                } else {
                    updateUIByGenbaStatus('完了')
                }
            })
        })
    }

    function initNavBar() {
        $('#title').html(genbaName)
        var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName
        // $('#nav-genba').attr('href', '/dashboard/daityou/genba?' + urlParams)
        $('#nav-sihara').attr('href', '/dashboard/daityou/sihara_ichiran?' + urlParams)
        $('#nav-ichiran').attr('href', '/dashboard/daityou/genba_ichiran?' + urlParams)
        $('#nav-yosan').attr('href', '/dashboard/daityou/yosan?' + urlParams)
    }

    function tableInit() {
        if (document.querySelector('#genba-table')) {
            initGenbaTable()
        }

        if (document.querySelector('#yosan-table')) {
            initYosanTable()
        }
    }

    function chartInit() {

        if (document.querySelector('#cost-barchart')) {
            initCostBarChart()
        }

        var selector
        if (useFlotChart) {
            selector = '#spline-chart-flot'
            $('#spline-chart-container').remove()
            $('#spline-chart-body').removeClass('pl-2 pr-0')
            $('#spline-chart-body').addClass('pl-3 pr-2')
        } else {
            selector = '#spline-chart'
            $('#spline-chart-flot').remove()
        }
        if (!useChartScroll) {
            $('#spline-chart-body').removeClass('overflow-x-auto')
        }

        if (document.querySelector(selector)) {
            initSplineChart(selector)
        }
    }

    function initGenbaTable() {
        var query = {
            genbaID: genbaID
        }

        $.post('/api/genba-detail/', query, function (data) {
            // console.log(data)
            updateUIByGenbaStatus(data.完了状況)
            updateGenbaTableOnResponse(data)
        })
    }

    function initYosanTable() {
        var query = {
            genbaID: genbaID
        }

        $.post('/api/yosan-summary/', query, function (data) {
            // console.log(data)
            updateYosanTableOnResponse(data)
            //
            if (document.querySelector('#progress-chart')) {
                drawProgressBarChart('#progress-chart')
            }
            if (document.querySelector('#normal-barchart')) {
                drawNormalBarChart('#normal-barchart')
            }
        })
    }

    function initCostBarChart() {
        var query = {
            genbaID: genbaID,
            need_cost_sum: 1
        }

        // var now = new Date()
        // if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
        //     query.period = 'now'
        // } else { // from prev-year.9月 to 8月
        //     query.period = 'before'
        // }
        $.post('/api/sihara-ichiran/', query, function (data) {
            // console.log(data)
            drawCostBarChart('#cost-barchart', data)
        })
    }

    function initSplineChart(selector) {
        var query = {
            genbaID: genbaID
        }

        // var now = new Date()
        // if ((now.getMonth() + 1) > 8) { // from 9月 to next-year.8月
        //     query.period = 'now'
        // } else { // from prev-year.9月 to 8月
        //     query.period = 'before'
        // }

        $.post('/api/sihara-ichiran-summary/', query, function (data) {
            // console.log(data)
            if (useFlotChart) {
                drawSplineChartFlotJS(selector, data)
            } else {
                drawSplineChartChartJS(selector, data)
            }
        })
    }

    function updateYosanTableOnResponse(data) {
        deposit = data.契約金額 || 0
        budget = data.実行予算 || 0
        profit = data.予想粗利 || 0
        profitRate = data.粗利率
        sale = data.売上 || 0
        cost = data.原価 || 0

        $('#yosan-deposit').html(numberFormat(deposit))
        $('#yosan-sale').html(numberFormat(sale))
        $('#yosan-budget').html(numberFormat(budget))
        $('#yosan-cost').html(numberFormat(cost))
        $('#yosan-profit').html(numberFormat(profit))
        if (profitRate)
            $('#yosan-profit-rate').html(numberFormat(profitRate) + '%')
        else
            $('#yosan-profit-rate').html('ー')
    }

    function updateUIByGenbaStatus(status) {
        if (status == '完了')
            $('#finishBtn').addClass('disabled')
    }

    function updateGenbaTableOnResponse(data) {
        var name = data.工事名
        var orderer = data.発注者
        var place = data.場所
        var responsibles = data.担当者
        var _dateFrom = data['工期(自)']
        var _dateTo = data['工期(至)']
        var period = ''
        if (_dateFrom && _dateTo) {
            var dateFrom = new Date(_dateFrom)
            var dateTo = new Date(_dateTo)
            period = dateFrom.getFullYear() + '年 ' + (dateFrom.getMonth() + 1) + '月 〜 ' + dateTo.getFullYear() + '年 ' + (dateTo.getMonth() + 1) + '月'
        } else if (_dateFrom) {
            var dateFrom = new Date(_dateFrom)
            period = dateFrom.getFullYear() + '年 ' + (dateFrom.getMonth() + 1) + '月 〜 '
        }

        $('#genba-name').html(name)
        $('#genba-orderer').html(orderer)
        $('#genba-place').html(place)
        $('#genba-period').html(period)

        if (responsibles) {
            var query = {}
            if (!Array.isArray(responsibles)) {
                query.userIDs = responsibles
            } else {
                query.userIDs = responsibles
            }
            $.post('/api/user/simple-info/', query, function (data) {
                // console.log(data)
                if (Array.isArray(data)) {
                    var names = ''
                    var n = data.length || 0
                    if (n > 0) {
                        for (var i = 0; i < n-1; i++) {
                            names += data[i].lname + '、'
                        }
                    }
                    names += data[n-1].lname
                    $('#genba-user').html(names)
                } else {
                    $('#genba-user').html(data.lname)
                }
            })
        }
    }

    function drawProgressBarChart(selector) {
        if (budget == 0) {
            $('#progress-percent').html('(ー)')
        } else {
            var progress = parseFloat((cost / budget * 100).toFixed(2))
            $(selector).css('width', progress + '%')
            $('#progress-percent').html('(' + progress + '%)')
        }
    }

    function drawNormalBarChart(selector) {
        let hasDrawn = false
        
        let d1 = [["売上", sale],["原価", cost],["粗利益", profit]]

        $(selector).resize(() => {
            draw()  
        })
        draw()
    
        function draw() {
            if ($(selector).width() == 0 || $(selector).height() == 0)
                return
    
            if (hasDrawn)
                return
            
            hasDrawn = true
            
            $.plot(
                selector, [{
                    data: d1,
                    color: "#00b0f0"
                }], 
                {
                    series: {
                        bars: {
                            align: "center",
                            lineWidth: 0,
                            show: !0,
                            barWidth: .8,
                            fill: .9
                        }
                    },
                    grid: {
                        borderColor: "#ddd",
                        borderWidth: 1,
                        hoverable: !0
                    },
                    
                    tooltip: true,
                    tooltipOpts: {
                        content: '%y'
                    },
                
                    xaxis: {
                        tickColor: "#ddd",
                        mode: "categories"
                    },
                    yaxis: {
                        tickColor: "#ddd"
                    },
                    shadowSize: 0
                }
            )
        }
    }

    function drawCostBarChart(selector, data) {
        let hasDrawn = false;
        
        var items = data.items
        if (!items)
            return
        items.sort(function (a, b) {
            if (a.costs.cost < b.costs.cost)
                return 1
            else if (a.costs.cost > b.costs.cost)
                return -1
            return 0
        })

        var nItems = items.length
        
        let d1 = []
        for (var i = 0; i < nItems; i++) {
            var item = items[i]
            d1.push([ item.company_el, item.costs.cost ])
        }

        $(selector).resize(() => {
            draw()
        })
        draw()

        function draw() {
            if ($(selector).width() == 0 || $(selector).height() == 0)
                return
    
            if (hasDrawn)
                return
            
            hasDrawn = true

            // var d1 = [["シマダタイル", 60000000],["㈱ビルド伸", 16000000],["SPEC合同会社", 14000000],
            //         ["日添ブリキ店", 12000000],["(有)寿石油店", 11000000],["(有)木岡建材店", 9000000],
            //         ["(有)平野ブリキ店", 8000000],["(有)徳重工業", 6000000],["(有)杉原組", 5800000],
            //         ["(有)杉本電機", 4000000],["(有)浜田鉄筋工業", 3000000],["(有)アクアテック", 2000000],
            //         ["横河システム建築", 2000000],["㈱大萬", 1800000],["昇和㈱", 1500000],
            //         ["㈱ハマキャスト", 1200000],["㈱今木鉄工", 1000000],["佐々木工業", 90000]];

            $.plot(
                selector, [{
                    data: d1,
                    color: "#00b0f0"
                }], 
                {
                    series: {
                        bars: {
                            align: "center",
                            lineWidth: 0,
                            show: !0,
                            barWidth: .8,
                            fill: .9
                        }
                    },
                    grid: {
                        borderColor: "#ddd",
                        borderWidth: 1,
                        hoverable: !0
                    },
                    
                    tooltip: true,
                    tooltipOpts: {
                        content: '%x: %y'
                    },
                
                    xaxis: {
                        tickColor: "#ddd",
                        mode: "categories"
                    },
                    yaxis: {
                        tickColor: "#ddd"
                    },
                    shadowSize: 0
                }
            )
        }
    
    }

    function drawSplineChartFlotJS(selector, data) {

        let hasDrawn = false

        let costs = data.costs
        let sales = data.sales

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

        var dates = periodDates(yearMin, monthMin, yearMax, monthMax)
        // console.log(dates)
        var nRange = dates.length
        if (nRange == 0) { // error
            return
        }
        
        var datesHeader
        if (nRange > 12) {
            datesHeader = periodHeaderDatesUniq(yearMin, monthMin, yearMax, monthMax)
        } else {
            datesHeader = periodHeaderDates(yearMin, monthMin, yearMax, monthMax)
        }

        if (useChartScroll) {
            let rootWidth = $("#spline-chart-root").width() - 20
            let width = nRange * 50
            if (width > rootWidth) {
                $(selector).removeClass('w-100')
                $(selector).css("width", width + "px")
            }
        }

        let costsFull = paddingCosts(dates, costs)
        let salesFull = paddingSales(dates, sales)

        let costsGraphData = []
        let salesGraphData = []
        for (var i = 0; i < nRange; i++) {
            var header = datesHeader[i]
            costsGraphData.push([header, costsFull[i]])
            salesGraphData.push([header, salesFull[i]])
        }
        // console.log(categories)
        // return

        $(selector).resize(() => {
            draw()
        })
        draw()

        function draw() {
            if ($(selector).width() == 0 || $(selector).height() == 0)
                return
    
            if (hasDrawn)
                return
            
            hasDrawn = true
    
            $.plot(selector, [{
                data: costsGraphData,
                label: "原価合計",
                color: "#0093fb"
            },{
                data: salesGraphData,
                label: "売上合計",
                color: "#3cd133"
            }], {
                series: {
                    lines: {
                        show: !0,
                        lineWidth: 2
                    },
                    points: {
                        show: !0,
                        radius: 4,
                        fill: !0,
                        fillColor: "#ffffff"
                    }
                },
                grid: {
                    borderColor: "#ddd",
                    borderWidth: 1,
                    hoverable: !0
                },
                tooltip: !0,
                tooltipOpts: {
                    content: "%y"
                },
                xaxis: {
                    tickColor: "#ddd",
                    mode: "categories"
                },
                yaxis: {
                    tickColor: "#ddd"
                },
                shadowSize: 0
            })
        }
    }

    function drawSplineChartChartJS(selector, data) {

        let hasDrawn = false

        let costs = data.costs
        let sales = data.sales

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
        var nRange = dates.length
        if (nRange == 0) { // error
            return
        }

        if (useChartScroll) {
            // adjust the container bound
            let rootWidth = $("#spline-chart-root").width() - 20
            let width = nRange * 50
            let minWidth = Math.min(rootWidth, width)
            let maxWidth = Math.max(rootWidth, width)
    
            let canvasWidth
            if (rootWidth < width) {
                canvasWidth = width
            } else {
                canvasWidth = minWidth
            }
            $("#spline-chart-container").css("min-width", canvasWidth + "px")
            
            var canvasHeight = 2000 * 70 / maxWidth
            $("#spline-chart").attr("height", canvasHeight + "")
        }

        // console.log(minWidth + " " + maxWidth + " " + width + " " + canvasWidth + " " + canvasHeight);

        let costsFull = paddingCosts(dates, costs)
        let salesFull = paddingSales(dates, sales)

        let costsGraphData = []
        let salesGraphData = []
        for (var i = 0; i < nRange; i++) {
            costsGraphData.push(costsFull[i])
            salesGraphData.push(salesFull[i])
        }
        // console.log(categories)
        // return

        let chartData = {
            labels: datesHeader,
            datasets: [
                {
                    fill:false,
                    tension:0,
                    pointBackgroundColor:"#0093fb",
                    pointBorderColor:"#fff",
                    borderJoinStyle: 'miter',
                    pointBorderWidth:"1",
                    borderColor:"#0093fb",
                    radius:"4",
                    hitRadius:"2",
                    borderWidth:"2",
                    label:"原価合計",
                    data : costsGraphData,
                    backgroundColor:"#0093fb"
                },
                {
                    fill:false,
                    tension:0,
                    pointBackgroundColor:"#3cd133",
                    pointBorderColor:"#fff",
                    borderJoinStyle: 'miter',
                    pointBorderWidth:"1",
                    borderColor:"#3cd133",
                    radius:"4",
                    hitRadius:"2",
                    borderWidth:"2",
                    label:"売上合計",
                    data : salesGraphData,
                    backgroundColor:"#3cd133"
                }
            ]
        }

        // $(selector).resize(() => {
        //     draw()
        // })
        $(selector).on('resize', function () {
            draw()
        })
        draw()

        function draw() {
            if ($(selector).width() == 0 || $(selector).height() == 0)
                return
    
            if (hasDrawn)
                return
            
            hasDrawn = true
    
            new MyChart($(selector), {
                type: 'line',
                data: chartData,
                options: {
                    title: {
                        display: false,
                        text: '月別　原価と売上'
                    }
                }
            })
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

function periodHeaderDatesUniq(yearMin, monthMin, yearMax, monthMax) {
    var dates = []
    if (yearMin == 10000 || monthMin == 10000 || yearMax == 0 || monthMax == 0) {
        return dates
    }
    if (yearMin == yearMax) {
        for (var i = monthMin; i <= monthMax; i++) {
            dates.push(formatYear(yearMin) + '/' + formatMonth(i,2))
        }
    } else {

        for (var i = monthMin; i <= 12; i++) {
            dates.push(formatYear(yearMin) + '/' + formatMonth(i,2))
        }
        for (var i = yearMin + 1; i < yearMax; i++) {
            for (var j = 1; j <= 12 ;j++) {
                dates.push(formatYear(i) + '/' + formatMonth(j,2))
            }
        }
        for (var i = 1; i <= monthMax; i++) {
            dates.push(formatYear(yearMax) + '/' + formatMonth(i,2))
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

function formatYear(year, padding) {
    var num = year % 100
    return num
}

function formatMonth(month, padding) {
    var num = "" + month
    while(num.length < padding) num = "0" + num
    return num
}