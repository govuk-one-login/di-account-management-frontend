/* global window document */

window.DI = window.DI || {}
window.DI.Analytics.Ga4 = window.DI.Analytics.Ga4 || {}
window.DI.Analytics.Ga4.trackers = window.DI.Analytics.Ga4.trackers || {};

(function (trackers) {
  'use strict'

  var PageViewTracker = {

    init: function() {
      var data = {
        event: 'page_view_ga4',
        page_view: {
          language: this.getLanguage(),
          location: this.getLocation(),
          organisations: '<OT1056>',
          primary_publishing_organisation: 'government digital service - digital identity',
          status_code: this.getStatusCode(),
          title: this.getTitle(),
          referrer: this.getReferrer(),
          taxonomy_level1: 'accounts',
          taxonomy_level2: this.getTaxonomy2()
        }
      }
      window.DI.Analytics.sendData(data)
    },

    getLanguage: function() {
      return (window.DI.Cookies.getCookie('lng') || 'en').toLowerCase()
    },

    getStatusCode: function() {
      return window.DI.httpStatusCode || 200
    },
    
    getLocation: function() {
      return document.location.href ? document.location.href.toLowerCase() : undefined
    },
    
    getTitle: function() {
      return document.title ? document.title.toLowerCase() : undefined
    },

    getReferrer: function() {
      return document.referrer ? document.referrer.toLowerCase() : undefined
    },

    getTaxonomy2: function() {
      return 'account'
    }
  }

  trackers.PageViewTracker = PageViewTracker
})(window.DI.Analytics.Ga4.trackers)