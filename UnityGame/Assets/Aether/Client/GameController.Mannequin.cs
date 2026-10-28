using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    public sealed partial class GameController
    {
        public const string IntegratedCharacterId = "player_integrated";
        // Compatibility surface for archived lab tests. No modular view is attached.
        private MannequinView mannequin;
        public MannequinView LabMannequin => null;
        public UI.LabCharacterPanel LabCharacterOptions { get; private set; }
        public bool MainPanelOpen => hud?.Panels?.Open ?? false;
        public bool LabCharacterBusy => player == null || player.View.Busy || combat.Acting || (SwordTrialActive && swordTrial.Playing);
        public string LabCharacterError => null;
        public int AppearanceHair => 0;
        public bool AppearanceFemale => personaFemale;
        public string IntegratedHeld => player?.View.Held;

        // Old saved appearance settings never select a different visual model.
        private void ApplySavedAppearance() { }
        private void SyncMannequinGear() { }
        private void TickMannequinLab() { }
        public Actor CreateAppearancePreview() => null;
        public bool ChangeHair(int index) => false;
        public bool SelectLabCharacter(bool prototype) => false;
        public bool ToggleMannequin() => false;
        public bool SelectMannequinIdentity(int index) => false;
        public bool SelectMannequinOutfit(int index) => false;
        public bool SelectMannequinGarment(int slot, int index) => false;
        public bool SelectMannequinWeapon(int index) => SelectIntegratedWeapon(index == 0 ? "sword" : index == 1 ? "staff" : null);

        private bool OverMannequinPanel(Vector2 at) => InLab && LabCharacterOptions != null && LabCharacterOptions.ContainsScreenPoint(at);

        public bool SelectIntegratedWeapon(string held)
        {
            if (!InLab || LabCharacterBusy || (held != "sword" && held != "staff")) return false;
            if (SwordWardrobeActive) ToggleSwordWardrobe();
            if (SwordTrialActive) ToggleSwordTrial();
            if (PlayerRigActive) TogglePlayerRig();
            stance = held == "staff" ? "magic" : "melee";
            UpdateHeld();
            // The lab chooses the standard basic skill without changing inventory or bonuses.
            if (loadout.Count > 0) loadout[0] = held == "staff" ? "aether_bolt" : "slash";
            return player.View.Held == held;
        }

        public bool FaceLabDirection(Dir8 dir)
        {
            if (!InLab || LabCharacterBusy || (int)dir < 0 || (int)dir >= 8) return false;
            player.View.Set("idle", dir);
            if (SwordTrialActive) swordTrial.Face(dir);
            return true;
        }
    }
}
