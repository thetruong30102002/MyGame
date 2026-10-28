using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using HavenLord.Client.UI;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using Debug = UnityEngine.Debug;

namespace HavenLord.Client
{
    /// <summary>
    /// Tự cập nhật (chủ dự án 11/10/2026: "client tự động cập nhật mà không cần tải tay xuống"). Mở game là hỏi máy chủ
    /// `/api/client/version` (apps/server/src/clientUpdate.ts); bản của nền tảng này mới hơn thì TỰ tải về (thanh tiến trình), kiểm cỡ +
    /// SHA-256, rồi chạy bộ cài (Windows: đợi game thoát rồi bung đè IM LẶNG đúng thư mục đang cài và tự mở lại) — người
    /// chơi không bấm gì. Android: hệ điều hành bắt người dùng tự bấm Cài, nên mở link tải APK. Máy chủ không trả lời / tải hỏng thì vào
    /// game như thường, trừ khi bản đang chạy dưới `minBuild` (đổi luật không tương thích) — khi đó chặn và cho thử lại.
    /// Bỏ qua trong Editor, khi chạy AutoTest (`-havenShot`) hoặc có `-noUpdate`.
    /// </summary>
    public sealed class AutoUpdate : MonoBehaviour
    {
        /// <summary>Đang kiểm / tải — màn đăng nhập chưa cho bấm.</summary>
        public static bool Busy { get; private set; }

        /// <summary>Số bản đang chạy = phần cuối `Application.version` (GameSetup đặt `1.0.&lt;số bản&gt;`); 0 = bản chưa đánh số.</summary>
        public static int LocalBuild
        {
            get
            {
                var v = Application.version ?? "";
                var i = v.LastIndexOf('.');
                return i >= 0 && int.TryParse(v.Substring(i + 1), out var n) ? n : 0;
            }
        }

        private string server;
        private RectTransform overlay;
        private TMP_Text title;
        private TMP_Text status;
        private RectTransform barFill;

        public static void Begin(RectTransform root, string serverUrl)
        {
            if (Application.isEditor || LocalBuild == 0) return;
            var args = Environment.GetCommandLineArgs();
            if (Array.IndexOf(args, "-havenNativeUpdateTest") >= 0 || Array.IndexOf(args, "-havenShot") >= 0) return;
            RegisterApp();
            if (Array.IndexOf(args, "-noUpdate") >= 0) return;
            if (Application.platform != RuntimePlatform.WindowsPlayer && Application.platform != RuntimePlatform.Android) return;
            var u = root.gameObject.AddComponent<AutoUpdate>();
            // `-updateServer <url>`: hỏi máy chủ khác (thử trọn vòng cập nhật trên máy chủ THỬ mà không đổi máy chủ đã lưu).
            var i = Array.IndexOf(args, "-updateServer");
            if (i >= 0 && i + 1 < args.Length) serverUrl = args[i + 1];
            u.server = (serverUrl ?? "").Trim().TrimEnd('/');
            u.StartCoroutine(u.Run(root));
        }

