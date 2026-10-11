import {calculateScores,entries,dayToday,shiftDay,type StoredRecord,type GoalEntry} from './life-score';

export const SCORE_VERSION='goal-progress-v2';
export const normalizeGoal=(actual:number,target:number)=>Math.round(Math.min(1,Math.max(0,actual/target))*100);
export const dimensionStatus=(score:number)=>score>=80?'Thriving':score>=60?'Building momentum':score>=40?'Needs attention':'Getting started';
/** V2 is deliberately separate from the original 1–10 engine. Raw goal history is preserved. */
export function commandScore(records:StoredRecord[],today=dayToday()){
 const base=calculateScores(records,today),custom=entries(records).some(e=>e.data.type==='weights');
 const scores=base.scores.map(c=>{
  const score=c.score===null?null:normalizeGoal(c.actual!,c.target!);
  const weight=custom?c.weight:c.id==='social'?15:c.id==='balance'?10:c.weight;
  const prior=c.snapshots.find(e=>{const g=e.data as GoalEntry;return g.date===shiftDay(today,-7)&&g.goal===c.latest?.goal&&g.target===c.latest?.target&&g.unit===c.latest?.unit;})?.data as GoalEntry|undefined;
  const trend=score!==null&&prior&&c.latest?.date===today?score-normalizeGoal(prior.actual,prior.target):null;
  return {...c,label:c.id==='social'?'Relationships & family':c.id==='productivity'?'Productivity & goals':c.label,score,weight,trend};
 });
 const enabled=scores.filter(c=>c.weight>0),known=enabled.filter(c=>c.score!==null),coveredWeight=known.reduce((n,c)=>n+c.weight,0);
 const overall=coveredWeight?Math.round(known.reduce((n,c)=>n+c.score!*c.weight,0)/coveredWeight):null;
 return {scores,overall,covered:known.length,enabled:enabled.length,coverage:coveredWeight,provisional:known.length<enabled.length,version:SCORE_VERSION};
}
export function missionRecords(records:StoredRecord[],today=dayToday()){
 return records.filter(r=>r.kind==='task'&&(r.date.slice(0,10)===today||r.status==='priority'||(r.status!=='done'&&r.date&&r.date.slice(0,10)<today))).sort((a,b)=>{
  const rank=(r:StoredRecord)=>r.status==='done'?4:r.date&&r.date.slice(0,10)<today?0:r.status==='priority'?1:2;
  return rank(a)-rank(b)||(a.date||'9999').localeCompare(b.date||'9999')||a.created.localeCompare(b.created);
 });
}
export function missionReason(r:StoredRecord,today=dayToday()){return r.status==='done'?'Completed':r.date&&r.date.slice(0,10)<today?'Overdue · review this first':r.status==='priority'?'You marked this as a priority':'Due today';}
export function calendarPreview(records:StoredRecord[],today=dayToday()){
 return records.filter(r=>r.kind==='event'&&r.status!=='done'&&(r.date.slice(0,10)>=today||(r.details.match(/End: ([^\n]+)/)?.[1]||'').slice(0,10)>=today)).sort((a,b)=>a.date.localeCompare(b.date));
}
export function nextMoves(records:StoredRecord[],today=dayToday()){
 const tasks=missionRecords(records,today).filter(r=>r.status!=='done');
 const projects=records.filter(r=>r.kind==='project'&&r.status!=='done').sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 return [...tasks.map(r=>({id:r.id,title:r.title,area:r.area,reason:missionReason(r,today),action:'Review in planner',view:'Planner',kind:'task'})),...projects.map(r=>({id:r.id,title:`Move forward: ${r.title}`,area:r.area,reason:'An active project you saved. Choose its next concrete step.',action:'Open project',view:'Projects',kind:'project'}))].slice(0,6);
}
