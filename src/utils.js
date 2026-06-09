export const getSeason    = () => { const m=new Date().getMonth()+1; return m>=3&&m<=5?"spring":m>=6&&m<=8?"summer":m>=9&&m<=11?"autumn":"winter"; };
export const toDateStr    = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const formatTime   = iso => { const d=new Date(iso); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`; };
export const formatDateJP = ds => { if(!ds) return ""; const [y,m,d]=ds.split("-"); return `${parseInt(y)}年${parseInt(m)}月${parseInt(d)}日`; };
export const daysSince    = (list=[]) => { if(!list.length) return Infinity; return Math.floor((Date.now()-Math.max(...list.map(s=>new Date(s).getTime())))/86400000); };
export const getStatus    = (days,interval) => { if(days===Infinity) return "urgent"; const r=days/interval; return r>=1?"urgent":r>=0.75?"warn":"ok"; };
export const genId        = () => Math.random().toString(36).slice(2,10).toUpperCase();
