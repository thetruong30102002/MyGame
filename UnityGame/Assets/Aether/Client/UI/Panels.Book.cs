using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Aether.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Thư viện dạng QUYỂN SÁCH (chủ dự án 11/10/2026: "thư viện nên làm kiểu quyển sách, trang sách phân theo vùng… lật trang, nhìn trang
    /// giấy cũ cũ"). Bìa da viền vàng, hai trang giấy cũ (ảnh giấy sinh trong code: ố vàng, vết loang, mép sạm), gáy giữa đổ bóng.
    /// Mỗi vùng một CHƯƠNG (dải đánh dấu trên đầu sách, màu theo vùng) + chương Nhân vật: mở chương là trang tựa (tên vùng, cấp, hệ, lời
    /// giới thiệu, đã ghi bao nhiêu trang) + mục lục (bấm để lật tới); sau đó mỗi trang một quái / boss / nhân vật. Lật bằng nút góc trang
    /// hoặc phím ← → (PageUp / PageDown), có hoạt cảnh tờ giấy lật qua gáy. Dữ liệu: `Panels.Codex.cs`.
    /// </summary>
    public sealed partial class Panels
    {
        private sealed class Chapter
        {
            public string Id, Title, Short, Intro, Sub;
            public Color Ribbon;
            public List<CodexEntry> Entries = new List<CodexEntry>();
            /// <summary>Số trải trang: trang tựa + mục lục, rồi 2 mục / trải.</summary>
            public int Spreads => 1 + (Entries.Count + 1) / 2;
        }

        private int bookChapter;
        private int bookSpread;
        private Coroutine bookFlip;

        private static readonly Color Ink = new Color(0.22f, 0.14f, 0.08f);
        private static readonly Color InkDim = new Color(0.45f, 0.36f, 0.25f);
        private static readonly Color InkRed = new Color(0.5f, 0.13f, 0.07f);

        private static readonly Dictionary<string, (string label, Color color)> ChapterLook = new Dictionary<string, (string, Color)>
        {
            ["human"] = ("Thistlewood", new Color(0.33f, 0.55f, 0.25f)),
            ["swamp"] = ("Đầm lầy", new Color(0.36f, 0.45f, 0.2f)),
            ["desert"] = ("Sa mạc", new Color(0.78f, 0.5f, 0.18f)),
            ["highland"] = ("Cao nguyên", new Color(0.2f, 0.55f, 0.52f)),
            ["tundra"] = ("Lãnh nguyên", new Color(0.35f, 0.58f, 0.78f)),
            ["volcano"] = ("Núi lửa", new Color(0.7f, 0.2f, 0.12f)),
            ["isles"] = ("Quần đảo", new Color(0.18f, 0.4f, 0.72f)),
        };

        private List<Chapter> BookChapters()
        {
            var all = Codex();
            var chapters = new List<Chapter>();
            var used = new HashSet<CodexEntry>();
            var regions = game.RegionRulesPublic.All.Where(r => r.Ready).OrderBy(r => r.Order).ToList();
            foreach (var r in regions)
            {
                var list = all.Where(e => e.Kind != "npc" && e.Regions.Contains(r.Id))
                    .OrderBy(e => e.Kind == "boss" ? 1 : 0).ThenBy(e => e.Id.StartsWith("dragon_", StringComparison.Ordinal) ? 1 : 0)
                    .ThenBy(e => e.Stats?.Exp ?? 0).ToList();
                if (list.Count == 0) continue;
                foreach (var e in list) used.Add(e);
                var look = ChapterLook.TryGetValue(r.Id, out var l) ? l : (r.Name, new Color(0.5f, 0.4f, 0.3f));
                var lv = r.Levels != null && r.Levels.Length == 2 ? $"Cấp {r.Levels[0]}–{r.Levels[1]}" : "";
                var el = r.Element != null ? $"Hệ {r.Element.Name} · yếu {r.Element.Weak}" : "";
                chapters.Add(new Chapter
                {
                    Id = r.Id, Title = r.Name, Short = look.Item1, Ribbon = look.Item2, Intro = r.Intro ?? "",
                    Sub = string.Join("  ·  ", new[] { lv, el }.Where(x => x.Length > 0)), Entries = list,
                });
            }
            var other = all.Where(e => e.Kind != "npc" && !used.Contains(e) && e.Places.Count > 0).ToList();
            if (other.Count > 0)
                chapters.Add(new Chapter { Id = "other", Title = "Miền chưa ghi", Short = "Khác", Ribbon = new Color(0.45f, 0.42f, 0.38f), Intro = "Những sinh vật gặp ngoài các vùng đã vẽ bản đồ.", Entries = other });
            var seen = game.CodexSeen();
            var npcs = all.Where(e => e.Kind == "npc").OrderBy(e => seen.Contains(e.Id) ? 0 : 1).ThenBy(e => e.Name).ToList();
            if (npcs.Count > 0)
                chapters.Add(new Chapter { Id = "npc", Title = "Nhân vật", Short = "Nhân vật", Ribbon = new Color(0.45f, 0.25f, 0.5f), Intro = "Những người Lior đã gặp trên đường — từ thuở nhỏ ở Thistlewood tới những miền xa.", Entries = npcs });
            return chapters;
        }

        private void BuildCodex()
        {
            var chapters = BookChapters();
            if (chapters.Count == 0) return;
            bookChapter = Mathf.Clamp(bookChapter, 0, chapters.Count - 1);
            var ch = chapters[bookChapter];
            bookSpread = Mathf.Clamp(bookSpread, 0, ch.Spreads - 1);
            var seen = game.CodexSeen();
            var kills = game.CodexKills();

            // Dải đánh dấu chương trên đầu sách (chương đang mở kéo cao hơn, sáng hơn).
            var tabW = Mathf.Min(104f, 860f / chapters.Count);
            for (var i = 0; i < chapters.Count; i += 1)
            {
                var c = chapters[i];
                var on = i == bookChapter;
                var tab = UiKit.Rect(content, "Mark" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(18 + i * tabW, on ? 2 : -4), new Vector2(tabW - 6, 40));
                var face = UiStyle.Pill(tab, on ? c.Ribbon : Color.Lerp(c.Ribbon, Color.black, 0.35f), 7);
                face.raycastTarget = true;
                var got = c.Entries.Count(e => seen.Contains(e.Id));
                Text(tab, "t", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -3), new Vector2(tabW - 10, 30),
                    $"{c.Short}\n<size=9>{got}/{c.Entries.Count}</size>", 11, on ? Color.white : new Color(1, 1, 1, 0.7f), TextAnchor.UpperCenter, true, on);
                var ci = i;
                UiKit.Press(tab, () => BookGo(ci, 0));
            }

            // Bìa da + hai trang giấy + gáy.
            var book = UiKit.Rect(content, "Book", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -30), new Vector2(886, 504));
            UiStyle.Pill(book, new Color(0.17f, 0.09f, 0.05f), 16).raycastTarget = true;
            var leather = UiKit.Stretch(book, "Leather");
            leather.offsetMin = new Vector2(3, 3);
            leather.offsetMax = new Vector2(-3, -3);
            UiStyle.Pill(leather, new Color(0.36f, 0.2f, 0.11f), 14);
            var trim = UiKit.Stretch(book, "Trim");
            trim.offsetMin = new Vector2(7, 7);
            trim.offsetMax = new Vector2(-7, -7);
            UiStyle.Pill(trim, new Color(0.85f, 0.66f, 0.3f, 0.55f), 11);
            var trimIn = UiKit.Stretch(trim, "in");
            trimIn.offsetMin = new Vector2(1.5f, 1.5f);
            trimIn.offsetMax = new Vector2(-1.5f, -1.5f);
            UiStyle.Pill(trimIn, new Color(0.33f, 0.18f, 0.1f), 10);
            foreach (var (ax, ay) in new[] { (0f, 0f), (1f, 0f), (0f, 1f), (1f, 1f) })
            {
                var corner = UiKit.Rect(book, "Corner", new Vector2(ax, ay), new Vector2(ax, ay), new Vector2(ax == 0 ? 2 : -2, ay == 0 ? 2 : -2), new Vector2(26, 26));
                UiStyle.Pill(corner, new Color(0.88f, 0.7f, 0.32f), 6);
            }
            var left = Page(book, true);
            var right = Page(book, false);
            var spine = UiKit.Rect(book, "Spine", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(6, 472));
            UiKit.Panel(spine, new Color(0.25f, 0.15f, 0.08f, 0.6f));

            var firstPage = bookSpread * 2 + 1;
            if (bookSpread == 0)
            {
                TitlePage(left, ch, chapters.IndexOf(ch) + 1, seen, kills);
                ContentsPage(right, ch, seen);
            }
            else
            {
                var i0 = (bookSpread - 1) * 2;
                EntryPage(left, ch.Entries[i0], seen, kills);
                if (i0 + 1 < ch.Entries.Count) EntryPage(right, ch.Entries[i0 + 1], seen, kills);
                else
                {
                    Text(right, "End", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 10), new Vector2(300, 60), "— Hết chương —", 16, InkDim, TextAnchor.MiddleCenter);
                }
            }
            PageNumber(left, firstPage);
            PageNumber(right, firstPage + 1);
            var canBack = bookSpread > 0 || bookChapter > 0;
            var canNext = bookSpread < ch.Spreads - 1 || bookChapter < chapters.Count - 1;
            if (canBack) PageTurn(left, true, () => BookStep(-1));
            if (canNext) PageTurn(right, false, () => BookStep(1));
        }

        /// <summary>Một trang giấy cũ (trái / phải), trả về vùng nội dung (đã chừa lề).</summary>
        private RectTransform Page(RectTransform book, bool isLeft)
        {
            // Tâm trang làm trục: trang trái lật gương quanh tâm của chính nó.
            var page = UiKit.Rect(book, isLeft ? "PageL" : "PageR", new Vector2(isLeft ? 0 : 1, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(isLeft ? 228.5f : -228.5f, 0), new Vector2(429, 472));
            var paper = page.gameObject.AddComponent<Image>();
            paper.sprite = PaperSprite();
            paper.raycastTarget = true;
            if (isLeft) page.localScale = new Vector3(-1, 1, 1);
            // Bóng gáy: tối dần về phía giữa sách (trang trái lật gương nên dải bóng nằm đúng mép trong).
            var fold = UiKit.Rect(page, "Fold", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(60, 472));
            var fi = fold.gameObject.AddComponent<Image>();
            fi.sprite = FoldSprite();
            fi.raycastTarget = false;
            var body = UiKit.Rect(book, isLeft ? "BodyL" : "BodyR", new Vector2(isLeft ? 0 : 1, 0.5f), new Vector2(isLeft ? 0 : 1, 0.5f),
                new Vector2(isLeft ? 14 : -14, 0), new Vector2(429, 472));
            return body;
        }

        private void TitlePage(RectTransform p, Chapter ch, int number, HashSet<string> seen, Dictionary<string, double> kills)
        {
            var got = ch.Entries.Count(e => seen.Contains(e.Id));
            var slain = ch.Entries.Sum(e => kills.TryGetValue(e.Id, out var k) ? k : 0);
            Text(p, "No", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -56), new Vector2(360, 22),
                ch.Id == "npc" || ch.Id == "other" ? "PHỤ LỤC" : $"CHƯƠNG {number}", 14, InkRed, TextAnchor.MiddleCenter, true).characterSpacing = 6;
            var title = Text(p, "Title", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -84), new Vector2(370, 70), ch.Title, 28, Ink, TextAnchor.MiddleCenter, true);
            title.enableAutoSizing = true;
            title.fontSizeMin = 18;
            title.fontSizeMax = 28;
            Text(p, "Orn", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -158), new Vector2(300, 20), "———  ◆  ———", 14, ch.Ribbon * 0.8f + Ink * 0.2f, TextAnchor.MiddleCenter);
            if (!string.IsNullOrEmpty(ch.Sub))
                Text(p, "Sub", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -184), new Vector2(370, 22), ch.Sub, 13, InkDim, TextAnchor.MiddleCenter, true);
            var intro = Text(p, "Intro", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -220), new Vector2(350, 150), $"<i>{ch.Intro}</i>", 15, Ink, TextAnchor.UpperCenter);
            intro.textWrappingMode = TextWrappingModes.Normal;
            intro.lineSpacing = 10;
            intro.enableAutoSizing = true;
            intro.fontSizeMin = 11;
            intro.fontSizeMax = 15;
            Text(p, "Prog", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 66), new Vector2(370, 40),
                $"Đã ghi chép {got} / {ch.Entries.Count} trang" + (ch.Id != "npc" ? $"\n<size=12>Đã hạ tổng cộng {slain:#,0}</size>" : ""), 14, Ink, TextAnchor.MiddleCenter, true);
        }

        private void ContentsPage(RectTransform p, Chapter ch, HashSet<string> seen)
        {
            Text(p, "H", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -40), new Vector2(300, 24), "MỤC LỤC", 16, InkRed, TextAnchor.MiddleCenter, true).characterSpacing = 6;
            var n = ch.Entries.Count;
            var cols = n > 16 ? 2 : 1;
            var perCol = Mathf.CeilToInt(n / (float)cols);
            var rowH = Mathf.Min(24f, 340f / Mathf.Max(1, perCol));
            var colW = cols == 1 ? 340f : 180f;
            for (var i = 0; i < n; i += 1)
            {
                var e = ch.Entries[i];
                var known = seen.Contains(e.Id);
                var col = i / perCol;
                var x = cols == 1 ? -170f : -184f + col * 192f;
                var row = UiKit.Rect(p, "R" + i, new Vector2(0.5f, 1), new Vector2(0, 1), new Vector2(x, -76 - (i % perCol) * rowH), new Vector2(colW, rowH));
                UiKit.Panel(row, new Color(0, 0, 0, 0), true);
                var boss = e.Kind == "boss";
                var name = known ? e.Name : "???";
                var label = Text(row, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(colW - 34, rowH),
                    (boss ? "<color=#7a2010>◆</color> " : "") + name, cols == 1 ? 14 : 12, known ? Ink : InkDim, TextAnchor.MiddleLeft, boss);
                label.overflowMode = TextOverflowModes.Ellipsis;
                Text(row, "p", new Vector2(1, 0.5f), new Vector2(1, 0.5f), Vector2.zero, new Vector2(34, rowH), (i + 3).ToString(), cols == 1 ? 13 : 11, InkDim, TextAnchor.MiddleRight);
                var spread = 1 + i / 2;
                UiKit.Press(row, () => BookGo(bookChapter, spread)).Enter = () => label.color = InkRed;
            }
            Text(p, "Tip", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 40), new Vector2(360, 20), "Bấm tên để lật tới trang · ← → lật trang", 11, InkDim, TextAnchor.MiddleCenter);
        }

        private void EntryPage(RectTransform p, CodexEntry e, HashSet<string> seen, Dictionary<string, double> kills)
        {
            var known = seen.Contains(e.Id);
            var kind = e.Kind == "npc" ? (e.Titles.Count > 0 ? e.Titles[0] : "Nhân vật") : e.Titles.Count > 0 ? e.Titles[0] : "";
            Text(p, "K", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -34), new Vector2(370, 18), known ? kind.ToUpperInvariant() : "CHƯA GẶP", 11, InkRed, TextAnchor.MiddleCenter, true).characterSpacing = 3;
            var name = Text(p, "N", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -52), new Vector2(370, 34), known ? e.Name : "???", 24, Ink, TextAnchor.MiddleCenter, true);
            name.enableAutoSizing = true;
            name.fontSizeMin = 15;
            name.fontSizeMax = 24;

            // Khung tranh vẽ mực: nền giấy đậm hơn + quầng sáng + chân dung (chưa gặp = bóng đen).
            var frame = UiKit.Rect(p, "Frame", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -92), new Vector2(176, 150));
            UiStyle.Pill(frame, new Color(0.35f, 0.22f, 0.12f, 0.75f), 8);
            var inner = UiKit.Stretch(frame, "in");
            inner.offsetMin = new Vector2(2, 2);
            inner.offsetMax = new Vector2(-2, -2);
            UiStyle.Pill(inner, new Color(0.86f, 0.77f, 0.58f), 7);
            UiWidgets.Radial(UiKit.Rect(inner, "Glow", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(170, 150)), new Color(1f, 0.95f, 0.8f, 0.8f));
            var def = e.Sprite != null ? game.Database.Character(e.Sprite) : null;
            var por = UiKit.Icon(UiKit.Rect(inner, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(132, 132)), def != null ? GameController.PortraitOf(def) : null);
            if (def == null && por != null) por.color = new Color(1, 1, 1, 0);
            else if (!known) por.color = new Color(0.12f, 0.08f, 0.05f, 0.75f);
            if (def == null) Text(inner, "Q", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(120, 80), "?", 54, InkDim, TextAnchor.MiddleCenter, true);

            var facts = new List<string>();
            if (known && e.Stats != null)
            {
                var s = e.Stats;
                facts.Add($"Máu <b>{s.Hp:#,0}</b> · Công <b>{s.Atk}</b> · Giáp <b>{s.Def}</b> · Tốc {s.Speed:0}");
                facts.Add($"{(string.IsNullOrEmpty(s.Ranged) ? "Đánh gần" : "Đánh xa")} · {s.Exp} EXP · {s.Coins} xu · đã hạ <b>{(kills.TryGetValue(e.Id, out var k) ? k : 0):#,0}</b>");
            }
            if (known && e.Ages.Count > 0) facts.Add("Gặp được: " + AgesText(e.Ages));
            if (e.Places.Count > 0) facts.Add("Nơi ở: " + string.Join(", ", e.Places.Take(4)) + (e.Places.Count > 4 ? "…" : ""));
            var ft = Text(p, "F", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -252), new Vector2(370, 62), string.Join("\n", facts), 12, Ink, TextAnchor.UpperCenter);
            ft.textWrappingMode = TextWrappingModes.Normal;
            ft.enableAutoSizing = true;
            ft.fontSizeMin = 9;
            ft.fontSizeMax = 12;
            var rule = UiKit.Rect(p, "Rule", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -320), new Vector2(240, 1));
            UiKit.Panel(rule, new Color(Ink.r, Ink.g, Ink.b, 0.35f));
            var lore = Text(p, "L", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -330), new Vector2(360, 96),
                known ? $"<i>{e.Lore}</i>" : "<i>Trang này còn trống. Lại gần để ghi chép.</i>", 14, known ? Ink : InkDim, TextAnchor.UpperCenter);
            lore.textWrappingMode = TextWrappingModes.Normal;
            lore.lineSpacing = 6;
            lore.enableAutoSizing = true;
            lore.fontSizeMin = 10;
            lore.fontSizeMax = 14;
        }

        private static void PageNumber(RectTransform p, int n) =>
            Text(p, "No", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 14), new Vector2(80, 18), $"— {n} —", 11, InkDim, TextAnchor.MiddleCenter);

        /// <summary>Góc trang có thể bấm để lật (góc dưới ngoài: trái = trang trước, phải = trang sau).</summary>
        private static void PageTurn(RectTransform p, bool back, Action go)
        {
            var rt = UiKit.Rect(p, back ? "Back" : "Next", new Vector2(back ? 0 : 1, 0), new Vector2(back ? 0 : 1, 0), new Vector2(back ? 14 : -14, 8), new Vector2(120, 30));
            UiKit.Panel(rt, new Color(0, 0, 0, 0), true);
            var t = Text(rt, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(120, 30), back ? "‹ Trang trước" : "Trang sau ›", 13, InkRed, back ? TextAnchor.MiddleLeft : TextAnchor.MiddleRight, true);
            var press = UiKit.Press(rt, go);
            press.Enter = () => t.color = Ink;
            press.Exit = () => t.color = InkRed;
        }

        private void BookStep(int dir)
        {
            var chapters = BookChapters();
            var ch = Mathf.Clamp(bookChapter, 0, chapters.Count - 1);
            var sp = bookSpread + dir;
            if (sp < 0)
            {
                if (ch == 0) return;
                ch -= 1;
                sp = chapters[ch].Spreads - 1;
            }
            else if (sp >= chapters[ch].Spreads)
            {
                if (ch >= chapters.Count - 1) return;
                ch += 1;
                sp = 0;
            }
            BookGo(ch, sp);
        }

        private void BookGo(int chapter, int spread)
        {
            if (chapter == bookChapter && spread == bookSpread) return;
            var forward = chapter > bookChapter || (chapter == bookChapter && spread > bookSpread);
            bookChapter = chapter;
            bookSpread = spread;
            Refresh();
            if (bookFlip != null) StopCoroutine(bookFlip);
            bookFlip = StartCoroutine(FlipAnim(forward));
        }

        /// <summary>Tờ giấy lật qua gáy: co về gáy ở trang cũ rồi mở ra ở trang mới, tối dần khi dựng đứng.</summary>
        private IEnumerator FlipAnim(bool forward)
        {
            var book = content != null ? content.Find("Book") as RectTransform : null;
            if (book == null) yield break;
            var sheet = UiKit.Rect(book, "Sheet", new Vector2(0.5f, 0.5f), new Vector2(forward ? 0 : 1, 0.5f), Vector2.zero, new Vector2(429, 472));
            var img = sheet.gameObject.AddComponent<Image>();
            img.sprite = PaperSprite();
            img.raycastTarget = false;
            const float half = 0.16f;
            for (var t = 0f; t < half; t += Time.unscaledDeltaTime)
            {
                if (sheet == null) yield break;
                var k = 1 - t / half;
                sheet.localScale = new Vector3(k * k * (3 - 2 * k), 1, 1);
                img.color = Color.Lerp(new Color(0.6f, 0.52f, 0.4f), Color.white, k);
                yield return null;
            }
            if (sheet == null) yield break;
            sheet.pivot = new Vector2(forward ? 1 : 0, 0.5f);
            for (var t = 0f; t < half; t += Time.unscaledDeltaTime)
            {
                if (sheet == null) yield break;
                var k = t / half;
                sheet.localScale = new Vector3(k * k * (3 - 2 * k), 1, 1);
                img.color = Color.Lerp(new Color(0.6f, 0.52f, 0.4f), Color.white, k) * new Color(1, 1, 1, 1 - k * 0.85f);
                yield return null;
            }
            if (sheet != null) Destroy(sheet.gameObject);
            bookFlip = null;
        }

        /// <summary>Phím lật trang khi đang mở Thư viện (gọi từ Update).</summary>
        private void BookKeys()
        {
            if (kind != Kind.Codex) return;
            if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.PageDown)) BookStep(1);
            else if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.PageUp)) BookStep(-1);
        }

        /// <summary>AutoTest: mở Thư viện ở chương / trải trang cho trước.</summary>
        public void TestBook(int chapter, int spread)
        {
            Show(Kind.Codex);
            BookGo(chapter, spread);
        }

        public int TestBookChapters => BookChapters().Count;

        private static Sprite paper, fold;

        /// <summary>
        /// Giấy cũ sinh trong code (một lần): nền ngà, vân giấy hai tầng (Perlin), vài vết loang hình vành (như vết cốc), đốm ố, mép ngoài
        /// sạm nâu. Mép TRONG (x = 0, phía gáy) để sáng — bóng gáy là lớp riêng.
        /// </summary>
        private static Sprite PaperSprite()
        {
            if (paper != null) return paper;
            const int w = 256, h = 282;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
            var px = new Color[w * h];
            var rnd = new System.Random(1407);
            var stains = new List<(float x, float y, float r)>();
            for (var i = 0; i < 4; i += 1) stains.Add(((float)rnd.NextDouble() * w, (float)rnd.NextDouble() * h, 8 + (float)rnd.NextDouble() * 26));
            var spots = new List<(float x, float y, float r)>();
            for (var i = 0; i < 40; i += 1) spots.Add(((float)rnd.NextDouble() * w, (float)rnd.NextDouble() * h, 0.6f + (float)rnd.NextDouble() * 1.8f));
            var baseCol = new Color(0.93f, 0.86f, 0.69f);
            var burnt = new Color(0.55f, 0.36f, 0.18f);
            for (var y = 0; y < h; y += 1)
                for (var x = 0; x < w; x += 1)
                {
                    var c = baseCol;
                    var n = Mathf.PerlinNoise(x * 0.025f + 11, y * 0.025f + 7) - 0.5f;
                    var f = Mathf.PerlinNoise(x * 0.22f + 3, y * 0.22f + 5) - 0.5f;
                    var fiber = Mathf.PerlinNoise(x * 0.9f, y * 0.06f) - 0.5f;
                    c *= 1 + n * 0.12f + f * 0.05f + fiber * 0.03f;
                    foreach (var (sx, sy, sr) in stains)
                    {
                        var d = Mathf.Sqrt((x - sx) * (x - sx) + (y - sy) * (y - sy));
                        if (d < sr) c = Color.Lerp(c, c * new Color(0.93f, 0.87f, 0.76f), 0.12f + 0.3f * Mathf.Pow(d / sr, 6));
                    }
                    foreach (var (sx, sy, sr) in spots)
                    {
                        var d = Mathf.Sqrt((x - sx) * (x - sx) + (y - sy) * (y - sy));
                        if (d < sr) c = Color.Lerp(c, burnt, 0.35f * (1 - d / sr));
                    }
                    // Mép ngoài (phải / trên / dưới) sạm dần, mép gáy (trái) giữ sáng.
                    var edge = Mathf.Min(w - 1 - x, Mathf.Min(y, h - 1 - y));
                    var wobble = (Mathf.PerlinNoise(x * 0.08f, y * 0.08f) - 0.5f) * 6;
                    var e = Mathf.Clamp01(1 - (edge + wobble) / 18f);
                    c = Color.Lerp(c, burnt, e * e * 0.7f);
                    c.a = 1;
                    px[y * w + x] = c;
                }
            tex.SetPixels(px);
            tex.Apply();
            paper = Sprite.Create(tex, new UnityEngine.Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100);
            return paper;
        }

        /// <summary>Bóng gáy: dải tối mờ dần từ mép trái (x = 0) sang phải.</summary>
        private static Sprite FoldSprite()
        {
            if (fold != null) return fold;
            const int w = 64;
            var tex = new Texture2D(w, 1, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
            for (var x = 0; x < w; x += 1)
            {
                var k = 1 - x / (w - 1f);
                tex.SetPixel(x, 0, new Color(0.3f, 0.18f, 0.08f, 0.55f * k * k));
            }
            tex.Apply();
            fold = Sprite.Create(tex, new UnityEngine.Rect(0, 0, w, 1), new Vector2(0.5f, 0.5f), 100);
            return fold;
        }
    }
}
