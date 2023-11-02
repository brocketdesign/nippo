$(document).ready(async function () {

    let genbaID = getUrlParameter('genbaID')
    let genbaName = getUrlParameter('genbaName')
    // let genbaID = "610c7d73c3640304088b6735"

    let koushuData = null;

    //NIPPO FORM PAGE
    if (!!document.querySelector('#daityouYosanPage')) {
        initNavBar()
        inputInit()
        tableInit()
        setTimeout(() => { initForm() }, 1000)
        SUA({ event: '実行予算ページ' })
    }

    function initNavBar() {
        $('#title').html(genbaName)
        var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName
        $('#nav-genba').attr('href', '/dashboard/daityou/genba?' + urlParams)
        $('#nav-sihara').attr('href', '/dashboard/daityou/sihara_ichiran?' + urlParams)
        $('#nav-ichiran').attr('href', '/dashboard/daityou/genba_ichiran?' + urlParams)
        // $('#nav-yosan').attr('href', '/dashboard/daityou/yosan?' + urlParams)
    }

    function inputInit() {
    
        // Global Selector
        if (document.querySelector('#input-company')) {
            initSelectCompany($('#input-company'))
        }

        // Element Selector
        if (document.querySelector('.input-koushu-yosan')) {
            initSelectKoushu($('.input-koushu-yosan'))
        }
    }

    function tableInit() {
        if (document.querySelector('#yosan-summary-tbody')) {
            initSummaryTable()
        }

        if (document.querySelector('#yosan-tbody')) {
            initFullTable()
        }
    }

    function initSelectCompany(allSelect) {
        console.log({
            event: 'companyInit'
        })
        allSelect.each(function () {
            let companySelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/daityou/company", function (data) {
                    data = sortit(data, '業社名kana')
                    for (var index = 0; index < data.length; index++) {
                        let element = data[index]
                        companySelect.append('<option value="' + element.el+'" data-id="' + element._id + '" data-kana="' + element.業社名kana + '">' + element.el+' </option>')
                    }
                    if (!companySelect.hasClass('globalselector')) {
                        companySelect.val('')
                        if (!companySelect.attr('value')) {
                            companySelect.val('')
                        } else {
                            companySelect.val(companySelect.attr('value'))
                        }
                        companySelect.niceSelect('update')
                    } else {
                        if (!companySelect.hasClass('init-on')) {
                            companySelect.addClass('init-on')
                            companySelect.val(companySelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectKoushu(allSelect) {
        console.log({
            event: 'koushuInit'
        })
        allSelect.each(function () {
            let koushuSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/koushu", function (data) {
                    koushuData = data
                    generateKoushuSelect(koushuSelect, data)
                })
            }
        })
    }

    function generateKoushuSelect(selector, data) {
        for (var index = 0; index < data.length; index++) {
            var element = data[index]
            if (element.el) {
                selector.append('<option value="' + element.el+'" data-id="' + element._id+'">' + element.el+' </option>')
            }
        }
        if (!selector.hasClass('globalselector')) {
            selector.val('')
            if (!selector.attr('value')) {
                selector.val('')
            } else {
                selector.val(selector.attr('value'))
            }
            selector.niceSelect('update')
        } else {
            if (!selector.hasClass('init-on')) {
                selector.addClass('init-on')
                selector.val(selector.find("option:first").val()).change()
            }
        }
    }

    function initSummaryTable() {
        var query = {
            genbaID: genbaID,
            estimate: 1 // estimation of profit
        }
        request2GetSummaryData(query)
    }

    function initFullTable() {
        var query = {
            genbaID: genbaID
        }
        request2GetFullData(query)
    }

    function initForm() {

        //
        // Save Form
        //

        //ADDING GROUP
        $('body').on('click', '#addGroup', function (e) {
            addElement()
        })

        //REMOVE GROUP FIELD
        $('body').on('click', '.removeGroup', function () {
            removeElement(this)
        })

        // Input Sub Total Price
        $('body').on('keyup', '.input-subtotal', function () {
            var elements = $(this).parent().parent().parent()
            updateTotalPrice(elements)
        })

        $('body').on('click', '#saveBtn', function() {
            saveToDB(function (msg) {
                // error
                if (msg) {
                    console.log(msg.message)
                    return
                }

                // success

                // initialize elements
                let firstElement

                let formID = '.form-container'
                let elements = $('body').find(formID + ' .elements')
                $.each(elements.children(), function() {
                    var element = $(this)
                    if (element.hasClass('element')) {
                        if (element.attr('data-value') > 1) {   // remove all elements excepting the first one
                            element.remove()
                        } else {                                // initialize the values for the first element
                            firstElement = element
                            var selectKoushu = element.find('.input-koushu-yosan')
                            var inputTekiyou = element.find('.input-tekiyou')
                            var inputSubTotal = element.find('.input-subtotal')

                            selectKoushu.val('')
                            selectKoushu.niceSelect('update')
                            inputTekiyou.val('')
                            inputSubTotal.val('')

                            // initialize the global controls
                            var selectCompany = $('#input-company')
                            selectCompany.val('')
                            selectCompany.niceSelect('update')
                        }
                    }
                })

                updateTotalPrice(firstElement.parent())

                // update table with new elements
                initSummaryTable()
                initFullTable()
            })
        })
    
        $('body').on('click', '#form-alert .close', function() {
            hideFormAlert()
        })

        $('body').on('click', '.td-koushu', function() {
            if ($(this).hasClass('in-edit-koushu')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-koushu')
            
            var currKoushu = $(this).html()
            $(this).html('')

            var formID = '.form-container'
            var inputKoushu = $(formID + ' .form-group .form-row.element div .input-koushu-yosan').first().clone()
            var selectKoushu = $(formID + ' .form-group .form-row.element div .nice-select').first().clone()
            inputKoushu.attr('name', 'item-koushu')

            inputKoushu.val(currKoushu)
            selectKoushu.find('.current').html(currKoushu)

            $(this).append(inputKoushu)
            $(this).append(selectKoushu)
        })

        $('body').on('click', '.td-bikou', function () {
            if ($(this).hasClass('in-edit-bikou')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-bikou')

            var currBikou = $(this).html()
            $(this).html('<input class="py-2 px-2 w-100" name="item-bikou" value="' + currBikou + '">')
            $('.in-edit-bikou input').focus()
        })

        $('body').on('click', '.td-subtotal', function () {
            if ($(this).hasClass('in-edit-subtotal')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-subtotal')

            var currSubtotal = $(this).html()
            $(this).html('<input class="py-2 px-2 w-100" name="item-subtotal" value="' + stringFormatedNumber(currSubtotal) + '">')
            $('.in-edit-subtotal input').focus()
        })

        $('body').on('click', '.td-date', function () {
            if ($(this).hasClass('in-edit-date')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-date')

            var currDate = $(this).html()
            $(this).html('<input class="border rounded py-2 w-100" type="text" name="item-date">')

            // const todayJP = date.toLocaleDateString('ja-JP', options)
            var date = new Date(currDate)
            var dateStr = date.toLocaleDateString('ja-JP', options)
            var dateSelect = $('.in-edit-date input')
            // dateSelect.val(dateStr)
            dateSelect.val(currDate)
            dateSelect.attr('data-date', currDate)
            dateSelect.addClass('isweekend-' + dateStr.substring(dateStr.indexOf('(')).replace('(', '').replace(')', ''))
            
            dateSelect.datepicker({
                language: "ja",
                format: 'yyyy/mm/dd',
                autoclose: true,
                // startDate: null,
                endDate: new Date(),
                orientation: "right"
            }).on('changeDate', function (e) {
                let dd = new Date(e.date)
                let ct = formatedDateString(dd)
                let options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                }
                const dJP = dd.toLocaleDateString('ja-JP', options)
                console.log(ct);
                dateSelect.val(ct)
                isweekendClass(dateSelect)
                dateSelect.addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
                dateSelect.attr('data-date', ct)
                finishItemEdit()
            })
        })

        $('body').on('click', '.ic-td-trash', function () {
            var _id = $(this).parent().attr('data-id')
            var query = {_id: _id}
            $.post('/api/delete/yosan', query, function (data) {
                if (data && data.result && data.result == 'ok') {
                    // $(this).parent().parent()
                    initSummaryTable()
                    initFullTable()
                }
            })
        })

        setItemEditFinishEvent()
    }

    function setItemEditFinishEvent() {
        $('body').on('change', 'select[name="item-koushu"]', function () {
            finishItemEdit()
        })
        $('body').on('keypress', 'input[name="item-bikou"], input[name="item-subtotal"]', function (e) {
            if (e.which == 13)
                finishItemEdit()
        })
        $('body').on('click', 'tr[data-toggle="collapse"], td.td-id, thead', function () {
            finishItemEdit()
        })
        $('body').keyup(function (e) {
            if (e.keyCode == 27)
                finishItemEdit()
        })
    }

    function finishItemEdit() {
        var _id = null
        var koushu = null
        var bikou = null
        var subtotal = null
        var date = null

        var editKoushu = $('.in-edit-koushu')
        if (editKoushu.length > 0) {
            var val = editKoushu.find('select').val()
            editKoushu.remove('select')
            editKoushu.remove('div')
            editKoushu.removeClass('in-edit-koushu')
            editKoushu.html(val)
            koushu = val
            _id = editKoushu.parent().find('.td-id').attr('data-id')
        }

        var editBikou = $('.in-edit-bikou')
        if (editBikou.length > 0) {
            var val = editBikou.find('input').val()
            editBikou.removeClass('in-edit-bikou')
            editBikou.html(val)
            bikou = val
            _id = editBikou.parent().find('.td-id').attr('data-id')
        }

        var editSubtotal = $('.in-edit-subtotal')
        if (editSubtotal.length > 0) {
            var val = editSubtotal.find('input').val()
            editSubtotal.removeClass('in-edit-subtotal')
            if (isNaN(val)) {
                editSubtotal.html(0)
                val = 0
            } else {
                editSubtotal.html(numberFormat(val))
            }
            subtotal = val
            _id = editSubtotal.parent().find('.td-id').attr('data-id')
        }

        var editDate = $('.in-edit-date')
        if (editDate.length > 0) {
            var val = editDate.find('input').val()
            editDate.removeClass('in-edit-date')
            editDate.html(val)
            date = val
            _id = editDate.parent().find('.td-id').attr('data-id')
        }

        var query = {}
        if (_id) {
            query['_id'] = _id
            if (koushu)
                query['工種'] = koushu
            if (bikou)
                query['摘要'] = bikou
            if (subtotal) {
                query['小計'] = subtotal
            }
            if (date)
                query['date'] = date

            if (Object.keys(query).length > 0) {
                console.log(query)
                $('#saving-progress').fadeIn(500)
                $.post('/api/update/yosan/element/', query, function (data) {
                    console.log(data)
                    setTimeout(() => {
                        $('#saving-progress').fadeOut(500)
                    }, 1000);
                })
            }
        }

    }

    function updateTotalPrice(elements) {

        let formContainer = elements.parent()

        // sum of the elements subtotals
        let totalPriceLabel = formContainer.find('#label-totalprice')

        let totalPrice = 0
        $.each(elements.children(), function () {
            var element = $(this)
            if (element.hasClass('element')) {
                var inputSubTotal = element.find('.input-subtotal')
                var price = parseInt(inputSubTotal.val())
                if (!isNaN(price)) {
                    totalPrice += price
                }
            }
        })

        // show price as text
        totalPriceLabel.text(numberFormat(totalPrice) + ' 円')
    }

    function addElement() {
        let formID = '.form-container'
        let group = $(formID + ' .form-group .form-row.element').last().clone()
        let currVal = parseInt(group.attr('data-value')) + 1
        if (currVal > 10) {
            alert('Maximum entry is 10')
        } else {
            group.attr('data-value', currVal)
            group.find('.removeGroup').attr('data-value', currVal)
            $(formID + ' .form-group.elements').append(group).fadeIn(500)
            $.each(group.find('input'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).val('').change()
                    $(this).attr('value', '')
                }
            })
            $.each(group.find('select'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).val('').change()
                    $(this).niceSelect('update')
                }
            })
        }
    }

    function removeElement(self) {
        let formID = '.form-container'
        if ($('body').find(formID + ' .form-group .form-row.element').length > 1) {
            $(formID + ' .form-group .form-row.element[data-value="' + $(self).attr('data-value') + '"]').fadeOut(500, function () {
                $(this).remove()

                // update total price label after removing
                let elements = $('body').find(formID + ' .elements')
                updateTotalPrice(elements)
            })

        }
        setTimeout(() => {
            updateElementIndex(formID)
        }, 2000)
    }

    function updateElementIndex(formID) {
        $(formID).find('.form-group.element').each(function (index, value) {
            index = index + 1
            $(this).attr('data-value', index)
            $.each($(this).find('.removeGroup'), function () {
                $(this).attr('data-value', index)
            })
            $.each($(this).find('input'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                }
            })
            $.each($(this).find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                } else {
                    if($(this).attr('data-name')) {
                        let name = $(this).attr('data-name').substring(0, $(this).attr('data-name').indexOf('-') + 1)
                        $(this).attr('data-name', name + index)
                    }
                }
            })
        })
    }

    function updateFullTableOnResponse(data) {
        let tbody = $('#yosan-tbody')

        var html = ''
        var index = 0

        data.forEach(function (item) {
            
            var companyID = item._id
            var subdata = item.data
            if (subdata.length > 0) {
            
                var company = subdata[0].company

                var id = 'subheader-' + index
                var subitemClazz = 'collapse-' + index

                // sub header
                html += '<tr class="bg-lightgray" id="' + id + '" data-toggle="collapse" data-target=".' + subitemClazz + '" aria-expanded="true" aria-controls="' + subitemClazz + '" style="cursor:pointer"><td class="py-1 pl-1">' + company.el +
                        '<span data-feather="chevron-down" class="pr-1 float-left off d-inline"></span><span data-feather="chevron-up" class="pr-1 float-left on d-none"></span></td><td></td><td> </td><td></td><td></td></tr>'

                // sub data
                subdata.forEach(function (subitem) {
                    html += '<tr class="' + subitemClazz + ' collapse show" aria-labelledby="'+ id + '" style=""><td class="td-id py-1 pl-1 bg-lightgray text-center" data-id="' + subitem._id + '"><span data-feather="trash" class="py-1 ic-td-trash"></span></td><td class="py-1 pl-1 td-koushu">' + subitem.工種 + '</td><td class="py-1 pl-1 td-bikou">' + (subitem.摘要 === undefined ? '' : subitem.摘要) + '</td><td class="py-1 pr-1 text-right td-subtotal">' + numberFormat(subitem.小計) + '</td><td class="py-1 pr-1 text-right td-date">' + subitem.date + '</td></tr>'
                })
                
                index ++
            }
        })
   
        tbody.html(html)
    }

    function updateSummaryTableOnResponse(data) {
        var tbody = $('#yosan-summary-tbody')

        var deposit = data.契約金額 || 0
        var budget = data.実行予算 || 0
        var profit = data.予想粗利 || 0
        var _profitRate = data.粗利率
        var profitRate = data.粗利率 ? numberFormat(_profitRate) + '%' : 'ー'
        var html = '<tr><td class="py-2 pr-1">' + numberFormat(deposit) + '</td><td class="pr-1">' + numberFormat(budget) + '</td><td class="pr-1">' + numberFormat(profit) + '</td><td class="pr-1">' + profitRate + '</td></tr>'
   
        tbody.html(html)
    }

    function request2GetSummaryData(query, callback) {
        $.post('/api/yosan-summary/', query, function (data) {
            // console.log(data)
            updateSummaryTableOnResponse(data)
        })
    }

    function request2GetFullData(query, callback) {
        $.post('/api/yosan/', query, function (data) {
            // console.log(data)
            updateFullTableOnResponse(data)
        })
    }

    function saveToDB(callback) {
        let formId = '.form-container'

        // let selectCompany = document.getElementById("input-company")
        // let selectedCompany = selectCompany.options[selectCompany.selectedIndex]
        if ($('#input-company').find('option:checked').length == 0) {
            showFormAlert("You must select company")
            return
        }
        // console.log(selectedCompany)
        // console.log(selectedCompany.getAttribute('data-id'))
        // console.log(selectedCompany.getAttribute('data-kana'))
        // console.log(selectedCompany.value)
        
        let elements = $(formId).find('.elements')
        let items = []

        let company = {
            // _id: selectedCompany.getAttribute('data-id'),
            _id: $('#input-company').find('option:checked').attr('data-id'),
            el: $('#input-company').val()
        }
        // let kana = selectedCompany.getAttribute('data-kana')
        let kana = $('#input-company').find('option:checked').attr('data-kana')
        if (kana) {
            company.業社名kana = kana
        }

        let ct = formatedDateString(new Date())

        $.each(elements.children(), function () {
            let element = $(this)
            if (element.hasClass('element')) {
                let selectKoushu = element.find('.input-koushu-yosan')
                let inputTekiyou = element.find('.input-tekiyou')
                let inputSubTotal = element.find('.input-subtotal')

                let koushu = selectKoushu.val()
                let tekiyou = inputTekiyou.val()
                let subtotal = parseInt(inputSubTotal.val())

                if (isNaN(subtotal) || subtotal == 0) {
                    showFormAlert("You must input 小計")
                    return
                }

                let data = {
                    genba: genbaID,
                    company: company,
                    date: ct,
                    小計: subtotal
                }
                if (koushu) {
                    data.工種 = koushu
                }
                if (tekiyou) {
                    data.摘要 = tekiyou
                }
                items.push(data)
            }
        })

        if (items.length == 0) {
            if (callback) {
                callback({message:"empty data"})
            }
            return
        }

        let query = {
            data: items
        }
        
        $('#saving-progress').fadeIn(500)
        $.post('/api/update/yosan/', query, function (data) {
            // console.log(data)
            setTimeout(() => {
                $('#saving-progress').fadeOut(500)
                if (callback) { callback() }
            }, 1000);
        })
    }

    function showFormAlert(message) {
        $('#form-alert .message').text(message)
        $('#form-alert').removeClass('d-none')
    }

    function hideFormAlert() {
        $('#form-alert').addClass('d-none')
    }
})

function numberFormat(number) {
    return new Intl.NumberFormat('ja-JP').format(number)
}

function stringFormatedNumber(numberStr) {
    if (numberStr) {
        return numberStr.replace(/,/g, '')
    }
    return '0'
}

function paddingNumber(number, padding) {
    var num = "" + number
    while(num.length < padding) num = "0" + num
    return num
}

function formatedDateString(date) {
    return date.getFullYear() + '/' + paddingNumber(date.getMonth() + 1, 2) + '/' + paddingNumber(date.getDate(), 2)   
}