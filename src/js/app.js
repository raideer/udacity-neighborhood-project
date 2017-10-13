import 'bootstrap';
import '../style/app.scss';

import ViewModel from './viewModel.js';

const initApp = () => {
    ko.applyBindings(new ViewModel());
};

window.initApp = initApp;
