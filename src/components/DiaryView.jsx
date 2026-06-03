import { useState } from "react";
import { C, MOOD_LIST } from "../constants";
import { genId, formatDateJP } from "../utils";
import { Card, Btn, InputF, SwipeRow } from "./ui/CommonUI";

function DiaryView({ tank, tanks, diaryEntries, setDiaryEntries, showToast, todayStr }) {
  const tankDiary = diaryEntries.filter(e=>e.tankId===tank.id).sort((a,b)=>b.date.localeCompare(a.date));
  const [editing,setEditing] = useState(false);
  const [draft,setDraft]     = useState({ date:todayStr,mood:"good",title:"",body:"",tankId:tank.id,public:false });

  const openNew  = () => { setDraft({ date:todayStr,mood:"good",title:"",body:"",tankId:tank.id,public:false }); setEditing(true); };
  const openEdit = (e) => { setDraft({...e}); setEditing(true); };
  const saveDiary = () => {
    if(!draft.body.trim()){ showToast("本文を入力してください"); return; }
    if(draft.id){ setDiaryEntries(prev=>prev.map(e=>e.id===draft.id?draft:e)); }
    else { setDiaryEntries(prev=>[{ ...draft,id:genId(),createdAt:new Date().toISOString() },...prev]); }
    setEditing(false); showToast("📝 日誌を保存しました");
  };
  const deleteDiary = (id) => { setDiaryEntries(prev=>prev.filter(e=>e.id!==id)); showToast("🗑 削除しました"); };

  if(editing) return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,margin:"8px 0 16px" }}>
        <button onClick={()=>setEditing(false)} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.water,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:700 }}>← 戻る</button>
        <span style={{ fontWeight:800,fontSize:15,color:C.text }}>{draft.id?"日誌を編集":"新しい日誌"}</span>
      </div>
      <Card style={{ marginBottom:12 }}>
        {/* 水槽選択 */}
        {tanks && tanks.length > 1 && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:6 }}>🪣 対象水槽</label>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {tanks.map(t=>(
                <button key={t.id} onClick={()=>setDraft(p=>({...p,tankId:t.id}))}
                  style={{ padding:"7px 14px",borderRadius:20,
                    border:`2px solid ${draft.tankId===t.id?C.orange:C.border}`,
                    background:draft.tankId===t.id?"#FFF5EE":C.white,
                    color:draft.tankId===t.id?C.orange:C.sub,
                    fontWeight:draft.tankId===t.id?800:500,
                    fontSize:12,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s" }}>
                  🪣 {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>📅 日付</label>
          <InputF type="date" value={draft.date} onChange={e=>setDraft(p=>({...p,date:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>📌 タイトル（任意）</label>
          <InputF placeholder="例：初めての産卵！" value={draft.title||""} onChange={e=>setDraft(p=>({...p,title:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:6 }}>😊 今日の水槽の様子</label>
          <div style={{ display:"flex",gap:8 }}>
            {MOOD_LIST.map(m=>(
              <button key={m.v} onClick={()=>setDraft(p=>({...p,mood:m.v}))}
                style={{ flex:1,padding:"8px 4px",borderRadius:12,border:`2px solid ${draft.mood===m.v?C.water:C.border}`,background:draft.mood===m.v?C.sky:C.white,cursor:"pointer",textAlign:"center" }}>
                <div style={{ fontSize:20 }}>{m.emoji}</div>
                <div style={{ fontSize:10,fontWeight:700,color:draft.mood===m.v?C.water:C.sub }}>{m.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>✏️ 内容</label>
          <InputF multiline rows={6} placeholder="今日の観察記録、気になったこと、産卵や成長の記録など..." value={draft.body} onChange={e=>setDraft(p=>({...p,body:e.target.value}))}/>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0" }}>
          <div onClick={()=>setDraft(p=>({...p,public:!p.public}))}
            style={{ width:44,height:24,borderRadius:12,background:draft.public?C.water:C.border,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0 }}>
            <div style={{ position:"absolute",top:3,left:draft.public?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
          </div>
          <span style={{ fontSize:13,color:C.text,fontWeight:600 }}>{draft.public?"👥 フレンドに公開":"🔒 非公開"}</span>
        </div>
      </Card>
      <Btn onClick={saveDiary} color={C.orange}>💾 保存する</Btn>
    </div>
  );

  return (
    <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
      <div style={{ padding:"0 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontWeight:800,fontSize:15,color:C.text }}>📝 日誌 — {tank.name}</span>
        <Btn onClick={openNew} color={C.orange} small>＋ 新しい日誌</Btn>
      </div>
      {tankDiary.length===0
        ? <div style={{ textAlign:"center",padding:"48px 24px",color:C.sub }}>
            <div style={{ fontSize:48,marginBottom:12 }}>📔</div>
            <div style={{ fontWeight:700,fontSize:15,color:C.text,marginBottom:8 }}>日誌がまだありません</div>
            <div style={{ fontSize:13,lineHeight:1.7 }}>「＋ 新しい日誌」から<br/>観察記録を残しましょう！</div>
          </div>
        : <div style={{ padding:"0 16px" }}>
            {tankDiary.map(entry=>{
              const mood=MOOD_LIST.find(m=>m.v===entry.mood)||MOOD_LIST[1];
              return (
                <SwipeRow key={entry.id} onDelete={()=>deleteDiary(entry.id)}>
                  <div onClick={()=>openEdit(entry)}
                    style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",boxShadow:"0 2px 8px rgba(90,175,214,0.07)" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:22 }}>{mood.emoji}</span>
                        <div>
                          <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{entry.title||formatDateJP(entry.date)}</div>
                          <div style={{ fontSize:11,color:C.sub }}>
                            {tanks?.find(t=>t.id===entry.tankId)&&(
                              <span style={{ background:"#FFF5EE",color:C.orange,fontWeight:700,fontSize:10,padding:"1px 7px",borderRadius:20,marginRight:5,border:`1px solid #FFD9BC` }}>
                                🪣 {tanks.find(t=>t.id===entry.tankId).name}
                              </span>
                            )}
                            {formatDateJP(entry.date)}　{entry.public?"👥 公開":"🔒 非公開"}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize:11,color:C.sub,flexShrink:0 }}>← スワイプ</span>
                    </div>
                    <div style={{ fontSize:13,color:C.sub,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{entry.body}</div>
                  </div>
                </SwipeRow>
              );
            })}
          </div>}
    </div>
  );
}


export default DiaryView;
