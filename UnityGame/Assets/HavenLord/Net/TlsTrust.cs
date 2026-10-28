using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Threading;

namespace HavenLord.Net
{
    /// <summary>
    /// Kiểm chứng chỉ HTTPS / WSS bù cho TLS của Unity trên Android (15/10/2026): từ 01/10/2026 Tailscale cấp chứng chỉ Let's Encrypt
    /// nhánh mới (YE1 → Root YE → ký chéo ISRG Root X2 → ISRG Root X1). Trình duyệt / PC nhận, nhưng APK báo lỗi chuỗi nên mọi lời gọi
    /// máy chủ đều hỏng ("máy chủ đã bật chưa?"). Khi hệ thống đã nhận thì giữ nguyên; khi CHỈ lỗi chuỗi (tên host vẫn khớp) thì tự ghép
    /// lại chuỗi từ chứng chỉ máy chủ gửi kèm — vẫn kiểm chữ ký từng mắt xích, hạn dùng — và chỉ nhận khi chuỗi đi qua một khoá gốc ISRG
    /// đã ghim. Áp cho cả HttpClient lẫn ClientWebSocket (cùng đi qua ServicePointManager trong Mono / IL2CPP).
    /// </summary>
    public static class TlsTrust
    {
        /// <summary>SHA-256 của <see cref="X509Certificate.GetPublicKey"/> — khoá của gốc không đổi khi gốc được ký chéo / cấp lại.</summary>
        private static readonly HashSet<string> PinnedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "f4593a1e07cc9cceffbed9c11dc5218356f7814d9b22949de745e629990c6c60", // ISRG Root X1 (RSA)
            "f901edd23d48801afcf02b22486d7deca46c6c0969ad00e885cbe87b565ae396", // ISRG Root X2 (ECDSA)
            "a3c8265a8ea14cd03563fc9b23c83aae56f34f560494c6388afacb6e38397f21", // ISRG Root YE (nhánh mới 2025)
        };

        /// <summary>Trạng thái mắt xích chấp nhận được khi tự ghép: chỉ "không biết gốc" / "chuỗi dở" (thiếu gốc trong kho máy).</summary>
        private const X509ChainStatusFlags Tolerated = X509ChainStatusFlags.UntrustedRoot | X509ChainStatusFlags.PartialChain
            | X509ChainStatusFlags.RevocationStatusUnknown | X509ChainStatusFlags.OfflineRevocation;

        private static int _installed;

        /// <summary>Lý do lần từ chối gần nhất (ghép vào câu lỗi kết nối để dễ dò).</summary>
        public static string LastRejection { get; private set; }

        /// <summary>Gắn bộ kiểm vào ServicePointManager (một lần; gọi lại không sao).</summary>
        public static void Install()
        {
            if (Interlocked.Exchange(ref _installed, 1) != 0) return;
#if !(UNITY_WEBGL && !UNITY_EDITOR)
            // WebGL: trình duyệt tự kiểm chứng chỉ, không có ServicePointManager.
            ServicePointManager.ServerCertificateValidationCallback = Validate;
#endif
        }

        public static bool Validate(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors errors)
        {
            if (errors == SslPolicyErrors.None) return true;
            if (errors != SslPolicyErrors.RemoteCertificateChainErrors || certificate == null)
                return Reject($"chứng chỉ không hợp lệ ({errors})");
            try
            {
                using var leaf = new X509Certificate2(certificate);
                using var own = new X509Chain();
                own.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;
                own.ChainPolicy.VerificationFlags = X509VerificationFlags.AllowUnknownCertificateAuthority;
                if (chain != null)
                {
                    foreach (var e in chain.ChainElements) own.ChainPolicy.ExtraStore.Add(e.Certificate);
                    own.ChainPolicy.ExtraStore.AddRange(chain.ChainPolicy.ExtraStore);
                }
                own.Build(leaf);
                var pinned = false;
                for (var i = 0; i < own.ChainElements.Count; i++)
                {
                    var el = own.ChainElements[i];
                    foreach (var s in el.ChainElementStatus)
                        if ((s.Status & ~Tolerated) != 0) return Reject($"mắt xích {el.Certificate.Subject}: {s.Status}");
                    if (i > 0 && PinnedKeys.Contains(KeyHash(el.Certificate))) pinned = true;
                }
                foreach (var s in own.ChainStatus)
                    if ((s.Status & ~Tolerated) != 0) return Reject($"chuỗi chứng chỉ: {s.Status}");
                return pinned || Reject($"chuỗi không về gốc ISRG ({own.ChainElements.Count} mắt xích)");
            }
            catch (Exception e)
            {
                return Reject($"không kiểm được chứng chỉ: {e.Message}");
            }
        }

        /// <summary>SHA-256 (hex thường) của khoá công khai chứng chỉ.</summary>
        public static string KeyHash(X509Certificate cert)
        {
            using var sha = SHA256.Create();
            return BitConverter.ToString(sha.ComputeHash(cert.GetPublicKey())).Replace("-", "").ToLowerInvariant();
        }

        private static bool Reject(string why)
        {
            LastRejection = why;
            return false;
        }
    }
}
