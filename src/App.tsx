import { useState } from 'react';
import Block1Plan from './Block1Plan';
import MarathonSkeleton from './MarathonSkeleton';

export default function App() {
  const [view, setView] = useState<'block1'|'skeleton'>('block1');
  return (
    <div>
      <div style={{display:'flex',background:'#000',padding:'10px 20px',gap:10,position:'sticky',top:0,zIndex:100}}>
        <button onClick={()=>setView('block1')}
          style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:view==='block1'?'#fa5400':'#1c1c1e',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Weeks 1–4
        </button>
        <button onClick={()=>setView('skeleton')}
          style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:view==='skeleton'?'#fa5400':'#1c1c1e',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Full 16 Weeks
        </button>
      </div>
      {view==='block1' ? <Block1Plan /> : <MarathonSkeleton />}
    </div>
  );
}
