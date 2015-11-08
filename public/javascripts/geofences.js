function showMap(el, customUserLocation, geofenceCount) {
	if (geofenceCount >= 20) {
		return alert("You've reached the maximum limit of 20 Geofences, this is a technical limit. Please remove a Geofence before adding a new one.");
	}
	$("#add-map-div").animate({height:'700px'}).promise().then(function(){
		_initialize(true, customUserLocation);
		fillForm(customUserLocation);
		if (!customUserLocation) {
			$('input[name="geofenceId"]').val(null);
		}
		$('#radius-slider').css('width', $('#map-canvas').width());
		$('.slider').show();
		$('.add-map-element').show();
	});
	$(el).attr("onclick", "hideMap(this)");
	$(el).html("Hide Map");
}

function hideMap(el) {
	$("#add-map-div").animate({height:'0px'}).promise().then(function(){
		$('.slider').hide();
		$('.add-map-element').hide();
		$('input[name="geofenceId"]').val(null);
	});
	$(el).attr("onclick", "showMap(this)");
	$(el).html("Add");
}

function fillForm(geofence) {
	var locationId = null;

	var triggerOnArrival = true;
	var triggerOnArrivalMethod = 0;
	var triggerOnArrivalUrl = null;

	var triggerOnLeave = true;
	var triggerOnLeaveMethod = 0;
	var triggerOnLeaveUrl = null;

	var basicAuthEnabled = false;
	var basicAuthUsername = null;
	var basicAuthPassword = null;

	if (geofence) {
		locationId = geofence.locationId;

		triggerOnArrival = (geofence.triggerOnArrival.enabled === 'true');
		triggerOnArrivalMethod = parseInt(geofence.triggerOnArrival.method);
		triggerOnArrivalUrl = geofence.triggerOnArrival.url;

		if (triggerOnArrivalMethod === 1) {
			$('#trigger-arrival-method').html('GET');
			$('#trigger-arrival').val('1');
		}

		triggerOnLeave = (geofence.triggerOnLeave.enabled === 'true');
		triggerOnLeaveMethod = parseInt(geofence.triggerOnLeave.method);
		triggerOnLeaveUrl = geofence.triggerOnLeave.url;

		if (triggerOnLeaveMethod === 1) {
			$('#trigger-leave-method').html('GET');
			$('#trigger-leave').val('1');
		}

		basicAuthEnabled = (geofence.basicAuth.enabled === 'true');
		basicAuthUsername = geofence.basicAuth.username;
		basicAuthPassword = geofence.basicAuth.password;

	}
	$('#locationId').val(locationId);

	$('#trigger-arrival-enabled').prop('checked', triggerOnArrival);
	$('#trigger-arrival-url').val(triggerOnArrivalUrl);

	$('#trigger-leave-enabled').prop('checked', triggerOnLeave);
	$('#trigger-leave-url').val(triggerOnLeaveUrl);

	$('#basic-auth-enabled').prop('checked', basicAuthEnabled);
	$('#basic-auth-username').val(basicAuthUsername);
	$('#basic-auth-password').val(basicAuthPassword);
}

function addCircle(radius) {
	var circleOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.35,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: window.map,
      center: window.userMarker.position,
      radius: radius
    };
    var geofenceCircle = new google.maps.Circle(circleOptions);
    window.geofenceCircle = geofenceCircle;
}

function createSlider(minRange, maxRange) {
   $('#radius-slider').slider({
        min: minRange,
        max: maxRange,
    	value: 50,
    	tooltip: 'hide'
    }).on('slide', function(ev) {
    	window.geofenceCircle.setOptions({radius: ev.value});
	});
}

function changeSliderRange(newMin, newMax) {
	var oldSliderWidth = $("#radius-slider").css("width");
  $(".slider").remove();
  $("#radius-slider-div").after("<input id='radius-slider' type='text' style='display: none; width: "+ oldSliderWidth + ";'/>");
  createSlider(newMin, newMax);
}

