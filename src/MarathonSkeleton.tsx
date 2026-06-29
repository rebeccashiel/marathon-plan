import { useState, useEffect, useRef, useMemo } from "react";

/* ── STORAGE ── */
const SK = "nrc-skeleton-v1";
interface Prog { completed: Record<string,boolean>; km: Record<string,number>; notes: Record<string,string>; }
async function load(): Promise<Prog|null> {
  try { if(!window.storage) return null; const r=await window.storage.get(SK,false); return r?JSON.parse(r.value):null; } catch{return null;}
}
async function save(d:Prog) {
  try { if(window.storage) await window.storage.set(SK,JSON.stringify(d),false); } catch{}
}
declare global { interface Window { storage?:{get:(k:string,s?:boolean)=>Promise<{value:string}|null>;set:(k:string,v:string,s?:boolean)=>Promise<any>;}; } }

/* ── TYPES ── */
type Tag="easy"|"quality"|"long"|"rest"|"gym"|"shake"|"race"|"deload";
interface Sesh { id:string; day:string; tag:Tag; title:string; km:number|null; detail:string; paces?:string; }
interface Wk { id:string; n:number; dates:string; phase:string; theme:string; targetKm:number; sessions:Sesh[]; isDeload?:boolean; isRace?:boolean; isTaper?:boolean; isPeak?:boolean; }

const TAG:{[k in Tag]:{label:string;dot:string}} = {
  easy:   {label:"EASY RUN",    dot:"#30d158"},
  quality:{label:"QUALITY",     dot:"#fa5400"},
  long:   {label:"LONG RUN",    dot:"#0a84ff"},
  rest:   {label:"REST",        dot:"#444"},
  gym:    {label:"PT + RUN",    dot:"#bf5af2"},
  shake:  {label:"SHAKEOUT",    dot:"#ffd60a"},
  race:   {label:"RACE DAY",    dot:"#fa5400"},
  deload: {label:"DELOAD",      dot:"#636366"},
};

const PHASE_DOT:Record<string,string> = {
  "Base":"#30d158","Development":"#0a84ff","Race-Specific":"#fa5400","Taper":"#bf5af2"
};

