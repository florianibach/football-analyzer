
import { parseStringPromise } from 'xml2js';

export const intervalsCache: {
  overall: { [zone: string]: any[] },
  bySplit: { [split: string]: { [zone: string]: any[] } }
} = { overall: {}, bySplit: {} };

const ZONES = [
  { name: 'Zone 1', min: 0,  max: 8  },
  { name: 'Zone 2', min: 8,  max: 12 },
  { name: 'Zone 3', min: 12, max: 16 },
  { name: 'Zone 4 (HSR)', min: 16, max: 20 },
  { name: 'Zone 5 (Sprint)', min: 20, max: Infinity }
];

export async function parseTCX(xml: string) {
  intervalsCache.overall = {}; intervalsCache.bySplit = {};

  const tcx = await parseStringPromise(xml);
  const laps = tcx.TrainingCenterDatabase.Activities[0].Activity[0].Lap;

  const overall = ZONES.map(z => ({ ...z, distance: 0, count: 0 }));
  const splits:any[] = [];
  let totalDist = 0, totalSec = 0;

  for (const lap of laps) {
    const tp = lap.Track[0].Trackpoint;
    const splitName = lap.$.StartTime;
    const splitAgg = ZONES.map(z => ({ ...z, distance: 0, count: 0 }));

    let prev: any = null, curr: any = null;

    for (const p of tp) {
      if (prev) {
        const t0 = new Date(prev.Time[0]).getTime() / 1000;
        const t1 = new Date(p.Time[0]).getTime()   / 1000;
        const dt = t1 - t0;

        const d0 = parseFloat(prev.DistanceMeters?.[0] || '0');
        const d1 = parseFloat(p.DistanceMeters?.[0] || '0');
        const dd = d1 - d0;

        if (dt > 0 && dd > 0) {
          const kmh = dd / dt * 3.6;
          const zoneIdx = ZONES.findIndex(z => kmh >= z.min && kmh < z.max);

          // Intervall-Wechsel
          if (!curr || curr.zoneIdx !== zoneIdx) {
            if (curr) finishInterval(curr, prev.Time[0]);
            curr = {
              zoneIdx,
              zone: ZONES[zoneIdx].name,
              split: splitName,
              startTs: p.Time[0],
              distance: 0,
              sec: 0,
              top: 0
            };
            overall[zoneIdx].count++;
            splitAgg[zoneIdx].count++;
          }
          curr.distance += dd;
          curr.sec      += dt;
          curr.top       = Math.max(curr.top, kmh);

          overall[zoneIdx].distance += dd;
          splitAgg[zoneIdx].distance += dd;
        }
      }
      prev = p;
    }
    if (curr) finishInterval(curr, prev.Time[0]);

    totalDist += parseFloat(lap.DistanceMeters[0]);
    totalSec  += parseFloat(lap.TotalTimeSeconds[0]);

    splits.push({
      name: splitName,
      distance: Math.round(parseFloat(lap.DistanceMeters[0])),
      time: toHms(parseFloat(lap.TotalTimeSeconds[0])),
      zones: splitAgg.map(z => ({
        name: z.name,
        distance: Math.round(z.distance),
        count: z.count
      }))
    });
  }

  return {
    totalDistance: Math.round(totalDist),
    totalTime:     toHms(totalSec),
    zones: overall.map(o => ({ name: o.name, distance: Math.round(o.distance), count: o.count })),
    splits
  };

  function finishInterval(intv: any, endTs: string) {
    intv.endTs   = endTs;
    intv.duration = toHms(intv.sec);

    // overall
    intervalsCache.overall[intv.zone] ??= [];
    intervalsCache.overall[intv.zone].push(intv);

    // bySplit
    intervalsCache.bySplit[intv.split] ??= {};
    intervalsCache.bySplit[intv.split][intv.zone] ??= [];
    intervalsCache.bySplit[intv.split][intv.zone].push(intv);
  }
}

function toHms(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const t = Math.floor(s % 60);
  return [h, m, t].map(v => String(v).padStart(2, '0')).join(':');
}
