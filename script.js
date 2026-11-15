// MicroDiag AI - demo interface. The camera, the stage and the AI models are NOT connected.
// ===== 1. HELPERS =====
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const kv=a=>a.map(([k,v])=>`<span>${k}</span><span>${v}</span>`).join("");
const field=i=>"ABCD"[(i/6)|0]+(i%6+1);
const xy=i=>`X ${(i%6)*4+2}.0 · Y ${((i/6)|0)*4+2}.0 mm`;
const today=()=>new Date().toISOString().slice(0,10);
const NOTCOMP='<span class="cap">Not computed</span>';

// ===== 2. DEMO DATA: examples only, NOT real patients. Nothing is saved when the page refreshes =====
let P=[
  {id:"MD-0001",ini:"A.K.",age:54,sex:"M",sam:"Peripheral blood smear",sym:"Fever, weight loss, cough",hist:"No prior hematologic diagnosis",t:[{d:"2026-10-18",s:"Peripheral blood smear"}]},
  {id:"MD-0002",ini:"S.M.",age:61,sex:"F",sam:"Bone marrow aspirate",sym:"Fever, skin papules, lymphadenopathy",hist:"Follow-up visit",t:[{d:"2026-09-02",s:"Bone marrow aspirate"},{d:"2026-10-20",s:"Bone marrow aspirate"}]},
  {id:"MD-0003",ini:"R.H.",age:38,sex:"M",sam:"Peripheral blood smear",sym:"Night sweats, hepatosplenomegaly",hist:"Elevated white cell count",t:[{d:"2026-10-25",s:"Peripheral blood smear"}]},
  {id:"MD-0004",ini:"N.T.",age:47,sex:"F",sam:"Peripheral blood smear",sym:"Fever, oral ulcers, fatigue",hist:"None reported",t:[{d:"2026-11-02",s:"Peripheral blood smear"}]}
];
let nextTest=1;
const newTestId=()=>"T-"+String(nextTest++).padStart(4,"0");
P.forEach(p=>p.t.forEach(t=>t.id=newTestId()));

// ===== 3. STATE: what the user selected =====
let sel="MD-0001",tid=0,cell=7;
const cur=()=>P.find(p=>p.id===sel);
const sorted=()=>[...P].sort((a,b)=>a.id.localeCompare(b.id));

// ===== 4. SCREENS: show() switches pages, render() redraws everything from the data =====
function toast(m){
  const t=$("#toast");
  t.textContent=m;
  t.classList.add("on");
  clearTimeout(toast.h);
  toast.h=setTimeout(()=>t.classList.remove("on"),3600)
}
const titles={live:"Live capture",patients:"Patients",results:"Results",history:"History"};
function show(v){
  $$(".view").forEach(e=>e.classList.toggle("on",e.id==="v-"+v));
  $$(".nav").forEach(e=>e.classList.toggle("on",e.dataset.v===v));
  $("#title").textContent=titles[v];
  try{location.hash=v}catch(e){}
  render()
}
$$(".nav").forEach(b=>b.onclick=()=>show(b.dataset.v));
function render(){
  const p=cur(),q=$("#q").value.toLowerCase();
  $("#psel").innerHTML=sorted().map(x=>`<option value="${x.id}" ${x.id===sel?"selected":""}>${x.id} · ${x.ini}</option>`).join("");
  $("#k1").textContent=P.length;
  $("#k2").textContent=P.reduce((s,x)=>s+x.t.length,0);
  $("#k3").textContent=0;
  // live capture page (interface only)
  $("#hud").textContent=`Target field ${field(cell)} · ${xy(cell)} · stage not connected`;
  $("#pos").textContent=`Target: ${field(cell)}`;
  $("#map").innerHTML=Array.from({length:24},(_,i)=>`<button class="${i===cell?"on":""}" data-i="${i}">${field(i)}</button>`).join("");
  $$("#map button").forEach(b=>b.onclick=()=>{cell=+b.dataset.i;render()});
  $("#pcard").innerHTML=kv([["ID",`<b class="mono">${p.id}</b>`],["Initials",p.ini],["Age / Sex",p.age+" / "+p.sex],["Sample",p.sam],["Symptoms",p.sym],["Record type","Demo Data"]]);
  // patients page: list, record and previous tests
  $("#ptb").innerHTML=sorted().filter(x=>(x.id+x.ini).toLowerCase().includes(q)).map(x=>`<tr data-id="${x.id}" class="${x.id===sel?"sel":""}"><td class="mono">${x.id}</td><td>${x.ini}</td><td>${x.age} / ${x.sex}</td><td>${x.sam}</td><td>${x.t.length?x.t[x.t.length-1].d:"—"}</td></tr>`).join("");
  $$("#ptb tr").forEach(r=>r.onclick=()=>{sel=r.dataset.id;tid=Math.max(0,cur().t.length-1);render()});
  $("#pdet").innerHTML=kv([["ID",`<b class="mono">${p.id}</b>`],["Initials",p.ini],["Age / Sex",p.age+" / "+p.sex],["Sample type",p.sam],["Symptoms",p.sym],["History",p.hist],
    ["Last test",p.t.length?p.t[p.t.length-1].d:"None"],["Record type","Demo Data (not a real record)"]]);
  const rows=[...p.t.keys()].reverse().map(i=>`<tr data-i="${i}"><td class="mono">${p.t[i].id}</td><td>${p.t[i].d}</td><td>${p.t[i].s}</td><td>0</td><td>${NOTCOMP}</td></tr>`).join("");
  $("#ptests").innerHTML=rows||'<tr><td colspan="5" class="cap">No tests yet. Press New Test.</td></tr>';
  $$("#ptests tr[data-i]").forEach(r=>r.onclick=()=>{tid=+r.dataset.i;show("results")});
  // results page: only the test selector is active
  if(tid>=p.t.length)tid=Math.max(0,p.t.length-1);
  $("#tsel").innerHTML=p.t.map((t,i)=>`<option value="${i}" ${i===tid?"selected":""}>${t.id} · ${t.d}</option>`).join("");
  $("#rmeta").textContent=p.t.length?`${p.id} · ${p.t[tid].s} · 0 images`:`${p.id} · no tests yet`;
  // history page
  $("#hh").textContent=`Test history · ${p.id} · ${p.ini}`;
  $("#htb").innerHTML=[...p.t.keys()].reverse().map(i=>`<tr data-i="${i}"><td class="mono">${p.t[i].id}</td><td>${p.t[i].d}</td><td>${p.t[i].s}</td><td>0</td><td>${NOTCOMP}</td><td><button class="btn">Open</button></td></tr>`).join("")||'<tr><td colspan="6" class="cap">No tests yet.</td></tr>';
  $$("#htb tr[data-i]").forEach(r=>r.onclick=()=>{tid=+r.dataset.i;show("results")})
}

