import { useState } from 'react';
import Block1Plan from './Block1Plan';
import Block2Plan from './Block2Plan';
import MarathonSkeleton from './MarathonSkeleton';

export default function App() {
  const [view, setView] = useState<'block1'|'block2'|'skeleton'>('block1');
  return (
    <div>
      <div style={{display:'flex',background:'#000',padding:'10px 20px',gap:8,position:'sticky',top:0,zIndex:100}}>
        <button onClick={()=>setView('block1')} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:view==='block1'?'#fa5400':'#1c1c1e',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Weeks 1–4</button>
        <button onClick={()=>setView('block2')} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:view==='block2'?'#0a84ff':'#1c1c1e',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Weeks 5–8</button>
        <button onClick={()=>setView('skeleton')} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:view==='skeleton'?'#bf5af2':'#1c1c1e',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Full Plan</button>
      </div>
      {view==='block1'?<Block1Plan/>:view==='block2'?<Block2Plan/>:<MarathonSkeleton/>}
    </div>
  );
}
