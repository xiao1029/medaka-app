// ─── カラーパレット ───────────────────────────────────────
export const C = {
  sky:"#E8F6FF", skyMid:"#C8E9FF", water:"#5BAFD6", waterD:"#3A8CB8",
  orange:"#FF8C42", green:"#2DB87A", purple:"#8B66D4", pink:"#E8547A",
  warn:"#F59E0B", danger:"#EF4444", text:"#1A3A4A", sub:"#6B8FA3",
  border:"#D6EAF5", white:"#FFFFFF",
};

export const DEFAULT_TASKS = [
  { id:"feed",    label:"餌やり",    icon:"🐟", defaultInterval:1, color:C.orange  },
  { id:"water",   label:"水換え",    icon:"💧", defaultInterval:7, color:C.water   },
  { id:"psb",     label:"PSB投入",   icon:"🧪", defaultInterval:7, color:C.purple  },
  { id:"vitamin", label:"ビタミン剤", icon:"💊", defaultInterval:3, color:C.green   },
];

export const SEASON_TIPS = {
  spring:{ label:"🌸 春の管理", bg:"#FFF0F5", border:"#FFB7CE", tip:"水温上昇とともに餌の量を増やしましょう。産卵シーズン開始！" },
  summer:{ label:"☀️ 夏の管理", bg:"#FFFBEB", border:"#FCD34D", tip:"高水温に注意。水換え頻度を上げ、直射日光を避けましょう。" },
  autumn:{ label:"🍂 秋の管理", bg:"#FFF5EC", border:"#FDBA74", tip:"水温低下に合わせて餌を減らし、越冬準備を始めましょう。" },
  winter:{ label:"❄️ 冬の管理", bg:"#F0F8FF", border:"#93C5FD", tip:"5℃以下では絶食。ヒーターなしの場合は静かに見守りましょう。" },
};

export const MEDAKA_COLORS = ["#FF8C42","#5BAFD6","#2DB87A","#8B66D4","#E8547A","#F59E0B","#14B8A6"];

export const MOOD_LIST = [
  { v:"great", label:"最高！", emoji:"😄" },
  { v:"good",  label:"良い",   emoji:"🙂" },
  { v:"ok",    label:"普通",   emoji:"😐" },
  { v:"bad",   label:"心配",   emoji:"😟" },
];

export const AVATARS = ["🐟","🐡","🐠","🦈","🪸","🐙","🌊","🌿"];
