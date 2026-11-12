using System;
using System.IO;
using System.Linq;
using HavenLord.Data;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;

namespace HavenLord.Importer
{
    /// <summary>Kiểm gói Gia viên + bộ shop 2 sau nhập; chỉ đọc asset, không chạm máy chủ / CSDL.</summary>
    public static class HomeAssetAudit
    {
        public static void VerifyBatch()
        {
            try
            {
                GameSetup.Setup();
                var db = AssetDatabase.LoadAssetAtPath<GameDatabase>(GameSetup.DatabasePath);
                Require(db != null && db.homeProps != null && db.homeArtCatalog != null, "Thiếu gói Gia viên trong GameDatabase");
                var catalog = JObject.Parse(db.homeArtCatalog.text);
                Require(db.homeProps.props.Count == 48 && catalog["props"].Count() == 48, "Gia viên cần đủ 48 sprite");
                foreach (var p in catalog["props"])
                    Require(db.homeProps.Find((string)p["id"])?.sprite != null, "Thiếu sprite " + p["id"]);
                var items = db.uiSets.Find(x => x.setId == "items");
                Require(items != null && catalog["icons"].Count() == 20, "Thiếu bộ 20 icon Gia viên");
                foreach (var icon in catalog["icons"])
                    Require(items.Get((string)icon["id"]) != null, "Thiếu icon " + icon["id"]);

                var source = PipelineImportMenu.SourceDir;
                var roster = JObject.Parse(File.ReadAllText(Path.Combine(source, "player-roster/npc-v1/catalog.json")));
                Require(roster["outfits2"]?.Count() == 150, "Cần 150 mẫu bộ shop 2");
                foreach (var model in roster["outfits2"])
                {
                    var id = (string)model["id"];
                    var path = CharacterImporter.CharactersFolder + "/" + id + "/" + id + ".asset";
                    Require(db.HasCharacter(id) && AssetDatabase.LoadAssetAtPath<CharacterDef>(path) != null, "Thiếu mẫu bộ 2 " + id);
                }

                var layered = AssetDatabase.LoadAssetAtPath<LayeredCharacterDef>(LayeredImporter.Folder + "/mau-1/mau-1.asset");
                var standard = JObject.Parse(File.ReadAllText(Path.Combine(source, "layered/mau-1/layered.json")));
                foreach (var id in new[] { "u-farmer1", "uf-farmer1", "u-gardener", "uf-gardener" })
                {
                    var body = layered?.Body(id);
                    Require(body != null && body.gender == (id.StartsWith("uf-", StringComparison.Ordinal) ? "female" : "male"), "Sai giới thân " + id);
                    foreach (var action in new[] { "hoe", "water", "plant", "fish" })
                    foreach (var direction in new[] { "E", "N", "W" })
                    {
                        var clip = body.clips.Find(c => c.name == action + "_" + direction);
                        var hit = (int)standard["animations"][action]["hitFrame"];
                        Require(clip != null && clip.frames.Length == 15 && clip.frames.All(f => f.body != null), "Thiếu khung " + id + "/" + action + "_" + direction);
                        Require(clip.frames.Count(f => f.hit) == 1 && clip.frames[hit - 1].hit, "Sai mốc chạm " + id + "/" + action + "_" + direction);
                        if (action != "fish") continue;
                        foreach (var segment in new[] { ("cast", 1, 7), ("wait", 8, 11), ("pull", 12, 15) })
                            Require(clip.segments.Any(s => s.name == segment.Item1 && s.first == segment.Item2 && s.last == segment.Item3), "Sai đoạn câu cá " + id + "/" + direction);
                    }
                }
                Debug.Log("[HavenLord home audit] ĐẠT: 48 sprite, 20 icon, 150 mẫu bộ 2, 4 thân Gia viên × 12 clip, đúng hitFrame và 3 đoạn câu cá");
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidDataException(message);
        }
    }
}
