$(document).ready(async function () {

    let genbaID = getUrlParameter('genbaID')
    let genbaName = getUrlParameter('genbaName')
    // let genbaID = "610c7d73c3640304088b6735"

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
            initSummaryTable($('#yosan-summary-tbody'))
        }

        if (document.querySelector('#yosan-tbody')) {
            initFullTable($('#yosan-tbody'))
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
                    for (var index = 0; index < data.length; index++) {
                        var element = data[index]
                        if (element.el) {
                            koushuSelect.append('<option value="' + element.el+'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!koushuSelect.hasClass('globalselector')) {
                        koushuSelect.val('')
                        if (!koushuSelect.attr('value')) {
                            koushuSelect.val('')
                        } else {
                            koushuSelect.val(koushuSelect.attr('value'))
                        }
                        koushuSelect.niceSelect('update')
                    } else {
                        if (!koushuSelect.hasClass('init-on')) {
                            koushuSelect.addClass('init-on')
                            koushuSelect.val(koushuSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSummaryTable(tbody) {
        var query = {
            genbaID: genbaID,
            estimate: 1 // estimation of profit
        }
        request2GetSummaryData(query)
    }

    function initFullTable(tbody) {
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
                            var selectKoushu = element.find('.input-koushu')
                            var inputTekiyou = element.find('.input-tekiyou')
                            var inputSubTotal = element.find('.input-subtotal')

                            selectKoushu.val('')
                            selectKoushu.niceSelect('update')
                            inputTekiyou.val('')
                            inputSubTotal.val('')
                        }
                    }
                })

                updateTotalPrice(firstElement.parent())

                // update table with new elements
                initFullTable($('#yosan-tbody'))
            })
        })
    
        $('body').on('click', '#form-alert .close', function() {
            hideFormAlert()
        })
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
                    html += '<tr class="' + subitemClazz + ' collapse show" aria-labelledby="'+ id + '" style=""><td class="py-1 pl-1 bg-lightgray"></td><td class="py-1 pl-1">' + subitem.工種 + '</td><td class="py-1 pl-1">' + (subitem.摘要 === undefined ? '' : subitem.摘要) + '</td><td class="py-1 pr-1 text-right">' + numberFormat(subitem.小計) + '</td><td class="py-1 pr-1 text-right">' + subitem.date + '</td></tr>'
                })
                
                index ++
            }
        })
   
        tbody.html(html)
    }

    function updateSummaryTableOnResponse(data) {
        var tbody = $('#yosan-summary-tbody')

        var deposit = data.契約金額 ? data.契約金額 : 0
        var budget = data.実行予算 ? data.実行予算 : 0
        var profit = data.予想粗利 ? data.予想粗利 : 0
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

        let result = {
            data: items
        }
        
        // console.log(result)
        $('#saving-progress').fadeIn(500)
        $.post('/api/update/yosan/', result, function (data) {
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

function paddingNumber(number, padding) {
    var num = "" + number
    while(num.length < padding) num = "0" + num
    return num
}

function formatedDateString(date) {
    return date.getFullYear() + '/' + paddingNumber(date.getMonth() + 1, 2) + '/' + paddingNumber(date.getDate(), 2)   
}