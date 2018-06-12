$(document).ready(() => {
  let info;
  let filterByCurrentDomain = true;
  let firstRefresh = true;
  let showingAll = false;
  let creatingOrRestoring = false;

  $('#createNew').click(function () {
    creatingOrRestoring = true;
    $('#newAccountIntro').hide();
    $('#restoreAccount').hide();
    $('#newAccountMain').show();
  });

  $('#cancelCreateNew').click(function (e) {
    creatingOrRestoring = false;
    disableConfirmBtn();
    resetCreateNewFields();
    $('#newAccountMain').hide();
    $('#newAccountIntro').show();
    $('#restoreAccount').show();
  });

  $('#confirmCreateNew').click(function (e) {
    if ($("#new-account-password").val() !== $('#new-account-password-confirm').val()) {
      return;
    }
    chrome.runtime.sendMessage({
      type: "createAccount",
      password: $("#new-account-password").val(),
    }, function (response) {
      info = response;
      // refresh();
      console.log(info);
      $('#newAccountMain').hide();
      $('#newAccountSuccess').show();
    });
  });

  $('#saveKeystoreBtn').click(function () {
    if (info.account.keystore === null || info.account.keystore === undefined || info.account.keystore === '') return;
    const address = JSON.parse(info.account.keystore).address;
    const fileName = 'nebulas-'.concat(info.network).concat('-').concat(address).concat('.json');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(info.account.keystore));
    element.setAttribute('download', fileName);
    document.body.appendChild(element);
    element.click();
    refresh();
    creatingOrRestoring = false;
  });

  $('#new-account-password-confirm').keyup(function (e) {
    const passwordField = $('#new-account-password');
    const passwordConfirmField = $('#new-account-password-confirm');
    disableConfirmBtn();
    if (passwordField.val() !== '' && passwordField.val() === passwordConfirmField.val()) {
      enableConfirmBtn();
    }
  });

  $('#new-account-password').keyup(function (e) {
    const passwordField = $('#new-account-password');
    const passwordConfirmField = $('#new-account-password-confirm');
    disableConfirmBtn();
    if (passwordField.val() !== '' && passwordField.val() === passwordConfirmField.val()) {
      enableConfirmBtn();
    }
  });

  const disableConfirmBtn = () => {
    $('#confirmCreateNew').attr('disabled', true);
    $('#confirmCreateNew').removeClass('mdl-color--blue-800');
    $('#confirmCreateNew').removeClass('mdl-color-text--white');
  };

  const enableConfirmBtn = () => {
    $('#confirmCreateNew').attr('disabled', false);
    $('#confirmCreateNew').addClass('mdl-color--blue-800');
    $('#confirmCreateNew').addClass('mdl-color-text--white');
  };

  const resetCreateNewFields = () => {
    $('#new-account-password').val('');
    $('#new-account-password-confirm').val('');
  }

  $('#restore-keystore').change(function (e) {
    const input = event.target;
    creatingOrRestoring = true;
    if ('files' in input && input.files.length > 0) {
      // placeFileContent(
      //   document.getElementById('content-target'),
      //   input.files[0]
      // );
      readFileContent(input.files[0]).then(content => {
        console.log('read this content');
        console.log(content);
        handleUploadedKeystore(content);
      }).catch(error => console.log(error));
    }
  });

  function readFileContent(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = event => resolve(event.target.result);
      reader.onerror = error => reject(error);
      reader.readAsText(file);
    });
  }

  const switchToLoginView = () => {
    $('#newAccountIntro').hide();
    $('#restoreAccount').hide();
    $('#loginKeystore').show();
  };

  $("#unlock-keystore").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#unlock-keystore-password").val()
    }, function (response) {
      info = response;
      handleLoginResponse(info);
    });
  });

  const handleUploadedKeystore = (keystore) => {
    chrome.runtime.sendMessage({
      type: 'uploadedKeystore',
      keystore: keystore,
    }, switchToLoginView);
  };

  const handleLoginResponse = (info) => {
    if (info == undefined) return;
    if (!info.unlockAccount.unlocked) {
      console.log('info.account.address = ', info.account.address);
      if (info.unlockAccount.wrongPass) {
        $("#cryptpass-popup-login-main-wrong-password").show();
      } else {
        $("#cryptpass-popup-login-main-wrong-password").hide();
      }
    } else {
      refresh();
      creatingOrRestoring = false;
    }
  }

  //////////// ADDED AS PART OF NEW UI (BEGIN) ////////////

  const enableVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    if (listItem.attr('item-type') == 'credential') {
      const listItemDetails = $(e.target).closest('.list-item-content-details');
      listItemDetails.find('.list-item-content-details-password').attr('type', 'text');
      listItemDetails.find('.toggle-visibility').html('visibility_off');
      listItemDetails.attr('is-visible', 'true');
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle enabling visibility of secret note
    }
  };

  const disableVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    if (listItem.attr('item-type') == 'credential') {
      const listItemDetails = $(e.target).closest('.list-item-content-details');
      listItemDetails.find('.list-item-content-details-password').attr('type', 'password');
      listItemDetails.find('.toggle-visibility').html('visibility');
      listItemDetails.attr('is-visible', 'false');
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle disabling visibility of secret note
    }
  };

  const handleToggleDropdownCancel = (e) => {
    const listItemParent = $(e.target).closest('.list-item');
    if (listItemParent.attr('expanded') == undefined ||
        listItemParent.attr('expanded') == 'false') {
      listItemParent.find('.list-item-content-overview').hide();
      listItemParent.find('.list-item-content-details').show();
      listItemParent.attr('expanded', 'true');
      $(e.target).parent().removeClass('mdl-color-text--blue-800');
      $(e.target).parent().addClass('mdl-color-text--red-800');
      $(e.target).html('cancel');
    } else {
      listItemParent.find('.list-item-content-details').hide();
      listItemParent.find('.list-item-content-overview').show();
      listItemParent.attr('expanded', 'false');
      $(e.target).parent().removeClass('mdl-color-text--red-800');
      $(e.target).parent().addClass('mdl-color-text--blue-800');
      $(e.target).html('arrow_drop_down');
      disableEdit(e);
    }
  };

  const disableEdit = (e) => {
    const listItemParent = $(e.target).closest('.list-item');
    if (listItemParent.attr('item-type') == 'credential') {
      const listItemDetails = listItemParent.find('.list-item-content-details');
      if (listItemDetails.attr('edit-mode') == 'true') {
        listItemDetails.find('.toggle-visibility-div').hide();
        listItemDetails.attr('edit-mode', 'false');
        listItemDetails.find('.list-item-content-details-login').prop('readonly', true);
        listItemDetails.find('.list-item-content-details-password').prop('readonly', true);
        listItemDetails.find('.toggle-edit-done').html('edit');
        listItemDetails.find('.toggle-edit-done').parent().removeClass('mdl-color-text--green-500');
        disableVisibility({target: listItemDetails.find('.toggle-visibility')[0]});
      }
    } else if (listItemParent.attr('item-type') == 'secretnote') {
      // TODO:
      // handle disabling edit of secret note
    }
  };

  const handleEditCredentials = (e) => {
    const listItem = $(e.target).closest('.list-item');
    if (listItem.attr('item-type') == 'credential') {
      const listItemDetails = $(e.target).closest('.list-item-content-details');
      const credentialsObj = {
        domain: listItemDetails.find('.list-item-content-details-domain').html(),
        login: listItemDetails.find('.list-item-content-details-login').val(),
        password: listItemDetails.find('.list-item-content-details-password').val(),
      };
      chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: credentialsObj});
      disableEdit(e);
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle secret note saving
    }
  };

  const enableEdit = (e) => {
    console.log('enabling edit');
    const listItemParent = $(e.target).closest('.list-item');
    if (listItemParent.attr('item-type') == 'credential') {
      const listItemDetails = listItemParent.find('.list-item-content-details');
      if (listItemDetails.attr('edit-mode') == undefined ||
          listItemDetails.attr('edit-mode') == 'false') {
        listItemDetails.attr('edit-mode', 'true');
        listItemDetails.find('.list-item-content-details-login').prop('readonly', false);
        listItemDetails.find('.list-item-content-details-password').prop('readonly', false);
        listItemDetails.find('.toggle-edit-done').html('done');
        listItemDetails.find('.toggle-edit-done').parent().addClass('mdl-color-text--green-500');
        listItemDetails.find('.toggle-visibility-div').show();
      } else {
        handleEditCredentials(e);
      }
    } else if (listItemParent.attr('item-type') == 'secretnote') {
      // TODO:
      // handle enabling edit of secret note
    }
  };

  const handleToggleVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    if (listItem.attr('item-type') == 'credential') {
      const listItemDetails = $(e.target).closest('.list-item-content-details');
      if (listItemDetails.attr('is-visible') == undefined ||
          listItemDetails.attr('is-visible') == 'false') {
        enableVisibility(e);
      } else {
        disableVisibility(e);
      }
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle toggle visibility of secret note
    }
  };

  const handleOpenTxn = (e) => {
    // TODO:
    // open the transaction in block explorer, new tab
  };

  const attachResponsiveEvents = () => {
    $('.toggle-dropdown-cancel').click(handleToggleDropdownCancel);
    $('.toggle-edit-done').click(enableEdit);
    $('.toggle-visibility').click(handleToggleVisibility);
    $('.open-txn-new-tab').click(handleOpenTxn);
  };

  attachResponsiveEvents();

  const createAndAppendCredential = (credentials, container) => {
    const listItem = $('#template-list-item-credential').clone();
    listItem.find('.list-item-content-overview-title').html(credentials.domain);
    listItem.find('.list-item-content-overview-description').html(credentials.login);
    listItem.find('.list-item-content-details-topic').html(credentials.domain);
    listItem.find('.list-item-content-details-key').val(credentials.login);
    listItem.find('.list-item-content-details-value').val(credentials.password);
    container.append(listItem);
  };

  const createAndAppendSecretnote = (secretnote, container) => {
    const listItem = $('#template-list-item-secretnote').clone();
    // TODO:
    // fill up like the above function
  };

  const createAndAppendTransaction = (txn, container) => {
    const listItem = $('#template-list-item-transaction').clone();
    // TODO:
    // fill up like the above function
  };

  //////////// ADDED AS PART OF NEW UI (END) ////////////

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
    $('#newAccountIntro').hide();
    $('#newAccountMain').hide();
    $('#restoreAccount').hide();
    $('#unlockDiv').hide();
    $('#logged-in-view').hide();
    $('#loginKeystore').hide();

    // console.log('got this info : ', info);

    if (info == undefined) return;
    if (info.account.keystore == undefined) { // user haven't created account
      $("#newAccount").show();
      $('#newAccountIntro').show();
      $('#restoreAccount').show();
    } else if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      $("#loginKeystore").show();
      if (info.unlockAccount.wrongPass) {
        $("#cryptpass-popup-login-main-wrong-password").show();
      } else {
        $("#cryptpass-popup-login-main-wrong-password").hide();
      }
    } else { // user already logged in
      $('#cryptpass-initial').hide();
      $('#cryptpass-main').show();
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

      for (transaction of info.pastTransactions[info.network]) {
        const description = transaction.type === 'send' ? `Send ${transaction.amount} NAS` : `${transaction.url} | ${transaction.login}`;
        const status = ["Failed", "Done", "Pending"][transaction.status];
        const item = $("#" + transaction.txhash);
        if (item.length === 0) {
          const newElement = `<li id='${transaction.txhash}'>${description}\
            <a target="_blank" href="https://explorer.nebulas.io/#/${info.network}/tx/${transaction.txhash}">\
            ${status}</a>\
            </li>`;
          // console.log('newElement = ', newElement);
          $("#transaction-history ul").append(newElement);
        } else {
          item.find('a').html(status);
        }
      }

      for (entry of info.allCredentialsArray) {
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        const bareLogin = entry.login.replace(/[^a-zA-Z0-9]/g, '_');
        const elementId = `${bareDomain}_${bareLogin}`;
        const selectorString = `.${bareDomain}.${bareLogin}`;
        if ($(selectorString).length === 0) {
          const secretNote = entry.domain === "Secret note";
          if (!secretNote) {
            const newElement = $("#template-list-item-credential").clone().appendTo("#active-entries").addClass(`${bareDomain} ${bareLogin}`).removeClass('hidden').attr("id", elementId);
            newElement.find('.list-item-content-overview-title').html(entry.domain);
            newElement.find('.list-item-content-details-topic').html(entry.domain);
            newElement.find('.list-item-content-overview-description').html(entry.login);
            newElement.find('.list-item-content-details-key').val(entry.login);
            newElement.find('.list-item-content-details-value').val(entry.password);
          } else {
            const newElement = $("#template-list-item-secretnote").clone().appendTo("#active-entries").removeAttr("id").addClass(`${bareDomain} ${bareLogin}`).removeClass('hidden');
            newElement.find('.list-item-content-overview-title').html(entry.domain);
            newElement.find('.list-item-content-details-topic').html(entry.domain);
            newElement.find('.list-item-content-overview-description').html(entry.login);
            newElement.find('.list-item-content-details-value-decrypted').val(entry.password);
          }
          const newEntryDom = `<li class="${bareDomain} ${bareLogin} blockEntry">\
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
        // componentHandler.upgradeAllRegistered();
      }
      attachResponsiveEvents();
      filterEntries();
      showCurrentNetwork();
    }
  }

  const filterEntries = () => {
    const showEntries = (entries) => {
      $('.blockEntry').hide();
      for (entry of entries) {
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        const bareLogin = entry.login.replace(/[^a-zA-Z0-9]/g, '_');
        $(`.${bareDomain}.${bareLogin}`).show();
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
    if (!creatingOrRestoring) {
      chrome.runtime.sendMessage({type: "requestInfo"}, (newInfo) => {
        // console.log('newInfo', newInfo);
        info = newInfo;
        refresh();
      });
    }
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

  $('.mainnet.network').click((e) => {
    changeNetwork('mainnet');
  });

  $('.testnet.network').click((e) => {
    changeNetwork('testnet');
  });

  const showCurrentNetwork = () => {
    $(`.network span`).hide();
    $(`.${info.network} span`).show();
    console.log('Current network: ', info.network);
  }

  const changeNetwork = (network) => {
    console.log('changing network to ', network);
    chrome.runtime.sendMessage({ type: "changeNetwork", network });
    info.network = network;
    $('#transaction-history li').remove();
    showCurrentNetwork();
  }
})
