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

        if (document.querySelector('#spline-chart')) {
            initSplineChart()
        }
    }

    function initGenbaTable() {
        var query = {
            genbaID: genbaID
        }

        $.post('/api/genba-detail/', query, function (data) {
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
            console.log(data)
            drawCostBarChart('#cost-barchart', data)
        })
    }

    function initSplineChart() {
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
            drawSplineChart('#spline-chart', data)
        })
    }

    function updateYosanTableOnResponse(data) {
        deposit = data.契約金額 ? data.契約金額 : 0
        budget = data.実行予算 ? data.実行予算 : 0
        profit = data.予想粗利 ? data.予想粗利 : 0
        profitRate = data.粗利率
        sale = data.売上 ? data.売上 : 0
        cost = data.原価 ? data.原価 : 0

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

    function drawSplineChart(selector, data) {

        let hasDrawn = false

        let yearBase = data.yearBase
        let costs = data.costs
        let sales = data.sales

        let datesHeader = periodHeaderDates(yearBase)
        let dates = periodDates(yearBase)
        let costsFull = paddingCosts(dates, costs)
        let salesFull = paddingSales(dates, sales)

        let costsGraphData = []
        let salesGraphData = []
        for (var i = 0; i < 12; i++) {
            var header = datesHeader[i]
            costsGraphData.push([header, costsFull[i]])
            salesGraphData.push([header, salesFull[i]])
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
})

function paddingCosts(dates, costs) {
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

function paddingSales(dates, sales) {
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