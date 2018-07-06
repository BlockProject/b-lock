$(document).ready(function () {
  let injectedButton = false;
  let filledForm = false;
  let dialogOpen = false;
  let hoveringOverButton = false;


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
    if ($form.attr('b-lock-attached-listener') == "true") {
      // console.log('attachListener is already done for this form');
      return;
    }
    console.log("Attaching listener for form ", $form);
    const onSubmit = () => {
      console.log("Login form is submitted");
      const credentials = readCredentials($form);
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
    }

    // $form.submit(onSubmit);
    let submitFormBtn = $form.find("input[type=submit]");
    if (submitFormBtn.length == 0) submitFormBtn = $("button[type=submit]");
    if (submitFormBtn.length == 0) submitFormBtn = $("#passwordNext"); // google

    console.log("submitFormBtn is ", submitFormBtn);
    submitFormBtn.click(onSubmit);
    $form.attr('b-lock-attached-listener', "true");
  };

  const initialSearch = () => {
    const passwordFields = $('input:password');
    for (const passwordField of passwordFields) {
      const form = $(passwordField).closest('form');
      attachListener(form);
    }
  };

  const showSavePasswordDialog = () => {
    if ($("#b-lock-save-popup").length > 0) return;
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
      let loginInput = $($form).find('input[type=email]');
      if (loginInput.length == 0) {
        let loginInputs = $($form).find('input');
        for (z in loginInputs) {
          if ($(loginInputs[z]).attr('type') == 'text') {
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
    var loginInput = $($form).find('input:text');
    if (loginInput.length == 0) {
      let loginInputs = $($form).find('input');
      for (z of loginInputs) {
        if ($(z).attr('type') == 'email') {
          loginInput = $(z);
          break;
        }
      }
    }
    console.log(imgURL);
    // const $(loginInput[0]) = $(loginInput[0]);
    // const $(loginInput[0]) = $(loginInput[0]).find('span');
    $(loginInput[0]).css("background-image", "url(" + imgURL + ")");
    $(loginInput[0]).css("background-repeat", "no-repeat");
    $(loginInput[0]).css("background-size", "16px 18px");
    $(loginInput[0]).css("background-attachment", "scroll");
    $(loginInput[0]).css("background-position", "98% 50%");
    $(loginInput[0]).click(function (e) {
      if (!hoveringOverButton) return;
      e.stopPropagation();
      // console.log('clicked on backhround image');
      if (dialogOpen == false) {
        injectSelectionDialog(getPosition(loginInput[0]));
        dialogOpen = true;
      } else {
        $('#b-lock-show-credentials-options').remove();
        dialogOpen = false;
      }
    });

    $(loginInput[0]).mousemove(function (e) {
      var mousePosInElement = e.pageX - $(this).offset().left;
      if (mousePosInElement > $(this).width() - 20) {
        hoveringOverButton = true;
        $(this).css("cursor", "pointer");
      } else {
        hoveringOverButton = false;
        $(this).css("cursor", "auto");
      }
    });
    $(loginInput[0]).mouseout((e) => { hoveringOverButton = false; });
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
    // console.log("Filling all forms with credentials");
    const passwordFields = $('input:password');
    for (const passwordField of passwordFields) {
      const form = $(passwordField).closest('form');
      fillForm(form, credentials);
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "infoForContent") {
      // console.log('got infoForContent:', request);
      if (!request.unlocked) return;
      // console.log('doing initialSearch');
      initialSearch();
      setInterval(initialSearch, 1000);

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
            // console.log(request);
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
