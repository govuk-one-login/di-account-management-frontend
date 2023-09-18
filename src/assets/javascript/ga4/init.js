window.DI = window.DI || {}
window.DI.Analytics = window.DI.Analytics || {};
window.DI.Analytics.Ga4 = window.DI.Analytics.Ga4 || {};

(function (analytics) {

  'use strict'

  var init = function() {
    var constants = window.DI.Constants || {};
    window.DI.Analytics.loadGtm(constants.ga4TrackingId)
  
    initGlobalTrackers()
  }

  // Initialise trackers for GA4 events which can be tracked at the global page level, such as page_view events
  var initGlobalTrackers = function () {
    var trackers = window.DI.Analytics.Ga4.trackers
    for (var trackerName in trackers) {
      if (Object.hasOwn(trackers, trackerName)) {
        var tracker = trackers[trackerName]
        if (typeof tracker.init === 'function') {
          try {
            tracker.init()
          } catch (e) {
            // if there's a problem with the tracker, catch the error to allow other trackers to start
            /* eslint-disable-next-line no-console */
            console.warn('Error starting analytics tracker ' + tracker + ': ' + e.message, window.location)
          }
        }
      }
    }
  }

  analytics.init = init
})(window.DI.Analytics.Ga4)