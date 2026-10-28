using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using Aether.Data;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>Nhập và build bộ 30 nhân vật đã vẽ đủ chuyển động V18.</summary>
    public static class RosterRelease
    {
        public static void ImportBatch() => Run(false, false);
        public static void BuildWindowsBatch() => Run(true, false);
        public static void BuildAndroidBatch() => Run(true, true);
        private static string Hash(string path)
        {
            using var sha = SHA256.Create();
            using var file = File.OpenRead(path);
            return BitConverter.ToString(sha.ComputeHash(file)).Replace("-", "").ToLowerInvariant();
        }
        private static void Import()
        {
            var src = PipelineImportMenu.DefaultSourceDir;
            var path = Path.Combine(src, "player-roster/v18/catalog.json");
            var catalog = JObject.Parse(File.ReadAllText(path));
            var models = (JArray)catalog["characters"];
            if (models == null || models.Count != 30 || models.Select(c => (string)c["id"]).Distinct().Count() != 30)
                throw new InvalidDataException("Cần đủ 30 ID nhân vật khác nhau");
            foreach (var group in models.GroupBy(c => (string)c["classId"]))
                if (group.Count(c => (string)c["gender"] == "male") != 3 || group.Count(c => (string)c["gender"] == "female") != 3)
                    throw new InvalidDataException("Mỗi class cần 3 nam và 3 nữ");
            var report = new ImportReport();
            foreach (var model in models)
            {
                var id = (string)model["id"];
                var folder = Path.Combine(src, "characters", id);
                var proof = JObject.Parse(File.ReadAllText(Path.Combine(folder, id + ".provenance.json")));
                if ((bool?)proof["fullyDrawn"] != true || (bool?)proof["artReviewed"] != true || (int?)proof["exactRgbaRoundtripFrames"] != 232 || (string)proof["atlasSha256"] != Hash(Path.Combine(folder, id + ".png")))
                    throw new InvalidDataException("Chưa rà đủ hình hoặc atlas sai nguồn: " + id);
                CharacterImporter.ImportSingle(src, id, report);
                var def = AssetDatabase.LoadAssetAtPath<CharacterDef>(CharacterImporter.CharactersFolder + "/" + id + "/" + id + ".asset");
                var role = (string)model["classId"];
                var action = role == "staff" ? "cast" : role == "bow" ? "shoot" : role == "spear" ? "thrust" : role == "shield" ? "bash" : "attack";
                foreach (var clip in new[] { "idle", "walk", "run", action })
                {
                    var anim = def?.Find(clip);var count = clip == "idle" ? 1 : clip == "walk" || clip == "run" ? 8 : 12;
                    if (anim == null || anim.dirs.Length != 8 || anim.dirs.Any(d => d == null || !d.present || d.frames.Length != count || d.frames.Any(s => s == null || s.pixelsPerUnit != 48)))
                        throw new InvalidDataException("Thiếu frame đã nhập: " + id + "/" + clip);
                }
            }
            if (report.Warnings.Count != 0) throw new InvalidDataException(string.Join("; ", report.Warnings));
            ImportUtil.CopyAssetMarked(path, ImportUtil.Root + "/Resources/PlayerRoster.json");
            AssetDatabase.SaveAssets();
            Debug.Log("[RosterRelease] Đã nhập 30 nhân vật / 6960 frame: " + report);
        }
        private static void Run(bool build, bool android)
        {
            var exit = 1;
            try
            {
                Import();
                if (build)
                    using (new IntegratedCharacterRelease.LegacyResourceExclusion())
                    {
                        GameSetup.Setup();
                        if (!(android ? GameSetup.BuildAndroid() : GameSetup.BuildWindows())) throw new Exception("Build V18 lỗi");
                    }
                exit = 0;
            }
            catch (Exception e) { Debug.LogException(e); }
            EditorApplication.Exit(exit);
        }
    }
}
