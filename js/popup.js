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
      // console.log(info);
      $('#newAccountMain').hide();
      $('#public-address-notice').html('Your Nebulas public address is : ' + response.account.address);
      $('#newAccountSuccess').show();
    });
  });

  const handleSaveKeystore = () => {
    if (info.account.keystore === null || info.account.keystore === undefined || info.account.keystore === '') return;
    const address = JSON.parse(info.account.keystore).address;
    const fileName = 'nebulas-'.concat(info.network).concat('-').concat(address).concat('.json');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(info.account.keystore));
    element.setAttribute('download', fileName);
    document.body.appendChild(element);
    element.click();
    // refresh(info);
    // creatingOrRestoring = false;
  };

  const handleClaimFreeNas = () => {
    if (info.account && info.account.address && info.account.address !== undefined && info.account.address !== '') {
      window.open(`https://blockproject.io/faucet?address=${info.account.address}`, "_blank");
    } else {
      window.open("https://blockproject.io/faucet", "_blank");
    }
  };

  $('#saveKeystoreBtn').click(handleSaveKeystore);
  $('#claimFreeNas').click(handleClaimFreeNas);
  $('#my-account-download-keystore-btn').click(handleSaveKeystore);
  $('#enter-block').click(function () {
    refresh(info);
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
      readFileContent(input.files[0]).then(content => {
        // console.log('read this content');
        // console.log(content);
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
      $("#unlock-keystore-password").val('');
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
      // console.log('info.account.address = ', info.account.address);
      if (info.unlockAccount.wrongPass) {
        $("#cryptpass-popup-login-main-wrong-password").show();
      } else {
        $("#cryptpass-popup-login-main-wrong-password").hide();
      }
    } else {
      refresh(info);
      creatingOrRestoring = false;
    }
  }

  //////////// ADDED AS PART OF NEW UI (BEGIN) ////////////

  const enableVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    listItemDetails.find('.list-item-content-details-value').attr('type', 'text');
    listItemDetails.find('textarea.list-item-content-details-value.real.in-use').removeClass('hidden');
    listItemDetails.find('textarea.list-item-content-details-value.dummy.in-use').addClass('hidden');
    listItemDetails.find('.toggle-visibility').html('visibility');
    listItemDetails.attr('is-visible', 'true');
  };

  const disableVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    listItemDetails.find('.list-item-content-details-value').attr('type', 'password');
    listItemDetails.find('textarea.list-item-content-details-value.real.in-use').addClass('hidden');
    listItemDetails.find('textarea.list-item-content-details-value.dummy.in-use').removeClass('hidden');
    listItemDetails.find('.toggle-visibility').html('visibility_off');
    listItemDetails.attr('is-visible', 'false');
  };

  const handleToggleDropdownCancel = (e) => {
    const listItemParent = $(e.target).closest('.list-item');
    if (listItemParent.attr('expanded') == 'false') {
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
      disableVisibility({target: listItemParent.find('.toggle-visibility')[0]});
    }
  };

  const disableEdit = (e) => {
    const listItemParent = $(e.target).closest('.list-item');
    const listItemDetails = listItemParent.find('.list-item-content-details');
    if (listItemDetails.attr('edit-mode') == 'true') {
      listItemDetails.attr('edit-mode', 'false');

      const valueItem = listItemDetails.find('.list-item-content-details-value.in-use.real');
      valueItem.prop('readonly', true);
      valueItem.val(valueItem.attr('pastValue'));
      valueItem.removeClass('editting');

      listItemDetails.find('.toggle-edit-done').html('edit');
      listItemDetails.find('.toggle-edit-done').parent().removeClass('mdl-color-text--green-500');
      disableVisibility({target: listItemDetails.find('.toggle-visibility')[0]});
    }
  };

  const handleEditCredentials = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    const valueItem = listItemDetails.find('.list-item-content-details-value.in-use.real');
    const credentialsObj = {
      domain: listItemDetails.find('.list-item-content-details-topic').html(),
      login: listItemDetails.find('.list-item-content-details-key').val(),
      password: valueItem.val(),
    };
    valueItem.attr('pastValue', valueItem.val());
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: credentialsObj});
    disableEdit(e);
  };

  const enableEdit = (e) => {
    // console.log('enabling edit');
    const listItemParent = $(e.target).closest('.list-item');
    const listItemDetails = listItemParent.find('.list-item-content-details');
    if (listItemDetails.attr('edit-mode') == 'false') {
      listItemDetails.attr('edit-mode', 'true');
      enableVisibility(e);
      // const keyItem = listItemDetails.find('.list-item-content-details-key');
      // keyItem.attr('pastValue', keyItem.val());

      const valueItem = listItemDetails.find('.list-item-content-details-value.in-use.real');
      valueItem.prop('readonly', false);
      valueItem.attr('pastValue', valueItem.val());
      valueItem.addClass('editting');
      listItemDetails.find('.toggle-edit-done').html('done');
      listItemDetails.find('.toggle-edit-done').parent().addClass('mdl-color-text--green-500');
    } else {
      handleEditCredentials(e);
    }
  };

  const handleToggleVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItemDetails.attr('is-visible') == 'false') {
      enableVisibility(e);
    } else {
      disableVisibility(e);
    }
  };

  const attachResponsiveEvents = (listItem) => {
    $(listItem).find('.toggle-dropdown-cancel').click(handleToggleDropdownCancel);
    $(listItem).find('.toggle-edit-done').click(enableEdit);
    $(listItem).find('.toggle-visibility').click(handleToggleVisibility);
    $(listItem).find('.button-delete').click((e) => {
      if (confirm(`Are you sure you want to delete this entry ?`)) {
        const valueItem = $(listItem).find('.list-item-content-details-value.in-use.real');
        valueItem.val("");
        handleEditCredentials(e);
        $(listItem).addClass('hidden');
      }
    });

    $(listItem).find('.list-item-content-overview.entries').click ((e) => {
      // console.log("clicked FILL");
      const listItemParent = $(e.target).closest('.list-item');
      if (listItemParent.find('input.in-use').length === 0) return;
      console.log("FILLING for real, pass = ", );
      chrome.runtime.sendMessage({ type: "chooseCredentials", credentials: {
        login: listItemParent.find('.list-item-content-details-key').val(),
        password: listItemParent.find('.list-item-content-details-value').val()
      }})
    });
    $(listItem).find('.list-item-content-overview.entries').hover ((e) => {
      if ($(e.target).closest('.list-item').find("textarea.in-use").length > 0) return;
      // console.log('on hover');
      // console.log($(listItem).find('.list-item-content-overview-fill'));
      $(listItem).find('.list-item-content-overview-fill').removeClass('hidden');
      $(listItem).find('.list-item-content-overview-description').addClass('hidden');
    }, (e) => {
      // console.log('off hover');
      $(listItem).find('.list-item-content-overview-fill').addClass('hidden');
      $(listItem).find('.list-item-content-overview-description').removeClass('hidden');
    });
  };

  const displayMyAccountInfo = (info) => {
    $('#my-account-public-address').val(info.account.address).click((e) => {
      window.open(`https://explorer.nebulas.io/#${info.network == 'testnet' ? info.network : ""}/address/${info.account.address}`, "_blank");
    });

    const balance = parseInt(info.account.balance) / (10 ** 18);
    $('#my-account-balance').html(balance.toFixed(5) + ' NAS');
    $('#my-account-nonce').html(info.account.nonce);
  };

  const togglePrivateKey = () => {
    if ($('#my-account-privatekey-wrapper').attr('is-visible') === 'true') {
      $('#my-account-private-key').hide();
      $('#my-account-private-key').html('');
      $('#my-account-view-privatekey-password-wrapper').show();
      $('#my-account-view-privatekey-password').val('');
      $('#view-private-key').html('VIEW');
      $('#my-account-privatekey-wrapper').attr('is-visible', 'false');
    } else {
      chrome.runtime.sendMessage({
        type: "unlockAccount",
        password: $('#my-account-view-privatekey-password').val()
      }, function (response) {
        if (response.unlockAccount.unlocked) {
          $('#my-account-view-privatekey-password-wrapper').hide();
          $('#my-account-private-key').show();
          $('#my-account-private-key').html(response.account.privKey);
          $('#view-private-key').html('HIDE');
          $('#my-account-privatekey-wrapper').attr('is-visible', 'true');
        }
      });
    }
  };

  const copyAddressToClipboard = () => {
    document.getElementById("my-account-public-address").select();
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    document.getElementById("copy-public-address-snackbar").MaterialSnackbar.showSnackbar({
      message: 'Copied to clipboard',
    });
  };

  const initMyAccountEvents = () => {
    $('#view-private-key').click(togglePrivateKey);
    $('#my-account-public-address-copy').click(copyAddressToClipboard);
  };

  const createAndAppendTransaction = (txn, elementId, elementClass, container) => {
    const listItem = $('#template-list-item-transaction').clone();
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    listItem.find('.list-item-content-overview-title').html(getTxnTitle(txn));
    listItem.find('.list-item-content-overview-description').html(getTxnDescription(txn));
    listItem.click((e) => {
      window.open(getTxnUrl(txn), '_blank');
    });
    listItem.find('.open-txn-new-tab-i')
      .html(["error", "done", "hourglass_empty", "hourglass_empty"][txn.status])
      .addClass(["error-tx", "done-tx", "pending-tx", "queued-tx"][txn.status])
      .css('color', ['red', '#1564c0', 'grey'][txn.status]);
    container.prepend(listItem);
    return listItem;
  };

  const getTxnTitle = (txn) => {
    let result;
    if (txn.type === 'send') {
      result = 'Send NAS';
    } else if (txn.type === 'password') {
      if (txn.url === 'Secret note') {
        result = 'Secret note'
      } else {
        result = 'Password';
      }
    } else {
      if (txn.url === 'Secret note') {
        result = 'Delete secret note'
      } else {
        result = 'Delete password';
      }
    }
    return result;
  };

  const getTxnDescription = (txn) => {
    let result;
    if (txn.type === 'send') {
      result = txn.amount + ' NAS to ' + txn.destination.slice(0,16) + '...';
      // result = 'Sent ' + txn.amount + ' NAS';
    } else {
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

  $("#new-transaction-send").click(function() {
    const destination = $("#new-transaction-destination").val();
    const amount = $("#new-transaction-amount").val();

    if (destination === "" || amount === 0) {
      const message = {message: 'Invalid destination address or amount'};
      document.querySelector('#new-transaction-snackbar-error').MaterialSnackbar.showSnackbar(message);
      return;
    }
    if (amount > info.account.balance) {
      const message = {message: 'You do not have sufficient balance to make this transaction'};
      document.querySelector('#new-transaction-snackbar-error').MaterialSnackbar.showSnackbar(message);
      return;
    }

    $('#new-transaction-destination').val("");
    $('#new-transaction-amount').val(0);

    chrome.runtime.sendMessage({
      type: "sendNas",
      destination,
      amount,
    });
    closePopupView();
    const message = {message: 'Sent ' + amount + ' NAS to ' + destination};
    document.querySelector('#new-transaction-snackbar').MaterialSnackbar.showSnackbar(message);
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'infoForPopUp') {
      // console.log('got infoForPopUp');
      info = request.info;
      refresh(info);
    }
  });

  // const showSavePasswordDom = (obj) => {
  //   console.log('showing this div, ', obj);
  //   $('#save-credentials-domain').val(obj.domain);
  //   $('#save-credentials-login').val(obj.login);
  //   $('#save-credentials-password').val(obj.password);
  // };

  const refresh = (infoObject) => {
    $('#newAccount').hide();
    $('#newAccountIntro').hide();
    $('#newAccountMain').hide();
    $('#restoreAccount').hide();
    $('#unlockDiv').hide();
    $('#logged-in-view').hide();
    $('#loginKeystore').hide();


    if (infoObject == undefined) return;
    // if (!infoObject.agreedToPolicy) {
    //   $('#cryptpass-initial').hide();
    //   $('#cryptpass-main').hide();
    //   $('#privacy-policy').show();
    // } else
    if (infoObject.account.keystore == undefined) { // user haven't created account
      $('#cryptpass-main').hide();
      $('#cryptpass-initial').show();
      $("#newAccount").show();
      $('#newAccountIntro').show();
      $('#restoreAccount').show();
    } else if (!infoObject.unlockAccount.unlocked) { // user created account, haven't logged in
      // console.log('infoObject.account.address = ', infoObject.account.address);
      $('#cryptpass-main').hide();
      $('#cryptpass-initial').show();
      $("#loginKeystore").show();
      if (infoObject.unlockAccount.wrongPass) {
        $("#cryptpass-popup-login-main-wrong-password").show();
      } else {
        $("#cryptpass-popup-login-main-wrong-password").hide();
      }
    } else { // user already logged in
      console.log('refreshing for network', infoObject.network);
      // console.log('info = ', infoObject);
      $('#cryptpass-initial').hide();
      $('#cryptpass-main').show();
      displayMyAccountInfo(info);

      if (firstRefresh && (info.account.address !== undefined)) {
        initMyAccountEvents();
        firstRefresh = false;
      }

      for (transaction of infoObject.pastTransactions[infoObject.network]) {
        // append new
        const elementId = getTransactionId(transaction);
        const elementClass = `recent-${transaction.type}`;
        if ($(`#${elementId}`).length === 0) {
          listItem = createAndAppendTransaction(transaction, elementId, elementClass, $('#recent-entries'));
          // console.log('adding recent transaction : ', listItem);
          attachResponsiveEvents(listItem);
          // console.log('attachResponsiveEvents for transaction : ', listItem);
        } else {
          $(`#${elementId} .open-txn-new-tab-i`)
            .html(["error", "done", "hourglass_empty", "hourglass_empty"][transaction.status])
            .addClass(["error-tx", "done-tx", "pending-tx", "queued-tx"][transaction.status])
            .css('color', ['red', '#1564c0', 'grey'][transaction.status]);
        }
        // console.log('transaction is', transaction);
      }
      refreshRecentTransactions();

      for (entry of infoObject.allCredentialsArray[infoObject.network]) {
        if (entry.password === "") continue;
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        const bareLogin = entry.login.replace(/[^a-zA-Z0-9]/g, '_');
        const elementId = `active-${bareDomain}_${bareLogin}`;
        const elementClass = `${bareDomain} ${bareLogin} blockEntry`;
        const selectorString = `.${bareDomain}.${bareLogin}`;
        if ($(selectorString) && $(selectorString).length === 0) {
          createAndAppendEntry(entry, elementId, elementClass);
        }
      }
      // console.log('network =', infoObject.network, " balance = ", infoObject.account.balance);
      if (infoObject.network === "mainnet" && infoObject.account.balance == 0) {
        // console.log("showing free nas section");
        $('.get-free-nas-section').show();
      } else {
        // console.log("hiding free nas section");
        $('.get-free-nas-section').hide();
      }
      $('.free-nas-btn').attr('href', `https://blockproject.io/faucet?address=${infoObject.account.address}`);

      filterEntries();
      showCurrentNetwork();
    }
  }

  const getTransactionId = (tx) => {
    if (!tx.txIndex) { tx.txIndex = tx.txhash; }
    return `tx-${tx.txIndex}`;
  }
  const createAndAppendEntry = (entry, elementId, elementClass) => {
    const secretNote = entry.domain === "Secret note";
    // console.log("adding entry: ", entry);
    const listItem = $('#template-list-item-entry').clone();
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    listItem.find('.list-item-content-overview-title').html(entry.domain);
    listItem.find('.list-item-content-details-topic').html(entry.domain);
    listItem.find('.list-item-content-overview-description').html(entry.login);
    listItem.find('.list-item-content-details-key').val(entry.login);
    listItem.find('.list-item-content-details-value.real').val(entry.password);
    $('#active-entries').append(listItem);
    const passwordField = listItem.find(`${secretNote ? 'textarea' : 'input'}.list-item-content-details-value`);
    passwordField.addClass('in-use').removeClass('hidden');
    listItem.find("textarea.list-item-content-details-value.real").addClass('hidden');
    if (secretNote) {
      listItem.find('.list-item-icon i').html('speaker_notes');
    }
    attachResponsiveEvents(listItem);
  }

  const filterEntries = () => {
    const showEntries = (entries) => {
      $('.blockEntry').hide();
      for (entry of entries) {
        const bareDomain = entry.domain.replace(/[^a-zA-Z0-9]/g, '_');
        const bareLogin = entry.login.replace(/[^a-zA-Z0-9]/g, '_');
        $(`.${bareDomain}.${bareLogin}`).show();
      }
      if (entries.length === 0) {
        $('#such-empty').show();
      } else {
        $('#such-empty').hide();
      }
    }

    if (filterByCurrentDomain) {
      chrome.tabs.getSelected(null,function(tab) {
        const currentDomain = (new URL(tab.url)).hostname;
        // console.log('currentDomain = ', currentDomain);
        const matchingEntries = info.allCredentialsArray[info.network].filter((entry) => entry.domain === currentDomain);
        showEntries(matchingEntries);
        $('#active-entries-title').html("ON THIS SITE");
      });
    } else {
      const keyword = $('#search-field').val();
      const matchingEntries = info.allCredentialsArray[info.network].filter((entry) => (entry.domain + entry.login).includes(keyword));
      showEntries(matchingEntries);
      $('#active-entries-title').html(showingAll && keyword === "" ? "ALL ENTRIES" : "MATCHING ENTRIES");
    }

  }

  const requestRefreshFromBackground = function() {
    if (!creatingOrRestoring) {
      chrome.runtime.sendMessage({type: "requestInfo"}, (newInfo) => {
        info = newInfo;
        refresh(info);
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
      $(e.target).html('visibility');
    } else {
      wrapper.attr('is-visible', 'false');
      $('#new-credential-password').attr('type', 'password');
      $(e.target).html('visibility_off');
    }
  };

  $('#close-popup-view').click(closePopupView);
  $('.new-credential-toggle-visibility').click(toggleNewCredentialPasswordVisibility);

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

  const getHostname = (url) => {
    if (!url.includes("http://") && !url.includes("https://")) url = `https://${url}`;

    return (new URL(url)).hostname;
  }

  $('#new-credential-save').click(function (e) {
    const domain = getHostname($('#new-credential-domain').val());
    const login = $('#new-credential-login').val();
    const password = $('#new-credential-password').val();

    if (domain === "" || login === "" || password === "") {
      const message = {message: 'Invalid inputs, value cannot be empty'};
      document.querySelector('#new-credential-snackbar-error').MaterialSnackbar.showSnackbar(message);
      return;
    }

    if (info.account.balance === '0') {
      const snackbarData = {
        message: 'You need NAS to publish a transaction on the blockchain',
        timeout: 5000,
        actionHandler: handleClaimFreeNas,
        actionText: 'CLAIM'
      };
      document.querySelector('#new-credential-snackbar-error').MaterialSnackbar.showSnackbar(snackbarData);
      return;
    }

    const obj = {
      domain,
      login,
      password
    };
    $('#new-credential-domain').val("");
    $('#new-credential-login').val("");
    $('#new-credential-password').val("");
    closePopupView();
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj});
    const message = {message: 'Saved new ' + domain + ' credential for ' + login};
    document.querySelector('#new-credential-snackbar').MaterialSnackbar.showSnackbar(message);
  });

  $('#new-secretnote-save').click(function (e) {
    const login = $('#new-secretnote-title').val();
    const password = $('#new-secretnote-content').val();
    if (login === "" || password === "") {
      const message = {message: 'Invalid inputs, input cannot be empty'};
      document.querySelector('#new-secretnote-snackbar-error').MaterialSnackbar.showSnackbar(message);
      return;
    }
    if (info.account.balance === '0') {
      const snackbarData = {
        message: 'You need NAS to publish a transaction on the blockchain',
        timeout: 5000,
        actionHandler: handleClaimFreeNas,
        actionText: 'CLAIM'
      };
      document.querySelector('#new-secretnote-snackbar-error').MaterialSnackbar.showSnackbar(snackbarData);
      return;
    }
    const obj = {
      domain: "Secret note",
      login,
      password
    };
    $('#new-secretnote-title').val("");
    $('#new-secretnote-content').val("");
    console.log('saving secret note');
    closePopupView();
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj});
    const message = {message: 'Saved new secret note ' + login};
    document.querySelector('#new-secretnote-snackbar').MaterialSnackbar.showSnackbar(message);
  });

  $('#search-field').keyup(() => {
    // console.log('search field is changed');
    if (!showingAll) {
      filterByCurrentDomain = $('#search-field').val() === "" ? true : false;
    }
    filterEntries();
  });

  $('.mainnet.select-network').click((e) => {
    changeNetwork('mainnet');
  });

  $('.testnet.select-network').click((e) => {
    changeNetwork('testnet');
  });

  $('#logout-keystore').click((e) => {
    chrome.runtime.sendMessage({ type: "logout" });
    info.unlockAccount.unlocked = false;
    refresh(info);
    creatingOrRestoring = true;
    firstRefresh = true;
  });

  $('#tab-past-activity').click((e) => {
    $('#recent-entries').detach().appendTo("#all-transactions-container");
    $('.transaction-item').removeClass('hidden');
  });

  $('#tab-favorite').click((e) => {
    $('#recent-entries').detach().appendTo(".tab-favorite-recent-transactions");
    $('.tab-favorite-active-now').detach().prependTo(".tab-favorite");
    $('.tab-favorite-search').detach().prependTo(".tab-favorite");
    showingAll = false;
    filterByCurrentDomain = true;
    filterEntries();
    refreshRecentTransactions();
  });

  $('#tab-all-entries').click((e) => {
    $('.tab-favorite-search').detach().appendTo("#all-entries-container");
    $('.tab-favorite-active-now').detach().appendTo("#all-entries-container");
    showingAll = true;
    filterByCurrentDomain = false;
    filterEntries();
    refreshRecentTransactions();
  });

  $('#see-all-tnxs-btn').click((e) => {
    $('#tab-past-activity').trigger("click");
    $('.mdl-layout__tab-panel').removeClass('is-active');
    $('.mdl-layout__tab-bar a').removeClass('is-active');
    $('#scroll-tab-2').addClass('is-active');
    $('#tab-past-activity').addClass('is-active');
  });

  // $('#agree-policy').click((e) => {
  //   chrome.runtime.sendMessage({ type: "agreePolicy" });
  //   info.agreedToPolicy = true;
  // });

  const refreshRecentTransactions = () => {
    const transactionCount = info.pastTransactions[info.network].length;
    if (transactionCount === 0) {
      $('.recent-transactions').hide();
      return;
    } else {
      $('.recent-transactions').show();
    }
    $(".tab-favorite-recent-transactions .transaction-item").addClass('hidden');
    const startIndex = Math.max(0, transactionCount - 3);
    // console.log('transactions to be shown: ', info.pastTransactions[info.network].slice(startIndex, transactionCount));
    for (const transaction of info.pastTransactions[info.network].slice(startIndex, transactionCount)) {

      const elementId = getTransactionId(transaction);
      // console.log('showing elementid =', elementId);
      $(`.tab-favorite-recent-transactions #${elementId}`).removeClass('hidden');
    }
  }

  const showCurrentNetwork = () => {
    $('.active-network').hide();
    $(`.active-network.${info.network}`).show();
    // console.log('Current network: ', info.network);
  }

  const changeNetwork = (network) => {
    console.log('changing network to ', network);
    info.network = network;
    const item = $('.blockEntry').remove();
    $('#recent-entries').html('');
    refresh(info);
    chrome.runtime.sendMessage({ type: "changeNetwork", network });
    showCurrentNetwork();
  }
})
