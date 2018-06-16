$(document).ready(() => {
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

  const handleToggleVisibility = (e) => {
    const listItem = $(e.target).closest('.list-item');
    const listItemDetails = $(e.target).closest('.list-item-content-details');
    if (listItemDetails.attr('is-visible') == 'false') {
      enableVisibility(e);
    } else {
      disableVisibility(e);
    }
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
      disableVisibility({target: listItemParent.find('.toggle-visibility')[0]});
    }
  };

  const attachResponsiveEvents = (listItem) => {
    $(listItem).find('.toggle-dropdown-cancel').click(handleToggleDropdownCancel);
    $(listItem).find('.toggle-visibility').click(handleToggleVisibility);

    $(listItem).find('.list-item-content-overview.entries').click ((e) => {
      console.log("clicked FILL");
      const listItemParent = $(e.target).closest('.list-item');
      if (listItemParent.find('input.in-use').length === 0) return;
      console.log("FILLING for real");
      const credentials = {
        login: listItemParent.find('.list-item-content-details-key').val(),
        password: listItemParent.find('.list-item-content-details-value').val()
      };
      chrome.runtime.sendMessage({ type: "chooseCredentials", credentials: credentials});
      hideIframe();
    });
    $(listItem).find('.list-item-content-overview.entries').hover ((e) => {
      console.log('on hover');
      console.log($(listItem).find('.list-item-content-overview-fill'));
      $(listItem).find('.list-item-content-overview-fill').removeClass('hidden');
      $(listItem).find('.list-item-content-overview-description').addClass('hidden');
    }, (e) => {
      console.log('off hover');
      $(listItem).find('.list-item-content-overview-fill').addClass('hidden');
      $(listItem).find('.list-item-content-overview-description').removeClass('hidden');
    });
  };

  const createAndAppendEntry = (entry, elementId, elementClass) => {
    const listItem = $('#template-list-item-entry').clone();
    listItem.removeClass('hidden').addClass(elementClass).attr('id', elementId);
    listItem.find('.list-item-content-overview-title').html(entry.domain);
    listItem.find('.list-item-content-details-topic').html(entry.domain);
    listItem.find('.list-item-content-overview-description').html(entry.login);
    listItem.find('.list-item-content-details-key').val(entry.login);
    listItem.find('.list-item-content-details-value.real').val(entry.password);
    $('#show-credentials-options-main').append(listItem);
    const passwordField = listItem.find(`input.list-item-content-details-value`);
    passwordField.addClass('in-use').removeClass('hidden');
    listItem.find("textarea.list-item-content-details-value.real").addClass('hidden');
    attachResponsiveEvents(listItem);
  };

  const fillSelectionDialog = (credentials) => {
    for (const credential of credentials) {
      createAndAppendEntry(credential, credential.domain + ":" + credential.login, 'new-class-sample');
    }
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
