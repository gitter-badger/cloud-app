var loaderBox;
var tfaBox;
var errorBox;
var tfaToggle;

$(document).ready(function () {
  loaderBox = $('.row-loader');
  tfaBox = $('.row-tfa');
  errorBox = $('.row-error');

  tfaToggle = $('#tfa-toggle');
  tfaToggle.click(function () {
    tfaToggle.prop('checked', !tfaToggle.is(':checked'));
    if (!tfaToggle.is(':checked')) {
      return $.colorbox({iframe: true, width: '800px', height: '80%', opacity: 0.6, fixed: true, href: '/account/tfa'});
    };
    askToDisableTfa();
  });

  $('#tfa-form').keypress(function (e) {     
    var charCode = e.charCode || e.keyCode || e.which;
    if (charCode  == 13) {
      return false;
    }
  });
});

function askToDisableTfa() {
  swal({
    title:'Disable 2FA', 
    text:'Would you really like to disable Two-Factor authentication?', 
    type:'warning',
    showCancelButton:true
  }, function () {
    disableTfa();
  });
}

function disableTfa() {
  $.ajax('/account/tfa', {
    type: 'DELETE'
  })
  .done(function (data) {
    setTimeout(function () {
      parent.tfaToggle.prop('checked', false);
      swal({
        title:'2FA disabled',
        text:'Two-Factor authentication has successfully been disabled.',
        type:'info'
      });
    }, 500);
  })
  .fail(function( jqXHR, textStatus, errorThrown ) {
    setTimeout(function () {
      swal({
        title:'Error disabling 2FA',
        text:'There was an error when trying to disable your Two-Factor authentication, please try again.',
        type:'error'
      });
    }, 500)
  });
}

function activateTfa() {
  showTfa(false);
  showError(false);
  showLoader(true);

  $.ajax('/account/tfa', {
    type: 'POST',
    data: {
      secret: $('#tfa-secret').val(),
      token: $('#tfa-token').val()
    }
  })
  .done(function (data) {
    setTimeout(function () {
      showLoader(false);
      parent.tfaToggle.prop('checked', true);
      parent.$.colorbox.close();
    }, 1000);
  })
  .fail(function( jqXHR, textStatus, errorThrown ) {
    showLoader(false);
    showTfa(true);
    showError(true);
  });
}

function showError (show) {
  if (show) {
    tfaBox.css('padding-top', '0px');
    return errorBox.show();
  }
  tfaBox.css('padding-top', '');
  errorBox.hide();
}

function showTfa (show) {
  if (show) {
    return tfaBox.show();
  }
  tfaBox.hide();
}

function showLoader (show) {
  if (show) {
    return loaderBox.show();
  }
  loaderBox.hide();
}

function unlockAccount () {
  $.ajax('/two-factor', {
    type: 'POST',
    data: {
      token: $('#tfa-token').val()
    }
  })
  .done(function (data) {
    window.location = '/account';
  })
  .fail(function ( jqXHR, textStatus, errorThrown ) {
    showError(true);
  });
}

