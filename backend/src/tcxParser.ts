
import { parseStringPromise } from 'xml2js';

const ZONES = [
  { name: 'Zone 1', min: 0, max: 8 },
  { name: 'Zone 2', min: 8, max: 12 },
  { name: 'Zone 3', min: 12, max: 16 },
  { name: 'Zone 4 (HSR)', min: 16, max: 20 },
  { name: 'Zone 5 (Sprint)', min: 20, max: Infinity }
];

function secondsToHMS(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');}

export async function parseTCX(xml:string){
  const data = await parseStringPromise(xml);
  const laps = data.TrainingCenterDatabase.Activities[0].Activity[0].Lap;
  const overall = ZONES.map(z=>({...z,distance:0,count:0,totalSpeed:0,active:false}));
  let totalDist=0,totalSec=0;
  const splits:any[]=[];

  for(const lap of laps){
    const lapAgg = ZONES.map(z=>({...z,distance:0,count:0,totalSpeed:0,active:false}));
    const lapDist=parseFloat(lap.DistanceMeters[0]);
    const lapSec=parseFloat(lap.TotalTimeSeconds[0]);
    totalDist+=lapDist; totalSec+=lapSec;

    let prev = null;
    for(const tp of lap.Track[0].Trackpoint){
      if(prev){
        const tPrev=new Date(prev.Time[0]).getTime()/1000;
        const tCurr=new Date(tp.Time[0]).getTime()/1000;
        const dT=tCurr-tPrev;
        const dPrev=parseFloat(prev.DistanceMeters?.[0]||'0');
        const dCurr=parseFloat(tp.DistanceMeters?.[0]||'0');
        const dD=dCurr-dPrev;
        if(dT>0 && dD>0){
          const sp= dD/dT*3.6;
          const zIndex = ZONES.findIndex(z=>sp>=z.min && sp<z.max);
          if(!lapAgg[zIndex].active){ lapAgg[zIndex].count++; lapAgg[zIndex].active=true; }
          lapAgg[zIndex].distance+=dD; lapAgg[zIndex].totalSpeed+=sp;
          if(!overall[zIndex].active){ overall[zIndex].count++; overall[zIndex].active=true; }
          overall[zIndex].distance+=dD; overall[zIndex].totalSpeed+=sp;
          // reset other zones active flag
          lapAgg.forEach((z,i)=>{ if(i!==zIndex) z.active=false; });
          overall.forEach((z,i)=>{ if(i!==zIndex) z.active=false; });
        }
      }
      prev=tp;
    }
    splits.push({
      name: lap.$.StartTime,
      distance: Math.round(lapDist),
      time: secondsToHMS(lapSec),
      zones: lapAgg.map(z=>({name:z.name,distance:Math.round(z.distance),count:z.count}))
    });
  }

  return {
    totalDistance: Math.round(totalDist),
    totalTime: secondsToHMS(totalSec),
    zones: overall.map(z=>({name:z.name,distance:Math.round(z.distance),count:z.count})),
    splits
  };
}
