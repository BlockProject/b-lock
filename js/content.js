$(document).ready(function () {
  var injectedButton = false;
  var filledForm = false;
  var dialogOpen = false;

  const readCredentials = ($form) => {
    // console.log($form);
    const returnVal = {};
    const passwordField = $($form).find('input:password');
    returnVal.password = passwordField[0].value;
    const allInputs = $($form).find('input');
    for (const input of allInputs) {
      if ((input['type'] == 'text' || input['type'] == 'email') &&
          input.value != undefined &&
          input.value != '') {
        returnVal.login = input.value;
        break;
      }
    }
    return returnVal;
  };

  const attachListener = ($form) => {
    $form.submit(function (e) {
      const credentials = readCredentials(e.target);
      chrome.runtime.sendMessage({
        type: 'onTryLogin',
        info: {
          login: credentials.login,
          password: credentials.password,
          domain: location.hostname,
        }
      }, function () {
        showSavePasswordDialog();
      });
      return true;
    });
  };

  const initialSearch = () => {
    const passwordFields = $('input:password');
    for (const passwordField of passwordFields) {
      const form = $(passwordField).closest('form');
      attachListener(form);
    }
  };

  const showSavePasswordDialog = () => {
    $('body').append(`<div id='b-lock-save-popup'><iframe src="${chrome.runtime.getURL('html/save-popup.html')}"></iframe></div>`);
    $('#b-lock-save-popup').attr('style',
      'position: fixed !important;\
      z-index: 2147483647 !important;\
      display: block !important;\
      width: 100% !important;\
      height: 100% !important;\
      top: 10px !important;\
      right: 10px !important;\
      max-height: 240px !important;\
      max-width: 376px !important;'
    );

    $('#b-lock-save-popup iframe').attr('style',
      'border: none !important;\
      position: relative !important;\
      height: 100% !important;\
      width: 100% !important;\
      visibility: visible !important;'
    )
    console.log('addpended iframe');
  }

  const fillForm = ($form, credentials) => {
    const allInputs = $($form).find('input');
    if (allInputs.length > 1) {
      const passwordInput = $($form).find('input:password');
      let loginInput = $($form).find('input:text');
      if (loginInput.length == 0) {
        let loginInputs = $($form).find('input');
        for (z in loginInputs) {
          if ($(loginInputs[z]).attr('type') == 'email') {
            loginInput = $(loginInputs[z]);
            break;
          }
        }
      }
      if (passwordInput.length == 0 ||
          loginInput.length == 0) {
        return;
      }
      passwordInput[0].value = credentials.password;
      loginInput[0].value = credentials.login;
    }
  };

  const injectSelectionButton = ($form, credentials, imgURL) => {
    const loginInput = $($form).find('input:text');
    console.log(imgURL);
    $(loginInput[0]).css("background-image", "url(" + imgURL + ")");
    $(loginInput[0]).css("background-repeat", "no-repeat");
    $(loginInput[0]).css("background-size", "16px 18px");
    $(loginInput[0]).css("background-position", "98% 50%");
    $(loginInput[0]).click(function (e) {
      var mousePosInElement = e.pageX - $(this).position().left;
      if (mousePosInElement > $(this).width()) {
        e.stopPropagation();
        console.log('clicked on backhroundi mage');
        if (dialogOpen == false) {
          injectSelectionDialog(getPosition(loginInput[0]));
          dialogOpen = true;
        } else {
          $('#b-lock-show-credentials-options').remove();
          dialogOpen = false;
        }
      }
    });
    $(loginInput[0]).hover(function (e) {
      var mousePosInElement = e.pageX - $(this).position().left;
      if (mousePosInElement > $(this).width()) {
        $(this).css("cursor", "pointer");
      } else {
        $(this).css("cursor", "auto");
      }
    });
  };

  const getPosition = (element) => {
    var jElement = $(element);
    var offset = jElement.offset();
    let position = {};
    position.bottom = offset.top + jElement.outerHeight();
    position.right = $(window).width() - (offset.left + jElement.outerWidth());
    return position;
  };

  const injectSelectionDialog = (position) => {
    $('body').append(`<div id='b-lock-show-credentials-options'><iframe src="${chrome.runtime.getURL('html/show-credentials-options.html')}?domain=${location.hostname}"></iframe></div>`);
    $('#b-lock-show-credentials-options').attr('style',
      `position: fixed !important;\
      z-index: 2147483647 !important;\
      display: block !important;\
      width: 100% !important;\
      height: 100% !important;\
      top: ${position.bottom}px !important;\
      right: ${position.right}px !important;\
      max-height: 240px !important;\
      max-width: 376px !important;`
    );

    $('#b-lock-show-credentials-options iframe').attr('style',
      'border: none !important;\
      position: relative !important;\
      height: 100% !important;\
      width: 100% !important;\
      visibility: visible !important;'
    )
    $('#b-lock-show-credentials-options').click(function (e) {
      e.stopPropagation();
    });
    console.log('addpended credentials iframe');
  };

  $('html').click(function () {
    $('#b-lock-show-credentials-options').remove();
    dialogOpen = false;
  });

  chrome.runtime.sendMessage({
    type: 'requestInfoForContent',
    domain: location.hostname
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "clearIframe") {
      $('#b-lock-show-credentials-options').remove();
      dialogOpen = false;
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'chooseCredentials') {
      fillAllForms(request.credentials);
    }
  });

  const fillAllForms = (credentials) => {
    console.log("Filling all forms with credentials");
    const passwordFields = $('input:password');
    for (const passwordField of passwordFields) {
      const form = $(passwordField).closest('form');
      fillForm(form, credentials);
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "infoForContent") {
      console.log('got infoForContent:', request);
      if (!request.unlocked) return;
      console.log('doing initialSearch');
      initialSearch();
      if (request.showSavePasswordDialog) showSavePasswordDialog();

      if (request.autofill) {
        // find form with username and password field
        // autofill with response.credentials
        const passwordFields = $('input:password');
        for (const passwordField of passwordFields) {
          if (filledForm === false) {
            fillForm($(passwordField).closest('form'), request.credentials[0]);
          }
          if (request.credentials.length > 1) {
            console.log(request);
            if (injectedButton === false) {
              injectSelectionButton($(passwordField).closest('form'), request.credentials, request.imgURL);
            }
          }
        }
        filledForm = true;
        injectedButton = true;
      }
    }
  });
});
