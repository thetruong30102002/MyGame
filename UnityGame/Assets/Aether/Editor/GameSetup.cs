using System;
using System.IO;
using System.Linq;
using Aether.Client;
using Aether.Data;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>
    /// Dựng phần chơi được từ dữ liệu đã nhập: GameDatabase (mục lục) + scene Game + thiết lập dự án + build Windows / Android.
    /// Dòng lệnh: -executeMethod Aether.Importer.GameSetup.SetupBatch | BuildWindowsBatch | BuildAndroidBatch
    /// </summary>
    public static class GameSetup
    {
        public const string DatabasePath = ImportUtil.Root + "/GameDatabase.asset";
        public const string ScenePath = "Assets/Aether/Scenes/Game.unity";
        private const string SimDir = "Assets/Aether/Data/Sim";
        private const string ClientDir = "Assets/Aether/Data/Client";
        private const string AdditivePath = ImportUtil.Root + "/Resources/VfxAdditive.mat";

        public static string BuildDir => Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Build"));

        [MenuItem("Aether/Dựng GameDatabase + scene chơi", priority = 5)]
        public static void SetupMenu()
        {
            Setup();
            EditorSceneManager.OpenScene(ScenePath);
        }

        [MenuItem("Aether/Build Windows", priority = 40)]
        private static void BuildWindowsMenu() => BuildWindows();

        [MenuItem("Aether/Build Android (APK)", priority = 41)]
        private static void BuildAndroidMenu() => BuildAndroid();

        [MenuItem("Aether/Build iOS (project Xcode)", priority = 42)]
        private static void BuildIosMenu() => BuildIos();

        public static void SetupBatch() => Batch(Setup);

        /// <summary>CI (GitHub Actions): máy sạch chưa có `Imported/` nên nhập từ `assets/` rồi mới dựng + xuất Xcode.</summary>
        public static void BuildIosCiBatch() => Batch(() =>
        {
            var src = PipelineImportMenu.SourceDir;
            PipelineImportMenu.Run(src, false);
            Setup();
            if (!BuildIos()) throw new Exception("Build iOS lỗi");
        });

        public static void BuildIosBatch() => Batch(() =>
        {
            Setup();
            if (!BuildIos()) throw new Exception("Build iOS lỗi");
        });

        public static void BuildWindowsBatch() => Batch(() =>
        {
            Setup();
            if (!BuildWindows()) throw new Exception("Build Windows lỗi");
        });

        public static void BuildAndroidBatch() => Batch(() =>
        {
            Setup();
            if (!BuildAndroid()) throw new Exception("Build Android lỗi");
        });

        private static void Batch(Action a)
        {
            try
            {
                a();
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }

        public static void Setup()
        {
            EnsureTmpResources();
            ConfigureProject();
            var db = BuildDatabase();
            BuildScene(db);
            AssetDatabase.SaveAssets();
        }

        public static GameDatabase BuildDatabase()
        {
            var db = ImportUtil.LoadOrCreate<GameDatabase>(DatabasePath);
            db.characterIds = FindAll<CharacterDef>(CharacterImporter.CharactersFolder).Select(c => c.id).OrderBy(c => c, StringComparer.Ordinal).ToList();
            db.regions = FindAll<WorldIndex>(ImportUtil.Root).OrderBy(r => r.region, StringComparer.Ordinal).ToList();
            db.vfx = FindAll<VfxDef>(ImportUtil.Root).OrderBy(v => v.atlasId, StringComparer.Ordinal).ToList();
            db.uiSets = FindAll<UiSpriteSet>(ImportUtil.Root).OrderBy(u => u.name, StringComparer.Ordinal).ToList();
            db.simModules = FindAll<TextAsset>(SimDir).OrderBy(t => t.name, StringComparer.Ordinal).ToList();
            db.tempArt = AssetDatabase.LoadAssetAtPath<TextAsset>(ClientDir + "/tempArt.json");
            db.npcs = AssetDatabase.LoadAssetAtPath<TextAsset>(ClientDir + "/npcs.json");
            EnsureAdditiveMaterial();
            if (db.Region(db.startRegion) == null && db.regions.Count > 0) db.startRegion = db.regions[0].region;
            EditorUtility.SetDirty(db);
            Debug.Log($"[Aether] GameDatabase: {db.characterIds.Count} nhân vật, {db.regions.Count} vùng, {db.vfx.Count} atlas hiệu ứng, {db.simModules.Count} module luật");
            return db;
        }

        /// <summary>
        /// TextMeshPro (trong gói uGUI 2.0 của Unity 6) cần "TMP Essential Resources" (shader SDF, TMP Settings) trong Assets — nhập
        /// một lần từ chính gói, không tải gì thêm. Font chữ game (Inter, đủ dấu tiếng Việt) dựng font asset động lúc chạy (UiKit).
        /// </summary>
        private static void EnsureTmpResources()
        {
            if (AssetDatabase.IsValidFolder("Assets/TextMesh Pro")) return;
            var pkg = Path.GetFullPath("Packages/com.unity.ugui/Package Resources/TMP Essential Resources.unitypackage");
            if (!File.Exists(pkg))
            {
                Debug.LogWarning("[Aether] Không thấy TMP Essential Resources: " + pkg);
                return;
            }
            AssetDatabase.ImportPackage(pkg, false);
            AssetDatabase.Refresh();
        }

        /// <summary>Vật liệu cộng sáng cho hiệu ứng `blend: 'add'` — asset trong Resources để shader được đóng vào bản build.</summary>
        private static void EnsureAdditiveMaterial()
        {
            if (AssetDatabase.LoadAssetAtPath<Material>(AdditivePath) != null) return;
            var shader = Shader.Find("Legacy Shaders/Particles/Additive") ?? Shader.Find("Sprites/Default");
            ImportUtil.EnsureFolder(Path.GetDirectoryName(AdditivePath));
            AssetDatabase.CreateAsset(new Material(shader) { name = "VfxAdditive" }, AdditivePath);
        }

        private static T[] FindAll<T>(string folder) where T : UnityEngine.Object =>
            AssetDatabase.FindAssets("t:" + typeof(T).Name, new[] { folder })
                .Select(g => AssetDatabase.LoadAssetAtPath<T>(AssetDatabase.GUIDToAssetPath(g)))
                .Where(a => a != null)
                .ToArray();

        public static void BuildScene(GameDatabase db)
        {
            ImportUtil.EnsureFolder(Path.GetDirectoryName(ScenePath));
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            camGo.AddComponent<PixelCamera>();
            camGo.transform.position = new Vector3(0, 0, -10);

            var game = new GameObject("Game");
            var input = game.AddComponent<GameInput>();
            var ctl = game.AddComponent<GameController>();
            var so = new SerializedObject(ctl);
            so.FindProperty("database").objectReferenceValue = db;
            so.FindProperty("pixelCamera").objectReferenceValue = camGo.GetComponent<PixelCamera>();
            so.FindProperty("input").objectReferenceValue = input;
            so.ApplyModifiedPropertiesWithoutUndo();
            ctl.enabled = false;

            var login = game.AddComponent<LoginScreen>();
            var lso = new SerializedObject(login);
            lso.FindProperty("game").objectReferenceValue = ctl;
            lso.FindProperty("database").objectReferenceValue = db;
            lso.ApplyModifiedPropertiesWithoutUndo();

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }

        /// <summary>Tên / id ứng dụng, Input Manager cũ, IL2CPP ARM64 cho Android, sort 2D theo trục y.</summary>
        public static void ConfigureProject()
        {
            PlayerSettings.companyName = "nttrg";
            PlayerSettings.productName = "Aether";
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Android, "com.nttrg.aether");
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.iOS, "com.nttrg.aether");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.runInBackground = true;
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.defaultScreenWidth = 1600;
            PlayerSettings.defaultScreenHeight = 900;
            PlayerSettings.resizableWindow = true;

            // Windows: IL2CPP (11/10/2026 — code thành mã máy, khó dịch ngược hơn DLL Mono; cần MSVC: Build Tools C++ ở D:\VS\BuildTools,
            // docs/ban-quyen.md). Android: IL2CPP + ARM64 (Google Play bắt 64-bit). Stripping Minimal như Android (Newtonsoft dùng phản chiếu).
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Standalone, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetManagedStrippingLevel(UnityEditor.Build.NamedBuildTarget.Standalone, ManagedStrippingLevel.Minimal);
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel25;
            PlayerSettings.SetManagedStrippingLevel(UnityEditor.Build.NamedBuildTarget.Android, ManagedStrippingLevel.Minimal);

            // Input Manager cũ (GameInput dùng UnityEngine.Input) — 0 = Old, 2 = Both.
            var ps = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset").FirstOrDefault();
            if (ps != null)
            {
                var so = new SerializedObject(ps);
                var p = so.FindProperty("activeInputHandler");
                if (p != null && p.intValue == 1)
                {
                    p.intValue = 0;
                    so.ApplyModifiedPropertiesWithoutUndo();
                }
            }

            UnityEngine.Rendering.GraphicsSettings.transparencySortMode = TransparencySortMode.CustomAxis;
            UnityEngine.Rendering.GraphicsSettings.transparencySortAxis = new Vector3(0, 1, 0);
        }

        public static bool BuildWindows() =>
            Build(BuildTarget.StandaloneWindows64, Path.Combine(BuildDir, "Windows", "Aether.exe"));

        public static bool BuildAndroid()
        {
            EditorUserBuildSettings.buildAppBundle = false;
            return Build(BuildTarget.Android, Path.Combine(BuildDir, "Android", "Aether.apk"));
        }

        /// <summary>Windows không ra được .ipa: xuất project Xcode, máy Mac mở `Unity-iPhone.xcodeproj` rồi Archive → .ipa.</summary>
        public static bool BuildIos()
        {
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.iOS, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetManagedStrippingLevel(UnityEditor.Build.NamedBuildTarget.iOS, ManagedStrippingLevel.Minimal);
            PlayerSettings.iOS.targetOSVersionString = "13.0";
            return Build(BuildTarget.iOS, Path.Combine(BuildDir, "iOS"));
        }

        /// <summary>
        /// Số bản = phút kể từ 01/01/2026 UTC lúc build — luôn tăng, vừa `bundleVersionCode` Android. Client tự cập nhật so số này
        /// (`AutoUpdate.LocalBuild` đọc phần cuối `Application.version`); `UnityGame/Tools~/publish-client.mts` đọc file `&lt;nền tảng&gt;.build.json`.
        /// </summary>
        private static int StampBuild()
        {
            var build = (int)(DateTime.UtcNow - new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMinutes;
            PlayerSettings.bundleVersion = $"1.0.{build}";
            PlayerSettings.Android.bundleVersionCode = build;
            PlayerSettings.iOS.buildNumber = build.ToString();
            return build;
        }

        private static bool Build(BuildTarget target, string output)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            var build = StampBuild();
            var opts = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = output,
                target = target,
                targetGroup = BuildPipeline.GetBuildTargetGroup(target),
                // PC để ảnh lớn không nén (giữ nét pixel) → dữ liệu thô 2,3GB; nén LZ4HC cả gói lúc build (giải nén nhanh khi nạp) cho bản
                // phát bạn bè tải về (build thử: AETHER_FAST_BUILD=1 bỏ nén cho nhanh). Android đã nén ASTC.
                options = target == BuildTarget.StandaloneWindows64 && Environment.GetEnvironmentVariable("AETHER_TRIAL_BUILD") == "1" ? BuildOptions.CompressWithLz4 : target == BuildTarget.StandaloneWindows64 && Environment.GetEnvironmentVariable("AETHER_FAST_BUILD") != "1" ? BuildOptions.CompressWithLz4HC : BuildOptions.None,
            };
            var report = BuildPipeline.BuildPlayer(opts);
            var s = report.summary;
            Debug.Log($"[Aether build] {target}: {s.result}, {s.totalSize / 1048576f:0.0} MB, {s.totalTime.TotalSeconds:0}s, lỗi {s.totalErrors}, bản {build} → {output}");
            if (s.result != BuildResult.Succeeded) return false;
            var platform = target == BuildTarget.Android ? "android" : target == BuildTarget.iOS ? "ios" : "windows";
            File.WriteAllText(Path.Combine(BuildDir, platform + ".build.json"),
                $"{{\"build\": {build}, \"version\": \"{DateTime.Now:yyyy.MM.dd-HHmm}\", \"output\": \"{output.Replace('\\', '/')}\"}}\n");
            return true;
        }
    }
}
