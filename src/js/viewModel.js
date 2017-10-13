import mapStyle from './mapstyle.js';

let VenueMarker;
let map;
let placesService;
let searchBox;
let neighborhoodBounds;

// Foursquare api auth data
const foursquareAuth = {
    id: 'XRYRBFDPCQ3RJPBPUVH3LWG31LO2RIGHADDC541HGU3SYBSB',
    secret: '4AIOCYXHZXHGH1T5F0BAKPOUTLQFRMMTBF2KR1RFUYPHAETL'
};

// This is the main (and only) view model
export default class ViewModel {
    constructor() {
        // Declaring VenueMarker here because it requires 'google' to be loaded
        VenueMarker = require('./venueMarker.js');
        let mapCenter = {
            lat: 56.948890,
            lng: 24.107518
        };

        // Whether we limit search data to the neighborhood or the map bounds
        this.limitToNeighborhood = ko.observable(true);

        // Holds all markers
        this.markers = [];

        // Foursquare category filters
        this.categories = [
            {
                id: 'topPicks',
                name: 'Top picks'
            }, {
                id: 'food',
                name: 'Food'
            }, {
                id: 'drinks',
                name: 'Drinks'
            }, {
                id: 'coffee',
                name: 'Cofee',
            }, {
                id: 'shops',
                name: 'Shops'
            }, {
                id: 'outdoors',
                name: 'Outdoors'
            }, {
                id: 'sights',
                name: 'Sights'
            }
        ];

        this.activeVenue = ko.observable(null);
        this.activePlace = ko.observable(null);
        this.activeAlert = ko.observable(null);

        this.showPlaceModal = ko.observable(false);
        this.showAlertModal = ko.observable(false);
        this.showVenueModal = ko.observable(false);

        // Used for hiding or showing places that are closed
        this.showingClosed = ko.observable(true);

        // Used for hiding or showing place reviews
        this.showingPlaceReviews = ko.observable(false);

        // Current active foursquare category (topPicks by default)
        this.activeCategory = ko.observable('topPicks');

        // For caching to avoid unnecessary API requests
        this.venueImages = {};
        this.placeDetails = {};
        //

        // Bounds for Riga Old Town
        neighborhoodBounds = new google.maps.LatLngBounds(
            {
                lat: 56.939870903616644,
                lng: 24.096965789794922
            },
            {
                lat: 56.953610705430584,
                lng: 24.118852615356445
            }
        );

        // Initializing google maps object
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: mapCenter,
            styles: mapStyle
        });

        // Initializing google places service
        placesService = new google.maps.places.PlacesService(map);

        // Initializing google places search box
        searchBox = new google.maps.places.SearchBox(document.getElementById('place-search'));

        // Limiting searchbox to Riga Old Town by default
        searchBox.setBounds(neighborhoodBounds);

        map.addListener('bounds_changed', () => {
            // We want to change bounds only if limitToNeighborhood is false
            if (!this.limitToNeighborhood()) {
                searchBox.setBounds(map.getBounds());
            }
        });

        searchBox.addListener('places_changed', () => {
            let places = searchBox.getPlaces();

            if (places.length === 0) {
                this.showAlert('Nothing found', 'We did not find anything with that criteria');
                return;
            }

            // Clear Foursquare venue suggestions
            this.clearSuggestions();

            let bounds = new google.maps.LatLngBounds();
            let placesFound = 0;

            places.forEach(place => {
                if (!place.geometry) {
                    console.warn('Place contains no geometry');
                    return;
                }

                if (this.limitToNeighborhood() && !neighborhoodBounds.contains(place.geometry.location)) {
                    return;
                }

                if (place.rating) {
                    // We want ratings to be in scale from 1 to 10 to be consistent
                    // with Foursquare ratings
                    place.rating *= 2;
                    // Markers use ratingColor property to set the background color
                    // of the rating.
                    place.ratingColor = this.getRatingColor(place.rating);
                }

                // Creates and places the marker
                this.createMarker(place, map);

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }

                placesFound++;
            });

            if (placesFound === 0) {
                this.showAlert('Nothing found', 'We did not find anything with that criteria in this area');
                map.fitBounds(neighborhoodBounds);
            } else {
                map.fitBounds(bounds);
            }
        });

        // Showing default suggestions
        this.showSuggestions();

        // Used to change the Foursquare suggestions category
        this.changeSuggestions = category => {
            this.showSuggestions(category);
        };
    }

    // Hides or shows places/venues that are closed (opening hours)
    toggleClosedFilter() {
        this.showingClosed(!this.showingClosed());

        if (!this.showingClosed()) {
            for(let i in this.markers) {
                let marker = this.markers[i];
                if (marker.isPlace) {
                    if (marker.item.opening_hours) {
                        if (!marker.item.opening_hours.open_now) {
                            marker.setMap(null);
                        }
                    }
                } else {
                    if (marker.item.venue.hours) {
                        if (!marker.item.venue.hours.isOpen) {
                            marker.setMap(null);
                        }
                    }
                }
            }
        } else {
            for(let i in this.markers) {
                let marker = this.markers[i];
                if (!marker.getMap()) {
                    marker.setMap(map);
                }
            }
        }
    }

    toggleNeighborhoodLimit() {
        this.limitToNeighborhood(!this.limitToNeighborhood());
    }

    // Google provides place categories in snake_case
    // this is just a helper to prettify the category names
    prettifyCategory(category) {
        category = category.split('_').join(' ');
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    getCategoryName(category) {
        for (let i in this.categories) {
            if (this.categories[i].id == category) {
                return this.categories[i].name;
            }
        }
    }

    // Returns list of photos for the active (open) venue
    photos() {
        if (this.activeVenue()) {
            const id = (this.activeVenue().isPlace)?this.activeVenue().place_id:this.activeVenue().venue.id;
            if (this.venueImages[id]) {
                return this.venueImages[id];
            }
        }

        return [];
    }

    // Rating colors for google places.
    // Similar to what Foursquare provides by default
    getRatingColor(rating) {
        rating = Math.ceil(rating);

        switch(rating) {
        case 10:
            return '#22d60e';
        case 9:
            return '#7cd60d';
        case 8:
            return '#99d60c';
        case 7:
            return '#c1d60c';
        case 6:
            return '#e5be10';
        case 5:
            return '#e59610';
        default:
            return '#e54c10';
        }
    }

    // Fetches and shows foursquare venue suggestions
    showSuggestions(category = 'topPicks') {
        this.clearMarkers();

        getFoursquareSuggestions(category).then(suggestions => {
            for (let i in suggestions) {
                this.createMarker(suggestions[i]);
            }

            this.activeCategory(category);
        });
    }

    clearSuggestions() {
        this.clearMarkers();
        this.activeCategory(null);
    }

    clearMarkers() {
        for (let i in this.markers) {
            this.markers[i].setMap(null);
        }

        this.markers = [];
        this.showingClosed(true);
    }

    closeMarkers() {
        for (let i in this.markers) {
            this.markers[i].div.classList.remove('marker-open');
        }
    }

    // Closes and clears all modal windows
    clearModals() {
        this.showAlertModal(false);
        this.showPlaceModal(false);
        this.showVenueModal(false);
        this.activeAlert(null);
        this.activePlace(null);
        this.activeVenue(null);
    }

    // Opens alert modal with the given title and body message
    showAlert(title, message) {
        this.clearModals();

        this.activeAlert({
            title: title,
            body: message
        });

        this.showAlertModal(true);
    }

    createMarker(item) {
        let marker = new VenueMarker(item, map);

        marker.addListener('click', async event => {
            const markerItem = event.marker.item;
            // Removes marker-open class from all markers
            this.closeMarkers();
            // Adds marker-open class to this marker
            event.marker.div.classList.add('marker-open');

            // Checking whether the marker contains google places object or
            // Foursquare venue object
            if (event.marker.isPlace) {
                const placeId = markerItem.place_id;

                // Checking if we already have details saved for this place
                if (!this.placeDetails[placeId]) {
                    const details = await getPlaceDetails(placeId);
                    this.placeDetails[placeId] = details;

                    // We want google ratings to be in scale from 0 to 10
                    if (details.rating) {
                        details.rating *= 2;
                    }
                }

                this.clearModals();
                this.activePlace(this.placeDetails[placeId]);
                this.showPlaceModal(true);
                this.showingPlaceReviews(false);

            } else {

                // Checking if we already have pictures for this venue
                if (!this.venueImages[markerItem.venue.id]) {
                    const photos = await getVenueImages(markerItem.venue.id);
                    const photoUrls = photos.items.map(photo => {
                        return `${photo.prefix}height300${photo.suffix}`;
                    });

                    this.venueImages[markerItem.venue.id] = photoUrls;
                }

                this.clearModals();
                this.activeVenue(markerItem);
                this.showVenueModal(true);
            }
        });

        this.markers.push(marker);
    }
}

