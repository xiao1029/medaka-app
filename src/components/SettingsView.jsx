import { useState, useRef } from "react";
import { C, DEFAULT_TASKS } from "../constants";
import { genId } from "../utils";
import { Card, Btn, InputF, SectionLabel } from "./ui/CommonUI";

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
  customTasks, setCustomTasks, intervals, setIntervals, allTasks, tank, showToast,
  taskOrder, setTaskOrder, iconOverrides, setIconOverrides, hiddenTasks, setHiddenTasks }) {

  const [newTaskLabel,    setNewTaskLabel]    = useState("");
  const [newTaskInterval, setNewTaskInterval] = useState("");
  const [newTankName,     setNewTankName]     = useState("");
  const [newTankNotes,    setNewTankNotes]    = useState("");
  const [pickerTaskId,    setPickerTaskId]    = useState(null); // ピッカー表示中のtaskId
  const [emojiInput,      setEmojiInput]      = useState("");   // 直接入力用

  // よく使う絵文字候補
  const EMOJI_PRESETS = [
    "🐟","🐠","🐡","🦈","🐙","🦑","🦐","🦞","🐚","🪸",
    "💧","🌊","🪣","🫧","❄️","🌡️","🔬","🧪","💊","💉",
    "🌿","🌱","🍃","🌾","🌸","🌺","🍀","🌻","🌈","☀️",
    "⭐","✨","🔥","💫","🎯","🏷️","📋","📝","🗓️","⏰",
  ];

  // ── フローティングDnD state ──
  const [draggingIdx,  setDraggingIdx]  = useState(null);
  const [floatPos,     setFloatPos]     = useState({ x:0, y:0 });
  const [overIdx,      setOverIdx]      = useState(null);

  const orderedTasks = (taskOrder.length > 0
    ? [
        ...taskOrder.map(id => allTasks.find(t => t.id === id)).filter(Boolean),
        ...allTasks.filter(t => !taskOrder.includes(t.id))
      ]
    : allTasks
  ).filter(t => !hiddenTasks.includes(t.id));

  const getIcon = (task) => iconOverrides[task.id] || task.icon;

  // refs
  const longPressTimer = useRef(null);
  const rowRefs        = useRef([]);
  const dragStartY     = useRef(0);
  const dragStartX     = useRef(0);

  // PCドラッグ（draggable API）
  const onDragStart = (i, e) => {
    setDraggingIdx(i);
    setOverIdx(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnterRow = (i) => setOverIdx(i);
  const onDragEnd = (i) => {
    if(overIdx !== null && overIdx !== i) {
      const newOrder = [...orderedTasks.map(t=>t.id)];
      const [moved] = newOrder.splice(i, 1);
      newOrder.splice(overIdx, 0, moved);
      setTaskOrder(newOrder);
    }
    setDraggingIdx(null); setOverIdx(null);
  };

  // iPhoneタッチDnD
  const onHandleTouchStart = (i, e) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      setDraggingIdx(i);
      setOverIdx(i);
      setFloatPos({ x: dragStartX.current, y: dragStartY.current });
    }, 450);
  };

  const onHandleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - dragStartX.current);
    const dy = Math.abs(e.touches[0].clientY - dragStartY.current);
    // 長押し前に大きく動いたらキャンセル
    if(draggingIdx === null && (dx > 8 || dy > 8)) {
      clearTimeout(longPressTimer.current);
      return;
    }
    if(draggingIdx === null) return;
    e.preventDefault();
    const cx = e.touches[0].clientX;
    const cy = e.touches[0].clientY;
    setFloatPos({ x: cx, y: cy });
    // どの行の上にいるか判定
    rowRefs.current.forEach((ref, i) => {
      if(!ref) return;
      const rect = ref.getBoundingClientRect();
      if(cy >= rect.top && cy <= rect.bottom) setOverIdx(i);
    });
  };

  const onHandleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if(draggingIdx !== null && overIdx !== null && overIdx !== draggingIdx) {
      const newOrder = [...orderedTasks.map(t=>t.id)];
      const [moved] = newOrder.splice(draggingIdx, 1);
      newOrder.splice(overIdx, 0, moved);
      setTaskOrder(newOrder);
    }
    setDraggingIdx(null); setOverIdx(null);
  };

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"0 16px 90px" }}>

      {/* アイコンピッカーモーダル */}
      {pickerTaskId && (
        <div style={{ position:"fixed",inset:0,background:"rgba(26,58,74,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}
          onClick={e=>{ if(e.target===e.currentTarget) setPickerTaskId(null); }}>
          <div style={{ background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",width:"100%",maxWidth:430 }}>
            <div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 16px" }}/>
            <div style={{ fontWeight:800,fontSize:15,color:C.text,marginBottom:12 }}>
              アイコンを選択
            </div>
            {/* 絵文字候補グリッド */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6,marginBottom:14 }}>
              {EMOJI_PRESETS.map(e=>(
                <button key={e} onClick={()=>{
                  setIconOverrides(p=>({...p,[pickerTaskId]:e}));
                  setPickerTaskId(null);
                  showToast(`アイコンを ${e} に変更しました`);
                }} style={{ aspectRatio:"1",fontSize:22,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{e}</button>
              ))}
            </div>
            {/* 直接入力 */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,fontWeight:700,color:C.sub,display:"block",marginBottom:4 }}>絵文字を直接入力</label>
              <div style={{ display:"flex",gap:8 }}>
                <input value={emojiInput} onChange={e=>setEmojiInput(e.target.value)} placeholder="例: 🌊"
                  style={{ flex:1,padding:"10px 14px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:20,outline:"none",textAlign:"center" }}/>
                <button onClick={()=>{
                  if(!emojiInput.trim()) return;
                  setIconOverrides(p=>({...p,[pickerTaskId]:emojiInput.trim()}));
                  setEmojiInput(""); setPickerTaskId(null);
                  showToast(`アイコンを ${emojiInput.trim()} に変更しました`);
                }} style={{ padding:"10px 18px",background:`linear-gradient(135deg,${C.water},${C.waterD})`,border:"none",borderRadius:12,color:"white",fontWeight:800,fontSize:14,cursor:"pointer" }}>決定</button>
              </div>
            </div>
            <button onClick={()=>setPickerTaskId(null)}
              style={{ width:"100%",padding:"10px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.sub,fontWeight:700,fontSize:14,cursor:"pointer" }}>キャンセル</button>
          </div>
        </div>
      )}

      <SectionLabel mt={8}>ケア周期の設定</SectionLabel>
      <div style={{ fontSize:11,color:C.sub,marginBottom:8,paddingLeft:2 }}>アイコンをタップで変更 / ≡ を長押しでドラッグ並び替え</div>

      {/* フローティング要素（ドラッグ中に指に追従） */}
      {draggingIdx !== null && (
        <div style={{
          position:"fixed",
          left: floatPos.x - 180,
          top:  floatPos.y - 30,
          width: 360,
          zIndex:999,
          pointerEvents:"none",
          background: C.sky,
          border:`2px solid ${C.water}`,
          borderRadius:14,
          padding:"12px 16px",
          boxShadow:"0 20px 50px rgba(90,175,214,0.45), 0 6px 16px rgba(26,58,74,0.2)",
          transform:"scale(1.05) rotate(-1deg)",
          display:"flex", alignItems:"center", gap:12,
        }}>
          <span style={{ fontSize:20,color:C.water,fontWeight:900 }}>≡</span>
          <div style={{ width:36,height:36,borderRadius:10,background:`${orderedTasks[draggingIdx]?.color||C.water}18`,border:`1.5px solid ${orderedTasks[draggingIdx]?.color||C.water}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
            {getIcon(orderedTasks[draggingIdx])}
          </div>
          <span style={{ flex:1,color:C.text,fontSize:14,fontWeight:800 }}>{orderedTasks[draggingIdx]?.label}</span>
          <span style={{ fontSize:16,color:orderedTasks[draggingIdx]?.color||C.water,fontWeight:800 }}>
            {intervals[`${tank?.id}_${orderedTasks[draggingIdx]?.id}`] ?? orderedTasks[draggingIdx]?.defaultInterval}日
          </span>
        </div>
      )}

      {orderedTasks.map((task, i)=>{
        const key=`${tank?.id}_${task.id}`;
        const val=intervals[key]??task.defaultInterval;
        const isLifted = draggingIdx === i;
        const isTarget = overIdx === i && draggingIdx !== null && draggingIdx !== i;
        return (
          <div key={task.id} ref={el=>rowRefs.current[i]=el}
            draggable
            onDragStart={e=>onDragStart(i,e)}
            onDragEnter={()=>onDragEnterRow(i)}
            onDragEnd={()=>onDragEnd(i)}
            onDragOver={e=>e.preventDefault()}
            style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background: isLifted ? "transparent" : isTarget ? "#EBF7FF" : C.white,
              border:`1.5px solid ${isLifted?"transparent":isTarget?C.water:C.border}`,
              borderRadius:14, marginBottom:8,
              opacity: isLifted ? 0.25 : 1,
              transform: isTarget ? "translateY(-3px)" : "translateY(0)",
              boxShadow: isTarget ? `0 6px 18px rgba(90,175,214,0.25)` : "0 1px 4px rgba(90,175,214,0.07)",
              transition:"opacity 0.15s, transform 0.18s ease, box-shadow 0.18s, border-color 0.18s, background 0.15s",
              position:"relative",
              userSelect:"none", WebkitUserSelect:"none", WebkitTouchCallout:"none",
            }}>
            {/* アイコン（タップで変更） */}
            <button onClick={()=>{ setEmojiInput(""); setPickerTaskId(task.id); }}
              style={{ width:36,height:36,borderRadius:10,background:C.sky,border:`1.5px solid ${C.border}`,fontSize:20,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
              {getIcon(task)}
              <span style={{ position:"absolute",bottom:-2,right:-2,fontSize:8,background:C.water,color:"white",borderRadius:4,padding:"1px 3px",fontWeight:700 }}>✏️</span>
            </button>
            <span style={{ flex:1,color:C.text,fontSize:14,fontWeight:700 }}>{task.label}</span>
            <button onClick={()=>setIntervals(p=>({...p,[key]:Math.max(1,val-1)}))} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>−</button>
            <span style={{ color:task.color,fontWeight:800,minWidth:28,textAlign:"center",fontSize:16 }}>{val}</span>
            <button onClick={()=>setIntervals(p=>({...p,[key]:val+1}))} style={{ width:30,height:30,background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:700,fontSize:16,cursor:"pointer" }}>+</button>
            <span style={{ color:C.sub,fontSize:12 }}>日</span>
            {/* 削除ボタン */}
            <button onClick={()=>{
              const isDefault = DEFAULT_TASKS.some(d=>d.id===task.id);
              if(isDefault){
                setHiddenTasks(prev=>[...prev,task.id]);
              } else {
                setCustomTasks(prev=>prev.filter(t=>t.id!==task.id));
                setTaskOrder(prev=>prev.filter(id=>id!==task.id));
              }
              showToast(`🗑 ${task.label}を削除しました`);
            }} style={{ width:30,height:30,background:"#FEE2E2",border:"none",borderRadius:8,
              color:C.danger,fontSize:14,cursor:"pointer",flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center" }}>🗑</button>
            {/* ドラッグハンドル（右端） */}
            <div
              onTouchStart={e=>onHandleTouchStart(i,e)}
              onTouchMove={onHandleTouchMove}
              onTouchEnd={onHandleTouchEnd}
              style={{ fontSize:20,color:C.sub,cursor:"grab",flexShrink:0,padding:"0 2px",
                userSelect:"none",WebkitUserSelect:"none",touchAction:"none",lineHeight:1 }}>≡</div>
          </div>
        );
      })}

      {/* 非表示タスクの復元 */}
      {hiddenTasks.length > 0 && (
        <>
          <SectionLabel>非表示のケア（タップで復元）</SectionLabel>
          {DEFAULT_TASKS.filter(t=>hiddenTasks.includes(t.id)).map(task=>(
            <div key={task.id} onClick={()=>{
              setHiddenTasks(prev=>prev.filter(id=>id!==task.id));
              showToast(`✅ ${task.label}を復元しました`);
            }} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
              background:"#F8F8F8",border:`1.5px dashed ${C.border}`,
              borderRadius:12,marginBottom:6,cursor:"pointer",opacity:0.6 }}>
              <span style={{ fontSize:18,filter:"grayscale(100%)" }}>{task.icon}</span>
              <span style={{ flex:1,color:C.sub,fontSize:14 }}>{task.label}</span>
              <span style={{ fontSize:12,color:C.water,fontWeight:700 }}>↩ 復元</span>
            </div>
          ))}
        </>
      )}

      <SectionLabel>カスタムケアを追加</SectionLabel>
      <Card style={{ marginBottom:8 }}>
        <InputF placeholder="ケア名（例：グリーンウォーター補充）" value={newTaskLabel} onChange={e=>setNewTaskLabel(e.target.value)}/>
        <div style={{ display:"flex",alignItems:"center",gap:8,margin:"10px 0" }}>
          <span style={{ color:C.sub,fontSize:13 }}>周期:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="例: 7"
            value={newTaskInterval||""}
            onChange={e=>{
              const raw = e.target.value.replace(/[^0-9]/g,"");
              if(raw==="") { setNewTaskInterval(""); return; }
              const v = parseInt(raw);
              if(v>=1&&v<=365) setNewTaskInterval(v);
            }}
            onBlur={()=>{ if(!newTaskInterval||newTaskInterval<1) setNewTaskInterval(1); }}
            style={{ width:80,textAlign:"center",padding:"8px 4px",background:C.sky,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:800,fontSize:16,outline:"none",WebkitUserSelect:"text",userSelect:"text" }}
          />
          <span style={{ color:C.sub,fontSize:13 }}>日ごと（1〜365）</span>
        </div>
        <Btn color={C.water} onClick={()=>{
          if(!newTaskLabel.trim()) return;
          const nt={ id:`custom_${Date.now()}`,label:newTaskLabel.trim(),icon:"⭐",defaultInterval:newTaskInterval,color:C.pink };
          setCustomTasks(prev=>[...prev,nt]);
          setTaskOrder(prev=> prev.length>0 ? [...prev,nt.id] : []);
          setNewTaskLabel(""); setNewTaskInterval("");
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


export default SettingsView;
