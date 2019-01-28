/*global chrome*/
import React from 'react';
import './main.css';
import {Storage, TrackingAPI} from './api';




type MainPageState = {
    trackers: TrackerInfo[];
};
export class MainPage extends React.Component<{}, MainPageState> {
    constructor(props) {
            super(props);

            this.state = {trackers: [
                    {tracking_number: '12348197344', label: 'pusheen'},
                    {tracking_number: '18934r7w3894', label: 'stormy'},
            ]};

            this.storage = new Storage();
    }


    render() {
        // TODO: add thing, remove things, refresh things, "old" section, load
        return (
            <div className="mainPage">
                {this.state.trackers.map(t => <TrackerView tracker={t} />)}
            </div>
        );
    }
}


class TrackerView extends React.Component<{tracker: TrackerInfo}, {}> {
    render() {
        return (
            <div className="trackerInfo">
                <div className="label">{this.props.tracker.label} - $STATUS</div>
                <div className="trackingBody">
                    $CARRIER @ <a href="TODO">{this.props.tracker.tracking_number}</a>
                </div>
                <div className="lastUpdated">Last updated $TIME ago</div>
                <div className="trackingRefresh">R</div>
            </div>
        )
    }
}

export class PanelView extends React.Component<{}, {}> {
    openMain() {
        chrome.tabs.create({url: 'index.html#main'});
    }

    render() {
        return (
            <div className="panelView">
                <AddTrackerForm />
                <hr />
                <button onClick={this.openMain}>See all trackers</button>
            </div>
        )
    }
}


class AddTrackerForm extends React.Component<{}, {number: string, label: string}> {
    constructor(props) {
        super(props);
        this.state = {tracking_number: '', label: '', buttonText: 'Track', inProgress: false};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.storage = new Storage();
        this.ticker = undefined;
    }

    handleChange(event) {
        // TODO: fix chrome autocomplete in a better way
        this.setState({[event.target.name.substring(8)]: event.target.value, buttonText: 'Track'});
    }

    tick() {
        // Animate a ...
        let newText = this.state.buttonText + '.';
        if (newText.length == 4) {
            newText = '.';
        }
        this.setState({buttonText: newText})
    }

    handleSubmit(event) {
        this.setState({buttonText: '.', inProgress: 'true'});
        this.ticker = setInterval(
          () => this.tick(),
          250
        );
        TrackingAPI.addTrackingNumber(
            this.state.tracking_number,
            this.state.label,
            (tracker: TrackerInfo) => {
                this.storage.addOrUpdateTracker(tracker, () => {
                    clearInterval(this.ticker);
                    this.setState({tracking_number: '', label: '', buttonText: 'Done!', inProgress: false});
                })
            }
        )
        event.preventDefault();
    }

    render() {
        const alreadyBeingTracked = this.storage.trackerExists(this.state.tracking_number);
        const formEnabled = (
            this.state.tracking_number.length > 0 && this.state.label.length > 0 && !alreadyBeingTracked && !this.state.inProgress
        );

        let inputText = 'Track';

        const validationMessage = alreadyBeingTracked ? "You're already tracking this" : "";
        return (
            <div>
                <form onSubmit={this.handleSubmit} autocomplete="nope">
                    <label>
                        <input type="hidden" value="dealwithautocomplete" />
                        <input type="text" placeholder="Add a tracking number" value={this.state.number} onChange={this.handleChange} name="dontautotracking_number" autocomplete="nope" />
                        <input type="text" placeholder="What's it for?" value={this.state.label} onChange={this.handleChange} name="dontautolabel" autocomplete="nope" />
                    </label>
                    <input type="submit" value={this.state.buttonText} disabled={!formEnabled} name="track" />
                </form>
                <div class="formValidationMessage">
                    {validationMessage}
                </div>
            </div>
        );
    }
}
