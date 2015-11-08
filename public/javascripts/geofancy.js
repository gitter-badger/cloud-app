function Geofancy() {

}

Geofancy.prototype.showPersonalStats = function () {
  var gfs = $('#gfs');
  if (gfs.hasClass('hidden')) {
    gfs.removeClass('hidden');
  }
}

$(document).ready(function () {
  Geofancy = new Geofancy();
});