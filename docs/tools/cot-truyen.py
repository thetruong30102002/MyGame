# Sinh docs/cot-truyen-haven.html + docs/cot-truyen-haven.md (cốt truyện 10 vùng × 7 map, bản chờ duyệt) — sửa dữ liệu ở
# docs/tools/cot_truyen_data.py rồi chạy:  python docs/tools/cot-truyen.py
# Tên vùng / map / boss phải trùng docs/tools/the-gioi-haven.py (script tự kiểm và báo tên lệch).
import html
import os
import re
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS)
sys.dont_write_bytecode = True
from cot_truyen_data import (ARCHITECT, CAST, CHAPTERS, DEATH_RULE, EPILOGUES, FLAGS, GODS, LOGLINE, REVIEW, THEME,  # noqa: E402
                             TWISTS)

DOCS = os.path.join(TOOLS, '..')
OUT = os.path.join(DOCS, 'cot-truyen-haven.html')
OUT_MD = os.path.join(DOCS, 'cot-truyen-haven.md')

# ---------------------------------------------------------------- kiểm tên với kế hoạch thế giới
WORLD = open(os.path.join(TOOLS, 'the-gioi-haven.py'), encoding='utf8').read()
missing = []
for ch in CHAPTERS:
    if f"name='{ch['region']}'" not in WORLD:
        missing.append(f"vùng {ch['region']}")
    for m, _, _ in ch['maps']:
        if f"('{m}'," not in WORLD:
            missing.append(f"map {m} (vùng {ch['n']})")
    for b, _ in ch['bosses']:
        dragon = re.match(r'(\S+ Long) (.+)$', b)  # rồng: ('Phong Long', 'Tuyệt Vân', …) ở bảng DRAGONS
        if dragon and f"('{dragon[1]}', '{dragon[2]}'," in WORLD:
            continue
        if f"'{b} · " not in WORLD and f"('{b}'," not in WORLD:
            missing.append(f"boss {b} (vùng {ch['n']})")
assert len(CHAPTERS) == 10 and all(len(ch['maps']) == 7 for ch in CHAPTERS), 'mỗi vùng đủ 7 map'
if missing:
    raise SystemExit('Tên lệch với the-gioi-haven.py: ' + '; '.join(missing))


def esc(s):
    return html.escape(str(s), quote=True)


def quote_marks(s):
    """Câu thoại trong ngoặc kép → in nghiêng nhẹ."""
    return re.sub(r'"([^"]+)"', lambda m: f'<q>{m.group(1)}</q>', esc(s).replace('&quot;', '"'))


def choice_table(c):
    title, rows = c
    body = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{quote_marks(g)}</td><td>{quote_marks(cost)}</td></tr>' for a, g, cost in rows)
    return f'''<div class="choice"><h4>Lựa chọn: {esc(title)}</h4><div class="table-wrap"><table>
      <thead><tr><th>Chọn</th><th>Được</th><th>Mất</th></tr></thead><tbody>{body}</tbody></table></div></div>'''


def chapter_html(ch):
    maps = ''.join(f'<li><b>{esc(m)}</b><p>{quote_marks(t)}</p><p class="goal"><span>Chơi</span>{quote_marks(q)}</p></li>' for m, t, q in ch['maps'])
    bosses = ''.join(f'<li><span class="boss">{esc(b)}</span> {quote_marks(t)}</li>' for b, t in ch['bosses'])
    services = ''.join(f'<li><b>{esc(n)}</b> · {esc(r)}</li>' for n, r in ch['services'])
    side = ''.join(f'<li><b>{esc(n)}</b> <span class="role">({esc(g)})</span><p>{quote_marks(t)}</p></li>' for n, g, t in ch['side'])
    dragon = f'<span class="tag dragon">Rồng: {esc(ch["dragon"])}</span>' if ch.get('dragon') else ''
    choices = choice_table(ch['choice']) + (choice_table(ch['choice2']) if ch.get('choice2') else '')
    return f'''
<section class="chapter" id="chuong-{ch["n"]}">
  <header>
    <span class="eyebrow">Chương {ch["n"]} · Vùng {ch["n"]} · {esc(ch["region"])}</span>
    <h3>{esc(ch["title"])}</h3>
    <div class="tags"><span class="tag">{esc(ch["mood"])}</span>{dragon}</div>
  </header>
  <p class="opening">{quote_marks(ch["opening"])}</p>
  <p class="core">{quote_marks(ch["core"])}</p>
  <div class="split">
    <div>
      <h4>Theo từng map (thứ tự đi)</h4>
      <ol class="maps">{maps}</ol>
    </div>
    <div class="side">
      <div><h4>Boss và chuyện của boss</h4><ul class="bosses">{bosses}</ul></div>
      {choices}
      <div><h4>Nhiệm vụ phụ</h4><ul class="sides">{side}</ul></div>
      <div class="services"><h4>NPC dịch vụ ở trạm <span class="safe">không bao giờ chết</span></h4><ul>{services}</ul></div>
    </div>
  </div>
  <div class="camp"><span>Lửa trại</span><p>{quote_marks(ch["camp"])}</p></div>
  <div class="ending"><span>Kết chương</span><p>{quote_marks(ch["ending"])}</p></div>
  <p class="letter"><span>Thư nhà</span> {quote_marks(ch["letter"])}</p>
</section>'''


