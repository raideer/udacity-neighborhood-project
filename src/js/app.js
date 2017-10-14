import 'bootstrap';
import '../style/app.scss';

import ViewModel from './viewModel.js';

const initApp = () => {
    ko.applyBindings(new ViewModel());
};

const handleErrors = () => {
    alert('Something went wrong with loading Google Maps. Refresh the page and try again');
};

window.initApp = initApp;
window.handleErrors = handleErrors;
