using UnityEngine;

namespace Aether.Client
{
    public sealed partial class GameController
    {
        private MannequinView mannequin;
        private string mannequinOldCharacter, mannequinOldPrimary;
        private int mannequinIdentity, mannequinOutfit, mannequinWeapon;
        private string mannequinError;
        public MannequinView LabMannequin => mannequin;
        public UI.LabCharacterPanel LabCharacterOptions { get; private set; }
        public bool LabCharacterBusy => player == null || player.View.Busy || combat.Acting;
        public string LabCharacterError => mannequinError;
        public bool SelectLabCharacter(bool prototype) => InLab && !LabCharacterBusy && ((mannequin != null) == prototype || ToggleMannequin());

        private Aether.Data.CharacterDef MannequinDefinition(string id) =>
            Resources.Load<Aether.Data.CharacterDef>("Mannequin/" + id + "/definition") ?? database.Character(id);

        private bool OverMannequinPanel(Vector2 at) => InLab && LabCharacterOptions != null && LabCharacterOptions.ContainsScreenPoint(at);

        private void TickMannequinLab()
        {
            if (!InLab || GameInput.Typing) return;
            if (UnityEngine.Input.GetKeyDown(KeyCode.F6)) ToggleMannequin();
            if (mannequin == null || player.View.Busy || combat.Acting) return;
            if (UnityEngine.Input.GetKeyDown(KeyCode.F7)) SelectMannequinIdentity((mannequinIdentity + 1) % MannequinView.Data.identities.Length);
            if (MannequinView.Data.outfits.Length > 1 && UnityEngine.Input.GetKeyDown(KeyCode.F8)) SelectMannequinOutfit((mannequinOutfit + 1) % MannequinView.Data.outfits.Length);
            if (UnityEngine.Input.GetKeyDown(KeyCode.F9)) SelectMannequinWeapon((mannequinWeapon + 1) % MannequinView.Data.weapons.Length);
            if (UnityEngine.Input.GetKeyDown(KeyCode.F10)) mannequin.ToggleHair();
            if (UnityEngine.Input.GetKeyDown(KeyCode.F11)) mannequin.DebugAnchors = !mannequin.DebugAnchors;
        }

        public bool ToggleMannequin()
        {
            if (!InLab || player == null || player.View.Busy || combat.Acting) return false;
            if (mannequin != null)
            {
                mannequin.Detach();
                mannequin = null;
                player.View.Init(database.Character(mannequinOldCharacter));
                loadout[0] = mannequinOldPrimary;
                UpdateHeld();
                mannequinError = null;
                return true;
            }
            var data = MannequinView.Data;
            if (data == null) { mannequinError = "Bản game này chưa có dữ liệu nhân vật demo"; return false; }
            mannequinOldCharacter = player.View.Def.id;
            mannequinOldPrimary = loadout[0];
            var prototypeDef = MannequinDefinition(data.identities[0].id);
            if (prototypeDef == null) { mannequinError = "Không nạp được nhân vật demo"; return false; }
            player.View.Init(prototypeDef);
            mannequin = MannequinView.Attach(player.View);
            if (mannequin == null)
            {
                player.View.Init(database.Character(mannequinOldCharacter));
                UpdateHeld();
                mannequinError = "Không nạp được atlas mannequin";
                return false;
            }
            mannequinIdentity = mannequinOutfit = mannequinWeapon = 0;
            mannequinError = null;
            loadout[0] = mannequin.SelectedWeapon.skill;
            return true;
        }

        public bool SelectMannequinIdentity(int index)
        {
            if (!InLab || mannequin == null || combat.Acting || player.View.Busy || index < 0 || index >= MannequinView.Data.identities.Length) return false;
            var id = MannequinView.Data.identities[index].id;
            var def = MannequinDefinition(id);
            if (def == null) return false;
            var old = player.View.Def;
            player.View.Init(def);
            if (!mannequin.Bind(id)) { player.View.Init(old); mannequin.Bind(old.id); return false; }
            mannequinIdentity = index;
            return true;
        }

        public bool SelectMannequinOutfit(int index)
        {
            if (!InLab || mannequin == null || combat.Acting || !mannequin.SelectOutfit(index)) return false;
            mannequinOutfit = index;
            return true;
        }

        public bool SelectMannequinWeapon(int index)
        {
            if (!InLab || mannequin == null || combat.Acting || !mannequin.SelectWeapon(index)) return false;
            mannequinWeapon = index;
            loadout[0] = mannequin.SelectedWeapon.skill;
            return true;
        }

        public bool SelectMannequinGarment(int slot, int index) => InLab && mannequin != null && !combat.Acting && mannequin.SelectGarment(slot, index);

        public bool FaceLabDirection(Aether.Data.Dir8 dir)
        {
            if (!InLab || mannequin == null || LabCharacterBusy || (int)dir < 0 || (int)dir >= 8) return false;
            player.View.Set("idle", dir);
            return true;
        }

    }
}