toc = ''.join(f'<a href="#chuong-{c["n"]}"><span class="num">{c["n"]}</span>{esc(c["title"])}</a>' for c in CHAPTERS)
theme_html = ''.join(f'<div><dt>{esc(a)}</dt><dd>{quote_marks(b)}</dd></div>' for a, b in THEME)
cast_html = ''.join(
    f'<article class="person"><h4>{esc(n)}</h4><span class="role">{esc(r)}</span><p>{quote_marks(s)}</p>'
    f'<p class="fate">{esc(f)}</p><p class="mortal"><span>Có thể chết?</span> {esc(d)}</p></article>' for n, r, s, f, d in CAST)
death_html = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{esc(b)}</td></tr>' for a, b in DEATH_RULE)
creed_html = ''.join(f'<li>{quote_marks(c)}</li>' for c in ARCHITECT['creed'])
vs_html = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{quote_marks(b)}</td><td>{quote_marks(c)}</td></tr>' for a, b, c in ARCHITECT['vs'])
trail_html = ''.join(f'<li><a href="#chuong-{n}">Chương {n}</a><span>{quote_marks(t)}</span></li>' for n, t in ARCHITECT['trail'])
twist_html = ''.join(f'<li><a href="#chuong-{n}">Chương {n}</a><span>{quote_marks(t)}</span></li>' for n, t in TWISTS)
flags_html = ''.join(f'<tr><td><code>{esc(k)}</code><div class="role">{esc(n)}</div></td><td>{esc(s)}</td><td>{esc(u)}</td></tr>' for k, n, s, u in FLAGS)
epi_html = ''.join(f'<div><dt>{esc(a)}</dt><dd>{quote_marks(b)}</dd></div>' for a, b in EPILOGUES)
gods_html = ''.join(
    f'<tr><th scope="row">{esc(g)}<br><small>{esc(r)}</small></th><td>{quote_marks(look)}</td><td>{quote_marks(bound)}</td><td>{quote_marks(pact)}</td>'
    f'<td>{quote_marks(skill)}</td></tr>' for r, g, look, bound, pact, skill, _temp in GODS)
review_html = ''.join(f'<li>{quote_marks(q)}</li>' for q in REVIEW)
chapters_html = ''.join(chapter_html(c) for c in CHAPTERS)

