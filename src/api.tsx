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
    subtag_message: string, // details about shipping
    slug: string,  // carrier
    expected_delivery: string,  // may be null
    shipment_delivery_date: string,   // may be null
    created_at: string,

    tracking_url: string,  // constructed in parseAftershipTracker
};

export type TrackerMap = {[tracking_number: string]: TrackerInfo}

// TODO: refresh in background

/**
* Storage calls
* Note: we store a map of {tracking_number: TrackerInfo}
* TODO: error handling
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

// custom tracking urls is a paid aftership feature; query the provider directly & fall back to goog
const FALLBACK_TRACKING_URL = 'https://www.google.com/search?q='
const CARRIERS_TO_TRACKING_URL = {
    'usps': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
    'fedex': 'https://www.fedex.com/Tracking?action=track&tracknumbers=',
    'ups': 'https://www.ups.com/track?loc=en_US&tracknum=',
    'i-parcel': 'https://tracking.i-parcel.com/?TrackingNumber=',
    'dhl': 'http://www.dhl.com/en/express/tracking.html?&brand=DHL&AWB='
}

// expand the less descriptive subtag messages as per https://help.aftership.com/hc/en-us/articles/360007823253
const SUBTAG_MESSAGE_EXPANDED = {
    'Pending': 'There is no information available on the carrier website or the tracking number is yet to be tracked',
    'Expired': 'The shipment has no tracking information from the last 30 days',
    'Info Received': 'The carrier has received the request from the shipper and is about to pick up the shipment'
}

export class TrackingAPI {
    // TODO: accept failure callbacks
    static addTrackingNumber(tracking_number: string, label: string, onSuccess: Function){
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


    static deleteTrackingNumber(tracker: TrackerInfo, onSuccess: Function) {
        $.ajax({
            url: AFTERSHIP_API_PREFIX + '/' + tracker.aftership_id,
            method: 'DELETE',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: (data, status, jqxhr) => {onSuccess()}
            // TODO: failure handler
        });
    }

    static getAllTrackingInfo() {
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

    static getUpdatedTrackingInfo(tracker: TrackerInfo, onSuccess: Function) {
        $.ajax({
            url: AFTERSHIP_API_PREFIX + '/' + tracker.aftership_id,
            method: 'GET',
            headers: {
                'aftership-api-key': AFTERSHIP_KEY,
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: (data, status, jqxhr) => {
                onSuccess(TrackingAPI.parseAftershipTracker(data['data']['tracking']));
            }
            // TODO: failure handler
        });
    }

    static constructTrackingUrl(slug: string, tracking_number: string) {
        let prefix = FALLBACK_TRACKING_URL;
        if (slug in CARRIERS_TO_TRACKING_URL) {
            prefix = CARRIERS_TO_TRACKING_URL[slug];
        }
        return prefix + tracking_number;
    }

    static parseAftershipTracker(rawInfo: {[key: string]: string}): TrackerInfo {
        let subtag_message = rawInfo['subtag_message'];
        if (subtag_message in SUBTAG_MESSAGE_EXPANDED) {
            subtag_message = SUBTAG_MESSAGE_EXPANDED[subtag_message];
        }
        return {
            tracking_number: rawInfo['tracking_number'],
            label: rawInfo['title'],
            aftership_id: rawInfo['id'],
            last_updated_at: rawInfo['last_updated_at'],
            slug: rawInfo['slug'],
            expected_delivery: rawInfo['expected_delivery'],
            shipment_delivery_date: rawInfo['shipment_delivery_date'],
            tag: rawInfo['tag'],
            subtag_message: subtag_message,
            created_at: rawInfo['created_at'],
            tracking_url: TrackingAPI.constructTrackingUrl(rawInfo['slug'], rawInfo['tracking_number'])
        }
    }
}
