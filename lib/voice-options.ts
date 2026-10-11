type Voice={name:string;lang:string;voiceURI:string};
export function standardVoice(name:string){return !/albert|bad news|bahh|bells|boing|bubbles|cellos|eddy|flo\b|fred|good news|grandma|grandpa|jester|junior|kathy|organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox/i.test(name);}
export function adultVoice<T extends Voice>(voices:T[],style:'male'|'female'){
 const names=style==='female'?/\b(samantha|ava|susan|karen|moira|tessa|serena|zira|jenny|aria|sonia)\b/i:/\b(alex|daniel|tom|oliver|lee|david|guy|ryan|arthur|evan)\b/i;
 return voices.filter(v=>v.lang.startsWith('en')&&names.test(v.name)).sort((a,b)=>quality(b.name)-quality(a.name))[0];
}
function quality(name:string){return /natural|premium/i.test(name)?3:/enhanced|neural/i.test(name)?2:1;}
export function conversationalSpeech(text:string){return text.replace(/```[\s\S]*?```/g,'Code is available on screen.').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*#_`]/g,'').replace(/^\s*[-•]\s+/gm,'').trim();}
