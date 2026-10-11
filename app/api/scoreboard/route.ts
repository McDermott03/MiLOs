import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '@/lib/records';
import {validateEntry,marker,categories} from '@/lib/life-score';

export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Please sign in.'},{status:401});
 let data;try{const body=await request.json() as any;if(body.confirmSave!==true)return Response.json({error:'Confirm this permanent workspace update.'},{status:400});data=validateEntry(body.entry);}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 try{
  const category=data.type==='goal'?categories.find(c=>c.id===data.category):null;
  const record={id:crypto.randomUUID(),kind:'metric',title:data.type==='weights'?'Life Score weights':data.type==='finance'?`Financial snapshot · ${data.month}`:`${category!.label} · ${data.goal}`,area:category?.area||(data.type==='finance'?'Finances':'Productivity'),details:marker+JSON.stringify(data),date:data.type==='goal'?data.date:'',status:'open',created:new Date().toISOString()};
  await database().prepare('INSERT INTO records (id,owner,kind,title,area,details,date,status,created) VALUES (?,?,?,?,?,?,?,?,?)').bind(record.id,user.userId,record.kind,record.title,record.area,record.details,record.date,record.status,record.created).run();
  return Response.json({record},{status:201});
 }catch{return Response.json({error:'Save failed. Your draft has not been saved; please try again.'},{status:503});}
}
