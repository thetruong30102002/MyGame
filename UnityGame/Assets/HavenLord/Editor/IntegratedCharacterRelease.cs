using System;
using System.IO;
using System.Linq;
using HavenLord.Data;
using HavenLord.Importer.Json;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;

namespace HavenLord.Importer
{
    /// <summary>Build the standard one-sprite player; preserve modular source/history outside the release package.</summary>
    public static class IntegratedCharacterRelease
    {
        private const string Id = "player_integrated";
        private const string LegacyResources = "Assets/HavenLord/Imported/Resources/Mannequin";
        private const string ExcludedLegacy = "Assets/HavenLord/BuildExcluded/LegacyMannequin";
        private static readonly string[] Core = {
            "idle", "walk", "run", "idlesword", "walksword", "runsword",
            "idlestaff", "walkstaff", "runstaff", "attack", "cast"
        };

        public static void ImportBatch()
        {
            try { Import(false); Debug.Log("[IntegratedCharacter] Import succeeded"); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }

        public static void BuildWindowsBatch() => Build(false);
        public static void BuildAndroidBatch() => Build(true);

        private static void Import(bool release)
        {
            var src = PipelineImportMenu.SourceDir;
            var manifest = ImportUtil.ReadJson<ManifestJson>(Path.Combine(src, "manifest.json"));
            if (!manifest.characters.TryGetValue(Id, out var entry)) throw new InvalidDataException("Missing complete player manifest entry");
            if (entry.frameSize == null || entry.frameSize.width != 144 || entry.frameSize.height != 144 ||
                entry.anchor == null || Math.Abs(entry.anchor.x - .5) > 1e-9 || Math.Abs(entry.anchor.y - 128.0 / 144) > 1e-9)
                throw new InvalidDataException("Complete player must retain native 144px frame and 72,128 root");
            if (!entry.bodyHeight.HasValue || entry.bodyHeight < 72 || entry.bodyHeight > 76) throw new InvalidDataException("Complete player body height differs from PixelLab reference");
            var atlasPath = Path.GetFullPath(Path.Combine(src, entry.atlas));
            var expectedFolder = Path.GetFullPath(Path.Combine(src, "characters", Id)) + Path.DirectorySeparatorChar;
            if (!atlasPath.StartsWith(expectedFolder, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Integrated atlas is outside its named character folder");
            var atlas = ImportUtil.ReadJson<AtlasJson>(atlasPath);
            if (atlas.frames.Count == 0 || atlas.frames.Any(f => f.Value.gear != null && f.Value.gear.Count != 0))
                throw new InvalidDataException("Complete player cannot contain modular attachment anchors");
            foreach (var frame in atlas.frames.Values)
                if (frame.sourceSize == null || frame.sourceSize.w != 144 || frame.sourceSize.h != 144 ||
                    frame.anchor == null || Math.Abs(frame.anchor.x - .5) > 1e-9 || Math.Abs(frame.anchor.y - 128.0 / 144) > 1e-9)
                    throw new InvalidDataException("Trimmed sprite lost its 144px logical canvas or 72,128 root");
            var proofPath = Path.Combine(expectedFolder, Id + ".provenance.json");
            var proof = JObject.Parse(File.ReadAllText(proofPath));
            if ((string)proof["id"] != Id || (bool?)proof["fullyDrawn"] != true || (bool?)proof["bakedWeapons"] != true || (bool?)proof["pending"] == true)
                throw new InvalidDataException("Complete player source provenance is missing or incomplete");
            if (release && (bool?)proof["artApproved"] != true) throw new InvalidDataException("Complete player requires actual sprite review before release build");
            foreach (var action in Core)
            {
                var expected = action == "attack" || action == "cast" ? 12 : action.StartsWith("idle", StringComparison.Ordinal) ? 4 : 8;
                if (!entry.animations.TryGetValue(action, out var spec) || spec.frames != expected)
                    throw new InvalidDataException("Missing genuinely drawn complete action: " + action);
                foreach (var d in new[] { "S", "SW", "W", "NW", "N", "NE", "E", "SE" })
                    if (!atlas.animations.TryGetValue(action + "_" + d, out var frames) || frames.Count != expected)
                        throw new InvalidDataException("Missing complete action direction: " + action + "/" + d);
            }
            var report = new ImportReport();
            CharacterImporter.ImportSingle(src, Id, report);
            if (report.Warnings.Count != 0) throw new InvalidDataException("Complete player import warnings: " + string.Join("; ", report.Warnings));
            var def = AssetDatabase.LoadAssetAtPath<CharacterDef>(CharacterImporter.CharactersFolder + "/" + Id + "/" + Id + ".asset");
            if (def == null || !Core.All(def.Has)) throw new InvalidDataException("Imported complete player definition is incomplete");
            AssetDatabase.SaveAssets();
            Debug.Log("[IntegratedCharacter] " + report);
        }

        private static void Build(bool android)
        {
            var exit = 1;
            try
            {
                Import(true);
                using (new LegacyResourceExclusion())
                {
                    GameSetup.Setup();
                    var success = android ? GameSetup.BuildAndroid() : GameSetup.BuildWindows();
                    if (!success) throw new InvalidOperationException("Integrated character production build failed");
                }
                Debug.Log("[IntegratedCharacterRelease] Succeeded: " + (android ? "Android" : "Windows"));
                exit = 0;
            }
            catch (Exception e) { Debug.LogException(e); }
            EditorApplication.Exit(exit);
        }

        /// <summary>Only the fixed imported legacy resource folder moves. Sources and history never move/delete.</summary>
        internal sealed class LegacyResourceExclusion : IDisposable
        {
            private bool moved;
            public LegacyResourceExclusion()
            {
                ValidateFixedPath(LegacyResources);
                ValidateFixedPath(ExcludedLegacy);
                // Recover a previous interrupted build before starting a fresh scope.
                if (!AssetDatabase.IsValidFolder(LegacyResources) && AssetDatabase.IsValidFolder(ExcludedLegacy)) Move(ExcludedLegacy, LegacyResources);
                if (!AssetDatabase.IsValidFolder(LegacyResources)) return;
                if (AssetDatabase.IsValidFolder(ExcludedLegacy)) throw new IOException("Legacy build exclusion target already exists");
                Move(LegacyResources, ExcludedLegacy); moved = true;
                Debug.Log("[IntegratedCharacterRelease] Legacy Mannequin Resources excluded for this build");
            }
            public void Dispose()
            {
                if (!moved) return;
                Move(ExcludedLegacy, LegacyResources); moved = false;
                AssetDatabase.SaveAssets();
            }
            private static void ValidateFixedPath(string path)
            {
                var root = Path.GetFullPath(ImportUtil.FullPath("Assets/HavenLord")) + Path.DirectorySeparatorChar;
                var full = Path.GetFullPath(ImportUtil.FullPath(path));
                if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase) || (path != LegacyResources && path != ExcludedLegacy))
                    throw new InvalidOperationException("Unsafe legacy resource move target");
            }
            private static void Move(string from, string to)
            {
                ImportUtil.EnsureFolder(Path.GetDirectoryName(to).Replace('\\', '/'));
                var error = AssetDatabase.MoveAsset(from, to);
                if (!string.IsNullOrEmpty(error)) throw new IOException("Cannot move legacy resources: " + error);
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            }
        }
    }
}
