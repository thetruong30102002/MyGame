// Cầu nối mạng cho bản WebGL (Net/WebGLBridge.cs): fetch, WebSocket và setTimeout của trình duyệt.
// Chuỗi C# → JS là con trỏ UTF-8; JS → C# cấp vùng nhớ tạm, gọi lại C# rồi giải phóng ngay.
var HavenLordNet = {
	$HL: { fetchCb: 0, openCb: 0, messageCb: 0, closeCb: 0, timerCb: 0, sockets: {} },

	$HL_str: function (ptr) { return ptr ? UTF8ToString(ptr) : null; },

	$HL_callText: function (cb, id, extra, text) {
		var len = lengthBytesUTF8(text);
		var ptr = _malloc(len + 1);
		stringToUTF8(text, ptr, len + 1);
		try {
			if (extra === null) {{{ makeDynCall('viii', 'cb') }}}(id, ptr, len);
			else {{{ makeDynCall('viiii', 'cb') }}}(id, extra, ptr, len);
		} finally { _free(ptr); }
	},

	HL_Init: function (fetchCb, openCb, messageCb, closeCb, timerCb) {
		HL.fetchCb = fetchCb; HL.openCb = openCb; HL.messageCb = messageCb; HL.closeCb = closeCb; HL.timerCb = timerCb;
	},

	HL_Fetch: function (id, method, url, token, body, timeoutMs) {
		method = HL_str(method); url = HL_str(url); token = HL_str(token); body = HL_str(body);
		var headers = {};
		if (token) headers['Authorization'] = 'Bearer ' + token;
		if (body !== null) headers['Content-Type'] = 'application/json';
		var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
		var timer = ctrl && timeoutMs > 0 ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : 0;
		var done = function (status, text) {
			if (timer) clearTimeout(timer);
			HL_callText(HL.fetchCb, id, status, text);
		};
		fetch(url, { method: method, headers: headers, body: body, signal: ctrl ? ctrl.signal : undefined })
			.then(function (res) { return res.text().then(function (t) { done(res.status, t); }); })
			.catch(function (e) { done(0, (e && e.name === 'AbortError') ? 'Hết thời gian chờ' : String(e)); });
	},

	HL_WsOpen: function (id, url) {
		var ws;
		try { ws = new WebSocket(HL_str(url)); } catch (e) { {{{ makeDynCall('vii', 'HL.closeCb') }}}(id, 1006); return; }
		HL.sockets[id] = ws;
		ws.onopen = function () { {{{ makeDynCall('vi', 'HL.openCb') }}}(id); };
		ws.onmessage = function (e) { if (typeof e.data === 'string') HL_callText(HL.messageCb, id, null, e.data); };
		ws.onclose = function (e) { delete HL.sockets[id]; {{{ makeDynCall('vii', 'HL.closeCb') }}}(id, e.code || 1006); };
	},

	HL_WsSend: function (id, text) {
		var ws = HL.sockets[id];
		if (!ws || ws.readyState !== 1) return 0;
		ws.send(HL_str(text));
		return 1;
	},

	HL_WsClose: function (id, code, reason) {
		var ws = HL.sockets[id];
		if (ws && ws.readyState < 2) ws.close(code, HL_str(reason) || '');
	},

	HL_SetTimeout: function (id, ms) {
		setTimeout(function () { {{{ makeDynCall('vi', 'HL.timerCb') }}}(id); }, ms);
	}
};
autoAddDeps(HavenLordNet, '$HL');
autoAddDeps(HavenLordNet, '$HL_str');
autoAddDeps(HavenLordNet, '$HL_callText');
mergeInto(LibraryManager.library, HavenLordNet);
