import {useEffect,useState} from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {UiIcon} from './ui';
import { useLoad } from './admin/api';
import './roster2.css';
/** Bộ nhân vật cỡ NPC 8 hướng (05/11) — `site/roster-npc.json`, ảnh cắt từ atlas game bởi `scripts/export-site-npc-roster.mts`. */
export interface NpcRoster {
    notice: string;
    cell: [number, number];
    directions: string[];
    states: { id: string; label: string; frames: number; ms: number }[];
    roles: { id: string; name: string; weapon: string; description: string }[];
    races: { id: string; name: string; description: string }[];
    characters: { id: string; name: string; role: string; gender: string; race: string; raceLabel: string; variant: number; sheets: Record<string, string> }[];
}
const DIR_LABELS = ['Trước', 'Trước phải', 'Phải', 'Sau phải', 'Sau', 'Sau trái', 'Trái', 'Trước trái'];
const ROLE_LABELS: Record<string,string> = {sword:'Kiếm',shield:'Khiên',spear:'Thương',bow:'Cung',staff:'Pháp sư'};
const roleLabel=(id:string,name:string)=>ROLE_LABELS[id]??name;
const SCALE = 2;
function Sprite({sheet,cell,frames,frame,row,alt}:{sheet:string;cell:[number,number];frames:number;frame:number;row:number;alt:string}){
 const [w,h]=[cell[0]*SCALE,cell[1]*SCALE];
 return <div className="roster-sprite" role="img" aria-label={alt} style={{width:w,height:h,backgroundImage:`url(${sheet})`,backgroundSize:`${frames*w}px ${8*h}px`,backgroundPosition:`${-(frame%frames)*w}px ${-row*h}px`}}/>;
}
/** `byRace`: trang công khai — mỗi tộc một đại diện (đầu số 1) theo class / giới đang chọn; admin xem đủ 15 đầu. */
export function NpcRosterGallery({byRace=false}:{byRace?:boolean}){
 const {data,error}=useLoad<NpcRoster>('site/roster-npc.json'),[role,setRole]=useState('sword'),[gender,setGender]=useState('male'),[dir,setDir]=useState(0),[state,setState]=useState('idle'),[spin,setSpin]=useState(false),[tick,setTick]=useState(0);
 const st=data?.states.find(s=>s.id===state);
 // Một nhịp chung cho cả lưới: khung chạy theo ms gốc của động tác; "xoay" đổi hướng mỗi 0,8 giây.
 useEffect(()=>{if(!st||st.frames<2)return;const t=setInterval(()=>setTick(n=>n+1),st.ms);return()=>clearInterval(t);},[st]);
 useEffect(()=>{if(!spin)return;const t=setInterval(()=>setDir(d=>(d+1)%8),800);return()=>clearInterval(t);},[spin]);
 if(error)return <p role="alert">{error}</p>;if(!data||!st)return <p role="status">Đang mở hồ sơ nhân vật…</p>;
 const active=data.roles.find(r=>r.id===role)!;
 const pool=data.characters.filter(c=>c.role===role&&c.gender===gender);
 const list=byRace?data.races.map(r=>pool.find(c=>c.race===r.id)).filter(c=>c!==undefined):pool;
 const raceOf=(id:string)=>data.races.find(r=>r.id===id);
 return <Tabs.Root value={role} onValueChange={setRole} orientation="horizontal" className="roster roster-npc"><Tabs.List className="roster-tabs" aria-label="Class nhân vật"><span className="roster-nav-label">CHỌN CON ĐƯỜNG</span>{data.roles.map((r,i)=><Tabs.Trigger key={r.id} value={r.id}><span className="roster-role-number" aria-hidden="true">0{i+1}</span><UiIcon name={r.id}/><span>{roleLabel(r.id,r.name)}<small>{byRace?'5 tộc · nam / nữ':'30 tạo hình'}</small></span><UiIcon name="arrow" className="roster-tab-arrow"/></Tabs.Trigger>)}<p className="roster-nav-note">{byRace?<>5 tộc, mỗi tộc 3 kiểu đầu nam và 3 nữ.<br/>Đứng / đi / chạy đủ tám hướng.</>:<>15 đầu × nam / nữ mỗi class.<br/>Đứng / đi / chạy đủ tám hướng.</>}</p></Tabs.List><Tabs.Content key={role} value={role} className="roster-display"><div className="roster-intro"><div><span className="ac-kicker">HỒ SƠ / {active.weapon.toUpperCase()}</span><h3>{roleLabel(active.id,active.name)}</h3><p>{active.description}</p></div><div className="roster-controls"><label>Giới<select aria-label="Giới" value={gender} onChange={e=>setGender(e.target.value)}><option value="male">Nam</option><option value="female">Nữ</option></select></label><label>Động tác<select aria-label="Động tác" value={state} onChange={e=>{setState(e.target.value);setTick(0);}}>{data.states.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Hướng xem<select aria-label="Hướng xem" value={dir} onChange={e=>{setSpin(false);setDir(Number(e.target.value));}}>{data.directions.map((d,i)=><option key={d} value={i}>{DIR_LABELS[i]} ({d})</option>)}</select></label><label className="roster-spin"><input type="checkbox" checked={spin} onChange={e=>setSpin(e.target.checked)}/>Xoay 8 hướng</label></div></div><div className="roster-grid">{list.map((c,i)=><article className="roster-card" key={c.id}><div className="roster-stage"><span className="roster-card-index" aria-hidden="true">{String(i+1).padStart(2,'0')} / {String(list.length).padStart(2,'0')}</span><Sprite sheet={c.sheets[state]!} cell={data.cell} frames={st.frames} frame={tick} row={dir} alt={`${c.name} — ${roleLabel(active.id,active.name)} ${gender}==='male'?'nam':'nữ'}`}/></div><div className="roster-card-copy"><div><small>{gender==='male'?'NAM':'NỮ'} / {active.weapon.toUpperCase()} · {c.raceLabel.toUpperCase()}</small><h4>{byRace?c.raceLabel:c.raceLabel+' '+c.variant}</h4>{byRace&&<p className="roster-race-note">{raceOf(c.race)?.description}</p>}</div><UiIcon name={role}/></div></article>)}</div><p className="roster-notice">{data.notice}</p></Tabs.Content></Tabs.Root>;
}
