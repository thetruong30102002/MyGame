// Quản trị (K1 — chưa có nạp tiền thật): cộng / trừ kim cương cho một nhân vật, có ghi nhật ký.
//   npx tsx src/grant.ts "<tên nhân vật>" <số> [lý do]
//   npx tsx src/grant.ts "<tên nhân vật>"          → xem số dư + 10 dòng nhật ký gần nhất
// Máy chủ đang chạy vẫn dùng chung CSDL (SQLite WAL); người chơi đang online thấy số mới ở lần đổi ví kế / lần vào game sau.
import { Store } from './db.ts';
import { dbPath } from './dbPath.ts';

const [name, amount, ...why] = process.argv.slice(2);
if (!name) {
	console.error('Cách dùng: npx tsx src/grant.ts "<tên nhân vật>" [số] [lý do]');
	process.exit(1);
}
const store = new Store(dbPath());
try {
	const ch = store.briefByName(name);
	if (!ch) {
		console.error(`Không có nhân vật "${name}"`);
		process.exitCode = 1;
	} else if (amount === undefined) {
		console.log(`${ch.name}: ${store.diamonds(ch.id)} kim cương`);
		for (const r of store.diamondLedger(ch.id, 10)) console.log(`  ${new Date(r.at).toISOString()}  ${r.delta > 0 ? '+' : ''}${r.delta}  → ${r.balance}  (${r.reason})`);
	} else {
		const n = Math.trunc(Number(amount));
		if (!Number.isFinite(n) || n === 0) throw new Error('Số kim cương phải là số nguyên khác 0');
		const balance = store.addDiamonds(ch.id, n, `admin:${why.join(' ') || 'thủ công'}`);
		if (balance === null) throw new Error(`Không trừ được: ${ch.name} chỉ có ${store.diamonds(ch.id)} kim cương`);
		console.log(`${ch.name}: ${n > 0 ? '+' : ''}${n} → ${balance} kim cương`);
	}
} catch (e) {
	console.error(e instanceof Error ? e.message : e);
	process.exitCode = 1;
} finally {
	store.close();
}