        private IEnumerator Run(RectTransform root)
        {
            Busy = true;
            JObject info = null;
            var ask = Task.Run(async () =>
            {
                using (var http = new HttpClient { Timeout = TimeSpan.FromSeconds(6) })
                {
                    var res = await http.GetAsync(server + "/api/client/version").ConfigureAwait(false);
                    return res.IsSuccessStatusCode ? await res.Content.ReadAsStringAsync().ConfigureAwait(false) : null;
                }
            });
            while (!ask.IsCompleted) yield return null;
            if (ask.Status == TaskStatus.RanToCompletion && ask.Result != null)
            {
                try
                {
                    info = JObject.Parse(ask.Result);
                }
                catch (Exception e)
                {
                    Debug.LogWarning("[HavenLord update] version.json hỏng: " + e.Message);
                }
            }
            var platform = Application.platform == RuntimePlatform.Android ? "android" : "windows";
            var entry = info?[platform] as JObject;
            var remote = (int?)entry?["build"] ?? 0;
            var minBuild = (int?)info?["minBuild"] ?? 0;
            if (entry == null || remote <= LocalBuild)
            {
                Busy = false;
                yield break;
            }
            var mustUpdate = LocalBuild < minBuild;
            BuildOverlay(root, (string)info["version"] ?? remote.ToString(), (string)info["notes"]);

            if (platform == "android")
            {
                status.text = "Đang mở link tải bản mới — tải xong bấm Cài đặt.";
                Application.OpenURL(server + "/api/client/latest/android");
                if (!mustUpdate) yield return Finish(4f);
                yield break;
            }

            // Bản có gói zip (từ 12/10/2026) thì tải zip rồi TỰ giải nén: bộ cài exe WinRAR SFX chưa ký số bị Windows Defender chặn
            // ngay khi tải xong (Win32 IO 225 = file bị coi là virus), còn zip thì Defender không chặn. Bản cũ chỉ có exe → đường cũ.
            var zip = entry["zip"] as JObject;
            var src = zip ?? entry;
            var file = (string)src["file"];
            var size = (long?)src["size"] ?? 0;
            var sha = ((string)src["sha256"] ?? "").ToLowerInvariant();
            var path = Path.Combine(Path.GetTempPath(), zip != null ? $"HavenLord-update-{remote}.zip" : $"HavenLord-update-{remote}.exe");
            var stage = Path.Combine(Path.GetTempPath(), $"HavenLord-stage-{remote}");
            string error = null;
            got = 0;
            var url = server + "/api/client/file/" + Uri.EscapeDataString(file ?? "");
            var dl = Task.Run(() => Download(url, path));
            while (!dl.IsCompleted)
            {
                var g = System.Threading.Interlocked.Read(ref got);
                SetProgress(size > 0 ? Mathf.Clamp01(g / (float)size) : 0, $"Đang tải bản mới… {g / 1048576f:0} / {size / 1048576f:0} MB");
                yield return null;
            }
            if (dl.Status != TaskStatus.RanToCompletion) error = "Tải bản mới lỗi: " + (dl.Exception?.GetBaseException().Message ?? "không rõ");
            if (error == null)
            {
                SetProgress(1, "Đang kiểm tra file…");
                var check = Task.Run(() => Verify(path, size, sha));
                while (!check.IsCompleted) yield return null;
                error = check.Result;
            }
            if (error == null && zip != null)
            {
                SetProgress(1, "Đang giải nén bản mới…");
                var unzip = Task.Run(() => Extract(path, stage));
                while (!unzip.IsCompleted) yield return null;
                error = unzip.Result;
                TryDelete(path);
            }
            if (error != null)
            {
                Debug.LogWarning("[HavenLord update] " + error);
                TryDelete(path);
                TryDeleteDir(stage);
                if (mustUpdate)
                {
                    status.text = error + "\nBản này quá cũ để vào game — kiểm tra mạng rồi thử lại.";
                    Retry(root);
                }
                else
                {
                    status.text = error + " — vào game bằng bản hiện tại.";
                    yield return Finish(3f);
                }
                yield break;
            }
            SetProgress(1, "Đang cài bản mới — game sẽ tự mở lại…");
            yield return new WaitForSeconds(0.6f);
            string why;
            var started = zip != null ? StartCopier(stage, InstallDir, out why) : StartInstaller(path, InstallDir, out why);
            if (!started)
            {
                status.text = "Không chạy được bộ cài: " + why;
                yield return Finish(3f);
                yield break;
            }
            Application.Quit();
        }

        private long got;

        /// <summary>Tải về file tạm (luồng nền), đếm byte vào <see cref="got"/> cho thanh tiến trình.</summary>
        private async Task Download(string url, string path)
        {
            using (var http = new HttpClient { Timeout = TimeSpan.FromMinutes(30) })
            using (var res = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false))
            {
                res.EnsureSuccessStatusCode();
                using (var src = await res.Content.ReadAsStreamAsync().ConfigureAwait(false))
                using (var dst = File.Create(path))
                {
                    var buf = new byte[1 << 16];
                    int n;
                    while ((n = await src.ReadAsync(buf, 0, buf.Length).ConfigureAwait(false)) > 0)
                    {
                        await dst.WriteAsync(buf, 0, n).ConfigureAwait(false);
                        System.Threading.Interlocked.Add(ref got, n);
                    }
                }
            }
        }

        /// <summary>Thư mục game đang chạy (người chơi chọn lúc cài) — bộ cài bung đè đúng chỗ này.</summary>
        private static string InstallDir => Path.GetDirectoryName(Application.dataPath);

