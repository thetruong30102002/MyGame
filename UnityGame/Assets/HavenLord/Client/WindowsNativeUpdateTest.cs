using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// HavenLord.exe -havenNativeUpdateTest &lt;output directory&gt;
    /// Tests the real player/IL2CPP process and registry bridge, writes a receipt,
    /// then exits. It never installs files, launches another game or registers Apps.
    /// </summary>
    public sealed class WindowsNativeUpdateTest : MonoBehaviour
    {
        private string directory;
        private Task<JObject> test;
        private int build;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Boot()
        {
            if (Application.isEditor || Application.platform != RuntimePlatform.WindowsPlayer) return;
            var args = Environment.GetCommandLineArgs();
            var i = Array.IndexOf(args, "-havenNativeUpdateTest");
            if (i < 0) return;
            if (i + 1 >= args.Length) { Debug.LogError("Native updater test needs an output directory"); Application.Quit(1); return; }
            var go = new GameObject("Windows native updater verification");
            DontDestroyOnLoad(go);
            go.AddComponent<WindowsNativeUpdateTest>().directory = args[i + 1];
        }

        private void Start()
        {
            build = AutoUpdate.LocalBuild;
            test = Task.Run(() => VerifyBridge(directory));
        }

        private void Update()
        {
            if (test == null || !test.IsCompleted) return;
            var receipt = test.Status == TaskStatus.RanToCompletion ? test.Result :
                new JObject { ["passed"] = false, ["error"] = test.Exception?.GetBaseException().ToString() };
            receipt["build"] = build;
#if ENABLE_IL2CPP
            receipt["runtimeBackend"] = "IL2CPP";
#else
            receipt["runtimeBackend"] = "Mono";
#endif
            receipt["checkedAt"] = DateTime.UtcNow.ToString("o");
            var passed = (bool?)receipt["passed"] == true;
            try
            {
                Directory.CreateDirectory(directory);
                File.WriteAllText(Path.Combine(directory, "native-update-verification.json"), receipt.ToString() + "\n", new UTF8Encoding(false));
            }
            catch (Exception e) { Debug.LogError("Cannot save native updater receipt: " + e); passed = false; }
            Debug.Log("[HavenLord native update test] " + receipt);
            test = null;
            Application.Quit(passed ? 0 : 1);
        }

        private static JObject VerifyBridge(string output)
        {
            var receipt = new JObject { ["passed"] = false, ["productionInstallTouched"] = false, ["productionRegistrationTouched"] = false };
            var registryKey = @"Software\HavenLord\NativeUpdateTest\" + Guid.NewGuid().ToString("N");
            try
            {
                var work = Path.Combine(Path.GetFullPath(output), "child path thử with spaces");
                Directory.CreateDirectory(work);
                var script = Path.Combine(work, "child probe.cmd");
                var marker = Path.Combine(work, "child marker.txt");
                if (File.Exists(marker)) File.Delete(marker);
                File.WriteAllText(script, "@echo off\r\nchcp 65001 >nul\r\n>\"" + marker + "\" echo native-child-ok\r\nexit /b 37\r\n", new UTF8Encoding(false));
                uint code = 0;
                var exited = false;
                using (var child = WindowsNative.LaunchCommand("\"" + script + "\"", work))
                {
                    receipt["childProcessId"] = child.Id;
                    var until = DateTime.UtcNow.AddSeconds(30);
                    while (!(exited = child.TryGetExitCode(out code)) && DateTime.UtcNow < until) Thread.Sleep(20);
                }
                receipt["childExited"] = exited;
                receipt["childExitCode"] = code;
                receipt["childMarkerVerified"] = File.Exists(marker) && File.ReadAllText(marker).Trim() == "native-child-ok";
                var missingRejected = false;
                try { using (WindowsNative.LaunchHidden(Path.Combine(work, "does-not-exist.exe"), "")) { } }
                catch (Win32Exception e) { receipt["missingExecutableError"] = e.NativeErrorCode; missingRejected = e.NativeErrorCode == 2 || e.NativeErrorCode == 3; }
                receipt["missingExecutableRejected"] = missingRejected;

                const string value = "Haven Lord thử đường dẫn Unicode";
                WindowsNative.SetCurrentUserValues(registryKey, new Dictionary<string, string> { ["Probe"] = value },
                    new Dictionary<string, uint> { ["NoModify"] = 1 });
                receipt["registryUnicodeRoundTrip"] = WindowsNative.ReadCurrentUserString(registryKey, "Probe") == value;
                receipt["registryTestKey"] = registryKey;
                WindowsNative.DeleteCurrentUserKey(registryKey);
                receipt["registryTestKeyRemoved"] = true;
                receipt["passed"] = exited && code == 37 && (bool)receipt["childMarkerVerified"] && missingRejected && (bool)receipt["registryUnicodeRoundTrip"];
            }
            catch (Exception e) { receipt["error"] = e.ToString(); }
            finally
            {
                try { WindowsNative.DeleteCurrentUserKey(registryKey); }
                catch (Exception e) { receipt["cleanupError"] = e.Message; receipt["passed"] = false; }
            }
            return receipt;
        }
    }
}
