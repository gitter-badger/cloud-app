$.urlParam = function(name){
    var results = new RegExp('[\?&amp;]' + name + '=([^&amp;#]*)').exec(window.location.href);
    return results[1] || 0;
}

function exportAllFencelogs() {
  if ($.urlParam('export') === 'csv') {
    // export as csv
    $.get('/account/export/fencelogs.csv', function (data) {
      $('.contents').html("<center>In a few seconds you'll receive an E-Mail with your exported Fencelogs attached as a CSV file.");
    })
  } else if ($.urlParam('export') === 'json') {
    // export as csv
    $.get('/account/export/fencelogs.json', function (data) {
      $('.contents').html("<center>In a few seconds you'll receive an E-Mail with your exported Fencelogs attached as a JSON file.");
    })
  }
}
