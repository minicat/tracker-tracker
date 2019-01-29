const MINUTE = 1000 * 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function dealWithPlurals(unit: string, quantity: number) {
    const plural = quantity === 1 ? '' : 's';
    return `${quantity} ${unit}${plural} ago`
}

export function prettyPrintTimeSince(dt: string) {
    const timeDiff = Date.now() - Date.parse(dt);

    let out = '';

    if (timeDiff > DAY) {
        const days = Math.floor(timeDiff / DAY);
        return dealWithPlurals('day', days);
    } else if (timeDiff > HOUR) {
        const hours = Math.floor(timeDiff / HOUR);
        return dealWithPlurals('hour', hours);
    } else if (timeDiff > MINUTE) {
        const minutes = Math.floor(timeDiff / MINUTE);
        return dealWithPlurals('minute', minutes);
    }
    return 'just then';
}
