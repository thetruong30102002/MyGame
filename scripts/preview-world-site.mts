// Máy chủ thử giao diện: CSDL riêng trên D, không seed tài khoản vào bản thật.
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { Store } from '../apps/server/src/db.ts';
import { createApi } from '../apps/server/src/http.ts';
import { Board } from '../apps/server/src/board.ts';
import { hashPassword } from '../apps/server/src/auth.ts';
import { SITE_DIR } from '../apps/server/src/site.ts';
import { join } from 'node:path';
mkdirSync('.havenlord-stage/world-renewal',{recursive:true});
const s=new Store('.havenlord-stage/world-renewal/site-preview.db');
if(!s.account('preview_admin'))s.createAccount('preview_admin',await hashPassword('Preview-Only-2026!'));
s.setAdmin('preview_admin',true);
new Board(s).seedNews(join(SITE_DIR,'news.json'));
const api=createApi(s);
createServer((req,res)=>void api(req,res)).listen(3201,'127.0.0.1',()=>console.log('Site preview http://127.0.0.1:3201/game/ (DB riêng)'));
