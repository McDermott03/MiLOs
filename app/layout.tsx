import type { Metadata } from "next";
import "./globals.css";
import MobileApp from "./mobile-app";
export const viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#050e1c"};
export const metadata:Metadata={title:"MiLOs · Your life, connected",description:"Your whole-life workspace for planning, memories, projects, and follow-through.",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"MiLOs"},icons:{icon:"/favicon.svg",apple:"/apple-touch-icon.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<MobileApp/></body></html>;}
