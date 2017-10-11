import mapStyle from './mapstyle.js';
import eachOf from 'async/eachOf';

let VenueMarker;
let map;

const foursquareAuth = {
    id: 'XRYRBFDPCQ3RJPBPUVH3LWG31LO2RIGHADDC541HGU3SYBSB',
    secret: '4AIOCYXHZXHGH1T5F0BAKPOUTLQFRMMTBF2KR1RFUYPHAETL'
}

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
        return;
    }
}

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
        return;
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
}

/**
 * [ViewModel description]
 * @constructor
 */
export default class ViewModel {
    constructor() {
        // Declaring VenueMarker here because it requires 'google' to be loaded
        VenueMarker = require('./venueMarker.js');
        let mapCenter = {
            lat: 56.948890,
            lng: 24.107518
        };

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: mapCenter,
            styles: mapStyle
        });

        this.venueMarkers = [];
        this.venues = [];
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
        this.showModal = ko.observable(false);
        this.activeCategory = ko.observable('topPicks');
        this.venueImages = {};

        this.showSuggestions();

        this.changeSuggestions = category => {
            console.log('Changing suggestions to', category);
            this.showSuggestions(category);
        }

        this.photos = () => {
            if (this.activeVenue() && this.venueImages[this.activeVenue().venue.id]) {
                return this.venueImages[this.activeVenue().venue.id];
            }

            return [];
        };
    }

    showSuggestions(category = 'topPicks') {
        this.venues = [];

        this.clearVenueMarkers();

        getFoursquareSuggestions(category).then(suggestions => {
            for (let i in suggestions) {
                this.createVenueMarker(suggestions[i]);
                this.venues.push(suggestions[i]);
            }

            this.activeCategory(category);
        });
    }

    clearVenueMarkers() {
        for (let i in this.venueMarkers) {
            this.venueMarkers[i].setMap(null);
        }

        this.venueMarkers = [];
    }

    closeVenueMarkers() {
        for (let i in this.venueMarkers) {
            this.venueMarkers[i].div.classList.remove('marker-open');
        }
    }

    async createVenueMarker(item) {
        let marker = new VenueMarker(item, map);

        marker.addListener('click', async event => {
            const item = event.marker.item;
            this.closeVenueMarkers();
            event.marker.div.classList.add('marker-open');

            if (!this.venueImages[item.venue.id]) {
                const photos = await getVenueImages(item.venue.id);
                const photoUrls = photos.items.map(photo => {
                    return `${photo.prefix}height300${photo.suffix}`;
                });

                this.venueImages[item.venue.id] = photoUrls;
            }

            this.activeVenue(item);
            this.showModal(true);
        });

        this.venueMarkers.push(marker);
    }
};
