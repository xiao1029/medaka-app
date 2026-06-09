import { useState } from "react";
import { C } from "../constants";
import { toDateStr } from "../utils";
import { Card } from "./ui/CommonUI";

export default function CalendarView({ tank, allTasks, diaryEntries=[], medakaRecords=[], onDaySelect, selectedDay }) {
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
