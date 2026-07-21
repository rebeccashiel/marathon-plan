import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabase";

const USER_ID = "default_user_skeleton";
interface Prog { completed: Record<string,boolean>; km: Record<string,number>; notes: Record<string,string>; }

async function load(): Promise<Prog|null> {
  try {
    const { data, error } = await supabase.from("progress").select("completed, km_logged, notes").eq("user_id", USER_ID).single();
    if (error || !data) return null;
    return { completed: data.completed || {}, km: data.km_logged || {}, notes: data.notes || {} };
  } catch { return null; }
}

async function save(d: Prog) {
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

interface Sesh { id:string; day:string; tag:Tag; title:string; km:number|null; detail:string; paces?:string; }
interface Wk { id:string; n:number; dates:string; phase:string; theme:string; targetKm:number; sessions:Sesh[]; isDeload?:boolean; isRace?:boolean; isTaper?:boolean; isPeak?:boolean; }

const WEEKS: Wk[] = [
  // ── BLOCK 1: BASE ───────────────────────────────────────────────────
  { id:"w1", n:1, dates:"29 Jun – 5 Jul", phase:"Base", theme:"Aerobic Foundation", targetKm:62, sessions:[
    { id:"w1-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:10, detail:"First run of the official build. All Z2, run by HR.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w1-tue", day:"TUE", tag:"quality", title:"Threshold Intervals + Leg PT", km:10, detail:"Run first. 3×1km @ threshold, 90sec jog recovery. Leg PT after.", paces:"4:42–4:52/km · 168–174bpm" },
    { id:"w1-wed", day:"WED", tag:"easy", title:"Easy Z2 — Tired Legs", km:10, detail:"Post-PT easy. HR ceiling ≤152bpm.", paces:"6:20–7:00/km · ≤152bpm" },
    { id:"w1-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:7, detail:"Easy run to gym. Upper body and core PT only.", paces:"6:30–7:00/km easy" },
    { id:"w1-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Short flat shakeout. Not a training stimulus.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w1-sat", day:"SAT", tag:"long", title:"Long Run — 20km", km:20, detail:"All Z2. First proper long run. Gel at 45min.", paces:"6:20–6:50/km · ≤152bpm" },
    { id:"w1-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Full rest. Non-negotiable every Sunday." },
  ]},
  { id:"w2", n:2, dates:"6–12 Jul", phase:"Base", theme:"Volume + First MP Taste", targetKm:66, sessions:[
    { id:"w2-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:10, detail:"Aerobic accumulation.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w2-tue", day:"TUE", tag:"quality", title:"Threshold Intervals + Leg PT", km:11, detail:"Run first. 4×1km @ threshold, 90sec jog recovery. Leg PT after.", paces:"4:42–4:52/km · 168–174bpm" },
    { id:"w2-wed", day:"WED", tag:"easy", title:"Easy Z2 — Tired Legs", km:10, detail:"Post-PT easy. Don't chase pace.", paces:"6:20–7:00/km · ≤152bpm" },
    { id:"w2-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:7, detail:"Easy run to gym. Upper and core only.", paces:"6:30–7:00/km easy" },
    { id:"w2-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w2-sat", day:"SAT", tag:"long", title:"Long Run + First MP Segment — 22km", km:22, detail:"4km easy → 10km @ training MP → 8km easy. First extended MP block.", paces:"Easy: 6:20–6:50/km · MP: 5:04–5:15/km · 160–167bpm" },
    { id:"w2-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest, recover, absorb." },
  ]},
  { id:"w3", n:3, dates:"13–19 Jul", phase:"Base", theme:"Building Consistency", targetKm:70, sessions:[
    { id:"w3-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:10, detail:"Volume ticking up. Keep HR honest.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w3-tue", day:"TUE", tag:"quality", title:"Threshold Intervals + Leg PT", km:11, detail:"Run first. 4×1km @ threshold, 90sec jog recovery. Leg PT after.", paces:"4:42–4:52/km · 168–174bpm" },
    { id:"w3-wed", day:"WED", tag:"easy", title:"Easy Z2 — Tired Legs", km:11, detail:"Post-PT easy.", paces:"6:20–7:00/km · ≤152bpm" },
    { id:"w3-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run to gym. Upper and core only.", paces:"6:30–7:00/km easy" },
    { id:"w3-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w3-sat", day:"SAT", tag:"long", title:"Long Run + MP Segment — 24km", km:24, detail:"4km easy → 12km @ training MP → 8km easy.", paces:"MP: 5:04–5:15/km · 160–167bpm" },
    { id:"w3-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  { id:"w4", n:4, dates:"20–26 Jul", phase:"Base", theme:"Deload — Absorb & Reset", targetKm:38, isDeload:true, sessions:[
    { id:"w4-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:8, detail:"Shorter than usual. Let the body absorb.", paces:"6:30–7:00/km · ≤148bpm" },
    { id:"w4-tue", day:"TUE", tag:"gym", title:"Run to PT + Legs", km:7, detail:"PT can push legs harder this week. Running load is reduced.", paces:"6:30–7:00/km easy" },
    { id:"w4-wed", day:"WED", tag:"easy", title:"Easy Z2 + Strides", km:8, detail:"Easy run + 4×80m strides. Neuromuscular maintenance.", paces:"6:30–7:00/km · strides ~4:30/km effort" },
    { id:"w4-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:7, detail:"Easy run + upper/core PT.", paces:"6:30–7:00/km easy" },
    { id:"w4-fri", day:"FRI", tag:"shake", title:"Easy Shakeout", km:4, detail:"Flat and short.", paces:"6:45–7:15/km · ≤140bpm" },
    { id:"w4-sat", day:"SAT", tag:"long", title:"Easy Long Run — 14km", km:14, detail:"All easy. No MP segment. Arrive at Week 5 fresh.", paces:"6:20–6:50/km · ≤150bpm" },
    { id:"w4-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  // ── BLOCK 2: DEVELOPMENT ────────────────────────────────────────────
  { id:"w5", n:5, dates:"27 Jul–2 Aug", phase:"Development", theme:"Raising the Ceiling", targetKm:65, sessions:[
    { id:"w5-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:9, detail:"Back fresh from deload. All Z2, run by HR.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w5-tue", day:"TUE", tag:"quality", title:"Continuous Tempo + Leg PT", km:11, detail:"Run first on fresh legs. 2km easy warm-up → 20min continuous tempo (no breaks) → 2km easy cool-down. Different stimulus from interval reps — sustained lactate pressure rather than repeated spikes. Leg PT after.", paces:"Tempo: 4:42–4:52/km continuous · 168–174bpm" },
    { id:"w5-wed", day:"WED", tag:"easy", title:"Easy Z2 — Tired Legs", km:8, detail:"Post-tempo easy run. HR will sit higher than usual — that's expected. Run by ceiling not pace.", paces:"6:20–7:00/km · ≤152bpm" },
    { id:"w5-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:7, detail:"Easy run to gym. Upper body and core PT only. Legs protecting Saturday's long run.", paces:"6:30–7:00/km easy" },
    { id:"w5-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush. Short and flat.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w5-sat", day:"SAT", tag:"long", title:"Long Run + MP Segment — 25km", km:25, detail:"5km easy → 13km @ training MP → 7km easy. Use custom watch workout to keep MP segment honest. Fuel: gel at 40min, gel at 80min.", paces:"Easy: 6:20–6:50/km · MP: 5:04–5:15/km · 160–167bpm" },
    { id:"w5-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  { id:"w6", n:6, dates:"3–9 Aug", phase:"Development", theme:"Specificity Increasing", targetKm:68, sessions:[
    { id:"w6-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:10, detail:"Aerobic base work continuing. All Z2, run by HR.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w6-tue", day:"TUE", tag:"quality", title:"Hill Repeats + Leg PT", km:11, detail:"Run first. 1km easy to base of hill → 6×90sec uphill at hard effort → walk back down each time → 2km easy cool-down. The Camps Bay climb is ideal. Uphill running builds strength-endurance with lower injury risk than flat speed work. Leg PT after.", paces:"Uphill effort: ~175–182bpm · Recovery: walk back down" },
    { id:"w6-wed", day:"WED", tag:"easy", title:"Easy Z2 — Tired Legs", km:8, detail:"Post-hills easy run. Legs will be heavy from the hill reps and PT. Run by HR ceiling.", paces:"6:20–7:00/km · ≤152bpm" },
    { id:"w6-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:7, detail:"Easy run to gym. Upper body and core PT only.", paces:"6:30–7:00/km easy" },
    { id:"w6-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w6-sat", day:"SAT", tag:"long", title:"Long Run + MP Segment — 27km", km:27, detail:"5km easy → 15km @ training MP → 7km easy. Longest MP block yet. Custom watch workout essential — pace alerts at 5:04–5:15/km. Fuel: gel at 40min, gel at 80min, gel at 115min.", paces:"Easy: 6:20–6:50/km · MP: 5:00–5:12/km · 160–167bpm" },
    { id:"w6-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  { id:"w7", n:7, dates:"10–16 Aug", phase:"Development", theme:"2nd Quality Session Introduced", targetKm:72, sessions:[
    { id:"w7-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:10, detail:"All Z2. Two quality sessions this week so easy days must be genuinely easy.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w7-tue", day:"TUE", tag:"quality", title:"Threshold Intervals + Leg PT", km:11, detail:"Run first on fresh legs. 2km easy warm-up → 4×1km @ 4:42–4:52/km with 90sec jog recovery between each rep → 2km easy cool-down. Week 8 is a deload — this is the right moment to introduce a second quality day since recovery follows immediately. Leg PT after.", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:42–4:52/km · 168–174bpm" },
    { id:"w7-wed", day:"WED", tag:"quality", title:"★ 2nd Quality Session — Fartlek", km:10, detail:"SECOND QUALITY SESSION INTRODUCED. After a proper warm-up, run 25 minutes of fartlek: alternate 3 minutes at moderate effort (5:10–5:20/km) with 2 minutes easy (6:20–7:00/km) throughout. No rigid structure — respond to terrain and feel. Develops pace versatility and aerobic range without the precision demand of intervals.", paces:"Moderate: 5:10–5:20/km · Easy: 6:20–7:00/km" },
    { id:"w7-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run to gym. Upper body and core PT only. Two quality sessions behind you this week — legs need protecting.", paces:"6:30–7:00/km easy" },
    { id:"w7-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Two quality sessions this week — keep Friday genuinely short and easy.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w7-sat", day:"SAT", tag:"long", title:"Long Run + MP Segment — 28km", km:28, detail:"5km easy → 16km @ training MP → 7km easy. Peak long run of Block 2. Custom watch workout essential. Deload follows next week. Fuel every 30–35min from 40min mark.", paces:"Easy: 6:20–6:50/km · MP: 5:00–5:10/km · 160–167bpm" },
    { id:"w7-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day. Big week done. Earn the deload." },
  ]},
  { id:"w8", n:8, dates:"17–23 Aug", phase:"Development", theme:"Deload — Absorb Block 2", targetKm:40, isDeload:true, sessions:[
    { id:"w8-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:5, detail:"Short and easy. Legs earned this after Week 7.", paces:"6:30–7:00/km · ≤148bpm" },
    { id:"w8-tue", day:"TUE", tag:"gym", title:"Run to PT + Legs", km:6, detail:"Easy run to gym. PT can push legs properly this week since running load is reduced. Good week for progressive overload on glute and hip work.", paces:"6:30–7:00/km easy" },
    { id:"w8-wed", day:"WED", tag:"easy", title:"Easy Z2 + Strides", km:6, detail:"Easy run + 4×80m strides at the end. Accelerate smoothly over 80m, walk back. Neuromuscular maintenance only — keeping fast-twitch fibres awake without aerobic stress.", paces:"6:30–7:00/km · strides ~4:20/km effort" },
    { id:"w8-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:6, detail:"Easy run + upper body and core PT.", paces:"6:30–7:00/km easy" },
    { id:"w8-fri", day:"FRI", tag:"shake", title:"Easy Shakeout", km:4, detail:"Short and flat. Legs should be feeling noticeably lighter.", paces:"6:45–7:15/km · ≤140bpm" },
    { id:"w8-sat", day:"SAT", tag:"long", title:"Easy Long Run — 13km", km:13, detail:"All easy. No MP segment. Zero intensity. Arrive at Week 9 feeling genuinely fresh and hungry for more.", paces:"6:20–6:50/km · ≤150bpm" },
    { id:"w8-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  // ── BLOCK 3: RACE-SPECIFIC ───────────────────────────────────────────
  { id:"w9", n:9, dates:"24–30 Aug", phase:"Race-Specific", theme:"Marathon Specificity Begins", targetKm:68, sessions:[
    { id:"w9-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:11, detail:"Back fresh from deload. Volume stepping up into the race-specific phase.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w9-tue", day:"TUE", tag:"quality", title:"Race-MP Intervals + Leg PT", km:11, detail:"Run first on fresh legs. 2km easy warm-up → 4×2km @ race-target MP with 2min jog recovery → 2km easy cool-down. This is the first session at actual goal race pace rather than training MP. The effort should feel controlled-hard, not maximal. Leg PT after.", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:55–5:04/km · 160–167bpm" },
    { id:"w9-wed", day:"WED", tag:"quality", title:"Continuous Tempo", km:10, detail:"After a proper warm-up, run 25 minutes continuous at threshold pace. Different stimulus from Tuesday's broken reps — sustained effort without recovery. Tests your ability to hold pace when fatigued.", paces:"4:42–4:52/km continuous · 168–174bpm" },
    { id:"w9-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run to gym. Upper body and core PT only.", paces:"6:30–7:00/km easy" },
    { id:"w9-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Two quality sessions this week — keep Friday genuinely easy.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w9-sat", day:"SAT", tag:"long", title:"Long Run + Extended MP — 29km", km:29, detail:"5km easy → 17km @ race-approaching MP → 7km easy. Getting serious. Custom watch workout essential. Fuel every 30–35min from 40min mark.", paces:"Easy: 6:20–6:50/km · MP: 5:00–5:10/km · 160–167bpm" },
    { id:"w9-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  { id:"w10", n:10, dates:"31 Aug–6 Sep", phase:"Race-Specific", theme:"Peak Volume Territory", targetKm:72, sessions:[
    { id:"w10-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:11, detail:"High volume week. Keep easy days genuinely easy — no tempo creep.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w10-tue", day:"TUE", tag:"quality", title:"Progression Run + Leg PT", km:12, detail:"Run first on fresh legs. 10km structured progression: 3km easy warm-up → 3km @ training MP → 2km @ threshold → 2km @ 10K effort → finish. Teaches your body to run fast on accumulated fatigue — the most race-specific quality session in the plan. Leg PT after.", paces:"MP: 5:00–5:10/km · Threshold: 4:42–4:52/km · 10K: 4:25–4:38/km" },
    { id:"w10-wed", day:"WED", tag:"quality", title:"Race-MP Intervals", km:11, detail:"After warm-up, run 5×1.5km @ race MP with 90sec jog recovery. Short reps allow you to stay controlled at goal pace without blowing up.", paces:"4:55–5:04/km · 160–167bpm" },
    { id:"w10-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run to gym. Upper body and core PT only.", paces:"6:30–7:00/km easy" },
    { id:"w10-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush. Two quality sessions behind you.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w10-sat", day:"SAT", tag:"long", title:"Long Run — 30km", km:30, detail:"5km easy → 20km @ goal MP → 5km easy. Longest MP block of the build. Custom watch workout essential. This should feel hard. That's correct. Fuel every 30–35min from 40min mark.", paces:"Easy: 6:20–6:50/km · MP: 4:58–5:08/km · 160–167bpm" },
    { id:"w10-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day. Big week done." },
  ]},
  // ── GUN RUN WEEK ─────────────────────────────────────────────────────
  { id:"w11", n:11, dates:"7–13 Sep", phase:"Race-Specific", theme:"Gun Run Week — Mini Taper", targetKm:39, isRace:true, sessions:[
    { id:"w11-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:8, detail:"Mini taper begins. Controlled easy start to race week. Don't add volume.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w11-tue", day:"TUE", tag:"quality", title:"Short Sharpener + Light Leg PT", km:6, detail:"Run first. 1km easy warm-up → 2×1km @ threshold pace (4:42–4:52/km) with 2min jog recovery → 4×200m @ 10K effort (4:15–4:25/km) with 60sec walk recovery → 1km easy cool-down. Short and sharp — keeps legs awake before Sunday without creating fatigue. Light leg PT after.", paces:"Threshold: 4:42–4:52/km · 200m: 4:15–4:25/km" },
    { id:"w11-wed", day:"WED", tag:"easy", title:"Easy Z2 — Mini Taper", km:5, detail:"Volume dropping for Sunday race. Genuinely easy.", paces:"6:30–7:00/km · ≤148bpm" },
    { id:"w11-thu", day:"THU", tag:"gym", title:"Run to PT — Light Upper Only", km:4, detail:"Easy short run + light upper body only. Zero leg work today.", paces:"6:30–7:00/km easy" },
    { id:"w11-fri", day:"FRI", tag:"shake", title:"Shakeout + Strides", km:4, detail:"Short flat shakeout + 4×80m strides. Legs should feel sharp. Eat well and sleep early tonight.", paces:"6:45–7:15/km · 4 strides at race effort" },
    { id:"w11-sat", day:"SAT", tag:"rest", title:"Rest — Race Tomorrow", km:null, detail:"Full rest. Kit laid out. Confirm fuel plan. Race morning: carb breakfast 90min before start. Sleep early." },
    { id:"w11-sun", day:"SUN", tag:"race", title:"OUTSURANCE GUN RUN — 21.1km", km:21.1, detail:"TARGET: Sub-1:42 PB. Follicular phase — good timing. Hilly course — run first 5km conservatively by HR not pace. Don't blow up on the climb. Fuel: gel at 25min and 50min. This is your marathon fitness checkpoint.", paces:"Target: sub-1:42 · First 5km: conservative by HR" },
  ]},
  // ── POST GUN RUN ─────────────────────────────────────────────────────
  { id:"w12", n:12, dates:"14–20 Sep", phase:"Race-Specific", theme:"Post Gun Run — As It Comes", targetKm:58, sessions:[
    { id:"w12-mon", day:"MON", tag:"easy", title:"Easy Recovery Run", km:8, detail:"Post-race legs. Go entirely by feel. Elevated HR is normal race fatigue. Shorten if needed.", paces:"6:45–7:30/km · ≤148bpm" },
    { id:"w12-tue", day:"TUE", tag:"gym", title:"Run to PT + Legs", km:8, detail:"Easy run to gym. PT can push legs this week. Use Gun Run data to refine strength focus.", paces:"6:30–7:00/km easy" },
    { id:"w12-wed", day:"WED", tag:"easy", title:"Easy Z2 + Strides", km:9, detail:"Easy run + 4×80m strides. Legs waking back up after the race.", paces:"6:30–7:00/km · strides ~4:20/km effort" },
    { id:"w12-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run + upper body and core PT.", paces:"6:30–7:00/km easy" },
    { id:"w12-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush. Legs should feel noticeably fresher by now.", paces:"6:45–7:15/km · ≤142bpm" },
    { id:"w12-sat", day:"SAT", tag:"long", title:"Moderate Long Run — 20km", km:20, detail:"Easy to moderate throughout. No MP segment — just time on feet confirming race recovery. Adjust week 12 total based on how you feel post-race.", paces:"6:10–6:40/km · ≤158bpm" },
    { id:"w12-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  // ── PEAK ─────────────────────────────────────────────────────────────
  { id:"w13", n:13, dates:"21–27 Sep", phase:"Race-Specific", theme:"PEAK WEEK — Longest Long Run", targetKm:79, isPeak:true, sessions:[
    { id:"w13-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:12, detail:"Fresh from the post-Gun Run week. Use that freshness wisely — not today.", paces:"6:20–7:00/km · ≤150bpm" },
    { id:"w13-tue", day:"TUE", tag:"quality", title:"Race-Pace Intervals + Leg PT", km:13, detail:"Run first on fresh legs. 2km easy warm-up → 6×1km @ exact race MP (4:55/km) with 90sec jog recovery → 2km easy cool-down. Should feel controlled. If it doesn't, the previous week hasn't fully absorbed — back off the pace slightly. Leg PT after.", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:55/km exactly · 160–167bpm" },
    { id:"w13-wed", day:"WED", tag:"quality", title:"Threshold Tempo", km:11, detail:"After warm-up, run 20 minutes continuous at threshold pace. Second quality session of peak week.", paces:"4:42–4:52/km · 168–174bpm" },
    { id:"w13-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:9, detail:"Easy run to gym. Upper body and core PT only. Protect legs for Saturday.", paces:"6:30–7:00/km easy" },
    { id:"w13-fri", day:"FRI", tag:"shake", title:"Short Shakeout", km:4, detail:"As short as possible. Legs need maximum freshness for Saturday's peak long run.", paces:"6:45–7:10/km · ≤142bpm" },
    { id:"w13-sat", day:"SAT", tag:"long", title:"★ PEAK LONG RUN — 32–34km", km:33, detail:"THE long run. 5km easy → 22km @ goal MP (4:55–5:04/km) → 6–8km easy. Full race-day fueling protocol: gel every 30–35min from 30min mark. Most important training session of the entire build. Arrive rested, fueled, and focused.", paces:"Easy: 6:20–6:50/km · MP: 4:55–5:04/km · Fuel every 30–35min" },
    { id:"w13-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Full rest. You have done the work. Let it absorb completely." },
  ]},
  // ── FINAL BUILD ───────────────────────────────────────────────────────
  { id:"w14", n:14, dates:"28 Sep–4 Oct", phase:"Race-Specific", theme:"Final Quality — Taper Begins", targetKm:65, sessions:[
    { id:"w14-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:11, detail:"Post-peak Monday. Legs will feel heavy. Go slow and accept it.", paces:"6:30–7:15/km · ≤150bpm" },
    { id:"w14-tue", day:"TUE", tag:"quality", title:"Race-Pace Sharpener + Leg PT", km:11, detail:"Run first. 2km easy warm-up → 3×2km @ race MP with 2min jog recovery → 2km easy cool-down. Last significant quality session of the build. Confirm you can hold 4:55/km feeling in control. Leg PT after.", paces:"Warm-up/CD: 6:30–7:00/km · Reps: 4:55/km · 160–167bpm" },
    { id:"w14-wed", day:"WED", tag:"quality", title:"Short Tempo", km:9, detail:"After warm-up, run 15 minutes continuous at threshold. Last proper tempo of the build — shorter than previous weeks intentionally.", paces:"4:42–4:52/km · 168–174bpm" },
    { id:"w14-thu", day:"THU", tag:"gym", title:"Run to PT — Upper + Core", km:8, detail:"Easy run to gym. Upper body and core PT. Last heavier upper body session before taper.", paces:"6:30–7:00/km easy" },
    { id:"w14-fri", day:"FRI", tag:"shake", title:"Shakeout", km:5, detail:"Pre-long-run flush.", paces:"6:40–7:10/km · ≤145bpm" },
    { id:"w14-sat", day:"SAT", tag:"long", title:"Dress Rehearsal — 26km", km:26, detail:"5km easy → 16km @ exact race MP → 5km easy. Full race-day nutrition protocol — practice everything exactly as race day. Final confidence builder before taper.", paces:"MP: 4:55/km exactly · Full fueling protocol" },
    { id:"w14-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day. Taper starts Monday." },
  ]},
  // ── TAPER ─────────────────────────────────────────────────────────────
  { id:"w15", n:15, dates:"5–11 Oct", phase:"Taper", theme:"Taper — Volume Drops, Sharpness Stays", targetKm:42, isTaper:true, sessions:[
    { id:"w15-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:8, detail:"Volume dropping. Legs may feel oddly heavy or oddly good — both are normal taper responses. Trust the process.", paces:"6:20–7:00/km · ≤148bpm" },
    { id:"w15-tue", day:"TUE", tag:"quality", title:"Race-MP Sharpener + Light Leg PT", km:7, detail:"Run first. 1km easy → 3×1km @ race MP with 90sec jog recovery → 1km easy. Short, sharp, controlled. Purpose is maintaining neuromuscular sharpness, not building fitness. Light leg PT after.", paces:"Reps: 4:55/km · 160–167bpm" },
    { id:"w15-wed", day:"WED", tag:"easy", title:"Easy Z2 Run", km:6, detail:"Taper. Easy. Trust what you have built.", paces:"6:20–7:00/km · ≤148bpm" },
    { id:"w15-thu", day:"THU", tag:"gym", title:"Run to PT — Light Full Body", km:5, detail:"Easy run + light full body PT. Nothing heavy, nothing to failure. Last proper PT session before race.", paces:"6:30–7:00/km easy" },
    { id:"w15-fri", day:"FRI", tag:"shake", title:"Shakeout + Strides", km:4, detail:"Easy shakeout + 4×80m strides. Legs should feel snappy.", paces:"6:40–7:10/km · 4 strides" },
    { id:"w15-sat", day:"SAT", tag:"long", title:"Easy Medium Run — 12km", km:12, detail:"All easy. Last run of any real length. Enjoy it.", paces:"6:20–6:50/km · ≤150bpm" },
    { id:"w15-sun", day:"SUN", tag:"rest", title:"Rest — Church", km:null, detail:"Rest day." },
  ]},
  { id:"w16", n:16, dates:"12–18 Oct", phase:"Taper", theme:"Race Week — Arrive Ready", targetKm:24, isTaper:true, sessions:[
    { id:"w16-mon", day:"MON", tag:"easy", title:"Easy Z2 Run", km:6, detail:"Short and controlled. You will want to do more. Don't.", paces:"6:20–7:00/km · ≤148bpm" },
    { id:"w16-tue", day:"TUE", tag:"quality", title:"Final Sharpener", km:5, detail:"Run first. 1km easy → 2×1km @ race MP → 1km easy. Done. Confirm the legs remember the pace.", paces:"4:55/km · 160–167bpm" },
    { id:"w16-wed", day:"WED", tag:"easy", title:"Very Easy Run", km:5, detail:"Last proper training run. Enjoy every step.", paces:"6:30–7:00/km · ≤145bpm" },
    { id:"w16-thu", day:"THU", tag:"shake", title:"Easy Shakeout", km:4, detail:"Very short. Just moving. Keep it flat.", paces:"6:45–7:15/km" },
    { id:"w16-fri", day:"FRI", tag:"rest", title:"Full Rest", km:null, detail:"Rest. Final carb load: 80–100g carbs per meal. Kit laid out. Nothing on feet except walking." },
    { id:"w16-sat", day:"SAT", tag:"rest", title:"Rest — Race Tomorrow", km:null, detail:"Relax. Walk only. Carb load done. Breakfast planned. Sleep early. You are ready." },
    { id:"w16-sun", day:"SUN", tag:"race", title:"RACE DAY — 18 OCTOBER 2026", km:42.2, detail:"Sub-3:30 target. Start 05:30am. First 8–9km run by HR not pace — the course climbs here. Settle into 4:55/km from km 8–30. Build the final 12km. Fuel every 30–35min from 30min mark. You have done every session. Trust it completely.", paces:"0–8km: HR controlled · 8–30km: 4:55/km · 30–42km: build" },
  ]},
];

const PHASE_COLOR: Record<string,string> = {
  "Base":"#30d158", "Development":"#0a84ff", "Race-Specific":"#fa5400", "Taper":"#bf5af2"
};

export default function MarathonSkeleton() {
  const [activeW, setActiveW] = useState("w1");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const [completed, setCompleted] = useState<Record<string,boolean>>({});
  const [km, setKm] = useState<Record<string,number>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [editKm, setEditKm] = useState<string|null>(null);
  const [editNote, setEditNote] = useState<string|null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"err">("idle");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await load();
      if (s) { setCompleted(p=>({...p,...s.completed})); setKm(p=>({...p,...s.km})); setNotes(p=>({...p,...s.notes})); }
      setLoaded(true);
    })();
  }, []);

  const doSave = async () => {
    setSaveStatus("saving");
    try { await save({ completed, km, notes }); setSaveStatus("saved"); setDirty(false); setTimeout(()=>setSaveStatus("idle"), 2500); }
    catch { setSaveStatus("err"); }
  };

  const week = WEEKS.find(w => w.id === activeW)!;

  const globalStats = useMemo(() => {
    const totalKm = Object.values(km).reduce((a,b)=>a+b,0);
    const done = Object.values(completed).filter(Boolean).length;
    const total = WEEKS.reduce((a,w)=>a+w.sessions.length,0);
    return { totalKm: Math.round(totalKm*10)/10, done, total };
  }, [km, completed]);

  const wStats = useMemo(() => {
    const logged = week.sessions.reduce((s,x)=>completed[x.id]&&km[x.id]?s+km[x.id]:s,0);
    const done = week.sessions.filter(s=>completed[s.id]).length;
    const pct = Math.min(100, Math.round((logged/week.targetKm)*100));
    return { logged: Math.round(logged*10)/10, done, total: week.sessions.length, pct };
  }, [week, completed, km]);

  const check = (id: string, plannedKm: number|null) => {
    setCompleted(p => {
      const n = {...p, [id]: !p[id]};
      if (n[id] && plannedKm !== null && km[id] === undefined) setKm(k=>({...k,[id]:plannedKm}));
      return n;
    });
    setDirty(true);
  };

  const wColor = week.isRace?"#fa5400":week.isPeak?"#fa5400":week.isTaper?"#bf5af2":week.isDeload?"#636366":PHASE_COLOR[week.phase]||"#fa5400";

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
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#fa5400",textTransform:"uppercase",marginBottom:5}}>16-Week Build · 29 Jun – 18 Oct 2026</div>
              <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.8,lineHeight:1}}>Sub-3:30 Plan</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#30d158",letterSpacing:-0.3}}>{globalStats.totalKm}km</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:2}}>{globalStats.done}/{globalStats.total} sessions</div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={doSave}
            style={{width:"100%",padding:"12px",borderRadius:10,marginBottom:14,background:saveStatus==="err"?"#ff453a":saveStatus==="saved"?"#30d158":"#fa5400",border:"none",color:"#fff",fontSize:13,fontWeight:800,letterSpacing:0.5,cursor:"pointer"}}>
            {saveStatus==="saving"?"SAVING…":saveStatus==="err"?"⚠ SAVE FAILED — TAP TO RETRY":saveStatus==="saved"?"✓ SAVED":"SAVE CHANGES"}
          </button>

          {/* WEEK PILLS */}
          <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:12}}>
            {WEEKS.map(w => {
              const active = w.id === activeW;
              const col = w.isRace||w.isPeak?"#fa5400":w.isTaper?"#bf5af2":w.isDeload?"#636366":PHASE_COLOR[w.phase];
              const done = w.sessions.filter(s=>completed[s.id]).length;
              const pct = Math.round((done/w.sessions.length)*100);
              return (
                <button key={w.id} className="tap" onClick={()=>setActiveW(w.id)}
                  style={{flexShrink:0,minWidth:44,padding:"8px 10px",borderRadius:8,background:active?col:"#1c1c1e",border:`1.5px solid ${active?col:"#2c2c2e"}`,textAlign:"center"}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:1,color:active?"rgba(255,255,255,.7)":col,textTransform:"uppercase",marginBottom:2}}>W{w.n}</div>
                  <div style={{fontSize:13,fontWeight:800,color:active?"#fff":"#aaa"}}>{w.targetKm}</div>
                  {pct>0&&pct<100&&<div style={{marginTop:3,height:2,background:"#333",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:1}}/></div>}
                  {pct===100&&<div style={{marginTop:3,fontSize:8,color:active?"#fff":"#30d158",fontWeight:700}}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"16px 20px 0"}}>

        {/* WEEK HERO */}
        <div style={{background:"#1c1c1e",borderRadius:16,padding:"16px",marginBottom:12,border:"1px solid #2c2c2e"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:wColor,textTransform:"uppercase"}}>Week {week.n} · {week.phase}</span>
                {week.isDeload&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 7px",borderRadius:20,background:"#2c2c2e",color:"#636366",textTransform:"uppercase"}}>Deload</span>}
                {week.isPeak&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 7px",borderRadius:20,background:"#3a1500",color:"#fa5400",textTransform:"uppercase"}}>Peak</span>}
                {week.isTaper&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 7px",borderRadius:20,background:"#1c0a2e",color:"#bf5af2",textTransform:"uppercase"}}>Taper</span>}
                {week.isRace&&<span style={{fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 7px",borderRadius:20,background:"#3a0a00",color:"#fa5400",textTransform:"uppercase"}}>Race</span>}
              </div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.3,color:"#fff",lineHeight:1.2}}>{week.theme}</div>
              <div style={{fontSize:11,color:"#48484a",marginTop:3}}>{week.dates}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,lineHeight:1,color:wStats.pct>=100?"#30d158":"#fff"}}>{wStats.logged}</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:2}}>/ {week.targetKm}km</div>
              <div style={{fontSize:10,color:"#48484a",marginTop:1}}>{wStats.done}/{wStats.total} sessions</div>
            </div>
          </div>
          <div style={{marginTop:12,height:3,background:"#2c2c2e",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${wStats.pct}%`,background:wColor,borderRadius:2,transition:"width .4s ease"}}/>
          </div>
        </div>

        {/* SESSIONS */}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {week.sessions.map(s => {
            const isDone = !!completed[s.id];
            const isOpen = !!expanded[s.id];
            const meta = TAGS[s.tag];
            return (
              <div key={s.id} style={{borderRadius:12,overflow:"hidden",border:`1px solid ${isOpen?"#3a3a3c":"#2c2c2e"}`,background:isDone?"#0d0d0d":"#1c1c1e"}}>
                <div className="row" style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px"}}
                  onClick={()=>setExpanded(p=>({...p,[s.id]:!p[s.id]}))}>
                  <button className="chk" onClick={e=>{e.stopPropagation();check(s.id,s.km);}}
                    style={{width:26,height:26,borderRadius:"50%",background:isDone?meta.color:"transparent",border:`2px solid ${isDone?meta.color:"#3a3a3c"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isDone&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L4.8 9L10 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <div style={{width:32,flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:isDone?"#3a3a3c":meta.color,textTransform:"uppercase"}}>{s.day}</div>
                  </div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"2px 7px",borderRadius:4,background:isDone?"#1a1a1a":`${meta.color}22`,color:isDone?"#3a3a3c":meta.color,flexShrink:0,whiteSpace:"nowrap"}}>{meta.label}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:isDone?"#3a3a3c":"#fff",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.2}}>{s.title}</div>
                    {s.paces&&!isOpen&&<div style={{fontSize:9,color:"#48484a",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.paces}</div>}
                  </div>
                  <div style={{flexShrink:0,textAlign:"right",minWidth:52}} onClick={e=>e.stopPropagation()}>
                    {s.km!==null?(
                      isDone&&editKm===s.id?(
                        <input type="number" step=".1" autoFocus defaultValue={km[s.id]??s.km}
                          onBlur={e=>{const v=parseFloat(e.target.value);setKm(k=>({...k,[s.id]:isNaN(v)?s.km!:v}));setEditKm(null);setDirty(true);}}
                          onKeyDown={e=>{if(e.key==="Enter")(e.target as HTMLInputElement).blur();}}
                          style={{width:48,fontSize:15,fontWeight:800,textAlign:"right",background:"transparent",border:"none",borderBottom:`1px solid ${meta.color}`,color:"#fff",outline:"none"}}/>
                      ):(
                        <div onClick={()=>isDone&&setEditKm(s.id)} style={{cursor:isDone?"text":"default"}}>
                          <span style={{fontSize:20,fontWeight:800,color:isDone?"#30d158":"#fff",letterSpacing:-0.5}}>{isDone?(km[s.id]??s.km):s.km}</span>
                          <span style={{fontSize:10,color:isDone?"#30d158":"#555",marginLeft:1}}>km</span>
                        </div>
                      )
                    ):<div style={{fontSize:13,color:"#333"}}>—</div>}
                  </div>
                  <svg style={{flexShrink:0,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s"}} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="#48484a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {isOpen&&(
                  <div className="fi" style={{padding:"0 16px 14px",borderTop:"1px solid #2c2c2e"}} onClick={e=>e.stopPropagation()}>
                    <p style={{fontSize:13,color:"#aeaeb2",lineHeight:1.7,marginTop:10}}>{s.detail}</p>
                    {s.paces&&(
                      <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:8,background:"#111",borderRadius:8,padding:"7px 12px",border:"1px solid #2c2c2e"}}>
                        <div style={{width:3,height:3,borderRadius:"50%",background:meta.color}}/>
                        <span style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#636366",textTransform:"uppercase"}}>Paces</span>
                        <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{s.paces}</span>
                      </div>
                    )}
                    <div style={{marginTop:10,borderTop:"1px solid #2c2c2e",paddingTop:10}}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:"#48484a",textTransform:"uppercase",marginBottom:6}}>Session Note</div>
                      {editNote===s.id?(
                        <textarea autoFocus defaultValue={notes[s.id]||""} placeholder="How did it go?"
                          onBlur={e=>{setNotes(n=>({...n,[s.id]:e.target.value.trim()}));setEditNote(null);setDirty(true);}}
                          style={{width:"100%",minHeight:60,fontSize:12,background:"#111",border:"1px solid #2c2c2e",borderRadius:8,color:"#aeaeb2",outline:"none",resize:"vertical",lineHeight:1.6,padding:"8px 10px"}}/>
                      ):(
                        <div onClick={()=>setEditNote(s.id)} style={{cursor:"text",fontSize:12,color:notes[s.id]?"#aeaeb2":"#3a3a3c",fontStyle:notes[s.id]?"normal":"italic",lineHeight:1.6}}>
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
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {week.n>1&&<button className="tap" onClick={()=>setActiveW(`w${week.n-1}`)} style={{flex:1,padding:"13px",borderRadius:12,background:"#1c1c1e",color:"#fff",fontSize:13,fontWeight:700,border:"1px solid #2c2c2e"}}>← Week {week.n-1}</button>}
          {week.n<16&&<button className="tap" onClick={()=>setActiveW(`w${week.n+1}`)} style={{flex:1,padding:"13px",borderRadius:12,background:"#fa5400",color:"#fff",fontSize:13,fontWeight:700}}>Week {week.n+1} →</button>}
        </div>

        {/* ZONES */}
        <div style={{marginTop:20,background:"#1c1c1e",borderRadius:16,padding:"14px",border:"1px solid #2c2c2e"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,color:"#48484a",textTransform:"uppercase",marginBottom:10}}>Training Zones · Verified 8 June 2026</div>
          <div style={{display:"flex",gap:4,overflowX:"auto"}}>
            {[
              {n:"Recovery",p:"7:00+",h:"≤135",c:"#30d158"},
              {n:"Easy Z2",p:"6:20–7:00",h:"138–150",c:"#30d158"},
              {n:"Train MP",p:"5:04–5:15",h:"160–167",c:"#0a84ff"},
              {n:"Threshold",p:"4:42–4:52",h:"168–174",c:"#ff9f0a"},
              {n:"Race MP",p:"4:55",h:"160–167",c:"#fa5400"},
            ].map(z=>(
              <div key={z.n} style={{flex:"1 0 72px",minWidth:72,background:"#111",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid #2c2c2e"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:z.c,margin:"0 auto 5px"}}/>
                <div style={{fontSize:7.5,fontWeight:700,letterSpacing:.5,color:"#48484a",textTransform:"uppercase",marginBottom:3}}>{z.n}</div>
                <div style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>{z.p}</div>
                <div style={{fontSize:8.5,color:"#3a3a3c",marginTop:2}}>{z.h}bpm</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:10,fontSize:9,color:"#3a3a3c",textAlign:"center",letterSpacing:1,lineHeight:2,textTransform:"uppercase",paddingBottom:8}}>
          Tap circle to log · Tap km to edit · Tap note to add · Save changes above
        </div>
      </div>
    </div>
  );
}