function saveGeofence() {
	var geofence = {
		locationId: $('#locationId').val(),
		location: {
			lon: window.userMarker.getPosition().lng(),
			lat: window.userMarker.getPosition().lat(),
			radius: $('#radius-slider').data('value') ? $('#radius-slider').data('value') : 50
		},
		triggerOnArrival: {
			enabled: $('#trigger-arrival-enabled').is(':checked'),
			method: parseInt($('#trigger-arrival').val() ? $('#trigger-arrival').val() : 0),
			url: $('#trigger-arrival-url').val()
		},
		triggerOnLeave: {
			enabled: $('#trigger-leave-enabled').is(':checked'),
			method: parseInt($('#trigger-leave').val() ? $('#trigger-leave').val() : 0),
			url: $('#trigger-leave-url').val()
		},
		basicAuth: {
			enabled: $('#basic-auth-enabled').is(':checked'),
			username: $('#basic-auth-username').val(),
			password: $('#basic-auth-password').val()
		}
	};
	var geofenceId = $('input[name="geofenceId"]').val();
	if (geofenceId.length === 0) {
		$.post('/account/geofence/add', geofence).done(function(result) {
			if (result.error === false) {
				hideMap($('#showHideMap'));
				listGeofences();
			}
		});
	} else {
		$.ajax({
			url: '/account/geofence/' + geofenceId,
			type: 'PUT',
			data: geofence,
			success: function(result) {
				if (result.error === false) {
					hideMap($('#showHideMap'));
					listGeofences();
				}
			}
		});
	}
}

function listGeofences() {
	$.get('/account/geofence').done(function(response) {
		$('#geofences-div').html(
			$('<table>').addClass('table').attr('id', 'geofences-table').append(
				$('<tr>').append(
					$('<td>').append($('<b>').text('Custom Location ID')),
					$('<td>').append($('<b>').text('Location (Lon, Lat)')),
					$('<td>'),
					$('<td>')
				)
			)
		);
		$.each(response.geofences, function(i, item) {
      $('<tr>').append(
          $('<td>').text(item.locationId),
          $('<td>').text(parseFloat(item.location.lon).toFixed(2) + ', ' + parseFloat(item.location.lat).toFixed(2)),
          $('<td>').append($('<a>').text('View / Edit').attr('href', '#').attr('onclick', "editGeofence('" + item._id + "')")),
					$('<td>').append($('<a>').attr('href', '#').attr('onclick', "removeGeofence('" + item._id + "')").append('<span class="glyphicon glyphicon-remove">'))
      ).appendTo('#geofences-table');
    });
		$('#geofences-div').append('</table>');
		$('#showHideMap').attr('onclick', 'showMap(this, null, ' + response.geofences.length + ')');
	});
}

function editGeofence(geofenceId) {
	$.ajax({
		url: '/account/geofence/' + geofenceId,
		type: 'GET',
		success: function(result) {
			var geofence = result.geofence;
			$('input[name="geofenceId"]').val(geofence._id);
			showMap($('#showHideMap'), geofence);
		}
	});
}

function removeGeofence(geofenceId) {
	swal({title:'Remove Geofence', text:'Really delete this Geofence?', type:'warning', showCancelButton:true}, function(){
		$.ajax({
	    	url: '/account/geofence/' + geofenceId + '/remove',
	    	type: 'DELETE',
	    	success: function(result) {
	        listGeofences();
	    	}
		});
	});
}

$(document).ready(function () {
	listGeofences();
});

$(document).on('user_location_initialized', function () {
	if (!window.geofenceCircle) {
		if (window.editedGeofence) {
			addCircle(parseInt(window.editedGeofence.location.radius));
		} else {
			addCircle(50);
		}
	}
	window.map.setZoom(15);
	window.map.setCenter(window.userMarker.position);

	window.map.setOptions({disableDefaultUI: false});

	google.maps.event.addListener(map, 'zoom_changed', function() {
    	var zoomLevel = map.getZoom();
    	changeSliderRange(25, 250.0 * ((15.0 / zoomLevel) * Math.pow(Math.max(1, (15 - zoomLevel)), 2)));
  	});

  	google.maps.event.addListener(window.userMarker, 'dragend', function() {
    	window.geofenceCircle.setCenter(window.userMarker.position);
	});

});
