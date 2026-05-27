import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   カラーパレット
═══════════════════════════════════════════════════════════ */
const C = {
  sky:"#E8F6FF", skyMid:"#C8E9FF", water:"#5BAFD6", waterD:"#3A8CB8",
  orange:"#FF8C42", green:"#2DB87A", purple:"#8B66D4", pink:"#E8547A",
  warn:"#F59E0B", danger:"#EF4444", text:"#1A3A4A", sub:"#6B8FA3",
  border:"#D6EAF5", white:"#FFFFFF",
};

const DEFAULT_TASKS = [
  { id:"feed",    label:"餌やり",    icon:"🐟", defaultInterval:1, color:C.orange  },
  { id:"water",   label:"水換え",    icon:"💧", defaultInterval:7, color:C.water   },
  { id:"psb",     label:"PSB投入",   icon:"🧪", defaultInterval:7, color:C.purple  },
  { id:"vitamin", label:"ビタミン剤", icon:"💊", defaultInterval:3, color:C.green   },
];

const SEASON_TIPS = {
  spring:{ label:"🌸 春の管理", bg:"#FFF0F5", border:"#FFB7CE", tip:"水温上昇とともに餌の量を増やしましょう。産卵シーズン開始！" },
  summer:{ label:"☀️ 夏の管理", bg:"#FFFBEB", border:"#FCD34D", tip:"高水温に注意。水換え頻度を上げ、直射日光を避けましょう。" },
  autumn:{ label:"🍂 秋の管理", bg:"#FFF5EC", border:"#FDBA74", tip:"水温低下に合わせて餌を減らし、越冬準備を始めましょう。" },
  winter:{ label:"❄️ 冬の管理", bg:"#F0F8FF", border:"#93C5FD", tip:"5℃以下では絶食。ヒーターなしの場合は静かに見守りましょう。" },
};

const MEDAKA_COLORS = ["#FF8C42","#5BAFD6","#2DB87A","#8B66D4","#E8547A","#F59E0B","#14B8A6"];
const MOOD_LIST = [
  { v:"great", label:"最高！", emoji:"😄" },
  { v:"good",  label:"良い",   emoji:"🙂" },
  { v:"ok",    label:"普通",   emoji:"😐" },
  { v:"bad",   label:"心配",   emoji:"😟" },
];
const AVATARS = ["🐟","🐡","🐠","🦈","🪸","🐙","🌊","🌿"];

