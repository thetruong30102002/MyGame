import {useEffect,useState} from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {UiIcon} from './ui';
import { useLoad } from './admin/api';
import './roster2.css';
export interface Roster {
    notice: string;
    directions: string[];
    roles: {
        id: string;
        name: string;
        weapon: string;
        description: string;
    }[];
    characters: {
        id: string;
        name: string;
        role: string;
        gender: string;
        images: Record<string, string>;
    }[];
}
export function RosterGallery(){
 const {data,error}=useLoad<Roster>('site/roster.json'),[role,setRole]=useState('sword'),[dir,setDir]=useState('S');

 useEffect(()=>{if(!data)return;const timer=setTimeout(()=>data.characters.forEach(c=>{const image=new Image();image.fetchPriority='low';image.src=c.images.S!;}),100);return()=>clearTimeout(timer);},[data]);
 if(error)return <p role="alert">{error}</p>;if(!data)return <p role="status">Đang mở hồ sơ nhân vật…</p>;
 const active=data.roles.find(r=>r.id===role)!;
 return <Tabs.Root value={role} onValueChange={setRole} orientation="horizontal" className="roster"><Tabs.List className="roster-tabs" aria-label="Class nhân vật"><span className="roster-nav-label">CHỌN CON ĐƯỜNG</span>{data.roles.map((r,i)=><Tabs.Trigger key={r.id} value={r.id}><span className="roster-role-number" aria-hidden="true">0{i+1}</span><UiIcon name={r.id}/><span>{r.name}<small>06 tạo hình</small></span><UiIcon name="arrow" className="roster-tab-arrow"/></Tabs.Trigger>)}<p className="roster-nav-note">Tạo hình và một vũ khí vẽ liền.<br/>Xem đủ tám hướng.</p></Tabs.List><Tabs.Content key={role} value={role} className="roster-display"><div className="roster-intro"><div><span className="ac-kicker">HỒ SƠ / {active.weapon.toUpperCase()}</span><h3>{active.name}</h3><p>{active.description}</p></div><label>Hướng xem<select aria-label="Hướng xem" value={dir} onChange={e=>setDir(e.target.value)}>{data.directions.map((d,i)=><option key={d} value={d}>{['Trước','Trước trái','Trái','Sau trái','Sau','Sau phải','Phải','Trước phải'][i]}</option>)}</select></label></div><div className="roster-grid">{data.characters.filter(c=>c.role===role).map((c,i)=><article className="roster-card" key={c.id}><div className="roster-stage"><span className="roster-card-index" aria-hidden="true">0{i+1} / 06</span><img src={c.images[dir]} width="224" height="224" alt={c.name+' — '+active.name} loading="lazy"/></div><div className="roster-card-copy"><div><small>{c.gender==='male'?'NAM':'NỮ'} / {active.weapon.toUpperCase()}</small><h4>{c.name}</h4></div><UiIcon name={role}/></div></article>)}</div><p className="roster-notice">{data.notice}</p></Tabs.Content></Tabs.Root>;
}