// ===== 5. ACTIONS =====
// New Patient: adds a demo patient record to this page only (the system assigns the next ID).
$("#bNewP").onclick=()=>{$("#fT").classList.add("hide");$("#fP").classList.remove("hide");$("#nIni").focus()};
$("#nCancel").onclick=()=>$("#fP").classList.add("hide");
$("#nAdd").onclick=()=>{
  const ini=$("#nIni").value.trim();
  if(!ini){toast("Enter the patient initials");return}
  const id="MD-"+String(P.length+1).padStart(4,"0");
  P.push({id,ini,age:+$("#nAge").value||0,sex:$("#nSex").value,sam:$("#nSam").value,sym:$("#nSym").value||"—",hist:$("#nHist").value||"—",t:[]});
  sel=id;tid=0;
  ["#nIni","#nAge","#nSym","#nHist"].forEach(s=>$(s).value="");
  $("#fP").classList.add("hide");
  render();
  toast(`Demo patient ${id} added to this page. It is not saved.`)
};
// New Test: adds a test (a record without images) to the selected patient, new or existing.
function openTestForm(){
  const p=cur();
  $("#fP").classList.add("hide");$("#fT").classList.remove("hide");
  $("#tWho").textContent=`${p.id} · ${p.ini}`;$("#tSam").value=p.sam;$("#tDate").value=today()
}
$("#bNewT").onclick=openTestForm;
$("#tCancel").onclick=()=>$("#fT").classList.add("hide");
$("#tAdd").onclick=()=>{
  const p=cur(),t={id:newTestId(),d:$("#tDate").value||today(),s:$("#tSam").value};
  p.t.push(t);tid=p.t.length-1;
  $("#fT").classList.add("hide");
  render();
  toast(`Demo test ${t.id} added for ${p.id}. It has no images and it is not saved.`)
};
// Planned functions: these buttons only explain why they do nothing yet.
const planned=(id,msg)=>$(id).onclick=()=>toast(msg);
planned("#capNow","Camera not connected. Capture is a planned function.");
planned("#af","Camera not connected. Auto-focus is a planned function.");
planned("#mvCap","Stage not connected. Stage movement is a planned function.");
planned("#reimg","Camera not connected. Re-imaging is a planned function.");
planned("#save","Not saved. Permanent storage is not available in this version.");
$("#psel").onchange=e=>{sel=e.target.value;tid=Math.max(0,cur().t.length-1);render()};
$("#tsel").onchange=e=>{tid=+e.target.value;render()};
$("#q").oninput=render;

// ===== 6. START =====
const h=(location.hash||"").slice(1);
show(titles[h]?h:"live");
