using System;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>Atlas thử HD dùng point/no mip/no compression trên cả PC và Android.</summary>
    public sealed class SwordTrialV6Import : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if(assetPath!="Assets/Aether/Resources/SwordTrialV6/atlas.png") return;
            var importer=(TextureImporter)assetImporter;
            importer.textureType=TextureImporterType.Default; importer.filterMode=FilterMode.Point;
            importer.mipmapEnabled=false; importer.alphaIsTransparency=true;
            importer.textureCompression=TextureImporterCompression.Uncompressed;
            importer.npotScale=TextureImporterNPOTScale.None; importer.maxTextureSize=4096;
        }
        public static void BuildWindowsBatch() => Build(false);
        public static void BuildAndroidBatch() => Build(true);
        private static void Build(bool android)
        {
            try
            {
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                PlayerRigV3Import.ValidateForBuild();SwordWardrobeV4Import.ValidateForBuild();SwordWardrobeV4Import.ImportItems();
                AssetDatabase.ImportAsset("Assets/Aether/Resources/SwordTrialV6/atlas.png",ImportAssetOptions.ForceUpdate);
                Environment.SetEnvironmentVariable("AETHER_TRIAL_BUILD","1");
                using(new IntegratedCharacterRelease.LegacyResourceExclusion())
                {
                    GameSetup.Setup();
                    if(!(android?GameSetup.BuildAndroid():GameSetup.BuildWindows())) throw new Exception("Build thử V6 lỗi");
                }
                Debug.Log("[SwordTrialV6] Build succeeded"); EditorApplication.Exit(0);
            }
            catch(Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