page = f'''<title>Biên Niên Bảy Mối</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,600;0,700;0,800;1,500&family=Nunito:wght@500;600;700;800&display=swap">
<style>
/* Bố cục: sổ cốt truyện một cột (mục lục dính trái trên màn rộng); giấy da + mực đỏ son cho cú lật, cùng bộ màu với trang Thế giới Haven. */
:root {{
  --paper: #f5e3c0; --paper-hi: #fcf2dc; --paper-sunk: #e9cf9f; --line: #c9a578;
  --ink: #34200f; --ink-soft: #6b4a2b; --wood: #4a2e1c; --gold: #a8740e; --blood: #9a2b1f; --sea: #1f5a7a; --leaf: #2f6b34;
  --display: 'Alegreya', Georgia, serif; --body: 'Nunito', system-ui, sans-serif;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --paper: #1f150d; --paper-hi: #2a1d13; --paper-sunk: #170f09; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d2b88a; --wood: #f0dfb8; --gold: #ffcf66; --blood: #ff9d8c; --sea: #9fd3ff; --leaf: #8fd39a; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --paper: #1f150d; --paper-hi: #2a1d13; --paper-sunk: #170f09; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d2b88a; --wood: #f0dfb8; --gold: #ffcf66; --blood: #ff9d8c; --sea: #9fd3ff; --leaf: #8fd39a; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--paper); color: var(--ink); font-family: var(--body); font-size: 15.5px; line-height: 1.65; }}
.wrap {{ max-width: 1200px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 72px; display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 36px; }}
@media (max-width: 880px) {{ .wrap {{ grid-template-columns: minmax(0, 1fr); }} nav.toc {{ position: static !important; max-height: none !important; }} }}
nav.toc {{ position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); align-self: start; display: flex; flex-direction: column; gap: 2px; font-size: 14px; max-height: calc(100vh - 32px); overflow-y: auto; }}
nav.toc .label {{ font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); font-weight: 800; margin: 10px 0 4px; }}
nav.toc a {{ color: var(--ink); text-decoration: none; padding: 3px 8px; border-radius: 6px; display: flex; gap: 8px; }}
nav.toc a:hover, nav.toc a:focus-visible {{ background: var(--paper-sunk); outline: none; }}
nav.toc .num {{ color: var(--blood); font-weight: 800; min-width: 1.4em; font-variant-numeric: tabular-nums; }}
main {{ min-width: 0; display: flex; flex-direction: column; gap: 48px; }}
h1, h2, h3, h4 {{ font-family: var(--display); text-wrap: balance; margin: 0; line-height: 1.2; }}
h1 {{ font-size: clamp(32px, 5.4vw, 52px); font-weight: 800; }}
h2 {{ font-size: 27px; font-weight: 800; border-bottom: 2px solid var(--line); padding-bottom: 6px; margin-bottom: 16px; }}
h3 {{ font-size: clamp(24px, 3.4vw, 32px); font-weight: 800; }}
h4 {{ font-size: 18px; font-weight: 700; margin-bottom: 8px; }}
p {{ margin: 0; }}
q {{ font-family: var(--display); font-style: italic; font-weight: 500; quotes: "“" "”"; }}
.lead {{ font-family: var(--display); font-size: clamp(18px, 2.3vw, 22px); line-height: 1.5; max-width: 62ch; margin-top: 12px; }}
.status {{ display: inline-block; margin-top: 16px; font-size: 13px; font-weight: 800; color: var(--blood); background: var(--paper-hi); border: 1px solid var(--line); padding: 3px 12px; border-radius: 999px; }}
dl.theme, dl.epi {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px 24px; margin: 22px 0 0; }}
dl.theme dt, dl.epi dt {{ font-size: 12px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--gold); }}
dl.theme dd, dl.epi dd {{ margin: 2px 0 0; }}
.cast {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }}
.person {{ background: var(--paper-hi); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }}
.person .role {{ font-size: 12px; font-weight: 800; color: var(--ink-soft); letter-spacing: .04em; }}
.person .fate {{ margin-top: auto; padding-top: 6px; border-top: 1px dashed var(--line); font-size: 13px; font-weight: 700; color: var(--blood); }}
.person .mortal {{ font-size: 12.5px; color: var(--ink-soft); }}
.person .mortal span {{ font-weight: 800; }}
.chapter {{ display: flex; flex-direction: column; gap: 16px; scroll-margin-top: 16px; }}
.chapter header {{ display: flex; flex-direction: column; gap: 6px; }}
.eyebrow {{ font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }}
.tags {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.tag {{ font-size: 12px; font-weight: 800; padding: 1px 10px; border-radius: 999px; background: var(--paper-sunk); color: var(--ink-soft); }}
.tag.dragon {{ color: var(--sea); }}
.opening {{ font-family: var(--display); font-style: italic; font-size: 18px; line-height: 1.55; max-width: 66ch; color: var(--ink-soft); }}
.core {{ font-size: 16.5px; max-width: 72ch; }}
.split {{ display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 28px; }}
@media (max-width: 1040px) {{ .split {{ grid-template-columns: minmax(0, 1fr); }} }}
ol.maps {{ margin: 0; padding-left: 26px; display: flex; flex-direction: column; gap: 12px; }}
ol.maps li::marker {{ font-family: var(--display); font-weight: 800; color: var(--gold); }}
ol.maps b {{ font-family: var(--display); font-size: 16.5px; }}
.goal {{ font-size: 13.5px; color: var(--ink-soft); margin-top: 3px; }}
.goal span {{ font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--leaf); margin-right: 6px; }}
.side {{ display: flex; flex-direction: column; gap: 18px; min-width: 0; }}
ul.bosses, ul.sides, .services ul {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }}
.boss {{ font-weight: 800; color: var(--blood); }}
.services {{ background: var(--paper-hi); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-size: 14px; }}
.services ul {{ gap: 4px; }}
.safe {{ font-family: var(--body); font-size: 11px; font-weight: 800; color: var(--leaf); letter-spacing: .04em; margin-left: 4px; }}
.choice h4 {{ font-size: 16px; }}
.table-wrap {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 7px 9px; border-bottom: 1px solid var(--line); }}
thead th {{ font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }}
tbody th {{ font-weight: 800; min-width: 7em; }}
.camp, .ending {{ border-radius: 0 10px 10px 0; padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }}
.camp {{ border-left: 4px solid var(--gold); background: var(--paper-sunk); }}
.ending {{ background: var(--paper-hi); border-left: 4px solid var(--blood); }}
.camp span, .ending span, .letter span {{ font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }}
.camp span {{ color: var(--gold); }}
.ending span {{ color: var(--blood); }}
.camp p {{ font-size: 16px; }}
.ending p {{ font-family: var(--display); font-size: 17.5px; line-height: 1.5; }}
.letter {{ font-size: 14.5px; color: var(--ink-soft); max-width: 72ch; }}
.letter span {{ color: var(--sea); margin-right: 4px; }}
ol.twists {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }}
ol.twists li {{ display: grid; grid-template-columns: 6.5em minmax(0, 1fr); gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line); }}
ol.twists a {{ color: var(--blood); font-weight: 800; text-decoration: none; font-variant-numeric: tabular-nums; }}
.role {{ color: var(--ink-soft); font-size: 12px; }}
code {{ font-size: 13px; }}
ol.review, ul.creed {{ padding-left: 22px; margin: 0; display: flex; flex-direction: column; gap: 8px; }}
.chapters {{ display: flex; flex-direction: column; gap: 64px; }}
.two {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 18px; }}
.two > div {{ min-width: 0; }}
</style>

<div class="wrap">
  <nav class="toc" aria-label="Mục lục">
    <span class="label">Tổng quan</span>
    <a href="#tom-tat">Cả truyện</a>
    <a href="#nhan-vat">Nhân vật và bí mật</a>
    <a href="#song-chet">Ai được chết</a>
    <a href="#kien-truc-su">Kẻ từ thế giới cũ</a>
    <span class="label">10 chương · 10 vùng</span>
    {toc}
    <span class="label">Thêm</span>
    <a href="#ket">Phần kết từng người</a>
    <a href="#cu-lat">Những cú lật</a>
    <a href="#co">Cờ lựa chọn</a>
    <a href="#duyet">Cần duyệt</a>
  </nav>
  <main>
    <section id="tom-tat">
      <h1>Biên Niên Bảy Mối</h1>
      <p class="lead">{quote_marks(LOGLINE)}</p>
      <span class="status">Bản nháp 2 chờ chủ dự án duyệt · 08/10/2026</span>
      <dl class="theme">{theme_html}</dl>
    </section>

    <section id="nhan-vat">
      <h2>Nhân vật và điều họ giấu</h2>
      <div class="cast">{cast_html}</div>
    </section>

    <section id="song-chet">
      <h2>Ai được chết, ai không</h2>
      <p style="max-width:72ch">NPC chết là mất hẳn khỏi game. Vì vậy mọi NPC có bán hàng, nâng cấp hay dịch vụ không bao giờ chết; chỉ nhân vật không làm dịch vụ mới có thể hy sinh.</p>
      <div class="table-wrap" style="margin-top:12px"><table><tbody>{death_html}</tbody></table></div>
    </section>

    <section id="kien-truc-su">
      <h2>Kẻ từ thế giới cũ: Kiến Trúc Sư</h2>
      <p style="max-width:72ch">{quote_marks(ARCHITECT["intro"])}</p>
      <div class="two">
        <div><h4>Hắn tin rằng</h4><ul class="creed">{creed_html}</ul></div>
        <div><h4>Cấu kết với Ma vương</h4><p>{quote_marks(ARCHITECT["pact"])}</p></div>
      </div>
      <h4 style="margin-top:20px">Cùng xuất phát, ngược lý tưởng</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>Điểm</th><th>Lior</th><th>Kiến Trúc Sư</th></tr></thead>
        <tbody>{vs_html}</tbody>
      </table></div>
      <h4 style="margin-top:20px">Dấu vết của hắn qua từng chương</h4>
      <ol class="twists">{trail_html}</ol>
    </section>

    <section id="muoi-vi-than">
      <h2>Mười vị thần đất</h2>
      <p style="max-width:72ch">Mỗi vùng một vị thần bị Giao Ước Bảy Mối trói. Thần không chỉ đường: chỉ tỉnh khi boss chúa của vùng gục, và thứ thần trao là một giao kèo có giá. Thần kỹ để bán sau — thần phải được vẽ thật đẹp.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Thần · vùng</th><th>Hình dạng (để vẽ)</th><th>Bị trói thế nào</th><th>Giao kèo · cái giá</th><th>Thần kỹ</th></tr></thead>
        <tbody>{gods_html}</tbody>
      </table></div>
    </section>

    <section>
      <h2>10 chương theo 10 vùng</h2>
      <div class="chapters">{chapters_html}</div>
    </section>

    <section id="ket">
      <h2>Phần kết của từng người</h2>
      <dl class="epi">{epi_html}</dl>
    </section>

    <section id="cu-lat">
      <h2>Những cú lật</h2>
      <ol class="twists">{twist_html}</ol>
    </section>

    <section id="co">
      <h2>Cờ lựa chọn</h2>
      <p style="max-width:72ch">Không có thanh thiện cảm chung. Game ghi từng quyết định thành cờ riêng; đoạn sau đọc cờ để đổi thoại, ai có mặt và kết cục.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Cờ</th><th>Đặt ở</th><th>Đổi điều gì về sau</th></tr></thead>
        <tbody>{flags_html}</tbody>
      </table></div>
    </section>

    <section id="duyet">
      <h2>Cần duyệt</h2>
      <ol class="review">{review_html}</ol>
    </section>
  </main>
</div>
'''
open(OUT, 'w', encoding='utf8', newline='').write(page)

