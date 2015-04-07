var Backbone = require('backbone'),
    geocoder = require('leaflet-control-geocoder');

Backbone.Form.editors.Geocoder = Backbone.Form.editors.Hidden.extend ({
  events: {
  },

  initialize: function(options) {
    var that = this;
    Backbone.Form.editors.Hidden.prototype.initialize.call(this, options);
    setTimeout(function(){that.createMap();}, 500);
  },

  createMap: function() {
    var map = L.map('map-form').setView([0, 0], 2),
        geocoders = {
            'Nominatim': L.Control.Geocoder.nominatim(),
            'Bing': L.Control.Geocoder.bing('AoArA0sD6eBGZyt5PluxhuN7N7X1vloSEIhzaKVkBBGL37akEVbrr0wn17hoYAMy'),
            'Google': L.Control.Geocoder.google('AIzaSyC5W2oY1NB6pWI0RATM8BhkPdfxNWnlg4o')
        },
        selector = L.DomUtil.get('geocode-selector'),
        control = new L.Control.Geocoder({ geocoder: null }),
        btn,
        selection,
        marker;

    L.Icon.Default.imagePath = '/assets/leaflet'

    function select(geocoder, el) {
        if (selection) {
            L.DomUtil.removeClass(selection, 'selected');
        }

        control.options.geocoder = geocoder;
        L.DomUtil.addClass(el, 'selected');
        selection = el;
    }

    for (var name in geocoders) {
        btn = L.DomUtil.create('button', '', selector);
        btn.innerHTML = name;
        (function(n) {
            L.DomEvent.addListener(btn, 'click', function() {
                select(geocoders[n], this);
            }, btn);
        })(name);

        if (!selection) {
            select(geocoders[name], btn);
        }
    }

    L.tileLayer('http://api.tiles.mapbox.com/v3/liedman.jokgn3nn/{z}/{x}/{y}.png', {
        attribution: '<a href="http://osm.org/copyright">Terms & Feedback</a>'
    }).addTo(map);

    control.addTo(map);

    map.on('click', function(e) {
        control.options.geocoder.reverse(e.latlng, map.options.crs.scale(map.getZoom()), function(results) {
            var r = results[0];
            if (r) {
                if (marker) {
                    map.removeLayer(marker);
                }
                marker = L.marker(r.center).bindPopup(r.html || r.name).addTo(map).openPopup();
            }
        })
    });

    setTimeout(function(){map.invalidateSize();}, 0);
  }


});
