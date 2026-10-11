using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aether.Client.UI;
using Aether.Data;
using Aether.Net;
using LitMotion;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using CharacterInfo = Aether.Net.CharacterInfo;

namespace Aether.Client
{
    /// <summary>
    /// Màn vào game (uGUI + TextMeshPro): nền tranh lục địa PixelLab trôi chậm, băng-rôn "AETHER", thẻ đăng nhập / tạo tài khoản, chọn
    /// hoặc tạo nhân vật (1 nhân vật / tài khoản) bằng thẻ chân dung, chơi thử offline. Chữ theo màn đăng nhập web (AuthScreen.tsx).
    /// Xong thì bật GameController.
    /// </summary>
    public sealed class LoginScreen : MonoBehaviour
    {
        public const string DefaultServer = "https://admin.tail024813.ts.net/game";
        private const string PrefServer = "aether.server";
        private const string PrefUser = "aether.user";

        [SerializeField] private GameController game;
        [SerializeField] private GameDatabase database;

        private enum Step { Login, Register, Characters, Create }

        private Step step = Step.Login;
        private ApiClient api;
        private List<CharacterInfo> characters = new List<CharacterInfo>();
        private bool busy;
        private bool female;
        private bool showServer;
        private string error = "";

        private RectTransform root;
        private RectTransform card;
        private RectTransform bgArt;
        private TMP_InputField server;
        private TMP_InputField user;
        private TMP_InputField pass;
        private TMP_InputField pass2;
        private TMP_InputField charName;
        private TMP_Text errorText;
        private TMP_Text mainButtonText;

        private void Awake()
        {
            if (game != null) game.enabled = false;
            DisplaySettings.ApplySaved();
        }

        private void Start()
        {
            UiKit.LoadFonts();
            if (database != null) UiKit.Sprites = database.uiSets.Find(s => s != null && s.setId == "ui");
            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }
            var go = new GameObject("Login", typeof(RectTransform));
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 30;
            var scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            go.AddComponent<GraphicRaycaster>();
            root = (RectTransform)go.transform;
            BuildBackground();
            Rebuild();
            // Tự cập nhật: có bản mới thì tải + cài ngay (phủ màn đăng nhập), không thì không thấy gì.
            AutoUpdate.Begin(root, PlayerPrefs.GetString(PrefServer, DefaultServer));
        }

        private Sprite Ui(string id) => UiKit.Sprites != null ? UiKit.Sprites.Get(id) : null;

        /// <summary>Chân dung nam / nữ = khung đứng của nhân vật người chơi (khớp ngoại hình mới; chân dung PixelLab mới chưa vẽ).</summary>
        private Sprite Hero(bool f) => database != null ? GameController.PortraitOf(database.Character(f ? "player_hero_adult_f" : "player_hero_adult")) : null;

