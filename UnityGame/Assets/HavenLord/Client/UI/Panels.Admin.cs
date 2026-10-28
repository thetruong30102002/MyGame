using System;
using System.Collections.Generic;
using System.Globalization;
using HavenLord.Core;
using HavenLord.Net;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Cửa sổ Quản trị (chép `AdminConsole.tsx` + `adminPlan.ts` của web; mở từ tab Cài đặt, chỉ tài khoản có quyền thấy nút). Trái: tìm
    /// nhân vật; giữa: số hiện có + biểu mẫu cộng / trừ (xu, kim cương, bình, EXP, điểm tiềm năng thưởng, đặt cấp, lý do bắt buộc) với xem
    /// trước "hiện có → sau" theo đúng luật máy chủ (`ApplyAdminEco`); bấm Áp dụng hai lần mới gửi; phải: nhật ký. Máy chủ kiểm lại mọi thứ.
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly (string key, string label, long max)[] AdminAmounts =
        {
            ("coins", "Xu", Protocol.AdminLimits.Coins), ("diamonds", "Kim cương", Protocol.AdminLimits.Diamonds), ("potions", "Bình hồi phục", Protocol.AdminLimits.Potions),
            ("exp", "EXP", Protocol.AdminLimits.Exp), ("talentPoints", "Điểm tiềm năng", Protocol.AdminLimits.TalentPoints),
        };

        private static readonly Dictionary<string, string> AdminFieldLabel = new Dictionary<string, string>
        {
            ["coins"] = "Xu", ["diamonds"] = "Kim cương", ["potions"] = "Bình hồi phục", ["level"] = "Cấp", ["exp"] = "EXP", ["bonusPoints"] = "Điểm tiềm năng thưởng",
        };

        private static readonly CultureInfo Vi = CultureInfo.GetCultureInfo("vi-VN");

        private int adminDrawn = -1;
        private bool adminSearched;
        private string adminQuery = "";
        private readonly Dictionary<string, (int sign, string text)> adminDraft = new Dictionary<string, (int, string)>();
        private string adminLevel = "";
        private string adminReason = "";
        private bool adminArmed;
        private string adminLocalError;
        private readonly List<TMP_InputField> adminFields = new List<TMP_InputField>();
        private TMP_Text adminPreviewText;

        private static string Fmt(double n) => n.ToString("#,0", Vi);

        /// <summary>AutoTest: điền một dòng biểu mẫu + lý do như người gõ.</summary>
        public void AdminTestFill(string key, int sign, string text, string reason)
        {
            adminDraft[key] = (sign, text);
            adminReason = reason;
            adminArmed = false;
            Refresh();
        }

        /// <summary>AutoTest: bấm nút Áp dụng (lần đầu = xác nhận, lần hai = gửi).</summary>
        public void AdminTestApply() => AdminApply();

        private bool AdminTyping
        {
            get
            {
                foreach (var f in adminFields) if (f != null && f.isFocused) return true;
                return false;
            }
        }

        private void BuildAdmin()
        {
            adminDrawn = game.AdminVersion;
            adminFields.Clear();
            if (!game.IsAdmin)
            {
                Text(content, "No", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(600, 60), "Tài khoản này không có quyền quản trị.", 18, UiKit.TextDim,
                    TextAnchor.MiddleCenter, true);
                return;
            }
            if (!adminSearched)
            {
                adminSearched = true;
                game.AdminSearch("");
                game.AdminLoadLog();
            }
            BuildAdminSearch();
            BuildAdminForm();
            BuildAdminLog();
        }

        private void BuildAdminSearch()
        {
            var box = Box(content, "Search", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(340, 534), 0.45f);
            Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -10), new Vector2(300, 22), $"Nhân vật  ·  quản trị: {game.AdminUser}", 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var q = AdminInput(box, new Vector2(14, -54), new Vector2(214, 36), "Tên nhân vật / tài khoản…", adminQuery, 40, false, v => adminQuery = v);
            q.onSubmit.AddListener(_ => game.AdminSearch(adminQuery));
            GoldButton(box, "Find", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(236, -54), new Vector2(90, 38), game.AdminBusy ? "…" : "Tìm", () => game.AdminSearch(adminQuery), !game.AdminBusy);
            var list = game.AdminResults;
            if (list.Count == 0)
                Text(box, "E", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(300, 60), game.AdminBusy ? "Đang tìm…" : "Không thấy nhân vật nào.", 14, UiKit.TextDim,
                    TextAnchor.MiddleCenter);
            for (var i = 0; i < list.Count && i < 10; i += 1)
            {
                var c = list[i];
                var sel = game.AdminPick != null && game.AdminPick.Id == c.Id;
                var row = UiKit.Rect(box, "R" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -84 - i * 44), new Vector2(320, 40));
                UiStyle.Pill(row, sel ? new Color(0.91f, 0.77f, 0.42f, 0.32f) : new Color(1, 1, 1, 0.05f), 8).raycastTarget = true;
                UiStyle.Pill(UiKit.Rect(row, "On", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(14, 0), new Vector2(9, 9)),
                    c.Online ? UiStyle.Hex(0x7be07f) : new Color(1, 1, 1, 0.2f), 4);
                Text(row, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(26, -2), new Vector2(200, 20), c.Name, 14, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                Text(row, "A", new Vector2(0, 0), new Vector2(0, 0), new Vector2(26, 2), new Vector2(200, 16), c.Account, 11, UiKit.TextDim, TextAnchor.MiddleLeft);
                Text(row, "L", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-10, 0), new Vector2(90, 20), $"Cấp {c.Level}", 13, UiStyle.GoldHi, TextAnchor.MiddleRight, true);
                var cc = c;
                UiKit.Press(row, () =>
                {
                    adminArmed = false;
                    adminLocalError = null;
                    game.AdminSelect(cc);
                });
            }
        }

        private void BuildAdminForm()
        {
            var box = Box(content, "Form", new Vector2(0, 1), new Vector2(0, 1), new Vector2(350, 0), new Vector2(430, 534), 0.5f);
            var c = game.AdminPick;
            if (c == null)
            {
                Text(box, "E", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(380, 60), "Chọn một nhân vật ở cột trái.", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            Text(box, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -8), new Vector2(400, 26), $"{c.Name}  <size=12><color=#c9b48a>{c.Account}{(c.Online ? " · đang online" : "")}</color></size>", 18,
                UiKit.TextMain, TextAnchor.MiddleLeft, true);
            Text(box, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -34), new Vector2(400, 20),
                $"Cấp {c.Level} · EXP {Fmt(c.Exp)} · Xu {Fmt(c.Coins)} · KC {Fmt(c.Diamonds)} · Bình {c.Potions} · Điểm thưởng {c.BonusPoints}", 12, UiStyle.Parchment, TextAnchor.MiddleLeft);
            const float x0 = 14;
            var y = -74f;
            foreach (var (key, label, max) in AdminAmounts)
            {
                var d = adminDraft.TryGetValue(key, out var v) ? v : (1, "");
                Text(box, "L" + key, new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(x0, y), new Vector2(120, 22), label, 14, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                var sign = UiKit.Rect(box, "Sg" + key, new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(x0 + 122, y), new Vector2(34, 32));
                UiStyle.Pill(sign, d.Item1 > 0 ? UiStyle.Hex(0x3f9b49) : UiStyle.Hex(0x9b3f3f), 8).raycastTarget = true;
                Text(sign, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(30, 28), d.Item1 > 0 ? "+" : "−", 20, Color.white, TextAnchor.MiddleCenter, true);
                var kk = key;
                UiKit.Press(sign, () =>
                {
                    var cur = adminDraft.TryGetValue(kk, out var vv) ? vv : (1, "");
                    adminDraft[kk] = (-cur.Item1, cur.Item2);
                    adminArmed = false;
                    Refresh();
                });
                AdminInput(box, new Vector2(x0 + 162, y), new Vector2(140, 32), $"tối đa {Fmt(max)}", d.Item2, 12, true, t =>
                {
                    var cur = adminDraft.TryGetValue(kk, out var vv) ? vv : (1, "");
                    adminDraft[kk] = (cur.Item1, t);
                    OnAdminDraftChanged();
                });
                y -= 40;
            }
            Text(box, "LLv", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(x0, y), new Vector2(150, 22), "Đặt cấp", 14, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            AdminInput(box, new Vector2(x0 + 162, y), new Vector2(140, 32), $"1–{Protocol.MAX_LEVEL}", adminLevel, 3, true, t =>
            {
                adminLevel = t;
                OnAdminDraftChanged();
            });
            y -= 40;
            Text(box, "LR", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(x0, y), new Vector2(150, 22), "Lý do", 14, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            AdminInput(box, new Vector2(x0 + 70, y), new Vector2(330, 32), "bắt buộc — lưu vào nhật ký", adminReason, Protocol.ADMIN_REASON_MAX, false, t =>
            {
                adminReason = t;
                OnAdminDraftChanged();
            });
            y -= 30;
            adminPreviewText = Text(box, "Pv", new Vector2(0, 1), new Vector2(0, 1), new Vector2(x0, y), new Vector2(400, 100), "", 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            adminPreviewText.textWrappingMode = TextWrappingModes.Normal;
            UpdateAdminPreview();

            var applyLabel = game.AdminBusy ? "Đang gửi…" : adminArmed ? "Bấm lần nữa để áp dụng" : "Áp dụng";
            var apply = GoldButton(box, "Apply", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 14), new Vector2(300, 46), applyLabel, AdminApply, !game.AdminBusy);
            if (adminArmed) apply.GetComponent<Image>().color = new Color(1, 0.72f, 0.66f);
        }

        /// <summary>Gõ vào biểu mẫu: bỏ trạng thái "bấm lần nữa" + cập nhật dòng xem trước tại chỗ (không dựng lại — giữ con trỏ trong ô).</summary>
        private void OnAdminDraftChanged()
        {
            adminLocalError = null;
            if (adminArmed)
            {
                adminArmed = false;
                var t = content.Find("Form/Apply")?.GetComponentInChildren<TMP_Text>();
                if (t != null) t.text = "Áp dụng";
                var img = content.Find("Form/Apply")?.GetComponent<Image>();
                if (img != null) img.color = Color.white;
            }
            UpdateAdminPreview();
        }

        private void UpdateAdminPreview()
        {
            if (adminPreviewText == null || game.AdminPick == null) return;
            var lines = new List<string>();
            var err = adminLocalError ?? game.AdminError;
            if (err != null) lines.Add($"<color=#ff9a7a>{err}</color>");
            var changes = AdminPreview(game.AdminPick, LooseRequest());
            if (changes.Count > 0) lines.Add((adminArmed ? "<b>Xác nhận:</b> " : "Sẽ đổi: ") + string.Join(" · ", changes.ConvertAll(ChangeText)));
            if (game.AdminLastChanges != null)
                lines.Add(game.AdminLastChanges.Count > 0 ? "<color=#9fe39a>Vừa áp: " + string.Join(" · ", game.AdminLastChanges.ConvertAll(ChangeText)) + "</color>" : "<color=#9fe39a>Vừa áp: không đổi gì</color>");
            adminPreviewText.text = string.Join("\n", lines);
        }

        private void AdminApply()
        {
            var (req, error) = DraftRequest();
            if (error != null)
            {
                adminLocalError = error;
                adminArmed = false;
                UpdateAdminPreview();
                return;
            }
            if (!adminArmed)
            {
                adminArmed = true;
                Refresh();
                return;
            }
            adminArmed = false;
            adminDraft.Clear();
            adminLevel = "";
            adminReason = "";
            game.AdminGrant(req);
        }

        /// <summary>Số gõ tay → số nguyên không âm (bỏ dấu phân cách nghìn). "" = 0; sai dạng = null.</summary>
        private static long? ReadDigits(string text)
        {
            var t = (text ?? "").Replace(" ", "").Replace(".", "").Replace(",", "").Replace("_", "");
            if (t.Length == 0) return 0;
            if (t.Length > 12) return null;
            foreach (var ch in t) if (ch < '0' || ch > '9') return null;
            return long.Parse(t, CultureInfo.InvariantCulture);
        }

        private static string CleanReason(string text)
        {
            var sb = new System.Text.StringBuilder();
            foreach (var ch in (text ?? "").Normalize(System.Text.NormalizationForm.FormC)) sb.Append(ch < 32 || ch == 127 ? ' ' : ch);
            return System.Text.RegularExpressions.Regex.Replace(sb.ToString(), @"\s+", " ").Trim();
        }

        private static void SetAmount(AdminGrantRequest req, string key, long n)
        {
            switch (key)
            {
                case "coins": req.Coins = n; break;
                case "diamonds": req.Diamonds = n; break;
                case "potions": req.Potions = n; break;
                case "exp": req.Exp = n; break;
                case "talentPoints": req.TalentPoints = n; break;
            }
        }

        /// <summary>Biểu mẫu → yêu cầu, hoặc câu báo lỗi đầu tiên (cùng luật máy chủ `parseGrant`).</summary>
        private (AdminGrantRequest req, string error) DraftRequest()
        {
            var req = new AdminGrantRequest { CharacterId = game.AdminPick?.Id, Reason = CleanReason(adminReason) };
            if (req.CharacterId == null) return (null, "Chưa chọn nhân vật");
            var any = false;
            foreach (var (key, label, max) in AdminAmounts)
            {
                var d = adminDraft.TryGetValue(key, out var v) ? v : (1, "");
                var n = ReadDigits(d.Item2);
                if (n == null) return (null, $"{label}: chỉ gõ chữ số");
                if (n > max) return (null, $"{label}: mỗi lần cộng / trừ tối đa {Fmt(max)}");
                if (n.Value == 0) continue;
                SetAmount(req, key, n.Value * d.Item1);
                any = true;
            }
            if (adminLevel.Trim().Length > 0)
            {
                var n = ReadDigits(adminLevel.Trim());
                if (n == null || n < 1 || n > Protocol.MAX_LEVEL) return (null, $"Đặt cấp: số 1–{Protocol.MAX_LEVEL}");
                req.SetLevel = (int)n.Value;
                any = true;
            }
            if (!any) return (null, "Chưa nhập thay đổi nào");
            if (req.Reason.Length == 0) return (null, "Ghi lý do (bắt buộc — lưu vào nhật ký)");
            if (req.Reason.Length > Protocol.ADMIN_REASON_MAX) return (null, $"Lý do tối đa {Protocol.ADMIN_REASON_MAX} ký tự");
            return (req, null);
        }

        /// <summary>Bản lỏng để xem trước NGAY khi đang gõ: số sai dạng coi như 0, quá biên độ kẹp ở biên độ, chưa kiểm lý do.</summary>
        private AdminGrantRequest LooseRequest()
        {
            var req = new AdminGrantRequest { CharacterId = game.AdminPick?.Id, Reason = "" };
            foreach (var (key, _, max) in AdminAmounts)
            {
                var d = adminDraft.TryGetValue(key, out var v) ? v : (1, "");
                var n = ReadDigits(d.Item2) ?? 0;
                if (n > 0) SetAmount(req, key, Math.Min(n, max) * d.Item1);
            }
            var lv = ReadDigits(adminLevel.Trim()) ?? 0;
            if (lv >= 1 && lv <= Protocol.MAX_LEVEL) req.SetLevel = (int)lv;
            return req;
        }

        /// <summary>Các trường SẼ đổi (trước → sau) theo đúng luật máy chủ — kẹp không âm / không quá trần đã tính sẵn.</summary>
        private List<AdminChange> AdminPreview(AdminCharacter c, AdminGrantRequest req)
        {
            var before = new Eco { Level = c.Level, Exp = c.Exp, Coins = c.Coins, Potions = c.Potions };
            var after = game.EconomyRules.ApplyAdminEco(before, req.Coins, req.Potions, req.Exp, req.SetLevel);
            var o = new List<AdminChange>();
            void Add(string f, double a, double b)
            {
                if (a != b) o.Add(new AdminChange { Field = f, From = a, To = b });
            }
            Add("level", before.Level, after.Level);
            Add("exp", before.Exp, after.Exp);
            Add("coins", before.Coins, after.Coins);
            Add("potions", before.Potions, after.Potions);
            if (req.Diamonds.HasValue && req.Diamonds != 0) Add("diamonds", c.Diamonds, Math.Max(0, c.Diamonds + req.Diamonds.Value));
            if (req.TalentPoints.HasValue && req.TalentPoints != 0) Add("bonusPoints", c.BonusPoints, game.TalentRules.CleanBonusPoints(c.BonusPoints + req.TalentPoints.Value));
            return o;
        }

        /// <summary>"Xu 1.200 → 2.200 (+1.000)".</summary>
        private static string ChangeText(AdminChange c)
        {
            var d = c.To - c.From;
            var name = AdminFieldLabel.TryGetValue(c.Field, out var l) ? l : c.Field;
            return $"{name} {Fmt(c.From)} → {Fmt(c.To)} ({(d > 0 ? "+" : "−")}{Fmt(Math.Abs(d))})";
        }

        /// <summary>Nhật ký: máy chủ trả mỗi trường một dòng (mới nhất trước) — gộp theo từng lần cộng.</summary>
        private void BuildAdminLog()
        {
            var box = Box(content, "Log", new Vector2(1, 1), new Vector2(1, 1), Vector2.zero, new Vector2(266, 534), 0.45f);
            Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -10), new Vector2(240, 22), game.AdminPick != null ? $"Nhật ký · {game.AdminPick.Name}" : "Nhật ký", 14,
                UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var groups = new List<(string key, AdminLogEntry head, List<AdminChange> changes)>();
            foreach (var e in game.AdminLogs)
            {
                var key = $"{e.At}|{e.Admin}|{e.CharacterId}|{e.Reason}";
                if (groups.Count > 0 && groups[groups.Count - 1].key == key) groups[groups.Count - 1].changes.Insert(0, e);
                else groups.Add((key, e, new List<AdminChange> { e }));
            }
            if (groups.Count == 0)
                Text(box, "E", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(240, 60), "Chưa có lần cộng / trừ nào.", 13, UiKit.TextDim, TextAnchor.MiddleCenter);
            var y = -40f;
            foreach (var (_, head, changes) in groups)
            {
                if (y < -500) break;
                var when = DateTimeOffset.FromUnixTimeMilliseconds(head.At).ToLocalTime().ToString("dd/MM HH:mm", Vi);
                var body = $"<color=#e8c46b>{when}</color> · {head.Admin} → <b>{head.CharacterName}</b>\n<color=#c9b48a>{head.Reason}</color>\n" +
                    string.Join("\n", changes.ConvertAll(ChangeText));
                var t = Text(box, "G", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, y), new Vector2(240, 80), body, 11, UiStyle.Parchment, TextAnchor.UpperLeft);
                t.textWrappingMode = TextWrappingModes.Normal;
                var h = t.GetPreferredValues(body, 240, 400).y;
                t.rectTransform.sizeDelta = new Vector2(240, h);
                y -= h + 10;
            }
        }

        /// <summary>Ô nhập của cửa sổ quản trị (nền giấy như ô kết bạn); <paramref name="digits"/>: chỉ nhận chữ số.</summary>
        private TMP_InputField AdminInput(RectTransform parent, Vector2 pos, Vector2 size, string placeholder, string value, int limit, bool digits, Action<string> changed)
        {
            var rt = UiKit.Rect(parent, "In", new Vector2(0, 1), new Vector2(0, 0.5f), pos, size);
            var bg = UiStyle.Pill(rt, UiStyle.Hex(0xfdf3dc), 8);
            bg.raycastTarget = true;
            var area = UiKit.Stretch(rt, "Area");
            area.offsetMin = new Vector2(10, 2);
            area.offsetMax = new Vector2(-10, -2);
            area.gameObject.AddComponent<RectMask2D>();
            var ph = UiKit.Label(UiKit.Stretch(area, "Ph"), placeholder, 13, UiStyle.Hex(0x9c8461), TextAnchor.MiddleLeft);
            ph.fontStyle = FontStyles.Italic;
            var tx = UiKit.Label(UiKit.Stretch(area, "Tx"), "", 14, UiStyle.InkBrown, TextAnchor.MiddleLeft);
            tx.richText = false;
            var f = rt.gameObject.AddComponent<TMP_InputField>();
            f.textViewport = area;
            f.textComponent = tx;
            f.placeholder = ph;
            f.fontAsset = UiKit.Regular;
            f.pointSize = 14;
            f.characterLimit = limit;
            f.contentType = digits ? TMP_InputField.ContentType.IntegerNumber : TMP_InputField.ContentType.Standard;
            f.customCaretColor = true;
            f.caretColor = UiStyle.InkBrown;
            f.text = value ?? "";
            f.onValueChanged.AddListener(v => changed(v));
            adminFields.Add(f);
            return f;
        }
    }
}
