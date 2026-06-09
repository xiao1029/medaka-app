import { useState } from "react";
import { C, MEDAKA_COLORS } from "../constants";
import { genId, formatDateJP } from "../utils";
import { Card, Btn, InputF, SwipeRow } from "./ui/CommonUI";

function FishView({ fishRecords, setFishRecords, showToast, todayStr, tanks }) {
  const defaultTankId = tanks?.[0]?.id ?? "";
  const [editing,setEditing] = useState(false);
  const [draft,setDraft]     = useState({ date:todayStr,breed:"",count:1,source:"",price:"",memo:"",color:MEDAKA_COLORS[0],tankId:defaultTankId });

  const openNew  = () => { setDraft({ date:todayStr,breed:"",count:1,source:"",price:"",memo:"",color:MEDAKA_COLORS[0],tankId:defaultTankId }); setEditing(true); };
  const openEdit = (r) => { setDraft({...r}); setEditing(true); };
  const saveRecord = () => {
    if(!draft.breed.trim()){ showToast("品種名を入力してください"); return; }
    if(draft.id){ setFishRecords(prev=>prev.map(r=>r.id===draft.id?draft:r)); }
    else { setFishRecords(prev=>[{ ...draft,id:genId(),createdAt:new Date().toISOString() },...prev]); }
    setEditing(false); showToast("🐠 メダカを記録しました");
  };
  const deleteRec = (id) => { setFishRecords(prev=>prev.filter(r=>r.id!==id)); showToast("🗑 削除しました"); };
  const total = fishRecords.reduce((s,r)=>s+(Number(r.count)||0),0);

  if(editing) return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,margin:"8px 0 16px" }}>
        <button onClick={()=>setEditing(false)} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.water,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:700 }}>← 戻る</button>
        <span style={{ fontWeight:800,fontSize:15,color:C.text }}>{draft.id?"メダカを編集":"新しいメダカを登録"}</span>
      </div>
      <Card style={{ marginBottom:12 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>🐟 品種名 *</label>
            <InputF placeholder="例：楊貴妃" value={draft.breed} onChange={e=>setDraft(p=>({...p,breed:e.target.value}))}/>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>🔢 匹数</label>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <button onClick={()=>setDraft(p=>({...p,count:Math.max(1,(p.count||1)-1)}))} style={{ width:36,height:36,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:18,color:C.text,cursor:"pointer",fontWeight:700,flexShrink:0 }}>−</button>
              <span style={{ flex:1,textAlign:"center",fontWeight:800,fontSize:18,color:C.text }}>{draft.count||1}</span>
              <button onClick={()=>setDraft(p=>({...p,count:(p.count||1)+1}))} style={{ width:36,height:36,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:18,color:C.text,cursor:"pointer",fontWeight:700,flexShrink:0 }}>+</button>
            </div>
          </div>
        </div>
        {/* 水槽選択 */}
        {tanks && tanks.length > 1 && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:6 }}>🪣 管理する水槽</label>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {tanks.map(t=>(
                <button key={t.id} onClick={()=>setDraft(p=>({...p,tankId:t.id}))}
                  style={{ padding:"7px 14px",borderRadius:20,
                    border:`2px solid ${draft.tankId===t.id?C.water:C.border}`,
                    background:draft.tankId===t.id?C.sky:C.white,
                    color:draft.tankId===t.id?C.waterD:C.sub,
                    fontWeight:draft.tankId===t.id?800:500,
                    fontSize:12,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s" }}>
                  🪣 {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>📅 入手日</label>
          <InputF type="date" value={draft.date} onChange={e=>setDraft(p=>({...p,date:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>🏪 入手場所</label>
          <InputF placeholder="例：○○ペットショップ、ブリーダー直販" value={draft.source||""} onChange={e=>setDraft(p=>({...p,source:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>💴 購入金額（任意）</label>
          <InputF placeholder="例：3,000円" value={draft.price||""} onChange={e=>setDraft(p=>({...p,price:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>📝 メモ</label>
          <InputF multiline rows={3} placeholder="特徴・健康状態・産卵状況など" value={draft.memo||""} onChange={e=>setDraft(p=>({...p,memo:e.target.value}))}/>
        </div>
        <div>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:6 }}>🎨 カラーラベル</label>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {MEDAKA_COLORS.map(c=>(
              <div key={c} onClick={()=>setDraft(p=>({...p,color:c}))}
                style={{ width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:draft.color===c?"3px solid #1A3A4A":"3px solid transparent",boxShadow:draft.color===c?"0 0 0 2px white inset":"none",transition:"all 0.15s" }}/>
            ))}
          </div>
        </div>
      </Card>
      <Btn onClick={saveRecord} color={C.purple}>💾 保存する</Btn>
    </div>
  );

  return (
    <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
      <div style={{ padding:"0 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <span style={{ fontWeight:800,fontSize:15,color:C.text }}>🐠 メダカ台帳</span>
          <span style={{ fontSize:12,color:C.sub,marginLeft:8 }}>合計 {total}匹</span>
        </div>
        <Btn onClick={openNew} color={C.purple} small>＋ 追加</Btn>
      </div>
      {fishRecords.length===0
        ? <div style={{ textAlign:"center",padding:"48px 24px",color:C.sub }}>
            <div style={{ fontSize:52,marginBottom:12 }}>🐠</div>
            <div style={{ fontWeight:700,fontSize:15,color:C.text,marginBottom:8 }}>まだ記録がありません</div>
            <div style={{ fontSize:13,lineHeight:1.7 }}>「＋ 追加」から記録しましょう</div>
          </div>
        : <div style={{ padding:"0 16px" }}>
            {fishRecords.map(rec=>(
              <SwipeRow key={rec.id} onDelete={()=>deleteRec(rec.id)}>
                <div onClick={()=>openEdit(rec)}
                  style={{ display:"flex",alignItems:"center",gap:12,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"12px 14px",cursor:"pointer",boxShadow:"0 2px 8px rgba(90,175,214,0.07)" }}>
                  <div style={{ width:44,height:44,borderRadius:14,background:`${rec.color}22`,border:`2px solid ${rec.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🐟</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontWeight:800,fontSize:15,color:C.text }}>{rec.breed}</span>
                      <span style={{ background:rec.color,color:"white",fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,flexShrink:0 }}>{rec.count}匹</span>
                    </div>
                    <div style={{ fontSize:12,color:C.sub,marginTop:2 }}>
                      {rec.tankId && tanks?.find(t=>t.id===rec.tankId) && (
                        <span style={{ background:C.sky,color:C.water,fontWeight:700,fontSize:10,padding:"1px 7px",borderRadius:20,marginRight:6,border:`1px solid ${C.border}` }}>
                          🪣 {tanks.find(t=>t.id===rec.tankId).name}
                        </span>
                      )}
                      {formatDateJP(rec.date)}{rec.source&&` • ${rec.source}`}
                    </div>
                    {rec.memo&&<div style={{ fontSize:12,color:C.sub,marginTop:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" }}>{rec.memo}</div>}
                  </div>
                  <span style={{ fontSize:11,color:C.sub,flexShrink:0 }}>← スワイプ</span>
                </div>
              </SwipeRow>
            ))}
          </div>}
    </div>
  );
}


export default FishView;
