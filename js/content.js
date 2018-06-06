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
          domain: location.hostname
        }
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
    type: "fetchIfSaved",
    domain: location.hostname
  }, function (response) {
    console.log('response from fetchIfSaved:', response);
    if (response.autofill) {
      // find form with username and password field
      // autofill with response.credentials
      const passwordFields = $('input:password');
      for (const passwordField of passwordFields) {
        fillForm($(passwordField).closest('form'), response.credentials);
      }
    }
  });

  // check if logged in to CryptPass
  chrome.runtime.sendMessage({
    type: 'shouldActivate'
  }, function (response) {
    if (response.activate) {
      initialSearch();
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type = "activateNow") {
      console.log('saying something listen');
      initialSearch();
    }
  });
});
