using System;
using System.Diagnostics;
using System.IO;
using Aether.Data;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using Debug = UnityEngine.Debug;

namespace Aether.Importer
{
    /// <summary>
    /// Menu "Aether/Nhập dữ liệu từ pipeline": đọc assets/ ở gốc repo (do packages/asset-pipeline xuất) → Assets/Aether/Imported.
    /// Chạy lại bao nhiêu lần cũng được: ảnh chỉ ghi khi khác, sprite giữ spriteID theo tên, ScriptableObject cập nhật tại chỗ.
    /// Dòng lệnh: Unity -batchmode -quit -projectPath UnityGame -executeMethod Aether.Importer.PipelineImportMenu.ImportAllBatch
    ///            [-aetherAssets &lt;thư mục assets&gt;]
    /// </summary>
    public static class PipelineImportMenu
    {
        private const string PrefKey = "Aether.PipelineAssetsDir";

        /// <summary>Mặc định: repo gốc/assets (UnityGame nằm cạnh nó).</summary>
        public static string DefaultSourceDir => Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "assets"));

        public static string SourceDir
        {
            get
            {
                var p = EditorPrefs.GetString(PrefKey, "");
                return string.IsNullOrEmpty(p) || !Directory.Exists(p) ? DefaultSourceDir : p;
            }
        }

        [MenuItem("Aether/Nhập dữ liệu từ pipeline", priority = 1)]
        private static void ImportMenu()
        {
            var src = SourceDir;
            if (!Directory.Exists(src))
            {
                EditorUtility.DisplayDialog("Aether", "Không thấy thư mục pipeline:\n" + src + "\nChọn lại bằng Aether/Chọn thư mục pipeline…", "OK");
                return;
            }
            var report = Run(src, true);
            EditorUtility.DisplayDialog("Aether — nhập xong", report.ToString(), "OK");
        }

        [MenuItem("Aether/Chọn thư mục pipeline…", priority = 2)]
        private static void ChooseSource()
        {
            var p = EditorUtility.OpenFolderPanel("Thư mục assets của pipeline (assets/ ở gốc repo)", SourceDir, "");
            if (!string.IsNullOrEmpty(p)) EditorPrefs.SetString(PrefKey, p);
        }

        [MenuItem("Aether/Mở map đang chọn trong scene mới", priority = 20)]
        private static void OpenMapScene()
        {
            var def = Selection.activeObject as MapDef;
            if (def == null || def.prefab == null || !EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            PrefabUtility.InstantiatePrefab(def.prefab);
            var cam = new GameObject("Main Camera") { tag = "MainCamera" }.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 270f / WorldCoords.PixelsPerUnit;
            cam.backgroundColor = Color.black;
            cam.clearFlags = CameraClearFlags.SolidColor;
            var s = WorldCoords.PxToWorld(def.spawn);
            cam.transform.position = new Vector3(s.x, s.y, -10);
        }

        [MenuItem("Aether/Mở map đang chọn trong scene mới", true)]
        private static bool OpenMapSceneValidate() => Selection.activeObject is MapDef d && d.prefab != null;

        /// <summary>Lối vào cho -executeMethod. Lỗi thì thoát mã 1 để CI biết.</summary>
        public static void ImportAllBatch()
        {
            var src = ArgValue("-aetherAssets") ?? SourceDir;
            try
            {
                if (!Directory.Exists(src)) throw new DirectoryNotFoundException("Không thấy thư mục pipeline: " + src);
                var report = Run(src, false);
                Debug.Log("[Aether import] Xong:\n" + report);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }

        public static ImportReport Run(string src, bool interactive)
        {
            var report = new ImportReport();
            var sw = Stopwatch.StartNew();
            bool Progress(string what, float t)
            {
                if (!interactive) return false;
                return EditorUtility.DisplayCancelableProgressBar("Aether — nhập dữ liệu", what, t);
            }
            try
            {
                EnsureSortingAxis();
                ImportUtil.EnsureFolder(ImportUtil.Root);
                AssetDatabase.DisallowAutoRefresh();
                try
                {
                    Progress("Giao diện", 0);
                    UiImporter.ImportAll(src, report);
                    Progress("Hiệu ứng", 0);
                    VfxImporter.ImportAll(src, report);
                    CharacterImporter.ImportAll(src, report, Progress);
                    MapImporter.ImportAll(src, report, Progress);
                }
                finally
                {
                    AssetDatabase.AllowAutoRefresh();
                }
                AssetDatabase.SaveAssets();
            }
            finally
            {
                if (interactive) EditorUtility.ClearProgressBar();
            }
            report.Count("Thời gian (giây)", (int)Math.Round(sw.Elapsed.TotalSeconds));
            Debug.Log("[Aether import] " + src + "\n" + report);
            return report;
        }

        /// <summary>
        /// Sort 2D theo trục y (chân thấp hơn vẽ đè lên): CustomAxis (0, 1, 0) cho pipeline Built-in. Dùng URP 2D thì đặt cùng
        /// giá trị trong Renderer2DData (Transparency Sort Mode).
        /// </summary>
        private static void EnsureSortingAxis()
        {
            if (GraphicsSettings.transparencySortMode == TransparencySortMode.CustomAxis && GraphicsSettings.transparencySortAxis == new Vector3(0, 1, 0)) return;
            GraphicsSettings.transparencySortMode = TransparencySortMode.CustomAxis;
            GraphicsSettings.transparencySortAxis = new Vector3(0, 1, 0);
        }

        private static string ArgValue(string name)
        {
            var args = Environment.GetCommandLineArgs();
            for (var i = 0; i < args.Length - 1; i += 1)
                if (args[i] == name) return args[i + 1];
            return null;
        }
    }
}
