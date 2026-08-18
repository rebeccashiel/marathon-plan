// eslint-disable @typescript-eslint/no-unused-vars
import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

const USER_ID = "default_user_block3";
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

type Tag = "easy"|"quality"|"long"|"rest"|"gym"|"shake"|"race";

const TAGS: Record<Tag,{label:string;color:string}> = {
  easy:    { label:"EASY RUN",  color:"#30d158" },
  quality: { label:"QUALITY",   color:"#fa5400" },
  long:    { label:"LONG RUN",  color:"#0a84ff" },
  rest:    { label:"REST",      color:"#48484a" },
  gym:     { label:"PT + RUN",  color:"#bf5af2" },
  shake:   { label:"SHAKEOUT",  color:"#ffd60a" },
  race:    { label:"RACE DAY",  color:"#fa5400" },
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
  targetKm: number; focus: string; isDeload?: boolean; isRace?: boolean;
  sessions: Session[];
}

const WEEKS: Week[] = [
  {
    id:"w9", n:9, dates:"24–30 Aug",
    theme:"Marathon Specificity Begins", targetKm:68,
    focus:"First quality sessions at actual race MP (4:55/km) rather than training MP. Long run grows to 29km with 17km MP segment. Two quality sessions per week continues.",
    sessions:[
      { id:"w9-mon", day:"MON", date:"24 Aug", tag:"easy", title:"Easy Z2 Run", km:9,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "Back fresh from the Week 8 deload. All Z2 throughout — run entirely by HR.",
          "Two quality sessions this week so easy days must be genuinely easy. Don't let the freshness tempt you into running harder than this.",
          "Flat route preferred. Arrive at Tuesday feeling genuinely ready to work.",
        ]},
      { id:"w9-tue", day:"TUE", date:"25 Aug", tag:"quality", title:"Race-MP Intervals + Leg PT", km:11,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:50–5:00/km · 160–167bpm",
        detail:[
          "Run to gym first on fresh legs. Quality session before leg PT — standing Tuesday pattern.",
          "Structure: 2km easy warm-up → 4×2km at race-target MP (4:50–5:00/km) with 2 minutes jog recovery between each rep → 2km easy cool-down.",
          "This is the first session at actual goal race pace rather than training MP. The effort should feel controlled-hard — sustainable, not survival. If HR climbs above 170bpm in the first rep, you started too fast. Back off to 5:00/km.",
          "Set Apple Watch pace alert at 4:50–5:00/km for the reps. When it alerts you below 4:50/km, back off immediately.",
          "3-2 breathing pattern throughout the reps: inhale 3 footstrikes, exhale 2. This prevents the stitch pattern from previous long runs.",
          "Leg-focused PT immediately after. Tell PT: race-pace intervals done, legs under significant load today.",
        ]},
      { id:"w9-wed", day:"WED", date:"26 Aug", tag:"quality", title:"Continuous Tempo", km:8,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Tempo: 4:40–5:00/km continuous · 168–174bpm",
        detail:[
          "After a full quality warm-up, run 25 minutes continuous at threshold pace with no breaks.",
          "This is a different stimulus from Tuesday's broken reps — sustained effort tests your ability to hold hard pace when fatigued from yesterday.",
          "HR target: 168–174bpm throughout. If HR climbs above 175bpm in the first 10 minutes, you started too fast — drop 10 sec/km.",
          "Include 1km easy cool-down at the end.",
        ]},
      { id:"w9-thu", day:"THU", date:"27 Aug", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym. Upper body and core PT only. Zero leg work — protecting Saturday's 29km long run.",
          "Tell PT: two quality sessions behind me this week, big long run Saturday — no legs today.",
        ]},
      { id:"w9-fri", day:"FRI", date:"28 Aug", tag:"shake", title:"Shakeout", km:4,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short flat shakeout. Pre-long-run flush.",
          "Set up the Apple Watch custom workout tonight for Saturday's long run. Pace alert 5:00–5:10/km for the MP segment.",
          "Prep overnight oats tonight: 85g Jungle Oats, 200ml low-fat milk, 2 tbsp Greek yogurt, 1 tbsp honey, 1–2 tsp cinnamon. Add banana in the morning. Eat 90 minutes before start.",
        ]},
      { id:"w9-sat", day:"SAT", date:"29 Aug", tag:"long", title:"Long Run + Extended MP — 29km", km:29,
        warmup:"quality", paces:"Easy: 6:20–6:50/km · MP: 5:00–5:10/km · 160–167bpm",
        detail:[
          "Structure: 5km easy warm-up → 17km @ race-approaching MP → 7km easy cool-down.",
          "Custom Apple Watch workout essential — pace alerts at 5:00–5:10/km for the MP segment. When it alerts below 5:00/km, back off. The pacing discipline is the workout.",
          "Start the MP segment at 5:10/km deliberately for the first 3km even if it feels easy. Let HR settle before building.",
          "3-2 breathing from km 8 of the MP segment onwards as a stitch prevention measure — don't wait for one to arrive.",
          "Fueling: gel at 40min (non-caffeinated), gel at 80min (non-caffeinated), gel at 115min (non-caffeinated). Small consistent water sips every 10–15 min.",
          "Carry a full water bottle or plan a refill point — 29km is too far to rely on the promenade taps alone.",
          "Finish the cool-down genuinely easy. If you're still running at 5:50/km in the final km, back off further.",
        ]},
      { id:"w9-sun", day:"SUN", tag:"rest", date:"30 Aug", title:"Rest — Church", km:null,
        detail:["Full rest. Non-negotiable every Sunday."]},
    ]
  },
  {
    id:"w10", n:10, dates:"31 Aug–6 Sep",
    theme:"Peak Volume Territory", targetKm:72,
    focus:"Highest volume week of the race-specific block. Progression run Tuesday is the most race-specific quality session in the entire plan. 30km long run with 20km MP segment Saturday.",
    sessions:[
      { id:"w10-mon", day:"MON", date:"31 Aug", tag:"easy", title:"Easy Z2 Run", km:9,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "All Z2. High volume week — easy days must be genuinely easy to protect the quality sessions and Saturday's 30km.",
          "Run by HR not pace. ≤150bpm ceiling throughout.",
        ]},
      { id:"w10-tue", day:"TUE", date:"1 Sep", tag:"quality", title:"Progression Run + Leg PT", km:12,
        warmup:"quality", paces:"Easy: 6:30–7:00/km · MP: 5:00–5:10/km · Threshold: 4:40–4:50/km · 10K: 4:20–4:30/km",
        detail:[
          "Run first on fresh legs. This is the most race-specific quality session in the entire plan.",
          "Structure: 3km easy warm-up at 6:30–7:00/km → 3km at training MP (5:00–5:10/km) → 2km at threshold pace (4:40–4:50/km) → 2km at 10K effort (4:20–4:30/km) → 2km easy cool-down.",
          "The progression teaches your body to run fast on accumulated fatigue — exactly what happens in a marathon from km 25 onwards. Each phase should feel harder than the last.",
          "Set Apple Watch pace alerts for each phase: MP phase 5:00–5:10/km, threshold phase 4:40–4:50/km, 10K phase 4:20–4:30/km.",
          "Don't go out too hard on the MP phase — you need to be able to complete the threshold and 10K phases properly.",
          "Leg-focused PT immediately after.",
        ]},
      { id:"w10-wed", day:"WED", date:"2 Sep", tag:"quality", title:"Race-MP Intervals", km:10,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:50–5:00/km · 160–167bpm",
        detail:[
          "After a full quality warm-up, run 5×1.5km at race MP (4:50–5:00/km) with 90 seconds jog recovery between each rep.",
          "Short reps allow you to stay controlled at goal pace without blowing up. All 5 reps should feel consistent — aim for even effort across the session.",
          "HR target during reps: 160–167bpm. If HR is climbing continuously through the set, the pace is too fast.",
          "Include 2km easy cool-down.",
        ]},
      { id:"w10-thu", day:"THU", date:"3 Sep", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym. Upper body and core PT only.",
          "Saturday is 30km with 20km of MP work — the biggest long run of the build apart from Week 13's peak. Protect the legs today.",
        ]},
      { id:"w10-fri", day:"FRI", date:"4 Sep", tag:"shake", title:"Shakeout", km:4,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short flat shakeout.",
          "Set up the Apple Watch custom workout tonight for Saturday: 5km easy → 20km MP (pace alert 5:00–5:10/km) → 5km easy.",
          "Prep overnight oats tonight. Eat 90 minutes before start.",
        ]},
      { id:"w10-sat", day:"SAT", date:"5 Sep", tag:"long", title:"Long Run — 30km", km:30,
        warmup:"quality", paces:"Easy: 6:20–6:50/km · MP: 5:00–5:10/km · 160–167bpm",
        detail:[
          "Structure: 5km easy warm-up → 20km @ goal MP → 5km easy cool-down.",
          "This is the longest MP segment of the entire build. 20km at race pace embedded in a 30km run. This should feel hard — that's correct.",
          "Custom Apple Watch workout essential. Pace alert 5:00–5:10/km for the MP segment. Discipline on the ceiling matters more than ever today.",
          "Start the MP segment at 5:10/km for the first 4km. Let HR stabilise before settling into 5:00–5:05/km.",
          "3-2 breathing from km 10 of the MP segment onwards.",
          "Fueling: gel at 40min, gel at 80min, gel at 115min, gel at 150min. All non-caffeinated. Small consistent water sips every 10–15 min.",
          "Plan a water refill point — 30km requires it.",
          "The cool-down is non-negotiable — don't stop at 25km even if you feel done. The 5km of easy running after the MP block is part of the adaptation.",
          "Gun Run is in 8 days. This is the last big session before it.",
        ]},
      { id:"w10-sun", day:"SUN", tag:"rest", date:"6 Sep", title:"Rest — Church", km:null,
        detail:["Full rest. Big week done."]},
    ]
  },
  {
    id:"w11", n:11, dates:"7–13 Sep",
    theme:"Gun Run Week — Mini Taper", targetKm:41, isRace:true,
    focus:"Volume drops sharply. Two rest days before race day. Gun Run Sunday 13 Sep — target sub-1:40, stretch goal 1:36–1:38. Hilly course — run the climb by HR not pace.",
    sessions:[
      { id:"w11-mon", day:"MON", date:"7 Sep", tag:"easy", title:"Easy Z2 Run", km:5,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "Mini taper begins. Controlled easy start to race week. 5km only — don't add more even if you feel good.",
          "Legs should feel reasonably fresh off Sunday's rest. Let them stay that way.",
        ]},
      { id:"w11-tue", day:"TUE", date:"8 Sep", tag:"quality", title:"Short Sharpener + Light Leg PT", km:5,
        warmup:"quality", paces:"Threshold: 4:40–4:50/km · Strides: ~4:10–4:20/km effort",
        detail:[
          "Run first. Short and sharp — keeps legs awake without creating fatigue.",
          "Structure: 1km easy → 2×1km at threshold pace (4:40–4:50/km) with 2 min jog recovery → 4×200m at 10K effort (~4:10–4:20/km) with 60sec walk recovery → 1km easy cool-down.",
          "Light leg PT after — activation and mobility only, no heavy loading this close to race day.",
        ]},
      { id:"w11-wed", day:"WED", date:"9 Sep", tag:"easy", title:"Easy Z2 Run", km:5,
        warmup:"easy", paces:"6:30–7:00/km · ≤148bpm",
        detail:[
          "Easy 5km. Genuinely easy — no tempo creep.",
          "Legs should be feeling progressively fresher through the week.",
        ]},
      { id:"w11-thu", day:"THU", date:"10 Sep", tag:"rest", title:"Rest Day", km:null,
        detail:[
          "Full rest. No running today.",
          "Use this day to finalise race logistics: kit laid out, gel plan confirmed, route studied, alarm set.",
          "Eat well today — carb-focused meals to start topping up glycogen stores.",
        ]},
      { id:"w11-fri", day:"FRI", date:"11 Sep", tag:"shake", title:"Shakeout + Strides", km:5,
        warmup:"easy", paces:"6:45–7:15/km · 4 strides at race effort",
        detail:[
          "Short flat shakeout + 4×80m strides at the end.",
          "Strides: accelerate smoothly over 80m to race effort, relaxed and tall, walk back. 60 seconds between each.",
          "Legs should feel sharp and springy. If they don't, don't panic — it's normal to feel flat 2 days out.",
          "Sleep early tonight. Race morning alarm needs to account for breakfast 90 minutes before gun.",
        ]},
      { id:"w11-sat", day:"SAT", date:"12 Sep", tag:"rest", title:"Rest — Race Tomorrow", km:null,
        detail:[
          "Full rest. Light walk only.",
          "Kit completely ready: race shoes (Adios Pro 3s or Metaspeed Sky), race socks, body glide on blister hotspots, 2 gels pinned to kit.",
          "Overnight oats prepped for the morning. Set alarm to eat 90 minutes before race start.",
          "Sleep early — race day nerves are normal but the fitness is there. Trust the build.",
        ]},
      { id:"w11-sun", day:"SUN", date:"13 Sep", tag:"race", title:"OUTSURANCE GUN RUN — 21.1km", km:21.1,
        detail:[
          "TARGET: Sub-1:40 PB. Stretch goal: 1:36–1:38.",
          "Follicular phase timing — good hormonal conditions for performance.",
          "COURSE STRATEGY: The Gun Run is hilly with a significant climb peaking around km 10–12.",
          "km 0–4 (opening flat): Hold back — 4:40–4:50/km. It will feel embarrassingly easy. That's correct.",
          "km 4–12 (the climb): Run entirely by HR not pace. Accept 4:50–5:10/km on the ascent. HR ceiling 175bpm. Don't blow up here.",
          "km 12–15 (post-climb descent): Let gravity assist — 4:30–4:40/km. Don't brake, let the legs go.",
          "km 15–21 (flat finish): Build progressively — 4:33–4:40/km. Empty the tank from km 18 onwards.",
          "Fueling: gel at 25min, gel at 50min. Small consistent water sips at every aid station.",
          "3-2 breathing throughout to prevent stitches.",
          "This is your marathon fitness checkpoint — run it well and use it as data for the final 5 weeks.",
        ],
        paces:"Target: sub-1:40 · Opening 4km: 4:40–4:50/km · Climb: HR ≤175bpm · Finish: 4:33–4:40/km"},
    ]
  },
  {
    id:"w12", n:12, dates:"14–20 Sep",
    theme:"Post Gun Run — As It Comes", targetKm:58,
    focus:"Recovery from the race. Volume target is 55–60km but adjust based on how you feel. Don't force mileage if legs are still heavy mid-week. Peak week (Week 13) starts Monday 21 Sep.",
    sessions:[
      { id:"w12-mon", day:"MON", date:"14 Sep", tag:"easy", title:"Easy Recovery Run", km:8,
        warmup:"easy", paces:"6:45–7:30/km · ≤148bpm",
        detail:[
          "Post-race Monday. Go entirely by feel — elevated HR is normal race fatigue.",
          "If legs feel genuinely wrecked, cut to 5km or skip entirely. Getting to Week 13 healthy matters more than this km.",
          "Prioritise hydration and food today — replenish what the race took.",
        ]},
      { id:"w12-tue", day:"TUE", date:"15 Sep", tag:"gym", title:"Run to PT + Legs", km:8,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym. PT can push legs this week — running load is relatively low.",
          "Use Gun Run data to refine strength focus. If the climb exposed hip weakness or calf fatigue, target those specifically.",
          "Tell PT: Gun Run race Sunday, here's what I felt — let's address it.",
        ]},
      { id:"w12-wed", day:"WED", date:"16 Sep", tag:"easy", title:"Easy Z2 + Strides", km:9,
        warmup:"easy", paces:"6:30–7:00/km · Strides: ~4:20/km effort",
        detail:[
          "Easy run + 4×80m strides at the end. Legs waking back up after the race.",
          "If legs still feel heavy from the race, drop the strides and just run easy.",
        ]},
      { id:"w12-thu", day:"THU", date:"17 Sep", tag:"gym", title:"Run to PT — Upper + Core", km:8,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run + upper body and core PT.",
          "Peak week starts Monday — use Thursday to assess how the legs are genuinely feeling and communicate that to PT.",
        ]},
      { id:"w12-fri", day:"FRI", date:"18 Sep", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:45–7:15/km · ≤142bpm",
        detail:[
          "Short flat shakeout. Legs should feel noticeably fresher than Monday.",
          "Peak week (Week 13) starts Monday with the true peak long run of the entire build on Saturday 27 Sep — 32–34km.",
        ]},
      { id:"w12-sat", day:"SAT", date:"19 Sep", tag:"long", title:"Moderate Long Run — 20km", km:20,
        warmup:"easy", paces:"6:10–6:40/km · ≤158bpm",
        detail:[
          "Easy to moderate throughout. No MP segment this week.",
          "This run is purely about confirming race recovery and keeping the aerobic habit alive before the peak.",
          "If you're still carrying significant fatigue from the Gun Run, cut to 15km and don't push the pace.",
          "Adjust this week's total based entirely on how you feel — 55–60km is a target, not a floor.",
        ]},
      { id:"w12-sun", day:"SUN", date:"20 Sep", tag:"rest", title:"Rest — Church", km:null,
        detail:["Full rest. Peak week starts tomorrow."]},
    ]
  },
];

