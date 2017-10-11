/**
 * Based on https://humaan.com/blog/custom-html-markers-google-maps/
 */

module.exports =  class VenueMarker extends google.maps.OverlayView {
    constructor(item, map) {
        super();
        this.latlng = new google.maps.LatLng(item.venue.location.lat, item.venue.location.lng);
    	this.item = item;
    	this.setMap(map);
    }

    draw() {
    	let div = this.div;

    	if (!div) {

    		div = this.div = document.createElement('div');
            div.className = 'icon-location2 marker';

            let rating = document.createElement('span');
            rating.className = 'badge';
            rating.appendChild(document.createTextNode(this.item.venue.rating));
            rating.style.backgroundColor = "#" + this.item.venue.ratingColor;

            div.appendChild(rating);

    		google.maps.event.addDomListener(div, "click", event => {
    			google.maps.event.trigger(this, "click", {
                    marker: this,
                    e: event
                });
    		});


    		let panes = this.getPanes();
    		panes.overlayImage.appendChild(div);
    	}

    	let point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    	if (point) {
    		div.style.left = point.x + 'px';
    		div.style.top = point.y + 'px';
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
}
