using UnityEditor;
using UnityEngine;
using System;
using System.IO;
using Newtonsoft.Json.Linq;
namespace Aether.Importer
{
    public sealed class SwordWardrobeV4Import:AssetPostprocessor
    {
        public static void ImportItems(){if(!File.Exists("Assets/Aether/Resources/PlayerModularV4/catalog.json"))return;UiImporter.ImportItems(Path.GetFullPath(Path.Combine(Application.dataPath,"../../assets")),new ImportReport());AssetDatabase.SaveAssets();}
        public static void ValidateForBuild(){const string path="Assets/Aether/Resources/PlayerModularV4/catalog.json";if(!File.Exists(path))return;var c=JObject.Parse(File.ReadAllText(path));if((int?)c["version"]!=4||(string)c["sourceRevision"]!="genuinely-headless-and-weaponless"||(bool?)c["bodyContainsOldHead"]!=false||(bool?)c["bodyContainsOldWeapon"]!=false||(bool?)c["undressSupported"]!=false||((JArray)c["records"]).Count!=48)throw new InvalidOperationException("Cấm build: bộ3 cấp kiếm sĩ chưa sạch/đủ8 hướng hoặc còn nhánh cởi đồ.");foreach(var r in (JArray)c["records"])if(((JArray)r["frames"]).Count!=32)throw new InvalidOperationException("Thiếu đứng/đi/chạy/chém8 hướng "+r["tier"]);}
        private void OnPreprocessTexture(){if(!assetPath.StartsWith("Assets/Aether/Resources/PlayerModularV4/")||!assetPath.EndsWith(".png"))return;var i=(TextureImporter)assetImporter;i.textureType=TextureImporterType.Default;i.filterMode=FilterMode.Point;i.mipmapEnabled=false;i.alphaIsTransparency=true;i.textureCompression=TextureImporterCompression.Uncompressed;i.npotScale=TextureImporterNPOTScale.None;i.maxTextureSize=2048;}
    }
}
