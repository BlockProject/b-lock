$(document).ready(() => {
  let info;
  let filterByCurrentDomain = true;
  let firstRefresh = true;
  let showingAll = false;
  let creatingOrRestoring = false;
  let notAttachedFloatingEvents = true;

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
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItem.attr('item-type') == 'credential') {
      listItemDetails.find('.list-item-content-details-value').attr('type', 'text');
      listItemDetails.find('.toggle-visibility').html('visibility_off');
      listItemDetails.attr('is-visible', 'true');
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle enabling visibility of secret note
      listItemDetails.find('.list-item-content-details-value-encrypted').hide();
      listItemDetails.find('.list-item-content-details-value-decrypted').show();
      listItemDetails.find('.toggle-visibility').html('visibility_off');
      listItemDetails.attr('is-visible', 'true');
    }
  };

  const disableVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItem.attr('item-type') == 'credential') {
      listItemDetails.find('.list-item-content-details-value').attr('type', 'password');
      listItemDetails.find('.toggle-visibility').html('visibility');
      listItemDetails.attr('is-visible', 'false');
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle disabling visibility of secret note
      listItemDetails.find('.list-item-content-details-value-decrypted').hide();
      listItemDetails.find('.list-item-content-details-value-encrypted').show();
      listItemDetails.find('.toggle-visibility').html('visibility');
      listItemDetails.attr('is-visible', 'false');
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
    const listItemDetails = listItemParent.find('.list-item-content-details');
    if (listItemDetails.attr('edit-mode') == 'true') {
      listItemDetails.find('.toggle-visibility-div').hide();
      listItemDetails.attr('edit-mode', 'false');
      listItemDetails.find('.list-item-content-details-key').prop('readonly', true);
      listItemDetails.find('.list-item-content-details-value').prop('readonly', true);
      listItemDetails.find('.list-item-content-details-value-decrypted').prop('readonly', true);
      listItemDetails.find('.toggle-edit-done').html('edit');
      listItemDetails.find('.toggle-edit-done').parent().removeClass('mdl-color-text--green-500');
      disableVisibility({target: listItemDetails.find('.toggle-visibility')[0]});
    }
  };

  const handleEditCredentials = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItem.attr('item-type') == 'credential') {
      const credentialsObj = {
        domain: listItemDetails.find('.list-item-content-details-domain').html(),
        login: listItemDetails.find('.list-item-content-details-key').val(),
        password: listItemDetails.find('.list-item-content-details-value').val(),
      };
      chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: credentialsObj});
      disableEdit(e);
    } else if (listItem.attr('item-type') == 'secretnote') {
      // TODO:
      // handle secret note saving
      const credentialsObj = {
        domain: 'Secret Note',
        login: listItemDetails.find('.list-item-content-details-key').val(),
        password: listItemDetails.find('.list-item-content-details-value-decrypted').val(),
      };
      chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: credentialsObj});
      disableEdit(e);
    }
  };

  const enableEdit = (e) => {
    console.log('enabling edit');
    const listItemParent = $(e.target).closest('.list-item');
    const listItemDetails = listItemParent.find('.list-item-content-details');
    if (listItemDetails.attr('edit-mode') == undefined ||
        listItemDetails.attr('edit-mode') == 'false') {
      listItemDetails.attr('edit-mode', 'true');
      listItemDetails.find('.list-item-content-details-key').prop('readonly', false);
      listItemDetails.find('.list-item-content-details-value').prop('readonly', false);
      listItemDetails.find('.list-item-content-details-value-decrypted').prop('readonly', false);
      listItemDetails.find('.toggle-edit-done').html('done');
      listItemDetails.find('.toggle-edit-done').parent().addClass('mdl-color-text--green-500');
      listItemDetails.find('.toggle-visibility-div').show();
    } else {
      handleEditCredentials(e);
    }
  };

  const handleToggleVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItemDetails.attr('is-visible') == undefined ||
        listItemDetails.attr('is-visible') == 'false') {
      enableVisibility(e);
    } else {
      disableVisibility(e);
    }
  };

  // const handleOpenTxn = (e) => {
  //   // TODO:
  //   // open the transaction in block explorer, new tab
  // };

  const attachResponsiveEvents = (listItem) => {
    $(listItem).find('.toggle-dropdown-cancel').click(handleToggleDropdownCancel);
    $(listItem).find('.toggle-edit-done').click(enableEdit);
    $(listItem).find('.toggle-visibility').click(handleToggleVisibility);
    // $(listItem).find('.open-txn-new-tab').click(handleOpenTxn);
  };

  const createAndAppendCredential = (credentials, elementId, elementClass, container) => {
    const listItem = $('#template-list-item-credential').clone();
    listItem.find('.list-item-content-overview-title').html(credentials.domain);
    listItem.find('.list-item-content-overview-description').html(credentials.login);
    listItem.find('.list-item-content-details-topic').html(credentials.domain);
    listItem.find('.list-item-content-details-key').val(credentials.login);
    listItem.find('.list-item-content-details-value').val(credentials.password);
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    container.append(listItem);
    return listItem;
  };

  const createAndAppendSecretnote = (secretnote, elementId, elementClass, container) => {
    // TODO:
    // fill up like the above function
    const listItem = $('#template-list-item-secretnote').clone();
    listItem.find('.list-item-content-overview-title').html(secretnote.domain);
    listItem.find('.list-item-content-details-topic').html(secretnote.domain);
    listItem.find('.list-item-content-overview-description').html(secretnote.login);
    listItem.find('.list-item-content-details-key').val(secretnote.login);
    listItem.find('.list-item-content-details-value-decrypted').val(secretnote.password);
    listItem.find('.list-item-content-details-value-encrypted').val(new Array(secretnote.password.length+1).join('*'));
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    container.append(listItem);
    return listItem;
  };

  const createAndAppendTransaction = (txn, elementId, elementClass, container) => {
    // TODO:
    // fill up like the above function
    const listItem = $('#template-list-item-transaction').clone();
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    listItem.find('.list-item-content-overview-title').html(getTxnTitle(txn));
    listItem.find('.list-item-content-overview-description').html(getTxnDescription(txn));
    listItem.find('.open-txn-new-tab').attr('href', getTxnUrl(txn));
    listItem.find('.open-txn-new-tab').attr('target', '_blank');
    container.append(listItem);
    return listItem;
  };

  const getTxnTitle = (txn) => {
    let result;
    if (txn.type === 'send' || txn.type === 'receive') {
      result = 'Transaction';
    } else if (txn.type === 'password') {
      if (txn.url === 'Secret note') {
        result = 'Secret Note'
      } else {
        result = 'Password';
      }
    }
    return result;
  };

  const getTxnDescription = (txn) => {
    let result;
    if (txn.type === 'send') {
      result = 'Sent ' + txn.amount + ' NAS to ' + txn.destination;
    } else if (txn.type === 'receive') {
      result = 'Received ' + txn.amount + ' NAS from ' + txn.source;
    } else if (txn.type === 'password') {
      if (txn.url === 'Secret note') {
        result = txn.login;
      } else {
        result = txn.url + ' / ' + txn.login;
      }
    }
    return result;
  }

  const getTxnUrl = (txn) => {
    let result = `https://explorer.nebulas.io/#/${info.network}/tx/${txn.txhash}`;
    return result;
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
        // append new
        const elementId = `recent-${transaction.type}_${transaction.txhash}`;
        const elementClass = `recent-${transaction.type}`;
        if ($(`#${elementId}`) && $(`#${elementId}`).length === 0) {
          listItem = createAndAppendTransaction(transaction, elementId, elementClass, $('#recent-entries'));
          attachResponsiveEvents(listItem);
        }
        console.log('transaction is', transaction);
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
        const bareLogin = entry.login.replace(/[^a-zA-Z0-9]/g, '_');
        const elementId = `active-${bareDomain}_${bareLogin}`;
        const elementClass = `${bareDomain} ${bareLogin} blockEntry`;
        const selectorString = `.${bareDomain}.${bareLogin}`;
        if ($(selectorString) && $(selectorString).length === 0) {
          const secretNote = entry.domain === "Secret note";
          if (!secretNote) {
            const newElement = createAndAppendCredential(entry, elementId, elementClass, $('#active-entries'));
            attachResponsiveEvents(newElement);
          } else {
            const newElement = createAndAppendSecretnote(entry, elementId, elementClass, $('#active-entries'));
            attachResponsiveEvents(newElement);
          }
        } else {
          console.log();
        }
        // componentHandler.upgradeAllRegistered();
      }
      // attachResponsiveEvents();
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

  const openNewCredential = () => {
    $('.btn-floating').hide();
    $('#overlay-div').fadeOut(100);
    $('#new-credential-container').show();
    $('#sliding-up-div').animate({
      top: 0,
    });
  };

  const openNewSecretnote = () => {
    $('.btn-floating').hide();
    $('#overlay-div').fadeOut(100);
    $('#new-secretnote-container').show();
    $('#sliding-up-div').animate({
      top: 0,
    });
  };

  const openNewTransaction = () => {
    $('.btn-floating').hide();
    $('#overlay-div').fadeOut(100);
    $('#new-transaction-container').show();
    $('#sliding-up-div').animate({
      top: 0,
    });
  };

  const closePopupView = (e) => {
    $('#sliding-up-div').animate({
      top: 600,
    });
    $('.btn-floating').show();
    $('#sliding-up-div').find('input').each(function (i, el) {
      $(el).val('');
    });
    $('#new-secretnote-content').val('');
    $('#new-credential-password').attr('type', 'text');
    $('#new-credential-password').closest('.new-credential-password-wrapper').attr('is-visible', 'false');
    $('#new-credential-password').closest('.new-credential-password-wrapper').find('.new-credential-toggle-visibility').html('visibility');
    $('#new-transaction-container').hide();
    $('#new-secretnote-container').hide();
    $('#new-credential-container').hide();
  };

  const toggleNewCredentialPasswordVisibility = (e) => {
    const wrapper = $(e.target).closest('.new-credential-password-wrapper');
    if (wrapper.attr('is-visible') === undefined || wrapper.attr('is-visible') === 'false') {
      wrapper.attr('is-visible', 'true');
      $('#new-credential-password').attr('type', 'text');
      $(e.target).html('visibility_off');
    } else {
      wrapper.attr('is-visible', 'false');
      $('#new-credential-password').attr('type', 'password');
      $(e.target).html('visibility');
    }
  };

  $('#close-popup-view').click(closePopupView);
  $('.new-credential-toggle-visibility').click(toggleNewCredentialPasswordVisibility);

  $('#new-credential-save').click(function (e) {
    // new-credential-domain
    // new-credential-login
    // new-credential-password
  });

  $('#new-secretnote-save').click(function (e) {
    // new-secretnote-title
    // new-secretnote-content
  });

  $('#new-transaction-send').click(function (e) {
    // new-transaction-destination
    // new-transaction-amount
  });

  const initFloatingActionButton = () => {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {
      hoverEnabled: false
    });
    $('#main-floating-action-btn').click(function (e) {
      e.stopPropagation();
      var instance = M.FloatingActionButton.getInstance($(e.currentTarget).parent()[0]);
      if (instance.isOpen) {
        $('#overlay-div').fadeOut(500);
        instance.close();
      } else {
        $('#overlay-div').fadeIn(500);
        instance.open();
        if (notAttachedFloatingEvents) {
          $('#new-credential').click(openNewCredential);
          $('#new-secretnote').click(openNewSecretnote);
          $('#new-transaction').click(openNewTransaction);
          notAttachedFloatingEvents = false;
        }
      }
    });
  };

  initFloatingActionButton();
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
