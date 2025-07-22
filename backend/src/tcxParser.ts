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
    const overallZones = ZONES.map(zone => ({ ...zone, distance: 0, count: 0, totalSpeed: 0 }));
    const splits: any[] = [];

    for (const lap of laps) {
        const lapDistance = parseFloat(lap.DistanceMeters[0]);
        const lapTimeSeconds = parseFloat(lap.TotalTimeSeconds[0]);
        totalDistance += lapDistance;
        totalTimeSeconds += lapTimeSeconds;

        const lapZones = ZONES.map(zone => ({ ...zone, distance: 0, count: 0, totalSpeed: 0 }));

        const trackpoints = lap.Track[0].Trackpoint;
        let prevTp: any = null;

        for (const tp of trackpoints) {
            if (prevTp) {
                const prevTime = new Date(prevTp.Time[0]).getTime() / 1000;
                const currTime = new Date(tp.Time[0]).getTime() / 1000;
                const deltaTime = currTime - prevTime;

                const prevDistance = parseFloat(prevTp.DistanceMeters?.[0] || '0');
                const currDistance = parseFloat(tp.DistanceMeters?.[0] || '0');
                const deltaDistance = currDistance - prevDistance;

                if (deltaTime > 0 && deltaDistance > 0) {
                    const speedMs = deltaDistance / deltaTime;
                    const speedKmh = speedMs * 3.6;

                    for (const zone of lapZones) {
                        if (speedKmh >= zone.min && speedKmh < zone.max) {
                            zone.distance += deltaDistance;
                            zone.count += 1;
                            zone.totalSpeed += speedKmh;
                            break;
                        }
                    }
                    for (const zone of overallZones) {
                        if (speedKmh >= zone.min && speedKmh < zone.max) {
                            zone.distance += deltaDistance;
                            zone.count += 1;
                            zone.totalSpeed += speedKmh;
                            break;
                        }
                    }
                }
            }
            prevTp = tp;
        }

        splits.push({
            name: lap.$.StartTime || 'Lap',
            distance: Math.round(lapDistance),
            time: secondsToHMS(lapTimeSeconds),
            zones: lapZones.map(z => ({
                name: z.name,
                distance: Math.round(z.distance),
                count: z.count,
                avgSpeedKmh: z.count > 0 ? +(z.totalSpeed / z.count).toFixed(2) : 0,
                avgSpeedMs: z.count > 0 ? +(z.totalSpeed / z.count / 3.6).toFixed(2) : 0
            }))
        });
    }

    return {
        totalDistance: Math.round(totalDistance),
        totalTime: secondsToHMS(totalTimeSeconds),
        zones: overallZones.map(z => ({
            name: z.name,
            distance: Math.round(z.distance),
            count: z.count,
            avgSpeedKmh: z.count > 0 ? +(z.totalSpeed / z.count).toFixed(2) : 0,
            avgSpeedMs: z.count > 0 ? +(z.totalSpeed / z.count / 3.6).toFixed(2) : 0
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