        private void BuildBackground()
        {
            UiKit.Panel(UiKit.Stretch(root, "Ink"), UiStyle.Hex(0x0b0907));
            bgArt = UiKit.Stretch(root, "Continent");
            var img = UiKit.Icon(bgArt, Ui("world-continent"));
            img.preserveAspect = false;
            var fit = bgArt.gameObject.AddComponent<AspectRatioFitter>();
            fit.aspectMode = AspectRatioFitter.AspectMode.EnvelopeParent;
            fit.aspectRatio = img.sprite != null ? img.sprite.rect.width / img.sprite.rect.height : 16f / 9;
            // Tranh trôi chậm qua lại (máy ảnh "thở") — sống động mà không làm rối mắt.
            LMotion.Create(1.04f, 1.12f, 18f).WithEase(Ease.InOutSine).WithLoops(-1, LoopType.Yoyo).Bind(v =>
            {
                if (bgArt != null) bgArt.localScale = Vector3.one * v;
            });
            var veil = UiKit.Stretch(root, "Veil");
            UiKit.Panel(veil, new Color(0.04f, 0.03f, 0.02f, 0.45f));
            var vign = UiKit.Stretch(root, "Vignette");
            vign.offsetMin = new Vector2(-60, -60);
            vign.offsetMax = new Vector2(60, 60);
            var vi = vign.gameObject.AddComponent<Image>();
            vi.sprite = UiStyle.Shadow();
            vi.type = Image.Type.Sliced;
            vi.color = new Color(1, 1, 1, 0);
            vi.raycastTarget = false;

            var banner = UiKit.Rect(root, "Title", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), new Vector2(0, -92), new Vector2(520, 116));
            UiKit.Sprite(banner, "banner", 1.1f);
            var t = UiKit.Label(UiKit.Stretch(banner, "t"), "AETHER", 46, UiStyle.InkBrown, TextAnchor.MiddleCenter, true, false);
            t.characterSpacing = 28;
            UiAnim.Appear(banner, 0.5f);
            var subBg = UiKit.Rect(root, "SubBg", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), new Vector2(0, -166), new Vector2(250, 30));
            UiStyle.Pill(subBg, new Color(0.08f, 0.05f, 0.03f, 0.7f), 15);
            var sub = UiKit.Label(UiKit.Stretch(subBg, "t"), "Biên niên sử Aether", 16, UiStyle.Parchment, TextAnchor.MiddleCenter, false);
            sub.fontStyle = FontStyles.Italic;
            sub.characterSpacing = 4;
            UiKit.Label(UiKit.Rect(root, "Ver", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-14, 10), new Vector2(300, 18)),
                $"Bản Unity · PC / Android · bản {AutoUpdate.LocalBuild}", 11, new Color(1, 1, 1, 0.45f), TextAnchor.MiddleRight);
        }

        // ———————————————————————————— ô nhập / nút ————————————————————————————

        private static TMP_InputField Field(RectTransform parent, string label, float y, string placeholder, bool password, string value = "")
        {
            UiKit.Label(UiKit.Rect(parent, label + "L", new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, y), new Vector2(380, 18)), label, 12, UiStyle.ParchmentDim, TextAnchor.MiddleLeft, true);
            var rt = UiKit.Rect(parent, label, new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, y - 20), new Vector2(372, 40));
            var bg = UiStyle.Pill(rt, UiStyle.Hex(0xfdf3dc), 10);
            bg.raycastTarget = true;
            var area = UiKit.Stretch(rt, "Area");
            area.offsetMin = new Vector2(14, 4);
            area.offsetMax = new Vector2(-14, -4);
            area.gameObject.AddComponent<RectMask2D>();
            var ph = UiKit.Label(UiKit.Stretch(area, "Placeholder"), placeholder, 15, UiStyle.Hex(0x9c8461), TextAnchor.MiddleLeft, false, false);
            ph.fontStyle = FontStyles.Italic;
            var tx = UiKit.Label(UiKit.Stretch(area, "Text"), "", 16, UiStyle.InkBrown, TextAnchor.MiddleLeft, false, false);
            tx.richText = false;
            var f = rt.gameObject.AddComponent<TMP_InputField>();
            f.textViewport = area;
            f.textComponent = tx;
            f.placeholder = ph;
            f.fontAsset = UiKit.Regular;
            f.pointSize = 16;
            f.customCaretColor = true;
            f.caretColor = UiStyle.InkBrown;
            f.caretWidth = 2;
            f.selectionColor = new Color(0.91f, 0.77f, 0.42f, 0.5f);
            if (password)
            {
                f.contentType = TMP_InputField.ContentType.Password;
                f.asteriskChar = '•';
            }
            f.text = value;
            return f;
        }

        private RectTransform Button(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, string label, Action click, bool primary = true)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, size);
            if (primary)
            {
                var img = UiKit.Sprite(rt, "button", 1.8f, true);
                img.color = Color.white;
            }
            else UiStyle.Pill(rt, new Color(1, 1, 1, 0.08f), Mathf.RoundToInt(size.y / 2)).raycastTarget = true;
            var t = UiKit.Label(UiKit.Stretch(rt, "t"), label, primary ? 18 : 13, primary ? UiStyle.GoldHi : UiStyle.Parchment, TextAnchor.MiddleCenter, true, true);
            if (primary) mainButtonText = t;
            UiKit.Press(rt, () =>
            {
                if (!busy) click();
            });
            return rt;
        }

        private RectTransform Tab(RectTransform parent, string label, float x, bool on, Action click)
        {
            var rt = UiKit.Rect(parent, label, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -14), new Vector2(180, 34));
            UiStyle.Pill(rt, on ? new Color(0.91f, 0.77f, 0.42f, 0.95f) : new Color(1, 1, 1, 0.06f), 17).raycastTarget = true;
            UiKit.Label(UiKit.Stretch(rt, "t"), label, 14, on ? UiStyle.InkBrown : UiStyle.ParchmentDim, TextAnchor.MiddleCenter, true, false);
            UiKit.Press(rt, () =>
            {
                if (busy || on) return;
                error = "";
                click();
            });
            return rt;
        }

        // ———————————————————————————— các bước ————————————————————————————

        private void Rebuild()
        {
            var keepUser = user != null ? user.text : PlayerPrefs.GetString(PrefUser, "");
            var keepServer = server != null ? server.text : PlayerPrefs.GetString(PrefServer, DefaultServer);
            if (card != null) Destroy(card.gameObject);
            var h = step == Step.Login ? 330 : step == Step.Register ? 400 : step == Step.Create ? 380 : 140 + Math.Max(1, characters.Count) * 76;
            if (showServer && (step == Step.Login || step == Step.Register)) h += 66;
            card = UiKit.Rect(root, "Card", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 1), new Vector2(0, 150), new Vector2(420, h));
            UiStyle.Card(card, UiStyle.CardKind.Hud, 18, true, true);
            errorText = null;
            switch (step)
            {
                case Step.Login:
                case Step.Register:
                    BuildAuth(keepUser, keepServer);
                    break;
                case Step.Characters:
                    BuildCharacters();
                    break;
                case Step.Create:
                    BuildCreate();
                    break;
            }
            ShowError();
            UiAnim.Appear(card, 0.25f);
        }

        private void BuildAuth(string keepUser, string keepServer)
        {
            var reg = step == Step.Register;
            Tab(card, "Đăng nhập", 24, !reg, () =>
            {
                step = Step.Login;
                Rebuild();
            });
            Tab(card, "Tạo tài khoản", 216, reg, () =>
            {
                step = Step.Register;
                Rebuild();
            });
            var y = -62f;
            user = Field(card, "Tên đăng nhập", y, "vd. hiepsi123", false, keepUser);
            y -= 70;
            pass = Field(card, "Mật khẩu", y, "••••••", true);
            y -= 70;
            if (reg)
            {
                pass2 = Field(card, "Nhập lại mật khẩu", y, "gõ lại cho chắc", true);
                y -= 70;
            }
            if (showServer)
            {
                server = Field(card, "Máy chủ", y, DefaultServer, false, keepServer);
                y -= 70;
            }
            else server = null;
            Button(card, "Go", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, y - 4), new Vector2(372, 48), reg ? "Tạo tài khoản" : "Vào thế giới", () => Run(() => Auth(reg)));
            errorText = UiKit.Label(UiKit.Rect(card, "Err", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, y - 58), new Vector2(372, 20)), "", 12, new Color(1f, 0.6f, 0.5f), TextAnchor.MiddleCenter, true);
            Button(card, "Server", new Vector2(0, 0), new Vector2(0, 0), new Vector2(18, 12), new Vector2(120, 26), showServer ? "‹ Ẩn máy chủ" : "Máy chủ ›", () =>
            {
                showServer = !showServer;
                Rebuild();
            }, false);
            Button(card, "Lab", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 12), new Vector2(120, 26), "Thử chiêu ›", PlayLab, false);
            Button(card, "Offline", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-18, 12), new Vector2(120, 26), "Chơi offline ›", PlayOffline, false);
            if (pass != null) pass.onSubmit.AddListener(_ => Run(() => Auth(reg)));
        }

        private void BuildCharacters()
        {
            UiKit.Label(UiKit.Rect(card, "H", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -16), new Vector2(380, 26)), "Chọn nhân vật", 18, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            for (var i = 0; i < characters.Count; i += 1)
            {
                var c = characters[i];
                var row = UiKit.Rect(card, "C" + i, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -54 - i * 76), new Vector2(372, 68));
                UiStyle.Card(row, UiStyle.CardKind.Chip, 12, false, true);
                var pf = UiKit.Rect(row, "F", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(6, 0), new Vector2(56, 56));
                UiKit.Sprite(pf, "slot", 3f);
                UiKit.Icon(UiKit.Rect(pf, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(46, 46)), Hero(c.Gender == "female"));
                UiKit.Label(UiKit.Rect(row, "N", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(74, 10), new Vector2(200, 24)), c.Name, 17, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
                var lv = c.Progress != null ? c.Progress.Level : 1;
                UiKit.Label(UiKit.Rect(row, "S", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(74, -12), new Vector2(220, 18)), $"Cấp {lv}  ·  {(c.Gender == "female" ? "Nữ" : "Nam")}", 12, UiStyle.ParchmentDim, TextAnchor.MiddleLeft);
                var pick = c;
                var go = UiKit.Rect(row, "Go", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-10, 0), new Vector2(92, 34));
                UiKit.Sprite(go, "button", 2.4f, true);
                UiKit.Label(UiKit.Stretch(go, "t"), "Vào", 15, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, true);
                UiKit.Press(go, () => Enter(pick));
            }
            Button(card, "Out", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 12), new Vector2(160, 26), "‹ Đăng xuất", () =>
            {
                step = Step.Login;
                Rebuild();
            }, false);
        }

        private void BuildCreate()
        {
            UiKit.Label(UiKit.Rect(card, "H", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -16), new Vector2(380, 26)), "Tạo nhân vật", 18, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Label(UiKit.Rect(card, "Note", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -42), new Vector2(380, 18)), "Mỗi tài khoản một nhân vật", 12, UiStyle.ParchmentDim, TextAnchor.MiddleCenter);
            for (var i = 0; i < 2; i += 1)
            {
                var isF = i == 1;
                var rt = UiKit.Rect(card, isF ? "Female" : "Male", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(isF ? 92 : -92, -70), new Vector2(164, 168));
                UiStyle.Card(rt, isF == female ? UiStyle.CardKind.Paper : UiStyle.CardKind.Chip, 14, false, true);
                UiKit.Icon(UiKit.Rect(rt, "P", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -8), new Vector2(124, 124)), Hero(isF));
                UiKit.Label(UiKit.Rect(rt, "L", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 8), new Vector2(150, 24)), isF ? "Nữ" : "Nam", 16, isF == female ? UiStyle.InkBrown : UiStyle.Parchment, TextAnchor.MiddleCenter, true, isF != female);
                UiKit.Press(rt, () =>
                {
                    var keep = charName != null ? charName.text : "";
                    female = isF;
                    Rebuild();
                    charName.text = keep;
                });
            }
            charName = Field(card, "Tên nhân vật", -250, "2–16 ký tự", false);
            Button(card, "Go", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 40), new Vector2(372, 46), "Tạo và vào thế giới", () => Run(CreateAsync));
            errorText = UiKit.Label(UiKit.Rect(card, "Err", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 14), new Vector2(372, 20)), "", 12, new Color(1f, 0.6f, 0.5f), TextAnchor.MiddleCenter, true);
        }

        private void ShowError()
        {
            if (errorText == null) return;
            errorText.text = error;
            if (!string.IsNullOrEmpty(error)) UiAnim.Shake(card, 8);
        }

        // ———————————————————————————— mạng ————————————————————————————

        private async void Run(Func<Task> work)
        {
            if (busy) return;
            busy = true;
            error = "";
            var label = mainButtonText != null ? mainButtonText.text : null;
            if (mainButtonText != null) mainButtonText.text = "Đang mở cổng…";
            try
            {
                await work();
            }
            catch (ApiException e)
            {
                error = e.Message;
            }
            catch (Exception e)
            {
                error = "Không kết nối được máy chủ: " + (e.InnerException?.Message ?? e.Message);
            }
            finally
            {
                busy = false;
                if (mainButtonText != null && label != null) mainButtonText.text = label;
                ShowError();
            }
        }

        private async Task Auth(bool register)
        {
            var u = user.text.Trim();
            if (u.Length == 0) throw new ApiException(0, "Bạn chưa gõ tên đăng nhập");
            if (pass.text.Length == 0) throw new ApiException(0, "Bạn chưa gõ mật khẩu");
            if (register && pass2 != null && pass2.text != pass.text) throw new ApiException(0, "Hai lần gõ mật khẩu chưa giống nhau");
            var url = (server != null && server.text.Trim().Length > 0 ? server.text : PlayerPrefs.GetString(PrefServer, DefaultServer)).Trim().TrimEnd('/');
            api?.Dispose();
            api = new ApiClient(url);
            var res = register ? await api.RegisterAsync(u, pass.text) : await api.LoginAsync(u, pass.text);
            api.Token = res.Token;
            PlayerPrefs.SetString(PrefServer, url);
            PlayerPrefs.SetString(PrefUser, u);
            PlayerPrefs.Save();
            characters = await api.GetCharactersAsync();
            step = characters.Count == 0 ? Step.Create : Step.Characters;
            Rebuild();
        }

        private async Task CreateAsync()
        {
            var name = charName.text.Trim();
            if (name.Length < 2) throw new ApiException(0, "Tên nhân vật cần ít nhất 2 ký tự");
            var c = await api.CreateCharacterAsync(name, female ? "female" : "male");
            Enter(c);
        }

        private void Enter(CharacterInfo c)
        {
            OnlineSession.Begin(api, c);
            StartGame();
        }

        private void PlayOffline()
        {
            OnlineSession.Current?.End();
            GameController.LabMode = false;
            StartGame();
        }

        /// <summary>Phòng Thử chiêu: như chơi offline nhưng mọi nhánh mốc 10, MP vô hạn, không chết (`GameController.Lab`).</summary>
        private void PlayLab()
        {
            OnlineSession.Current?.End();
            GameController.LabMode = true;
            StartGame();
        }

        private void StartGame()
        {
            if (root != null)
            {
                var g = UiKit.Group(root);
                LMotion.Create(1f, 0f, 0.35f).Bind(v =>
                {
                    if (g != null) g.alpha = v;
                });
                Destroy(root.gameObject, 0.4f);
            }
            if (game != null) game.enabled = true;
            enabled = false;
        }
    }
}
