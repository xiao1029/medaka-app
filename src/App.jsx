import { useState, useEffect, useCallback } from "react";
import { C, DEFAULT_TASKS, SEASON_TIPS } from "./constants";
import { getSeason, toDateStr, formatTime, daysSince, getStatus, genId } from "./utils";
import { lGet, lSet, sSet } from "./storage";
import { WaveDivider, SwipeRow } from "./components/ui/CommonUI";
import CalendarView  from "./components/CalendarView";
import DiaryView     from "./components/DiaryView";
import FishView      from "./components/FishView";
import FriendsView   from "./components/FriendsView";
import SettingsView  from "./components/SettingsView";
import AddTankModal  from "./components/AddTankModal";

export default function App() {
  const [tanks,setTanks]               = useState(()=>lGet("med_tanks",[{ id:"tank1",name:"メイン水槽",notes:"楊貴妃 × 5匹",tasks:{} }]));
  const [selectedTank,setSelectedTank] = useState(0);
  const [view,setView]                 = useState("home");
  const [customTasks,setCustomTasks]   = useState(()=>lGet("med_ctasks",[]));
  const [intervals,setIntervals]       = useState(()=>lGet("med_intervals",{}));
  const [selectedDay,setSelectedDay]   = useState(toDateStr());
  const [logTankIdx,setLogTankIdx]     = useState(0);
  const [toast,setToast]               = useState(null);
  const [showAddTank,setShowAddTank]   = useState(false);
  const [diaryEntries,setDiaryEntries] = useState(()=>lGet("med_diary",[]));
  const [fishRecords,setFishRecords]   = useState(()=>lGet("med_fish",[]));
  const [myProfile,setMyProfile]       = useState(()=>lGet("med_profile",null));
  const [friends,setFriends]           = useState(()=>lGet("med_friends",[]));
  const [taskOrder,setTaskOrder]       = useState(()=>lGet("med_task_order",[]));
  const [iconOverrides,setIconOverrides] = useState(()=>lGet("med_icon_overrides",{}));
  const [hiddenTasks,setHiddenTasks]   = useState(()=>lGet("med_hidden_tasks",[]));

  const allTasks = [...DEFAULT_TASKS,...customTasks];
  const orderedAllTasks = (taskOrder.length > 0
    ? [
        ...taskOrder.map(id => allTasks.find(t => t.id === id)).filter(Boolean),
        ...allTasks.filter(t => !taskOrder.includes(t.id))
      ]
    : allTasks
  ).filter(t => !hiddenTasks.includes(t.id));

  const tank    = tanks[selectedTank]||tanks[0];
  const logTank = tanks[logTankIdx]||tanks[0];

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
  useEffect(()=>lSet("med_task_order",taskOrder),[taskOrder]);
  useEffect(()=>lSet("med_icon_overrides",iconOverrides),[iconOverrides]);
  useEffect(()=>lSet("med_hidden_tasks",hiddenTasks),[hiddenTasks]);
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
  const urgentCount = orderedAllTasks.filter(t=>getStatus(daysSince(tank?.tasks[t.id]?.history||[]),getInterval(t.id,t.defaultInterval))==="urgent").length;
  const season = getSeason();
  const tip    = SEASON_TIPS[season];

  /* ── HomeView */
  const HomeView = () => (
    <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
      <div style={{ margin:"0 16px 14px",padding:"12px 16px",background:tip.bg,borderRadius:16,borderLeft:`4px solid ${tip.border}`,fontSize:13,color:C.text,lineHeight:1.65 }}>
        <span style={{ fontWeight:800 }}>{tip.label}</span><br/>{tip.tip}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:7,padding:"0 16px" }}>
        {orderedAllTasks.map(task=>{
          const history=tank?.tasks[task.id]?.history||[];
          const days=daysSince(history);
          const isNeverDone=days===Infinity;
          const interval=getInterval(task.id,task.defaultInterval);
          const status=getStatus(days,interval);
          const daysLeft=interval-days;
          const pct=Math.min(100,isNeverDone?100:(days/interval)*100);
          const cnt=todayCount(task.id);
          const last=lastDone(task.id);
          const sc=status==="urgent"?C.danger:status==="warn"?C.warn:C.green;
          const sbg    =isNeverDone?"#F4F4F2":status==="urgent"?"#FFF5F5":status==="warn"?"#FFFBEB":"#F0FDF8";
          const sborder=isNeverDone?"#DDDDD8":status==="urgent"?"#FECACA":status==="warn"?"#FDE68A":"#BBF7D0";
          const iconBg    =isNeverDone?"#E8E8E4":`${task.color}18`;
          const iconBorder=isNeverDone?"#CFCFCA":`${task.color}44`;
          const badgeBg   =isNeverDone?"#AAAAAA":sc;
          return (
            <div key={task.id} style={{ background:sbg,border:`1.5px solid ${sborder}`,borderRadius:14,padding:"7px",position:"relative",overflow:"hidden",
              boxShadow:isNeverDone?"none":status==="urgent"?`0 2px 10px ${C.danger}22`:"0 1px 6px rgba(90,175,214,0.09)",opacity:isNeverDone?0.75:1 }}>
              <div style={{ position:"absolute",top:0,left:0,height:3,width:`${pct}%`,
                background:isNeverDone?"#CFCFCA":`linear-gradient(to right,${task.color},${sc})`,borderRadius:"14px 0 0 0",transition:"width 0.6s ease" }}/>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:48,height:48,borderRadius:12,background:iconBg,border:`2px solid ${iconBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,position:"relative",filter:isNeverDone?"grayscale(60%)":"none" }}>
                  {iconOverrides[task.id]||task.icon}
                  {cnt>0&&<div style={{ position:"absolute",top:-5,right:-5,width:17,height:17,background:task.color,borderRadius:"50%",border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"white" }}>{cnt}</div>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:2 }}>
                    <span style={{ fontWeight:800,fontSize:15,color:isNeverDone?"#888":C.text }}>{task.label}</span>
                    {isNeverDone&&<span style={{ fontSize:10,fontWeight:700,color:"white",background:"#AAAAAA",padding:"1px 7px",borderRadius:20 }}>まだ未実施</span>}
                  </div>
                  <div style={{ fontSize:11,color:isNeverDone?"#AAAAAA":C.sub }}>
                    {isNeverDone?"はじめての記録をつけましょう！":`前回: ${new Date(last).getMonth()+1}/${new Date(last).getDate()} ${formatTime(last)}`}
                  </div>
                  {cnt>0&&<div style={{ fontSize:10,color:task.color,fontWeight:700,marginTop:1 }}>🐟 本日 {cnt}回実施済み</div>}
                </div>
                <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:40,height:40,borderRadius:12,background:badgeBg,boxShadow:isNeverDone?"none":`0 3px 10px ${sc}55`,marginRight:4 }}>
                  {days===Infinity?(
                    <><span style={{ fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>未実施</span><span style={{ fontSize:16,color:"white",fontWeight:900,lineHeight:1.2 }}>!</span></>
                  ):daysLeft<=0?(
                    <><span style={{ fontSize:16,color:"white",fontWeight:900,lineHeight:1.1 }}>{Math.abs(daysLeft)}</span><span style={{ fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>日超過</span></>
                  ):(
                    <><span style={{ fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>あと</span><span style={{ fontSize:daysLeft>=10?16:18,color:"white",fontWeight:900,lineHeight:1.1 }}>{daysLeft}</span><span style={{ fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,lineHeight:1 }}>日</span></>
                  )}
                </div>
                <button onClick={()=>doTask(task.id)}
                  style={{ width:40,height:40,borderRadius:12,background:isNeverDone?"linear-gradient(135deg,#AAAAAA,#999999)":`linear-gradient(135deg,${task.color},${task.color}CC)`,border:"none",color:"white",fontSize:18,cursor:"pointer",flexShrink:0,boxShadow:isNeverDone?"none":`0 3px 10px ${task.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}
                  onTouchStart={e=>e.currentTarget.style.transform="scale(0.90)"}
                  onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>✓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── LogView ── 案C「＋ケアを追加」機能付き */
  const LogView = () => {
    const [addModal,setAddModal]   = useState(false);
    const [selTaskId,setSelTaskId] = useState(orderedAllTasks[0]?.id||"feed");
    const [addTime,setAddTime]     = useState("08:00");

    const dayLogs=[];
    orderedAllTasks.forEach(task=>{
      (logTank?.tasks[task.id]?.history||[]).filter(iso=>toDateStr(new Date(iso))===selectedDay)
        .forEach(iso=>dayLogs.push({ iso,task }));
    });
    dayLogs.sort((a,b)=>new Date(b.iso)-new Date(a.iso));
    const selDate=new Date(selectedDay+"T00:00:00");
    const selLabel=`${selDate.getMonth()+1}月${selDate.getDate()}日`;

    const addPastRecord = () => {
      const [h,m]=addTime.split(":").map(Number);
      const dt=new Date(selectedDay+"T00:00:00");
      dt.setHours(h,m,0,0);
      const iso=dt.toISOString();
      setTanks(prev=>prev.map((t,i)=>{
        if(i!==logTankIdx) return t;
        const old=t.tasks[selTaskId]?.history||[];
        return{ ...t,tasks:{ ...t.tasks,[selTaskId]:{ history:[...old,iso].sort((a,b)=>new Date(b)-new Date(a)).slice(0,300) } } };
      }));
      setAddModal(false);
      showToast(`📅 ${orderedAllTasks.find(t=>t.id===selTaskId)?.label}を追加しました`);
    };

    return (
      <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
        {/* カレンダー */}
        <CalendarView tank={logTank} allTasks={orderedAllTasks}
          diaryEntries={diaryEntries.filter(e=>e.tankId===logTank.id)}
          medakaRecords={fishRecords.filter(r=>!r.tankId||r.tankId===logTank.id)}
          onDaySelect={setSelectedDay} selectedDay={selectedDay}/>

        {/* 水槽タブ */}
        {tanks.length>1&&(
          <div style={{ padding:"0 16px 12px" }}>
            <div style={{ display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2 }}>
              {tanks.map((t,i)=>(
                <button key={t.id} onClick={()=>setLogTankIdx(i)}
                  style={{ padding:"6px 14px",borderRadius:20,border:`1.5px solid ${i===logTankIdx?C.water:C.border}`,
                    background:i===logTankIdx?C.water:C.white,color:i===logTankIdx?"white":C.sub,
                    fontWeight:i===logTankIdx?800:500,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.2s" }}>
                  🪣 {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:"0 16px" }}>
          {/* ヘッダー：日付ラベル＋「＋ケアを追加」ボタン */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontWeight:800,fontSize:15,color:C.text }}>📋 {selLabel}のケア記録</span>
              {selectedDay===todayStr&&<span style={{ fontSize:11,fontWeight:700,color:C.water,background:C.sky,padding:"2px 10px",borderRadius:20 }}>今日</span>}
            </div>
            <button onClick={()=>{ setSelTaskId(orderedAllTasks[0]?.id||"feed"); setAddTime("08:00"); setAddModal(true); }}
              style={{ padding:"7px 14px",background:`linear-gradient(135deg,${C.green},${C.green}CC)`,
                border:"none",borderRadius:20,color:"white",fontWeight:700,fontSize:12,
                cursor:"pointer",boxShadow:`0 2px 8px ${C.green}44`,flexShrink:0,whiteSpace:"nowrap" }}>
              ＋ ケアを追加
            </button>
          </div>

          {/* 追加モーダル */}
          {addModal&&(
            <div style={{ background:C.white,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:14,
              boxShadow:"0 4px 20px rgba(90,175,214,0.2)" }}>
              <div style={{ fontWeight:800,fontSize:14,color:C.text,marginBottom:12 }}>
                📅 {selLabel}のケアを追加
              </div>
              {/* ケア種類選択 */}
              <label style={{ fontSize:11,fontWeight:700,color:C.sub,display:"block",marginBottom:6 }}>ケアの種類</label>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                {orderedAllTasks.map(t=>(
                  <button key={t.id} onClick={()=>setSelTaskId(t.id)}
                    style={{ padding:"6px 12px",borderRadius:20,
                      border:`2px solid ${selTaskId===t.id?t.color:C.border}`,
                      background:selTaskId===t.id?`${t.color}18`:C.white,
                      color:selTaskId===t.id?t.color:C.sub,
                      fontWeight:selTaskId===t.id?800:500,
                      fontSize:12,cursor:"pointer",transition:"all 0.15s" }}>
                    {iconOverrides[t.id]||t.icon} {t.label}
                  </button>
                ))}
              </div>
              {/* 時刻入力 */}
              <label style={{ fontSize:11,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>⏰ 時刻</label>
              <input type="time" value={addTime} onChange={e=>setAddTime(e.target.value)}
                style={{ width:"100%",padding:"10px 14px",background:C.sky,border:`1.5px solid ${C.border}`,
                  borderRadius:12,fontSize:15,color:C.text,outline:"none",marginBottom:14,
                  WebkitUserSelect:"text",userSelect:"text" }}/>
              {/* ボタン */}
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>setAddModal(false)}
                  style={{ flex:1,padding:"10px",background:C.sky,border:`1.5px solid ${C.border}`,
                    borderRadius:12,color:C.sub,fontWeight:700,fontSize:13,cursor:"pointer" }}>
                  キャンセル
                </button>
                <button onClick={addPastRecord}
                  style={{ flex:2,padding:"10px",background:`linear-gradient(135deg,${C.green},${C.green}CC)`,
                    border:"none",borderRadius:12,color:"white",fontWeight:800,fontSize:13,
                    cursor:"pointer",boxShadow:`0 3px 10px ${C.green}44` }}>
                  追加する
                </button>
              </div>
            </div>
          )}

          {/* ログ一覧 */}
          {dayLogs.length===0
            ?<div style={{ textAlign:"center",padding:"28px 0",color:C.sub }}>
                <div style={{ fontSize:36,marginBottom:8 }}>🐠</div>
                <div>この日のケア記録はありません</div>
                <div style={{ fontSize:12,marginTop:4,color:C.sub }}>「＋ ケアを追加」から記録できます</div>
              </div>
            :<>
                <div style={{ fontSize:12,color:C.sub,marginBottom:8 }}>← 左にスワイプで削除</div>
                {dayLogs.map((log,i)=>(
                  <SwipeRow key={`${log.task.id}-${log.iso}-${i}`} onDelete={()=>deleteRecord(log.task.id,log.iso)}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.white,border:`1.5px solid ${C.border}`,borderRadius:14 }}>
                      <div style={{ width:38,height:38,borderRadius:11,background:`${log.task.color}18`,border:`1.5px solid ${log.task.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0 }}>
                        {iconOverrides[log.task.id]||log.task.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,color:C.text,fontSize:14 }}>{log.task.label}</div>
                        <div style={{ fontSize:12,color:C.sub }}>{formatTime(log.iso)}</div>
                      </div>
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
        *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
        input,textarea{-webkit-user-select:text!important;user-select:text!important;}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.82}}
        ::-webkit-scrollbar{display:none;}
        input::placeholder,textarea::placeholder{color:#9FBFCF;}
        input[type="date"]{color-scheme:light;}
        button:active{opacity:0.85;}
      `}</style>

      <div style={{ background:`linear-gradient(160deg,${C.waterD} 0%,${C.water} 60%,${C.skyMid} 100%)`,paddingTop:48,paddingBottom:0,position:"sticky",top:0,zIndex:20 }}>
        <div style={{ padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.75)",letterSpacing:"0.14em",fontWeight:700 }}>MEDAKA CARE</div>
            <h1 style={{ margin:"2px 0 0",fontSize:21,fontWeight:800,color:"white",textShadow:"0 1px 8px rgba(0,60,100,0.25)" }}>🐟 メダカ管理帳</h1>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {urgentCount>0&&(
              <div style={{ background:"white",borderRadius:20,padding:"5px 12px 5px 5px",display:"flex",alignItems:"center",gap:7,border:"1.5px solid rgba(224,90,74,0.3)",boxShadow:"0 3px 10px rgba(0,0,0,0.15)",animation:"shimmer 1.8s infinite" }}>
                <div style={{ background:C.danger,borderRadius:12,minWidth:24,height:24,padding:"0 6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"white" }}>{urgentCount}</div>
                <span style={{ color:C.danger,fontSize:12,fontWeight:700,whiteSpace:"nowrap" }}>件 未実施</span>
              </div>
            )}
            <button onClick={()=>setView("settings")} style={{ background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:10,color:"white",padding:"6px 10px",fontSize:16,cursor:"pointer" }}>⚙️</button>
          </div>
        </div>

        {view==="home"&&(
          <div style={{ display:"flex",gap:6,overflowX:"auto",padding:"0 16px 12px",scrollbarWidth:"none",alignItems:"center" }}>
            {tanks.map((t,i)=>(
              <button key={t.id} onClick={()=>setSelectedTank(i)}
                style={{ padding:"7px 16px",borderRadius:20,background:i===selectedTank?"white":"rgba(255,255,255,0.22)",border:"none",color:i===selectedTank?C.waterD:"white",fontWeight:i===selectedTank?800:500,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:i===selectedTank?"0 2px 8px rgba(0,0,0,0.15)":"none",transition:"all 0.2s" }}>
                🪣 {t.name}
              </button>
            ))}
            <button onClick={()=>setShowAddTank(true)}
              style={{ width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.25)",border:"1.5px solid rgba(255,255,255,0.5)",color:"white",fontSize:18,fontWeight:700,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}>＋</button>
          </div>
        )}

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
        {view==="settings" && <SettingsView tanks={tanks} setTanks={setTanks} selectedTank={selectedTank} setSelectedTank={setSelectedTank} setView={setView} customTasks={customTasks} setCustomTasks={setCustomTasks} intervals={intervals} setIntervals={setIntervals} allTasks={allTasks} tank={tank} showToast={showToast} taskOrder={taskOrder} setTaskOrder={setTaskOrder} iconOverrides={iconOverrides} setIconOverrides={setIconOverrides} hiddenTasks={hiddenTasks} setHiddenTasks={setHiddenTasks}/>}
      </div>

      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderTop:`1.5px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"7px 0 20px",zIndex:30,boxShadow:"0 -2px 20px rgba(90,175,214,0.12)" }}>
        {NAV.map(nav=>(
          <button key={nav.id} onClick={()=>setView(nav.id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 6px",color:view===nav.id?C.water:C.sub,minWidth:0 }}>
            <span style={{ fontSize:20 }}>{nav.icon}</span>
            <span style={{ fontSize:9,fontWeight:view===nav.id?800:500,whiteSpace:"nowrap" }}>{nav.label}</span>
            {view===nav.id&&<div style={{ width:16,height:3,background:C.water,borderRadius:2 }}/>}
          </button>
        ))}
      </div>

      {showAddTank&&<AddTankModal onClose={()=>setShowAddTank(false)} onAdd={addTank}/>}
      {toast&&<div style={{ position:"fixed",bottom:85,left:"50%",transform:"translateX(-50%)",background:C.text,borderRadius:24,padding:"10px 22px",color:"white",fontSize:14,fontWeight:700,zIndex:200,whiteSpace:"nowrap",animation:"toastIn 0.25s ease",boxShadow:"0 8px 24px rgba(26,58,74,0.28)" }}>{toast}</div>}
    </div>
  );
}
