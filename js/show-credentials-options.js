$(document).ready(() => {
  const fillSelectionDialog = (credentials) => {
    console.log('got ', credentials, ' got');
    let credentialsTemplate = $(".template-credentials-div");
    for (const credential of credentials) {
      let credentialsDiv = credentialsTemplate.clone();
      credentialsDiv.attr("id", credential.domain + ":" + credential.login);
      credentialsDiv.find(".template-credentials-div-username").val(credential.login);
      credentialsDiv.find(".template-credentials-div-password").val(credential.password);
      $("#show-credentials-options-main").append(credentialsDiv);
      credentialsDiv.click(function (e) {
        chrome.runtime.sendMessage({
          type: 'chooseCredentials',
          credentials: credential,
        });
        hideIframe();
      });
    }
    credentialsTemplate.remove();
  };

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "infoForContent") {
      console.log('got infoForContent:', request);
      if (!request.unlocked) return;

      if (request.autofill) {
        // find form with username and password field
        // autofill with response.credentials
        const passwordFields = $('input:password');
        for (const passwordField of passwordFields) {
          if (request.credentials.length > 1) {
            fillSelectionDialog(request.credentials);
          }
        }
      }
    }
  });

  const hideIframe = () => {
    $("#show-credentials-options").hide();
    chrome.runtime.sendMessage({
      type: "hideIframe",
    });
  };

  const currentDomain = location.href.split('?')[1].split('=')[1];

  chrome.runtime.sendMessage({
    type: "requestInfoForContent",
    domain: currentDomain,
  });

  $("#dismiss-choose").click(function (e) {
    hideIframe();
  });
});