export default function Block3Plan() {
  const [activeW, setActiveW] = useState("w9");
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
    try { await saveData({ completed, km, notes }); setSaveStatus("saved"); setTimeout(()=>setSaveStatus("idle"), 2500); }
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
  };

  const wColor = week.isRace ? "#fa5400" : week.isDeload ? "#636366" : "#30d158";
  const phaseAccent = week.isRace ? "#fa5400" : "#30d158";

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

      {/* HEADER */}
      <div style={{background:"#111",borderBottom:"1px solid #1c1c1e",padding:"18px 20px 0",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:phaseAccent,textTransform:"uppercase",marginBottom:5}}>Race-Specific · Weeks 9–12</div>
              <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.8,lineHeight:1}}>24 Aug – 20 Sep</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#30d158",letterSpacing:-0.3}}>{totalKm}km</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:2}}>{totalDone}/{totalSessions} sessions</div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={doSave}
            style={{width:"100%",padding:"12px",borderRadius:10,marginBottom:14,background:saveStatus==="err"?"#ff453a":saveStatus==="saved"?"#1a8040":"#30d158",border:"none",color:"#fff",fontSize:13,fontWeight:800,letterSpacing:0.5,cursor:"pointer"}}>
            {saveStatus==="saving"?"SAVING…":saveStatus==="err"?"⚠ SAVE FAILED — TAP TO RETRY":saveStatus==="saved"?"✓ SAVED":"SAVE CHANGES"}
          </button>

          {/* WEEK TABS */}
          <div style={{display:"flex",gap:6,paddingBottom:14}}>
            {WEEKS.map(w => {
              const active = w.id === activeW;
              const col = w.isRace ? "#fa5400" : "#30d158";
              const done = w.sessions.filter(s=>completed[s.id]).length;
              const pct = Math.round((done/w.sessions.length)*100);
              return (
                <button key={w.id} className="tap" onClick={()=>setActiveW(w.id)}
                  style={{flex:1,padding:"10px 6px",borderRadius:10,background:active?col:"#1c1c1e",border:`1.5px solid ${active?col:"#2c2c2e"}`,textAlign:"center"}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:1.5,color:active?"rgba(255,255,255,.7)":col,textTransform:"uppercase",marginBottom:2}}>
                    {w.isRace?"Gun Run":`Week ${w.n}`}
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
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:wColor,textTransform:"uppercase"}}>Week {week.n} · Race-Specific</span>
                {week.isRace&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:20,background:"#3a0a00",color:"#fa5400",textTransform:"uppercase"}}>Race Week</span>}
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

                  <div style={{flexShrink:0,textAlign:"right",minWidth:64,padding:"4px 0"}}
                    onClick={e=>{e.stopPropagation();if(isDone&&editKm!==s.id&&s.km!==null)setEditKm(s.id);}}>
                    {s.km!==null?(
                      isDone&&editKm===s.id?(
                        <input type="number" step=".1" autoFocus defaultValue={km[s.id]??s.km}
                          onBlur={e=>{const v=parseFloat(e.target.value);setKm(k=>({...k,[s.id]:isNaN(v)?s.km!:v}));setEditKm(null);}}
                          onKeyDown={e=>{if(e.key==="Enter")(e.target as HTMLInputElement).blur();}}
                          onClick={e=>e.stopPropagation()}
                          style={{width:52,fontSize:16,fontWeight:800,textAlign:"right",background:"transparent",border:"none",borderBottom:`1px solid ${meta.color}`,color:"#fff",outline:"none",letterSpacing:-0.5}}/>
                      ):(
                        <div style={{cursor:isDone?"text":"default"}}>
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

                    {warmupSteps&&s.tag!=="rest"&&s.tag!=="race"&&(
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
                          onBlur={e=>{setNotes(n=>({...n,[s.id]:e.target.value.trim()}));setEditNote(null);}}
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
          {week.n>9&&<button className="tap" onClick={()=>setActiveW(`w${week.n-1}`)} style={{flex:1,padding:"15px",borderRadius:12,background:"#1c1c1e",color:"#fff",fontSize:14,fontWeight:700,border:"1px solid #2c2c2e"}}>← Week {week.n-1}</button>}
          {week.n<12&&<button className="tap" onClick={()=>setActiveW(`w${week.n+1}`)} style={{flex:1,padding:"15px",borderRadius:12,background:"#30d158",color:"#fff",fontSize:14,fontWeight:700}}>Week {week.n+1} →</button>}
        </div>

        {/* ZONES */}
        <div style={{marginTop:20,background:"#1c1c1e",borderRadius:16,padding:"14px",border:"1px solid #2c2c2e"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,color:"#48484a",textTransform:"uppercase",marginBottom:12}}>Training Zones · Race-Specific Phase</div>
          <div style={{display:"flex",gap:4,overflowX:"auto"}}>
            {[
              {n:"Easy Z2",p:"6:20–7:00",h:"138–150",c:"#30d158"},
              {n:"Train MP",p:"5:00–5:10",h:"160–167",c:"#0a84ff"},
              {n:"Threshold",p:"4:40–4:50",h:"168–174",c:"#ff9f0a"},
              {n:"Race MP",p:"4:50–5:00",h:"160–167",c:"#fa5400"},
              {n:"10K Effort",p:"4:20–4:30",h:"175–182",c:"#ff453a"},
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
          Tap circle to log · Tap km to edit · Warmup inside each session · Save changes above
        </div>
      </div>
    </div>
  );
}
