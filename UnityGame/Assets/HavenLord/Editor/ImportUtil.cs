using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;

namespace HavenLord.Importer
{
    /// <summary>Nhật ký một lượt nhập: đếm + cảnh báo, in ra Console cuối lượt.</summary>
    public sealed class ImportReport
    {
        public readonly List<string> Warnings = new List<string>();
        public readonly SortedDictionary<string, int> Counts = new SortedDictionary<string, int>();

        public void Count(string what, int n = 1) => Counts[what] = (Counts.TryGetValue(what, out var c) ? c : 0) + n;

        public void Warn(string msg)
        {
            Warnings.Add(msg);
            Debug.LogWarning("[HavenLord import] " + msg);
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            foreach (var kv in Counts) sb.Append(kv.Key).Append(": ").Append(kv.Value).Append('\n');
            sb.Append("Cảnh báo: ").Append(Warnings.Count);
            return sb.ToString();
        }
    }

    internal static class ImportUtil
    {
        /// <summary>Mọi thứ Importer sinh ra nằm dưới đây — xoá thư mục này rồi nhập lại là dựng lại từ đầu.</summary>
        public const string Root = "Assets/HavenLord/Imported";

        public static string ProjectRoot => Path.GetFullPath(Path.Combine(Application.dataPath, ".."));

        public static string FullPath(string assetPath) => Path.Combine(ProjectRoot, assetPath);

        public static T ReadJson<T>(string file) => JsonConvert.DeserializeObject<T>(File.ReadAllText(file, Encoding.UTF8));

        /// <summary>Tạo thư mục asset (đệ quy) qua AssetDatabase để GUID thư mục ổn định.</summary>
        public static void EnsureFolder(string assetFolder)
        {
            assetFolder = assetFolder.Replace('\\', '/').TrimEnd('/');
            if (AssetDatabase.IsValidFolder(assetFolder)) return;
            var parent = Path.GetDirectoryName(assetFolder)?.Replace('\\', '/');
            if (!string.IsNullOrEmpty(parent)) EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, Path.GetFileName(assetFolder));
        }

        /// <summary>Ghi file vào project chỉ khi nội dung khác (giữ nguyên thì Unity không nhập lại). true = đã ghi.</summary>
        public static bool WriteIfChanged(string assetPath, byte[] bytes)
        {
            var full = FullPath(assetPath);
            if (File.Exists(full))
            {
                var old = File.ReadAllBytes(full);
                if (old.Length == bytes.Length && Sha1(old) == Sha1(bytes)) return false;
            }
            EnsureFolder(Path.GetDirectoryName(assetPath));
            File.WriteAllBytes(full, bytes);
            return true;
        }

        /// <summary>Chép ảnh pipeline vào project (nếu khác) rồi bảo đảm Unity đã nhập nó.</summary>
        public static void CopyAsset(string srcFile, string assetPath)
        {
            var changed = WriteIfChanged(assetPath, File.ReadAllBytes(srcFile));
            if (changed || AssetImporter.GetAtPath(assetPath) == null)
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate | ImportAssetOptions.ForceSynchronousImport);
        }

        /// <summary>Như <see cref="CopyAsset"/> nhưng đóng dấu ẩn bản quyền (`Watermark`) — hình nhân vật / chân dung.</summary>
        public static void CopyAssetMarked(string srcFile, string assetPath)
        {
            var changed = WriteIfChanged(assetPath, Watermark.Mark(File.ReadAllBytes(srcFile)));
            if (changed || AssetImporter.GetAtPath(assetPath) == null)
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate | ImportAssetOptions.ForceSynchronousImport);
        }

        public static string Sha1(byte[] bytes)
        {
            using (var sha = SHA1.Create()) return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "");
        }

        public static string Sha1(string text) => Sha1(Encoding.UTF8.GetBytes(text));

        /// <summary>Kích thước PNG đọc từ khối IHDR (không cần nạp ảnh).</summary>
        public static Vector2Int PngSize(string file)
        {
            using (var fs = File.OpenRead(file))
            {
                var b = new byte[24];
                if (fs.Read(b, 0, 24) != 24 || b[1] != 'P' || b[2] != 'N' || b[3] != 'G') throw new InvalidDataException("Không phải PNG: " + file);
                int Be(int o) => (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
                return new Vector2Int(Be(16), Be(20));
            }
        }

        public static T LoadOrCreate<T>(string assetPath) where T : ScriptableObject
        {
            var a = AssetDatabase.LoadAssetAtPath<T>(assetPath);
            if (a != null) return a;
            EnsureFolder(Path.GetDirectoryName(assetPath));
            a = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(a, assetPath);
            return a;
        }

        /// <summary>Bỏ tiền tố "thư-mục/" của tên khung atlas ("player_hero_adult/idle_S_0" → "idle_S_0").</summary>
        public static string ShortName(string frameName)
        {
            var i = frameName.LastIndexOf('/');
            return i < 0 ? frameName : frameName.Substring(i + 1);
        }

        public static int NextPow2(int v)
        {
            var p = 32;
            while (p < v && p < 16384) p <<= 1;
            return p;
        }
    }
}
