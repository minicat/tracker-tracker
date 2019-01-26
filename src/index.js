import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {MainPage, PanelView} from './main';

// XXX: use react router/configure multiple endpoints instead?
if (window.location.hash) {
    ReactDOM.render(<MainPage />, document.getElementById('root'));
} else {
    ReactDOM.render(<PanelView />, document.getElementById('root'));
}