// https://stackoverflow.com/questions/22706765/twitter-bootstrap-3-modal-with-knockout
ko.bindingHandlers.modal = {
    init: function (element, valueAccessor) {
        $(element).modal({
            show: false
        });

        var value = valueAccessor();
        if (ko.isObservable(value)) {
            $(element).on('hide.bs.modal', function() {
                value(false);
            });
        }
    },
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        if (ko.utils.unwrapObservable(value)) {
            $(element).modal('show');
        } else {
            $(element).modal('hide');
        }
    }
};

// Fetches Foursquare suggestions
// Making use of the es2017 async/await expressions
// In short, it's just a nicer way to create and handle Promises
async function getFoursquareSuggestions(section = 'topPicks') {
    var date = new Date();
    var v = String(date.getUTCFullYear()) + String(date.getUTCMonth() + 1) + String(date.getUTCDate());

    try {
        const data = await $.get('https://api.foursquare.com/v2/venues/explore', {
            client_id: foursquareAuth.id,
            client_secret: foursquareAuth.secret,
            near: 'Vecrīga, Latvia',
            limit: 50,
            section: section,
            v: v
        });

        return data.response.groups[0].items;
    } catch (e) {
        alert('Something went wrong with retrieving Foursquare venue data');
        throw e;
    }
}

// Fetches place details
function getPlaceDetails(placeId) {
    return new Promise(resolve => {
        placesService.getDetails({
            placeId: placeId
        }, data => {
            resolve(data);
        });
    });
}

// Fetches venue pictures
async function getVenueImages(venueId, limit = 10) {
    const date = new Date();

    try {
        const data = await $.get(`https://api.foursquare.com/v2/venues/${venueId}/photos`, {
            client_id: foursquareAuth.id,
            client_secret: foursquareAuth.secret,
            v: String(date.getUTCFullYear()) + String(date.getUTCMonth() + 1) + String(date.getUTCDate()),
            limit: limit
        });

        return data.response.photos;
    } catch (e) {
        alert('Something went wrong with retrieving venue pictures');
        throw e;
    }
}
