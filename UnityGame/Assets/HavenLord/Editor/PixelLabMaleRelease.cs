using System;
using System.IO;
using System.Linq;
using HavenLord.Data;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;
namespace HavenLord.Importer
{
    /// <summary>Nhập đúng 25 bộ PixelLab đã có, không lấy nguồn animation GPT; giữ scene và dữ liệu người chơi.</summary>
    public static class PixelLabMaleRelease
    {
        private static void Import()
        {
            var src=PipelineImportMenu.DefaultSourceDir;
            var path=Path.Combine(src,"player-roster/pixellab-male-v1/catalog.json");
            var models=(JArray)JObject.Parse(File.ReadAllText(path))["characters"];
            if(models==null||models.Count!=25||models.Select(m=>(string)m["id"]).Distinct().Count()!=25)throw new Exception("Cần đủ 25 lựa chọn nam PixelLab");
            foreach(var group in models.GroupBy(m=>(string)m["classId"]))if(group.Count()!=5||group.Select(m=>(string)m["raceId"]).Distinct().Count()!=5)throw new Exception("Thiếu tộc/class");
            var report=new ImportReport();var db=AssetDatabase.LoadAssetAtPath<GameDatabase>(GameSetup.DatabasePath);
            if(db==null)throw new Exception("Không thấy GameDatabase hiện có");
            foreach(var m in models)
            {
                var id=(string)m["id"];CharacterImporter.ImportSingle(src,id,report);
                var def=AssetDatabase.LoadAssetAtPath<CharacterDef>(CharacterImporter.CharactersFolder+"/"+id+"/"+id+".asset");
                if(def==null||!def.Has("idle")||!def.Has("walk")||!def.Has("run"))throw new Exception("Thiếu chuyển động "+id);
                if(!db.characterIds.Contains(id))db.characterIds.Add(id);
            }
            if(report.Warnings.Count!=0)throw new Exception(string.Join("; ",report.Warnings));
            ImportUtil.CopyAssetMarked(path,ImportUtil.Root+"/Resources/PixelLabMaleRoster.json");
            EditorUtility.SetDirty(db);AssetDatabase.SaveAssets();Debug.Log("[PixelLabMale] Nhập 25 lựa chọn: "+report);
        }
        public static void BuildWindowsBatch()=>Run(0);
        public static void BuildWebDesktopBatch()=>Run(1);
        public static void BuildWebMobileBatch()=>Run(2);
        private static void SnapshotWeb(int mode)
        {
            var src=Path.Combine(GameSetup.BuildDir,mode==2?"WebGL-mobile":"WebGL");
            if(!Directory.Exists(Path.Combine(src,"Build"))||Directory.GetFiles(Path.Combine(src,"Build")).Length<4)throw new Exception("Web build thiếu bundle thực tế: "+src);
            var dst=Path.GetFullPath(Path.Combine(Application.dataPath,"..","..",".havenlord-stage","web-pixellab-release",mode==2?"mobile":"desktop"));
            foreach(var f in Directory.GetFiles(src,"*",SearchOption.AllDirectories)){var target=Path.Combine(dst,Path.GetRelativePath(src,f));Directory.CreateDirectory(Path.GetDirectoryName(target));File.Copy(f,target,true);}
            Debug.Log("[PixelLabMale] Snapshot web có đủ bundle: "+dst);
        }
        private static void Run(int mode)
        {
            var code=1;try{Import();using(new IntegratedCharacterRelease.LegacyResourceExclusion())
            using(new LayeredSourceExclusion())
            {if(!(mode==0?GameSetup.BuildWindows():mode==2?GameSetup.BuildWebGLMobile():GameSetup.BuildWebGL()))throw new Exception("Build PixelLab lỗi");if(mode>0)SnapshotWeb(mode);}
            Debug.Log("[PixelLabMale] Build thành công "+mode);code=0;}
            catch(Exception e){Debug.LogException(e);}EditorApplication.Exit(code);
        }
        private sealed class LayeredSourceExclusion:IDisposable
        {
            private const string Source="Assets/HavenLord/Imported/Resources/Layered";
            private const string Target="Assets/HavenLord/BuildExcluded/LayeredSource";
            private bool moved;
            public LayeredSourceExclusion()
            {
                // Hai đường cố định trong Unity project, chỉ chuyển bản nhập dư; nguồn PixelLab bên ngoài không đụng tới.
                if(!AssetDatabase.IsValidFolder(Source)&&AssetDatabase.IsValidFolder(Target))Move(Target,Source);
                if(!AssetDatabase.IsValidFolder(Source))return;
                if(AssetDatabase.IsValidFolder(Target))throw new Exception("Thư mục cách ly Layered đã tồn tại");
                Move(Source,Target);moved=true;
            }
            private static void Move(string from,string to){ImportUtil.EnsureFolder(Path.GetDirectoryName(to).Replace('\\','/'));var error=AssetDatabase.MoveAsset(from,to);if(!string.IsNullOrEmpty(error))throw new Exception(error);AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);}
            public void Dispose(){if(moved){Move(Target,Source);AssetDatabase.SaveAssets();}}
        }
    }
}
