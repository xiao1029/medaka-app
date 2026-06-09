import { useState } from "react";
import { C, AVATARS, MOOD_LIST } from "../constants";
import { genId, formatDateJP } from "../utils";
import { sGet } from "../storage";
import { Card, Btn, InputF, SwipeRow, SectionLabel } from "./ui/CommonUI";

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


export default FriendsView;
