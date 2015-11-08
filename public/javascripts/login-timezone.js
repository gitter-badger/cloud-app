$(document).ready(function(){
  var tz = jstz.determine().name();
  $('input#timezone').val(tz);
});