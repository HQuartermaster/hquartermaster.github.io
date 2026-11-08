import {sources,calibration,defaults,limits,calculate,pooled,sanitize,kuruNames} from './model.mjs';
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
