$(document).ready(function () {
  $.ajax('/api/status?purpose=check&service=webapp')
  .done(function (webapp) {
    var webappObj = $('#webapp');
    if (webappObj.hasClass('pending')) {
      webappObj.removeClass('pending');
      webappObj.addClass((webapp.state === 'online') ? 'on' : 'off');
      webappObj.html('Online');
    }
  });

  $.ajax('/api/status?purpose=check&service=fencelog')
  .then(function (fencelog) {
    var fencelogObj = $('#fencelog');
    if (fencelogObj.hasClass('pending')) {
      fencelogObj.removeClass('pending');
      fencelogObj.addClass((fencelog.state === 'online') ? 'on' : 'off');
      fencelogObj.html('Online');
    }
  });

  $.ajax('/api/status?purpose=check&service=oauth')
  .then(function (oauth) {
    var oauthObj = $('#oauth');
    if (oauthObj.hasClass('pending')) {
      oauthObj.removeClass('pending');
      oauthObj.addClass((oauth.state === 'online') ? 'on' : 'off');
      oauthObj.html('Online');
    }
  });

  $.ajax('/api/status?purpose=check&service=socketio')
  .then(function (socketio) {
    var socketioObj = $('#socketio');
    if (socketioObj.hasClass('pending')) {
      socketioObj.removeClass('pending');
      socketioObj.addClass((socketio.state === 'online') ? 'on' : 'off');
      socketioObj.html('Online');
    }
  });

  $.ajax('/api/status?purpose=check&service=mqtt')
  .then(function (mqtt) {
    var socketioObj = $('#mqtt');
    if (socketioObj.hasClass('pending')) {
      socketioObj.removeClass('pending');
      socketioObj.addClass((mqtt.state === 'online') ? 'on' : 'off');
      socketioObj.html('Online');
    }
  });

});
