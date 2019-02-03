/*global chrome*/
import React from 'react';
import './panel.css';
import {Storage, TrackingAPI, TrackerInfo, TrackerMap} from './api';

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

type AddTrackerFormState = {
    tracking_number: string,
    label: string,
    buttonText: string,
    inProgress: boolean
};

class AddTrackerForm extends React.Component<{}, AddTrackerFormState> {
// TODO: fix chrome autocomplete
    storage: Storage;
    ticker: any;
    constructor(props: {}) {
        super(props);
        this.state = {tracking_number: '', label: '', buttonText: 'Track', inProgress: false};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.storage = new Storage((jsonTrackers: TrackerMap) => {});
        this.ticker = undefined;
    }

    handleChange(event) {
        this.setState({[event.target.name.substring(8)]: event.target.value, buttonText: 'Track'} as any);
    }

    tick() {
        // Animate a ...
        let newText = this.state.buttonText + '.';
        if (newText.length === 4) {
            newText = '.';
        }
        this.setState({buttonText: newText})
    }

    handleSubmit(event) {
        this.setState({buttonText: '.', inProgress: true});
        this.ticker = setInterval(
          () => this.tick(),
          250
        );
        TrackingAPI.addTrackingNumber(
            this.state.tracking_number,
            this.state.label,
            (tracker: TrackerInfo) => {
                // The Aftership API initially returns "pending" then updates with actual state
                // after a few seconds. To get around this, wait and refresh before updating storage
                // TODO: Sometimes 1 second isnt enough. Could loop until not PENDING / some max number of retries
                setTimeout(() => {
                    TrackingAPI.getUpdatedTrackingInfo(tracker, (updatedTracker: TrackerInfo) => {
                        this.storage.addOrUpdateTracker(updatedTracker, () => {
                            clearInterval(this.ticker);
                            this.setState({tracking_number: '', label: '', buttonText: 'Done!', inProgress: false});
                        })
                    })
                }, 1000);
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
        // TODO: make submit a button then fix stylings
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        <input type="hidden" value="dealwithautocomplete" />
                        <input type="text" placeholder="Add a tracking number" value={this.state.tracking_number} onChange={this.handleChange} name="dontautotracking_number" />
                        <input type="text" placeholder="What's it for?" value={this.state.label} onChange={this.handleChange} name="dontautolabel" />
                    </label>
                    <input type="submit" value={this.state.buttonText} disabled={!formEnabled} name="track" />
                </form>
                <div className="formValidationMessage">
                    {validationMessage}
                </div>
            </div>
        );
    }
}