# ---------------------------------------------------------------- bản Markdown (cho agent làm tiếp)
md = ['# Biên Niên Bảy Mối — cốt truyện 10 vùng × 7 map (BẢN NHÁP 2 chờ duyệt)\n',
      '> FILE SINH TỰ ĐỘNG từ `docs/tools/cot-truyen.py` + dữ liệu `docs/tools/cot_truyen_data.py` (cùng trang `docs/cot-truyen-haven.html`)',
      '> — sửa dữ liệu rồi chạy lại. Soạn 08/10/2026 theo yêu cầu chủ dự án: "cốt truyện thật nhiều drama, hay, vào theo các map";',
      '> bản 2: NPC dịch vụ không bao giờ chết, Ma vương là người bản địa cấu kết với kẻ từ thế giới cũ, dài thêm ~80%. Tên vùng / map /',
      '> boss khớp `docs/the-gioi-haven.md` (script tự kiểm). Nền giữ từ `docs/story.md` + `docs/story-arc.md`; khi được duyệt, mạch này',
      '> thay phần Chương 2–7 (7 lục địa) của story-arc.\n',
      LOGLINE + '\n']
for a, b in THEME:
    md.append(f'- **{a}:** {b}')
md.append('\n## Nhân vật và điều họ giấu\n')
md.append('| Nhân vật | Vai | Điều họ giấu / vết nứt | Số phận | Có thể chết? |\n|---|---|---|---|---|')
for n, r, s, f, d in CAST:
    md.append(f'| {n} | {r} | {s} | {f} | {d} |')
