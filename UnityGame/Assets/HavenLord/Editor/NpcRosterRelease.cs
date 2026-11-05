using System;
using System.IO;
using System.Linq;
using HavenLord.Data;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;
namespace HavenLord.Importer
{
    /// <summary>
    /// Nhập bộ nhân vật cỡ NPC 8 hướng (chặng U, chủ dự án 04/11: "cho vào game cả nữ", "full đầu"): 2 giới × 15 đầu × 5 class = 150 lựa chọn,
    /// đóng gói bởi scripts/export-npc-roster.mts từ các lớp PixelLab đã tách. Chỉ nhập dữ liệu, không build; giữ nhân vật cũ để người chơi đã tạo
    /// vẫn hiển thị được.
    /// </summary>
    public static class NpcRosterRelease
    {
        public static void ImportBatch()
        {
            var code = 1;
            try { Import(); code = 0; }
            catch (Exception e) { Debug.LogException(e); }
            EditorApplication.Exit(code);
        }

        public static void Import()
        {
            var src = PipelineImportMenu.DefaultSourceDir;
            var path = Path.Combine(src, "player-roster/npc-v1/catalog.json");
            var models = (JArray)JObject.Parse(File.ReadAllText(path))["characters"];
            if (models == null || models.Count != 150 || models.Select(m => (string)m["id"]).Distinct().Count() != 150) throw new Exception("Cần đủ 150 lựa chọn cỡ NPC");
            foreach (var group in models.GroupBy(m => (string)m["gender"] + "/" + (string)m["classId"]))
                if (group.Count() != 15) throw new Exception("Thiếu đầu: " + group.Key);
            var report = new ImportReport();
            var db = AssetDatabase.LoadAssetAtPath<GameDatabase>(GameSetup.DatabasePath);
            if (db == null) throw new Exception("Không thấy GameDatabase hiện có");
            foreach (var m in models)
            {
                var id = (string)m["id"];
                CharacterImporter.ImportSingle(src, id, report);
                var def = AssetDatabase.LoadAssetAtPath<CharacterDef>(CharacterImporter.CharactersFolder + "/" + id + "/" + id + ".asset");
                if (def == null || !def.Has("idle") || !def.Has("walk") || !def.Has("run")) throw new Exception("Thiếu chuyển động " + id);
                if (!db.characterIds.Contains(id)) db.characterIds.Add(id);
            }
            if (report.Warnings.Count != 0) throw new Exception(string.Join("; ", report.Warnings));
            ImportUtil.CopyAssetMarked(path, ImportUtil.Root + "/Resources/NpcRoster.json");
            EditorUtility.SetDirty(db);
            AssetDatabase.SaveAssets();
            Debug.Log("[NpcRoster] Nhập 150 lựa chọn cỡ NPC: " + report);
        }
    }
}
