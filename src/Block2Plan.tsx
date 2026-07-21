// eslint-disable @typescript-eslint/no-unused-vars
import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

const USER_ID = "default_user_block2";
interface Prog { completed: Record<string,boolean>; km: Record<string,number>; notes: Record<string,string>; }

async function loadData(): Promise<Prog|null> {
  try {
    const { data, error } = await supabase.from("progress").select("completed, km_logged, notes").eq("user_id", USER_ID).single();
    if (error || !data) return null;
    return { completed: data.completed || {}, km: data.km_logged || {}, notes: data.notes || {} };
  } catch { return null; }
}

async function saveData(d: Prog) {
  const { error } = await supabase.from("progress").upsert({ user_id: USER_ID, completed: d.completed, km_logged: d.km, notes: d.notes, updated_at: new Date().toISOString() });
  if (error) throw error;
}

type Tag = "easy"|"quality"|"long"|"rest"|"gym"|"shake";

const TAGS: Record<Tag,{label:string;color:string}> = {
  easy:    { label:"EASY RUN",  color:"#30d158" },
  quality: { label:"QUALITY",   color:"#fa5400" },
  long:    { label:"LONG RUN",  color:"#0a84ff" },
  rest:    { label:"REST",      color:"#48484a" },
  gym:     { label:"PT + RUN",  color:"#bf5af2" },
  shake:   { label:"SHAKEOUT",  color:"#ffd60a" },
};

const WU_EASY = [
  "2 min brisk walk — arms swinging, tall posture",
  "10 hip circles each direction — slow and deliberate",
  "10 leg swings forward/back each leg — relaxed pendulum",
  "10 lateral leg swings each leg",
  "10 clamshells each side — glute activation",
  "10 ankle circles each direction + 10 single-leg calf raises each side",
  "Begin running at 7:00/km for first 500m before settling into target pace",
];

const WU_QUALITY = [
  "PHT isometric holds × 4 reps each side — heel pressed into floor at 30° knee bend, hold 45sec, 15sec rest between",
  "2–3 min brisk walk — non-negotiable, do not skip",
  "10 hip circles each direction — slower and more deliberate than easy day",
  "10 leg swings forward/back + 10 lateral each leg",
  "15 glute bridges + 8 single-leg glute bridges each side (2sec hold at top)",
  "20 slow walking high knees + 20 slow bum kicks",
  "15 double-leg calf raises + 10 single-leg each side",
  "2km easy jog at 6:45–7:00/km — HR should be 130–140bpm before any quality work begins",
];

interface Session {
  id: string; day: string; date: string; tag: Tag;
  title: string; km: number|null; detail: string[];
  paces?: string; warmup?: "easy"|"quality";
}

interface Week {
  id: string; n: number; dates: string; theme: string;
  targetKm: number; focus: string; isDeload?: boolean;
  sessions: Session[];
}

