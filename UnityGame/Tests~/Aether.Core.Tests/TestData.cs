using System;
using System.Collections.Generic;
using System.IO;
using Aether.Core;
using Newtonsoft.Json.Linq;

namespace Aether.Core.Tests
{
    /// <summary>Đọc dữ liệu sim đã xuất + test vector cho mọi nhóm test đối chiếu.</summary>
    public static class TestData
    {
        public static readonly string Root = FindRoot();
        private static SimData _data;

        private static string FindRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "Assets", "Aether"))) dir = dir.Parent;
            if (dir == null) throw new InvalidOperationException("Không tìm thấy thư mục UnityGame (cần Assets/Aether)");
            return dir.FullName;
        }

        public static SimData Data
        {
            get
            {
                if (_data != null) return _data;
                var modules = new Dictionary<string, string>();
                foreach (var f in Directory.GetFiles(Path.Combine(Root, "Assets", "Aether", "Data", "Sim"), "*.json"))
                    modules[Path.GetFileNameWithoutExtension(f)] = File.ReadAllText(f);
                return _data = SimData.Load(modules);
            }
        }

        public static JObject Vectors(string name) => JObject.Parse(File.ReadAllText(Path.Combine(Root, "Tests~", "vectors", name + ".json")));

        /// <summary>Số trong vector: chuỗi "NaN"/"Infinity"/"-Infinity" (JSON không có) → double tương ứng.</summary>
        public static double Num(JToken t)
        {
            if (t.Type == JTokenType.String)
            {
                var s = (string)t;
                if (s == "NaN") return double.NaN;
                if (s == "Infinity") return double.PositiveInfinity;
                if (s == "-Infinity") return double.NegativeInfinity;
            }
            return (double)t;
        }

        public static double? OptNum(JToken t) => t == null || t.Type == JTokenType.Null ? (double?)null : Num(t);
    }
}
