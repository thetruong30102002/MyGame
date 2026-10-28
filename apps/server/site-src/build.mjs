// Build trang web: CSS (Tailwind + daisyUI + SweetAlert2) → site/app.css, chép thư viện JS → site/vendor/.
// Chạy: npm run build:site -w @aether/server   (tuỳ chọn: node site-src/build.mjs <thư mục site khác> — dùng khi xem thử)
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(process.argv[2] ?? join(here, '../site'));
const require = createRequire(import.meta.url);
const tw = require.resolve('tailwindcss/lib/cli.js');
const env = { ...process.env, AETHER_SITE_DIR: site };
const bundle=await build({entryPoints:{portal:join(here,'public/portal.tsx')},outdir:join(site,'react'),entryNames:'[name]-[hash]',assetNames:'[name]-[hash]',chunkNames:'shared-[hash]',loader:{'.html':'text'},bundle:true,splitting:true,minify:true,format:'esm',target:['es2022'],jsx:'automatic',metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
const outputs=Object.entries(bundle.metafile.outputs);
const entry=(name)=>outputs.find(([,meta])=>meta.entryPoint?.replaceAll('\\','/').endsWith(name));
const url=(path)=>'site/'+path.replaceAll('\\','/').slice(site.replaceAll('\\','/').length+1);
// esbuild trả đường dẫn tương đối khi cwd chứa thư mục đích.
const outputUrl=(path)=>url(resolve(path));
writeFileSync(join(site,'react-manifest.json'),JSON.stringify({files:outputs.map(([path,meta])=>({url:outputUrl(path),bytes:meta.bytes}))},null,2));
const portalEntry=entry('public/portal.tsx');
const shared=outputs.filter(([p,m])=>p.endsWith('.js')&&!m.entryPoint).sort((a,b)=>b[1].bytes-a[1].bytes)[0];
const template=readFileSync(join(here,'public/template.html'),'utf8');
execFileSync(process.execPath, [tw, '-c', join(here, 'tailwind.config.cjs'), '-i', join(here, 'app.css'), '-o', join(site, 'app.css'), '--minify'], { stdio: 'inherit', env });
mkdirSync(join(site, 'vendor'), { recursive: true });
copyFileSync(require.resolve('sweetalert2/dist/sweetalert2.min.js'), join(site, 'vendor/sweetalert2.min.js'));
const titles={'index':'Cổng game','the-gioi':'Nhân vật & thế giới mới','tin-tuc':'Bản tin','dien-dan':'Diễn đàn','bai-viet':'Bài viết','gop-y':'Góp ý','tai-game':'Tải game','admin':'Quản trị'};
for(const [page,title] of Object.entries(titles)){
 const html=template.replaceAll('{{TITLE}}',title).replaceAll('{{BASE}}','').replace('{{ROBOTS}}',page==='admin'?'<meta name="robots" content="noindex">':'').replace('{{JS}}',outputUrl(portalEntry[0])).replace('{{CSS}}',outputUrl(portalEntry[1].cssBundle)).replace('{{SHARED}}',outputUrl(shared?.[0]||portalEntry[0]));
 writeFileSync(join(site,page+'.html'),html);
}
console.log('✔ build React SPA:', site);
