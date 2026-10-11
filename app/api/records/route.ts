import { getChatGPTUser } from "../../chatgpt-auth";
import { database, kinds, areas } from "@/lib/records";
export async function GET() {
 const user = await getChatGPTUser(); if (!user) return Response.json({error:"Sign in to load your workspace."},{status:401});
 try {const result = await database().prepare("SELECT * FROM records WHERE owner = ? ORDER BY created DESC").bind(user.userId).all(); const shared=await database().prepare("SELECT i.id,i.household_id,i.title,i.details,i.date,i.status,i.created,h.title AS space_title,m.role FROM household_items i JOIN household_members m ON m.household_id=i.household_id JOIN households h ON h.id=i.household_id WHERE m.user_id=? AND i.kind='event'").bind(user.userId).all<any>();
 return Response.json({records:[...result.results,...shared.results.map(r=>({id:"family:"+r.id,household_id:r.household_id,kind:"event",title:r.title,area:"Family life",details:"Calendar source: Family space · "+r.space_title+"\n"+r.details,date:r.date,status:r.status,created:r.created,canEdit:r.role!=="viewer"}))]});}
 catch { return Response.json({error:"Your records could not be loaded. Please try again."},{status:503}); }
}
export async function POST(request:Request) {
 const user = await getChatGPTUser(); if (!user) return Response.json({error:"Please sign in."},{status:401});
 try {
 const b: any = await request.json();
 if (!kinds.includes(b.kind) || b.kind === "document" || !areas.includes(b.area) || typeof b.title !== "string" || !b.title.trim() || b.title.length > 500 || typeof b.details !== "string" || b.details.length>20000 || typeof b.date !== "string" || (b.date && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(b.date))) return Response.json({error:"Check the record fields."},{status:400});
 const r = {id:crypto.randomUUID(),kind:b.kind,title:b.title.trim(),area:b.area,details:b.details,date:b.date,status:b.kind==="task"&&b.priority===true?"priority":"open",created:new Date().toISOString()};
 await database().prepare("INSERT INTO records (id,owner,kind,title,area,details,date,status,created) VALUES (?,?,?,?,?,?,?,?,?)").bind(r.id,user.userId,r.kind,r.title,r.area,r.details,r.date,r.status,r.created).run();return Response.json({record:r},{status:201});
 } catch {return Response.json({error:"Could not save. Your draft is still here."},{status:503});}
}
export async function PATCH(request:Request) {
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Please sign in."},{status:401});
 try {const b:any=await request.json();if(typeof b.id!=="string"||(b.status===undefined&&b.date===undefined)||(b.status!==undefined&&!["open","done","priority"].includes(b.status))||(b.date!==undefined&&(typeof b.date!=="string"||(b.date&&!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(b.date)))))return Response.json({error:"Invalid update."},{status:400});
 const result=await database().prepare("UPDATE records SET status = COALESCE(?,status), date = COALESCE(?,date) WHERE id = ? AND owner = ? AND kind != 'document'").bind(b.status??null,b.date??null,b.id,user.userId).run();
 if(!result.meta.changes)return Response.json({error:"Record not found."},{status:404});return Response.json({ok:true});}catch{return Response.json({error:"Could not update. Try again."},{status:503});}
}
export async function DELETE(request:Request) {
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Please sign in."},{status:401});
 try {const b:any=await request.json();if(typeof b.id!=="string")return Response.json({error:"Invalid record."},{status:400});
 const result=await database().prepare("DELETE FROM records WHERE id = ? AND owner = ? AND kind != 'document'").bind(b.id,user.userId).run();
 if(!result.meta.changes)return Response.json({error:"Record not found."},{status:404});return Response.json({ok:true});}catch{return Response.json({error:"Could not delete."},{status:503});}
}
