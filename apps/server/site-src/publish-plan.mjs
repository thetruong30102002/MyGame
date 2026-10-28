// Một lệnh: build web, rồi xác nhận đầu việc trên admin Tailscale thật. Không thay DB hoặc tự đăng tin.
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..'),require=createRequire(import.meta.url);
execFileSync(process.execPath,[resolve(here,'build.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[require.resolve('tsx/cli'),resolve(root,'scripts/check-world-site.mts'),...process.argv.slice(2)],{cwd:root,stdio:'inherit'});
