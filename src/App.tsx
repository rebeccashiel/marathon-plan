import { useState, useEffect } from 'react';
import Block1Plan from './Block1Plan';
import Block2Plan from './Block2Plan';
import Block3Plan from './Block3Plan';
import MarathonSkeleton from './MarathonSkeleton';

type View = 'block1'|'block2'|'block3'|'skeleton';

function getCurrentBlock(): View {
  const now = new Date();
  if (now >= new Date('2026-09-21')) return 'skeleton';
  if (now >= new Date('2026-08-24')) return 'block3';
  if (now >= new Date('2026-07-27')) return 'block2';
  return 'block1';
}

export default function App() {
  const [view, setView] = useState<View>(getCurrentBlock());
  useEffect(() => { setView(getCurrentBlock()); }, []);
  return (
    <div>
      <div style={{display:'flex',background:'#000',padding:'8px 12px',gap:6,position:'sticky',top:0,zIndex:100}}>
        <button onClick={()=>setView('block1')} style={{flex:1,padding:'9px 4px',borderRadius:8,border:'none',background:view==='block1'?'#fa5400':'#1c1c1e',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Wks 1–4</button>
        <button onClick={()=>setView('block2')} style={{flex:1,padding:'9px 4px',borderRadius:8,border:'none',background:view==='block2'?'#0a84ff':'#1c1c1e',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Wks 5–8</button>
        <button onClick={()=>setView('block3')} style={{flex:1,padding:'9px 4px',borderRadius:8,border:'none',background:view==='block3'?'#ff9f0a':'#1c1c1e',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Wks 9–12</button>
        <button onClick={()=>setView('skeleton')} style={{flex:1,padding:'9px 4px',borderRadius:8,border:'none',background:view==='skeleton'?'#bf5af2':'#1c1c1e',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Full Plan</button>
      </div>
      {view==='block1'?<Block1Plan/>:view==='block2'?<Block2Plan/>:view==='block3'?<Block3Plan/>:<MarathonSkeleton/>}
    </div>
  );
}
