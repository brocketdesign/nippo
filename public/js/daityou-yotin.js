$(document).ready(async function () {

  //NIPPO FORM PAGE
  if (!!document.querySelector('#daityouYotinPage')) {
    inputInit()
    setTimeout(() => { initForm() }, 1000)
    SUA({ event: '実行予算ページ' })
  }

  function inputInit(callback) {
    
    // Global Selector
    if (document.querySelector('.input-company-daityou')) {
        initSelectCompany($(document).find('select.input-company-daityou'))
    }

    // Element Selector
    if (document.querySelector('.input-koushu-daityou')) {
      initSelectKoushu($(document).find('select.input-koushu-daityou'))
    }

    if (callback) {
      callback()
    }
  }

  function initSelectCompany(allSelect) {
    console.log({
      event: 'companyInit',
      allSelect: allSelect
    })
    allSelect.each(function () {
      let companySelect = $(this)
      if (!$(this).hasClass('init-on')) {
        $.get("/api/daityou/company", function (data) {
            data = sortit(data, '業社名kana')
            for (let index = 0; index < data.length; index++) {
                let element = data[index]
                companySelect.append('<option value="' + element._id+'" data-id="' + element._id+'">' + element.el+' </option>')
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
      event: 'koushuInit',
      allSelect: allSelect
    })
    allSelect.each(function () {
      let koushuSelect = $(this)
      if (!$(this).hasClass('init-on')) {
        $.get("/api/koushu", function (data) {
            for (let index = 0; index < data.length; index++) {
                let element = data[index]
                if (element.el) {
                    koushuSelect.append('<option value="' + element._id+'" data-id="' + element._id+'">' + element.el+' </option>')
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

  function initForm(callback) {
    //ADDING GROUP
    $('body').on('click', 'span.addGroup', function (e) {
      addElement()
    })

    //REMOVE GROUP FIELD
    $('body').on('click', '.removeGroup', function () {
      removeElement(this)
    })

  }

  function addElement() {
    let formID = '.form-container'
    let group = $(formID + ' .form-group .form-row.element').last().clone()
    let currVal = parseInt(group.attr('data-value')) + 1
    if (currVal > 10) {
        alert('Maximum entry is 10')
    } else {
        group.attr('data-value', currVal)
        let gIc = parseInt($(formID + ' .form-group .form-row.element').length + 1)
        $('.totalLine').attr('value', gIc)
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
    }
  }

  function removeElement(self) {
    let formID = '.form-container'
    if ($('body').find(formID + ' .form-group .form-row.element').length > 1) {
        $(formID + ' .form-group .form-row.element[data-value="' + $(self).attr('data-value') + '"]').fadeOut(500, function () {
            $(this).remove()
        })
        let gIc = parseInt($(formID + ' .form-group .form-row.element').length - 1)
        $('.totalLine').attr('value', gIc)

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

})