md.append('\n## Ai được chết, ai không\n')
md.append('NPC chết là mất hẳn khỏi game → NPC có bán hàng / nâng cấp / dịch vụ KHÔNG BAO GIỜ chết.\n')
for a, b in DEATH_RULE:
    md.append(f'- **{a}:** {b}')
md.append('\n## Kẻ từ thế giới cũ: Kiến Trúc Sư\n')
md.append(ARCHITECT['intro'] + '\n')
md.append('**Hắn tin rằng:**\n')
for c in ARCHITECT['creed']:
    md.append(f'- {c}')
md.append('\n**Cấu kết với Ma vương:** ' + ARCHITECT['pact'] + '\n')
md.append('| Điểm | Lior | Kiến Trúc Sư |\n|---|---|---|')
for a, b, c in ARCHITECT['vs']:
    md.append(f'| {a} | {b} | {c} |')
md.append('\n**Dấu vết qua từng chương:**\n')
for n, t in ARCHITECT['trail']:
    md.append(f'- Chương {n}: {t}')
md.append('\n## Mười vị thần đất\n')
md.append('Mỗi vùng một vị thần bị Giao Ước Bảy Mối trói. Thần KHÔNG chỉ đường: chỉ tỉnh khi boss chúa của vùng gục, thứ thần trao là '
          'giao kèo có giá. Thần kỹ để bán sau — thần phải được vẽ thật đẹp (kế hoạch vẽ: `docs/pixellab-ke-hoach-ve.md` mục "Mười vị thần").\n')
