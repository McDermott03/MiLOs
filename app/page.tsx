import Workspace from "./workspace";
import { getChatGPTUser, chatGPTSignInPath } from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Home(){const user=await getChatGPTUser();return <Workspace signedIn={!!user} name={user?.fullName || ""} signIn={chatGPTSignInPath("/")} userId={user?.userId||"guest"} />;}
