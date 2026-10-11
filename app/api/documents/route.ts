import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { database, areas } from "@/lib/records";
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Please sign in."},{status:401});
 let key:string|undefined;
 try {const form=await request.formData();const file=form.get("file");const area=String(form.get("area")||"Home");
 if(!(file instanceof File)||file.size>10*1024*1024||file.size===0||!areas.includes(area))return Response.json({error:"Choose a file under 10 MB and a life area."},{status:400});
 if(!env.BUCKET)throw new Error("Storage unavailable");const id=crypto.randomUUID();key=user.userId+"/"+id;
 await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:"application/octet-stream"}});
 const r={id,kind:"document",title:file.name.slice(0,500),area,details:JSON.stringify({key,size:file.size}),date:"",status:"open",created:new Date().toISOString()};
 await database().prepare("INSERT INTO records (id,owner,kind,title,area,details,date,status,created) VALUES (?,?,?,?,?,?,?,?,?)").bind(r.id,user.userId,r.kind,r.title,r.area,r.details,r.date,r.status,r.created).run();return Response.json({record:r},{status:201});
 }catch{if(key&&env.BUCKET)await env.BUCKET.delete(key).catch(()=>{});return Response.json({error:"Upload failed. Please try again."},{status:503});}
}
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Please sign in."},{status:401});
 try {const id=new URL(request.url).searchParams.get("id");const row=await database().prepare("SELECT * FROM records WHERE id = ? AND owner = ? AND kind = 'document'").bind(id,user.userId).first<any>();
 if(!row)return Response.json({error:"Document not found."},{status:404});const file=await env.BUCKET?.get(JSON.parse(row.details).key);if(!file)return Response.json({error:"Document unavailable."},{status:404});
 return new Response(file.body,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(row.title),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return Response.json({error:"Download failed."},{status:503});}
}
export async function DELETE(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Please sign in."},{status:401});
 try {const {id}=await request.json() as {id:string};const row=await database().prepare("SELECT details FROM records WHERE id = ? AND owner = ? AND kind = 'document'").bind(id,user.userId).first<any>();
 if(!row)return Response.json({error:"Document not found."},{status:404});if(!env.BUCKET)throw new Error("Unavailable");await env.BUCKET.delete(JSON.parse(row.details).key);
 await database().prepare("DELETE FROM records WHERE id = ? AND owner = ?").bind(id,user.userId).run();return Response.json({ok:true});}catch{return Response.json({error:"Could not delete document."},{status:503});}
}
