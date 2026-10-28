using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>Bảng nhân vật ở phòng Thử chiêu: đổi kiếm / trượng liền thân, xoay 8 hướng, thử đòn đang cầm.</summary>
    public sealed partial class GameController
    {
        public const string IntegratedCharacterId = "player_integrated";
        public UI.LabCharacterPanel LabCharacterOptions { get; private set; }
        public bool MainPanelOpen => hud?.Panels?.Open ?? false;
        public bool LabCharacterBusy => player == null || player.View.Busy || combat.Acting;
        public string IntegratedHeld => player?.View.Held;

        private bool OverLabPanel(Vector2 at) => InLab && LabCharacterOptions != null && LabCharacterOptions.ContainsScreenPoint(at);

        public bool SelectIntegratedWeapon(string held)
        {
            if (!InLab || LabCharacterBusy || (held != "sword" && held != "staff")) return false;
            stance = held == "staff" ? "magic" : "melee";
            UpdateHeld();
            // Phòng thử chọn chiêu cơ bản chuẩn, không đổi túi đồ hay chỉ số cộng thêm.
            if (loadout.Count > 0) loadout[0] = held == "staff" ? "aether_bolt" : "slash";
            return player.View.Held == held;
        }

        public bool FaceLabDirection(Dir8 dir)
        {
            if (!InLab || LabCharacterBusy || (int)dir < 0 || (int)dir >= 8) return false;
            player.View.Set("idle", dir);
            return true;
        }
    }
}
