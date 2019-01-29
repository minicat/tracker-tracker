/*global chrome*/
import $ from 'jquery';

const AFTERSHIP_KEY = process.env.REACT_APP_AFTERSHIP_KEY;
const AFTERSHIP_API_PREFIX = 'https://api.aftership.com/v4/trackings'

export type TrackerInfo = {
    tracking_number: string,
    label: string,

    // TODO: add subtag/subtag_message for extra detail
    aftership_id: string,  //id
    last_updated_at: string,
    tag: string,  // shipping status
    slug: string,  // carrier
    expected_delivery: string,  // may be null
    shipment_delivery_date: string,   // may be null
    created_at: string,

    tracking_url: string,  // constructed in parseAftershipTracker
};

export type TrackerMap = {[tracking_number: string]: TrackerInfo}

// TODO: eventually we should save and cache tracking info on save of new tracker
// also reject dupe trackers
// also refresh in background

// TODO: add types

/**
* Storage calls
* Note: we store a map of {tracking_number: TrackerInfo}
* TODO: error handling
* TODO: maintain cached version locally
* TODO: fix weird state stuff? cos jsonTrackers should be part of MainPage state
* TODO: fix behaviour when both panel and main page are open - they need to be in sync
*/
const STORAGE_KEY = 'trackers';
export class Storage {
    jsonTrackers: TrackerMap
    constructor(callback: Function) {
        // Cache jsonTrackers locally so we don't have to read every time
        // TODO: we may need onReady?
        this.jsonTrackers = {};
        this.getAllTrackers((jsonTrackers: TrackerMap) => {
            this.jsonTrackers = jsonTrackers;
            callback(jsonTrackers);
        });
    }

    getAllTrackers(callback: Function) {
        chrome.storage.sync.get(STORAGE_KEY, (items) => {
            if (typeof items[STORAGE_KEY] === 'undefined') {
                callback({});
            } else {
                callback(JSON.parse(items[STORAGE_KEY]));
            }
        })
    }

    // FIXME: assumes jsonTrackers already fetched
    trackerExists(tracking_number: string) {
        return (tracking_number in this.jsonTrackers)
    }

    // FIXME: assumes jsonTrackers already fetched
    addOrUpdateTracker(tracker: TrackerInfo, callback: Function) {
        this.jsonTrackers[tracker.tracking_number] = tracker;
        chrome.storage.sync.set({[STORAGE_KEY]: JSON.stringify(this.jsonTrackers)}, () => {
            callback();
        })
    }

    // FIXME: assumes jsonTrackers already fetched
    deleteTracker(tracking_number: string, callback: Function) {
        delete this.jsonTrackers[tracking_number];
        chrome.storage.sync.set({[STORAGE_KEY]: JSON.stringify(this.jsonTrackers)}, () => {
            callback();
        })
    }

}


/**
* Aftership Calls
* Based on their API, we can add + remove trackings, list trackings, and lookup by tracking number+slug OR id.
* No batch lookup though, so we'll have to rely on list to do batch refresh.
*/

export class TrackingAPI {
    // TODO: accept failure callbacks
    static addTrackingNumber(tracking_number: string, label: string, onSuccess: Function){
        // to parse: data -> tracking
        // Note: This will return an error if the tracking number already exists.
        $.ajax({
            url: AFTERSHIP_API_PREFIX,
            method: 'POST',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                'tracking': {
                    'tracking_number': tracking_number,
                    'title': label,
                }
            }),
            dataType: "json",
            success: (data, status, jqxhr) => {
                onSuccess(TrackingAPI.parseAftershipTracker(data['data']['tracking']));
            }
            // TODO: failure handler
        });
    };


    static deleteTrackingNumber(tracker: TrackerInfo) {
        // to parse: data -> tracking
        $.ajax({
            url: AFTERSHIP_API_PREFIX + '/' + tracker.aftership_id,
            method: 'DELETE',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            dataType: "json",
            // success: TODO
            // TODO: failure handler
        });
    }

    static getAllTrackingInfo() {
        // to parse: data -> trackings
        // Note: theoretically this is paginated and only shows 100, but hopefully I never have that
        // much online shopping
        $.ajax({
            url: AFTERSHIP_API_PREFIX,
            method: 'GET',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: (data, status, jqxhr) => {console.log('getAll', data)}
            // TODO: failure handler
        });
    }

    static getUpdatedTrackingInfo(tracker: TrackerInfo) {
        // to parse: data -> tracking
        $.ajax({
            url: AFTERSHIP_API_PREFIX + '/' + tracker.aftership_id,
            method: 'GET',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: (data, status, jqxhr) => {console.log('get updated', data, TrackingAPI.parseAftershipTracker(data['data']['tracking']))}
            // TODO: failure handler
        });
    }

    static parseAftershipTracker(rawInfo: {[key: string]: string}): TrackerInfo {
        return {
            tracking_number: rawInfo['tracking_number'],
            label: rawInfo['title'],
            aftership_id: rawInfo['id'],
            last_updated_at: rawInfo['last_updated_at'],
            slug: rawInfo['slug'],
            expected_delivery: rawInfo['expected_delivery'],
            shipment_delivery_date: rawInfo['shipment_delivery_date'],
            tag: rawInfo['tag'],
            created_at: rawInfo['created_at'],
            tracking_url: 'https://minicat.aftership.com/' + rawInfo['tracking_number']
        }
    }
}
