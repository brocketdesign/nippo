$(document).ready(async function () {

    let prevQuery = null

    //NIPPO FORM PAGE
    if (!!document.querySelector('#inoutcomePage')) {
        inputInit()
        setTimeout(() => { initForm() }, 1000)
        SUA({ event: '入出金管理ページ' })
    }

    function inputInit() {

        // Global Selectors

        if (document.querySelector('.input-kouza')) {
            initSelectKouza($(document).find('select.input-kouza'))
        }

        if (document.querySelector('.input-torihiki')) {
            initSelectTorihiki($(document).find('select.input-torihiki'))
        }

        if (document.querySelector('.input-hattyu')) {
            initSelectHattyu($(document).find('select.input-hattyu'))
        }

        if (document.querySelector('.input-gyousha')) {
            initSelectGyousha($(document).find('select.input-gyousha'))
        }

        // Element Selectors

        if (document.querySelector('.input-kanjoukamoku')) {
            initSelectKanjoukamoku($(document).find('select.input-kanjoukamoku'))
        }

        if (document.querySelector('.input-genba-daityou')) {
            initSelectGenba($(document).find('select.input-genba-daityou'))
        }

        if (document.querySelector('.input-zeiritu')) {
            initSelectZeiritu($(document).find('select.input-zeiritu'))
        }

        if (document.querySelector('.label-subtotal')) {
            initLabelSubTotalPrice($(document).find('.label-subtotal'))
        }

        if (document.querySelector('.label-totalprice')) {
            initLabelTotalPrice($(document).find('.label-totalprice'))
        }

        // Date

        if (document.querySelector('.input-date-inoutcome')) {
            initDate($(document).find('.input-date-inoutcome'))
        }

        if (document.querySelector('.input-date-filter')) {
            initDate($(document).find('.input-date-filter'))
        }

        if (document.querySelector('#inoutcome-filtered-tbody')) {
            initTable()
        }
    }

    function initSelectKouza(allSelect) {
        console.log({
            event: 'kouzaInit'
        })
        allSelect.each(function () {
            let kouzaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/kouza", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            kouzaSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!kouzaSelect.hasClass('globalselector')) {
                        kouzaSelect.val('')
                        if (!kouzaSelect.attr('value')) {
                            kouzaSelect.val('')
                        } else {
                            kouzaSelect.val(kouzaSelect.attr('value'))
                        }
                        kouzaSelect.niceSelect('update')
                    } else {
                        if (!kouzaSelect.hasClass('init-on')) {
                            kouzaSelect.addClass('init-on')
                            kouzaSelect.val(kouzaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectTorihiki(allSelect) {
        console.log({
            event: 'torihikiInit'
        })
        allSelect.each(function () {
            let torihikiSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/daityou/hattyu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        torihikiSelect.append('<option value="' + element.発注者 +'" data-id="' + element._id+'">' + element.発注者+' </option>')
                    }
                    torihikiSelect.val('')
                    if (!torihikiSelect.attr('value')) {
                        torihikiSelect.val('')
                    } else {
                        torihikiSelect.val(torihikiSelect.attr('value'))
                    }
                    torihikiSelect.niceSelect('update')
                })

                $.get("/api/company", function (data) {
                    data = sortit(data, '業社名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            torihikiSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    torihikiSelect.val('')
                    if (!torihikiSelect.attr('value')) {
                        torihikiSelect.val('')
                    } else {
                        torihikiSelect.val(torihikiSelect.attr('value'))
                    }
                    torihikiSelect.niceSelect('update')
                })
            }
        })
    }

    function initSelectHattyu(allSelect) {
        console.log({
            event: 'hattyuInit'
        })
        allSelect.each(function () {
            let hattyuSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/daityou/hattyu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        hattyuSelect.append('<option value="' + element.発注者 +'" data-id="' + element._id+'">' + element.発注者+' </option>')
                    }
                    if (!hattyuSelect.hasClass('globalselector')) {
                        hattyuSelect.val('')
                        if (!hattyuSelect.attr('value')) {
                            hattyuSelect.val('')
                        } else {
                            hattyuSelect.val(hattyuSelect.attr('value'))
                        }
                        hattyuSelect.niceSelect('update')
                    } else {
                        if (!hattyuSelect.hasClass('init-on')) {
                            hattyuSelect.addClass('init-on')
                            hattyuSelect.val(hattyuSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectGyousha(allSelect) {
        console.log({
            event: 'gyoushaInit'
        })
        allSelect.each(function () {
            let gyoushaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/company", function (data) {
                    data = sortit(data, '業社名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            gyoushaSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!gyoushaSelect.hasClass('globalselector')) {
                        gyoushaSelect.val('')
                        if (!gyoushaSelect.attr('value')) {
                            gyoushaSelect.val('')
                        } else {
                            gyoushaSelect.val(gyoushaSelect.attr('value'))
                        }
                        gyoushaSelect.niceSelect('update')
                    } else {
                        if (!gyoushaSelect.hasClass('init-on')) {
                            gyoushaSelect.addClass('init-on')
                            gyoushaSelect.val(gyoushaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectKanjoukamoku(allSelect) {
        console.log({
            event: 'kanjoukamokuInit'
        })
        allSelect.each(function () {
            let kanjoukamokuSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/kanjoukamoku?type=" + $(this).attr('data-name'), function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            kanjoukamokuSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!kanjoukamokuSelect.hasClass('globalselector')) {
                        kanjoukamokuSelect.val('')
                        if (!kanjoukamokuSelect.attr('value')) {
                            kanjoukamokuSelect.val('')
                        } else {
                            kanjoukamokuSelect.val(kanjoukamokuSelect.attr('value'))
                        }
                        kanjoukamokuSelect.niceSelect('update')
                    } else {
                        if (!kanjoukamokuSelect.hasClass('init-on')) {
                            kanjoukamokuSelect.addClass('init-on')
                            kanjoukamokuSelect.val(kanjoukamokuSelect.find("option:first").val()).change()
                        }
                    }
                    // console.log(data);
                })
            }
        })
    }

    function initSelectGenba(allSelect) {
        console.log({
            event: 'genbaInit'
        })
        allSelect.each(function () {
            let genbaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/genba", function (data) {
                    data = sortit(data, '工事名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.工事名) {
                            genbaSelect.append('<option value="' + element.工事名 +'" data-id="' + element._id+'">' + element.工事名+' </option>')
                        }
                    }
                    if (!genbaSelect.hasClass('globalselector')) {
                        genbaSelect.val('')
                        if (!genbaSelect.attr('value')) {
                            genbaSelect.val('')
                        } else {
                            genbaSelect.val(genbaSelect.attr('value'))
                        }
                        genbaSelect.niceSelect('update')
                    } else {
                        if (!genbaSelect.hasClass('init-on')) {
                            genbaSelect.addClass('init-on')
                            genbaSelect.val(genbaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectZeiritu(allSelect) {
        console.log({
            event: 'zeirituInit'
        })
        allSelect.each(function () {
            let zeirituSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/zeiritu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            zeirituSelect.append('<option value="' +  element.rate + '" data-id="' + element._id + '">' + element.el+' </option>')
                        }
                    }
                    if (!zeirituSelect.hasClass('globalselector')) {
                        zeirituSelect.val('')
                        if (!zeirituSelect.attr('value')) {
                            zeirituSelect.val('')
                        } else {
                            zeirituSelect.val(zeirituSelect.attr('value'))
                        }
                        zeirituSelect.niceSelect('update')
                    } else {
                        if (!zeirituSelect.hasClass('init-on')) {
                            zeirituSelect.addClass('init-on')
                            zeirituSelect.val(zeirituSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initLabelSubTotalPrice(allSelect) {
        console.log({
            event: 'subtotalInit'
        })
        allSelect.each(function () {
            $(this).text(currencyFormat(0))
        })
    }

    function initLabelTotalPrice(allSelect) {
        console.log({
            event: 'totalInit'
        })
        allSelect.each(function () {
            $(this).text(numberFormat(0) + ' 円')
        })
    }

    function initDate(allSelect) {
        console.log({
            event: 'dateInit'
        })
        allSelect.each(function () {
            let dateSelect = $(this)
            let today = formatedDateString(new Date())

            dateSelect.val(todayJP)
            dateSelect.attr('data-date', today)
            dateSelect.addClass('isweekend-' + todayJP.substring(todayJP.indexOf('(')).replace('(', '').replace(')', ''))

            dateSelect.datepicker({
                language: "ja",
                format: 'yyyy年mm月dd日(D)',
                autoclose: true,
                // startDate: null,
                endDate: new Date()
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
                dateSelect.val(dJP)
                isweekendClass(dateSelect)
                dateSelect.addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
                dateSelect.attr('data-date', ct)
            })
        })
    }

    function initTable() {
        let query = { limit: 30 }
        request2GetFilteredData(query)
    }

    function initForm() {

        //
        // Save Form
        //

        //ADDING GROUP
        $('body').on('click', '.addGroup', function (e) {
            addElement($(this).attr('data-name'))
        })

        //ADDING MINUS GROUP
        $('body').on('click', '.addGroupMinus', function (e) {
            addElement($(this).attr('data-name'), true)
        })

        //REMOVE GROUP FIELD
        $('body').on('click', '.removeGroup', function () {
            removeElement($(this).attr('data-name'), this)
        })
        
        // Input Sattei Price
        $('body').on('keyup', '.input-sateiprice', function () {
            let element = $(this).parent().parent()
            updateSubTotal($(this), element.find('.input-zeiritu'), element.find('.label-subtotal'), element.parent())
        })

        // Selector Zeirutu
        $('body').on('change', 'select.input-zeiritu', function () {
            let element = $(this).parent().parent()
            updateSubTotal(element.find('.input-sateiprice'), $(this), element.find('.label-subtotal'), element.parent())
        })

        // Save Form
        $('body').on('click', '.saveBtn', function() {
            let formSelect = $(this).attr('data-name')
            saveToDB(formSelect, function (msg) {

                // error
                if (msg) {
                    console.log(msg.message)
                    return
                }

                // success

                // initialize elements
                let firstElement

                let formID = '.form-container.' + formSelect
                let elements = $('body').find(formID + ' .elements')
                $.each(elements.children(), function() {
                    let element = $(this)
                    if (element.hasClass('element')) {
                        if (element.attr('data-value') > 1) {   // remove all elements excepting the first one
                            element.remove()
                        } else {                                // initialize the values for the first element
                            firstElement = element
                            let selectKanjoukamoku = element.find('.input-kanjoukamoku')
                            let selectGenba = element.find('.input-genba-daityou')
                            let inputBikou = element.find('.input-bikou')
                            let inputSateiprice = element.find('.input-sateiprice')
                            let selectZeiritu = element.find('.input-zeiritu')

                            selectKanjoukamoku.val('')
                            selectKanjoukamoku.niceSelect('update')
                            selectGenba.val('')
                            selectGenba.niceSelect('update')
                            inputBikou.val('')
                            inputSateiprice.val('')
                            selectZeiritu.val('')
                            selectZeiritu.niceSelect('update')
                        }
                    }
                })

                updateSubTotal(firstElement.find('.input-sateiprice'), firstElement.find('.input-zeiritu'), firstElement.find('.label-subtotal'), firstElement.parent())

                // update table with new elements
                initTable()
            })
        })
    
    
        //
        // Filter Form
        //

        // Main Tab
        $('body').on('click', '.nav-link-inoutcome-filter', function() {

            // update torihiki selector according to the main tab
            let tab = $(this).attr('data-name')
            let hattyu = $('#input-filter-hattyu') // in
            let hattyuNice = $('#input-filter-hattyu + div') // in
            let gyousha = $('#input-filter-gyousha') // out
            let gyoushaNice = $('#input-filter-gyousha + div') // out
            let torihiki = $('#input-filter-torihiki') // all
            let torihikiNice = $('#input-filter-torihiki + div') // all

            if (tab == 'all') {
                hattyu.addClass('d-none')
                hattyuNice.addClass('d-none')
                gyousha.addClass('d-none')
                gyoushaNice.addClass('d-none')
                torihiki.removeClass('d-none')
                torihikiNice.removeClass('d-none')
            } else if (tab == 'in') {
                hattyu.removeClass('d-none')
                hattyuNice.removeClass('d-none')
                gyousha.addClass('d-none')
                gyoushaNice.addClass('d-none')
                torihiki.addClass('d-none')
                torihikiNice.addClass('d-none')
            } else if (tab == 'out') {
                hattyu.addClass('d-none')
                hattyuNice.addClass('d-none')
                gyousha.removeClass('d-none')
                gyoushaNice.removeClass('d-none')
                torihiki.addClass('d-none')
                torihikiNice.addClass('d-none')
            }
        })

        // Filter Button
        $('body').on('click', '#filterBtn', function () {

            let query = {}
            let inoutType
            let kanjoukamoku

            // Main Tab(type)
            if ($('#filter-income-tab').hasClass('active') == true) { // in
                inoutType = '収入'
            } else if ($('#filter-outcome-tab').hasClass('active') == true) { // out
                inoutType = '支出'
            }

            if (inoutType) { // type = all
                query.inoutType = inoutType
            }

            // Sub Tab(kanjoukamoku)
            let subTabPanel
            if (inoutType == '収入') { // in
                subTabPanel = $('#filter-income')
            } else if (inoutType == '支出') { // out
                subTabPanel = $('#filter-outcome')
            } else { // all
                subTabPanel = $('#filter-all')
            }

            let subTabs = subTabPanel.find('.btn-group-toggle .btn-group')
            $.each(subTabs.find('label'), function() {
                if ($(this).hasClass('active')) {
                    let value = $(this).find('input').val()
                    if (value)
                        kanjoukamoku = value
                }
            })

            if (kanjoukamoku) { // kanjoukamoku = all
                query.勘定科目 = kanjoukamoku
            }

            // date from/to
            let dateFrom = $('#date-from').attr('data-date')
            let dateTo = $('#date-to').attr('data-date')
            query.dateFrom = dateFrom
            query.dateTo = dateTo

            // kouza selector
            let kouza = $('#input-filter-kouza').val()
            if (kouza) {
                query.口座 = kouza
            }

            // torihiki selector
            let torihiki
            if (inoutType == '収入') { // in
                torihiki = $('#input-filter-hattyu').val()
            } else if (inoutType == '支出') { // out
                torihiki = $('#input-filter-gyousha').val()
            } else { // all
                torihiki = $('#input-filter-torihiki').val()
            }

            if (torihiki) {
                query.取引先 = torihiki
            }

            // genba selector
            let genba = $('#input-filter-genba').val()
            if (genba) {
                query.現場名 = genba
            }

            // bikou input
            let bikou = $('#input-filter-bikou').val()
            if (bikou) {
                query.備考 = bikou
            }

            // satei price from/to
            let priceFrom = $('#input-filter-price-from').val()
            let priceTo = $('#input-filter-price-to').val()
            if (priceFrom) {
                query.priceFrom = priceFrom
            }
            if (priceTo) {
                query.priceTo = priceTo
            }

            if (prevQuery && JSON.stringify(prevQuery) == JSON.stringify(query)) {
                console.log("same query")
            } else {
                console.log(query)
                prevQuery = query
                request2GetFilteredData(query)
            }

        })

        // Clear Filter Button
        $('body').on('click', '#filterAllBtn', function () {
            initTable()
        })
    }

    function updateSubTotal(inputSateiprice, selectZeiritu, labelSubTotal, elements) {
        /////
        // calculate price with tax (tax-rate: zeiritu, raw-price: sateiprice)
        let taxRate = parseInt(selectZeiritu.val())
        if (isNaN(taxRate))
            taxRate = 0
        let price = parseInt(inputSateiprice.val())
        if (isNaN(price))
            price = 0
        let priceWithTax = price + price * taxRate / 100

        // update sub total price label
        labelSubTotal.attr('data-value', priceWithTax) // for calculating total sum
        labelSubTotal.text(currencyFormat(priceWithTax)) // show price as text
        /////

        // update total price label
        updateTotalPrice(elements)
    }

    function updateTotalPrice(elements) {

        let formContainer = elements.parent()

        // sum of the elements subtotals
        let totalPriceLabel = formContainer.find('.label-totalprice')

        let totalPrice = 0
        $.each(elements.children(), function () {
            let element = $(this)
            if (element.hasClass('element')) {
                let subTotalLabel = element.find('.label-subtotal')
                let price = parseInt(subTotalLabel.attr('data-value'))
                var isMinus = element.attr('minus') == '1' ? true : false
                if (!isNaN(price)) {
                    if (isMinus)
                        totalPrice -= price
                    else
                        totalPrice += price
                }
            }
        })

        // show price as text
        totalPriceLabel.text(numberFormat(totalPrice) + ' 円')
    }

    function addElement(formSelect, isMinus) {
        let formID = '.form-container.' + formSelect
        let group = $(formID + ' .form-group .form-row.element').last().clone()
        let currVal = parseInt(group.attr('data-value')) + 1
        if (currVal > 10) {
            alert('Maximum entry is 10')
        } else {
            group.attr('data-value', currVal)
            group.attr('minus', isMinus ? '1' : '0')
            // let gIc = parseInt($(formID + ' .form-group .form-row.element').length + 1)
            // $('.totalLine.' + formSelect).attr('value', gIc)
            group.find('.removeGroup').attr('data-value', currVal)
            // group.find('label').remove()
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
            $.each(group.find('.label-subtotal'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).attr('data-value', 0)
                    $(this).text(currencyFormat(0))
                }
            })
            $.each(group.find('.span-minus'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    if (isMinus) {
                        $(this).addClass('bg-danger')
                    } else {
                        $(this).removeClass('bg-danger')
                    }
                }
            })
        }
    }

    function removeElement(formSelect, self) {
        let formID = '.form-container.' + formSelect
        if ($('body').find(formID + ' .form-group .form-row.element').length > 1) {
            $(formID + ' .form-group .form-row.element[data-value="' + $(self).attr('data-value') + '"]').fadeOut(500, function () {
                $(this).remove()

                // update total price label after removing
                let elements = $('body').find(formID + ' .elements')
                updateTotalPrice(elements)
            })
            // let gIc = parseInt($(formID + ' .form-group .form-row.element').length - 1)
            // $('.totalLine.' + formSelect).attr('value', gIc)

            setTimeout(() => {
                updateElementIndex(formID)
            }, 2000)
        }
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

    function updateTableOnResponse(data) {
        let tbody = $('#inoutcome-filtered-tbody')

        var html = ''
        data.forEach(function(item) {
            var type = item.type
            var kanjoukamoku = item.勘定科目
            var date = item.日付
            var kouza = item.口座
            var torihiki = item.取引先
            var genba = item.現場名
            var bikou = item.備考
            var price = item.査定金額
            var zeiritu = item.税率
            var tax = parseInt((price * zeiritu / 100).toFixed())
            var priceWithTax = price + tax
            if (!tax) tax = 0
            if (!priceWithTax) priceWithTax = 0

            html += '<tr><td class="py-2 pl-1 text-left" style="color:' + (type == '収入' ? '#00b0f0' : '#ea4335') + '">' + type +
                    '</td><td class="pr-1">' + date + '</td><td class="pr-1">' + torihiki +
                    '</td><td class="pr-1">' + kanjoukamoku + '</td><td class="pr-1">' + genba +
                    '</td><td class="pr-1">' + bikou + '</td><td class="pr-1">' + numberFormat(price) +
                    '</td><td class="pr-1">' + numberFormat(tax) + '</td><td class="pr-1">' + numberFormat(priceWithTax) +
                    '</td></tr>'
        })
        tbody.html(html)
    }

    function request2GetFilteredData(query, callback) {
        $('#searching-progress').fadeIn(500)
        $.post('/api/inoutcome/', query, function (data) {
            // console.log(data)
            updateTableOnResponse(data)
            setTimeout(() => {
                $('#searching-progress').fadeOut(500)
            }, 1000);
        })
    }

    function saveToDB(formSelect, callback) {
        let formId = '.form-container.' + formSelect

        let selectKouza = $(formId).find('.input-kouza')
        let selectTorihiki = formSelect == 'income' ? $(formId).find('.input-hattyu') : $(formId).find('.input-gyousha')
        let torihikiID = selectTorihiki.find('option:checked').attr('data-id')
        let selectDate = $(formId).find('.input-date-inoutcome')

        let kouza = selectKouza.val()
        let torihiki = selectTorihiki.val()
        let date = selectDate.attr('data-date')

        let result = {}

        if (kouza && torihiki && date) {
            result.口座 = kouza
            result.torihiki_id = torihikiID
            result.取引先 = torihiki
            result.日付 = date
        } else {
            if (callback) {
                callback({message:"empty setting"})
            }
            return
        }

        let type = formSelect == 'income' ? '収入' : '支出'
        let elements = $(formId).find('.elements')
        let items = []

        $.each(elements.children(), function () {
            let element = $(this)
            if (element.hasClass('element')) {
                let selectKanjoukamoku = element.find('.input-kanjoukamoku')
                let selectGenba = element.find('.input-genba-daityou')
                let inputBikou = element.find('.input-bikou')
                let inputSateiprice = element.find('.input-sateiprice')
                let selectZeiritu = element.find('.input-zeiritu')
                var isMinus = element.attr('minus') == '1' ? true : false

                let kanjoukamoku = selectKanjoukamoku.val()
                let genba = selectGenba.val()
                let genbaID = selectGenba.find('option:checked').attr('data-id')
                let bikou = inputBikou.val()
                let sateiprice = parseInt(inputSateiprice.val())
                let zeiritu = selectZeiritu.val()

                if (kanjoukamoku && genba && zeiritu && !isNaN(sateiprice)) {
                    let data = {
                        type: type,
                        勘定科目: kanjoukamoku,
                        genba_id: genbaID,
                        現場名: genba,
                        備考: bikou,
                        査定金額: isMinus ? -sateiprice : sateiprice,
                        税率: zeiritu
                    }
                    items.push(data)
                }
            }
        })

        if (items.length == 0) {
            if (callback) {
                callback({message:"empty data"})
            }
            return
        }

        result.data = items

        // console.log(result)
        $('#saving-progress').fadeIn(500)
        $.post('/api/update/inoutcome/', result, function (data) {
            // console.log(data)
            setTimeout(() => {
                $('#saving-progress').fadeOut(500)
                if (callback) { callback() }
            }, 1000);
        })
    }
})

function currencyFormat(number) {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(number)
}

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