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
                MannequinImporter.ImportV2();
                var output = Path.GetFullPath(Path.Combine(Application.dataPath, "../..", ".aether-stage/mannequin/build/Aether.exe"));
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
