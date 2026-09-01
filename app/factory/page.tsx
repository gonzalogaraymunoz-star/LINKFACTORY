import Link from "next/link";
import FactoryClientV2 from "./FactoryClientV2";

export default function FactoryPage(){
  return <>
    <Link
      href="/factory/video"
      aria-label="Abrir Constructor de Videos"
      style={{position:"fixed",right:18,bottom:18,zIndex:1000,display:"inline-flex",alignItems:"center",gap:8,padding:"11px 15px",borderRadius:999,background:"#111",color:"#fff",textDecoration:"none",fontSize:13,fontWeight:700,boxShadow:"0 8px 30px rgba(0,0,0,.16)"}}
    >▶ Video</Link>
    <FactoryClientV2/>
  </>;
}
