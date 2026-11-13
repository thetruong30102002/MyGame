using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>Chữ Việt là nguồn; bảng Anh chỉ được nạp khi người chơi chọn English.</summary>
    public static class Loc
    {
        private const string Pref = "havenlord.lang";
        private const int CacheLimit = 1024;
        private static TextAsset source;
        private static TextAsset serverSource;
        private static IReadOnlyList<TextAsset> simSources;
        private static Dictionary<string, string> english;
        private static List<(Regex regex, string value)> patterns;
        private static readonly Dictionary<string, string> cache = new Dictionary<string, string>(StringComparer.Ordinal);
        private static int version;

        public static string Language { get; private set; } = PlayerPrefs.GetString(Pref, "vi") == "en" ? "en" : "vi";
        public static int Version => version;

        public static void Initialize(TextAsset table, IReadOnlyList<TextAsset> simTables = null, TextAsset serverTable = null)
        {
            if (source == table && simSources == simTables && serverSource == serverTable) return;
            source = table;
            simSources = simTables;
            serverSource = serverTable;
            english = null;
            patterns = null;
            cache.Clear();
            version++;
        }

        public static void SetLanguage(string language)
        {
            language = language == "en" ? "en" : "vi";
            if (Language == language) return;
            Language = language;
            PlayerPrefs.SetString(Pref, language);
            PlayerPrefs.Save();
            cache.Clear();
            version++;
        }

        public static string T(string vi)
        {
            if (Language == "vi" || string.IsNullOrEmpty(vi)) return vi;
            if (cache.TryGetValue(vi, out var hit)) return hit;
            Load();
            var result = english.TryGetValue(vi, out var exact) ? exact : Pattern(vi);
            if (cache.Count >= CacheLimit) cache.Clear();
            cache[vi] = result;
            return result;
        }

        private static void Load()
        {
            if (english != null) return;
            english = source != null
                ? JsonConvert.DeserializeObject<Dictionary<string, string>>(source.text)
                : null;
            if (english == null) english = new Dictionary<string, string>(StringComparer.Ordinal);
            if (simSources != null)
                foreach (var table in simSources)
                {
                    if (table == null) continue;
                    var entries = JsonConvert.DeserializeObject<Dictionary<string, string>>(table.text);
                    if (entries == null) continue;
                    foreach (var entry in entries) if (!english.ContainsKey(entry.Key)) english[entry.Key] = entry.Value;
                }
            if (serverSource != null)
            {
                var entries = JsonConvert.DeserializeObject<Dictionary<string, string>>(serverSource.text);
                if (entries != null) foreach (var entry in entries) if (!english.ContainsKey(entry.Key)) english[entry.Key] = entry.Value;
            }
            patterns = new List<(Regex, string)>();
            foreach (var entry in english)
            {
                if (!Regex.IsMatch(entry.Key, @"\{\d+\}")) continue;
                var pieces = Regex.Split(entry.Key, @"(\{\d+\})");
                var expression = new StringBuilder("^");
                foreach (var piece in pieces)
                {
                    if (Regex.IsMatch(piece, @"^\{\d+\}$"))
                        expression.Append("(?<p").Append(piece.Substring(1, piece.Length - 2)).Append(">.+?)");
                    else expression.Append(Regex.Escape(piece));
                }
                expression.Append('$');
                patterns.Add((new Regex(expression.ToString(), RegexOptions.Singleline | RegexOptions.CultureInvariant), entry.Value));
            }
        }

        private static string Pattern(string vi)
        {
            foreach (var item in patterns)
            {
                var match = item.regex.Match(vi);
                if (!match.Success) continue;
                var result = item.value;
                for (var i = 0; i < match.Groups.Count; i++)
                {
                    var group = match.Groups["p" + i];
                    if (group.Success)
                    {
                        var value = english.TryGetValue(group.Value, out var translated) ? translated : group.Value;
                        result = result.Replace("{" + i + "}", value);
                    }
                }
                return result;
            }
            return vi;
        }
    }
}
