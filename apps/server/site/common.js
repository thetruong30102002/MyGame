// Phần chung của mọi trang web (trang chủ, tin tức, diễn đàn, bài viết, góp ý, tải game, thế giới): thanh trên, thanh dưới (điện
// thoại), chân trang, hộp đăng nhập, toast, gọi API, trạng thái đăng nhập. Trang đặt <body data-page="…"> rồi nạp file này CUỐI body,
// trước mã riêng của trang — mã trang dùng `window.A`. Class Tailwind viết ở đây cũng được build (tailwind.config.cjs quét site/*.js).
(function () {
	const A = (window.A = {});
	const $ = (A.$ = (id) => document.getElementById(id));
	const page = document.body.dataset.page || 'home';
	A.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

	// —— Dữ liệu dùng chung (khớp @aether/protocol) ——
	A.CATS = { chung: 'Thảo luận chung', 'to-doi': 'Tìm tổ đội', 'hoi-dap': 'Hỏi đáp', 'huong-dan': 'Hướng dẫn', khoe: 'Khoe đồ' };
	A.CAT_ICON = { chung: '💬', 'to-doi': '⚔️', 'hoi-dap': '❓', 'huong-dan': '📘', khoe: '✨' };
	A.FB_KINDS = { loi: 'Báo lỗi', 'y-tuong': 'Ý tưởng', khac: 'Khác' };
	A.FB_STATUS = { moi: 'Mới', 'da-xem': 'Đã xem', 'da-xu-ly': 'Đã xử lý' };
	A.FB_STATUS_CLS = { moi: 'badge-ghost', 'da-xem': 'badge-info', 'da-xu-ly': 'badge-success' };
	A.NEWS_TAG_CLS = { 'Cập nhật': 'badge-success', 'Thông báo': 'badge-error', 'Sự kiện': 'badge-accent' };
	A.os = /android/i.test(navigator.userAgent) ? 'android' : /windows/i.test(navigator.userAgent) ? 'windows' : '';

	/** Tạo phần tử: h('div.card.p-4', { onclick }, con…) — chữ người chơi gõ luôn đi qua textContent. */
	const h = (A.h = function (sel, props, ...kids) {
		const [tag, ...cls] = sel.split('.');
		const el = document.createElement(tag || 'div');
		if (cls.length) el.className = cls.join(' ');
		Object.assign(el, props || {});
		kids.flat().forEach((k) => k != null && k !== false && el.append(k instanceof Node ? k : String(k)));
		return el;
	});
	A.mb = (n) => (n / 1048576).toFixed(0) + ' MB';
	A.ago = (t) => {
		const s = (Date.now() - t) / 1000;
		if (s < 60) return 'vừa xong';
		if (s < 3600) return Math.floor(s / 60) + ' phút trước';
		if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
		if (s < 7 * 86400) return Math.floor(s / 86400) + ' ngày trước';
		return new Date(t).toLocaleDateString('vi-VN');
	};
	const AV = ['#e8590c', '#2f9e44', '#1c7ed6', '#7048e8', '#c2255c', '#0c8599', '#e67700'];
	A.avColor = (name) => {
		let n = 0;
		for (const ch of name) n = (n * 31 + ch.codePointAt(0)) >>> 0;
		return AV[n % AV.length];
	};
	A.avatar = (name, size) =>
		h('div.avatar.placeholder.shrink-0', null, h('div.rounded-xl.text-white.font-black.' + (size || 'w-10'), { style: 'background:' + A.avColor(name) }, h('span', null, [...name][0].toUpperCase())));
	A.showErr = (id, msg) => {
		$(id).textContent = msg || '';
		$(id).hidden = !msg;
	};
	A.toast = (text, kind) => {
		const t = h('div.alert.shadow-xl.text-sm.font-semibold.whitespace-normal.max-w-[calc(100vw-2rem)].sm:max-w-sm.alert-' + (kind || 'success'), { role: 'status' }, h('span', null, text));
		$('toasts').append(t);
		setTimeout(() => t.remove(), 3500);
	};
	/** Ô nhập tự cao theo chữ (điện thoại gõ dài không phải cuộn trong ô nhỏ). */
	A.autosize = (ta, max) => {
		const fit = () => {
			ta.style.height = 'auto';
			ta.style.height = Math.min(ta.scrollHeight + 2, max || 320) + 'px';
		};
		ta.addEventListener('input', fit);
		fit();
	};

	// —— Phiên đăng nhập (dùng chung với game + trang quản trị) ——
	const KEY = 'aether.web.token';
	let token = '';
	try { token = localStorage.getItem(KEY) || ''; } catch (e) {}
	const setToken = (t) => {
		token = t;
		try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {}
	};
	A.me = null;
	const meFns = [];
	/** Gọi fn ngay với trạng thái hiện tại (sau lần tải đầu) và mỗi lần đăng nhập / đăng xuất. */
	A.onMe = (fn) => {
		meFns.push(fn);
		if (meLoaded) fn(A.me);
	};
	let meLoaded = false;
	const meChanged = () => {
		meLoaded = true;
		renderAcct();
		meFns.forEach((fn) => fn(A.me));
	};

	/** Gọi API cùng máy chủ — lỗi thì ném Error mang câu báo của máy chủ; hết phiên thì đăng xuất. */
	A.api = async function (method, path, body) {
		const r = await fetch('api/' + path, {
			method,
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		const data = await r.json().catch(() => ({}));
		if (r.status === 401 && token && path !== 'login' && path !== 'register') signOut(true);
		if (!r.ok) throw Object.assign(new Error(data.error || 'Lỗi máy chủ (' + r.status + ')'), { status: r.status });
		return data;
	};
	async function loadMe() {
		if (token) {
			try {
				A.me = await A.api('GET', 'me');
			} catch (e) {
				if (e.status === 401) A.me = null;
			}
		}
		meChanged();
	}
	function signOut(silent) {
		if (token && !silent) A.api('POST', 'logout').catch(() => {});
		setToken('');
		A.me = null;
		meChanged();
	}
	A.signOut = () => {
		signOut(false);
		A.toast('Đã đăng xuất', 'info');
	};
	// Sau khi đăng nhập thì làm tiếp việc người xem định làm (viết bài, bình luận, góp ý…).
	let after = null;
	A.need = (fn) => (A.me ? fn() : ((after = fn), A.openAuth('login')));

	// —— Khung trang: thanh trên, thanh dưới, chân trang, hộp thoại ——
	const NAV = [
		['home', './', 'Trang chủ', '🏠'],
		['tin-tuc', 'tin-tuc', 'Tin tức', '📜'],
		['dien-dan', 'dien-dan', 'Diễn đàn', '🗨️'],
		['the-gioi', 'the-gioi', 'Thế giới', '🗺️'],
		['gop-y', 'gop-y', 'Góp ý', '💬'],
	];
	const active = page === 'bai-viet' ? 'dien-dan' : page;
	const heroTop = document.body.hasAttribute('data-hero');
	document.body.insertAdjacentHTML(
		'afterbegin',
		`<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn btn-primary btn-sm">Bỏ qua tới nội dung</a>
<header id="top" class="fixed inset-x-0 top-0 z-40 transition-colors duration-300 pt-[env(safe-area-inset-top)] ${heroTop ? '' : 'glass border-b border-white/10'}">
	<div class="navbar max-w-6xl mx-auto px-3 sm:px-4 gap-1.5 min-h-14 sm:min-h-16">
		<div class="flex-1 min-w-0">
			<a href="./" class="flex items-center h-10 gap-2 font-black tracking-wide whitespace-nowrap">
				<img class="px w-7 sm:w-8" src="site/img/favicon.png" alt="" width="44" height="36"><span class="flex flex-col sm:flex-row sm:gap-1.5 leading-[1.05] sm:leading-normal text-[13px] sm:text-lg"><span>AETHER</span><span class="text-primary">CHRONICLE</span></span>
			</a>
		</div>
		<nav class="hidden lg:flex" aria-label="Chính">
			<ul class="menu menu-horizontal px-1 font-semibold gap-0.5">
				${NAV.map(([id, href, label]) => `<li><a href="${href}" class="${id === active ? 'active' : ''}">${label}</a></li>`).join('')}
			</ul>
		</nav>
		<a href="tai-game" class="btn btn-primary btn-sm h-10 min-h-10 ${page === 'tai-game' ? 'btn-active' : ''}"><span aria-hidden="true">⬇</span><span class="hidden sm:inline">Tải game</span><span class="sm:hidden">Tải</span></a>
		<button id="login-btn" class="btn btn-ghost btn-sm h-10 min-h-10 border border-white/20" type="button" data-act="login">Đăng nhập</button>
		<div id="acct" class="dropdown dropdown-end hidden">
			<div tabindex="0" role="button" class="btn btn-ghost btn-sm h-10 min-h-10 gap-2 border border-white/20 px-2.5 sm:px-3" aria-label="Tài khoản">
				<span id="acct-av" class="w-6 h-6 rounded-md grid place-items-center text-xs font-black text-white"></span>
				<span id="acct-name" class="hidden sm:inline max-w-[8rem] truncate"></span>
			</div>
			<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-3 w-60 p-2 shadow-2xl border border-white/10 text-base">
				<li class="menu-title" id="acct-title"></li>
				<li><a href="gop-y">💬 Góp ý của tôi</a></li>
				<li><a href="dien-dan#viet">✏️ Viết bài</a></li>
				<li class="acct-admin hidden"><a href="admin">🛡️ Trang quản trị</a></li>
				<li><button type="button" data-act="logout" class="text-error">↩ Đăng xuất</button></li>
			</ul>
		</div>
	</div>
</header>`,
	);
	const main = $('main');
	if (main && !heroTop) main.classList.add('pt-[calc(3.5rem+env(safe-area-inset-top))]', 'sm:pt-[calc(4rem+env(safe-area-inset-top))]');
	// Chừa chỗ cho thanh dưới trên điện thoại.
	document.body.classList.add('pb-[calc(4rem+env(safe-area-inset-bottom))]', 'lg:pb-0');
	document.body.insertAdjacentHTML(
		'beforeend',
		`<footer class="bg-base-300 border-t border-white/5 text-sm text-base-content/60">
	<div class="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
		<div>
			<p class="font-black text-base text-base-content">AETHER <span class="text-primary">CHRONICLE</span></p>
			<p class="mt-2 leading-relaxed">Nhập vai pixel online · bản beta, đồ hoạ đang hoàn thiện. Tài khoản và nhân vật lưu trên máy chủ.</p>
		</div>
		<nav aria-label="Trang" class="grid grid-cols-2 gap-2">
			${NAV.map(([, href, label]) => `<a class="link link-hover py-1" href="${href}">${label}</a>`).join('')}
			<a class="link link-hover py-1" href="tai-game">Tải game</a>
		</nav>
		<div>
			<p class="font-bold text-base-content">Cần giúp?</p>
			<p class="mt-2 leading-relaxed">Gửi ở trang <a class="link link-primary" href="gop-y">Góp ý</a> hoặc trong game: Cài đặt (O) → Góp ý.</p>
		</div>
	</div>
</footer>
<nav id="btm" class="btm-nav btm-nav-sm lg:hidden z-40 bg-base-100/95 backdrop-blur border-t border-white/10 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]" aria-label="Điều hướng">
	${NAV.slice(0, 4).map(([id, href, label, icon]) => `<a href="${href}" class="${id === active ? 'active text-primary bg-base-200' : 'text-base-content/70'}" ${id === active ? 'aria-current="page"' : ''}><span class="text-xl leading-none" aria-hidden="true">${icon}</span><span class="btm-nav-label text-[11px] font-semibold">${label}</span></a>`).join('')}
	<button type="button" id="more-btn" class="${['gop-y', 'tai-game'].includes(active) ? 'active text-primary bg-base-200' : 'text-base-content/70'}"><span class="text-xl leading-none" aria-hidden="true">☰</span><span class="btm-nav-label text-[11px] font-semibold">Thêm</span></button>
</nav>
<button id="totop" class="btn btn-primary btn-circle w-11 h-11 min-h-11 fixed right-4 z-30 opacity-0 pointer-events-none transition-opacity shadow-lg bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6" aria-label="Lên đầu trang">▲</button>
<div id="toasts" class="toast toast-center sm:toast-end z-[80] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4"></div>

<dialog id="dlg-more" class="modal modal-bottom">
	<div class="modal-box border border-white/10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
		<div class="w-10 h-1.5 rounded-full bg-base-content/20 mx-auto -mt-2 mb-4"></div>
		<div id="more-acct" class="mb-3"></div>
		<ul class="menu p-0 text-base gap-1">
			<li><a href="gop-y" class="py-3">💬 Góp ý · báo lỗi</a></li>
			<li><a href="tai-game" class="py-3">⬇ Tải game · hướng dẫn cài</a></li>
			<li><a href="the-gioi" class="py-3">🗺️ Thế giới · lớp nhân vật</a></li>
			<li class="acct-admin hidden"><a href="admin" class="py-3">🛡️ Trang quản trị</a></li>
			<li id="more-logout" class="hidden"><button type="button" data-act="logout" class="py-3 text-error">↩ Đăng xuất</button></li>
		</ul>
	</div>
	<form method="dialog" class="modal-backdrop"><button>đóng</button></form>
</dialog>

<dialog id="dlg-auth" class="modal modal-bottom sm:modal-middle">
	<div class="modal-box border border-white/10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
		<form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Đóng">✕</button></form>
		<h3 class="font-black text-2xl" id="auth-title">Đăng nhập</h3>
		<p class="text-sm text-base-content/60 mt-1">Dùng chung tài khoản với game.</p>
		<div role="tablist" id="auth-seg" class="tabs tabs-boxed mt-4 bg-base-200">
			<button type="button" role="tab" class="tab h-10 tab-active" data-mode="login">Đăng nhập</button>
			<button type="button" role="tab" class="tab h-10" data-mode="register">Tạo tài khoản</button>
		</div>
		<form id="auth-form" class="mt-3 space-y-2">
			<label class="form-control"><div class="label"><span class="label-text font-semibold">Tên đăng nhập</span></div>
				<input id="au" class="input input-bordered w-full text-base" autocomplete="username" required maxlength="20" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next"></label>
			<label class="form-control"><div class="label"><span class="label-text font-semibold">Mật khẩu</span></div>
				<input id="ap" type="password" class="input input-bordered w-full text-base" autocomplete="current-password" required maxlength="72" enterkeyhint="go"></label>
			<label class="form-control" id="ap2-wrap" hidden><div class="label"><span class="label-text font-semibold">Nhập lại mật khẩu</span></div>
				<input id="ap2" type="password" class="input input-bordered w-full text-base" autocomplete="new-password" maxlength="72" enterkeyhint="go"></label>
			<div id="auth-err" role="alert" class="alert alert-error py-2 text-sm" hidden></div>
			<button class="btn btn-primary w-full mt-2" id="auth-go">Đăng nhập</button>
			<p class="text-xs text-base-content/50 pt-1">Tên đăng nhập 3–20 ký tự: chữ thường không dấu, số, gạch dưới. Mật khẩu 6–72 ký tự.</p>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>đóng</button></form>
</dialog>`,
	);

	// Thanh trên: trên banner thì trong suốt, cuộn xuống thì đặc lại; nút lên đầu trang.
	const onScroll = () => {
		if (heroTop) ['glass', 'shadow-lg', 'border-b', 'border-white/10'].forEach((c) => $('top').classList.toggle(c, scrollY > 30));
		const far = scrollY < 900;
		$('totop').classList.toggle('opacity-0', far);
		$('totop').classList.toggle('pointer-events-none', far);
	};
	addEventListener('scroll', onScroll, { passive: true });
	onScroll();
	$('totop').onclick = () => scrollTo({ top: 0, behavior: A.reduce ? 'auto' : 'smooth' });
	// Bấm mục trong menu thả xuống thì đóng menu (daisyUI giữ mở theo focus).
	document.addEventListener('click', (e) => {
		if (e.target.closest('.dropdown-content a, .dropdown-content button')) document.activeElement.blur();
	});
	$('more-btn').onclick = () => $('dlg-more').showModal();

	function renderAcct() {
		const me = A.me;
		$('login-btn').classList.toggle('hidden', !!me);
		$('acct').classList.toggle('hidden', !me);
		document.querySelectorAll('.acct-admin').forEach((e) => e.classList.toggle('hidden', !(me && me.admin)));
		$('more-logout').classList.toggle('hidden', !me);
		if (me) {
			$('acct-name').textContent = me.username;
			$('acct-title').textContent = 'Xin chào, ' + me.username;
			$('acct-av').textContent = me.username[0].toUpperCase();
			$('acct-av').style.background = A.avColor(me.username);
			$('more-acct').replaceChildren(h('div.flex.items-center.gap-3.p-3.rounded-box.bg-base-200', null, A.avatar(me.username), h('div.min-w-0', null, h('p.font-bold.truncate', null, me.username), h('p.text-xs.text-base-content/60', null, me.characters.length ? me.characters.map((c) => c.name).join(' · ') : 'Chưa có nhân vật'))));
		} else {
			$('more-acct').replaceChildren(h('button.btn.btn-primary.w-full', { type: 'button', onclick: () => ($('dlg-more').close(), A.openAuth('login')) }, '🔑 Đăng nhập / Tạo tài khoản'));
		}
	}

	document.addEventListener('click', (e) => {
		const b = e.target.closest('[data-act]');
		if (!b) return;
		if (b.dataset.act === 'login') A.openAuth('login');
		if (b.dataset.act === 'logout') {
			if ($('dlg-more').open) $('dlg-more').close();
			A.signOut();
		}
	});

	// Đăng nhập / tạo tài khoản
	let mode = 'login';
	A.openAuth = (m) => {
		setMode(m || 'login');
		A.showErr('auth-err');
		$('dlg-auth').showModal();
	};
	function setMode(m) {
		mode = m;
		document.querySelectorAll('#auth-seg .tab').forEach((b) => b.classList.toggle('tab-active', b.dataset.mode === m));
		$('auth-title').textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
		$('auth-go').textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
		$('ap2-wrap').hidden = m === 'login';
		$('ap2').required = m !== 'login';
		$('ap').autocomplete = m === 'login' ? 'current-password' : 'new-password';
	}
	$('auth-seg').onclick = (e) => e.target.dataset.mode && setMode(e.target.dataset.mode);
	$('auth-form').onsubmit = async (e) => {
		e.preventDefault();
		const u = $('au').value.trim().toLowerCase(), p = $('ap').value;
		A.showErr('auth-err');
		if (mode === 'register' && p !== $('ap2').value) return A.showErr('auth-err', 'Hai mật khẩu chưa khớp');
		$('auth-go').classList.add('btn-disabled');
		try {
			const r = await A.api('POST', mode, { username: u, password: p });
			setToken(r.token);
			$('ap').value = $('ap2').value = '';
			await loadMe();
			const fn = after;
			after = null;
			$('dlg-auth').close();
			A.toast(mode === 'login' ? 'Chào mừng trở lại, ' + A.me.username + '!' : 'Đã tạo tài khoản ' + A.me.username + ' — vào game đăng nhập bằng tài khoản này.');
			if (fn) fn();
		} catch (err) {
			A.showErr('auth-err', err.message);
		} finally {
			$('auth-go').classList.remove('btn-disabled');
		}
	};
	$('dlg-auth').addEventListener('close', () => (after = null));

	// —— Hiện dần khi cuộn tới ——
	A.reveal = (root) => {
		const els = (root || document).querySelectorAll('.reveal:not(.seen)');
		if (!('IntersectionObserver' in window) || A.reduce) return els.forEach((el) => el.classList.add('seen'));
		const io = new IntersectionObserver((es) => es.forEach((e) => {
			if (!e.isIntersecting) return;
			e.target.classList.add('seen');
			io.unobserve(e.target);
		}), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
		els.forEach((el, i) => {
			el.style.transitionDelay = (i % 3) * 70 + 'ms';
			io.observe(el);
		});
	};

	// —— Xem ảnh lớn: bấm ảnh, ← → hoặc vuốt ngang để chuyển ——
	A.lightbox = (figs) => {
		if (!figs.length) return;
		document.body.insertAdjacentHTML(
			'beforeend',
			`<dialog id="lb" class="modal">
	<div class="modal-box max-w-5xl w-[calc(100vw-1rem)] p-0 bg-black overflow-hidden">
		<img id="lb-img" class="px w-full select-none" alt="" draggable="false">
		<div class="flex items-center gap-2 p-2 bg-base-100">
			<button id="lb-pv" class="btn btn-circle btn-ghost" aria-label="Ảnh trước">‹</button>
			<p id="lb-cap" class="flex-1 text-center font-bold text-sm sm:text-base"></p>
			<button id="lb-nx" class="btn btn-circle btn-ghost" aria-label="Ảnh sau">›</button>
			<form method="dialog"><button class="btn btn-circle btn-ghost" aria-label="Đóng">✕</button></form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop"><button>đóng</button></form>
</dialog>`,
		);
		let cur = 0;
		const open = (i) => {
			cur = (i + figs.length) % figs.length;
			$('lb-img').src = figs[cur].querySelector('img').src;
			$('lb-cap').textContent = figs[cur].querySelector('figcaption').textContent;
			if (!$('lb').open) $('lb').showModal();
		};
		figs.forEach((f, i) => {
			f.tabIndex = 0;
			f.setAttribute('role', 'button');
			f.onclick = () => open(i);
			f.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(i));
		});
		$('lb-pv').onclick = () => open(cur - 1);
		$('lb-nx').onclick = () => open(cur + 1);
		addEventListener('keydown', (e) => {
			if (!$('lb').open) return;
			if (e.key === 'ArrowLeft') open(cur - 1);
			if (e.key === 'ArrowRight') open(cur + 1);
		});
		let x0 = null;
		$('lb-img').addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
		$('lb-img').addEventListener('touchend', (e) => {
			if (x0 === null) return;
			const dx = e.changedTouches[0].clientX - x0;
			if (Math.abs(dx) > 40) open(cur + (dx < 0 ? 1 : -1));
			x0 = null;
		});
	};

	// —— Bản client đang phát (dùng ở trang chủ + tải game) ——
	A.version = fetch('api/client/version', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
	/** Nút tải hợp máy người xem (Android → APK, Windows → exe): đưa lên đầu nhóm `.dl` + gắn nhãn. */
	A.markMyOs = (root) => {
		if (!A.os) return;
		(root || document).querySelectorAll('.dl').forEach((d) => {
			const mine = d.querySelector('[data-os="' + A.os + '"]');
			if (!mine || mine.querySelector('.my-os')) return;
			d.prepend(mine);
			mine.classList.add('relative');
			mine.append(h('span.my-os.absolute.-top-2.-right-2.badge.badge-error.badge-sm.font-bold.normal-case', null, 'hợp máy bạn'));
		});
	};
	A.fillSizes = (v) => {
		const w = v.windows, a = v.android, z = w && w.zip;
		if (w) document.querySelectorAll('[data-size="windows"]').forEach((e) => (e.textContent = 'Windows · bộ cài · ' + A.mb(w.size)));
		if (z) document.querySelectorAll('[data-size="zip"]').forEach((e) => (e.textContent = 'giải nén rồi chạy · ' + A.mb(z.size)));
		if (a) document.querySelectorAll('[data-size="android"]').forEach((e) => (e.textContent = 'file APK · ' + A.mb(a.size)));
	};

	loadMe();
	A.reveal();
})();
