const monthFrom = 9
const monthTo = 8

const pNone = 0
const pThisMonth = 1
const pNextMonth = 2
const pNNextMonth = 3
const pThisPeriod = 4
const pPrevPeriod = 5
const pPPrevPeriod = 6

$(document).ready(async function () {
    let userID =  $('#userID').attr('data-value')
    let userLevel = $('#user-level').attr('data-value') // 1: admin, others: not admin

    let prevQuery = null
    let inprogressCount = 0

    let today = formatedDateString(new Date())

    if (!!document.querySelector('#daityouPage')) {
        search('all')
        setTimeout(() => { initForm() }, 1000)
        SUA({ event: '工事台帳ページ' })
    }

    function initForm() {

        // Tab
        $('body').on('click', '#nav-tab a', function () {
            var status = $(this).attr('data-name')
            search(status, true)
        })

        // Filter Button
        $('body').on('click', '#searchBtn', function () {
            var status = currentStatus()
            search(status, true)
        })

        $('body').on('click', '.filterBtn', function () {
            var status = $(this).attr('data-name') // all | inprogress | finished('not started' inclusive)
            search(status, true)
        })

        $('body').on('click', '.clearBtn', function () {
            var status = $(this).attr('data-name') // all | inprogress | finished('not started' inclusive)
            clearFilter(status)
        })

        $('body').on('change', '#input-keyword', function () {
            var status = currentStatus()
            search(status, true)
        })

        initListItems()
        initCheckGroup()

        function currentStatus() {
            var status = 'all'
            var tabs = $('#nav-tab')
            $.each(tabs.find('a'), function () {
                if ($(this).hasClass('active')) {
                    status = $(this).attr('data-name')
                }
            })
            return status
        }

        function clearFilter(status) {
            var formID = '#filter-panel-' + status
            $(formID + ' .deposit-range div input[name="deposit-min"]').val('')
            $(formID + ' .deposit-range div input[name="deposit-max"]').val('')
            $(formID + ' .period-range .btn-group-toggle .btn-group .active').removeClass('active')
            // $(formID + ' .period-range .btn-group-toggle .btn-group :first-child').addClass('active')
        }
    }

    function search(status, isFilter) {
        var keyword = $('#input-keyword').val()

        var query = { status: status, today: today }
        if (userLevel != 1) {
            query.userID = userID
        }
        if (keyword) query.keyword = keyword

        if (isFilter) {
            var formID = '#filter-panel-' + status
           
            var depositMin = $(formID + ' .deposit-range div input[name="deposit-min"]').val()
            var depositMax = $(formID + ' .deposit-range div input[name="deposit-max"]').val()
           
            depositMin = parseInt(depositMin)
            depositMax = parseInt(depositMax)
            if (isNaN(depositMin)) depositMin = 0
            if (isNaN(depositMax)) depositMax = 0

            if (depositMin > 0) query.depositMin = depositMin
            if (depositMax > 0) query.depositMax = depositMax

            var period = pNone
            var periodGroup = $(formID + ' .period-range .btn-group-toggle .btn-group')
            $.each(periodGroup.find('label'), function() {
                if ($(this).hasClass('active')) {
                    var value = $(this).find('input').val()
                    if (value)
                        period = parseInt(value)
                }
            })

            if (period != pNone) {

                var _today = new Date()

                switch (period) {
                    case pThisMonth: {
                        var daysOfMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0).getDate()
                        _today.setDate(daysOfMonth)
                        _today.setDate(_today.getDate())
                        query.period_max = formatedDateString(_today)
                        break
                    }
                    case pNextMonth: {
                        _today.setDate(1)
                        _today.setMonth(_today.getMonth() + 1)
                        var daysOfMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0).getDate()
                        _today.setDate(daysOfMonth)
                        query.period_max = formatedDateString(_today)
                        break
                    }
                    case pNNextMonth: {
                        _today.setDate(1)
                        _today.setMonth(_today.getMonth() + 2)
                        var daysOfMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0).getDate()
                        _today.setDate(daysOfMonth)
                        query.period_max = formatedDateString(_today)
                        break
                    }

                    case pThisPeriod:
                    case pPrevPeriod:
                    case pPPrevPeriod:
                    {
                        var min = new Date()
                        var max = new Date()
                        var thisYear = _today.getFullYear()
                        min.setDate(1)
                        max.setDate(31)
                        min.setMonth(monthFrom - 1)
                        max.setMonth(monthTo - 1)

                        if ((_today.getMonth() + 1) > 8) { // from 9月 to next-year.8月

                            if (period == pThisPeriod)
                                max.setFullYear(thisYear + 1)
                            else if (period == pPrevPeriod) {
                                min.setFullYear(thisYear - 1)
                                max.setFullYear(thisYear)
                            } else { // pPPrevPeriod
                                min.setFullYear(thisYear - 2)
                                max.setFullYear(thisYear - 1)
                            }

                        } else { // from prev-year.9月 to 8月

                            if (period == pThisPeriod)
                                min.setFullYear(thisYear - 1)
                            else if (period == pPrevPeriod) {
                                min.setFullYear(thisYear - 2)
                                max.setFullYear(thisYear - 1)
                            }
                            else { // pPrevPeriod
                                min.setFullYear(thisYear - 3)
                                max.setFullYear(thisYear - 2)
                            }
                        }

                        query.period_min = formatedDateString(min)
                        query.period_max = formatedDateString(max)
                        break
                    }
                }
            }
        }

        // console.log({message:'query', query:query})
        if (prevQuery && JSON.stringify(prevQuery) == JSON.stringify(query)) {
            // console.log("same query")
        } else {
            // console.log(query)
            prevQuery = query
            request2GetFilteredData(status, query)
        }
    }

    function request2GetFilteredData(status, query) {
        $('#searching-progress').fadeIn(500)
        $.post('/api/daityou/', query, function (data) {
            // console.log(data)
            updateListOnResponse(status, data)
            setTimeout(() => {
                $('#searching-progress').fadeOut(500)
            }, 1000);
        })
    }

    function updateListOnResponse(status, data) {
        let ul = $('#listGenbas')

        var depositSum = 0
        var costSum = 0
        var profitSum = 0

        if (!data || data.length == 0) {
            ul.html('')
            $('#summary-tbody').html('<tr class="text-right font-weight-bold"><td class="py-2 px-2" id="deposit-amount-all">0</td><td class="px-2" id="prime-cost-all">0</td><td class="px-2" id="expect-profit-all">0</td></tr>')
            return
        }

        var _inprogressCount = 0

        var html = ''
        data.forEach(function(item) {

            var _id = item._id // genbaID
            var genbaName = item.工事名
            var _cost = item.cost
            var cost = numberFormat(_cost)
            var sale = numberFormat(item.sale)
            var _profit = item.profit
            var profit = numberFormat(_profit)
            var profitRate = item.profitRate
            if (profitRate === undefined) profitRate = 'ー'
            else profitRate = numberFormat(profitRate) + '%'
            var budget = numberFormat(item.budget)
            var _deposit = item.契約金額 || 0
            var deposit = numberFormat(_deposit)
            var dateFrom = item['工期(自)']
            var dateTo = item['工期(至)']
            // var status = item.status
            var status = item.完了状況 || '進行中'

            depositSum += _deposit
            costSum += _cost
            profitSum += _profit

            var userName = ''
            if (item.userName) {
                userName = item.userName
            } else if (item.userNames) {
                var userNames = item.userNames
                var n = userNames.length || 0
                if (n > 0) {
                    for (var i = 0; i < n-1; i++) {
                        userName += userNames[i] + '、'
                    }
                    userName += userNames[n-1]
                }
            }

            var statusSpan
            // if (!dateFrom) { // not started
            //     statusSpan = '<span class="label-status align-self-center div-btn-outline-dark div-btn-rounded div-btn-sm">未受注</span>'
            // } else if (dateFrom <= today && dateTo >= today) { // in progress
            //     statusSpan = '<span class="align-self-center div-btn-outline-primary div-btn-rounded div-btn-sm">進行中</span>'
            //     _inprogressCount ++
            // } else if (dateTo < today) { // finished
            //     statusSpan = '<span class="label-status align-self-center div-btn-dark div-btn-rounded div-btn-sm">完了</span>'
            // } else { // default : not started
            //     statusSpan = '<span class="label-status align-self-center div-btn-outline-dark div-btn-rounded div-btn-sm">未受注</span>'
            // }
            if (status == '進行中') { // not started
                statusSpan = '<span class="label-status align-self-center div-btn-outline-dark div-btn-rounded div-btn-sm">進行中</span>'
                _inprogressCount ++
            } else if (status == '進行中') { // in progress
                statusSpan = '<span class="align-self-center div-btn-outline-primary div-btn-rounded div-btn-sm">進行中</span>'
                _inprogressCount ++
            } else if (status == '完了') { // finished
                statusSpan = '<span class="label-status align-self-center div-btn-dark div-btn-rounded div-btn-sm">完了</span>'
            } else { // default : not started
                statusSpan = '<span class="label-status align-self-center div-btn-outline-dark div-btn-rounded div-btn-sm">進行中</span>'
                _inprogressCount ++
            }

            html +=
            '<li class="list-group-item mb-2 px-0" data-value="' + _id + '"><div class="d-flex"><div class="align-self-center px-sm-4"><input class="check-input genba-checkbox" type="checkbox" style="cursor:pointer" checked data-deposit="' + _deposit + '" data-cost="' + _cost + '" data-profit="' + _profit + '"></div><div class="listitem-body clickable-no-hover col px-0" data-link="/dashboard/daityou/genba?genbaID=' + _id + '&genbaName=' + genbaName + '"><h5 class="label-genba-name mb-3">' + genbaName +'</h5><div class="d-flex">' + statusSpan + '<div class="pl-sm-4 pr-0"><div class="d-flex text-right"><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1" style="width:100px">契約金額:</div><div class="label-deposit flex-grow-1" style="width:100px">' + deposit + '</div></div></div><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1 font-weight-bold" style="width:100px">粗利益:</div><div class="label-profit flex-grow-1 font-weight-bold" style="width:100px">' + profit + '</div></div></div></div><div class="d-flex text-right"><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1" style="width:100px">原価:</div><div class="label-cost flex-grow-1" style="width:100px">' + cost + '</div></div></div><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1" style="width:100px">粗利益率:</div><div class="label-profit-rate flex-grow-1 font-weight-bold" style="width:100px">' + profitRate + '</div></div></div></div><div class="d-flex text-right small"><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1" style="width:100px">実行予算:</div><div class="label-budget flex-grow-1" style="width:100px">' + budget + '</div></div></div><div class="flex-grow-1"><div class="d-md-flex p-2"><div class="flex-grow-1" style="width:100px"></div><div class="flex-grow-1" style="width:100px"></div></div></div></div><div class="d-flex mt-4 small text-center"><div class="flex-grow-1" style="width:100px">自</div><div class="flex-grow-1" style="width:100px">至</div><div class="flex-grow-1" style="width:100px">担当</div></div><div class="d-flex py-2 text-center"><div class="label-date-from flex-grow-1" style="width:100px">' + dateFrom + '</div><div class="label-date-to flex-grow-1" style="width:100px">' + dateTo + '</div><div class="label-user flex-grow-1" style="width:100px">' + userName + '</div></div></div></div></div></div></li>'

            $('#batch-check').prop('checked', true)
        })
        if (inprogressCount == 0) {
            inprogressCount = _inprogressCount
            $('#inprogress-count').html(inprogressCount)
        }

        ul.html(html)
        setSummaryTable(depositSum, costSum, profitSum)
    }

    function initListItems() {
        $('body').on('click', '.listitem-body', function () {
            if ($(this).attr('data-link')) {
                window.location = new URL(window.location.origin + $(this).attr('data-link'))
            }
        })
    }

    function initCheckGroup() {
        $('#batch-check').click(function(){
            if($(this).is(':checked')){
                $('.genba-checkbox').prop('checked', true)
            }
            else {
                $('.genba-checkbox').prop('checked', false)
            }
            updateSummaryTable()
        })

        $('.genba-checkbox').click(function(){
            // var cnt = $(".genba-checkbox:checked").length
            updateSummaryTable()
        })
    }

    function updateSummaryTable() {
        var depositSum = 0
        var costSum = 0
        var profitSum = 0

        $.each($(".genba-checkbox:checked"), function () {
            var deposit = $(this).attr('data-deposit')
            var cost = $(this).attr('data-cost')
            var profit = $(this).attr('data-profit')
            if (deposit !== undefined) depositSum += parseInt(deposit)
            if (cost !== undefined) costSum += parseInt(cost)
            if (profit !== undefined) profitSum += parseInt(profit)
        })

        setSummaryTable(depositSum, costSum, profitSum)
    }

    function setSummaryTable(depositSum, costSum, profitSum) {
        $('#summary-tbody').html('<tr class="text-right font-weight-bold"><td class="py-2 px-2" id="deposit-amount-all">' + numberFormat(depositSum) + '</td><td class="px-2" id="prime-cost-all">' + numberFormat(costSum) + '</td><td class="px-2" id="expect-profit-all">' + numberFormat(profitSum) + '</td></tr>')
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

function formatedDateString(date) {
    return date.getFullYear() + '/' + paddingNumber(date.getMonth() + 1, 2) + '/' + paddingNumber(date.getDate(), 2)
}

// function _formatedDateString(year, month, date) {
    // return year + '/' + paddingNumber(month, 2) + '/' + paddingNumber(date, 2)
// }