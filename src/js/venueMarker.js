/**
 * Custom marker based on https://humaan.com/blog/custom-html-markers-google-maps/
 */

module.exports =  class VenueMarker extends google.maps.OverlayView {
    constructor(item, map) {
        super();
        // Checking if item is a google places object or foursquare venue object
        item.isPlace = this.isPlace = item.hasOwnProperty('place_id');

        if (this.isPlace) {
            this.latlng = item.geometry.location;
        } else {
            this.latlng = new google.maps.LatLng(item.venue.location.lat, item.venue.location.lng);
        }

        this.item = item;
        this.setMap(map);
    }


    draw() {
        let div = this.div;

        if (!div) {

            div = this.div = document.createElement('div');
            div.className = 'icon-location2 marker';

            if (this.isPlace) {
                if (this.item.rating) {
                    let rating = document.createElement('span');
                    rating.className = 'badge';
                    rating.appendChild(document.createTextNode(this.item.rating));
                    rating.style.backgroundColor = this.item.ratingColor;

                    div.appendChild(rating);
                }
            } else {
                if (this.item.venue.rating) {
                    let rating = document.createElement('span');
                    rating.className = 'badge';
                    rating.appendChild(document.createTextNode(this.item.venue.rating));
                    rating.style.backgroundColor = '#' + this.item.venue.ratingColor;

                    div.appendChild(rating);
                }
            }

            google.maps.event.addDomListener(div, 'click', event => {
                google.maps.event.trigger(this, 'click', {
                    marker: this,
                    e: event
                });
            });


            let panes = this.getPanes();
            panes.overlayImage.appendChild(div);
        }

        // The icon is 24px big, so we want to offset x by -12 and y by -24
        // so that the the marker is just above the location
        let point = this.getProjection().fromLatLngToDivPixel(this.latlng);
        if (point) {
            div.style.left = point.x - 12 + 'px';
            div.style.top = point.y - 24 + 'px';
        }
    }

    remove() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
        }
    }

    getPosition() {
        return this.latlng;
    }
};
