using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>Bản kiểm cục bộ riêng, không dựng lại scene hoặc phát hành bản game.</summary>
    public static class MannequinVerification
    {
        public static void BuildBatch()
        {
            try
            {
                var args = Environment.GetCommandLineArgs();
                var source = "v2";
                for (var i = 0; i + 1 < args.Length; i++)
                    if (args[i] == "-aetherMannequinSource") source = args[i + 1];
                if (source == "v13") MannequinImporter.ImportV13();
                else if (source == "v2") MannequinImporter.ImportV2();
                else throw new ArgumentException("Unknown mannequin source: " + source);
                UiImporter.ImportItems(PipelineImportMenu.SourceDir, new ImportReport());
                AssetDatabase.SaveAssets();
                var output = Path.GetFullPath(Path.Combine(Application.dataPath, "../..", ".aether-stage/mannequin/build/Aether.exe"));
                for (var i = 0; i + 1 < args.Length; i++)
                    if (args[i] == "-aetherBuildOutput") output = Path.GetFullPath(args[i + 1]);
                Directory.CreateDirectory(Path.GetDirectoryName(output));
                var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions {
                    scenes = new[] { "Assets/Aether/Scenes/Game.unity" }, locationPathName = output,
                    target = BuildTarget.StandaloneWindows64, options = BuildOptions.None
                });
                Debug.Log("[Mannequin build] " + report.summary.result + "; errors=" + report.summary.totalErrors + "; output=" + output);
                EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 1);
            }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
