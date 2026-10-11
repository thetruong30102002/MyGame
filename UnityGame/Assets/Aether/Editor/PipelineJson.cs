using System.Collections.Generic;

// Hình dạng JSON do pipeline xuất ra (apps/web/public/assets) — chỉ các trường Importer dùng; Newtonsoft khớp tên không phân biệt hoa thường.
// CS0649: trường chỉ được Newtonsoft gán qua phản chiếu.
#pragma warning disable CS0649
namespace Aether.Importer.Json
{
    internal sealed class JRect
    {
        public int x;
        public int y;
        public int w;
        public int h;
    }

    internal sealed class JSize
    {
        public int w;
        public int h;
    }

    internal sealed class JPoint
    {
        public double x;
        public double y;
    }

    /// <summary>Atlas kiểu Pixi/TexturePacker (characters/&lt;id&gt;/&lt;id&gt;.json, vfx/*.json, maps/&lt;vùng&gt;/props.json).</summary>
    internal sealed class AtlasJson
    {
        public Dictionary<string, AtlasFrameJson> frames = new Dictionary<string, AtlasFrameJson>();
        public Dictionary<string, List<string>> animations = new Dictionary<string, List<string>>();
        public AtlasMetaJson meta;
    }

    internal sealed class AtlasFrameJson
    {
        public JRect frame;
        public bool rotated;
        public bool trimmed;
        public JRect spriteSourceSize;
        public JSize sourceSize;
        public JPoint anchor;
        /// <summary>top/head/back/handL/handR → [x, y] px trong khung.</summary>
        public Dictionary<string, double[]> gear;
    }

    internal sealed class AtlasMetaJson
    {
        public string image;
        public JSize size;
    }

    internal sealed class ManifestJson
    {
        public int version;
        public Dictionary<string, ManifestCharacterJson> characters = new Dictionary<string, ManifestCharacterJson>();
    }

    internal sealed class FrameSizeJson
    {
        public int width;
        public int height;
    }

    internal sealed class ManifestCharacterJson
    {
        public string displayName;
        public string role;
        public string atlas;
        public FrameSizeJson frameSize;
        public JPoint anchor;
        public Dictionary<string, AnimSpecJson> animations = new Dictionary<string, AnimSpecJson>();
        public double? bodyHeight;
        public string portrait;
        public List<string> directions;
    }

    internal sealed class AnimSpecJson
    {
        public double fps;
        public int? hitFrame;
        public int? frames;
        public bool? loop;
        public List<string> directions;
    }

    internal sealed class PlacementJson
    {
        public string id;
        public double x;
        public double y;
    }

    internal sealed class NpcJson
    {
        public string characterId;
        public double x;
        public double y;
        public string facing;
        public string role;
    }

    internal sealed class MonsterZoneJson
    {
        public string id;
        public string name;
        public double x;
        public double y;
        public double radius;
        public List<string> monsters;
        public int count;
        public int? fromAge;
        public int? untilAge;
        public int? level;
        public bool? onDemand;
        public bool? boss;
    }

    internal sealed class BossJson
    {
        public string characterId;
        public double x;
        public double y;
        public double radius;
    }

    internal sealed class AreaJson
    {
        public string name;
        public double x0;
        public double y0;
        public double x1;
        public double y1;
    }

    internal sealed class SpotJson
    {
        public string id;
        public string name;
        public double x;
        public double y;
        public double r;
    }

    internal sealed class ExitJson
    {
        public string id;
        public string to;
        public string toSpot;
        public string edge;
        public double x0;
        public double y0;
        public double x1;
        public double y1;
        public string label;
    }

    /// <summary>maps/&lt;vùng&gt;/&lt;id&gt;.json (MapData của MapWorld.ts).</summary>
    internal sealed class MapJson
    {
        public string id;
        public string name;
        public string biome;
        public int tileSize = 48;
        public int width;
        public int height;
        public int seed;
        public List<string> terrain = new List<string>();
        public List<PlacementJson> props = new List<PlacementJson>();
        public List<PlacementJson> decals = new List<PlacementJson>();
        public JPoint spawn;
        public List<NpcJson> npcs = new List<NpcJson>();
        public List<MonsterZoneJson> monsterZones = new List<MonsterZoneJson>();
        public BossJson boss;
        public List<AreaJson> areas = new List<AreaJson>();
        public List<SpotJson> spots = new List<SpotJson>();
        public List<PlacementJson> dummies = new List<PlacementJson>();
        public List<ExitJson> exits = new List<ExitJson>();
    }

    /// <summary>props.meta.json: chân đồ vật.</summary>
    internal sealed class PropMetaJson
    {
        public string kind;
        public int w;
        public int h;
        public bool blocks;
        public JRect footprint;
    }

    internal sealed class MinimapJson
    {
        public string map;
        public string image;
        public int width;
        public int height;
        public int downscale;
        public string version;
    }

    internal sealed class WorldJson
    {
        public string region;
        public string start;
        public Dictionary<string, WorldMapJson> maps = new Dictionary<string, WorldMapJson>();
    }

    internal sealed class WorldExitJson
    {
        public string id;
        public string to;
        public double x;
        public double y;
        public string label;
    }

    internal sealed class WorldZoneJson
    {
        public string id;
        public List<string> monsters;
    }

    internal sealed class WorldMapJson
    {
        public string name;
        public double width;
        public double height;
        public List<WorldExitJson> exits = new List<WorldExitJson>();
        public List<string> spots = new List<string>();
        public List<WorldZoneJson> zones = new List<WorldZoneJson>();
        public List<string> dummies = new List<string>();
        public string boss;
        public int[] levels;
    }

    internal sealed class NineSliceJson
    {
        public int top;
        public int right;
        public int bottom;
        public int left;
    }

    /// <summary>ui/ui.json (lệnh `ui` của pipeline): ảnh + viền 9 mảnh.</summary>
    internal sealed class UiEntryJson
    {
        public string file;
        public int w;
        public int h;
        public NineSliceJson slice;
    }
}
#pragma warning restore CS0649
