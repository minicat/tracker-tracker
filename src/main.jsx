/*global chrome*/
import React from 'react';
import './main.css';




type MainPageState = {
  trackers: TrackerInfo[];
};
export class MainPage extends React.Component<{}, MainPageState> {
  constructor(props) {
      super(props);

      this.state = {trackers: [
          {trackingNumber: 'asdfd', label: 'pusheen'},
          {trackingNumber: 'asdfa', label: 'stormy'},
      ]};
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
        Label: {this.props.tracker.label}
        trackingNumber: {this.props.tracker.trackingNumber}
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
    this.state = {trackingNumber: '', label: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    // TODO: fix chrome autocomplete in a better way
    this.setState({[event.target.name.substring(8)]: event.target.value});
  }

  handleSubmit(event) {
    alert('trackingNumber: ' + this.state.trackingNumber + ' label: '+ this.state.label);
    event.preventDefault();
    // TODO: save it, show progress state, etc
  }

  render() {
    const formEnabled = this.state.trackingNumber.length > 0 && this.state.label.length > 0;
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
