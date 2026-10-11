// Pure calculations shared by the UI, API validation, and fixture tests.
export const marker = 'MiLOs structured scoreboard v1\n';
export const categories = [
 {id:'finance',label:'Financial health',area:'Finances',weight:20,action:'Verify current balances and remaining bills.'},
 {id:'physical',label:'Physical health',area:'Health',weight:20,action:'Plan your next workout or recovery activity.'},
 {id:'mental',label:'Mental wellness',area:'Mental wellbeing',weight:15,action:'Make room for your chosen wellbeing practice.'},
 {id:'social',label:'Social battery',area:'Relationships',weight:10,action:'Choose connection or downtime that suits your energy.'},
 {id:'productivity',label:'Productivity',area:'Productivity',weight:20,action:'Choose your three priorities for today.'},
 {id:'balance',label:'Life balance',area:'Personal growth',weight:15,action:'Reserve time for a personal goal or relationship.'},
] as const;
export type CategoryId=typeof categories[number]['id'];
export type StoredRecord={id:string;kind:string;title:string;area:string;details:string;date:string;status:string;created:string};
export type GoalEntry={type:'goal';category:CategoryId;goal:string;actual:number;target:number;unit:string;date:string;source:string;notes:string;signals:Record<string,string>};
export type WeightEntry={type:'weights';weights:Record<CategoryId,number>};
export type MoneyValue={amount:string;source:string;date:string;status:'confirmed'|'estimate'|'unverified'};
export const moneyFields=[
 ['checking','Checking balance'],['savings','Savings balance'],['reserve','Protected reserve'],['allocated','Other allocated cash (excludes reserve)'],
 ['received','Income received this month'],['expected','Income still expected this month'],['spent','Actual spending this month'],
 ['committed','Unpaid committed expenses'],['remaining','Other remaining obligations'],['budget','Monthly spending target'],
 ['debtStart','Starting debt'],['debtNow','Current debt'],['debtGoal','Debt reduction goal'],
] as const;
export type MoneyKey=typeof moneyFields[number][0];
export type FinanceEntry={type:'finance';month:string;values:Partial<Record<MoneyKey,MoneyValue>>;bills:string;correction:string};
export type ScoreEntry=GoalEntry|WeightEntry|FinanceEntry;
export const signalFields:Record<CategoryId,readonly string[]>={finance:[],physical:['Current weight / target','Workouts completed / planned','Sleep duration / consistency','Nutrition progress','Activity / recovery','Next workout'],mental:['Mood (self-reported)','Stress (self-reported)','Energy (self-reported)','Sleep / recovery','Mindfulness practice'],social:['Social energy (self-reported)','Desired / actual connection','Downtime preference','Upcoming social commitments'],productivity:[],balance:['Family / relationship priorities','Personal goals','Learning / development','Recreation','Time allocated']};
export function dayToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Phoenix',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDay(s:unknown):s is string{return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
export function shiftDay(day:string,n:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function cents(value:string):bigint {if(!/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(value))throw Error('Use a non-negative dollar amount with up to two decimal places.');const [whole,part='']=value.split('.');return BigInt(whole)*100n+BigInt(part.padEnd(2,'0'));}
export function dollars(value:bigint){const sign=value<0n?'-':'';const abs=value<0n?-value:value;return sign+'$'+(abs/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+(abs%100n).toString().padStart(2,'0');}
export function validateEntry(input:unknown,today=dayToday()):ScoreEntry{
 const b=input as any;const string=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 if(!b||typeof b!=='object')throw Error('Missing scoreboard information.');
 if(b.type==='weights'){
  if(!b.weights||categories.some(c=>!Number.isFinite(b.weights[c.id])||b.weights[c.id]<0||b.weights[c.id]>100)||Math.abs(categories.reduce((n,c)=>n+b.weights[c.id],0)-100)>.0001)throw Error('Weights must be 0–100 and total 100%.');
  return {type:'weights',weights:Object.fromEntries(categories.map(c=>[c.id,b.weights[c.id]])) as WeightEntry['weights']};
 }
 if(b.type==='goal'){
  if(!categories.some(c=>c.id===b.category)||!string(b.goal,300)||!string(b.unit,50)||!string(b.source,300)||!validDay(b.date)||b.date>today||!Number.isFinite(b.actual)||b.actual<0||b.actual>1e9||!Number.isFinite(b.target)||b.target<=0||b.target>1e9||typeof b.notes!=='string'||b.notes.length>2000)throw Error('Provide a goal, positive target, non-negative progress, source, and a valid date no later than today.');
  const signals:Record<string,string>={};for(const field of signalFields[b.category as CategoryId]){const v=b.signals?.[field]??'';if(typeof v!=='string'||v.length>300)throw Error('Keep each check-in field under 300 characters.');signals[field]=v.trim();}
  return {type:'goal',category:b.category,goal:b.goal.trim(),actual:b.actual,target:b.target,unit:b.unit.trim(),date:b.date,source:b.source.trim(),notes:b.notes.trim(),signals};
 }
 if(b.type==='finance'){
  if(typeof b.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month)||!b.values||typeof b.bills!=='string'||b.bills.length>2000||typeof b.correction!=='string'||b.correction.length>2000)throw Error('Check the month and financial notes.');
  const values:FinanceEntry['values']={};for(const [key] of moneyFields){const v=b.values[key];if(v===undefined)continue;if(typeof v?.amount!=='string'||!string(v.source,300)||!validDay(v.date)||v.date>today||!['confirmed','estimate','unverified'].includes(v.status))throw Error('Every amount needs its source, verification date, and status.');cents(v.amount);values[key]={amount:v.amount,source:v.source.trim(),date:v.date,status:v.status};}
  if(!Object.keys(values).length)throw Error('Enter at least one financial amount.');
  return {type:'finance',month:b.month,values,bills:b.bills.trim(),correction:b.correction.trim()};
 }
 throw Error('Unknown scoreboard entry.');
}
export function entries(records:StoredRecord[]){return records.filter(r=>r.details.startsWith(marker)).flatMap(r=>{try{return [{record:r,data:validateEntry(JSON.parse(r.details.slice(marker.length)))}];}catch{return [];}}).sort((a,b)=>b.record.created.localeCompare(a.record.created)||b.record.id.localeCompare(a.record.id));}
export function scoreLabel(score:number){return score>=9?'Thriving':score>=7?'Balanced':score>=5?'Needs attention':score>=3?'Falling behind':'Critical attention';}
export function progressScore(actual:number,target:number){return Math.round((1+9*Math.min(1,actual/target))*10)/10;}
export function calculateScores(records:StoredRecord[],today=dayToday()){
 const data=entries(records);const config=data.find(e=>e.data.type==='weights')?.data as WeightEntry|undefined;
 const scores=categories.map(c=>{const snapshots=data.filter(e=>e.data.type==='goal'&&e.data.category===c.id);const latest=snapshots[0]?.data as GoalEntry|undefined;const current=latest&&latest.date>=shiftDay(today,-6)&&latest.date<=today;
  const weeklyTasks=records.filter(r=>r.kind==='task'&&r.date.slice(0,10)>=shiftDay(today,-6)&&r.date.slice(0,10)<=today);
  const automatic=c.id==='productivity'&&!latest&&weeklyTasks.length>0;
  const actual=automatic?weeklyTasks.filter(r=>r.status==='done').length:latest?.actual;const target=automatic?weeklyTasks.length:latest?.target;
  const score=(current||automatic)&&actual!==undefined&&target?progressScore(actual,target):null;
  return {...c,weight:config?.weights[c.id]??c.weight,score,latest,snapshots,actual,target,automatic,reason:latest&&!current?'Last goal update is older than seven days.':!latest&&!automatic?'Add a goal, target, and current progress.':'',formula:automatic?'Dated tasks completed ÷ tasks due in the last seven days':latest?`${latest.actual} ÷ ${latest.target} ${latest.unit}`:''};
 });
 const enabled=scores.filter(c=>c.weight>0);const covered=enabled.filter(c=>c.score!==null);const overall=enabled.length&&covered.length===enabled.length?Math.round(covered.reduce((sum,c)=>sum+c.score!*c.weight,0)/enabled.reduce((sum,c)=>sum+c.weight,0)*10)/10:null;
 return {scores,overall,covered:covered.length,enabled:enabled.length};
}
export function financialSummary(data:FinanceEntry,today=dayToday()){
 const value=(key:MoneyKey)=>{const v=data.values[key];return v&&v.status!=='unverified'&&v.date>=shiftDay(today,-30)&&v.date<=today?cents(v.amount):null;};
 const sum=(keys:MoneyKey[],signs:number[])=>{const v=keys.map(value);return v.some(n=>n===null)?null:v.reduce<bigint>((n,x,i)=>n+x!*BigInt(signs[i]),0n);};
 const current=data.month===today.slice(0,7);
 const surplus=current?sum(['received','expected','spent','committed','remaining'],[1,1,-1,-1,-1]):null;
 const cash=sum(['checking','savings','reserve','allocated'],[1,1,-1,-1]);
 const cashAfterBills=current?sum(['checking','savings','reserve','allocated','committed','remaining'],[1,1,-1,-1,-1,-1]):null;
 const projected=current?sum(['checking','savings','expected','reserve','allocated','committed','remaining'],[1,1,1,-1,-1,-1,-1]):null;
 const debtStart=value('debtStart'),debtNow=value('debtNow');
 return {surplus,cash,cashAfterBills,projectedDebt:projected===null?null:projected>0n?projected:0n,debtPaid:debtStart===null||debtNow===null?null:debtStart-debtNow,missing:moneyFields.filter(([key])=>value(key)===null).map(([,label])=>label)};
}
