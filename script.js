const matches=[
{time:"15/06/2026 07:00",group:"Bảng A",home:"Mexico",away:"South Africa",odds:{home:1.92,draw:3.35,away:3.85,asian:"-0.5",over:"T 2.5"}},
{time:"15/06/2026 10:00",group:"Bảng A",home:"USA",away:"Canada",odds:{home:2.10,draw:3.20,away:3.40,asian:"-0/0.5",over:"T 2.25"}},
{time:"16/06/2026 02:00",group:"Bảng B",home:"Brazil",away:"Argentina",odds:{home:2.25,draw:3.15,away:2.95,asian:"0",over:"T 2.5"}},
{time:"16/06/2026 05:00",group:"Bảng C",home:"France",away:"England",odds:{home:2.38,draw:3.05,away:2.88,asian:"0",over:"T 2.25"}},
{time:"16/06/2026 08:00",group:"Bảng D",home:"Spain",away:"Germany",odds:{home:2.45,draw:3.10,away:2.70,asian:"0",over:"T 2.5"}},
{time:"17/06/2026 02:00",group:"Bảng E",home:"Portugal",away:"Italy",odds:{home:2.55,draw:3.00,away:2.62,asian:"0",over:"T 2.25"}}
];
let slip=JSON.parse(localStorage.getItem("wc_odds_slip")||"[]");
function renderMatches(){
const list=document.getElementById("matchList");
list.innerHTML=matches.map((m,idx)=>`
<div class="match-card">
  <div class="teams"><div class="time">${m.time} • ${m.group}</div><strong>${m.home} vs ${m.away}</strong><span>Match winner / handicap / total goals</span></div>
  <button class="odd" onclick="addPick(${idx},'1',${m.odds.home})"><small>1</small>${m.odds.home}</button>
  <button class="odd" onclick="addPick(${idx},'X',${m.odds.draw})"><small>X</small>${m.odds.draw}</button>
  <button class="odd" onclick="addPick(${idx},'2',${m.odds.away})"><small>2</small>${m.odds.away}</button>
  <button class="odd" onclick="addPick(${idx},'Châu Á ${m.odds.asian}',1.90)"><small>Châu Á</small>${m.odds.asian} @1.90</button>
  <button class="odd" onclick="addPick(${idx},'${m.odds.over}',1.92)"><small>Tài/Xỉu</small>${m.odds.over} @1.92</button>
</div>`).join("");
}
function addPick(matchIndex,market,odd){
const m=matches[matchIndex];
slip.push({id:Date.now()+Math.random(),match:`${m.home} vs ${m.away}`,market,odd:Number(odd)});
saveState();renderSlip();
}
function removePick(id){slip=slip.filter(item=>item.id!=id);saveState();renderSlip();}
function renderSlip(){
const box=document.getElementById("slipItems");
box.innerHTML=slip.length===0?`<p class="empty">Chọn tỷ lệ ở bảng bên trái để thêm vào phiếu.</p>`:slip.map(item=>`
<div class="slip-item"><button onclick="removePick(${item.id})">×</button><strong>${item.match}</strong><br><span>${item.market}</span><br><small>Odds: ${item.odd.toFixed(2)}</small></div>`).join("");
document.getElementById("totalPicks").innerText=slip.length;
const total=slip.reduce((acc,item)=>acc*item.odd,1);
document.getElementById("totalOdds").innerText=total.toFixed(2);
}
function saveSlip(){if(slip.length===0){alert("Bạn chưa chọn dự đoán nào.");return;}saveState();alert("Đã lưu phiếu dự đoán trên trình duyệt.");}
function clearSlip(){slip=[];saveState();renderSlip();}
function saveState(){localStorage.setItem("wc_odds_slip",JSON.stringify(slip));}
renderMatches();renderSlip();