/* ═══════════════════════════════════════════════════════════
   ユーティリティ
═══════════════════════════════════════════════════════════ */
const getSeason    = () => { const m=new Date().getMonth()+1; return m>=3&&m<=5?"spring":m>=6&&m<=8?"summer":m>=9&&m<=11?"autumn":"winter"; };
const toDateStr    = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const formatTime   = iso => { const d=new Date(iso); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`; };
const formatDateJP = ds => { if(!ds) return ""; const [y,m,d]=ds.split("-"); return `${parseInt(y)}年${parseInt(m)}月${parseInt(d)}日`; };
const daysSince    = (list=[]) => { if(!list.length) return Infinity; return Math.floor((Date.now()-Math.max(...list.map(s=>new Date(s).getTime())))/86400000); };
const getStatus    = (days,interval) => { if(days===Infinity) return "urgent"; const r=days/interval; return r>=1?"urgent":r>=0.75?"warn":"ok"; };
const genId        = () => Math.random().toString(36).slice(2,10).toUpperCase();

function lGet(key,fb){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fb; }catch{ return fb; } }
function lSet(key,v) { try{ localStorage.setItem(key,JSON.stringify(v)); }catch{} }
async function sGet(key){ try{ const r=await window.storage.get(key,true); return r?JSON.parse(r.value):null; }catch{ return null; } }
async function sSet(key,val){ try{ await window.storage.set(key,JSON.stringify(val),true); }catch{} }

/* ═══════════════════════════════════════════════════════════
   共通UIコンポーネント（すべてトップレベル）
═══════════════════════════════════════════════════════════ */
const WaveDivider = ({ color="#E8F6FF" }) => (
  <svg viewBox="0 0 430 28" style={{ display:"block",width:"100%",height:28 }} preserveAspectRatio="none">
    <path d="M0,14 C80,28 160,0 215,14 C270,28 350,0 430,14 L430,28 L0,28 Z" fill={color}/>
  </svg>
);

function SwipeRow({ onDelete, children }) {
  const [offset,setOffset] = useState(0);
  const startX   = useRef(null);
  const dragging = useRef(false);
  const TH = 80;
  return (
    <div style={{ position:"relative",overflow:"hidden",borderRadius:14,marginBottom:8 }}>
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to left,#EF4444,#F87171)",
        display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:24,borderRadius:14 }}>
        <span style={{ color:"white",fontSize:13,fontWeight:700 }}>🗑 削除</span>
      </div>
      <div
        onTouchStart={e=>{ startX.current=e.touches[0].clientX; dragging.current=false; }}
        onTouchMove={e=>{ if(startX.current===null) return; const dx=e.touches[0].clientX-startX.current; if(dx<-10) dragging.current=true; if(dragging.current) setOffset(Math.max(dx,-TH-20)); }}
        onTouchEnd={()=>{ if(offset<-TH) onDelete(); else setOffset(0); startX.current=null; }}
        style={{ transform:`translateX(${offset}px)`,transition:startX.current?"none":"transform 0.3s cubic-bezier(.25,.46,.45,.94)",position:"relative",zIndex:1 }}>
        {children}
      </div>
    </div>
  );
}

const SectionLabel = ({ children, mt=20 }) => (
  <div style={{ color:C.sub,fontSize:11,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",margin:`${mt}px 0 8px`,paddingLeft:4 }}>{children}</div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,boxShadow:"0 2px 10px rgba(90,175,214,0.08)",...style }}>{children}</div>
);

const Btn = ({ onClick, children, color=C.water, small=false, outline=false, disabled=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:small?"8px 16px":"11px 20px",
    background:outline?"transparent":`linear-gradient(135deg,${color},${color}CC)`,
    border:outline?`2px solid ${color}`:"none",
    borderRadius:12, color:outline?color:"white",
    fontWeight:800, fontSize:small?12:14, cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.5:1, boxShadow:outline?"none":`0 4px 12px ${color}44`,
  }}>{children}</button>
);

const InputF = ({ placeholder, value, onChange, type="text", multiline=false, rows=4, style={} }) =>
  multiline
    ? <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{ width:"100%",padding:"11px 14px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical",lineHeight:1.7,...style }}/>
    : <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width:"100%",padding:"11px 14px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:14,outline:"none",fontFamily:"inherit",...style }}/>;

/* ─── カレンダー ─────────────────────────────────────────── */
function CalendarView({ tank, allTasks, diaryEntries=[], medakaRecords=[], onDaySelect, selectedDay }) {
  const today = new Date();
  const [year,setYear]   = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth());
  const firstDOW    = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const todayStr    = toDateStr(today);
  const countByDay  = {};
  Object.values(tank.tasks||{}).forEach(td=>(td.history||[]).forEach(iso=>{ const ds=toDateStr(new Date(iso)); countByDay[ds]=(countByDay[ds]||0)+1; }));
  const diaryDays  = new Set(diaryEntries.map(e=>e.date));
  const medakaDays = new Set(medakaRecords.map(r=>r.date));
  const cells      = [...Array(firstDOW).fill(null),...Array(daysInMonth).fill(0).map((_,i)=>i+1)];
  const weekDays   = ["日","月","火","水","木","金","土"];
  const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const prevM = () => { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); };
  const nextM = () => { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); };
  return (
    <Card style={{ margin:"0 16px 12px",padding:"14px 12px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <button onClick={prevM} style={{ width:32,height:32,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:18,fontWeight:700,color:C.water,cursor:"pointer" }}>‹</button>
        <span style={{ fontWeight:800,fontSize:16,color:C.text }}>{year}年 {monthNames[month]}</span>
        <button onClick={nextM} style={{ width:32,height:32,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:18,fontWeight:700,color:C.water,cursor:"pointer" }}>›</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4 }}>
        {weekDays.map((w,i)=><div key={w} style={{ textAlign:"center",fontSize:11,fontWeight:700,color:i===0?"#EF4444":i===6?"#3B82F6":C.sub,paddingBottom:4 }}>{w}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2 }}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const cnt=countByDay[ds]||0;
          const hasDiary=diaryDays.has(ds), hasMedaka=medakaDays.has(ds);
          const isToday=ds===todayStr, isSel=ds===selectedDay;
          const dow=(firstDOW+d-1)%7;
          return (
            <div key={i} onClick={()=>onDaySelect(ds)}
              style={{ aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:10,cursor:"pointer",
                background:isSel?C.water:isToday?C.sky:(cnt>0||hasDiary||hasMedaka)?"#F0FBF5":"transparent",
                border:isToday&&!isSel?`2px solid ${C.water}`:"2px solid transparent",transition:"all 0.15s" }}>
              <span style={{ fontSize:13,fontWeight:isToday||isSel?800:500,color:isSel?"white":dow===0?"#EF4444":dow===6?"#3B82F6":C.text,lineHeight:1 }}>{d}</span>
              <div style={{ display:"flex",gap:2,marginTop:2 }}>
                {cnt>0     &&<div style={{ width:5,height:5,borderRadius:"50%",background:isSel?"white":C.green }}/>}
                {hasDiary  &&<div style={{ width:5,height:5,borderRadius:"50%",background:isSel?"white":C.orange }}/>}
                {hasMedaka &&<div style={{ width:5,height:5,borderRadius:"50%",background:isSel?"white":C.purple }}/>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:12,marginTop:8,justifyContent:"center" }}>
        {[{c:C.green,l:"ケア"},{c:C.orange,l:"日誌"},{c:C.purple,l:"入荷"}].map(({c,l})=>(
          <div key={l} style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:c }}/><span style={{ fontSize:10,color:C.sub }}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   📝 DiaryView
═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   🐠 FishView
═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   👥 FriendsView
═══════════════════════════════════════════════════════════ */
function FriendsView({ myProfile, setMyProfile, friends, setFriends, diaryEntries, fishRecords, showToast }) {
  const [profileDraft,  setProfileDraft]  = useState({ name:"",bio:"",avatar:"🐟" });
  const [addIdInput,    setAddIdInput]    = useState("");
  const [subView,       setSubView]       = useState("list");
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendDiary,   setFriendDiary]   = useState([]);
  const [friendFish,    setFriendFish]    = useState([]);
  const [loading,       setLoading]       = useState(false);

  if(!myProfile) return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <div style={{ textAlign:"center",padding:"32px 0 20px" }}>
        <div style={{ fontSize:56,marginBottom:12 }}>🐟</div>
        <div style={{ fontWeight:800,fontSize:17,color:C.text,marginBottom:8 }}>マイIDを作成しましょう</div>
        <div style={{ fontSize:13,color:C.sub,lineHeight:1.7 }}>IDを作成するとフレンドと<br/>日誌を見せ合えます</div>
      </div>
      <Card>
        <div style={{ display:"flex",gap:10,justifyContent:"center",marginBottom:16,flexWrap:"wrap" }}>
          {AVATARS.map(e=>(
            <button key={e} onClick={()=>setProfileDraft(p=>({...p,avatar:e}))}
              style={{ width:42,height:42,borderRadius:12,border:`2px solid ${profileDraft.avatar===e?C.water:C.border}`,background:profileDraft.avatar===e?C.sky:C.white,fontSize:22,cursor:"pointer" }}>{e}</button>
          ))}
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>ニックネーム *</label>
          <InputF placeholder="例：メダカ太郎" value={profileDraft.name} onChange={e=>setProfileDraft(p=>({...p,name:e.target.value}))}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>一言紹介（任意）</label>
          <InputF placeholder="例：楊貴妃専門ブリーダーです🐟" value={profileDraft.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))}/>
        </div>
        <Btn onClick={()=>{
          if(!profileDraft.name.trim()){ showToast("ニックネームを入力してください"); return; }
          const id=genId();
          setMyProfile({ id,name:profileDraft.name.trim(),bio:profileDraft.bio.trim(),avatar:profileDraft.avatar,createdAt:new Date().toISOString() });
          showToast(`✅ ID: ${id} でプロフィールを作成しました`);
        }} color={C.water}>IDを作成する 🎉</Btn>
      </Card>
    </div>
  );

  if(subView==="view_friend"&&viewingFriend) return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,margin:"8px 0 16px" }}>
        <button onClick={()=>setSubView("list")} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.water,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:700 }}>← 戻る</button>
      </div>
      <Card style={{ marginBottom:16,display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ width:52,height:52,borderRadius:16,background:C.sky,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`2px solid ${C.border}` }}>{viewingFriend.avatar}</div>
        <div>
          <div style={{ fontWeight:800,fontSize:16,color:C.text }}>{viewingFriend.name}</div>
          {viewingFriend.bio&&<div style={{ fontSize:13,color:C.sub }}>{viewingFriend.bio}</div>}
          <div style={{ fontSize:11,color:C.sub }}>ID: {viewingFriend.id}</div>
        </div>
      </Card>
      {loading?<div style={{ textAlign:"center",padding:40,color:C.sub }}>読み込み中...</div>:<>
        {friendFish.length>0&&<><SectionLabel mt={0}>🐠 メダカ台帳</SectionLabel>
          {friendFish.map(rec=>(
            <div key={rec.id} style={{ display:"flex",alignItems:"center",gap:12,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 14px",marginBottom:8 }}>
              <div style={{ width:40,height:40,borderRadius:12,background:`${rec.color||C.water}22`,border:`2px solid ${rec.color||C.water}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🐟</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:C.text }}>{rec.breed} <span style={{ background:rec.color||C.water,color:"white",fontSize:11,padding:"1px 8px",borderRadius:20 }}>{rec.count}匹</span></div>
                <div style={{ fontSize:12,color:C.sub }}>{formatDateJP(rec.date)}{rec.source&&` • ${rec.source}`}</div>
              </div>
            </div>
          ))}</>}
        <SectionLabel>📝 公開日誌</SectionLabel>
        {friendDiary.length===0
          ?<div style={{ textAlign:"center",padding:"24px 0",color:C.sub }}>公開している日誌はありません</div>
          :friendDiary.map(entry=>{
            const mood=MOOD_LIST.find(m=>m.v===entry.mood)||MOOD_LIST[1];
            return (
              <div key={entry.id} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  <span style={{ fontSize:22 }}>{mood.emoji}</span>
                  <div>
                    <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{entry.title||formatDateJP(entry.date)}</div>
                    <div style={{ fontSize:11,color:C.sub }}>{formatDateJP(entry.date)}</div>
                  </div>
                </div>
                <div style={{ fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{entry.body}</div>
              </div>
            );
          })}
      </>}
    </div>
  );

  if(subView==="add") return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,margin:"8px 0 16px" }}>
        <button onClick={()=>setSubView("list")} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.water,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:700 }}>← 戻る</button>
        <span style={{ fontWeight:800,fontSize:15,color:C.text }}>フレンドを追加</span>
      </div>
      <Card>
        <div style={{ background:C.sky,borderRadius:14,padding:"12px 16px",marginBottom:16,textAlign:"center" }}>
          <div style={{ fontSize:11,color:C.sub,marginBottom:4 }}>あなたのID</div>
          <div style={{ fontWeight:800,fontSize:20,color:C.water,letterSpacing:"0.12em" }}>{myProfile.id}</div>
          <div style={{ fontWeight:700,fontSize:15,color:C.text }}>{myProfile.avatar} {myProfile.name}</div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>フレンドのIDを入力</label>
          <InputF placeholder="例：ABC12345" value={addIdInput} onChange={e=>setAddIdInput(e.target.value.toUpperCase())}/>
        </div>
        <Btn onClick={async()=>{
          const id=addIdInput.trim().toUpperCase();
          if(!id){ showToast("IDを入力してください"); return; }
          if(id===myProfile.id){ showToast("自分自身は追加できません"); return; }
          if(friends.find(f=>f.id===id)){ showToast("すでに追加済みです"); return; }
          showToast("🔍 検索中...");
          const data=await sGet(`medaka_user_${id}`);
          if(!data){ showToast("❌ IDが見つかりませんでした"); return; }
          setFriends(prev=>[...prev,{ id:data.id,name:data.name,bio:data.bio,avatar:data.avatar,addedAt:new Date().toISOString() }]);
          setAddIdInput(""); showToast(`✅ ${data.name} を追加しました！`); setSubView("list");
        }} color={C.green}>🔍 検索して追加</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
      <div style={{ padding:"0 16px" }}>

        {/* プロフィール編集画面 */}
        {subView==="edit_profile" ? (
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800,fontSize:15,color:C.text,marginBottom:14 }}>✏️ プロフィールを編集</div>
            {/* アバター */}
            <div style={{ display:"flex",gap:8,justifyContent:"center",marginBottom:14,flexWrap:"wrap" }}>
              {AVATARS.map(e=>(
                <button key={e} onClick={()=>setProfileDraft(p=>({...p,avatar:e}))}
                  style={{ width:40,height:40,borderRadius:11,border:`2px solid ${profileDraft.avatar===e?C.water:C.border}`,background:profileDraft.avatar===e?C.sky:C.white,fontSize:20,cursor:"pointer" }}>{e}</button>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>ニックネーム *</label>
              <InputF placeholder="例：メダカ太郎" value={profileDraft.name} onChange={e=>setProfileDraft(p=>({...p,name:e.target.value}))}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>一言紹介（任意）</label>
              <InputF placeholder="例：楊貴妃専門ブリーダーです🐟" value={profileDraft.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))}/>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>{ setProfileDraft({ name:myProfile.name,bio:myProfile.bio||"",avatar:myProfile.avatar }); setSubView("list"); }}
                style={{ flex:1,padding:"10px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:11,color:C.sub,fontWeight:700,fontSize:13,cursor:"pointer" }}>キャンセル</button>
              <button onClick={()=>{
                if(!profileDraft.name.trim()){ showToast("ニックネームを入力してください"); return; }
                setMyProfile(p=>({...p,name:profileDraft.name.trim(),bio:profileDraft.bio.trim(),avatar:profileDraft.avatar}));
                setSubView("list"); showToast("✅ プロフィールを更新しました");
              }} style={{ flex:2,padding:"10px",background:`linear-gradient(135deg,${C.water},${C.waterD})`,border:"none",borderRadius:11,color:"white",fontWeight:800,fontSize:13,cursor:"pointer" }}>保存する</button>
            </div>
          </Card>
        ) : (
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14 }}>
              <div style={{ width:52,height:52,borderRadius:16,background:C.sky,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`2px solid ${C.border}`,flexShrink:0 }}>{myProfile.avatar}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:800,fontSize:16,color:C.text }}>{myProfile.name}</div>
                {myProfile.bio&&<div style={{ fontSize:13,color:C.sub }}>{myProfile.bio}</div>}
                <div style={{ fontSize:11,color:C.sub }}>ID: <span style={{ fontWeight:700,color:C.water }}>{myProfile.id}</span></div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                <Btn onClick={()=>{ setProfileDraft({ name:myProfile.name,bio:myProfile.bio||"",avatar:myProfile.avatar }); setSubView("edit_profile"); }} color={C.water} small outline>編集</Btn>
                <Btn onClick={()=>setSubView("add")} color={C.water} small>＋ 追加</Btn>
              </div>
            </div>
          </Card>
        )}
        <SectionLabel mt={0}>フレンド ({friends.length}人)</SectionLabel>
        {friends.length===0
          ?<div style={{ textAlign:"center",padding:"32px 0",color:C.sub }}>
              <div style={{ fontSize:40,marginBottom:8 }}>👥</div>
              <div>フレンドがいません</div>
              <div style={{ fontSize:13,marginTop:4 }}>「＋ 追加」からIDで検索しましょう</div>
            </div>
          :friends.map(f=>(
            <SwipeRow key={f.id} onDelete={()=>{ setFriends(prev=>prev.filter(x=>x.id!==f.id)); showToast("フレンドを削除しました"); }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"12px 14px" }}>
                <div style={{ width:46,height:46,borderRadius:14,background:C.sky,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${C.border}` }}>{f.avatar}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{f.name}</div>
                  {f.bio&&<div style={{ fontSize:12,color:C.sub }}>{f.bio}</div>}
                  <div style={{ fontSize:11,color:C.sub }}>ID: {f.id}</div>
                </div>
                <Btn small color={C.water} onClick={async()=>{
                  setLoading(true);
                  const data=await sGet(`medaka_user_${f.id}`);
                  setViewingFriend(f); setFriendDiary(data?.diary||[]); setFriendFish(data?.fish||[]);
                  setLoading(false); setSubView("view_friend");
                }}>日誌を見る</Btn>
              </div>
            </SwipeRow>
          ))}
      </div>
    </div>
  );
}

/* ─── 水槽インライン編集行 ──────────────────────────────── */
function TankEditRow({ tank, isSelected, canDelete, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(tank.name);
  const [notes,   setNotes]   = useState(tank.notes||"");

  const handleSave = () => {
    if(!name.trim()) return;
    onSave(name.trim(), notes.trim());
    setEditing(false);
  };
  const handleCancel = () => {
    setName(tank.name); setNotes(tank.notes||""); setEditing(false);
  };

  if(editing) return (
    <div style={{ background:C.sky,border:`1.5px solid ${C.water}`,borderRadius:14,padding:"12px 14px",marginBottom:6 }}>
      <div style={{ marginBottom:8 }}>
        <label style={{ fontSize:11,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>水槽名</label>
        <InputF placeholder="水槽名" value={name} onChange={e=>setName(e.target.value)}/>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:11,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>メモ（任意）</label>
        <InputF placeholder="品種・匹数など" value={notes} onChange={e=>setNotes(e.target.value)}/>
      </div>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={handleCancel} style={{ flex:1,padding:"8px",background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.sub,fontWeight:700,fontSize:13,cursor:"pointer" }}>キャンセル</button>
        <button onClick={handleSave}   style={{ flex:2,padding:"8px",background:`linear-gradient(135deg,${C.water},${C.waterD})`,border:"none",borderRadius:10,color:"white",fontWeight:800,fontSize:13,cursor:"pointer" }}>保存する</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isSelected?C.sky:C.white,border:`1.5px solid ${isSelected?C.water:C.border}`,borderRadius:14,marginBottom:6 }}>
      <span style={{ fontSize:22 }}>🪣</span>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ color:C.text,fontWeight:700,fontSize:14 }}>{tank.name}</div>
        {tank.notes&&<div style={{ color:C.sub,fontSize:12 }}>{tank.notes}</div>}
      </div>
      {isSelected&&<span style={{ fontSize:11,color:C.water,fontWeight:700,flexShrink:0 }}>選択中</span>}
      <button onClick={()=>setEditing(true)} style={{ background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.water,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0 }}>編集</button>
      {canDelete&&<button onClick={onDelete} style={{ background:"#FEE2E2",border:"none",borderRadius:8,color:C.danger,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0 }}>削除</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⚙️ SettingsView  ── ★ トップレベルに昇格（入力バグ修正）
═══════════════════════════════════════════════════════════ */
function SettingsView({ tanks, setTanks, selectedTank, setSelectedTank, setView,
  customTasks, setCustomTasks, intervals, setIntervals, allTasks, tank, showToast }) {

  const [newTaskLabel,    setNewTaskLabel]    = useState("");
  const [newTaskInterval, setNewTaskInterval] = useState(7);
  const [newTankName,     setNewTankName]     = useState("");
  const [newTankNotes,    setNewTankNotes]    = useState("");

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>
      <SectionLabel mt={8}>ケア周期の設定</SectionLabel>
      {allTasks.map(task=>{
        const key=`${tank?.id}_${task.id}`;
        const val=intervals[key]??task.defaultInterval;
        return (
          <div key={task.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.white,border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:8 }}>
            <span style={{ fontSize:20 }}>{task.icon}</span>
            <span style={{ flex:1,color:C.text,fontSize:14,fontWeight:700 }}>{task.label}</span>
            <button onClick={()=>setIntervals(p=>({...p,[key]:Math.max(1,val-1)}))} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>−</button>
            <span style={{ color:task.color,fontWeight:800,minWidth:28,textAlign:"center",fontSize:16 }}>{val}</span>
            <button onClick={()=>setIntervals(p=>({...p,[key]:val+1}))} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>+</button>
            <span style={{ color:C.sub,fontSize:12 }}>日</span>
          </div>
        );
      })}

      <SectionLabel>カスタムケアを追加</SectionLabel>
      <Card style={{ marginBottom:8 }}>
        <InputF placeholder="ケア名（例：グリーンウォーター補充）" value={newTaskLabel} onChange={e=>setNewTaskLabel(e.target.value)}/>
        <div style={{ display:"flex",alignItems:"center",gap:8,margin:"10px 0" }}>
          <span style={{ color:C.sub,fontSize:13 }}>周期:</span>
          <button onClick={()=>setNewTaskInterval(p=>Math.max(1,p-1))} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>−</button>
          <span style={{ color:C.text,fontWeight:800,minWidth:24,textAlign:"center" }}>{newTaskInterval}</span>
          <button onClick={()=>setNewTaskInterval(p=>p+1)} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>+</button>
          <span style={{ color:C.sub,fontSize:13 }}>日ごと</span>
        </div>
        <Btn color={C.water} onClick={()=>{
          if(!newTaskLabel.trim()) return;
          const nt={ id:`custom_${Date.now()}`,label:newTaskLabel.trim(),icon:"⭐",defaultInterval:newTaskInterval,color:C.pink };
          setCustomTasks(prev=>[...prev,nt]); setNewTaskLabel(""); setNewTaskInterval(7);
          showToast(`⭐ ${nt.label}を追加しました`);
        }}>追加する</Btn>
      </Card>
      {customTasks.map(task=>(
        <div key={task.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.white,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:6 }}>
          <span style={{ fontSize:18 }}>{task.icon}</span>
          <span style={{ flex:1,color:C.text,fontSize:14,fontWeight:600 }}>{task.label}</span>
          <span style={{ color:C.sub,fontSize:12 }}>{task.defaultInterval}日</span>
          <button onClick={()=>setCustomTasks(prev=>prev.filter(t=>t.id!==task.id))} style={{ background:"#FEE2E2",border:"none",borderRadius:8,color:C.danger,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700 }}>削除</button>
        </div>
      ))}

      <SectionLabel>水槽の管理</SectionLabel>
      <Card style={{ marginBottom:8 }}>
        <div style={{ marginBottom:10 }}>
          <InputF placeholder="水槽名（例：屋外ビオトープ）" value={newTankName} onChange={e=>setNewTankName(e.target.value)}/>
        </div>
        <InputF placeholder="メモ（品種・匹数など）" value={newTankNotes} onChange={e=>setNewTankNotes(e.target.value)}/>
        <div style={{ marginTop:12 }}>
          <Btn color={C.green} onClick={()=>{
            if(!newTankName.trim()) return;
            const nt={ id:genId(),name:newTankName.trim(),notes:newTankNotes.trim(),tasks:{} };
            setTanks(prev=>[...prev,nt]); setSelectedTank(tanks.length);
            setNewTankName(""); setNewTankNotes(""); setView("home"); showToast("🪣 水槽を追加しました");
          }}>水槽を追加</Btn>
        </div>
      </Card>
      {tanks.map((t,i)=>(
        <TankEditRow key={t.id}
          tank={t} isSelected={i===selectedTank} canDelete={tanks.length>1}
          onSave={(name,notes)=>{ setTanks(p=>p.map((x,j)=>j===i?{...x,name,notes}:x)); showToast("✅ 水槽名を変更しました"); }}
          onDelete={()=>{ setTanks(p=>p.filter((_,j)=>j!==i)); setSelectedTank(0); }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ➕ 水槽追加モーダル（ホーム用インライン）
═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   メインアプリ
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [tanks,setTanks]               = useState(()=>lGet("med_tanks",[{ id:"tank1",name:"メイン水槽",notes:"楊貴妃 × 5匹",tasks:{} }]));
  const [selectedTank,setSelectedTank] = useState(0);
  const [view,setView]                 = useState("home");
  const [customTasks,setCustomTasks]   = useState(()=>lGet("med_ctasks",[]));
  const [intervals,setIntervals]       = useState(()=>lGet("med_intervals",{}));
  const [selectedDay,setSelectedDay]   = useState(toDateStr());
  // 記録画面専用の水槽選択（ヘッダータブとは独立）
  const [logTankIdx,setLogTankIdx]     = useState(0);
  const [toast,setToast]               = useState(null);
  const [showAddTank,setShowAddTank]   = useState(false);
  const [diaryEntries,setDiaryEntries] = useState(()=>lGet("med_diary",[]));
  const [fishRecords,setFishRecords]   = useState(()=>lGet("med_fish",[]));
  const [myProfile,setMyProfile]       = useState(()=>lGet("med_profile",null));
  const [friends,setFriends]           = useState(()=>lGet("med_friends",[]));

  const allTasks = [...DEFAULT_TASKS,...customTasks];
  const tank     = tanks[selectedTank]||tanks[0];
  const logTank  = tanks[logTankIdx]||tanks[0];
  // 日付変更を自動検知して更新
  const [todayStr, setTodayStr] = useState(toDateStr);
  useEffect(()=>{
    const schedule = () => {
      const now = new Date();
      const msToMidnight = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime();
      return setTimeout(()=>{ setTodayStr(toDateStr()); schedule(); }, msToMidnight+500);
    };
    const t = schedule();
    return ()=>clearTimeout(t);
  },[]);

  useEffect(()=>lSet("med_tanks",tanks),[tanks]);
  useEffect(()=>lSet("med_ctasks",customTasks),[customTasks]);
  useEffect(()=>lSet("med_intervals",intervals),[intervals]);
  useEffect(()=>lSet("med_diary",diaryEntries),[diaryEntries]);
  useEffect(()=>lSet("med_fish",fishRecords),[fishRecords]);
  useEffect(()=>lSet("med_profile",myProfile),[myProfile]);
  useEffect(()=>lSet("med_friends",friends),[friends]);
  useEffect(()=>{
    if(!myProfile) return;
    const pub={ id:myProfile.id,name:myProfile.name,bio:myProfile.bio,avatar:myProfile.avatar,
      diary:diaryEntries.filter(e=>e.public),fish:fishRecords };
    sSet(`medaka_user_${myProfile.id}`,pub);
  },[myProfile,diaryEntries,fishRecords]);

  const showToast   = msg => { setToast(msg); setTimeout(()=>setToast(null),2200); };
  const getInterval = (taskId,def) => intervals[`${tank?.id}_${taskId}`]??def;

  const doTask = useCallback((taskId)=>{
    const now=new Date().toISOString();
    setTanks(prev=>prev.map((t,i)=>{
      if(i!==selectedTank) return t;
      const old=t.tasks[taskId]?.history||[];
      return{ ...t,tasks:{ ...t.tasks,[taskId]:{ history:[now,...old].slice(0,300) } } };
    }));
    showToast(`✅ ${allTasks.find(t=>t.id===taskId)?.label}を記録しました`);
  },[selectedTank,allTasks]);

  const deleteRecord = useCallback((taskId,iso)=>{
    setTanks(prev=>prev.map((t,i)=>{
      if(i!==logTankIdx) return t;
      const history=(t.tasks[taskId]?.history||[]).filter(s=>s!==iso);
      return{ ...t,tasks:{ ...t.tasks,[taskId]:{ history } } };
    }));
    showToast("🗑 記録を削除しました");
  },[logTankIdx]);

  const addTank = (name,notes) => {
    const nt={ id:genId(),name,notes,tasks:{} };
    setTanks(prev=>[...prev,nt]);
    setSelectedTank(tanks.length);
    setShowAddTank(false);
    showToast(`🪣 ${name} を追加しました`);
  };

  const todayCount  = taskId => (tank?.tasks[taskId]?.history||[]).filter(iso=>toDateStr(new Date(iso))===todayStr).length;
  const lastDone    = taskId => { const h=tank?.tasks[taskId]?.history||[]; return h.length?h[0]:null; };
  const urgentCount = allTasks.filter(t=>getStatus(daysSince(tank?.tasks[t.id]?.history||[]),getInterval(t.id,t.defaultInterval))==="urgent").length;
  const season = getSeason();
  const tip    = SEASON_TIPS[season];

  /* ── HomeView */
  const HomeView = () => (
    <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
      <div style={{ margin:"0 16px 14px",padding:"12px 16px",background:tip.bg,borderRadius:16,borderLeft:`4px solid ${tip.border}`,fontSize:13,color:C.text,lineHeight:1.65 }}>
        <span style={{ fontWeight:800 }}>{tip.label}</span><br/>{tip.tip}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:7,padding:"0 16px" }}>
        {allTasks.map(task=>{
          const history=tank?.tasks[task.id]?.history||[];
          const days=daysSince(history);
          const interval=getInterval(task.id,task.defaultInterval);
          const status=getStatus(days,interval);
          const daysLeft=interval-days;
          const pct=Math.min(100,days===Infinity?100:(days/interval)*100);
          const cnt=todayCount(task.id);
          const last=lastDone(task.id);
          const sc=status==="urgent"?C.danger:status==="warn"?C.warn:C.green;
          const sbg=status==="urgent"?"#FFF5F5":status==="warn"?"#FFFBEB":"#F0FDF8";
          const sborder=status==="urgent"?"#FECACA":status==="warn"?"#FDE68A":"#BBF7D0";
          return (
            <div key={task.id} style={{ background:sbg,border:`1.5px solid ${sborder}`,borderRadius:14,padding:"7px",position:"relative",overflow:"hidden",boxShadow:status==="urgent"?`0 2px 10px ${C.danger}22`:"0 1px 6px rgba(90,175,214,0.09)" }}>
              <div style={{ position:"absolute",top:0,left:0,height:3,width:`${pct}%`,background:`linear-gradient(to right,${task.color},${sc})`,borderRadius:"14px 0 0 0",transition:"width 0.6s ease" }}/>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {/* アイコン */}
                <div style={{ width:48,height:48,borderRadius:12,background:`${task.color}18`,border:`2px solid ${task.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,position:"relative" }}>
                  {task.icon}
                  {cnt>0&&<div style={{ position:"absolute",top:-5,right:-5,width:17,height:17,background:task.color,borderRadius:"50%",border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"white" }}>{cnt}</div>}
                </div>
                {/* テキスト */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:2 }}>
                    <span style={{ fontWeight:800,fontSize:15,color:C.text }}>{task.label}</span>
                  </div>
                  <div style={{ fontSize:11,color:C.sub }}>前回: {last?`${new Date(last).getMonth()+1}/${new Date(last).getDate()} ${formatTime(last)}`:"未実施"}</div>
                  {cnt>0&&<div style={{ fontSize:10,color:task.color,fontWeight:700,marginTop:1 }}>🐟 本日 {cnt}回実施済み</div>}
                </div>
                {/* 残り日数バッジ（右側に大きく表示） */}
                <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  width:64,height:56,borderRadius:12,
                  background:status==="urgent"?C.danger:status==="warn"?C.warn:C.green,
                  boxShadow:`0 3px 10px ${sc}55`,
                  marginRight:4
                }}>
                  {days===Infinity?(
                    <>
                      <span style={{ fontSize:9,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>未実施</span>
                      <span style={{ fontSize:18,color:"white",fontWeight:900,lineHeight:1.2 }}>!</span>
                    </>
                  ):daysLeft<=0?(
                    <>
                      <span style={{ fontSize:18,color:"white",fontWeight:900,lineHeight:1.1 }}>{Math.abs(daysLeft)}</span>
                      <span style={{ fontSize:9,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>日超過</span>
                    </>
                  ):(
                    <>
                      <span style={{ fontSize:9,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>あと</span>
                      <span style={{ fontSize:daysLeft>=10?20:24,color:"white",fontWeight:900,lineHeight:1.1 }}>{daysLeft}</span>
                      <span style={{ fontSize:9,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>日</span>
                    </>
                  )}
                </div>
                {/* 実施ボタン */}
                <button onClick={()=>doTask(task.id)}
                  style={{ width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${task.color},${task.color}CC)`,border:"none",color:"white",fontSize:18,cursor:"pointer",flexShrink:0,boxShadow:`0 3px 10px ${task.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}
                  onTouchStart={e=>e.currentTarget.style.transform="scale(0.90)"}
                  onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>✓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── LogView（記録画面内に水槽タブ内包） */
  const LogView = () => {
    const dayLogs=[];
    allTasks.forEach(task=>{
      (logTank?.tasks[task.id]?.history||[]).filter(iso=>toDateStr(new Date(iso))===selectedDay)
        .forEach(iso=>dayLogs.push({ iso,task }));
    });
    dayLogs.sort((a,b)=>new Date(b.iso)-new Date(a.iso));
    const selDate=new Date(selectedDay+"T00:00:00");
    const selLabel=`${selDate.getMonth()+1}月${selDate.getDate()}日`;
    return (
      <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
        {/* カレンダー */}
        <CalendarView tank={logTank} allTasks={allTasks}
          diaryEntries={diaryEntries.filter(e=>e.tankId===logTank.id)}
          medakaRecords={fishRecords.filter(r=>!r.tankId||r.tankId===logTank.id)}
          onDaySelect={setSelectedDay} selectedDay={selectedDay}/>

        {/* ★ 記録画面内の水槽タブ */}
        {tanks.length>1&&(
          <div style={{ padding:"0 16px 12px" }}>
            <div style={{ display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2 }}>
              {tanks.map((t,i)=>(
                <button key={t.id} onClick={()=>setLogTankIdx(i)}
                  style={{ padding:"6px 14px",borderRadius:20,border:`1.5px solid ${i===logTankIdx?C.water:C.border}`,
                    background:i===logTankIdx?C.water:C.white,
                    color:i===logTankIdx?"white":C.sub,
                    fontWeight:i===logTankIdx?800:500, fontSize:12,
                    cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.2s" }}>
                  🪣 {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
            <span style={{ fontWeight:800,fontSize:15,color:C.text }}>📋 {selLabel}のケア記録</span>
            {selectedDay===todayStr&&<span style={{ fontSize:11,fontWeight:700,color:C.water,background:C.sky,padding:"2px 10px",borderRadius:20 }}>今日</span>}
          </div>
          {dayLogs.length===0
            ?<div style={{ textAlign:"center",padding:"28px 0",color:C.sub }}><div style={{ fontSize:36,marginBottom:8 }}>🐠</div><div>この日のケア記録はありません</div></div>
            :<>
                <div style={{ fontSize:12,color:C.sub,marginBottom:8 }}>← 左にスワイプで削除</div>
                {dayLogs.map((log,i)=>(
                  <SwipeRow key={`${log.task.id}-${log.iso}-${i}`} onDelete={()=>deleteRecord(log.task.id,log.iso)}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.white,border:`1.5px solid ${C.border}`,borderRadius:14 }}>
                      <div style={{ width:38,height:38,borderRadius:11,background:`${log.task.color}18`,border:`1.5px solid ${log.task.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0 }}>{log.task.icon}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:700,color:C.text,fontSize:14 }}>{log.task.label}</div><div style={{ fontSize:12,color:C.sub }}>{formatTime(log.iso)}</div></div>
                      <span style={{ fontSize:12,color:C.sub }}>← スワイプ</span>
                    </div>
                  </SwipeRow>
                ))}
              </>}
        </div>
      </div>
    );
  };

  const NAV = [
    { id:"home",    icon:"🏠", label:"ホーム"   },
    { id:"log",     icon:"📅", label:"記録"     },
    { id:"diary",   icon:"📝", label:"日誌"     },
    { id:"fish",    icon:"🐠", label:"台帳"     },
    { id:"friends", icon:"👥", label:"フレンド" },
  ];

  return (
    <div style={{ minHeight:"100vh",background:C.sky,fontFamily:"'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif",color:C.text,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.82}}
        ::-webkit-scrollbar{display:none;}
        input::placeholder,textarea::placeholder{color:#9FBFCF;}
        input[type="date"]{color-scheme:light;}
        button:active{opacity:0.85;}
      `}</style>

      {/* ヘッダー */}
      <div style={{ background:`linear-gradient(160deg,${C.waterD} 0%,${C.water} 60%,${C.skyMid} 100%)`,paddingTop:48,paddingBottom:0,position:"sticky",top:0,zIndex:20 }}>
        <div style={{ padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.75)",letterSpacing:"0.14em",fontWeight:700 }}>MEDAKA CARE</div>
            <h1 style={{ margin:"2px 0 0",fontSize:21,fontWeight:800,color:"white",textShadow:"0 1px 8px rgba(0,60,100,0.25)" }}>🐟 メダカ管理帳</h1>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {urgentCount>0&&<div style={{ background:"white",borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:800,color:C.danger,boxShadow:"0 4px 14px rgba(0,0,0,0.15)",animation:"shimmer 1.8s infinite" }}>⚠️{urgentCount}</div>}
            <button onClick={()=>setView("settings")} style={{ background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:10,color:"white",padding:"6px 10px",fontSize:16,cursor:"pointer" }}>⚙️</button>
          </div>
        </div>

        {/* ホーム画面の水槽タブ（pill型 ＋ ＋ボタン） */}
        {view==="home"&&(
          <div style={{ display:"flex",gap:6,overflowX:"auto",padding:"0 16px 12px",scrollbarWidth:"none",alignItems:"center" }}>
            {tanks.map((t,i)=>(
              <button key={t.id} onClick={()=>setSelectedTank(i)}
                style={{ padding:"7px 16px", borderRadius:20,
                  background:i===selectedTank?"white":"rgba(255,255,255,0.22)",
                  border:"none",
                  color:i===selectedTank?C.waterD:"white",
                  fontWeight:i===selectedTank?800:500,
                  fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                  boxShadow:i===selectedTank?"0 2px 8px rgba(0,0,0,0.15)":"none",
                  transition:"all 0.2s" }}>
                🪣 {t.name}
              </button>
            ))}
            {/* ＋ボタン */}
            <button onClick={()=>setShowAddTank(true)}
              style={{ width:30,height:30,borderRadius:"50%",
                background:"rgba(255,255,255,0.25)",
                border:"1.5px solid rgba(255,255,255,0.5)",
                color:"white", fontSize:18, fontWeight:700,
                cursor:"pointer", flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all 0.2s" }}>＋</button>
          </div>
        )}

        {/* 日誌タブ（水槽切り替え） */}
        {view==="diary"&&(
          <div style={{ display:"flex",gap:6,overflowX:"auto",padding:"0 16px 12px",scrollbarWidth:"none" }}>
            {tanks.map((t,i)=>(
              <button key={t.id} onClick={()=>setSelectedTank(i)}
                style={{ padding:"6px 14px",background:i===selectedTank?"white":"rgba(255,255,255,0.22)",border:"none",borderRadius:20,color:i===selectedTank?C.waterD:"white",fontWeight:i===selectedTank?800:500,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.2s" }}>
                🪣 {t.name}
              </button>
            ))}
          </div>
        )}

        <WaveDivider color={C.sky}/>
      </div>

      {view==="settings"&&(
        <div style={{ padding:"10px 16px 0",display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={()=>setView("home")} style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.water,padding:"6px 14px",fontSize:13,cursor:"pointer",fontWeight:700 }}>← ホーム</button>
          <span style={{ color:C.sub,fontSize:14,fontWeight:600 }}>⚙️ 設定</span>
        </div>
      )}

      <div style={{ flex:1,display:"flex",flexDirection:"column",paddingTop:10 }}>
        {view==="home"     && <HomeView/>}
        {view==="log"      && <LogView/>}
        {view==="diary"    && <DiaryView tank={tank} tanks={tanks} diaryEntries={diaryEntries} setDiaryEntries={setDiaryEntries} showToast={showToast} todayStr={todayStr}/>}
        {view==="fish"     && <FishView  fishRecords={fishRecords} setFishRecords={setFishRecords} showToast={showToast} todayStr={todayStr} tanks={tanks}/>}
        {view==="friends"  && <FriendsView myProfile={myProfile} setMyProfile={setMyProfile} friends={friends} setFriends={setFriends} diaryEntries={diaryEntries} fishRecords={fishRecords} showToast={showToast}/>}
        {view==="settings" && <SettingsView tanks={tanks} setTanks={setTanks} selectedTank={selectedTank} setSelectedTank={setSelectedTank} setView={setView} customTasks={customTasks} setCustomTasks={setCustomTasks} intervals={intervals} setIntervals={setIntervals} allTasks={allTasks} tank={tank} showToast={showToast}/>}
      </div>

      {/* ボトムナビ */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderTop:`1.5px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"7px 0 20px",zIndex:30,boxShadow:"0 -2px 20px rgba(90,175,214,0.12)" }}>
        {NAV.map(nav=>(
          <button key={nav.id} onClick={()=>setView(nav.id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 6px",color:view===nav.id?C.water:C.sub,minWidth:0 }}>
            <span style={{ fontSize:20 }}>{nav.icon}</span>
            <span style={{ fontSize:9,fontWeight:view===nav.id?800:500,whiteSpace:"nowrap" }}>{nav.label}</span>
            {view===nav.id&&<div style={{ width:16,height:3,background:C.water,borderRadius:2 }}/>}
          </button>
        ))}
      </div>

      {/* 水槽追加モーダル */}
      {showAddTank&&<AddTankModal onClose={()=>setShowAddTank(false)} onAdd={addTank}/>}

      {toast&&<div style={{ position:"fixed",bottom:85,left:"50%",transform:"translateX(-50%)",background:C.text,borderRadius:24,padding:"10px 22px",color:"white",fontSize:14,fontWeight:700,zIndex:200,whiteSpace:"nowrap",animation:"toastIn 0.25s ease",boxShadow:"0 8px 24px rgba(26,58,74,0.28)" }}>{toast}</div>}
    </div>
  );
}
