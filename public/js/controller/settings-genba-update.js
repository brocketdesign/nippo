$(document).ready(async function () {

    let userID =  $('#userID').attr('data-value')
    let genbaID = getUrlParameter('genbaID')
    
    if (!!document.querySelector('#EditGenba')) {
        initInput()
        setTimeout(() => { initForm() }, 1000)
    }

    function initInput() {
        $.fn.autoKana('input[name="工事名"]', 'input[name="工事名kana"]')

        if (!!document.querySelector('#formResponsible')) {

            $.get("/api/users", function (data) {
                let index = data.findIndex(function(element) {
                    return element._id === userID
                })
                let specificElement = data.find(function(item) {
                    return item._id === userID
                })
                if (index !== -1) {
                    data.splice(index, 1)
                    data.splice(0, 0, specificElement)
                }
    
                data.forEach(element => {
                    let content = '<option value="' + element._id + '">' + element.lname + ' ' + element.fname + '</option>'
                    if ((element._id == userID) && (genbaID == 0)) {
                        $('select#formResponsible').prepend(content)
                    } else {
                        $('select#formResponsible').append(content)
                    }
                })
            })
        }
        if (!!document.querySelector('.input-genbastructure')) {
            let typeSelect = $('.input-genbastructure')
            $.get("/api/genbastructure", function (data) {
                typeSelect.prepend("<option value='' selected='selected'></option>")
                data.forEach(element => {
                    typeSelect.append('<option value="' + element.el + '" data-id="' + element._id + '">' + element.el + '</option>')
                })
            })
        }
        if (!!document.querySelector('.input-worklaw')) {
            let typeSelect = $('.input-worklaw')
            $.get("/api/worklaw", function (data) {
                typeSelect.prepend("<option value='' selected='selected'></option>")
                data.forEach(element => {
                    typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
                })
            })
        }
        if (!!document.querySelector('.input-buildingtype')) {
            let typeSelect = $('.input-buildingtype')
            $.get("/api/buildingtype", function (data) {
                typeSelect.prepend("<option value='' selected='selected'></option>")
                data.forEach(element => {
                    typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
                })
            })
        }
        if (!!document.querySelector('.input-withdrawal')) {
            let typeSelect = $('.input-withdrawal')
            $.get("/api/withdrawal", function (data) {
                typeSelect.prepend("<option value='' selected='selected'></option>")
                data.forEach(element => {
                    typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
                })
            })
        }
    }

    function initForm() {
        //ADDING GROUP
        $('body').on('click', '#addGroup', function (e) {
            addElement()
        })
    
        //REMOVE GROUP FIELD
        $('body').on('click', '.removeGroup', function () {
            removeElement(this)
        })

        //Submit
        $('body').on('click', '#submit-genba', function () {
            submitGenba(this)
        })

        deleteGenbaListFromLocalStorage()
        if (genbaID != 0) {
            $('#submit-genba').attr('data-action', '/api/edit/genba?elementTypeID=' + genbaID)
            $.get('/api/genba?elID=' + genbaID, function (element) {
                SUA({ event: '現場編集ページ', detail: element.工事名 })
                $.each($('#formGenba').find('input'), function () {
                    let name = $(this).attr('name')
                    let newVal = element[name]
                    $('input[name="' + name + '"]').val(newVal).change()
                })
                $.each($('#formGenba').find('select'), function () {
                    let name = $(this).attr('name')
                    if (!$(this).hasClass('genba-select')) {
                        let newVal = element[name]
                        $('select[name="' + name + '"]').val(newVal).change()
                    } else {
                        let nameKey = name.substring(0, name.indexOf('-'))
                        let newVal = element[nameKey]
                        if (newVal) {
                            if (Array.isArray(newVal)) {
                                var n = newVal.length
                                $('select[name="' + name + '"]').val(newVal[0]).change()
                                for (var i = 1; i < n; i++) {
                                    addElement()
                                    $('select[name="' + nameKey + '-' + (i+1) + '"]').val(newVal[i]).change()
                                }
                            } else {
                                $('select[name="' + name + '"]').val(newVal).change()
                            }
                        }
                    }
                })
                $.each($('#formGenba').find('textarea'), function () {
                    let name = $(this).attr('name')
                    let newVal = element[name]
                    $('textarea[name="' + name + '"]').val(newVal).change()
                })

            })
        } else {
            SUA({ event: '新規現場ページ' })
            $('#submit-genba').attr('data-action', '/api/addone/genba')
        }
        $('#genbaDelete').attr('action', '/api/delete/genba?elementTypeID=' + genbaID)
    }

    function addElement() {
        let formID = '#responsible-group'
        let group = $(formID + ' .form-row').last().clone()
        let currVal = parseInt(group.attr('data-value')) + 1
        if (currVal > 10) {
            alert('Maximum entry is 10')
        } else {
            group.attr('data-value', currVal)
            group.find('.removeGroup').attr('data-value', currVal)
            $(formID).append(group).fadeIn(500)
            $.each(group.find('select'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).val('')
                    $(this).niceSelect('update')
                }
            })
        }
    }

    function removeElement(self) {
        let formID = '#responsible-group'
        if ($('body').find(formID + ' .form-row').length > 1) {
            $(formID + ' .form-row[data-value="' + $(self).attr('data-value') + '"]').fadeOut(500, function () {
                $(this).remove()
            })

        }
        setTimeout(() => {
            updateElementIndex(formID)
        }, 2000)
    }

    function updateElementIndex(formID) {
        $(formID).find('.form-row').each(function (index, value) {
            index = index + 1
            $(this).attr('data-value', index)
            $.each($(this).find('.removeGroup'), function () {
                $(this).attr('data-value', index)
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

    function submitGenba(el) {
        let formSelect = '#' + $(el).attr('data-value')
        let formAction = $(el).attr('data-action')
        let formRedirect = $(el).attr('data-redirect')
        let obj = {}
        $(formSelect).find('textarea').each(function () {
            obj[$(this).attr('name')] = $(this).val()
        })
        $(formSelect).find('select').each(function () {
            if (!$(this).hasClass('genba-select')) {
                obj[$(this).attr('name')] = $(this).val()
            }
        })
        $(formSelect).find('input').each(function () {
            if ($(this).hasClass('form-check-input')) {
                if ($(this).is(':checked')) {
                    if (obj[$(this).attr('name')] != undefined) {
                        obj[$(this).attr('name')].push($(this).val())
                    } else {
                        obj[$(this).attr('name')] = [$(this).val()]
                    }
                }
            } else {
                obj[$(this).attr('name')] = $(this).val()
            }
        })
        
        let responsibleIDs = []
        $(formSelect).find('.genba-select').each(function () {
            if ($(this).is('select') && $(this).val()) {
                responsibleIDs.push($(this).val())
            }
        })
        if (responsibleIDs.length == 1) {
            obj['担当者'] = responsibleIDs[0]
        } else if (responsibleIDs.length > 1) {
            obj['担当者'] = responsibleIDs
        }
        /*
        console.log({
            event:'submitData',
            formSelect:formSelect,
            formAction:formAction,
            formRedirect:formRedirect,
            obj:obj,
        })
        */
        $.post(formAction, obj, function () {
            window.location.href = window.location.origin + formRedirect
        })
    }
})