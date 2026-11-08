export const sources = [
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
export const barhadrathas=barhaNames.map((name,i)=>({name,vayu:vayu[i],matsya:matsya[i],source:5,group:'Barhadratha'}));
export const laterKings=[['Pradyota',23],['Palaka',24],['Vishakhayupa',50],['Janaka / Ajaka',21],['Nandivardhana',20],['Shishunaga',40],['Kakavarna',36],['Kshemadharman',20],['Kshatraujas',40]].map(([name,years],i)=>({name,years,vayu:years,source:6,group:i<5?'Pradyota':'Pre-Bimbisara'}));
export const kuruNames=['Janamejaya','Satanika I','Ashvamedhadatta','Asimakrishna','Nichakra','Ushna','Chitraratha','Vrishnimat','Sushena','Sunitha','Richa','Nrichakshu','Sukhihala','Pariplava','Sunaya','Medhavin','Nripanjaya','Mridu','Tigma','Brihadratha','Vasudana','Satanika II'];
export const calibration=[
 {name:'Haryanka',years:132,kings:6,refs:[13,14],note:'Bimbisara to Nagadasaka; Buddhist chronicle durations.'},
 {name:'Shishunaga',years:68,kings:12,refs:[14,15],note:'Shishunaga, Kalashoka and ten sons.'},
 {name:'Nanda',years:22,kings:9,refs:[15],note:'Mahavamsa version; disputed short succession.'},
 {name:'Maurya',years:137,kings:10,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Shunga',years:112,kings:10,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Kanva',years:45,kings:4,refs:[6],note:'Vishnu Purana total and king count.'},
 {name:'Satavahana',years:456,kings:30,refs:[6,17],note:'One traditional version; chronology and count vary.'},
 {name:'Early imperial Gupta',years:147,kings:6,refs:[16],note:'c. 320–467 CE; includes Ramagupta; selected interval.'}
];

export const defaults={mean:20,spread:2,botk:1375,generation:30,genSpread:5,offset:25,mode:'hybrid',extra:0,udayana:500,parikshit:60};
export const limits={mean:[8,40],spread:[0,8],botk:[1300,1450],generation:[20,40],genSpread:[0,10],offset:[-20,80],extra:[0,12],udayana:[450,550],parikshit:[24,60]};
export function sanitize(input={}){
 const s={...defaults};
 for(const [key,[min,max]] of Object.entries(limits)) { const n=Number(input[key]??s[key]); if(Number.isFinite(n)) s[key]=Math.min(max,Math.max(min,n)); }
 s.extra=Math.round(s.extra); s.parikshit=s.parikshit===24?24:60;
 if(['hybrid','averaged','vayu','matsya'].includes(input.mode))s.mode=input.mode;
 return s;
}
export function magadhaReigns(input){
 const s=sanitize(input);
 const first=barhadrathas.map(k=>{
  const literal=s.mode==='vayu'?k.vayu:s.mode==='matsya'?k.matsya:null;
  return {...k,years:literal??s.mean,kind:literal===null?'averaged':'stated',note:literal===null?(s.mode==='matsya'?'No corresponding named reign in Wilson’s Matsya list; average placeholder, not a supplied Matsya duration.':'Comparative reconstruction replaces the transmitted duration; select a literal reading to compare.'):'Textual duration, not an independently dated reign.'};
 });
 const later=laterKings.map(k=>({...k,years:s.mode==='averaged'?s.mean:k.years,kind:s.mode==='averaged'?'averaged':'stated',note:'Position follows the Vishnu Purana sequence. Stated duration is Wilson’s Vayu reading.'}));
 const extras=Array.from({length:s.extra},(_,i)=>({name:`Additional reign ${i+1}`,group:'Hypothesis',years:s.mean,kind:'averaged',source:null,note:'User-added hypothetical missing reign. Not a named ruler in the selected list.'}));
 return [...first,...extras,...later];
}
export function calculate(input){
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
export function pooled(indices=calibration.map((_,i)=>i)){
 const rows=indices.map(i=>calibration[i]);const years=rows.reduce((a,k)=>a+k.years,0),kings=rows.reduce((a,k)=>a+k.kings,0);return {years,kings,mean:years/kings};
}
