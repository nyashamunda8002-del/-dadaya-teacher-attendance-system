# Dadaya High Staff Clocking System — GPS Fix

The geofence uses the configured Dadaya High School coordinates:

- Latitude: -20.334154
- Longitude: 29.896333
- Allowed radius: 200 metres

## What was fixed

1. Coarse browser/Wi-Fi/IP location fixes are no longer accepted for attendance.
2. GPS fixes must have accuracy of 100 metres or better.
3. `maximumAge` is now 0 so stale cached positions are not preferred.
4. GPS requests wait longer for a precise position.
5. Automatic teacher clock-in only runs after a precise GPS fix.
6. Invalid latitude/longitude values are rejected.

## Important when testing

On a Windows desktop, Chrome may use Windows Location Services. If Windows location is disabled or inaccurate, the browser can report a position kilometres away even when the person is at school.

For the most reliable test:
- Turn on Windows Location Services.
- Allow Chrome to access your location.
- Prefer testing on an Android phone with GPS enabled.
- Refresh the site after granting location permission.
- Wait until the displayed GPS accuracy is 100m or better.

Do NOT solve a bad GPS reading by increasing the geofence to kilometres. The attendance security remains at the configured 200m boundary.