/* ── DATA ── */
const WEEKS:Wk[] = [
  {id:"w1",n:1,dates:"29 Jun – 5 Jul",phase:"Base",theme:"Aerobic Foundation",targetKm:52,sessions:[
    {id:"w1-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:10,detail:"First run of the official build. Flat or low-elevation. Z2 check-in — set the tone, don't make a statement.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w1-tue",day:"TUE",tag:"quality",title:"Threshold Intervals + Leg PT",km:10,detail:"Run first on fresh legs: 2km easy warm-up → 3×1km @ threshold → 2km cool-down. Then leg-focused PT. Standing Tuesday pattern.",paces:"Threshold: 4:42–4:52/km · 168–174bpm"},
    {id:"w1-wed",day:"WED",tag:"easy",title:"Easy Z2 — Tired Legs",km:10,detail:"Fatigued from Tuesday PT. Keep it genuinely easy. HR running slightly high is normal and expected.",paces:"6:20–7:00/km · ≤152bpm"},
    {id:"w1-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Run to gym easy. Upper body and core PT only. Protecting legs for Saturday's long run.",paces:"6:30–7:00/km easy"},
    {id:"w1-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Short flat run. Not a training stimulus — just legs-over-rest before the long run.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w1-sat",day:"SAT",tag:"long",title:"Long Run — 20km",km:20,detail:"First proper long run of the build. All Z2, no MP segment yet. Fueling practice: 1 gel at 45min.",paces:"6:20–6:50/km · ≤152bpm"},
    {id:"w1-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Full rest. Non-negotiable every Sunday throughout the build."},
  ]},
  {id:"w2",n:2,dates:"6–12 Jul",phase:"Base",theme:"Volume + First MP Taste",targetKm:55,sessions:[
    {id:"w2-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:10,detail:"Aerobic accumulation. Same approach as Week 1.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w2-tue",day:"TUE",tag:"quality",title:"Threshold Intervals + Leg PT",km:11,detail:"3×1km threshold. Note if it feels more controlled than Week 1 — that's your first fitness signal. Run first, PT after.",paces:"4:42–4:52/km · 168–174bpm"},
    {id:"w2-wed",day:"WED",tag:"easy",title:"Easy Z2 — Tired Legs",km:10,detail:"Post-PT easy. Don't be tempted to push.",paces:"6:20–7:00/km · ≤152bpm"},
    {id:"w2-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Easy run to gym, upper body + core PT.",paces:"6:30–7:00/km easy"},
    {id:"w2-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w2-sat",day:"SAT",tag:"long",title:"Long Run + First MP — 22km",km:22,detail:"4km easy → 10km @ training MP → 8km easy. First extended MP block. HR should settle into the band, not spike.",paces:"Easy: 6:20–6:50/km · MP: 5:20–5:35/km · 153–162bpm"},
    {id:"w2-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest, recover, absorb."},
  ]},
  {id:"w3",n:3,dates:"13–19 Jul",phase:"Base",theme:"Building Consistency",targetKm:58,sessions:[
    {id:"w3-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:11,detail:"Volume ticking up. Keep HR honest.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w3-tue",day:"TUE",tag:"quality",title:"Threshold Intervals + Leg PT",km:11,detail:"4×1km — one more rep than last week. Run first, PT after.",paces:"4:42–4:52/km · 168–174bpm"},
    {id:"w3-wed",day:"WED",tag:"easy",title:"Easy Z2 — Tired Legs",km:10,detail:"Post-PT easy.",paces:"6:20–7:00/km · ≤152bpm"},
    {id:"w3-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w3-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w3-sat",day:"SAT",tag:"long",title:"Long Run + MP — 24km",km:24,detail:"4km easy → 12km @ training MP → 8km easy. MP block lengthening.",paces:"MP: 5:15–5:30/km · 153–162bpm"},
    {id:"w3-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w4",n:4,dates:"20–26 Jul",phase:"Base",theme:"Deload",targetKm:38,isDeload:true,sessions:[
    {id:"w4-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:8,detail:"Shorter than usual. Notice how legs feel compared to Week 1.",paces:"6:30–7:00/km · ≤148bpm"},
    {id:"w4-tue",day:"TUE",tag:"gym",title:"Run to PT + Legs",km:7,detail:"Deload week — PT can push legs harder since running load is down. Good week for strength progression.",paces:"6:30–7:00/km easy"},
    {id:"w4-wed",day:"WED",tag:"easy",title:"Easy Z2 + Strides",km:8,detail:"Easy run + 4×80m strides at the end. Neuromuscular maintenance only.",paces:"6:30–7:00/km · strides ~4:30/km"},
    {id:"w4-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w4-fri",day:"FRI",tag:"shake",title:"Easy Shakeout",km:4,detail:"Shortest shakeout of the build. Flat, no pressure.",paces:"6:45–7:15/km · ≤140bpm"},
    {id:"w4-sat",day:"SAT",tag:"long",title:"Easy Long Run — 16km",km:16,detail:"All easy, no MP segment. Arrive at Week 5 feeling fresh and slightly hungry for more.",paces:"6:20–6:50/km · ≤150bpm"},
    {id:"w4-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w5",n:5,dates:"27 Jul–2 Aug",phase:"Development",theme:"Raising the Ceiling",targetKm:58,sessions:[
    {id:"w5-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:11,detail:"Back fresh from deload.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w5-tue",day:"TUE",tag:"quality",title:"Continuous Tempo + Leg PT",km:11,detail:"20min continuous tempo — different stimulus from broken reps. Run first, PT after.",paces:"4:42–4:52/km continuous · 168–174bpm"},
    {id:"w5-wed",day:"WED",tag:"easy",title:"Easy Z2 — Tired Legs",km:11,detail:"Post-tempo easy.",paces:"6:20–7:00/km · ≤152bpm"},
    {id:"w5-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w5-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w5-sat",day:"SAT",tag:"long",title:"Long Run + MP — 25km",km:25,detail:"5km easy → 13km @ training MP → 7km easy.",paces:"MP: 5:10–5:25/km · 153–163bpm"},
    {id:"w5-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w6",n:6,dates:"3–9 Aug",phase:"Development",theme:"Specificity Increasing",targetKm:60,sessions:[
    {id:"w6-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:11,detail:"Aerobic base work continuing.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w6-tue",day:"TUE",tag:"quality",title:"Hill Repeats + Leg PT",km:11,detail:"6×90sec uphill hard effort, walk back down. Camps Bay climb. Strength-endurance. Run first, PT after.",paces:"Uphill: ~175–182bpm · Recovery: walk"},
    {id:"w6-wed",day:"WED",tag:"easy",title:"Easy Z2 — Tired Legs",km:11,detail:"Post-hills easy.",paces:"6:20–7:00/km · ≤152bpm"},
    {id:"w6-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w6-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w6-sat",day:"SAT",tag:"long",title:"Long Run + MP — 27km",km:27,detail:"5km easy → 15km @ training MP → 7km easy. Longest MP block yet.",paces:"MP: 5:08–5:22/km · 153–163bpm"},
    {id:"w6-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w7",n:7,dates:"10–16 Aug",phase:"Development",theme:"2nd Quality Session Introduced",targetKm:62,sessions:[
    {id:"w7-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:11,detail:"Last single-quality week.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w7-tue",day:"TUE",tag:"quality",title:"Threshold Intervals + Leg PT",km:11,detail:"4×1km threshold. Week 8 is deload — perfect time to introduce the 2nd quality day. Run first, PT after.",paces:"4:38–4:48/km · 168–174bpm"},
    {id:"w7-wed",day:"WED",tag:"quality",title:"★ 2nd Session — Fartlek",km:10,detail:"Second quality session introduced. 25min fartlek: 3min moderate / 2min easy alternating. Pace versatility without rigid structure.",paces:"Moderate: 5:10–5:25/km · Easy: 6:20–7:00/km"},
    {id:"w7-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w7-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Two quality sessions this week — keep Friday easy.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w7-sat",day:"SAT",tag:"long",title:"Long Run + MP — 28km",km:28,detail:"5km easy → 16km @ training MP → 7km easy. Deload follows.",paces:"MP: 5:05–5:18/km · 155–163bpm"},
    {id:"w7-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day. Earn it."},
  ]},
  {id:"w8",n:8,dates:"17–23 Aug",phase:"Development",theme:"Deload",targetKm:40,isDeload:true,sessions:[
    {id:"w8-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:8,detail:"Shorter. Legs earned this.",paces:"6:30–7:00/km · ≤148bpm"},
    {id:"w8-tue",day:"TUE",tag:"gym",title:"Run to PT + Legs",km:7,detail:"PT goes harder this week — running load is reduced.",paces:"6:30–7:00/km easy"},
    {id:"w8-wed",day:"WED",tag:"easy",title:"Easy Z2 + Strides",km:8,detail:"Easy run + 4×80m strides.",paces:"6:30–7:00/km · strides ~4:25/km"},
    {id:"w8-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w8-fri",day:"FRI",tag:"shake",title:"Easy Shakeout",km:4,detail:"Flat and easy.",paces:"6:45–7:15/km · ≤140bpm"},
    {id:"w8-sat",day:"SAT",tag:"long",title:"Easy Long Run — 18km",km:18,detail:"All easy, no MP segment.",paces:"6:20–6:50/km · ≤150bpm"},
    {id:"w8-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w9",n:9,dates:"24–30 Aug",phase:"Race-Specific",theme:"Marathon Specificity Begins",targetKm:63,sessions:[
    {id:"w9-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:12,detail:"Fresh from deload. Volume stepping up.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w9-tue",day:"TUE",tag:"quality",title:"Race-MP Intervals + Leg PT",km:11,detail:"4×2km @ race-target MP with 2min jog recovery. Running actual goal pace now. Run first, PT after.",paces:"4:55–5:05/km · 160–167bpm"},
    {id:"w9-wed",day:"WED",tag:"quality",title:"Continuous Tempo",km:10,detail:"25min continuous tempo. Sustained vs yesterday's broken reps.",paces:"4:38–4:48/km · 168–174bpm"},
    {id:"w9-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w9-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Two quality sessions — keep Friday easy.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w9-sat",day:"SAT",tag:"long",title:"Long Run + Extended MP — 29km",km:29,detail:"5km easy → 18km @ race-approaching MP → 6km easy. Getting serious.",paces:"MP: 5:00–5:12/km · 158–165bpm"},
    {id:"w9-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w10",n:10,dates:"31 Aug–6 Sep",phase:"Race-Specific",theme:"Peak Volume Territory",targetKm:66,sessions:[
    {id:"w10-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:12,detail:"High volume week — keep easy days genuinely easy.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w10-tue",day:"TUE",tag:"quality",title:"Progression Run + Leg PT",km:12,detail:"10km: 4km easy → 3km @ MP → 2km @ threshold → 1km @ 10K effort. Racing on fatigue. Run first, PT after.",paces:"MP: 4:55–5:05 · Threshold: 4:38–4:48 · 10K: 4:25–4:38/km"},
    {id:"w10-wed",day:"WED",tag:"quality",title:"Race-MP Intervals",km:11,detail:"5×1.5km @ race MP with 90sec jog. Short to stay controlled.",paces:"4:55–5:05/km · 160–167bpm"},
    {id:"w10-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w10-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w10-sat",day:"SAT",tag:"long",title:"Long Run — 30km",km:30,detail:"5km easy → 20km @ goal MP → 5km easy. Longest MP block of the build. This should scare you slightly. That's correct.",paces:"MP: 4:58–5:08/km · 160–167bpm"},
    {id:"w10-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day. Big week done."},
  ]},
  {id:"w11",n:11,dates:"7–13 Sep",phase:"Race-Specific",theme:"Gun Run Week",targetKm:55,isRace:true,sessions:[
    {id:"w11-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:10,detail:"Mini taper begins. Don't add volume.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w11-tue",day:"TUE",tag:"quality",title:"Short Sharpener + Light Leg PT",km:9,detail:"2×1km @ threshold + 4×200m @ 10K effort. Short, sharp — keeps legs awake before Sunday. Light PT after.",paces:"Threshold: 4:38–4:48/km · 200m: 4:15–4:25/km"},
    {id:"w11-wed",day:"WED",tag:"easy",title:"Easy Z2 — Mini Taper",km:8,detail:"Volume dropping for Sunday. Genuinely easy.",paces:"6:30–7:00/km · ≤148bpm"},
    {id:"w11-thu",day:"THU",tag:"gym",title:"Run to PT — Light Upper Only",km:6,detail:"Easy run + light upper only. Zero leg work today.",paces:"6:30–7:00/km easy"},
    {id:"w11-fri",day:"FRI",tag:"shake",title:"Shakeout + Strides",km:4,detail:"Short flat shakeout + 4×80m strides. Legs should feel sharp. Sleep early tonight.",paces:"6:45–7:15/km · 4 strides at race effort"},
    {id:"w11-sat",day:"SAT",tag:"rest",title:"Rest — Race Tomorrow",km:null,detail:"Full rest. Kit laid out. Confirm fuel plan. Race morning: carb breakfast 90min before start."},
    {id:"w11-sun",day:"SUN",tag:"race",title:"OUTSURANCE GUN RUN — 21.1km",km:21.1,detail:"TARGET: 1:36–1:40 (4:33–4:44/km). Follicular phase — good timing. Start conservative — first 5km easy. Fuel: gel at 25min and 50min. Fitness checkpoint for the marathon build.",paces:"Target: 4:33–4:44/km · First 5km: hold back"},
  ]},
  {id:"w12",n:12,dates:"14–20 Sep",phase:"Race-Specific",theme:"Deload — Post Gun Run",targetKm:38,isDeload:true,sessions:[
    {id:"w12-mon",day:"MON",tag:"easy",title:"Easy Recovery Run",km:7,detail:"Post-race legs. Purely by feel. Elevated HR is normal.",paces:"6:45–7:30/km · ≤145bpm"},
    {id:"w12-tue",day:"TUE",tag:"gym",title:"Run to PT + Legs",km:7,detail:"PT pushes legs harder this week. Use Gun Run data to refine focus.",paces:"6:30–7:00/km easy"},
    {id:"w12-wed",day:"WED",tag:"easy",title:"Easy Z2 + Strides",km:8,detail:"Easy + 4×80m strides. Legs waking back up.",paces:"6:30–7:00/km · strides ~4:20/km"},
    {id:"w12-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Easy run + upper/core PT.",paces:"6:30–7:00/km easy"},
    {id:"w12-fri",day:"FRI",tag:"shake",title:"Easy Shakeout",km:4,detail:"Short and flat.",paces:"6:45–7:15/km · ≤140bpm"},
    {id:"w12-sat",day:"SAT",tag:"long",title:"Moderate Long Run — 20km",km:20,detail:"Easy to moderate. No MP segment. Confirming race recovery.",paces:"6:10–6:40/km · ≤155bpm"},
    {id:"w12-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w13",n:13,dates:"21–27 Sep",phase:"Race-Specific",theme:"Peak Week — Longest Run",targetKm:68,isPeak:true,sessions:[
    {id:"w13-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:12,detail:"Fresh from deload. Use it wisely — not today.",paces:"6:20–7:00/km · ≤150bpm"},
    {id:"w13-tue",day:"TUE",tag:"quality",title:"Race-Pace Intervals + Leg PT",km:12,detail:"6×1km @ exact race MP (4:55/km) with 90sec jog. Should feel controlled. Run first, PT after.",paces:"4:55/km exactly · 160–167bpm"},
    {id:"w13-wed",day:"WED",tag:"quality",title:"Threshold Tempo",km:10,detail:"20min continuous threshold. Second quality session this peak week.",paces:"4:35–4:45/km · 168–174bpm"},
    {id:"w13-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:8,detail:"Easy run + upper/core PT. Protect legs for Saturday.",paces:"6:30–7:00/km easy"},
    {id:"w13-fri",day:"FRI",tag:"shake",title:"Short Shakeout",km:4,detail:"As short as possible. Legs need to be as fresh as possible for Saturday.",paces:"6:45–7:10/km · ≤142bpm"},
    {id:"w13-sat",day:"SAT",tag:"long",title:"PEAK LONG RUN — 32–34km",km:33,detail:"THE run. 5km easy → 22km @ goal MP → 6–8km easy. Full race-day fueling: gel every 30–35min from 30min. Most important session of the build. Arrive rested and focused.",paces:"MP: 4:55–5:05/km · Easy: 6:20–6:50/km · Fuel every 30–35min"},
    {id:"w13-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Full rest. The work is done. Let it absorb."},
  ]},
  {id:"w14",n:14,dates:"28 Sep–4 Oct",phase:"Race-Specific",theme:"Final Quality — Taper Incoming",targetKm:58,sessions:[
    {id:"w14-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:11,detail:"Post-peak Monday. Legs will feel heavy. Go slow.",paces:"6:30–7:15/km · ≤150bpm"},
    {id:"w14-tue",day:"TUE",tag:"quality",title:"Race-Pace Sharpener + Leg PT",km:10,detail:"3×2km @ race MP with 2min jog. Last significant quality session. Run first, PT after.",paces:"4:55/km · 160–167bpm"},
    {id:"w14-wed",day:"WED",tag:"quality",title:"Short Tempo",km:9,detail:"15min continuous threshold. Last proper tempo of the build.",paces:"4:35–4:45/km · 168–174bpm"},
    {id:"w14-thu",day:"THU",tag:"gym",title:"Run to PT — Upper + Core",km:7,detail:"Easy run + upper/core PT. Last heavy upper before taper.",paces:"6:30–7:00/km easy"},
    {id:"w14-fri",day:"FRI",tag:"shake",title:"Shakeout",km:5,detail:"Pre-long-run flush.",paces:"6:40–7:10/km · ≤145bpm"},
    {id:"w14-sat",day:"SAT",tag:"long",title:"Dress Rehearsal — 26km",km:26,detail:"5km easy → 16km @ exact race MP → 5km easy. Full race nutrition protocol. Final confidence builder.",paces:"MP: 4:55/km · Full fueling protocol"},
    {id:"w14-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day. Taper starts Monday."},
  ]},
  {id:"w15",n:15,dates:"5–11 Oct",phase:"Taper",theme:"Taper — Volume Down, Sharpness Stays",targetKm:40,isTaper:true,sessions:[
    {id:"w15-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:8,detail:"Volume dropping. Legs may feel odd — heavy or great. Both are normal taper responses.",paces:"6:20–7:00/km · ≤148bpm"},
    {id:"w15-tue",day:"TUE",tag:"quality",title:"Race-MP Sharpener + Light Leg PT",km:8,detail:"3×1km @ race MP. Short, sharp. Maintaining sharpness, not building fitness.",paces:"4:55/km · 160–167bpm"},
    {id:"w15-wed",day:"WED",tag:"easy",title:"Easy Z2 Run",km:7,detail:"Taper. Easy. Trust the process.",paces:"6:20–7:00/km · ≤148bpm"},
    {id:"w15-thu",day:"THU",tag:"gym",title:"Run to PT — Light Full Body",km:6,detail:"Easy run + light full body PT. Nothing heavy, nothing to failure. Last PT before race.",paces:"6:30–7:00/km easy"},
    {id:"w15-fri",day:"FRI",tag:"shake",title:"Shakeout + Strides",km:5,detail:"4×80m strides at end. Legs should feel snappy.",paces:"6:40–7:10/km · 4 strides"},
    {id:"w15-sat",day:"SAT",tag:"long",title:"Easy Medium Run — 16km",km:16,detail:"All easy. Last run of any real length.",paces:"6:20–6:50/km · ≤150bpm"},
    {id:"w15-sun",day:"SUN",tag:"rest",title:"Rest — Church",km:null,detail:"Rest day."},
  ]},
  {id:"w16",n:16,dates:"12–18 Oct",phase:"Taper",theme:"Race Week",targetKm:24,isTaper:true,sessions:[
    {id:"w16-mon",day:"MON",tag:"easy",title:"Easy Z2 Run",km:6,detail:"Short and controlled. You will want to do more. Don't.",paces:"6:20–7:00/km · ≤148bpm"},
    {id:"w16-tue",day:"TUE",tag:"quality",title:"Final Sharpener",km:6,detail:"2×1km @ race MP. Done. Confirm the legs remember the pace.",paces:"4:55/km · 160–167bpm"},
    {id:"w16-wed",day:"WED",tag:"easy",title:"Very Easy Run",km:5,detail:"Last proper training run. Enjoy it.",paces:"6:30–7:00/km · ≤145bpm"},
    {id:"w16-thu",day:"THU",tag:"shake",title:"Easy Shakeout",km:4,detail:"Very short. Just moving.",paces:"6:45–7:15/km"},
    {id:"w16-fri",day:"FRI",tag:"rest",title:"Full Rest",km:null,detail:"Rest. Final carb load: 80–100g carbs per meal. Kit laid out. Nothing on your feet except walking."},
    {id:"w16-sat",day:"SAT",tag:"rest",title:"Rest — Race Tomorrow",km:null,detail:"Relax. Walk only. Carb load done. Breakfast planned. Sleep early. You are ready."},
    {id:"w16-sun",day:"SUN",tag:"race",title:"RACE DAY — 18 OCTOBER",km:42.2,detail:"Sub-3:30. First 10km at 5:05–5:10/km — it will feel embarrassingly easy. Build through the middle. Hold form in the final 10km. Fuel every 30–35min from 30min. You have done every session. Trust it.",paces:"0–10km: 5:05–5:10/km · 10–30km: 4:58–5:02/km · 30–42km: hold form"},
  ]},
];

/* ── COMPONENT ── */
export default function MarathonSkeleton() {
  const [activeW, setActiveW] = useState("w1");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const [completed, setCompleted] = useState<Record<string,boolean>>({});
  const [km, setKm] = useState<Record<string,number>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [editKm, setEditKm] = useState<string|null>(null);
  const [editNote, setEditNote] = useState<string|null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<"idle"|"saving"|"saved"|"err">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    (async()=>{ const s=await load(); if(s){setCompleted(p=>({...p,...s.completed}));setKm(p=>({...p,...s.km}));setNotes(p=>({...p,...s.notes}));} setLoaded(true); })();
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    setSaving("saving");
    if(timer.current) clearTimeout(timer.current);
    timer.current=setTimeout(async()=>{ try{await save({completed,km,notes});setSaving("saved");}catch{setSaving("err");} },600);
    return()=>{ if(timer.current) clearTimeout(timer.current); };
  },[completed,km,notes,loaded]);

  const week = WEEKS.find(w=>w.id===activeW)!;

  const globalStats = useMemo(()=>{
    const totalKm=Object.values(km).reduce((a,b)=>a+b,0);
    const done=Object.values(completed).filter(Boolean).length;
    const total=WEEKS.reduce((a,w)=>a+w.sessions.length,0);
    const weeksStarted=WEEKS.filter(w=>w.sessions.some(s=>completed[s.id])).length;
    return {totalKm:Math.round(totalKm*10)/10,done,total,weeksStarted};
  },[km,completed]);

  const wStats = useMemo(()=>{
    const logged=week.sessions.reduce((s,x)=>completed[x.id]&&km[x.id]?s+km[x.id]:s,0);
    const done=week.sessions.filter(s=>completed[s.id]).length;
    const pct=Math.min(100,Math.round((logged/week.targetKm)*100));
    return {logged:Math.round(logged*10)/10,done,total:week.sessions.length,pct};
  },[week,completed,km]);

  const check=(id:string,plannedKm:number|null)=>{
    setCompleted(p=>{
      const n={...p,[id]:!p[id]};
      if(n[id]&&plannedKm!==null&&km[id]===undefined) setKm(k=>({...k,[id]:plannedKm}));
      return n;
    });
  };

  const wColor = week.isRace?"#fa5400":week.isPeak?"#fa5400":week.isTaper?"#bf5af2":week.isDeload?"#636366":PHASE_DOT[week.phase]||"#fa5400";

  return (
    <div style={{minHeight:"100vh",background:"#111",color:"#fff",fontFamily:"-apple-system,'Helvetica Neue',Arial,sans-serif",paddingBottom:80}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{height:3px;width:0}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        .pill{cursor:pointer;transition:opacity .12s}
        .pill:active{opacity:.7}
        .row{cursor:pointer;transition:background .1s}
        .row:hover{background:rgba(255,255,255,.04)}
        .chk{cursor:pointer;transition:transform .1s,background .12s,border-color .12s;border:none}
        .chk:active{transform:scale(.85)}
        .slide{animation:sl .15s ease}
        @keyframes sl{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        input[type=number]{-moz-appearance:textfield}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        textarea{font-family:inherit}
        button{border:none;cursor:pointer}
      `}</style>

      {/* ── TOP NAV ── */}
      <div style={{background:"#111",borderBottom:"1px solid #222",padding:"16px 20px 0",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#fa5400",textTransform:"uppercase",marginBottom:4}}>
                Marathon Build · 16 Weeks
              </div>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1}}>
                Sub-3:30
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#666",textTransform:"uppercase",marginBottom:3}}>
                {!loaded?"…":saving==="saving"?"Saving":"Saved ✓"}
              </div>
              <div style={{fontSize:11,color:"#555"}}>{globalStats.done}/{globalStats.total} sessions</div>
            </div>
          </div>

          {/* WEEK PILLS */}
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:12}}>
            {WEEKS.map(w=>{
              const active=w.id===activeW;
              const dot=w.isRace||w.isPeak?"#fa5400":w.isTaper?"#bf5af2":w.isDeload?"#636366":PHASE_DOT[w.phase];
              const done=w.sessions.filter(s=>completed[s.id]).length;
              const total=w.sessions.length;
              const pct=Math.round((done/total)*100);
              return(
                <button key={w.id} className="pill" onClick={()=>setActiveW(w.id)}
                  style={{flexShrink:0,minWidth:44,padding:"8px 10px",borderRadius:8,background:active?dot:"#1c1c1e",border:`1.5px solid ${active?dot:"#2c2c2e"}`,textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:active?"#fff":dot,textTransform:"uppercase",marginBottom:2}}>W{w.n}</div>
                  <div style={{fontSize:13,fontWeight:800,color:active?"#fff":"#aaa"}}>{w.targetKm}</div>
                  {pct>0&&pct<100&&<div style={{marginTop:3,height:2,background:"#333",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:dot,borderRadius:1}}/></div>}
                  {pct===100&&<div style={{marginTop:3,fontSize:8,color:"#30d158",fontWeight:700}}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"20px 20px 0"}}>

        {/* ── WEEK HERO ── */}
        <div style={{background:"#1c1c1e",borderRadius:16,padding:"20px",marginBottom:16,border:`1px solid #2c2c2e`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:wColor,textTransform:"uppercase"}}>
                  Week {week.n} · {week.phase}
                </span>
                {week.isDeload&&<span style={{fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 8px",borderRadius:20,background:"#2c2c2e",color:"#aaa",textTransform:"uppercase"}}>Deload</span>}
                {week.isPeak&&<span style={{fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 8px",borderRadius:20,background:"#3a1500",color:"#fa5400",textTransform:"uppercase"}}>Peak</span>}
                {week.isTaper&&<span style={{fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 8px",borderRadius:20,background:"#1c0a2e",color:"#bf5af2",textTransform:"uppercase"}}>Taper</span>}
                {week.isRace&&<span style={{fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 8px",borderRadius:20,background:"#3a0a00",color:"#fa5400",textTransform:"uppercase"}}>Race</span>}
              </div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.3,color:"#fff",lineHeight:1.2}}>{week.theme}</div>
              <div style={{fontSize:12,color:"#666",marginTop:4}}>{week.dates}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,lineHeight:1,color:wStats.pct>=100?"#30d158":"#fff"}}>
                {wStats.logged}
              </div>
              <div style={{fontSize:11,color:"#555",marginTop:2}}>of {week.targetKm} km</div>
              <div style={{fontSize:11,color:"#555",marginTop:1}}>{wStats.done}/{wStats.total} sessions</div>
            </div>
          </div>
          {/* progress bar */}
          <div style={{marginTop:14,height:3,background:"#2c2c2e",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${wStats.pct}%`,background:wColor,borderRadius:2,transition:"width .4s ease"}}/>
          </div>
        </div>

        {/* ── SESSIONS ── */}
        {week.sessions.map((s,i)=>{
          const isDone=!!completed[s.id];
          const isOpen=!!expanded[s.id];
          const dot=TAG[s.tag].dot;
          const isLast=i===week.sessions.length-1;
          return(
            <div key={s.id}>
              {/* DIVIDER */}
              {i>0&&<div style={{height:1,background:"#1c1c1e",margin:"0"}}/>}

              <div className="row" style={{background:isDone?"#0a0a0a":"transparent",borderRadius:isDone?8:0}} onClick={()=>setExpanded(p=>({...p,[s.id]:!p[s.id]}))}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0"}}>

                  {/* CHECK CIRCLE */}
                  <button className="chk" onClick={e=>{e.stopPropagation();check(s.id,s.km);}}
                    style={{width:28,height:28,borderRadius:"50%",background:isDone?dot:"transparent",border:`2px solid ${isDone?dot:"#333"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isDone&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L4.8 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>

                  {/* DAY DOT */}
                  <div style={{width:4,height:4,borderRadius:"50%",background:isDone?"#333":dot,flexShrink:0}}/>

                  {/* DAY */}
                  <div style={{width:28,flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:isDone?"#444":"#888",textTransform:"uppercase"}}>{s.day}</div>
                  </div>

                  {/* TITLE + TAG */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:isDone?"#444":"#fff",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.2}}>
                      {s.title}
                    </div>
                    <div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:isDone?"#333":dot,textTransform:"uppercase",marginTop:2}}>
                      {TAG[s.tag].label}
                    </div>
                  </div>

                  {/* KM */}
                  <div style={{flexShrink:0,textAlign:"right",minWidth:52}} onClick={e=>e.stopPropagation()}>
                    {s.km!==null?(
                      isDone&&editKm===s.id?(
                        <input type="number" step=".1" autoFocus defaultValue={km[s.id]??s.km}
                          onBlur={e=>{const v=parseFloat(e.target.value);setKm(k=>({...k,[s.id]:isNaN(v)?s.km!:v}));setEditKm(null);}}
                          onKeyDown={e=>{if(e.key==="Enter")(e.target as HTMLInputElement).blur();}}
                          style={{width:52,fontSize:15,fontWeight:800,textAlign:"right",background:"transparent",border:"none",borderBottom:`1px solid ${dot}`,color:"#fff",outline:"none",letterSpacing:-0.5}}/>
                      ):(
                        <div onClick={()=>isDone&&setEditKm(s.id)} style={{cursor:isDone?"text":"default"}}>
                          <span style={{fontSize:18,fontWeight:800,color:isDone?"#30d158":"#fff",letterSpacing:-0.5}}>{isDone?(km[s.id]??s.km):s.km}</span>
                          <span style={{fontSize:10,color:isDone?"#30d158":"#555",marginLeft:1}}>km</span>
                        </div>
                      )
                    ):<div style={{fontSize:13,color:"#333",fontWeight:700}}>—</div>}
                  </div>

                  {/* CHEVRON */}
                  <svg style={{flexShrink:0,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s ease"}} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* EXPANDED */}
                {isOpen&&(
                  <div className="slide" style={{padding:"0 0 16px 52px"}} onClick={e=>e.stopPropagation()}>
                    <p style={{fontSize:13,color:"#aaa",lineHeight:1.7,marginBottom:s.paces?10:0}}>{s.detail}</p>
                    {s.paces&&(
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#1c1c1e",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
                        <div style={{width:3,height:3,borderRadius:"50%",background:dot,flexShrink:0}}/>
                        <span style={{fontSize:11,fontWeight:600,letterSpacing:.5,color:"#888",textTransform:"uppercase"}}>Paces</span>
                        <span style={{fontSize:12,fontWeight:700,color:"#fff",letterSpacing:.3}}>{s.paces}</span>
                      </div>
                    )}
                    <div onClick={()=>setEditNote(editNote===s.id?null:s.id)}
                      style={{cursor:"text",fontSize:12,color:notes[s.id]?"#aaa":"#444",fontStyle:notes[s.id]?"normal":"italic",lineHeight:1.6,paddingTop:4,borderTop:"1px solid #222"}}>
                      {editNote===s.id?(
                        <textarea autoFocus defaultValue={notes[s.id]||""} placeholder="Add a session note…"
                          onBlur={e=>{setNotes(n=>({...n,[s.id]:e.target.value.trim()}));setEditNote(null);}}
                          style={{width:"100%",minHeight:60,fontSize:12,background:"#111",border:"none",color:"#aaa",outline:"none",resize:"vertical",lineHeight:1.6,marginTop:4}}/>
                      ):notes[s.id]||"Add a note…"}
                    </div>
                  </div>
                )}
              </div>
              {!isLast&&<div style={{height:1,background:"#1c1c1e"}}/>}
            </div>
          );
        })}

        {/* ── NAV BUTTONS ── */}
        <div style={{display:"flex",gap:10,marginTop:24}}>
          {week.n>1&&(
            <button onClick={()=>setActiveW(`w${week.n-1}`)}
              style={{flex:1,padding:"14px",borderRadius:12,background:"#1c1c1e",color:"#fff",fontSize:14,fontWeight:700,letterSpacing:.5}}>
              ← Week {week.n-1}
            </button>
          )}
          {week.n<16&&(
            <button onClick={()=>setActiveW(`w${week.n+1}`)}
              style={{flex:1,padding:"14px",borderRadius:12,background:"#fa5400",color:"#fff",fontSize:14,fontWeight:700,letterSpacing:.5}}>
              Week {week.n+1} →
            </button>
          )}
        </div>

        {/* ── ZONES ── */}
        <div style={{marginTop:24,background:"#1c1c1e",borderRadius:16,padding:"16px",border:"1px solid #2c2c2e"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#666",textTransform:"uppercase",marginBottom:12}}>Training Zones</div>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {[
              {n:"Recovery",p:"7:00+",h:"≤135",c:"#30d158"},
              {n:"Easy Z2",p:"6:20–7:00",h:"138–150",c:"#30d158"},
              {n:"Train MP",p:"5:05–5:20",h:"153–163",c:"#0a84ff"},
              {n:"Threshold",p:"4:35–4:48",h:"168–174",c:"#ff9f0a"},
              {n:"VO2",p:"4:22–4:38",h:"178–185",c:"#ff453a"},
              {n:"Race MP",p:"4:55",h:"163–167",c:"#fa5400"},
            ].map(z=>(
              <div key={z.n} style={{flex:"1 0 80px",minWidth:80,background:"#111",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid #2c2c2e`}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:z.c,margin:"0 auto 6px"}}/>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:.5,color:"#666",textTransform:"uppercase",marginBottom:3}}>{z.n}</div>
                <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>{z.p}</div>
                <div style={{fontSize:9,color:"#555",marginTop:2}}>{z.h}bpm</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop:12,fontSize:10,color:"#444",textAlign:"center",letterSpacing:.5,lineHeight:1.8,textTransform:"uppercase",paddingBottom:8}}>
          Tap to expand · Tap circle to log · Tap km to edit · Tap note to add
        </div>
      </div>
    </div>
  );
}
