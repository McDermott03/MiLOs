import {getChatGPTUser,chatGPTSignInPath} from "../../chatgpt-auth";
import JoinFamily from "./join-family";
export const dynamic="force-dynamic";
export default async function Page(){const user=await getChatGPTUser();return <JoinFamily signedIn={!!user} signIn={chatGPTSignInPath("/family/join")}/>;}
