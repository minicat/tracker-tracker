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

        // <button onClick={() => {this.storage.addOrUpdateTracker(
        //   {tracking_number: '1', label: '1'}, () => {console.log('added 1')}
        //   )}}>add 1</button>
        // <button onClick={() => {this.storage.addOrUpdateTracker(
        //   {tracking_number: '2', label: '2'}, () => {console.log('added 2')}
        //   )}}>add 2</button>
        // <button onClick={() => {this.storage.deleteTracker(1, () => {console.log('deleted 1')}
        //   )}}>del 1</button>
        // <button onClick={() => {console.log('exists?', this.storage.trackerExists(1))}}>1 exists?</button>
        // <button onClick={() => console.log('printing storage', this.storage.jsonTrackers)}>print storage</button>
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
    this.state = {tracking_number: '', label: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    // TODO: fix chrome autocomplete in a better way
    this.setState({[event.target.name.substring(8)]: event.target.value});
  }

  handleSubmit(event) {
    alert('tracking_number: ' + this.state.tracking_number + ' label: '+ this.state.label);
    event.preventDefault();
    // TODO: save it, show progress state, etc
  }

  render() {
    const formEnabled = this.state.tracking_number.length > 0 && this.state.label.length > 0;
    return (
      <form onSubmit={this.handleSubmit} autocomplete="nope">
        <label>
          <input type="text" placeholder="Add a tracking number" value={this.state.number} onChange={this.handleChange} name="dontautotrackingNumber" autocomplete="nope" />
          <input type="text" placeholder="What's it for?" value={this.state.label} onChange={this.handleChange} name="dontautolabel" autocomplete="nope" />
        </label>
        <input type="submit" value="Track" disabled={!formEnabled} name="track" />
      </form>
    );
  }
}