        /// <summary>
        /// Chạy bộ cài ở chế độ im lặng (`-s2` = hiện tiến trình, bỏ hộp chọn thư mục) bung đè <paramref name="dir"/>. Phải đợi game thoát
        /// hẳn (file đang chạy bị khoá) — `ping` 3 nhịp ≈ 2 giây rồi mới chạy, qua `cmd` ẩn để tiến trình con sống tiếp khi game đã thoát.
        /// Thư mục cần quyền quản trị (cài vào Program Files) thì chạy qua PowerShell `-Verb RunAs` — Windows hỏi UAC.
        /// </summary>
        private static bool StartInstaller(string path, string dir, out string why)
        {
            why = null;
            try
            {
                if (CanWrite(dir))
                {
                    using (WindowsNative.LaunchCommand($"ping -n 3 127.0.0.1 >nul & start \"\" \"{path}\" -s2 \"-d{dir}\"")) { }
                }
                else
                {
                    // -EncodedCommand (UTF-16LE base64): không lo dấu nháy lồng nhau khi đường dẫn có khoảng trắng.
                    var ps = $"Start-Sleep -Seconds 2; Start-Process -FilePath '{path.Replace("'", "''")}' -ArgumentList @('-s2', '\"-d{dir.Replace("'", "''")}\"') -Verb RunAs";
                    var enc = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(ps));
                    using (WindowsNative.LaunchHidden(WindowsNative.PowerShell, $"-NoProfile -WindowStyle Hidden -EncodedCommand {enc}")) { }
                }
                return true;
            }
            catch (Exception e)
            {
                why = e.Message;
                return false;
            }
        }

        /// <summary>
        /// Bản đã CÀI (có Uninstall.cmd cạnh game — bộ cài đặt vào): ghi mục "Haven Lord" vào Settings → Apps của Windows (HKCU,
        /// không cần quyền quản trị) để gỡ được như game thường. Ghi lại mỗi bản mới (số bản, thư mục có thể đổi).
        /// </summary>
        private static void RegisterApp()
        {
            if (Application.platform != RuntimePlatform.WindowsPlayer) return;
            var dir = InstallDir;
            var uninstall = Path.Combine(dir, "Uninstall.cmd");
            if (!File.Exists(uninstall) || PlayerPrefs.GetString("havenlord.appRegistered", "") == $"{LocalBuild}|{dir}") return;
            try
            {
                long kb = 0;
                foreach (var f in new DirectoryInfo(dir).GetFiles("*", SearchOption.AllDirectories)) kb += f.Length / 1024;
                WindowsNative.SetCurrentUserValues(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\HavenLord",
                    new Dictionary<string, string>
                    {
                        ["DisplayName"] = "Haven Lord", ["DisplayVersion"] = Application.version, ["Publisher"] = "Haven Lord",
                        ["InstallLocation"] = dir, ["DisplayIcon"] = Path.Combine(dir, "HavenLord.exe"), ["UninstallString"] = "\"" + uninstall + "\"",
                    },
                    new Dictionary<string, uint> { ["NoModify"] = 1, ["NoRepair"] = 1, ["EstimatedSize"] = (uint)Math.Min(kb, int.MaxValue) });
                PlayerPrefs.SetString("havenlord.appRegistered", $"{LocalBuild}|{dir}");
            }
            catch (Exception e)
            {
                Debug.LogWarning("[HavenLord update] Không ghi được mục Apps: " + e.Message);
            }
        }

        /// <summary>Giải nén gói zip vào thư mục tạm <paramref name="stage"/>; null = xong, còn lại là lý do.</summary>
        private static string Extract(string zipPath, string stage)
        {
            try
            {
                TryDeleteDir(stage);
                ZipFile.ExtractToDirectory(zipPath, stage);
                return File.Exists(Path.Combine(stage, "HavenLord.exe")) ? null : "Gói cập nhật thiếu HavenLord.exe";
            }
            catch (Exception e)
            {
                return "Không giải nén được bản mới: " + e.Message;
            }
        }

        /// <summary>
        /// Chép bản đã giải nén đè lên <paramref name="dir"/> rồi mở lại game, qua một file .cmd chạy nền (game phải thoát hẳn trước —
        /// file đang chạy bị khoá, nên `ping` đợi ~2 giây). Thư mục cần quyền quản trị thì chạy file đó bằng `-Verb RunAs` (Windows hỏi UAC).
        /// </summary>
        private static bool StartCopier(string stage, string dir, out string why)
        {
            why = null;
            try
            {
                var script = Path.Combine(Path.GetTempPath(), "HavenLord-update.cmd");
                File.WriteAllText(script, string.Join("\r\n",
                    "@echo off",
                    "chcp 65001 >nul",
                    "ping -n 3 127.0.0.1 >nul",
                    $"robocopy \"{stage}\" \"{dir}\" /E /R:10 /W:2 /NFL /NDL /NJH /NJS /NP >nul",
                    $"rmdir /s /q \"{stage}\"",
                    $"start \"\" \"{Path.Combine(dir, "HavenLord.exe")}\"",
                    ""), new System.Text.UTF8Encoding(false));
                if (CanWrite(dir))
                {
                    using (WindowsNative.LaunchCommand("\"" + script + "\"")) { }
                }
                else
                {
                    using (WindowsNative.LaunchHidden(WindowsNative.PowerShell,
                        $"-NoProfile -WindowStyle Hidden -Command \"Start-Process -FilePath '{script.Replace("'", "''")}' -WindowStyle Hidden -Verb RunAs\"")) { }
                }
                return true;
            }
            catch (Exception e)
            {
                why = e.Message;
                return false;
            }
        }

