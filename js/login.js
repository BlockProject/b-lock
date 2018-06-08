$(document).ready(() => {
  let info;

  $("#unlockAccount").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#password").val()
    }, function (response) {
      console.log('24');
      info = response;
      refresh();
    });
  });

  const refresh = () => {
    $('#unlockDiv').addClass('hidden');
    console.log('got this info : ', info);

    if (info == undefined) return;
    if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      $("#unlockDiv").removeClass('hidden');
      if (info.unlockAccount.wrongPass) {
        $("#wrongPass").show();
      } else {
        $("#wrongPass").hide();
      }
    } else { // user already logged in
      window.close()
    }
  }

  chrome.runtime.sendMessage({
    type: "requestInfo",
  }, function (response) {
    info = response;
    refresh();
  });
})
