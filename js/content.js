$(document).ready(function () {
  const readCredentials = ($form) => {
    // console.log($form);
    const returnVal = {};
    const passwordField = $($form).find('input:password');
    returnVal.password = passwordField[0].value;
    const allInputs = $($form).find('input');
    for (const input of allInputs) {
      if (input['type'] == 'text' &&
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
      max-height: 182px !important;\
      max-width: 368px !important;'
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
      const loginInput = $($form).find('input:text');
      passwordInput[0].value = credentials[0].password;
      loginInput[0].value = credentials[0].login;
    }
  };

  chrome.runtime.sendMessage({
    type: 'requestInfoForContent',
    domain: location.hostname
  });

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
          fillForm($(passwordField).closest('form'), request.credentials);
        }
      }
    }
  });
});
