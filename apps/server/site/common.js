// Phần chung của mọi trang web (trang chủ, tin tức, diễn đàn, bài viết, góp ý, tải game, thế giới): biểu tượng SVG, thanh trên, thanh dưới
// (điện thoại), chân trang, hộp đăng nhập, toast, gọi API, trạng thái đăng nhập. Trang đặt <body data-page="…"> rồi nạp file này CUỐI
// body, trước mã riêng của trang — mã trang dùng `window.A`. Class Tailwind viết ở đây cũng được build (tailwind.config.cjs quét site/*.js).
// Biểu tượng: SVG nét đều (không dùng emoji — mỗi máy vẽ emoji một kiểu, to nhỏ / lệch dòng khác nhau). Trong HTML: <svg class="i"><use href="#i-tên"/></svg>.
// Thông báo + hộp xác nhận: SweetAlert2 (site/vendor/sweetalert2.min.js — trang nạp TRƯỚC file này), nút là class daisyUI: A.toast, A.confirm.
(function () {
	const A = (window.A = {});
	const $ = (A.$ = (id) => document.getElementById(id));
	const page = document.body.dataset.page || 'home';
	A.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

	// —— Biểu tượng (nét 2px, khung 24) ——
	const STROKE = {
		home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
		news: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6"/><path d="M7 8h6M7 12h6M7 16h4"/>',
		forum: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M7 8h10M7 12h6"/>',
		map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
		menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
		download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
		user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
		pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
		send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
		link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
		trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
		chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/>',
		bug: '<rect x="7" y="8" width="10" height="13" rx="5"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0M12 12v9M3 14h4M17 14h4M4.5 8.5 7 10M19.5 8.5 17 10M4.5 20 7 18.5M19.5 20 17 18.5"/>',
		bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
		arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
		chevron: '<path d="m9 6 6 6-6 6"/>',
		x: '<path d="M18 6 6 18M6 6l12 12"/>',
		shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
		logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
		help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>',
		flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z"/>',
		drop: '<path d="M12 2.7S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.3-7-12.3z"/>',
		wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
		snow: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
		mountain: '<path d="m3 20 7-12 4 6 2-3 5 9z"/>',
		sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>',
		sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
		book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
		users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
		skull: '<path d="M12 3a8 8 0 0 0-5 14.2V21h10v-3.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 21v-3M14 21v-3"/>',
		refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
		megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
		wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
		list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
		monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
		phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
		lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
		inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
		up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
	};
	const FILL = {
		win: '<path d="M3 5.5 10.5 4.4v7.1H3zm0 13L10.5 19.6v-7H3zm8.5 1.2L21 21v-8.4h-9.5zm0-15.4v7.2H21V3z"/>',
		android: '<path d="M7.2 8.5h9.6v8.2c0 .7-.5 1.2-1.2 1.2h-.9v2.6a1.2 1.2 0 0 1-2.4 0v-2.6h-.6v2.6a1.2 1.2 0 0 1-2.4 0v-2.6h-.9c-.7 0-1.2-.5-1.2-1.2zM5 8.6a1.2 1.2 0 0 1 2.4 0v5.1a1.2 1.2 0 0 1-2.4 0zm11.6 0a1.2 1.2 0 0 1 2.4 0v5.1a1.2 1.2 0 0 1-2.4 0zM8.3 3.3l.5-.3 1.1 1.8a5.4 5.4 0 0 1 4.2 0L15.2 3l.5.3-1.1 1.8A4.7 4.7 0 0 1 16.8 7.6H7.2a4.7 4.7 0 0 1 2.2-2.5zM10 5.6a.6.6 0 1 0 0 1.2.6.6 0 0 0 0-1.2zm4 0a.6.6 0 1 0 0 1.2.6.6 0 0 0 0-1.2z"/>',
		zip: '<path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5zM9 4v2h2V4zm0 3v2h2V7zm0 3v2h2v-2zm-1 4v4h4v-4zm1.5 1.5h1v1h-1z"/>',
	};
	document.body.insertAdjacentHTML(
		'afterbegin',
		'<svg width="0" height="0" class="absolute" aria-hidden="true">' +
			Object.entries(STROKE).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`).join('') +
			Object.entries(FILL).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="currentColor">${d}</symbol>`).join('') +
			'</svg>',
	);
	const SVGNS = 'http://www.w3.org/2000/svg';
	/** Biểu tượng SVG: A.icon('chat', 'w-5 h-5 text-primary'). */
	A.icon = (name, cls) => {
		const s = document.createElementNS(SVGNS, 'svg');
		s.setAttribute('class', 'i ' + (cls || ''));
		s.setAttribute('aria-hidden', 'true');
		const u = document.createElementNS(SVGNS, 'use');
		u.setAttribute('href', '#i-' + name);
		s.append(u);
		return s;
	};
	const ic = (name, cls) => `<svg class="i ${cls || ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

	// —— Dữ liệu dùng chung (khớp @havenlord/protocol) ——
	A.CATS = { chung: 'Thảo luận chung', 'to-doi': 'Tìm tổ đội', 'hoi-dap': 'Hỏi đáp', 'huong-dan': 'Hướng dẫn', khoe: 'Khoe đồ' };
	A.CAT_ICON = { chung: 'chat', 'to-doi': 'sword', 'hoi-dap': 'help', 'huong-dan': 'book', khoe: 'sparkles' };
	A.FB_KINDS = { loi: 'Báo lỗi', 'y-tuong': 'Ý tưởng', khac: 'Khác' };
	A.FB_KIND_ICON = { loi: 'bug', 'y-tuong': 'bulb', khac: 'chat' };
	A.FB_STATUS = { moi: 'Mới', 'da-xem': 'Đã xem', 'da-xu-ly': 'Đã xử lý' };
	A.FB_STATUS_CLS = { moi: 'badge-ghost', 'da-xem': 'badge-info', 'da-xu-ly': 'badge-success' };
	A.NEWS_TAG_CLS = { 'Cập nhật': 'badge-success', 'Thông báo': 'badge-error', 'Sự kiện': 'badge-accent' };
	A.NEWS_TAG_ICON = { 'Cập nhật': 'wrench', 'Thông báo': 'megaphone', 'Sự kiện': 'sparkles' };
	A.os = /android/i.test(navigator.userAgent) ? 'android' : /windows/i.test(navigator.userAgent) ? 'windows' : '';

	/** Tạo phần tử: h('div.card.p-4', { onclick }, con…) — chữ người chơi gõ luôn đi qua textContent. */
	const h = (A.h = function (sel, props, ...kids) {
		// Tách theo dấu chấm KHÔNG đứng trước chữ số: 'gap-1.5', 'mt-0.5' giữ nguyên.
		const [tag, ...cls] = sel.split(/\.(?!\d)/);
		const el = document.createElement(tag || 'div');
		if (cls.length) el.className = cls.join(' ');
		Object.assign(el, props || {});
		kids.flat().forEach((k) => k != null && k !== false && el.append(k instanceof Node ? k : String(k)));
		return el;
	});
	/** Nhãn chuyên mục: biểu tượng + tên. */
	A.catLabel = (id) => h('span.inline-flex.items-center.gap-1.5.min-w-0', null, A.icon(A.CAT_ICON[id] || 'chat', 'w-4 h-4'), h('span.truncate', null, A.CATS[id] || id));
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
	/** Ảnh đại diện chữ cái đầu (vuông bo góc, chữ căn giữa tuyệt đối). */
	A.avatar = (name, size) =>
		h('span.inline-grid.place-items-center.shrink-0.rounded-xl.text-white.font-black.leading-none.select-none.' + (size || 'w-10.h-10.text-base'), { style: 'background:' + A.avColor(name), ariaHidden: 'true' }, [...name][0].toUpperCase());
	A.showErr = (id, msg) => {
		$(id).textContent = msg || '';
		$(id).hidden = !msg;
	};
	// —— Thông báo + hộp xác nhận (SweetAlert2; chữ luôn đi qua titleText / text — không chèn HTML) ——
	const SWAL = window.Swal;
	const toaster = SWAL
		? SWAL.mixin({
				toast: true,
				position: matchMedia('(min-width: 1024px)').matches ? 'bottom-end' : 'top',
				showConfirmButton: false,
				showCloseButton: false,
				timer: 3200,
				timerProgressBar: true,
				didOpen: (t) => {
					t.addEventListener('mouseenter', SWAL.stopTimer);
					t.addEventListener('mouseleave', SWAL.resumeTimer);
				},
			})
		: null;
	/** Thông báo nhỏ tự tắt: kind = success | error | info | warning. */
	A.toast = (text, kind) => {
		if (toaster) return toaster.fire({ icon: kind || 'success', titleText: text });
		alert(text);
	};
	/**
	 * Hộp xác nhận → Promise<boolean>. danger = hành động xoá / không hoàn tác (nút đỏ, mặc định chọn Huỷ).
	 * A.confirm({ title: 'Xoá bài?', text: '…', ok: 'Xoá', danger: true })
	 */
	A.confirm = async ({ title, text, ok, cancel, danger }) => {
		if (!SWAL) return confirm(title + (text ? '\n' + text : ''));
		const r = await SWAL.fire({
			titleText: title,
			text: text || '',
			icon: danger ? 'warning' : 'question',
			showCancelButton: true,
			confirmButtonText: ok || 'Đồng ý',
			cancelButtonText: cancel || 'Huỷ',
			reverseButtons: true,
			focusCancel: !!danger,
			buttonsStyling: false,
			returnFocus: false,
			customClass: { confirmButton: 'btn ' + (danger ? 'btn-error' : 'btn-primary'), cancelButton: 'btn btn-ghost border border-white/15' },
		});
		return r.isConfirmed;
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
	const KEY = 'havenlord.web.token';
	try { const old = localStorage.getItem('haven.web.token'); if (old && !localStorage.getItem(KEY)) localStorage.setItem(KEY, old); localStorage.removeItem('haven.web.token'); } catch { /* chế độ riêng tư */ }
	let token = '';
	try { token = localStorage.getItem(KEY) || ''; } catch (e) {}
	const setToken = (t) => {
		token = t;
		try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {}
	};
	A.me = null;
	const meFns = [];
	let meLoaded = false;
	/** Gọi fn ngay với trạng thái hiện tại (sau lần tải đầu) và mỗi lần đăng nhập / đăng xuất. */
	A.onMe = (fn) => {
		meFns.push(fn);
		if (meLoaded) fn(A.me);
	};
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

	// —— Khung trang ——
	const NAV = [
		['home', './', 'Trang chủ', 'home'],
		['tin-tuc', 'tin-tuc', 'Tin tức', 'news'],
		['dien-dan', 'dien-dan', 'Diễn đàn', 'forum'],
		['the-gioi', 'the-gioi', 'Thế giới', 'map'],
		['gop-y', 'gop-y', 'Góp ý', 'chat'],
	];
	const active = page === 'bai-viet' ? 'dien-dan' : page;
	const heroTop = document.body.hasAttribute('data-hero');
	const sheet = (id, inner) => `<dialog id="${id}" class="modal modal-bottom sm:modal-middle">
	<div class="modal-box border border-white/10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
		<form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Đóng">${ic('x', 'w-5 h-5')}</button></form>
		${inner}
	</div>
	<form method="dialog" class="modal-backdrop"><button>đóng</button></form>
</dialog>`;
	document.body.insertAdjacentHTML(
		'afterbegin',
		`<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn btn-primary btn-sm">Bỏ qua tới nội dung</a>
<header id="top" class="fixed inset-x-0 top-0 z-40 transition-colors duration-300 pt-[env(safe-area-inset-top)] ${heroTop ? '' : 'bar border-b border-white/10'}">
	<div class="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2">
		<a href="./" class="flex items-center h-10 gap-2 font-black tracking-wide whitespace-nowrap mr-auto min-w-0">
			<img class="px w-7 h-auto sm:w-8" src="site/img/favicon.png" alt="" width="44" height="36">
			<span class="flex flex-col sm:flex-row sm:gap-1.5 leading-[1.1] sm:leading-none text-[13px] sm:text-lg"><span>HAVEN</span><span class="text-primary">LORD</span></span>
		</a>
		<nav class="hidden lg:block" aria-label="Chính">
			<ul class="flex items-center gap-1 font-semibold text-[15px]">
				${NAV.map(([id, href, label]) => `<li><a href="${href}" class="inline-flex items-center h-10 px-3 rounded-lg transition-colors ${id === active ? 'bg-white/10 text-primary' : 'hover:bg-white/5'}" ${id === active ? 'aria-current="page"' : ''}>${label}</a></li>`).join('')}
			</ul>
		</nav>
		<a href="tai-game" class="btn btn-primary btn-sm h-10 min-h-10 px-3 gap-1.5">${ic('download', 'w-[18px] h-[18px]')}<span class="hidden sm:inline">Tải game</span><span class="sm:hidden">Tải</span></a>
		<button id="login-btn" class="btn btn-ghost btn-sm h-10 min-h-10 px-3 border border-white/20 gap-1.5" type="button" data-act="login" aria-label="Đăng nhập">${ic('user', 'w-[18px] h-[18px]')}<span>Đăng nhập</span></button>
		<div id="acct" class="dropdown dropdown-end hidden">
			<div tabindex="0" role="button" class="btn btn-ghost btn-sm h-10 min-h-10 gap-2 border border-white/20 px-1.5 sm:pl-1.5 sm:pr-3" aria-label="Tài khoản">
				<span id="acct-av" class="inline-grid place-items-center w-7 h-7 rounded-lg text-[13px] font-black text-white leading-none"></span>
				<span id="acct-name" class="hidden sm:inline max-w-[8rem] truncate"></span>
			</div>
			<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-3 w-60 p-2 shadow-2xl border border-white/10 text-[15px]">
				<li class="menu-title" id="acct-title"></li>
				<li><a href="gop-y">${ic('inbox', 'w-5 h-5')}Góp ý của tôi</a></li>
				<li><a href="dien-dan#viet">${ic('pencil', 'w-5 h-5')}Viết bài</a></li>
				<li class="acct-admin hidden"><a href="admin">${ic('shield', 'w-5 h-5')}Trang quản trị</a></li>
				<li><button type="button" data-act="logout" class="text-error">${ic('logout', 'w-5 h-5')}Đăng xuất</button></li>
			</ul>
		</div>
	</div>
</header>`,
	);
	const main = $('main');
	if (main && !heroTop) main.classList.add('pt-[calc(3.5rem+env(safe-area-inset-top))]', 'sm:pt-[calc(4rem+env(safe-area-inset-top))]');
	// Chừa chỗ cho thanh dưới trên điện thoại.
	document.body.classList.add('pb-[calc(4rem+env(safe-area-inset-bottom))]', 'lg:pb-0');
	const btmItem = ([id, href, label, icon]) =>
		`<a href="${href}" class="flex-1 flex flex-col items-center justify-center gap-1 h-16 relative ${id === active ? 'text-primary' : 'text-base-content/60'}" ${id === active ? 'aria-current="page"' : ''}>${id === active ? '<span class="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary"></span>' : ''}${ic(icon, 'w-6 h-6')}<span class="text-[11px] font-semibold leading-none">${label}</span></a>`;
	const moreOn = ['gop-y', 'tai-game'].includes(active);
	document.body.insertAdjacentHTML(
		'beforeend',
		`<footer class="bg-base-300 border-t border-white/5 text-sm text-base-content/60">
	<div class="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
		<div>
			<p class="font-black text-base text-base-content">HAVEN <span class="text-primary">LORD</span></p>
			<p class="mt-2 leading-relaxed">Nhập vai pixel online · bản beta, đồ hoạ đang hoàn thiện. Tài khoản và nhân vật lưu trên máy chủ.</p>
		</div>
		<nav aria-label="Trang" class="grid grid-cols-2 gap-x-4">
			${NAV.map(([, href, label]) => `<a class="py-2 hover:text-base-content" href="${href}">${label}</a>`).join('')}
			<a class="py-2 hover:text-base-content" href="tai-game">Tải game</a>
		</nav>
		<div>
			<p class="font-bold text-base-content">Cần giúp?</p>
			<p class="mt-2 leading-relaxed">Gửi ở trang <a class="link link-primary" href="gop-y">Góp ý</a> hoặc trong game: Cài đặt (O) → Góp ý.</p>
		</div>
	</div>
</footer>
<nav id="btm" class="fixed inset-x-0 bottom-0 z-40 lg:hidden bar border-t border-white/10 pb-[env(safe-area-inset-bottom)]" aria-label="Điều hướng">
	<div class="flex max-w-lg mx-auto">
		${NAV.slice(0, 4).map(btmItem).join('')}
		<button type="button" id="more-btn" class="flex-1 flex flex-col items-center justify-center gap-1 h-16 relative ${moreOn ? 'text-primary' : 'text-base-content/60'}">${moreOn ? '<span class="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary"></span>' : ''}${ic('menu', 'w-6 h-6')}<span class="text-[11px] font-semibold leading-none">Thêm</span></button>
	</div>
</nav>
<button id="totop" class="hidden lg:flex btn btn-primary btn-circle w-11 h-11 min-h-11 fixed right-6 bottom-6 z-30 opacity-0 pointer-events-none transition-opacity shadow-lg" aria-label="Lên đầu trang">${ic('up', 'w-5 h-5')}</button>
${sheet(
	'dlg-more',
	`<div class="w-10 h-1.5 rounded-full bg-base-content/20 mx-auto -mt-2 mb-4 sm:hidden"></div>
		<div id="more-acct" class="mb-3"></div>
		<ul class="menu p-0 text-base gap-1">
			<li><a href="gop-y" class="py-3">${ic('chat', 'w-5 h-5')}Góp ý · báo lỗi</a></li>
			<li><a href="tai-game" class="py-3">${ic('download', 'w-5 h-5')}Tải game · hướng dẫn cài</a></li>
			<li><a href="the-gioi" class="py-3">${ic('map', 'w-5 h-5')}Thế giới · lớp nhân vật</a></li>
			<li class="acct-admin hidden"><a href="admin" class="py-3">${ic('shield', 'w-5 h-5')}Trang quản trị</a></li>
			<li id="more-logout" class="hidden"><button type="button" data-act="logout" class="py-3 text-error">${ic('logout', 'w-5 h-5')}Đăng xuất</button></li>
		</ul>`,
)}
${sheet(
	'dlg-auth',
	`<h3 class="font-black text-2xl" id="auth-title">Đăng nhập</h3>
		<p class="text-sm text-base-content/60 mt-1">Dùng chung tài khoản với game.</p>
		<div role="tablist" id="auth-seg" class="join grid grid-cols-2 mt-4">
			<button type="button" role="tab" class="join-item btn btn-primary" data-mode="login">Đăng nhập</button>
			<button type="button" role="tab" class="join-item btn btn-ghost bg-base-200" data-mode="register">Tạo tài khoản</button>
		</div>
		<form id="auth-form" class="mt-3 space-y-3">
			<label class="block"><span class="block text-sm font-semibold mb-1.5">Tên đăng nhập</span>
				<input id="au" class="input input-bordered w-full text-base" autocomplete="username" required maxlength="20" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next"></label>
			<label class="block"><span class="block text-sm font-semibold mb-1.5">Mật khẩu</span>
				<input id="ap" type="password" class="input input-bordered w-full text-base" autocomplete="current-password" required maxlength="72" enterkeyhint="go"></label>
			<label class="block" id="ap2-wrap" hidden><span class="block text-sm font-semibold mb-1.5">Nhập lại mật khẩu</span>
				<input id="ap2" type="password" class="input input-bordered w-full text-base" autocomplete="new-password" maxlength="72" enterkeyhint="go"></label>
			<div id="auth-err" role="alert" class="alert alert-error py-2 text-sm" hidden></div>
			<button class="btn btn-primary w-full" id="auth-go">Đăng nhập</button>
			<p class="text-xs text-base-content/50 leading-relaxed">Tên đăng nhập 3–20 ký tự: chữ thường không dấu, số, gạch dưới. Mật khẩu 6–72 ký tự.</p>
		</form>`,
)}`,
	);

	// Thanh trên: trên banner thì trong suốt, cuộn xuống thì đặc lại; nút lên đầu trang (máy tính).
	const onScroll = () => {
		if (heroTop) ['bar', 'border-b', 'border-white/10'].forEach((c) => $('top').classList.toggle(c, scrollY > 30));
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
			$('more-acct').replaceChildren(
				h('div.flex.items-center.gap-3.p-3.rounded-box.bg-base-200', null, A.avatar(me.username, 'w-11.h-11.text-lg'),
					h('div.min-w-0', null, h('p.font-bold.truncate', null, me.username), h('p.text-sm.text-base-content/60.truncate', null, me.characters.length ? me.characters.map((c) => c.name).join(' · ') : 'Chưa có nhân vật'))),
			);
		} else {
			$('more-acct').replaceChildren(h('button.btn.btn-primary.w-full.gap-2', { type: 'button', onclick: () => ($('dlg-more').close(), A.openAuth('login')) }, A.icon('user', 'w-5 h-5'), 'Đăng nhập / Tạo tài khoản'));
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
		document.querySelectorAll('#auth-seg button').forEach((b) => {
			const on = b.dataset.mode === m;
			b.className = 'join-item btn ' + (on ? 'btn-primary' : 'btn-ghost bg-base-200');
			b.setAttribute('aria-selected', on);
		});
		$('auth-title').textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
		$('auth-go').textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
		$('ap2-wrap').hidden = m === 'login';
		$('ap2').required = m !== 'login';
		$('ap').autocomplete = m === 'login' ? 'current-password' : 'new-password';
	}
	$('auth-seg').onclick = (e) => {
		const b = e.target.closest('[data-mode]');
		if (b) setMode(b.dataset.mode);
	};
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

	// —— Hiện dần khi cuộn tới (chỉ màn rộng — app.css) ——
	A.reveal = (root) => {
		const els = (root || document).querySelectorAll('.reveal:not(.seen)');
		if (!('IntersectionObserver' in window) || A.reduce || innerWidth < 1024) return els.forEach((el) => el.classList.add('seen'));
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
			<button id="lb-pv" class="btn btn-circle btn-ghost" aria-label="Ảnh trước">${ic('chevron', 'w-5 h-5 rotate-180')}</button>
			<p id="lb-cap" class="flex-1 text-center font-semibold text-sm sm:text-base"></p>
			<button id="lb-nx" class="btn btn-circle btn-ghost" aria-label="Ảnh sau">${ic('chevron', 'w-5 h-5')}</button>
			<form method="dialog"><button class="btn btn-circle btn-ghost" aria-label="Đóng">${ic('x', 'w-5 h-5')}</button></form>
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

	// —— Bản client đang phát (trang chủ + tải game) ——
	A.version = fetch('api/client/version', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
	/** Nút tải hợp máy người xem (Android → APK, Windows → exe): đưa lên đầu nhóm `.dl` + gắn nhãn. */
	A.markMyOs = (root) => {
		if (!A.os) return;
		(root || document).querySelectorAll('.dl').forEach((d) => {
			const mine = d.querySelector('[data-os="' + A.os + '"]');
			if (!mine || mine.querySelector('.my-os')) return;
			d.prepend(mine);
			mine.classList.add('relative');
			mine.append(h('span.my-os.absolute.-top-2.5.right-3.badge.badge-error.badge-sm.font-bold', null, 'Hợp máy bạn'));
		});
	};
	A.fillSizes = (v) => {
		const w = v.windows, a = v.android, z = w && w.zip;
		if (w) document.querySelectorAll('[data-size="windows"]').forEach((e) => (e.textContent = 'Windows · bộ cài · ' + A.mb(w.size)));
		if (z) document.querySelectorAll('[data-size="zip"]').forEach((e) => (e.textContent = 'Giải nén rồi chạy · ' + A.mb(z.size)));
		if (a) document.querySelectorAll('[data-size="android"]').forEach((e) => (e.textContent = 'File APK · ' + A.mb(a.size)));
	};

	loadMe();
	A.reveal();
})();
