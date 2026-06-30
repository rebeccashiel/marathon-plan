import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabase";

const USER_ID = "default_user";
interface Prog { completed: Record<string,boolean>; km: Record<string,number>; notes: Record<string,string>; }

async function loadData(): Promise<Prog|null> {
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("completed, km_logged, notes")
      .eq("user_id", USER_ID)
      .single();
    if (error || !data) return null;
    return {
      completed: data.completed || {},
      km: data.km_logged || {},
      notes: data.notes || {},
    };
  } catch {
    return null;
  }
}

async function saveData(d: Prog) {
  try {
    const { error } = await supabase
      .from("progress")
      .upsert({
        user_id: USER_ID,
        completed: d.completed,
        km_logged: d.km,
        notes: d.notes,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
  } catch {
    // swallow — UI shows "save failed" via saving state
    throw new Error("save failed");
  }
}

type Tag = "easy"|"quality"|"long"|"rest"|"gym"|"shake";

const TAGS: Record<Tag, {label: string; color: string}> = {
  easy:    { label: "EASY RUN",  color: "#30d158" },
  quality: { label: "QUALITY",   color: "#fa5400" },
  long:    { label: "LONG RUN",  color: "#0a84ff" },
  rest:    { label: "REST",      color: "#48484a" },
  gym:     { label: "PT + RUN",  color: "#bf5af2" },
  shake:   { label: "SHAKEOUT",  color: "#ffd60a" },
};

const WU_EASY = [
  "2 min brisk walk — arms swinging, tall posture",
  "10 hip circles each direction (slow, large)",
  "10 leg swings forward/back each leg — relaxed pendulum, not forced",
  "10 lateral leg swings each leg",
  "10 clamshells each side — glute activation",
  "10 ankle circles each direction + 10 single-leg calf raises each side",
  "Begin running at 7:00/km for first 500m before settling into target pace",
];

const WU_QUALITY = [
  "PHT isometric holds × 4 reps each side — heel pressed into floor at 30° knee bend, hold 45sec, 15sec rest",
  "2–3 min brisk walk — do not skip this step",
  "10 hip circles each direction — slower and more deliberate than easy day",
  "10 leg swings forward/back + 10 lateral each leg",
  "15 glute bridges + 8 single-leg glute bridges each side (2sec hold at top)",
  "20 slow walking high knees + 20 slow bum kicks",
  "15 double-leg calf raises + 10 single-leg each side",
  "2km easy jog at 6:45–7:00/km — HR should be 130–140bpm before rep 1 starts",
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
    id: "w1", n: 1, dates: "29 Jun – 5 Jul",
    theme: "Aerobic Foundation", targetKm: 52,
    focus: "Build the habit. All runs easy. One quality session Tuesday. First long run Saturday at 20km.",
    sessions: [
      { id:"w1-mon", day:"MON", date:"29 Jun", tag:"easy", title:"Easy Z2 Run", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "First run of the official build. Flat or low-elevation — Seapoint Promenade is ideal.",
          "Run entirely by HR. If a hill pushes you above 150bpm, walk the crest and settle back down.",
          "This is a check-in, not a statement. Arrive at Tuesday feeling fresh.",
        ]},
      { id:"w1-tue", day:"TUE", date:"30 Jun", tag:"quality", title:"Threshold Intervals + Leg PT", km:10,
        warmup:"quality", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:42–4:52/km · 168–174bpm",
        detail:[
          "Run first on fresh legs — the run to gym is your warm-up. Quality session before PT every Tuesday.",
          "Structure: 2km easy → 3×1km @ 4:42–4:52/km (90sec jog between reps) → 2km easy cool-down.",
          "3-2 breathing on every rep: inhale 3 steps, exhale 2. This directly addresses the stitch issue from CTM.",
          "Rep 1 ceiling is 4:42/km — do not start faster. If HR exceeds 175bpm by the end of rep 1, you went too fast.",
          "Leg-focused PT immediately after the run. Tell PT: quality run done, legs under load today.",
        ]},
      { id:"w1-wed", day:"WED", date:"1 Jul", tag:"easy", title:"Easy Z2 — Tired Legs", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤152bpm",
        detail:[
          "This run is meant to feel harder than Monday. That is by design — legs are carrying Tuesday's work.",
          "HR will run slightly higher at the same pace. Don't chase Monday's pace. Run by HR ceiling: ≤152bpm.",
          "If it's genuinely rough, slow to 7:15–7:30/km. The aerobic stimulus is still there.",
        ]},
      { id:"w1-thu", day:"THU", date:"2 Jul", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Run to gym (7km) as easy warm-up. Arrive warm, not tired — keep it genuinely easy.",
          "Upper body and core PT only today. Zero leg work — protecting Saturday's long run.",
          "Add 2km before the gym if time allows (total 9km). Tell PT: long run Saturday, no legs today.",
        ]},
      { id:"w1-fri", day:"FRI", date:"3 Jul", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short and flat — Seapoint Promenade preferred.",
          "Purpose: flush Thursday stiffness, keep legs moving before Saturday. Not a training stimulus.",
          "If it's feeling hard, cut to 4km. Saturday matters more.",
        ]},
      { id:"w1-sat", day:"SAT", date:"4 Jul", tag:"long", title:"Long Run — 20km", km:20,
        warmup:"quality", paces:"6:20–6:50/km · ≤152bpm",
        detail:[
          "First proper long run of the build. All Z2 — no MP segment yet.",
          "Eat something small 60–90min before: banana + toast or oats with honey. Do not run fasted.",
          "Fueling practice: 1 gel at 45min. Note the brand and how your stomach responds.",
          "Water every 15–20min throughout. Sip consistently — don't gulp at aid points.",
          "Finish feeling like you could run another 6km. If you do, the session was perfect.",
        ]},
      { id:"w1-sun", day:"SUN", date:"5 Jul", tag:"rest", title:"Rest — Church", km:null,
        detail:[
          "Full rest. Non-negotiable every Sunday throughout the 16-week build.",
          "Isometric holds morning and evening if any PHT sensitivity is present.",
        ]},
    ]
  },
  {
    id: "w2", n: 2, dates: "6–12 Jul",
    theme: "Volume + First MP Taste", targetKm: 55,
    focus: "Saturday introduces the first marathon pace segment (10km). Tuesday threshold adds one rep.",
    sessions: [
      { id:"w2-mon", day:"MON", date:"6 Jul", tag:"easy", title:"Easy Z2 Run", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "Standard aerobic accumulation. Same approach as Week 1 Monday.",
          "Note whether your easy pace feels more settled than Week 1 Day 1. Any improvement is real adaptation.",
        ]},
      { id:"w2-tue", day:"TUE", date:"7 Jul", tag:"quality", title:"Threshold Intervals + Leg PT", km:11,
        warmup:"quality", paces:"Reps: 4:42–4:52/km · 168–174bpm",
        detail:[
          "Adding one rep from last week: 3×1km → 4×1km. Same pace target, not more intensity.",
          "Focus on consistency across all 4 reps — all should land within 3–4 seconds of each other.",
          "Note whether reps feel more controlled than Week 1. That's your fitness signal.",
          "Run first, full quality warm-up, leg PT after. Same standing Tuesday pattern.",
        ]},
      { id:"w2-wed", day:"WED", date:"8 Jul", tag:"easy", title:"Easy Z2 — Tired Legs", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤152bpm",
        detail:[
          "Post-PT easy run. Same principle as Week 1 Wednesday.",
          "HR ceiling ≤152bpm. If you're above that on flat terrain, slow down — don't fight it.",
        ]},
      { id:"w2-thu", day:"THU", date:"9 Jul", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym (7km). Upper body and core PT only.",
          "Saturday has your first MP segment — legs need to arrive reasonably fresh. Tell PT.",
        ]},
      { id:"w2-fri", day:"FRI", date:"10 Jul", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Short flat shakeout before the MP long run.",
          "Eat something beforehand — do not run fasted into a long run day.",
        ]},
      { id:"w2-sat", day:"SAT", date:"11 Jul", tag:"long", title:"Long Run + First MP Segment — 22km", km:22,
        warmup:"quality", paces:"Easy: 6:20–6:50/km · MP: 5:20–5:35/km · 153–162bpm",
        detail:[
          "Structure: 4km easy warm-up → 10km @ training MP (5:20–5:35/km) → 8km easy cool-down.",
          "This is your first extended MP block. It should feel comfortably hard — not Z2, not threshold.",
          "HR in the MP section should settle (not climb) to 153–162bpm by km 2 of the block.",
          "If HR is consistently above 163bpm, drop 5 sec/km. Do not push through a high HR in the MP section.",
          "Fuel: gel at 40min, gel at 80min. Water every 15–20min.",
        ]},
      { id:"w2-sun", day:"SUN", date:"12 Jul", tag:"rest", title:"Rest — Church", km:null,
        detail:[
          "Full rest. Note how Saturday's MP section felt — this is useful calibration for upcoming weeks.",
        ]},
    ]
  },
  {
    id: "w3", n: 3, dates: "13–19 Jul",
    theme: "Building Consistency", targetKm: 58,
    focus: "MP block grows to 12km. Threshold stays at 4 reps. Volume peaks before the deload.",
    sessions: [
      { id:"w3-mon", day:"MON", date:"13 Jul", tag:"easy", title:"Easy Z2 Run", km:11,
        warmup:"easy", paces:"6:20–7:00/km · ≤150bpm",
        detail:[
          "Volume ticking up. Keep easy days honest — do not let the extra km push you out of Z2.",
          "If Saturday's long run felt heavy, start at 7:00/km and let pace settle naturally over the first 2km.",
        ]},
      { id:"w3-tue", day:"TUE", date:"14 Jul", tag:"quality", title:"Threshold Intervals + Leg PT", km:11,
        warmup:"quality", paces:"Reps: 4:42–4:52/km · 168–174bpm",
        detail:[
          "4×1km threshold — same rep count as Week 2. Consolidating, not progressing yet.",
          "Focus on evenness across all 4 reps. If rep 4 slips to 4:55/km due to fatigue, that's fine — the stimulus is still there.",
          "Run first, PT after. Same pattern.",
        ]},
      { id:"w3-wed", day:"WED", date:"15 Jul", tag:"easy", title:"Easy Z2 — Tired Legs", km:10,
        warmup:"easy", paces:"6:20–7:00/km · ≤152bpm",
        detail:[
          "Mid-week easy. If genuinely stiff from Tuesday, 7:00–7:30/km is fine.",
          "Purpose is blood flow and active recovery, not pace.",
        ]},
      { id:"w3-thu", day:"THU", date:"16 Jul", tag:"gym", title:"Run to PT — Upper + Core", km:8,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym (8km this week). Upper and core PT only.",
          "Saturday is 24km — biggest run of the build so far. Tell PT: nothing that causes 2-day soreness.",
        ]},
      { id:"w3-fri", day:"FRI", date:"17 Jul", tag:"shake", title:"Shakeout", km:5,
        warmup:"easy", paces:"6:40–7:10/km · ≤145bpm",
        detail:[
          "Pre-long-run flush. Short and flat.",
          "Eat before. Sleep well tonight — Saturday is a significant session.",
        ]},
      { id:"w3-sat", day:"SAT", date:"18 Jul", tag:"long", title:"Long Run + MP Segment — 24km", km:24,
        warmup:"quality", paces:"Easy: 6:20–6:50/km · MP: 5:15–5:30/km · 153–162bpm",
        detail:[
          "Structure: 4km easy → 12km @ training MP → 8km easy.",
          "MP block has grown from 10km to 12km — same effort, more time at pace.",
          "If your training MP has naturally dropped since Week 2 (same HR, faster pace), run at that faster pace — don't hold back artificially.",
          "Fuel: gel at 40min, gel at 80min. Water every 15–20min.",
          "If any PHT or ITB sensitivity arises during the MP section, drop to easy pace immediately.",
        ]},
      { id:"w3-sun", day:"SUN", date:"19 Jul", tag:"rest", title:"Rest — Church", km:null,
        detail:[
          "Full rest. Week 4 is the deload — you've earned it. Let this week absorb fully.",
        ]},
    ]
  },
  {
    id: "w4", n: 4, dates: "20–26 Jul",
    theme: "Deload — Absorb & Reset", targetKm: 38,
    focus: "Volume drops ~35%. Zero running intensity. Gym can go harder. Arrive at Week 5 fresh.",
    isDeload: true,
    sessions: [
      { id:"w4-mon", day:"MON", date:"20 Jul", tag:"easy", title:"Easy Z2 Run — Shorter", km:8,
        warmup:"easy", paces:"6:30–7:00/km · ≤148bpm",
        detail:[
          "Deliberately shorter than a normal Monday. Do not add extra km even if you feel good.",
          "Notice how your legs feel compared to Week 1 Day 1. More settled? More elastic? That is three weeks of adaptation.",
        ]},
      { id:"w4-tue", day:"TUE", date:"21 Jul", tag:"gym", title:"Run to PT + Legs", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Run to gym easy (7km). No quality running session this week — just the run commute.",
          "Deload means reduced running load, not reduced strength. PT can push legs properly this week.",
          "Good week to add load to glute work, single-leg stability, calf raises — injury prevention pillars.",
        ]},
      { id:"w4-wed", day:"WED", date:"22 Jul", tag:"easy", title:"Easy Z2 + Strides", km:8,
        warmup:"easy", paces:"Main run: 6:30–7:00/km · Strides: ~4:30/km effort, fully relaxed",
        detail:[
          "Easy run, then in the final 1km: 4×80m strides.",
          "Strides: accelerate smoothly to about 5K effort over 80m, relaxed and tall, walk back to start. 60sec between each.",
          "This is neuromuscular maintenance only — keeping fast-twitch fibres awake without aerobic stress.",
          "Legs should feel sharp after, not tired.",
        ]},
      { id:"w4-thu", day:"THU", date:"23 Jul", tag:"gym", title:"Run to PT — Upper + Core", km:7,
        warmup:"easy", paces:"6:30–7:00/km easy",
        detail:[
          "Easy run to gym (7km). Upper body and core PT.",
          "Saturday is the deload long run — keep Thursday moderate so legs arrive fresh.",
        ]},
      { id:"w4-fri", day:"FRI", date:"24 Jul", tag:"shake", title:"Very Easy Shakeout", km:4,
        warmup:"easy", paces:"6:45–7:15/km · ≤140bpm",
        detail:[
          "Shortest shakeout of the build. 4km, completely flat.",
          "Legs should feel lighter than any week so far. If they do — the deload is working correctly.",
        ]},
      { id:"w4-sat", day:"SAT", date:"25 Jul", tag:"long", title:"Easy Long Run — 16km", km:16,
        warmup:"easy", paces:"6:20–6:50/km · ≤150bpm",
        detail:[
          "All easy. Every single kilometre. No MP segment and no temptation to add one.",
          "This run keeps your aerobic habit alive without adding training stress.",
          "Finish feeling like you could easily run another 10km. That is the correct state going into Week 5.",
          "Fuel: 1 gel at 50min. Water as usual.",
        ]},
      { id:"w4-sun", day:"SUN", date:"26 Jul", tag:"rest", title:"Rest — Church", km:null,
        detail:[
          "Full rest. Week 5 begins the Development phase — bigger sessions, longer MP blocks.",
          "Arrive Sunday night fresh and slightly hungry for more. That feeling is correct.",
        ]},
    ]
  },
];

