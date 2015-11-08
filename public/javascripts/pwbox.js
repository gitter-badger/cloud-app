function togglePwBox() {
  var divOuter = $('#change-pw-div');
  var divInner = $('#change-pw-div-form');
  var preferencesLink = $('#preferences-link');
  if (divInner.css('display') === 'none') {
    // Open
    $(divOuter).animate({height:'200px'}).promise().then(function(){
          $(divInner).show();
          preferencesLink.html('Close Preferences');
    });
    return;
  } 
  // Close
  $(divOuter).animate({height:'0px'}).promise().then(function(){
    $(divInner).hide();
    preferencesLink.html('Open Preferences');
  });
}