md.append('| Vùng | Thần | Hình dạng (để vẽ) | Bị trói thế nào | Giao kèo · cái giá | Thần kỹ (bán sau) | Hình tạm trong game |\n|---|---|---|---|---|---|---|')
for r, g, look, bound, pact, skill, temp in GODS:
    md.append(f'| {r} | **{g}** | {look} | {bound} | {pact} | {skill} | {temp} |')
for ch in CHAPTERS:
    md.append(f"\n## Chương {ch['n']} — {ch['title']} (vùng {ch['n']}: {ch['region']})\n")
    md.append(f"*{ch['mood']}*" + (f" · rồng: **{ch['dragon']}**" if ch.get('dragon') else '') + '\n')
    md.append(f"> {ch['opening']}\n")
    md.append(ch['core'] + '\n')
    md.append('**Theo từng map:**\n')
    for i, (m, t, q) in enumerate(ch['maps'], 1):
        md.append(f'{i}. **{m}** — {t}')
        md.append(f'   - *Chơi:* {q}')
    md.append('\n**Boss:**\n')
    for b, t in ch['bosses']:
        md.append(f'- **{b}** — {t}')
    for c in (ch['choice'], ch.get('choice2')):
        if not c:
            continue
        md.append(f'\n**Lựa chọn: {c[0]}**\n')
        md.append('| Chọn | Được | Mất |\n|---|---|---|')
        for a, g, cost in c[1]:
            md.append(f'| {a} | {g} | {cost} |')
    md.append('\n**Nhiệm vụ phụ:**\n')
    for n, g, t in ch['side']:
        md.append(f'- **{n}** ({g}) — {t}')
    md.append('\n**NPC dịch vụ ở trạm (không bao giờ chết):** ' + '; '.join(f'{n} ({r})' for n, r in ch['services']) + '\n')
    md.append(f"**Lửa trại:** {ch['camp']}\n")
    md.append(f"**Kết chương:** {ch['ending']}\n")
    md.append(f"**Thư nhà:** {ch['letter']}")
md.append('\n## Phần kết của từng người\n')
for a, b in EPILOGUES:
    md.append(f'- **{a}:** {b}')
md.append('\n## Những cú lật\n')
for n, t in TWISTS:
    md.append(f'- Chương {n}: {t}')
md.append('\n## Cờ lựa chọn (không dùng thanh thiện cảm chung)\n')
md.append('| Cờ | Ý nghĩa | Đặt ở | Đổi điều gì |\n|---|---|---|---|')
for k, n, s, u in FLAGS:
    md.append(f'| `{k}` | {n} | {s} | {u} |')
md.append('\n## Cần duyệt\n')
for i, q in enumerate(REVIEW, 1):
    md.append(f'{i}. {q}')
md.append('')
open(OUT_MD, 'w', encoding='utf8', newline='').write('\n'.join(md))
print('ok', len(CHAPTERS), 'chương', sum(len(c['maps']) for c in CHAPTERS), 'map')