const WEEKS: Week[] = [
  {
    id:"w5", n:5, dates:"27 Jul – 2 Aug",
    theme:"Raising the Ceiling", targetKm:65,
    focus:"Continuous tempo replaces interval reps on Tuesday. Long run grows to 25km with a 13km MP segment. All quality sessions standalone — no references needed from previous weeks.",
    sessions:[
      { id:"w5-mon", day:"MON", date:"27 Jul", tag:"easy", title:"Easy Z2 Run", km:9,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "All Z2 throughout. Run entirely by HR — if a hill or wind pushes you above 150bpm, slow down or walk until it settles.",
          "This is the first run back after the deload week. Legs should feel noticeably fresher. Don't get excited and run harder than this.",
          "Flat route preferred — Seapoint Promenade or similar. Arrive at Tuesday feeling genuinely fresh.",
        ]},
      { id:"w5-tue", day:"TUE", date:"28 Jul", tag:"quality", title:"Continuous Tempo + Leg PT", km:11,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Tempo: 4:42–4:52/km continuous · 168–174bpm",
        detail:[
          "Run to gym first — the run is your warm-up. Quality session before leg PT every Tuesday.",
          "Structure: 2km easy warm-up at 6:30–7:00/km → 20 minutes continuous at threshold pace (4:42–4:52/km) with no breaks → 2km easy cool-down.",
          "This is a different stimulus from interval reps. Sustained continuous tempo builds your ability to hold threshold pace when fatigued — directly relevant to the back half of the marathon. The 20 minutes should feel like controlled hard effort, not sprint effort.",
          "HR target during the tempo block: 168–174bpm. If HR climbs above 175bpm in the first 10 minutes, you started too fast — drop the pace by 5 sec/km.",
          "Leg-focused PT immediately after. Tell PT: continuous tempo run done, legs loaded today.",
        ]},
      { id:"w5-wed", day:"WED", date:"29 Jul", tag:"easy", title:"Easy Z2 — Tired Legs", km:8,
        warmup:"easy", paces:"6:20–7:00/km · ≤152bpm",
        detail:[
          "This run is meant to feel harder than Monday. Legs are carrying Tuesday's tempo and PT load. That's correct and expected.",
          "Run strictly by HR ceiling of 152bpm — not by pace. If the pace drops to 7:15–7:30/km to stay under the ceiling, that's fine.",
          "Do not try to match Monday's pace. The aerobic stimulus is still happening even at slower speeds.",
        ]},
      { id:"w5-thu", day:"THU", date:"30 Jul", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Run to gym at easy pace — this is also your warm-up, so arrive warm not tired.",
          "Upper body and core PT only today. Zero leg work — protecting Saturday's long run.",
          "Tell PT: long run Saturday with MP segment, no leg work today please.",
        ]},
      { id:"w5-fri", day:"FRI", date:"31 Jul", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short and flat. Purpose is to flush any residual Thursday stiffness before Saturday's long run.",
          "Should finish feeling like you barely ran. If it feels hard, cut to 4km without guilt.",
        ]},
      { id:"w5-sat", day:"SAT", date:"1 Aug", tag:"long", title:"Long Run + MP Segment — 25km", km:25,
        warmup:"quality", paces:"Easy sections: 6:20–6:50/km · MP: 5:04–5:15/km · 160–167bpm",
        detail:[
          "Structure: 5km easy warm-up → 13km @ training MP → 7km easy cool-down.",
          "Set up a custom workout on your Apple Watch with pace alerts at 5:04–5:15/km for the MP segment. When the watch alerts you that you're going faster than 5:04/km, back off.",
          "The training MP of 5:04–5:15/km should feel comfortably hard — controlled effort, not survival mode. HR should settle into 160–167bpm during the MP block by km 2 of that segment.",
          "Eat something small 60–90 minutes before: oats with honey, banana and toast, or pap with honey. Do not run fasted.",
          "Fueling: gel at 40 minutes, gel at 80 minutes. Water every 15–20 minutes throughout.",
          "Finish feeling like you could run another 3–4km. That's the correct state.",
        ]},
      { id:"w5-sun", day:"SUN", date:"2 Aug", tag:"rest", title:"Rest — Church", km:null,
        detail:["Full rest. Non-negotiable every Sunday throughout the build."]},
    ]
  },
  {
    id:"w6", n:6, dates:"3–9 Aug",
    theme:"Specificity Increasing", targetKm:68,
    focus:"Hill repeats replace tempo on Tuesday. Long run grows to 27km with a 15km MP segment. This is the longest MP block in the plan so far.",
    sessions:[
      { id:"w6-mon", day:"MON", date:"3 Aug", tag:"easy", title:"Easy Z2 Run", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "Aerobic base accumulation. All Z2 throughout — run by HR not pace.",
          "Tuesday has hill repeats which load the legs differently from flat running. Keep Monday genuinely easy so you arrive at Tuesday fresh.",
        ]},
      { id:"w6-tue", day:"TUE", date:"4 Aug", tag:"quality", title:"Hill Repeats + Leg PT", km:11,
        warmup:"quality", paces:"Uphill effort: ~175–182bpm · Recovery: walk back down",
        detail:[
          "Run to gym first — run to the base of your hill as part of the warm-up. Quality session before leg PT.",
          "Structure: 2km easy jog to hill base → 6×90 seconds uphill at hard effort → walk back down for full recovery between each rep → 2km easy jog cool-down to gym.",
          "The Camps Bay climb is ideal. Run each uphill rep at hard, controlled effort — you should be working hard but not sprinting. HR will reach 175–182bpm by the top of each rep.",
          "Walk back down after every rep — the downhill is not the workout. Full recovery between each uphill effort.",
          "Hill repeats build strength-endurance in the glutes, calves, and hip flexors with lower injury risk than flat speed work. They also directly prepare your legs for the opening 8–9km of the Nelson Mandela Marathon course.",
          "Leg-focused PT immediately after. Tell PT: hill repeats done, legs significantly loaded.",
        ]},
      { id:"w6-wed", day:"WED", date:"5 Aug", tag:"easy", title:"Easy Z2 — Tired Legs", km:8,
        warmup:"easy", paces:"6:20–7:00/km · ≤152bpm",
        detail:[
          "Post-hills easy run. Legs will be noticeably heavy from the hill reps and PT. That's expected.",
          "Run by HR ceiling: 152bpm. Accept whatever pace that produces today.",
          "Active recovery — the easy running promotes blood flow through the worked muscles without adding more stress.",
        ]},
      { id:"w6-thu", day:"THU", date:"6 Aug", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym. Upper body and core PT only.",
          "Saturday is 27km with a 15km MP block — the longest MP segment of the build so far. Tell PT: big long run Saturday, no leg work today.",
        ]},
      { id:"w6-fri", day:"FRI", date:"7 Aug", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short flat shakeout. Pre-long-run flush.",
          "Eat something before Saturday's run — don't go into a 27km run fasted. Plan your pre-run meal tonight.",
        ]},
      { id:"w6-sat", day:"SAT", date:"8 Aug", tag:"long", title:"Long Run + MP Segment — 27km", km:27,
        warmup:"quality", paces:"Easy sections: 6:20–6:50/km · MP: 5:00–5:12/km · 160–167bpm",
        detail:[
          "Structure: 5km easy warm-up → 15km @ training MP → 7km easy cool-down.",
          "This is the longest MP segment of the build so far. Custom watch workout is essential — set pace alerts at 5:00–5:12/km. When you go below 5:00/km, the watch alerts you. Back off.",
          "The MP block should feel like controlled hard effort. HR settling at 160–167bpm by km 2 of the MP section is the target. If HR climbs continuously through the MP block without stabilising, your pace is too fast.",
          "Eat 60–90 min before. Fueling: gel at 40min, gel at 80min, gel at 115min. Water every 15–20min throughout.",
          "Finish the cool-down feeling worked but not broken. If the legs are giving out in the final easy km, the MP pace was too aggressive.",
        ]},
      { id:"w6-sun", day:"SUN", date:"9 Aug", tag:"rest", title:"Rest — Church", km:null,
        detail:["Full rest."]},
    ]
  },
  {
    id:"w7", n:7, dates:"10–16 Aug",
    theme:"Second Quality Session Introduced", targetKm:72,
    focus:"A second quality session appears on Wednesday for the first time. Tuesday returns to threshold intervals. Long run is 28km — peak of Block 2. Week 8 is a deload.",
    sessions:[
      { id:"w7-mon", day:"MON", date:"10 Aug", tag:"easy", title:"Easy Z2 Run", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "All Z2. Two quality sessions this week — Monday and Wednesday both need to be genuinely easy to protect the quality work.",
          "Run by HR not pace. If you feel good, resist the urge to push — the sessions on Tuesday and Wednesday need fresh legs.",
        ]},
      { id:"w7-tue", day:"TUE", date:"11 Aug", tag:"quality", title:"Threshold Intervals + Leg PT", km:11,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:42–4:52/km · 168–174bpm",
        detail:[
          "Run to gym first on fresh legs. Quality session before leg PT — this is the standing Tuesday pattern.",
          "Structure: 2km easy warm-up at 6:30–7:00/km → 4×1km at 4:42–4:52/km with 90 seconds jog recovery between each rep → 2km easy cool-down.",
          "Each rep should be run at 4:42–4:52/km — aim for consistency across all 4 reps rather than trying to get faster with each one. All 4 reps should land within 3–4 seconds of each other.",
          "HR target during reps: 168–174bpm. Touching 174–175bpm on rep 3 and 4 due to accumulated fatigue is expected and not a concern.",
          "3-2 breathing pattern on every rep: inhale for 3 footstrikes, exhale for 2. This directly addresses the stitch and breathing issues from previous races.",
          "Leg-focused PT immediately after.",
          "Week 8 is a deload — this is the right time to introduce a second quality session since recovery follows immediately next week.",
        ]},
      { id:"w7-wed", day:"WED", date:"12 Aug", tag:"quality", title:"★ 2nd Quality Session — Fartlek", km:10,
        warmup:"quality", paces:"Moderate: 5:10–5:20/km · Easy: 6:20–7:00/km",
        detail:[
          "SECOND QUALITY SESSION INTRODUCED — this is the first time Wednesday carries a quality stimulus.",
          "After a full quality warm-up, run 25 minutes of fartlek: alternate 3 minutes at moderate effort (5:10–5:20/km, approximately 155–163bpm) with 2 minutes easy (6:20–7:00/km) repeated throughout.",
          "Fartlek means 'speed play' — the transitions don't need to be perfectly timed. Run by feel and terrain. If a hill arrives during an easy interval, walk it. If a flat section comes during a moderate interval, push into it.",
          "This session develops pace versatility and aerobic range without the precision demand of intervals. The alternating effort also builds your ability to recover while still moving — a key marathon skill.",
          "This is a lower-stress quality stimulus than Tuesday's threshold session — the easy intervals provide partial recovery throughout.",
          "Include a proper warm-up and a 1–2km easy cool-down.",
        ]},
      { id:"w7-thu", day:"THU", date:"13 Aug", tag:"gym", title:"Run to PT — Upper + Core", km:8,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym. Upper body and core PT only.",
          "Two quality sessions behind you this week plus a big long run coming Saturday. Legs need protecting today. Tell PT: upper and core only, no legs.",
        ]},
      { id:"w7-fri", day:"FRI", date:"14 Aug", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Two quality sessions this week — Friday must be genuinely short and easy.",
          "Legs should be feeling worked. That's correct. Tomorrow is 28km — your biggest long run yet.",
        ]},
      { id:"w7-sat", day:"SAT", date:"15 Aug", tag:"long", title:"Long Run + MP Segment — 28km", km:28,
        warmup:"quality", paces:"Easy sections: 6:20–6:50/km · MP: 5:00–5:10/km · 160–167bpm",
        detail:[
          "Structure: 5km easy warm-up → 16km @ training MP → 7km easy cool-down.",
          "This is the peak long run of Block 2 and the biggest run of the build so far. Treat it with the respect it deserves — proper fueling the night before, proper pre-run meal 90 minutes out, custom watch workout set up the night before.",
          "Set Apple Watch custom workout with pace alerts at 5:00–5:10/km for the MP segment. When it alerts you that you're faster than 5:00/km, back off. Discipline here matters more than heroics.",
          "Eat 60–90 min before. Fueling: gel at 40min, gel at 80min, gel at 115min, gel at 150min. Water every 15–20min.",
          "The cool-down should feel genuinely easy — if you're grinding in the final 7km, the MP section was too fast.",
          "Deload follows next week. Run this one well and earn the rest.",
        ]},
      { id:"w7-sun", day:"SUN", date:"16 Aug", tag:"rest", title:"Rest — Church", km:null,
        detail:["Full rest. Peak of Block 2 done. Deload next week is well-earned."]},
    ]
  },
  {
    id:"w8", n:8, dates:"17–23 Aug",
    theme:"Deload — Absorb Block 2", targetKm:40,
    isDeload:true,
    focus:"Volume drops significantly. Zero running intensity this week. PT can go harder since running load is low. Arrive at Week 9 fresh and hungry.",
    sessions:[
      { id:"w8-mon", day:"MON", date:"17 Aug", tag:"easy", title:"Easy Z2 Run", km:5,
        warmup:"easy", paces:"6:30–7:00/km · ≤148bpm",
        detail:[
          "Short and easy. Legs should feel notably tired after last week's double quality + 28km long run.",
          "Notice how the fatigue sits — heavy but earned. That feeling is three weeks of real work in your legs.",
          "Just 5km today. Don't add extra even if you feel good.",
        ]},
      { id:"w8-tue", day:"TUE", date:"18 Aug", tag:"gym", title:"Run to PT + Legs", km:6,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym (6km). No quality running session this week — the run is just the commute.",
          "Deload means reduced running load, not reduced strength. PT can push legs properly this week.",
          "Good week for progressive overload on glute work, single-leg stability, isometric hamstring holds, and calf raises — the injury prevention pillars.",
        ]},
      { id:"w8-wed", day:"WED", date:"19 Aug", tag:"easy", title:"Easy Z2 + Strides", km:6,
        warmup:"easy", paces:"Main run: 6:30–7:00/km · Strides: ~4:20/km effort, fully relaxed",
        detail:[
          "Easy 6km run, then in the final 800m: 4×80m strides.",
          "Strides: accelerate smoothly to about 5K effort over 80m, stay completely relaxed and tall, walk back to the start. 60 seconds between each.",
          "This is neuromuscular maintenance only — keeping fast-twitch fibres awake during the deload without accumulating any meaningful aerobic fatigue.",
          "Legs should feel noticeably lighter this week compared to last Wednesday.",
        ]},
      { id:"w8-thu", day:"THU", date:"20 Aug", tag:"gym", title:"Run to PT — Upper + Core", km:6,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym (6km). Upper body and core PT.",
          "Week 9 starts the race-specific phase — you want to arrive there genuinely fresh.",
        ]},
      { id:"w8-fri", day:"FRI", date:"21 Aug", tag:"shake", title:"Easy Shakeout", km:4,
        warmup:"easy", paces:"6:45–7:15/km · ≤140bpm",
        detail:[
          "4km flat shakeout. Shortest shakeout of the build.",
          "Legs should feel lighter and springier than any week in Block 2. If they do — the deload is working exactly as it should.",
        ]},
      { id:"w8-sat", day:"SAT", date:"22 Aug", tag:"long", title:"Easy Long Run — 13km", km:13,
        warmup:"easy", paces:"6:20–6:50/km · ≤150bpm",
        detail:[
          "All easy. Every kilometre. No MP segment and no temptation to add one.",
          "This run is purely to keep the aerobic habit alive and maintain movement without adding training stress.",
          "Finish feeling like you could run another 8–10km easily. That's the correct state going into the race-specific block in Week 9.",
          "Fueling: 1 gel at 50min if running that long. Water as usual.",
        ]},
      { id:"w8-sun", day:"SUN", date:"23 Aug", tag:"rest", title:"Rest — Church", km:null,
        detail:["Full rest. Race-specific phase begins Monday. Arrive fresh and motivated."]},
    ]
  },
];

