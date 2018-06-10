$(document).ready(() => {
  let info;
  let filterByCurrentDomain = true;
  let firstRefresh = true;
  let showingAll = false;

  $("#createAccountBtn").click(function () {
    chrome.runtime.sendMessage({
      type: "createAccount",
      password: $("#newPassword").val(),
    }, function (response) {
      console.log('13');
      info = response;
      refresh();
    });
  });

  $("#unlockAccount").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#password").val()
    }, function (response) {
      info = response;
      refresh();
    });
  });

  $("#submit-nas-tx").click(function() {
    const destination = $("#nas-destination").val();
    const amount = $("#nas-amount").val();
    $('#nas-destination').val("");
    $('#nas-amount').val(0);

    chrome.runtime.sendMessage({
      type: "sendNas",
      destination,
      amount,
    });
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'infoForPopUp') {
      console.log('got infoForPopUp');
      info = request.info;
      refresh();
    }
  });

  const showSavePasswordDom = (obj) => {
    console.log('showing this div, ', obj);
    $('#save-credentials-domain').val(obj.domain);
    $('#save-credentials-login').val(obj.login);
    $('#save-credentials-password').val(obj.password);
  };

  const refresh = () => {
    // $(".section").hide();
    $('#newAccount').hide();
    $('#unlockDiv').hide();
    $('#logged-in-view').hide();

    console.log('got this info : ', info);

    if (info == undefined) return;
    if (info.account.keystore == undefined) { // user haven't created account
      $("#newAccount").show();
    } else if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      // $('#newAccount').show();
      $("#address").html(info.account.address);
      $("#unlockDiv").show();
      if (info.unlockAccount.wrongPass) {
        $("#wrongPass").show();
      } else {
        $("#wrongPass").hide();
      }
    } else { // user already logged in
      $('#logged-in-view').show();

      $("#address").html(info.account.address);
      $("#accountBalance").html(info.account.balance);
      $("#accountNonce").html(info.account.nonce);
      $("#save-credentials").show();
      $("#save-note").show();
      $("#plain-password-list").html(JSON.stringify(info.savedCredentials));

      if (firstRefresh) {
        showSavePasswordDom(info.tempCredentials);
        firstRefresh = false;
      }

      for (transaction of info.pastTransactions) {
        const description = transaction.type === 'send' ? `Send ${transaction.amount} NAS` : `${transaction.url} | ${transaction.login}`;
        const status = ["Failed", "Done", "Pending"][transaction.status];
        const item = $("#" + transaction.txhash);
        if (item.length === 0) {
          const newElement = `<li id='${transaction.txhash}'>${description}\
            <a target="_blank" href="https://explorer.nebulas.io/#/${info.network}/tx/${transaction.txhash}">\
            ${status}</a>\
            </li>`;
          console.log('newElement = ', newElement);
          $("#transaction-history ul").append(newElement);
        } else {
          item.find('a').html(status);
        }
      }

      for (entry of info.allCredentialsArray) {
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        const selectorString = `.${bareDomain}.${entry.login}`;
        if ($(selectorString).length === 0) {
          const secretNote = entry.domain === "Secret note";
          const newEntryDom = `<li class="${bareDomain} ${entry.login} blockEntry hidden">\
              <div class="entry-domain">${entry.domain}</div>\
              <div class="entry-login">${entry.login}</div>\
              <button class="fillEntryBtn">Fill</button>\
              <button class="editEntryBtn">Edit</button>\
              <button class="viewEntryBtn">View</button>\
              <div class="editEntryForm hidden">\
                <label>${ secretNote ? "Password:" : "Note" }</label>\
                <input type="text" class="edit-password-input"></input>\
                <button class="submit-edit-entry">Save</button>\
              </div>\
              <div class="viewEntry hidden">\
                ${entry.password}\
              </div>\
            </li>`;
          $("#matching-entries ul").append(newEntryDom);
          $(`${selectorString} .viewEntryBtn`).click((e) => {
            $(`${selectorString} .viewEntry`).toggleClass('hidden');
          });
        } else {
          console.log();
        }
      }
      filterEntries();
    }
  }

  const filterEntries = () => {
    const showEntries = (entries) => {
      $('.blockEntry').hide();
      for (entry of entries) {
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        $(`.${bareDomain}.${entry.login}`).show();
      }
    }

    if (filterByCurrentDomain) {
      chrome.tabs.getSelected(null,function(tab) {
        const currentDomain = (new URL(tab.url)).hostname;
        console.log('currentDomain = ', currentDomain);
        const matchingEntries = info.allCredentialsArray.filter((entry) => entry.domain === currentDomain);
        showEntries(matchingEntries);
      });
    } else {
      const keyword = $('#search-field').val();
      const matchingEntries = info.allCredentialsArray.filter((entry) => (entry.domain + entry.login).includes(keyword));
      showEntries(showingAll ? info.allCredentialsArray : matchingEntries);
    }
  }

  const requestRefreshFromBackground = function() {
    chrome.runtime.sendMessage({type: "requestInfo"}, (newInfo) => {
      console.log('newInfo', newInfo);
      info = newInfo;
      refresh();
    });
  }

  requestRefreshFromBackground();
  setInterval(requestRefreshFromBackground, 2000);

  $("#refresh").click(function() {
    requestRefreshFromBackground();
  })

  $('#save-credentials-submit').click(function (e) {
    const obj = {
      domain: $('#save-credentials-domain').val(),
      login: $('#save-credentials-login').val(),
      password: $('#save-credentials-password').val()
    };
    $('#save-credentials-domain').val("");
    $('#save-credentials-login').val("");
    $('#save-credentials-password').val("");
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj});
  });

  $('#save-note-submit').click(function (e) {
    const obj = {
      domain: "Secret note",
      login: $('#save-note-title').val(),
      password: $('#save-note-note').val()
    };
    $('#save-note-title').val("");
    $('#save-note-note').val("");
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj});
  });

  $('#search-field').keyup(() => {
    console.log('search field is changed');

    filterByCurrentDomain = $('#search-field').val() === "" ? true : false;
    showingAll = false;
    filterEntries();
  });

  $('#see-all-entries').click((e) => {
    filterByCurrentDomain = false;
    showingAll = true;
    filterEntries();
  });
})
