/* Local static distribution: no module loader or server required. */
(()=>{'use strict';
const sources = [
  {id:1,title:'Rigveda 7.18 — Sudās and the battle',url:'https://sacred-texts.com/hin/rvsan/rv07018.htm',note:'Primary hymn in Sanskrit. Establishes the battle tradition, not an absolute BCE year.'},
  {id:2,title:'Witzel — The Languages of Harappa, §6',url:'https://fid4sa-repository.ub.uni-heidelberg.de/120/1/LanguagesHarappa_1998.pdf',note:'Places the middle Rigvedic period, including Sudās, at c. 1450–1300 BCE. Used as an external chronological window, not a precisely dated battle.'},
  {id:3,title:'Vishnu Purana IV.19 — Panchala descent',url:'https://sacred-texts.com/hin/vp/vp112.htm',note:'Sudas → Sahadeva/Saudasa → Somaka → Prishata → Drupada. Four generational links; identification with Rigvedic Sudās is a model assumption.'},
  {id:4,title:'Rigveda 4.15.9 — Somaka Sāhadevya',url:'https://www.wisdomlib.org/hinduism/book/rig-veda-english-translation/d/doc832393.html',note:'Names Somaka as Sahadeva’s son; supports this individual relationship, not the entire later genealogy.'},
  {id:5,title:'Vishnu Purana IV.23 — Barhadratha succession',url:'https://sacred-texts.com/hin/vp/vp116.htm',note:'21 named kings from Somapi to Ripunjaya. Wilson’s notes report individual Vayu and Matsya durations; those readings are selectable below.'},
  {id:6,title:'Vishnu Purana IV.24 — Later dynasties',url:'https://sacred-texts.com/hin/vp/vp117.htm',note:'Five Pradyotas and four pre-Bimbisara rulers in this Purāṇic order. Wilson reports Vayu reigns of 23, 24, 50, 21, 20 and 40, 36, 20, 40 years.'},
  {id:7,title:'Mahabharata 16.1 — The thirty-sixth year',url:'https://sacred-texts.com/hin/m16/m16001.htm',note:'The Yadava destruction occurs in the thirty-sixth year after the war. Used as an approximate 36-year postwar interval.'},
  {id:8,title:'Mahabharata 17.1 — Parikshit’s installation',url:'https://sacred-texts.com/hin/m17/m17001.htm',note:'Yudhishthira installs Parikshit before departing; read with the preceding postwar chronology.'},
  {id:9,title:'Mahabharata 10.16 — Parikshit’s sixty-year reign',url:'https://sacred-texts.com/hin/m10/m10016.htm',note:'Explicitly predicts sixty years of rule. This is the default Kuru reading.'},
  {id:10,title:'Mahabharata 1.49 — Reign and age readings',url:'https://sacred-texts.com/hin/m01/m01050.htm',note:'Ganguli’s translation describes both sixty years of rule and death at age sixty. The alternate age-based scenario gives about 24 years after a postwar accession at 36.'},
  {id:11,title:'Vishnu Purana IV.21 — Parikshit to Udayana',url:'https://sacred-texts.com/hin/vp/vp114.htm',note:'The selected main-text list has 22 rulers from Janamejaya through the second Satanika, followed by Udayana. Variants insert, omit or rename kings.'},
  {id:12,title:'Upinder Singh — Early Magadha chronology',url:'https://www.mpgcamb.com/wp-content/uploads/2024/12/A-History-of-ancient-an-early-mideaval-India-by-Upinder-sing_compressed.pdf',note:'Discusses the approximate Bimbisara chronology and its dependence on Buddhist dating. Also treats Udayana, Pradyota and the early kingdoms. Here 543 BCE is the stipulated fixed anchor; 500 BCE for Udayana is an adjustable scenario.'},
  {id:13,title:'Dipavamsa III.59–60 — Early reign lengths',url:'https://ancient-buddhist-texts.net/Texts-and-Translations/Dipavamsa/03-Great-Lineage.htm',note:'Bimbisara 52 and Ajatashatru 32 years.'},
  {id:14,title:'Mahavamsa IV — Haryanka and Shishunaga reigns',url:'https://books.lakdiva.org.lk/mahavamsa/chap004.html',note:'Udayabhaddaka 16; two successors together 8; Nagadasaka 24; Shishunaga 18; Kalashoka 28. This sequence differs from the Purāṇic order.'},
  {id:15,title:'Mahavamsa V — Short successions',url:'https://books.lakdiva.org.lk/mahavamsa/chap005.html',note:'Ten sons of Kalashoka share 22 years; nine Nandas share 22. Counts and totals are chronicle traditions.'},
  {id:16,title:'Gupta chronology and Ramagupta',url:'https://ebooks.inflibnet.ac.in/icp01/chapter/the-gupta-empire/',note:'The c. 320–467 CE early imperial interval is used with six rulers, including Ramagupta. This is a selected period, not the full dynasty.'},
  {id:17,title:'Satavahana chronological variants',url:'https://ebooks.inflibnet.ac.in/icp01/chapter/sunga-kanva-and-satavahana-dynasties/',note:'Documents disagreements over king counts and total years. The calibration uses one explicitly identified traditional reconstruction.'}
];

const barhaNames=['Somapi','Shrutavat','Ayutayus','Niramitra','Sukshatra','Brihatkarman','Senajit','Shrutanjaya','Vipra','Shuchi','Kshemya','Suvrata','Dharma','Sushuma','Dridhasena','Sumati','Suvala','Sunita','Satyajit','Vishvajit','Ripunjaya'];
const vayu=[58,67,36,100,8,23,23,40,25,58,28,60,5,38,48,33,22,40,80,35,50];
const matsya=[50,64,26,40,56,23,50,40,28,64,28,64,35,58,28,48,33,32,null,null,50];
const barhadrathas=barhaNames.map((name,i)=>({name,vayu:vayu[i],matsya:matsya[i],source:5,group:'Barhadratha'}));
const laterKings=[['Pradyota',23],['Palaka',24],['Vishakhayupa',50],['Janaka / Ajaka',21],['Nandivardhana',20],['Shishunaga',40],['Kakavarna',36],['Kshemadharman',20],['Kshatraujas',40]].map(([name,years],i)=>({name,years,vayu:years,source:6,group:i<5?'Pradyota':'Pre-Bimbisara'}));
const kuruNames=['Janamejaya','Satanika I','Ashvamedhadatta','Asimakrishna','Nichakra','Ushna','Chitraratha','Vrishnimat','Sushena','Sunitha','Richa','Nrichakshu','Sukhihala','Pariplava','Sunaya','Medhavin','Nripanjaya','Mridu','Tigma','Brihadratha','Vasudana','Satanika II'];
const calibration=[
 {name:'Haryanka',years:132,kings:6,refs:[13,14],note:'Bimbisara to Nagadasaka; Buddhist chronicle durations.'},
 {name:'Shishunaga',years:68,kings:12,refs:[14,15],note:'Shishunaga, Kalashoka and ten sons.'},
 {name:'Nanda',years:22,kings:9,refs:[15],note:'Mahavamsa version; disputed short succession.'},
 {name:'Maurya',years:137,kings:10,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Shunga',years:112,kings:10,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Kanva',years:45,kings:4,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Satavahana',years:456,kings:30,refs:[6,17],note:'One traditional version; chronology and count vary.'},
 {name:'Early imperial Gupta',years:147,kings:6,refs:[16],note:'c. 320–467 CE; includes Ramagupta; selected interval.'}
];

const defaults={mean:20,spread:2,botk:1375,generation:30,genSpread:5,offset:25,mode:'hybrid',extra:0,udayana:500,parikshit:60};
const limits={mean:[8,40],spread:[0,8],botk:[1300,1450],generation:[20,40],genSpread:[0,10],offset:[-20,80],extra:[0,12],udayana:[450,550],parikshit:[24,60]};
function sanitize(input={}){
 const s={...defaults};
 for(const [key,[min,max]] of Object.entries(limits)) { const n=Number(input[key]??s[key]); if(Number.isFinite(n)) s[key]=Math.min(max,Math.max(min,n)); }
 s.extra=Math.round(s.extra); s.parikshit=s.parikshit===24?24:60;
 if(['hybrid','averaged','vayu','matsya'].includes(input.mode))s.mode=input.mode;
 return s;
}
function magadhaReigns(input){
 const s=sanitize(input);
 const first=barhadrathas.map(k=>{
  const literal=s.mode==='vayu'?k.vayu:s.mode==='matsya'?k.matsya:null;
  return {...k,years:literal??s.mean,kind:literal===null?'averaged':'stated',note:literal===null?(s.mode==='matsya'?'No corresponding named reign in Wilson’s Matsya list; average placeholder, not a supplied Matsya duration.':'Comparative reconstruction replaces the transmitted duration; select a literal reading to compare.'):'Textual duration, not an independently dated reign.'};
 });
 const later=laterKings.map(k=>({...k,years:s.mode==='averaged'?s.mean:k.years,kind:s.mode==='averaged'?'averaged':'stated',note:'Position follows the Vishnu Purana sequence. Stated duration is Wilson’s Vayu reading.'}));
 const extras=Array.from({length:s.extra},(_,i)=>({name:`Additional reign ${i+1}`,group:'Hypothesis',years:s.mean,kind:'averaged',source:null,note:'User-added hypothetical missing reign. Not a named ruler in the selected list.'}));
 return [...first,...extras,...later];
}
function calculate(input){
 const s=sanitize(input), reigns=magadhaReigns(s);
 const stated=reigns.filter(k=>k.kind==='stated').reduce((a,k)=>a+k.years,0), averaged=reigns.filter(k=>k.kind==='averaged').length;
 const backward=543+stated+averaged*s.mean;
 const bLow=543+stated+averaged*Math.max(1,s.mean-s.spread), bHigh=543+stated+averaged*(s.mean+s.spread);
 const forward=s.botk-4*s.generation-s.offset;
 const fLow=s.botk-4*(s.generation+s.genSpread)-s.offset,fHigh=s.botk-4*(s.generation-s.genSpread)-s.offset;
 const low=Math.max(bLow,fLow),high=Math.min(bHigh,fHigh),overlap=low<=high;
 const kuru=s.udayana+36+s.parikshit+22*s.mean;
 return {s,reigns,stated,averaged,backward,forward,bLow,bHigh,fLow,fHigh,overlap,low,high,residual:Math.abs(backward-forward),kuru,requiredMean:(forward-543-stated)/(averaged||1),impliedBotk:backward+4*s.generation+s.offset};
}
function pooled(indices=calibration.map((_,i)=>i)){
 const rows=indices.map(i=>calibration[i]);const years=rows.reduce((a,k)=>a+k.years,0),kings=rows.reduce((a,k)=>a+k.kings,0);return {years,kings,mean:years/kings};
}

const $=id=>document.getElementById(id);
const n=(v,dec=0)=>Number(v.toFixed(dec)).toLocaleString('en-US',{maximumFractionDigits:dec,useGrouping:false});
const bce=v=>`${n(v)} BCE`;
const refs=(...ids)=>`<sup>${ids.map(id=>`<a href="#source-${id}" aria-label="Source ${id}">${id}</a>`).join(',')}</sup>`;
let state=sanitize(Object.fromEntries(new URLSearchParams(location.search)));
let selected=null, current;
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function fieldValues(){
 for(const key of Object.keys(limits)){
  const input=$(key);if(!input)continue;input.value=state[key];
  if(input.type==='range') input.style.setProperty('--fill',`${(state[key]-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`);
  const out=$(`${key}-out`);if(!out)continue;
  out.textContent=['botk','udayana'].includes(key)?bce(state[key]):key==='extra'?`${state[key]} reigns`:['spread','genSpread'].includes(key)?`± ${n(state[key],1)} yr`:`${n(state[key],1)} yr`;
 }
 $('mode').value=state.mode;
}
function render(){
 current=calculate(state);const c=current;state=c.s;fieldValues();
 const note={hybrid:'Working reconstruction: average the Barhadratha block; retain nine later Vayu durations (274 years). The transmitted Barhadratha years are visible in the ledger.',averaged:'One common average across all named reigns. Every segment is modeled; transmitted durations remain visible for comparison.',vayu:'All 30 named reigns use the Vayu durations reported by Wilson. The average affects only any hypothetical additional reigns.',matsya:'The first block uses Wilson’s Matsya variants. Two absent named entries remain average placeholders; the later nine retain Vayu readings. This is a comparison, not a complete Matsya recension.'};
 $('mode-note').textContent=note[state.mode];
 $('main-date').textContent=n(Math.round(c.backward/10)*10);
 $('exact-date').textContent=`Calculated centre: ${bce(c.backward)}`;
 $('date-caption').textContent='Selected Magadha reconstruction · rounded to a decade';
 $('fit-tag').textContent=c.overlap?'PATHS OVERLAP':'NO SHARED INTERVAL';$('fit-tag').classList.toggle('no-fit',!c.overlap);
 $('forward-date').textContent=bce(c.forward);$('backward-date').textContent=bce(c.backward);
 $('forward-formula').textContent=`${n(state.botk)} − 4 × ${n(state.generation,1)} − (${n(state.offset)})`;
 $('backward-formula').textContent=`543 + ${n(c.stated)} + ${c.averaged} × ${n(state.mean,2)}`;
 $('convergence-title').textContent=c.overlap?`${bce(c.high)}–${n(c.low)} BCE · shared model interval`:`${n(c.residual)} years between the central estimates`;
 $('convergence-body').textContent=c.overlap?`The two central estimates differ by ${n(c.residual)} years. Their sensitivity intervals intersect; this measures model compatibility, not a probability of the historical date.`:`These assumptions do not reconcile the two paths. Change the reign model, average, generation length or event-age assumption to test the source of the difference.`;
 $('live-method').innerHTML=`This reconstruction proposes <strong>c. ${n(Math.round(c.backward/10)*10)} BCE</strong> for the war. Starting at Bimbisara’s stipulated 543 BCE accession, it counts ${n(c.stated)} text-stated years and ${c.averaged} modeled reigns at ${n(state.mean,2)} years each.${refs(5,6,12)} Independently, the ${bce(state.botk)} Sudas anchor, four ${n(state.generation,1)}-year generations, and a ${n(state.offset)}-year event-age difference give ${bce(c.forward)}.${refs(2,3,4)} ${c.overlap?'The two sensitivity intervals overlap.':'The two sensitivity intervals do not overlap.'}`;
 $('ledger-count').textContent=`${c.reigns.length} reigns · ${c.reigns.length-c.averaged} stated / ${c.averaged} averaged`;
 renderOverview(c);renderTimelines(c);renderLedger(c);renderKuru(c);
}
function renderOverview(c){
 const max=Math.ceil((Math.max(c.bHigh,c.fHigh)+35)/50)*50,min=Math.floor((Math.min(c.bLow,c.fLow)-35)/50)*50;
 const x=v=>110+(max-v)/(max-min)*450;
 const bar=(lo,hi,y,color,label,centre)=>`<text x="0" y="${y+4}" fill="#b2b3a9" font-size="11">${label}</text><line x1="${x(hi)}" x2="${x(lo)}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="9" opacity=".35"/><circle cx="${x(centre)}" cy="${y}" r="4" fill="${color}"/>`;
 let ticks='';for(let i=0;i<=4;i++){const v=max-(max-min)*i/4;ticks+=`<line x1="${x(v)}" x2="${x(v)}" y1="18" y2="89" stroke="#34362d"/><text x="${x(v)}" y="110" text-anchor="middle" fill="#999d8c" font-size="10">${n(v)}</text>`;}
 $('overview').innerHTML=`<svg viewBox="0 0 600 130" role="img" aria-label="Panchala estimate ${bce(c.forward)}, Magadha estimate ${bce(c.backward)}; ${c.overlap?'sensitivity intervals overlap':'no overlap'}"><text x="110" y="10" fill="#898c7d" font-size="9" letter-spacing="1">OLDER ← BCE → YOUNGER</text>${ticks}${c.overlap?`<rect x="${x(c.high)}" y="22" width="${Math.max(1,x(c.low)-x(c.high))}" height="62" fill="#d8b66c" opacity=".07"/>`:''}${bar(c.fLow,c.fHigh,40,'#abbf9b','Panchala',c.forward)}${bar(c.bLow,c.bHigh,72,'#d8b66c','Magadha',c.backward)}</svg>`;
}
function svgTimeline(items,start,{title,subtitle,width=2700,id='main',endLabel='',marks=[]}={}){
 const total=items.reduce((a,k)=>a+k.years,0),left=32,right=100,usable=width-left-right;
 let cursor=left,date=start;
 let out=`<svg viewBox="0 0 ${width} 188" width="${width}" height="188" role="group" aria-label="${title}"><defs><pattern id="hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#34382a"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a79d78" stroke-width="1.5"/></pattern></defs><text x="32" y="21" fill="#f5f2eb" font-size="13">${title}</text><text x="32" y="40" fill="#999d8c" font-size="10">${subtitle??''}</text><line x1="${left}" x2="${width-right}" y1="103" y2="103" stroke="#666a53"/>`;
 items.forEach((k,i)=>{
  const w=k.years/total*usable,end=date-k.years;
  const fill=k.kind==='stated'?'#b59654':k.kind==='generation'?'#586b4b':`url(#hatch-${id})`;
  const label=k.name;
  out+=`<g class="segment" role="button" tabindex="0" data-track="${id}" data-index="${i}" aria-label="${label}, ${n(k.years,2)} years, ${k.kind}; ${bce(date)} to ${bce(end)}"><title>${label} · ${n(k.years,2)} years · ${k.kind}\n${bce(date)} → ${bce(end)}</title><rect x="${cursor+1}" y="72" width="${Math.max(1,w-2)}" height="31" rx="1" fill="${fill}" stroke="#c5b27c" stroke-opacity=".35"/><text x="${cursor+w/2}" y="92" text-anchor="middle" font-size="11" fill="${k.kind==='stated'?'#171a11':'#f5f2eb'}">${n(k.years,1)}</text><text x="${cursor+4}" y="${124+(i%2)*20}" font-size="10" fill="#dddccd">${label}</text><line x1="${cursor+2}" y1="103" x2="${cursor+2}" y2="${i%2?134:114}" stroke="#525741"/></g>`;
  if(i===0||i===items.length-1||i%5===0)out+=`<text x="${cursor}" y="61" font-size="10" fill="#bdbda8">${n(date)}</text>`;
  cursor+=w;date=end;
 });
 out+=`<line x1="${cursor}" x2="${cursor}" y1="59" y2="108" stroke="#d8b66c"/><circle cx="${cursor}" cy="103" r="4" fill="#d8b66c"/><text x="${cursor+10}" y="82" fill="#d8b66c" font-size="13">${n(date)} BCE</text><text x="${cursor+10}" y="101" fill="#b2b3a9" font-size="10">${endLabel}</text><text x="32" y="176" fill="#898c7d" font-size="9">Durations are proportional. Labels alternate below the line. Dates are calculated model boundaries.</text></svg>`;
 return out;
}
let tracks={};
function renderTimelines(c){
 const panchala=[{name:'Sudas → Sahadeva',years:state.generation,kind:'generation',source:3,note:'One father-to-son interval; generation length is modeled.'},{name:'Sahadeva → Somaka',years:state.generation,kind:'generation',source:4,note:'The Rigvedic hymn names Somaka as Sahadeva’s son; elapsed years are modeled.'},{name:'Somaka → Prishata',years:state.generation,kind:'generation',source:3,note:'One father-to-son interval in the selected Purāṇic genealogy.'},{name:'Prishata → Drupada',years:state.generation,kind:'generation',source:3,note:'Drupada is the war-era Panchala king.'}];
 if(state.offset>0)panchala.push({name:'Event-age difference',years:state.offset,kind:'generation',source:null,note:'Modeled difference between the ages at which Drupada and Sudas fought their battles.'});
 tracks.panchala=panchala;tracks.main=c.reigns;
 const pStart=state.botk+(state.offset<0?-state.offset:0);
 $('timelines').innerHTML=svgTimeline(panchala,pStart,{title:'I. PANCHALA · FORWARD FROM SUDAS',subtitle:`Four generations · ${n(state.offset)}-year event-age correction${state.offset<0?' (negative correction represented by shifting the start older)':''}`,width:1300,id:'panchala',endLabel:'War estimate'})+svgTimeline(c.reigns,c.backward,{title:'II. MAGADHA · BACKWARD FROM 543 BCE',subtitle:`${c.reigns.length} reigns · ${n(c.stated)} stated years + ${c.averaged} × ${n(state.mean,2)} averaged years · displayed in chronological order`,width:Math.max(2600,c.reigns.length*95),id:'main',endLabel:'Bimbisara'});
 if(!selected||!tracks[selected.track]?.[selected.index])selected={track:'main',index:0};
 inspect(selected.track,selected.index);bindSegments($('timelines'));
}
function bindSegments(container){container.querySelectorAll('.segment').forEach(el=>{const action=()=>{selected={track:el.dataset.track,index:Number(el.dataset.index)};inspect(selected.track,selected.index);};el.addEventListener('click',action);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});});}
function inspect(track,index){const k=tracks[track]?.[index];if(!k)return;const source=sources.find(s=>s.id===k.source);$('inspection').innerHTML=`<strong>${k.name}</strong><span>${n(k.years,2)} years · ${k.kind==='stated'?'text-stated duration':k.kind==='generation'?'modeled generation / event interval':'averaged reign'}</span><p>${k.note||''} ${k.vayu!=null?`Vayu: ${k.vayu} years. `:''}${k.matsya!=null?`Matsya: ${k.matsya} years. `:''}${source?`<a class="text-link" href="${source.url}" target="_blank" rel="noopener noreferrer">Read source ${source.id} ↗</a>`:''}</p>`;}
function renderLedger(c){$('ledger').innerHTML=c.reigns.map(k=>`<tr><td>${k.name}</td><td>${k.group}</td><td>${n(k.years,2)} yr</td><td><span class="kind-label ${k.kind}">${k.kind==='stated'?'Text-stated':'Averaged'}</span></td><td>${k.vayu??(k.source===6?k.years:'—')}</td><td>${k.matsya??'—'}</td><td>${k.source?refs(k.source):'Hypothesis'}</td></tr>`).join('');}
function renderKuru(c){
 $('kuru-summary').textContent=`${bce(c.kuru)} · separate result`;
 $('kuru-date').textContent=`c. ${bce(Math.round(c.kuru/10)*10)}`;
 $('kuru-formula').textContent=`${state.udayana} + 36 + ${state.parikshit} + 22 × ${n(state.mean,2)} = ${n(c.kuru)} BCE`;
 $('kuru-difference').textContent=`This line differs from the Panchala centre by ${n(Math.abs(c.kuru-c.forward))} years and from Magadha by ${n(Math.abs(c.kuru-c.backward))} years. It uses the same common reign average, with the selected Udayana accession scenario.`;
 const items=[{name:'Yudhishthira · postwar',years:36,kind:'stated',source:7,note:'Approximately 36 years from the war to Parikshit’s accession, reading Mausala with Mahaprasthanika.'},{name:'Parikshit',years:state.parikshit,kind:state.parikshit===60?'stated':'generation',source:state.parikshit===60?9:10,note:state.parikshit===60?'Explicit sixty-year reign in Sauptika.':'Alternative reconciliation: age sixty minus accession at approximately thirty-six = twenty-four years.'},...kuruNames.map(name=>({name,years:state.mean,kind:'averaged',source:11,note:'Named ruler in the selected Vishnu Purana main-text succession; duration is modeled.'}))];
 tracks.kuru=items;$('kuru-timeline').innerHTML=svgTimeline(items,c.kuru,{title:'III. KURU · STATED YEARS + AVERAGED SUCCESSORS',subtitle:'The 36- and 60-year intervals belong here; they are not added to Magadha.',width:2600,id:'kuru',endLabel:'Udayana'});bindSegments($('kuru-timeline'));
}
$('source-list').innerHTML=sources.map(s=>`<li id="source-${s.id}"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a><p>${s.note}</p></li>`).join('');
$('calibration-table').innerHTML=calibration.map(k=>`<tr><td title="${k.note}">${k.name}</td><td>${k.years}</td><td>${k.kings}</td><td>${n(k.years/k.kings,2)}</td><td>${refs(...k.refs)}</td></tr>`).join('');
for(const key of [...Object.keys(limits),'mode'])$(key)?.addEventListener('input',e=>{state=sanitize({...state,[key]:e.target.value});render();});
$('reset').addEventListener('click',()=>{state={...defaults};selected=null;history.replaceState(null,'',location.pathname);render();toast('Original reconstruction restored.');});
$('apply-pooled').addEventListener('click',()=>{state.mean=pooled().mean;render();$('explorer').scrollIntoView({behavior:'smooth'});toast('Pooled mean applied. Other assumptions retained.');});
$('apply-reduced').addEventListener('click',()=>{state.mean=pooled([0,3,4,5,6,7]).mean;render();$('explorer').scrollIntoView({behavior:'smooth'});toast('Reduced-sample mean applied.');});
$('share').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='explorer';url.search=new URLSearchParams(Object.entries(state).map(([k,v])=>[k,String(v)]));history.replaceState(null,'',url);try{await navigator.clipboard.writeText(url.href);toast('Scenario link copied.');}catch{toast('Scenario saved in the address bar. Copy its URL to share.');}});
$('download').addEventListener('click',()=>{const c=current;const quote=v=>`"${String(v??'').replaceAll('"','""')}"`;const rows=[['Kurukshetra chronology — selected scenario'],['Bimbisara fixed anchor BCE',543],['Magadha calculated war BCE',c.backward],['Panchala calculated war BCE',c.forward],['Kuru calculated war BCE',c.kuru],['Mode',state.mode],['Average reign',state.mean],['Average half-range',state.spread],['BOTK BCE',state.botk],['Generation length',state.generation],['Generation half-range',state.genSpread],['Event-age difference',state.offset],['Hypothetical extra reigns',state.extra],['Udayana scenario BCE',state.udayana],['Parikshit reading',state.parikshit],[],['Ruler','Group','Years used','Evidence','Vayu years','Matsya years','Source URL'],...c.reigns.map(k=>[k.name,k.group,k.years,k.kind,k.vayu??(k.source===6?k.years:''),k.matsya??'',sources.find(s=>s.id===k.source)?.url??'User hypothesis']),[],['Kuru cross-check ruler','Years used','Evidence','Source URL'],...tracks.kuru.map(k=>[k.name,k.years,k.kind,sources.find(s=>s.id===k.source)?.url??'']),[],['Model note','Text-stated durations are transmitted textual claims; selected averages and event-age assumptions are reconstructions. Parallel royal lines are not added together.']];const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='kurukshetra-reign-ledger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Reign ledger downloaded.');});
const ns='http://www.w3.org/2000/svg';for(let i=0;i<24;i++){const angle=i*Math.PI/12,line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:210+38*Math.cos(angle),y1:210+38*Math.sin(angle),x2:210+176*Math.cos(angle),y2:210+176*Math.sin(angle)}))line.setAttribute(k,v);$('spokes').appendChild(line);}
render();

})();
