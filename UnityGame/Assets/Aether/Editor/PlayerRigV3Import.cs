using UnityEditor;
using UnityEngine;
using System.IO;
using System;
using Newtonsoft.Json.Linq;
namespace Aether.Importer
{
    public sealed class PlayerRigV3Import:AssetPostprocessor
    {
        public static void ValidateForBuild()
        {
            const string path="Assets/Aether/Resources/PlayerRigV3/catalog.json";if(!File.Exists(path))return;var c=JObject.Parse(File.ReadAllText(path));
            if((string)c["sourceRevision"]!="genuinely-headless"||(bool?)c["headOverpaintForbidden"]!=true||(bool?)c["bodyContainsOldHead"]!=false)throw new InvalidOperationException("CẤM BUILD: bộ thân còn dùng nguồn có đầu/mask cũ. Cần nguồn không đầu thật.");
            var s=c["headStandard"];if(s==null||(bool?)s["perHeadRuntimeOffset"]!=false||(bool?)s["perHeadRuntimeScale"]!=false||(float?)s["runtimeScale"]!=1)throw new InvalidOperationException("CẤM BUILD: thiếu chuẩn kích thước/neo đầu global.");
            foreach(var h in (JArray)c["heads"])
                if((string)h["standardId"]!=(string)s["id"]||(int?)h["w"]!=(int?)s["canvas"][0]||(int?)h["h"]!=(int?)s["canvas"][1]||h["dy"]!=null||h["dx"]!=null||h["scale"]!=null)
                    throw new InvalidOperationException("CẤM BUILD: đầu không theo cùng kích thước/neo global: "+h["id"]);
        }
        private void OnPreprocessTexture(){if(!assetPath.StartsWith("Assets/Aether/Resources/PlayerRigV3/")||!assetPath.EndsWith(".png"))return;var i=(TextureImporter)assetImporter;i.textureType=TextureImporterType.Default;i.filterMode=FilterMode.Point;i.mipmapEnabled=false;i.alphaIsTransparency=true;i.textureCompression=TextureImporterCompression.Uncompressed;i.npotScale=TextureImporterNPOTScale.None;i.maxTextureSize=4096;}
    }
}