export default function Block1Plan() {
  const [activeW, setActiveW] = useState("w1");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const [showWU, setShowWU] = useState<Record<string,boolean>>({});
  const [completed, setCompleted] = useState<Record<string,boolean>>({});
  const [km, setKm] = useState<Record<string,number>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [editKm, setEditKm] = useState<string|null>(null);
  const [editNote, setEditNote] = useState<string|null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<"idle"|"saving"|"saved"|"err">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    (async () => {
      const s = await loadData();
      if (s) {
        setCompleted(p => ({ ...p, ...s.completed }));
        setKm(p => ({ ...p, ...s.km }));
        setNotes(p => ({ ...p, ...s.notes }));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaving("saving");
    if (timer.current) clearTimeout(timer.current);
    // Capture the values at the moment the timer is set, not the moment it fires.
    const snapshot = { completed, km, notes };
    timer.current = setTimeout(() => {
      saveData(snapshot)
        .then(() => setSaving("saved"))
        .catch(() => setSaving("err"));
    }, 600);
    // No cleanup-based clearTimeout here — clearing only happens at the
    // top of the next effect run via timer.current, never on unmount/rerender
    // alone. This prevents the timer being cancelled before it can fire.
  }, [completed, km, notes, loaded]);

  // Belt-and-braces: also save immediately (no debounce) right before the
  // tab/window is closed or hidden, so a quick tick-then-close never loses data.
  useEffect(() => {
    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        // fire and forget — best effort on unload
        saveData({ completed, km, notes }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
    };
  }, [completed, km, notes]);

  const week = WEEKS.find(w => w.id === activeW)!;

  const wStats = useMemo(() => {
    const logged = week.sessions.reduce((s, x) => completed[x.id] && km[x.id] ? s + km[x.id] : s, 0);
    const done = week.sessions.filter(s => completed[s.id]).length;
    const pct = Math.min(100, Math.round((logged / week.targetKm) * 100));
    return { logged: Math.round(logged * 10) / 10, done, total: week.sessions.length, pct };
  }, [week, completed, km]);

  const totalKm = useMemo(() => Math.round(Object.values(km).reduce((a, b) => a + b, 0) * 10) / 10, [km]);
  const totalDone = useMemo(() => Object.values(completed).filter(Boolean).length, [completed]);
  const totalSessions = WEEKS.reduce((a, w) => a + w.sessions.length, 0);

  const check = (id: string, plannedKm: number|null) => {
    setCompleted(p => {
      const n = { ...p, [id]: !p[id] };
      const newKm = (n[id] && plannedKm !== null && km[id] === undefined)
        ? { ...km, [id]: plannedKm }
        : km;
      if (newKm !== km) setKm(newKm);
      // Direct, immediate save (no debounce wait) as a robust backup —
      // does not depend on the debounced useEffect timer surviving.
      setSaving("saving");
      saveData({ completed: n, km: newKm, notes })
        .then(() => setSaving("saved"))
        .catch(() => setSaving("err"));
      return n;
    });
  };

  const wColor = week.isDeload ? "#636366" : "#fa5400";

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "-apple-system,'Helvetica Neue',Arial,sans-serif", paddingBottom: 80 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { height: 3px; width: 0; }
        ::-webkit-scrollbar-thumb { background: #2c2c2e; border-radius: 2px; }
        .tappable { cursor: pointer; transition: opacity .12s; }
        .tappable:active { opacity: .65; }
        .row-hover { transition: background .1s; }
        .row-hover:hover { background: rgba(255,255,255,.03); }
        .chk { cursor: pointer; transition: transform .1s; border: none; background: transparent; }
        .chk:active { transform: scale(.82); }
        .fade-in { animation: fi .15s ease; }
        @keyframes fi { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        textarea { font-family: inherit; }
        button { border: none; cursor: pointer; font-family: inherit; }
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ background: "#111", borderBottom: "1px solid #1c1c1e", padding: "18px 20px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "#fa5400", textTransform: "uppercase", marginBottom: 5 }}>
                Base Phase · Weeks 1–4
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>
                29 Jun – 26 Jul
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: saving === "err" ? "#ff453a" : "#48484a", textTransform: "uppercase", marginBottom: 4 }}>
                {!loaded ? "Loading…" : saving === "saving" ? "Saving…" : saving === "err" ? "Save failed" : "Saved ✓"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#30d158", letterSpacing: -0.3 }}>{totalKm}km</div>
              <div style={{ fontSize: 10, color: "#48484a", marginTop: 2 }}>{totalDone}/{totalSessions} sessions</div>
            </div>
          </div>

          {/* WEEK TABS */}
          <div style={{ display: "flex", gap: 6, paddingBottom: 14 }}>
            {WEEKS.map(w => {
              const active = w.id === activeW;
              const col = w.isDeload ? "#636366" : "#fa5400";
              const done = w.sessions.filter(s => completed[s.id]).length;
              const pct = Math.round((done / w.sessions.length) * 100);
              return (
                <button key={w.id} className="tappable" onClick={() => setActiveW(w.id)}
                  style={{ flex: 1, padding: "10px 6px", borderRadius: 12, background: active ? col : "#1c1c1e", border: `1.5px solid ${active ? col : "#2c2c2e"}`, textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: active ? "rgba(255,255,255,.7)" : col, textTransform: "uppercase", marginBottom: 3 }}>
                    {w.isDeload ? "Deload" : `Week ${w.n}`}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: active ? "#fff" : "#888", letterSpacing: -0.5 }}>
                    {w.targetKm}<span style={{ fontSize: 9, fontWeight: 500, color: active ? "rgba(255,255,255,.5)" : "#48484a" }}>km</span>
                  </div>
                  {pct > 0 && pct < 100 && (
                    <div style={{ marginTop: 4, height: 2, background: "rgba(255,255,255,.1)", borderRadius: 1, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: active ? "rgba(255,255,255,.7)" : col, borderRadius: 1 }} />
                    </div>
                  )}
                  {pct === 100 && <div style={{ marginTop: 3, fontSize: 8, fontWeight: 700, color: active ? "#fff" : "#30d158", letterSpacing: 1 }}>DONE ✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px 0" }}>

        {/* WEEK CARD */}
        <div style={{ background: "#1c1c1e", borderRadius: 16, padding: "18px", marginBottom: 12, border: "1px solid #2c2c2e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: wColor, textTransform: "uppercase" }}>Week {week.n}</span>
                {week.isDeload && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, padding: "2px 8px", borderRadius: 20, background: "#2c2c2e", color: "#636366", textTransform: "uppercase" }}>Deload</span>}
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2, color: "#fff" }}>{week.theme}</div>
              <div style={{ fontSize: 11, color: "#48484a", marginTop: 4 }}>{week.dates}</div>
              <div style={{ fontSize: 12, color: "#636366", marginTop: 10, lineHeight: 1.65, borderLeft: `2px solid ${wColor}`, paddingLeft: 10 }}>{week.focus}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: wStats.pct >= 100 ? "#30d158" : "#fff" }}>{wStats.logged}</div>
              <div style={{ fontSize: 10, color: "#48484a", marginTop: 3 }}>/ {week.targetKm}km</div>
              <div style={{ fontSize: 10, color: "#48484a", marginTop: 1 }}>{wStats.done}/{wStats.total}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, height: 3, background: "#2c2c2e", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${wStats.pct}%`, background: wColor, borderRadius: 2, transition: "width .4s ease" }} />
          </div>
        </div>

        {/* SESSION LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {week.sessions.map(s => {
            const isDone = !!completed[s.id];
            const isOpen = !!expanded[s.id];
            const isWUOpen = !!showWU[s.id];
            const meta = TAGS[s.tag];
            const warmupSteps = s.warmup === "quality" ? WU_QUALITY : s.warmup === "easy" ? WU_EASY : null;

            return (
              <div key={s.id} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${isOpen ? "#3a3a3c" : "#2c2c2e"}`, background: isDone ? "#0d0d0d" : "#1c1c1e" }}>

                {/* MAIN ROW */}
                <div className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpanded(p => ({ ...p, [s.id]: !p[s.id] }))}>

                  {/* CHECKBOX */}
                  <button className="chk" onClick={e => { e.stopPropagation(); check(s.id, s.km); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: isDone ? meta.color : "transparent", border: `2px solid ${isDone ? meta.color : "#3a3a3c"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L4.8 9L10 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* DAY */}
                  <div style={{ width: 38, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: isDone ? "#3a3a3c" : meta.color, textTransform: "uppercase" }}>{s.day}</div>
                    <div style={{ fontSize: 9, color: "#3a3a3c", marginTop: 1 }}>{s.date}</div>
                  </div>

                  {/* TITLE */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isDone ? "#3a3a3c" : "#fff", textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.2 }}>{s.title}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: isDone ? "#2c2c2e" : meta.color, textTransform: "uppercase", marginTop: 2 }}>{meta.label}</div>
                  </div>

                  {/* KM */}
                  <div style={{ flexShrink: 0, textAlign: "right", minWidth: 56 }} onClick={e => e.stopPropagation()}>
                    {s.km !== null ? (
                      isDone && editKm === s.id ? (
                        <input type="number" step=".1" autoFocus defaultValue={km[s.id] ?? s.km}
                          onBlur={e => { const v = parseFloat(e.target.value); setKm(k => ({ ...k, [s.id]: isNaN(v) ? s.km! : v })); setEditKm(null); }}
                          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          style={{ width: 52, fontSize: 17, fontWeight: 800, textAlign: "right", background: "transparent", border: "none", borderBottom: `1px solid ${meta.color}`, color: "#fff", outline: "none", letterSpacing: -0.5 }} />
                      ) : (
                        <div onClick={() => isDone && setEditKm(s.id)} style={{ cursor: isDone ? "text" : "default" }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: isDone ? "#30d158" : "#fff", letterSpacing: -1 }}>{isDone ? (km[s.id] ?? s.km) : s.km}</span>
                          <span style={{ fontSize: 10, color: isDone ? "#30d158" : "#48484a", marginLeft: 1 }}>km</span>
                        </div>
                      )
                    ) : <span style={{ fontSize: 14, color: "#2c2c2e" }}>—</span>}
                  </div>

                  {/* CHEVRON */}
                  <svg style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .18s ease" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="#48484a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* EXPANDED */}
                {isOpen && (
                  <div className="fade-in" style={{ padding: "0 16px 16px", borderTop: "1px solid #2c2c2e" }} onClick={e => e.stopPropagation()}>

                    {/* PACES */}
                    {s.paces && (
                      <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "#111", borderRadius: 8, padding: "8px 12px", border: "1px solid #2c2c2e", marginBottom: 14 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#636366", textTransform: "uppercase" }}>Paces</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.2 }}>{s.paces}</span>
                      </div>
                    )}
                    {!s.paces && <div style={{ marginTop: 14 }} />}

                    {/* DETAIL BULLETS */}
                    <div style={{ marginBottom: 14 }}>
                      {s.detail.map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, flexShrink: 0, marginTop: 7 }} />
                          <p style={{ fontSize: 13, color: "#aeaeb2", lineHeight: 1.65 }}>{line}</p>
                        </div>
                      ))}
                    </div>

                    {/* WARM-UP TOGGLE */}
                    {warmupSteps && s.tag !== "rest" && (
                      <div style={{ marginBottom: 14 }}>
                        <button className="tappable" onClick={() => setShowWU(p => ({ ...p, [s.id]: !p[s.id] }))}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "#111", padding: "10px 14px", borderRadius: 10, border: "1px solid #2c2c2e", textAlign: "left" }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#ffd60a", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#ffd60a", textTransform: "uppercase" }}>
                            {s.warmup === "quality" ? "Quality Warm-Up — 10–12 min" : "Easy Warm-Up — 6 min"}
                          </span>
                          <svg style={{ transform: isWUOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .15s", flexShrink: 0 }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 3.5L5 6.5L8.5 3.5" stroke="#ffd60a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isWUOpen && (
                          <div className="fade-in" style={{ marginTop: 4, background: "#111", borderRadius: 10, padding: "12px 14px", border: "1px solid #2c2c2e" }}>
                            {warmupSteps.map((step, i) => (
                              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < warmupSteps.length - 1 ? 10 : 0, alignItems: "flex-start" }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#ffd60a", flexShrink: 0, width: 14, textAlign: "right", marginTop: 3 }}>{i + 1}</span>
                                <p style={{ fontSize: 12, color: "#636366", lineHeight: 1.65 }}>{step}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* NOTES */}
                    <div style={{ borderTop: "1px solid #2c2c2e", paddingTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#48484a", textTransform: "uppercase", marginBottom: 8 }}>Session Note</div>
                      {editNote === s.id ? (
                        <textarea autoFocus defaultValue={notes[s.id] || ""} placeholder="How did it go? HR, pace, how you felt…"
                          onBlur={e => { setNotes(n => ({ ...n, [s.id]: e.target.value.trim() })); setEditNote(null); }}
                          style={{ width: "100%", minHeight: 68, fontSize: 13, background: "#111", border: "1px solid #2c2c2e", borderRadius: 8, color: "#aeaeb2", outline: "none", resize: "vertical", lineHeight: 1.65, padding: "10px 12px" }} />
                      ) : (
                        <div onClick={() => setEditNote(s.id)} style={{ cursor: "text", fontSize: 13, color: notes[s.id] ? "#aeaeb2" : "#3a3a3c", fontStyle: notes[s.id] ? "normal" : "italic", lineHeight: 1.65, minHeight: 24 }}>
                          {notes[s.id] || "Tap to add a note…"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {week.n > 1 && (
            <button className="tappable" onClick={() => setActiveW(`w${week.n - 1}`)}
              style={{ flex: 1, padding: "15px", borderRadius: 12, background: "#1c1c1e", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.5, border: "1px solid #2c2c2e" }}>
              ← Week {week.n - 1}
            </button>
          )}
          {week.n < 4 && (
            <button className="tappable" onClick={() => setActiveW(`w${week.n + 1}`)}
              style={{ flex: 1, padding: "15px", borderRadius: 12, background: "#fa5400", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
              Week {week.n + 1} →
            </button>
          )}
        </div>

        {/* ZONES REFERENCE */}
        <div style={{ marginTop: 20, background: "#1c1c1e", borderRadius: 16, padding: "16px", border: "1px solid #2c2c2e" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: "#48484a", textTransform: "uppercase", marginBottom: 12 }}>Training Zones · Verified 8 June</div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {[
              { n: "Recovery", p: "7:00+", h: "≤135", c: "#30d158" },
              { n: "Easy Z2", p: "6:20–7:00", h: "138–150", c: "#30d158" },
              { n: "Train MP", p: "5:20–5:35", h: "153–162", c: "#0a84ff" },
              { n: "Threshold", p: "4:42–4:52", h: "168–174", c: "#ff9f0a" },
              { n: "Race MP", p: "4:55", h: "163–167", c: "#fa5400" },
            ].map(z => (
              <div key={z.n} style={{ flex: "1 0 72px", minWidth: 72, background: "#111", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #2c2c2e" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: z.c, margin: "0 auto 6px" }} />
                <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#48484a", textTransform: "uppercase", marginBottom: 3 }}>{z.n}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>{z.p}</div>
                <div style={{ fontSize: 8.5, color: "#3a3a3c", marginTop: 2 }}>{z.h}bpm</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 9, color: "#3a3a3c", textAlign: "center", letterSpacing: 1, lineHeight: 2, textTransform: "uppercase", paddingBottom: 8 }}>
          Tap circle to log · Tap km to edit actual · Warmup inside each session · Tap to add notes
        </div>
      </div>
    </div>
  );
}
