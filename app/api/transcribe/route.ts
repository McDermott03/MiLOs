import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../../chatgpt-auth";
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Sign in to use voice."},{status:401});
 try{
 const form=await request.formData(),audio=form.get("audio");
 if(!(audio instanceof File)||!audio.size||audio.size>10*1024*1024||!/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)/.test(audio.type))return Response.json({error:"Choose a supported audio recording under 10 MB."},{status:400});
 if(form.get("consent")!=="true")return Response.json({error:"Allow OpenAI transcription before sending a recording."},{status:403});
 const key=(env as unknown as Record<string,string>).OPENAI_API_KEY;if(!key)return Response.json({error:"The voice connection isn’t configured yet."},{status:503});
 const body=new FormData();body.set("file",audio,audio.name);body.set("model","gpt-4o-mini-transcribe");body.set("response_format","json");
 const res=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${key}`},body,signal:AbortSignal.timeout(60000)});const data:any=await res.json();
 if(!res.ok)return Response.json({error:["credit_balance_exhausted","insufficient_quota"].includes(data.error?.code)?"Add API credits to use MiLOs voice.":"The recording couldn’t be transcribed. Try again or type your update."},{status:502});
 if(typeof data.text!=="string"||!data.text.trim())return Response.json({error:"No speech was detected. Try again or type your update."},{status:422});
 return Response.json({text:data.text});
 }catch{return Response.json({error:"Voice couldn’t finish. Try again or type your update."},{status:503});}
}
