using System;
using System.Collections.Generic;
using UnityEngine;

namespace Aether.Data
{
    /// <summary>
    /// Mục lục mọi thứ Importer sinh ra (Imported/GameDatabase.asset). Map / hiệu ứng tham chiếu thẳng; NHÂN VẬT chỉ giữ id và nạp từ
    /// Resources khi cần (atlas nhân vật nặng — nạp cả bộ là văng trên điện thoại RAM thấp). Importer dựng lại sau mỗi lượt nhập.
    /// </summary>
    [CreateAssetMenu(menuName = "Aether/Game Database", fileName = "GameDatabase")]
    public sealed class GameDatabase : ScriptableObject
    {
        /// <summary>Thư mục con trong Resources chứa CharacterDef: Characters/&lt;id&gt;/&lt;id&gt;.asset.</summary>
        public const string CharactersResourcePath = "Characters";

        public List<string> characterIds = new List<string>();
        public List<WorldIndex> regions = new List<WorldIndex>();
        public List<VfxDef> vfx = new List<VfxDef>();
        public List<UiSpriteSet> uiSets = new List<UiSpriteSet>();
        /// <summary>JSON xuất từ packages/sim (Data/Sim/*.json) — nạp vào Core.SimData lúc chạy.</summary>
        public List<TextAsset> simModules = new List<TextAsset>();
        /// <summary>Dữ liệu hình / NPC của client (Data/Client/*.json — Tools~/export-client-data.mts).</summary>
        public TextAsset tempArt;
        public TextAsset npcs;
        /// <summary>Vùng bắt đầu khi chơi offline.</summary>
        public string startRegion = "human";

        [NonSerialized] private Dictionary<string, CharacterDef> loaded;

        public bool HasCharacter(string id) => id != null && characterIds.Contains(id);

        /// <summary>Nạp CharacterDef (kèm atlas) lần đầu cần tới; id lạ = null.</summary>
        public CharacterDef Character(string id)
        {
            if (!HasCharacter(id)) return null;
            if (loaded == null) loaded = new Dictionary<string, CharacterDef>(StringComparer.Ordinal);
            if (loaded.TryGetValue(id, out var d) && d != null) return d;
            d = Resources.Load<CharacterDef>($"{CharactersResourcePath}/{id}/{id}");
            loaded[id] = d;
            return d;
        }

        /// <summary>Thả nhân vật không còn dùng (gọi lúc đổi map); <paramref name="keep"/> = id vẫn đang hiện.</summary>
        public void ReleaseCharacters(ICollection<string> keep)
        {
            if (loaded == null) return;
            var drop = new List<string>();
            foreach (var id in loaded.Keys) if (!keep.Contains(id)) drop.Add(id);
            foreach (var id in drop) loaded.Remove(id);
            if (drop.Count > 0) Resources.UnloadUnusedAssets();
        }

        public WorldIndex Region(string region)
        {
            foreach (var r in regions) if (r != null && r.region == region) return r;
            return null;
        }

        /// <summary>Clip hiệu ứng theo tên (tìm qua mọi atlas — tên clip là duy nhất như `vfx.frames(name)` của web).</summary>
        public VfxClip VfxClip(string name)
        {
            foreach (var v in vfx)
            {
                var c = v != null ? v.Find(name) : null;
                if (c != null) return c;
            }
            return null;
        }

        /// <summary>Khoá map "vùng/map" hoặc "map" (cùng vùng hiện tại) → (vùng, map) — splitMapKey của web.</summary>
        public static (string region, string map) SplitMapKey(string key, string currentRegion)
        {
            var i = key.IndexOf('/');
            return i < 0 ? (currentRegion, key) : (key.Substring(0, i), key.Substring(i + 1));
        }

        public Dictionary<string, string> SimModuleTexts()
        {
            var d = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var t in simModules) if (t != null) d[t.name] = t.text;
            return d;
        }
    }
}
