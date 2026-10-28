using System;
using Newtonsoft.Json;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>Danh mục vẽ liền V18, nhập từ cùng catalog của pipeline.</summary>
    public static class PlayerRoster
    {
        [Serializable] public sealed class Choice
        {
            public string id, displayName, classId, classLabel, gender;
            public int variant;
            public bool? playable;
            public string Combat => classId == "staff" ? "cast" : classId == "bow" ? "shoot" : classId == "spear" ? "thrust" : classId == "shield" ? "bash" : "attack";
        }
        private sealed class Catalog { public Choice[] characters; }
        private static Choice[] choices;
        public static Choice[] Choices => choices ??= Load();
        public static bool LegacyOnly => Choices.Length==1 && Choices[0].id==GameController.IntegratedCharacterId;
        private static readonly string[] AllClasses = { "sword", "bow", "staff", "spear", "shield" };
        private static readonly string[] AllClassLabels = { "Kiếm", "Cung", "Trượng", "Thương", "Khiên" };
        public static string[] Classes => Array.FindAll(AllClasses,c=>Array.Exists(Choices,v=>v.classId==c));
        public static string[] ClassLabels => Array.ConvertAll(Classes,c=>AllClassLabels[Array.IndexOf(AllClasses,c)]);
        public static string OfflineModelId;

        private static Choice[] Load()
        {
            var file = Resources.Load<TextAsset>("PlayerRoster");
            // Web có 30 mẫu nhưng chưa đủ chuyển động để nhập roster; giữ nguyên nhân vật đã phát.
            if (file == null) return new[] {new Choice {id=GameController.IntegratedCharacterId,displayName="Lữ khách",classId="sword",classLabel="Kiếm / Trượng",gender="male",variant=1}};
            var result = JsonConvert.DeserializeObject<Catalog>(file.text)?.characters;
            if (result == null || result.Length != 30) throw new InvalidOperationException("Danh mục nhân vật V18 chưa đủ");
            var available=Array.FindAll(result,c=>c.playable!=false);
            if(available.Length==0 || Array.Find(available,c=>c.id=="player_verdant_sword")==null || Array.Find(available,c=>c.id=="player_ivory_staff")==null)
                throw new InvalidOperationException("Chưa nhập hai mẫu chơi cơ bản");
            return available;
        }
        public static Choice Find(string id) => id==GameController.IntegratedCharacterId ? null : Array.Find(Choices, c => c.id == id);
        public static Choice Default(bool female) => Array.Find(Choices, c => c.gender == (female ? "female" : "male") && c.classId == (female ? "staff" : "sword")) ?? Choices[0];
        public static string Resolve(string id, bool female) => Find(id) is Choice c && c.gender == (female ? "female" : "male") ? c.id : Default(female).id;
    }
}