export default function Block2Plan() {
  const [activeW, setActiveW] = useState("w5");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const [showWU, setShowWU] = useState<Record<string,boolean>>({});
  const [completed, setCompleted] = useState<Record<string,boolean>>({});
  const [km, setKm] = useState<Record<string,number>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [editKm, setEditKm] = useState<string|null>(null);
  const [editNote, setEditNote] = useState<string|null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"err">("idle");

  useEffect(() => {
    (async () => {
      const s = await loadData();
      if (s) { setCompleted(p=>({...p,...s.completed})); setKm(p=>({...p,...s.km})); setNotes(p=>({...p,...s.notes})); }
    })();
  }, []);

  const doSave = async () => {
    setSaveStatus("saving");
    try { await saveData({ completed, km, notes }); setSaveStatus("saved"); setDirty(false); setTimeout(()=>setSaveStatus("idle"), 2500); }
    catch { setSaveStatus("err"); }
  };

  const week = WEEKS.find(w => w.id === activeW)!;

  const wStats = useMemo(() => {
    const logged = week.sessions.reduce((s,x)=>completed[x.id]&&km[x.id]?s+km[x.id]:s, 0);
    const done = week.sessions.filter(s=>completed[s.id]).length;
    const pct = Math.min(100, Math.round((logged/week.targetKm)*100));
    return { logged: Math.round(logged*10)/10, done, total: week.sessions.length, pct };
  }, [week, completed, km]);

  const totalKm = useMemo(() => Math.round(Object.values(km).reduce((a,b)=>a+b,0)*10)/10, [km]);
  const totalDone = useMemo(() => Object.values(completed).filter(Boolean).length, [completed]);
  const totalSessions = WEEKS.reduce((a,w)=>a+w.sessions.length, 0);

  const check = (id: string, plannedKm: number|null) => {
    setCompleted(p => {
      const n = {...p, [id]: !p[id]};
      if (n[id] && plannedKm !== null && km[id] === undefined) setKm(k=>({...k,[id]:plannedKm}));
      return n;
    });
    setDirty(true);
  };

  const wColor = week.isDeload ? "#636366" : "#0a84ff";

  return (
    <div style={{minHeight:"100vh",background:"#111",color:"#fff",fontFamily:"-apple-system,'Helvetica Neue',Arial,sans-serif",paddingBottom:80}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{height:3px;width:0}
        ::-webkit-scrollbar-thumb{background:#2c2c2e;border-radius:2px}
        .tap{cursor:pointer;transition:opacity .12s;border:none}
        .tap:active{opacity:.65}
        .row{transition:background .1s;cursor:pointer}
        .row:hover{background:rgba(255,255,255,.03)}
        .chk{cursor:pointer;transition:transform .1s;border:none;background:transparent}
        .chk:active{transform:scale(.82)}
        .fi{animation:fi .15s ease}
        @keyframes fi{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        input[type=number]{-moz-appearance:textfield}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        textarea{font-family:inherit}
        button{border:none;cursor:pointer;font-family:inherit}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{background:"#111",borderBottom:"1px solid #1c1c1e",padding:"18px 20px 0",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0a84ff",textTransform:"uppercase",marginBottom:5}}>Development Phase · Weeks 5–8</div>
              <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.8,lineHeight:1}}>27 Jul – 23 Aug</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#30d158",letterSpacing:-0.3}}>{totalKm}km</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:2}}>{totalDone}/{totalSessions} sessions</div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={doSave}
            style={{width:"100%",padding:"12px",borderRadius:10,marginBottom:14,background:saveStatus==="err"?"#ff453a":saveStatus==="saved"?"#30d158":"#0a84ff",border:"none",color:"#fff",fontSize:13,fontWeight:800,letterSpacing:0.5,cursor:"pointer"}}>
            {saveStatus==="saving"?"SAVING…":saveStatus==="err"?"⚠ SAVE FAILED — TAP TO RETRY":saveStatus==="saved"?"✓ SAVED":"SAVE CHANGES"}
          </button>

          {/* WEEK TABS */}
          <div style={{display:"flex",gap:6,paddingBottom:14}}>
            {WEEKS.map(w => {
              const active = w.id === activeW;
              const col = w.isDeload ? "#636366" : "#0a84ff";
              const done = w.sessions.filter(s=>completed[s.id]).length;
              const pct = Math.round((done/w.sessions.length)*100);
              return (
                <button key={w.id} className="tap" onClick={()=>setActiveW(w.id)}
                  style={{flex:1,padding:"10px 6px",borderRadius:10,background:active?col:"#1c1c1e",border:`1.5px solid ${active?col:"#2c2c2e"}`,textAlign:"center"}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:1.5,color:active?"rgba(255,255,255,.7)":col,textTransform:"uppercase",marginBottom:2}}>
                    {w.isDeload?"Deload":`Week ${w.n}`}
                  </div>
                  <div style={{fontSize:17,fontWeight:800,color:active?"#fff":"#888",letterSpacing:-0.3}}>
                    {w.targetKm}<span style={{fontSize:9,color:active?"rgba(255,255,255,.5)":"#48484a"}}>km</span>
                  </div>
                  {pct>0&&pct<100&&<div style={{marginTop:4,height:2,background:"rgba(255,255,255,.1)",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:active?"rgba(255,255,255,.7)":col,borderRadius:1}}/></div>}
                  {pct===100&&<div style={{marginTop:3,fontSize:8,fontWeight:700,color:active?"#fff":"#30d158",letterSpacing:1}}>DONE ✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"16px 20px 0"}}>

        {/* WEEK HERO */}
        <div style={{background:"#1c1c1e",borderRadius:16,padding:"18px",marginBottom:12,border:"1px solid #2c2c2e"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:wColor,textTransform:"uppercase"}}>Week {week.n} · Development</span>
                {week.isDeload&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:20,background:"#2c2c2e",color:"#636366",textTransform:"uppercase"}}>Deload</span>}
              </div>
              <div style={{fontSize:19,fontWeight:800,letterSpacing:-0.4,lineHeight:1.2,color:"#fff"}}>{week.theme}</div>
              <div style={{fontSize:11,color:"#48484a",marginTop:4}}>{week.dates}</div>
              <div style={{fontSize:12,color:"#636366",marginTop:10,lineHeight:1.65,borderLeft:`2px solid ${wColor}`,paddingLeft:10}}>{week.focus}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:36,fontWeight:800,letterSpacing:-2,lineHeight:1,color:wStats.pct>=100?"#30d158":"#fff"}}>{wStats.logged}</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:3}}>/ {week.targetKm}km</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:1}}>{wStats.done}/{wStats.total}</div>
            </div>
          </div>
          <div style={{marginTop:14,height:3,background:"#2c2c2e",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${wStats.pct}%`,background:wColor,borderRadius:2,transition:"width .4s ease"}}/>
          </div>
        </div>

        {/* SESSIONS */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {week.sessions.map(s => {
            const isDone = !!completed[s.id];
            const isOpen = !!expanded[s.id];
            const isWUOpen = !!showWU[s.id];
            const meta = TAGS[s.tag];
            const warmupSteps = s.warmup==="quality" ? WU_QUALITY : s.warmup==="easy" ? WU_EASY : null;

            return (
              <div key={s.id} style={{borderRadius:12,overflow:"hidden",border:`1px solid ${isOpen?"#3a3a3c":"#2c2c2e"}`,background:isDone?"#0d0d0d":"#1c1c1e"}}>

                {/* MAIN ROW */}
                <div className="row" style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px"}}
                  onClick={()=>setExpanded(p=>({...p,[s.id]:!p[s.id]}))}>

                  <button className="chk" onClick={e=>{e.stopPropagation();check(s.id,s.km);}}
                    style={{width:28,height:28,borderRadius:"50%",background:isDone?meta.color:"transparent",border:`2px solid ${isDone?meta.color:"#3a3a3c"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isDone&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L4.8 9L10 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>

                  <div style={{width:38,flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:isDone?"#3a3a3c":meta.color,textTransform:"uppercase"}}>{s.day}</div>
                    <div style={{fontSize:9,color:"#3a3a3c",marginTop:1}}>{s.date}</div>
                  </div>

                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",padding:"2px 7px",borderRadius:4,background:isDone?"#1a1a1a":`${meta.color}22`,color:isDone?"#3a3a3c":meta.color,flexShrink:0,whiteSpace:"nowrap"}}>{meta.label}</div>

                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:isDone?"#3a3a3c":"#fff",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.2}}>{s.title}</div>
                    {s.paces&&!isOpen&&<div style={{fontSize:9,color:"#48484a",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.paces}</div>}
                  </div>

                  <div style={{flexShrink:0,textAlign:"right",minWidth:56}} onClick={e=>e.stopPropagation()}>
                    {s.km!==null?(
                      isDone&&editKm===s.id?(
                        <input type="number" step=".1" autoFocus defaultValue={km[s.id]??s.km}
                          onBlur={e=>{const v=parseFloat(e.target.value);setKm(k=>({...k,[s.id]:isNaN(v)?s.km!:v}));setEditKm(null);setDirty(true);}}
                          onKeyDown={e=>{if(e.key==="Enter")(e.target as HTMLInputElement).blur();}}
                          style={{width:52,fontSize:16,fontWeight:800,textAlign:"right",background:"transparent",border:"none",borderBottom:`1px solid ${meta.color}`,color:"#fff",outline:"none",letterSpacing:-0.5}}/>
                      ):(
                        <div onClick={()=>isDone&&setEditKm(s.id)} style={{cursor:isDone?"text":"default"}}>
                          <span style={{fontSize:22,fontWeight:800,color:isDone?"#30d158":"#fff",letterSpacing:-1}}>{isDone?(km[s.id]??s.km):s.km}</span>
                          <span style={{fontSize:10,color:isDone?"#30d158":"#555",marginLeft:1}}>km</span>
                        </div>
                      )
                    ):<span style={{fontSize:14,color:"#2c2c2e"}}>—</span>}
                  </div>

                  <svg style={{flexShrink:0,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s ease"}} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="#48484a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* EXPANDED */}
                {isOpen&&(
                  <div className="fi" style={{padding:"0 16px 16px",borderTop:"1px solid #2c2c2e"}} onClick={e=>e.stopPropagation()}>

                    {s.paces&&(
                      <div style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:8,background:"#111",borderRadius:8,padding:"8px 12px",border:"1px solid #2c2c2e",marginBottom:14}}>
                        <div style={{width:4,height:4,borderRadius:"50%",background:meta.color,flexShrink:0}}/>
                        <span style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#636366",textTransform:"uppercase"}}>Paces</span>
                        <span style={{fontSize:12,fontWeight:700,color:"#fff",letterSpacing:0.2}}>{s.paces}</span>
                      </div>
                    )}
                    {!s.paces&&<div style={{marginTop:14}}/>}

                    <div style={{marginBottom:14}}>
                      {s.detail.map((line,i)=>(
                        <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:meta.color,flexShrink:0,marginTop:7}}/>
                          <p style={{fontSize:13,color:"#aeaeb2",lineHeight:1.65}}>{line}</p>
                        </div>
                      ))}
                    </div>

                    {warmupSteps&&s.tag!=="rest"&&(
                      <div style={{marginBottom:14}}>
                        <button className="tap" onClick={()=>setShowWU(p=>({...p,[s.id]:!p[s.id]}))}
                          style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"#111",padding:"10px 14px",borderRadius:10,border:"1px solid #2c2c2e",textAlign:"left"}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:"#ffd60a",flexShrink:0}}/>
                          <span style={{flex:1,fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#ffd60a",textTransform:"uppercase"}}>
                            {s.warmup==="quality"?"Quality Warm-Up — 10–12 min":"Easy Warm-Up — 6 min"}
                          </span>
                          <svg style={{transform:isWUOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .15s",flexShrink:0}} width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 3.5L5 6.5L8.5 3.5" stroke="#ffd60a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {isWUOpen&&(
                          <div className="fi" style={{marginTop:4,background:"#111",borderRadius:10,padding:"12px 14px",border:"1px solid #2c2c2e"}}>
                            {warmupSteps.map((step,i)=>(
                              <div key={i} style={{display:"flex",gap:10,marginBottom:i<warmupSteps.length-1?10:0,alignItems:"flex-start"}}>
                                <span style={{fontSize:9,fontWeight:700,color:"#ffd60a",flexShrink:0,width:14,textAlign:"right",marginTop:3}}>{i+1}</span>
                                <p style={{fontSize:12,color:"#636366",lineHeight:1.65}}>{step}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{borderTop:"1px solid #2c2c2e",paddingTop:12}}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:"#48484a",textTransform:"uppercase",marginBottom:8}}>Session Note</div>
                      {editNote===s.id?(
                        <textarea autoFocus defaultValue={notes[s.id]||""} placeholder="How did it go? HR, pace, how you felt…"
                          onBlur={e=>{setNotes(n=>({...n,[s.id]:e.target.value.trim()}));setEditNote(null);setDirty(true);}}
                          style={{width:"100%",minHeight:68,fontSize:13,background:"#111",border:"1px solid #2c2c2e",borderRadius:8,color:"#aeaeb2",outline:"none",resize:"vertical",lineHeight:1.65,padding:"10px 12px"}}/>
                      ):(
                        <div onClick={()=>setEditNote(s.id)} style={{cursor:"text",fontSize:13,color:notes[s.id]?"#aeaeb2":"#3a3a3c",fontStyle:notes[s.id]?"normal":"italic",lineHeight:1.65,minHeight:24}}>
                          {notes[s.id]||"Tap to add a note…"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NAV */}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          {week.n>5&&<button className="tap" onClick={()=>setActiveW(`w${week.n-1}`)} style={{flex:1,padding:"15px",borderRadius:12,background:"#1c1c1e",color:"#fff",fontSize:14,fontWeight:700,border:"1px solid #2c2c2e"}}>← Week {week.n-1}</button>}
          {week.n<8&&<button className="tap" onClick={()=>setActiveW(`w${week.n+1}`)} style={{flex:1,padding:"15px",borderRadius:12,background:"#0a84ff",color:"#fff",fontSize:14,fontWeight:700}}>Week {week.n+1} →</button>}
        </div>

        {/* ZONES */}
        <div style={{marginTop:20,background:"#1c1c1e",borderRadius:16,padding:"14px",border:"1px solid #2c2c2e"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,color:"#48484a",textTransform:"uppercase",marginBottom:12}}>Training Zones · Verified 8 June 2026</div>
          <div style={{display:"flex",gap:4,overflowX:"auto"}}>
            {[
              {n:"Recovery",p:"7:00+",h:"≤135",c:"#30d158"},
              {n:"Easy Z2",p:"6:20–7:00",h:"138–150",c:"#30d158"},
              {n:"Train MP",p:"5:04–5:15",h:"160–167",c:"#0a84ff"},
              {n:"Threshold",p:"4:42–4:52",h:"168–174",c:"#ff9f0a"},
              {n:"Race MP",p:"4:55",h:"160–167",c:"#fa5400"},
            ].map(z=>(
              <div key={z.n} style={{flex:"1 0 70px",minWidth:70,background:"#111",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid #2c2c2e"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:z.c,margin:"0 auto 5px"}}/>
                <div style={{fontSize:7.5,fontWeight:700,letterSpacing:.5,color:"#48484a",textTransform:"uppercase",marginBottom:3}}>{z.n}</div>
                <div style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>{z.p}</div>
                <div style={{fontSize:8.5,color:"#3a3a3c",marginTop:2}}>{z.h}bpm</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:10,fontSize:9,color:"#3a3a3c",textAlign:"center",letterSpacing:1,lineHeight:2,textTransform:"uppercase",paddingBottom:8}}>
          Tap circle to log · Tap km to edit actual · Warmup inside each session · Save changes above
        </div>
      </div>
    </div>
  );
}
