import type {DatabaseSync} from 'node:sqlite';
import {newFarm,type FarmState} from '@havenlord/sim/farm';

/** Migration Gia viên v1: bảng riêng theo tài khoản, không thay / xoá dữ liệu nhân vật cũ. */
export class FarmStore {
 constructor(private db:DatabaseSync){db.exec(`CREATE TABLE IF NOT EXISTS farm_accounts(account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,state TEXT NOT NULL,updated_at INTEGER NOT NULL);`);}
 read(account:number):FarmState{const row=this.db.prepare('SELECT state FROM farm_accounts WHERE account_id=?').get(account) as {state:string}|undefined;return row?JSON.parse(row.state) as FarmState:newFarm();}
 run<T>(account:number,character:string,now:number,fn:(state:FarmState,coins:number,diamonds:number)=>{value:T;coins?:number;potions?:number;buff?:boolean;diamonds?:number}):T{
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const row=this.db.prepare('SELECT progress FROM characters WHERE id=? AND account_id=?').get(character,account) as {progress:string}|undefined;
   if(!row)throw new Error('Nhân vật không thuộc tài khoản');
   const p=JSON.parse(row.progress) as {coins:number;potions:number};const state=this.read(account);const gems=(this.db.prepare('SELECT diamonds FROM wallets WHERE character_id=?').get(character) as {diamonds:number}|undefined)?.diamonds??0;const result=fn(state,p.coins||0,gems);
   // Kim cương (quay thú cưng): trừ + ghi sổ trong CÙNG transaction với trạng thái Gia viên — không bao giờ mất kim cương mà không ra thú.
   if(result.diamonds!==undefined&&result.diamonds!==gems){if(result.diamonds<0)throw new Error('Không đủ kim cương');this.db.prepare('INSERT INTO wallets(character_id,diamonds) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET diamonds=excluded.diamonds').run(character,result.diamonds);this.db.prepare('INSERT INTO diamond_ledger(character_id,delta,balance,reason,ref,at) VALUES(?,?,?,?,NULL,?)').run(character,result.diamonds-gems,result.diamonds,'gia_vien_pet',now);}
   this.db.prepare('INSERT INTO farm_accounts(account_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(account_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at').run(account,JSON.stringify(state),now);
   if(result.potions&&(p.potions||0)+result.potions>999)throw new Error('Bạn đã mang đủ thuốc hồi phục');
   if(result.coins!==undefined||result.potions){const balance=result.coins??p.coins;this.db.prepare("UPDATE characters SET progress=json_set(progress,'$.coins',?,'$.potions',?),updated_at=? WHERE id=?").run(balance,(p.potions||0)+(result.potions||0),now,character);this.db.prepare('INSERT INTO eco_ledger(character_id,coins,potions,exp,reason,at) VALUES(?,?,?,0,?,?)').run(character,balance-p.coins,result.potions||0,'gia_vien',now);}
   if(result.buff){const active=this.db.prepare("SELECT mult FROM buffs WHERE character_id=? AND kind='dmg'").get(character) as {mult:number}|undefined;if(active&&active.mult>1.1)throw new Error('Bạn đang dùng hiệu ứng mạnh hơn món ăn này');}
   if(result.buff)this.db.prepare("INSERT INTO buffs(character_id,kind,mult,remaining_ms) VALUES(?,'dmg',1.1,600000) ON CONFLICT(character_id,kind) DO UPDATE SET mult=max(mult,1.1),remaining_ms=min(remaining_ms+600000,18000000)").run(character);
   this.db.exec('COMMIT');return result.value;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
}
