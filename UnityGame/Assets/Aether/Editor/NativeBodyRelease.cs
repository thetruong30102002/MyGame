using System;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>Explicit v13 release entry points; existing v2 imports remain unchanged.</summary>
    public static class NativeBodyRelease
    {
        public static void BuildWindowsBatch() => Build(false);
        public static void BuildAndroidBatch() => Build(true);

        private static void Build(bool android)
        {
            try
            {
                MannequinImporter.ImportV13();
                UiImporter.ImportItems(PipelineImportMenu.SourceDir, new ImportReport());
                AssetDatabase.SaveAssets();
                // Use the same production setup/build methods, including build stamps.
                // The legacy batch wrapper swallows exceptions, so retain ownership of exit here.
                GameSetup.Setup();
                var succeeded = android ? GameSetup.BuildAndroid() : GameSetup.BuildWindows();
                if (!succeeded) throw new InvalidOperationException("Native body production build failed");
                Debug.Log("[NativeBodyRelease] Succeeded: " + (android ? "Android" : "Windows"));
                EditorApplication.Exit(0);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }
    }
}
