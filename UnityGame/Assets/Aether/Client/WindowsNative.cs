using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace Aether.Client
{
    /// <summary>
    /// Windows updater primitives. Unity 6000.3 IL2CPP does not implement
    /// System.Diagnostics.Process.Start; call the operating system directly.
    /// </summary>
    internal static class WindowsNative
    {
        public static string CommandProcessor => Path.Combine(Environment.SystemDirectory, "cmd.exe");
        public static string PowerShell => Path.Combine(Environment.SystemDirectory, @"WindowsPowerShell\v1.0\powershell.exe");

        /// <summary>Quote one Windows argv argument; shell command bodies use their own quoting.</summary>
        public static string Argument(string value)
        {
            var b = new StringBuilder("\"");
            var slashes = 0;
            foreach (var c in value ?? "")
            {
                if (c == '\\') { slashes++; continue; }
                b.Append('\\', c == '"' ? slashes * 2 + 1 : slashes);
                b.Append(c); slashes = 0;
            }
            return b.Append('\\', slashes * 2).Append('"').ToString();
        }

        public static ChildProcess LaunchHidden(string executable, string arguments, string workingDirectory = null)
        {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
            executable = Path.GetFullPath(executable);
            var commandLine = new StringBuilder(Argument(executable) + " " + arguments);
            var startup = new StartupInfo { cb = (uint)Marshal.SizeOf(typeof(StartupInfo)), dwFlags = 1, wShowWindow = 0 };
            if (!CreateProcessW(executable, commandLine, IntPtr.Zero, IntPtr.Zero, false, 0x08000000,
                                IntPtr.Zero, workingDirectory, ref startup, out var process))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "CreateProcessW failed for " + executable);
            CloseHandle(process.hThread);
            return new ChildProcess(process.hProcess, process.dwProcessId);
#else
            throw new PlatformNotSupportedException("Windows native process launch is unavailable on this platform");
#endif
        }

        public static ChildProcess LaunchCommand(string command, string workingDirectory = null) =>
            LaunchHidden(CommandProcessor, "/d /s /c \"" + command + "\"", workingDirectory);

        /// <summary>Disposing closes our handle; the updater child keeps running after the game exits.</summary>
        internal sealed class ChildProcess : IDisposable
        {
            private IntPtr handle;
            public uint Id { get; }
            internal ChildProcess(IntPtr handle, uint id) { this.handle = handle; Id = id; }
            public bool TryGetExitCode(out uint code)
            {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
                if (handle == IntPtr.Zero) throw new ObjectDisposedException(nameof(ChildProcess));
                var wait = WaitForSingleObject(handle, 0);
                code = 0;
                if (wait == 258) return false;
                if (wait != 0 || !GetExitCodeProcess(handle, out code)) throw new Win32Exception(Marshal.GetLastWin32Error());
                return true;
#else
                code = 0; throw new PlatformNotSupportedException();
#endif
            }
            public void Dispose()
            {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
                if (handle != IntPtr.Zero) CloseHandle(handle);
#endif
                handle = IntPtr.Zero;
            }
        }

        public static void SetCurrentUserValues(string subkey, IDictionary<string, string> strings, IDictionary<string, uint> numbers)
        {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
            CheckRegistry(RegCreateKeyExW(CurrentUser, subkey, 0, null, 0, 2, IntPtr.Zero, out var key, out _));
            try
            {
                foreach (var pair in strings)
                {
                    var bytes = Encoding.Unicode.GetBytes(pair.Value + "\0");
                    CheckRegistry(RegSetValueExW(key, pair.Key, 0, 1, bytes, (uint)bytes.Length));
                }
                foreach (var pair in numbers)
                {
                    var bytes = BitConverter.GetBytes(pair.Value);
                    CheckRegistry(RegSetValueExW(key, pair.Key, 0, 4, bytes, 4));
                }
            }
            finally { RegCloseKey(key); }
#else
            throw new PlatformNotSupportedException("Windows native registry is unavailable on this platform");
#endif
        }

        internal static string ReadCurrentUserString(string subkey, string name)
        {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
            CheckRegistry(RegOpenKeyExW(CurrentUser, subkey, 0, 1, out var key));
            try
            {
                uint size = 0;
                CheckRegistry(RegQueryValueExW(key, name, IntPtr.Zero, out var type, null, ref size));
                if (type != 1) throw new InvalidDataException("Registry value is not REG_SZ");
                var bytes = new byte[size];
                CheckRegistry(RegQueryValueExW(key, name, IntPtr.Zero, out type, bytes, ref size));
                return Encoding.Unicode.GetString(bytes).TrimEnd('\0');
            }
            finally { RegCloseKey(key); }
#else
            throw new PlatformNotSupportedException();
#endif
        }

        internal static void DeleteCurrentUserKey(string subkey)
        {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
            var error = RegDeleteKeyW(CurrentUser, subkey);
            if (error != 2) CheckRegistry(error);
#else
            throw new PlatformNotSupportedException();
#endif
        }

#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        private static readonly IntPtr CurrentUser = new IntPtr(unchecked((int)0x80000001));
        private static void CheckRegistry(int error) { if (error != 0) throw new Win32Exception(error); }

        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfo
        {
            public uint cb;
            public IntPtr lpReserved, lpDesktop, lpTitle;
            public uint dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
            public ushort wShowWindow, cbReserved2;
            public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct ProcessInfo
        {
            public IntPtr hProcess, hThread;
            public uint dwProcessId, dwThreadId;
        }
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true, ExactSpelling = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CreateProcessW(string application, StringBuilder commandLine, IntPtr processAttributes,
            IntPtr threadAttributes, [MarshalAs(UnmanagedType.Bool)] bool inheritHandles, uint flags, IntPtr environment,
            string directory, ref StartupInfo startup, out ProcessInfo process);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr handle);
        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetExitCodeProcess(IntPtr handle, out uint code);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int RegCreateKeyExW(IntPtr root, string subkey, uint reserved, string keyClass, uint options,
            uint access, IntPtr security, out IntPtr key, out uint disposition);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int RegOpenKeyExW(IntPtr root, string subkey, uint options, uint access, out IntPtr key);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int RegSetValueExW(IntPtr key, string name, uint reserved, uint type, byte[] data, uint size);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int RegQueryValueExW(IntPtr key, string name, IntPtr reserved, out uint type, [Out] byte[] data, ref uint size);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int RegDeleteKeyW(IntPtr root, string subkey);
        [DllImport("advapi32.dll")]
        private static extern int RegCloseKey(IntPtr key);
#endif
    }
}