        private static void TryDeleteDir(string dir)
        {
            try
            {
                if (Directory.Exists(dir)) Directory.Delete(dir, true);
            }
            catch (Exception)
            {
                // Còn file bị giữ — lần sau giải nén đè.
            }
        }

        private static bool CanWrite(string dir)
        {
            try
            {
                var probe = Path.Combine(dir, ".havenlord-write-test");
                File.WriteAllText(probe, "");
                File.Delete(probe);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private static void TryDelete(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch (Exception)
            {
                // File đang bị giữ — lần sau tải đè.
            }
        }

        /// <summary>null = file đúng cỡ + đúng SHA-256; còn lại là lý do.</summary>
        private static string Verify(string path, long size, string sha)
        {
            try
            {
                var fi = new FileInfo(path);
                if (!fi.Exists) return "Không thấy file vừa tải";
                if (size > 0 && fi.Length != size) return $"File tải về sai cỡ ({fi.Length} / {size} byte)";
                if (string.IsNullOrEmpty(sha)) return null;
                using (var s = File.OpenRead(path))
                using (var h = SHA256.Create())
                {
                    var hex = BitConverter.ToString(h.ComputeHash(s)).Replace("-", "").ToLowerInvariant();
                    return hex == sha ? null : "File tải về hỏng (sai mã kiểm)";
                }
            }
            catch (Exception e)
            {
                return "Không kiểm được file: " + e.Message;
            }
        }

        private IEnumerator Finish(float wait)
        {
            yield return new WaitForSeconds(wait);
            if (overlay != null) Destroy(overlay.gameObject);
            Busy = false;
        }

        private void Retry(RectTransform root)
        {
            var b = UiKit.Rect(overlay, "Retry", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -96), new Vector2(220, 46));
            UiKit.Sprite(b, "button", 1.2f, true);
            UiKit.Label(UiKit.Stretch(b, "t"), "Thử lại", 16, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, true);
            UiKit.Press(b, () =>
            {
                Destroy(overlay.gameObject);
                StartCoroutine(Run(root));
            });
        }

        private void SetProgress(float k, string text)
        {
            if (barFill != null) barFill.anchorMax = new Vector2(Mathf.Clamp01(k), 1);
            if (status != null) status.text = text;
        }

        private void BuildOverlay(RectTransform root, string version, string notes)
        {
            overlay = UiKit.Stretch(root, "Update");
            UiKit.Panel(overlay, new Color(0.03f, 0.02f, 0.015f, 0.82f), true);
            var card = UiKit.Rect(overlay, "Card", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(520, 230));
            UiStyle.Card(card, UiStyle.CardKind.Hud, 14);
            title = UiKit.Label(UiKit.Rect(card, "T", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -22), new Vector2(480, 30)), "Có bản mới — đang cập nhật", 22, UiStyle.GoldHi,
                TextAnchor.MiddleCenter, true);
            var sub = UiKit.Label(UiKit.Rect(card, "V", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -56), new Vector2(480, 40)),
                $"Bản {version}" + (string.IsNullOrEmpty(notes) ? "" : $" · {notes}"), 13, UiStyle.Parchment, TextAnchor.UpperCenter);
            sub.textWrappingMode = TextWrappingModes.Normal;
            var bar = UiKit.Rect(card, "Bar", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -18), new Vector2(440, 18));
            UiStyle.Pill(bar, new Color(0, 0, 0, 0.55f), 9);
            barFill = UiKit.Rect(bar, "Fill", Vector2.zero, Vector2.zero, Vector2.zero, Vector2.zero);
            barFill.anchorMin = Vector2.zero;
            barFill.anchorMax = new Vector2(0, 1);
            barFill.offsetMin = new Vector2(2, 2);
            barFill.offsetMax = new Vector2(-2, -2);
            UiStyle.Pill(barFill, UiStyle.GoldHi, 7);
            status = UiKit.Label(UiKit.Rect(card, "S", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 24), new Vector2(480, 44)), "Đang chuẩn bị…", 14, UiKit.TextMain,
                TextAnchor.MiddleCenter);
            status.textWrappingMode = TextWrappingModes.Normal;
            overlay.SetAsLastSibling();
        }
    }
}
