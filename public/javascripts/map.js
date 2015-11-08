var map;
function initialize(draggable) {
  _initialize(draggable, null);
}

function _initialize(draggable, geofence) {
  window.geofenceCircle = null;
  var mapOptions = {
    zoom: 5,
    center: new google.maps.LatLng(52.2230, 9.4420),
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  window.map = map;
  $(document).trigger('map_initialized');

  // Use custom userLocation
  if (geofence) {
    var image = new google.maps.MarkerImage(
      '/images/marker.png',
      null, // size
      null, // origin
      new google.maps.Point(8, 8), // anchor (move to center of marker)
      new google.maps.Size(17, 17) // scaled size (required for Retina display icon)
    );
    if (window.userMarker) {
      window.userMarker.setMap(null);
    }
    // then create the new marker
    var customUserLocation = new google.maps.LatLng(parseFloat(geofence.location.lat), parseFloat(geofence.location.lon));
    window.editedGeofence = geofence;

    myMarker = new google.maps.Marker({
      flat: true,
      icon: image,
      map: map,
      optimized: false,
      position: customUserLocation,
      title: 'Your Position',
      visible: true,
      draggable: (typeof draggable === 'boolean') ? draggable : false
    });

    myMarker.setPosition(customUserLocation);
    window.userMarker = myMarker;
    window.userPosition = {lon: customUserLocation.lng(), lat: customUserLocation.lat()};

    $(document).trigger('user_location_initialized');
    return;
  }

  // Try HTML5 geolocation
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      var image = new google.maps.MarkerImage(
        '/images/marker.png',
        null, // size
        null, // origin
        new google.maps.Point(8, 8), // anchor (move to center of marker)
        new google.maps.Size(17, 17) // scaled size (required for Retina display icon)
      );
      if (window.userMarker) {
        window.userMarker.setMap(null);
      }
      // then create the new marker
      myMarker = new google.maps.Marker({
        flat: true,
        icon: image,
        map: map,
        optimized: false,
        position: pos,
        title: 'Your Position',
        visible: true,
        draggable: (typeof draggable === 'boolean') ? draggable : false
      });

      myMarker.setPosition(pos);
      window.userMarker = myMarker;
      window.userPosition = {lon: position.coords.longitude, lat: position.coords.latitude};

      $(document).trigger('user_location_initialized');

    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }

  $(document).trigger('map_initialized');
}

function handleNoGeolocation(errorFlag) {
  if (errorFlag) {
    var content = 'Error: The Geolocation service failed.';
  } else {
    var content = 'Error: Your browser doesn\'t support geolocation.';
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };

  map.setCenter(options.position);
}

google.maps.event.addDomListener(window, 'load', initialize);
