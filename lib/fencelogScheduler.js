exports.getSchedules = function (fencelogs, purpose) {
  // here the magic begins
  var schedules = [];
  for (var i = 0; i < fencelogs.length; i++) {
    var fencelog = fencelogs[i];
    if (fencelog.locationId.length === 0) {
      // there no locationId set, we'll bail out
      // console.log('Bailing out due to no locationId Set on _id: ' + fencelog._id);
      continue;
    }
    var nextFencelog = fencelogs[i + 1];
    if (typeof(nextFencelog) === 'undefined') {
      // theres ne ascendent, so we'll bail out here
      // console.log('Bailing out due to no ascendent Set on _id: ' + fencelog._id);
      break;
    }
    if (fencelog.locationId !== nextFencelog.locationId) {
      // those don't belong together, bail out
      // console.log('Bailing out due to no beloging together of _id: ' + fencelog._id + ' and _id: ' + nextFencelog._id);
      continue;
    }
    if (fencelog.eventType !== 'enter' && nextFencelog.eventType !== 'exit') {
      // those ain't the ones, bail me out scotty
      // console.log('Bailing out due to wrong eventType Set on _id: ' + fencelog._id);
      continue;
    }
    var schedule = {};
    if (purpose === 'calendar') {
      schedule = {
        id: fencelog.locationId,
        title: fencelog.locationId,
        url: '',
        class: 'event-info',
        start: new Date(fencelog.created_at).getTime(),
        end: new Date(nextFencelog.created_at).getTime()
      };
    } else {
      var stay = Math.abs((fencelog.created_at.getTime() - nextFencelog.created_at.getTime()) / 1000);
      schedule = {
        locationId: fencelog.locationId,
        checkIn: fencelog.created_at,
        checkOut: nextFencelog.created_at,
        stay: parseInt(stay)
      };
    }
    schedules.push(schedule);
  }
  return schedules;
}
