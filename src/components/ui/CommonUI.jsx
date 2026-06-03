import { useState, useRef } from "react";
import { C } from "../../constants";

export const WaveDivider = ({ color = "#E8F6FF" }) => (
  <svg viewBox="0 0 430 28" style={{ display:"block", width:"100%", height:28 }} preserveAspectRatio="none">
    <path d="M0,14 C80,28 160,0 215,14 C270,28 350,0 430,14 L430,28 L0,28 Z" fill={color}/>
  </svg>
);

export function SwipeRow({ onDelete, children }) {
  const [offset, setOffset] = useState(0);
  const startX   = useRef(null);
  const dragging = useRef(false);
  const TH = 80;
  return (
    <div style={{ position:"relative", overflow:"hidden", borderRadius:14, marginBottom:8 }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to left,#EF4444,#F87171)",
        display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:24, borderRadius:14 }}>
        <span style={{ color:"white", fontSize:13, fontWeight:700 }}>🗑 削除</span>
      </div>
      <div
        onTouchStart={e=>{ startX.current=e.touches[0].clientX; dragging.current=false; }}
        onTouchMove={e=>{ if(startX.current===null) return; const dx=e.touches[0].clientX-startX.current; if(dx<-10) dragging.current=true; if(dragging.current) setOffset(Math.max(dx,-TH-20)); }}
        onTouchEnd={()=>{ if(offset<-TH) onDelete(); else setOffset(0); startX.current=null; }}
        style={{ transform:`translateX(${offset}px)`, transition:startX.current?"none":"transform 0.3s cubic-bezier(.25,.46,.45,.94)", position:"relative", zIndex:1 }}>
        {children}
      </div>
    </div>
  );
}

export const SectionLabel = ({ children, mt=20 }) => (
  <div style={{ color:C.sub, fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", margin:`${mt}px 0 8px`, paddingLeft:4 }}>{children}</div>
);

export const Card = ({ children, style={} }) => (
  <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:16, boxShadow:"0 2px 10px rgba(90,175,214,0.08)", ...style }}>{children}</div>
);

export const Btn = ({ onClick, children, color=C.water, small=false, outline=false, disabled=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small?"8px 16px":"11px 20px",
    background: outline?"transparent":`linear-gradient(135deg,${color},${color}CC)`,
    border: outline?`2px solid ${color}`:"none",
    borderRadius:12, color: outline?color:"white",
    fontWeight:800, fontSize:small?12:14, cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.5:1, boxShadow:outline?"none":`0 4px 12px ${color}44`,
  }}>{children}</button>
);

export const InputF = ({ placeholder, value, onChange, type="text", multiline=false, rows=4, style={} }) =>
  multiline
    ? <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{ width:"100%", padding:"11px 14px", background:C.sky, border:`1.5px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, outline:"none", fontFamily:"inherit", resize:"vertical", lineHeight:1.7, ...style }}/>
    : <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width:"100%", padding:"11px 14px", background:C.sky, border:`1.5px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, outline:"none", fontFamily:"inherit", ...style }}/>;
