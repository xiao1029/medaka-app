import { useState } from "react";
import { C } from "../constants";
import { InputF } from "./ui/CommonUI";

function AddTankModal({ onClose, onAdd }) {
  const [name,  setName]  = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(26,58,74,0.45)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",width:"100%",maxWidth:430,boxShadow:"0 -8px 32px rgba(26,58,74,0.18)" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px" }}/>
        <div style={{ fontWeight:800,fontSize:16,color:C.text,marginBottom:16 }}>🪣 水槽を追加</div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>水槽名 *</label>
          <InputF placeholder="例：屋外ビオトープ" value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>メモ（任意）</label>
          <InputF placeholder="品種・匹数など" value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:"12px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.sub,fontWeight:700,fontSize:14,cursor:"pointer" }}>キャンセル</button>
          <button onClick={()=>{ if(!name.trim()) return; onAdd(name.trim(),notes.trim()); }}
            style={{ flex:2,padding:"12px",background:`linear-gradient(135deg,${C.water},${C.waterD})`,border:"none",borderRadius:12,color:"white",fontWeight:800,fontSize:14,cursor:"pointer" }}>追加する</button>
        </div>
      </div>
    </div>
  );
}


export default AddTankModal;
