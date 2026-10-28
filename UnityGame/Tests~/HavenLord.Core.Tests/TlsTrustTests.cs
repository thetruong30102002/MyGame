using System;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using HavenLord.Net;
using NUnit.Framework;

namespace HavenLord.Core.Tests
{
    /// <summary>
    /// Bộ kiểm chứng chỉ bù cho APK (<see cref="TlsTrust"/>): lấy chuỗi THẬT của link Funnel rồi giả như Unity báo "lỗi chuỗi".
    /// Cần mạng (không mạng → Inconclusive). Chạy riêng: <c>dotnet test UnityGame/Tests~/HavenLord.Core.Tests --filter TestCategory=Tls</c>.
    /// </summary>
    [Category("Tls")]
    public class TlsTrustTests
    {
        private const string Host = "nttrg-2.tail024813.ts.net";

        private static (X509Certificate2 leaf, X509Chain chain) FetchServerChain()
        {
            X509Certificate2 leaf = null;
            X509Chain copy = null;
            try
            {
                using var tcp = new TcpClient();
                if (!tcp.ConnectAsync(Host, 443).Wait(TimeSpan.FromSeconds(10))) Assert.Inconclusive("Không tới được " + Host);
                using var ssl = new SslStream(tcp.GetStream(), false, (s, cert, ch, err) =>
                {
                    leaf = new X509Certificate2(cert);
                    copy = new X509Chain();
                    // Giống APK: chỉ có những gì máy chủ gửi kèm, không dựa vào kho gốc của máy.
                    foreach (var e in ch.ChainElements) copy.ChainPolicy.ExtraStore.Add(new X509Certificate2(e.Certificate));
                    return true;
                });
                ssl.AuthenticateAsClient(Host);
            }
            catch (SocketException e)
            {
                Assert.Inconclusive("Không có mạng: " + e.Message);
            }
            return (leaf, copy);
        }

        [Test]
        public void NhanChuoiThatKhiUnityBaoLoiChuoi()
        {
            var (leaf, chain) = FetchServerChain();
            Assert.That(TlsTrust.Validate(null, leaf, chain, SslPolicyErrors.RemoteCertificateChainErrors), Is.True, TlsTrust.LastRejection);
        }

        [Test]
        public void TuChoiKhiSaiTenHost()
        {
            var (leaf, chain) = FetchServerChain();
            Assert.That(TlsTrust.Validate(null, leaf, chain, SslPolicyErrors.RemoteCertificateNameMismatch | SslPolicyErrors.RemoteCertificateChainErrors), Is.False);
        }

        [Test]
        public void TuChoiChungChiTuKy()
        {
            using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
            var req = new CertificateRequest("CN=" + Host, key, HashAlgorithmName.SHA256);
            using var self = req.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(30));
            Assert.That(TlsTrust.Validate(null, self, null, SslPolicyErrors.RemoteCertificateChainErrors), Is.False);
            Assert.That(TlsTrust.LastRejection, Does.Contain("ISRG"));
        }

        [Test]
        public void TuChoiLaGiaMaoTenMienNhungKyBangKhoaKhac()
        {
            // Chứng chỉ giả tự xưng do YE1 cấp, kèm đúng các mắt xích thật → chữ ký không khớp, phải bị từ chối.
            var (_, chain) = FetchServerChain();
            using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
            using var fakeIssuerKey = ECDsa.Create(ECCurve.NamedCurves.nistP384);
            var issuerReq = new CertificateRequest("CN=YE1, O=Let's Encrypt, C=US", fakeIssuerKey, HashAlgorithmName.SHA384);
            issuerReq.CertificateExtensions.Add(new X509BasicConstraintsExtension(true, false, 0, true));
            using var fakeIssuer = issuerReq.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(30));
            var leafReq = new CertificateRequest("CN=" + Host, key, HashAlgorithmName.SHA256);
            using var fake = leafReq.Create(fakeIssuer, DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(10), new byte[] { 1, 2, 3, 4 });
            Assert.That(TlsTrust.Validate(null, fake, chain, SslPolicyErrors.RemoteCertificateChainErrors), Is.False);
        }
    }
}
