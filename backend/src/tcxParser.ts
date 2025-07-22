import { parseStringPromise } from 'xml2js';

const ZONES = [
    { name: 'Zone 1', min: 0, max: 8 },
    { name: 'Zone 2', min: 8, max: 12 },
    { name: 'Zone 3', min: 12, max: 16 },
    { name: 'Zone 4 (HSR)', min: 16, max: 20 },
    { name: 'Zone 5 (Sprint)', min: 20, max: Infinity }
];

export async function parseTCX(xml: string) {
    const data = await parseStringPromise(xml);
    const activities = data.TrainingCenterDatabase.Activities[0].Activity;
    if (!activities || activities.length === 0) {
        throw new Error('No activity data found');
    }

    const laps = activities[0].Lap;
    let totalDistance = 0;
    let totalTimeSeconds = 0;
    const overallZones = ZONES.map(zone => ({ ...zone, distance: 0, count: 0 }));
    const splits: any[] = [];

    for (const lap of laps) {
        const lapDistance = parseFloat(lap.DistanceMeters[0]);
        const lapTimeSeconds = parseFloat(lap.TotalTimeSeconds[0]);
        totalDistance += lapDistance;
        totalTimeSeconds += lapTimeSeconds;

        const lapZones = ZONES.map(zone => ({ ...zone, distance: 0, count: 0 }));

        const trackpoints = lap.Track[0].Trackpoint;
        for (const tp of trackpoints) {
            const speed = tp.Extensions?.[0]['ns3:TPX']?.[0]['ns3:Speed']?.[0];
            if (speed) {
                const speedKmh = parseFloat(speed) * 3.6;
                for (const zone of lapZones) {
                    if (speedKmh >= zone.min && speedKmh < zone.max) {
                        zone.distance += parseFloat(tp.DistanceMeters?.[0] || '0');
                        zone.count += 1;
                        break;
                    }
                }
                for (const zone of overallZones) {
                    if (speedKmh >= zone.min && speedKmh < zone.max) {
                        zone.distance += parseFloat(tp.DistanceMeters?.[0] || '0');
                        zone.count += 1;
                        break;
                    }
                }
            }
        }

        splits.push({
            name: lap.$.StartTime || 'Lap',
            distance: lapDistance,
            time: secondsToHMS(lapTimeSeconds),
            zones: lapZones.map(z => ({
                name: z.name,
                distance: Math.round(z.distance),
                count: z.count
            }))
        });
    }

    return {
        totalDistance: Math.round(totalDistance),
        totalTime: secondsToHMS(totalTimeSeconds),
        zones: overallZones.map(z => ({
            name: z.name,
            distance: Math.round(z.distance),
            count: z.count
        })),
        splits
    };
}

function secondsToHMS(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}