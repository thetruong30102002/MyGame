using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>Lựa chọn demo trong phòng Thử chiêu; dùng cùng thao tác chọn nhân vật/vũ khí của controller.</summary>
    public sealed class LabCharacterPanel : MonoBehaviour
    {
        private GameController game;
        private RectTransform panel;
        private Image originalBg, newBg, swordBg, staffBg;
        private CanvasGroup choices, weapons;
        private CanvasGroup garments;
        private TMP_Text[] garmentLabels;
        private string[] shownGarments;
        private RectTransform directionRoot;
        private Image clothingTabBg, directionTabBg;
        private Image[] directionImages;
        private bool directionsShown;
        private int shownDirection = -1;
        private TMP_Text state;
        private bool drawn, shownNew, shownBusy;
        private string shownWeapon, shownError;
        public PressArea NewCharacterButton { get; private set; }
        public PressArea OriginalCharacterButton { get; private set; }
        public PressArea SwordButton { get; private set; }
        public PressArea StaffButton { get; private set; }
        public PressArea AttackButton { get; private set; }
        public PressArea[] GarmentButtons { get; private set; }
        public PressArea[] DirectionButtons { get; private set; }
        public PressArea DirectionTab { get; private set; }
        public PressArea ClothingTab { get; private set; }

        public static LabCharacterPanel Create(RectTransform parent, GameController game)
        {
            var root = UiKit.Rect(parent, "LabCharacterOptions", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-16, -266), new Vector2(264, 242));
            UiStyle.Pill(root, new Color(0.07f, 0.045f, 0.025f, 0.94f), 14).raycastTarget = true;
            var result = root.gameObject.AddComponent<LabCharacterPanel>();
            result.game = game; result.panel = root;
            result.Build(); result.Refresh();
            return result;
        }

        public bool ContainsScreenPoint(Vector2 at) => panel != null && panel.gameObject.activeInHierarchy && RectTransformUtility.RectangleContainsScreenPoint(panel, at, null);

        private void Text(string name, string value, float y, float height, float size, Color color)
        {
            UiKit.Label(UiKit.Rect(panel, name, new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, y), new Vector2(240, height)), value, size, color);
        }

        private PressArea Choice(RectTransform parent, string name, string label, float x, float y, System.Action click, out Image bg)
        {
            var rect = UiKit.Rect(parent, name, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, y), new Vector2(116, 32));
            bg = UiStyle.Pill(rect, UiKit.Ink, 9);
            UiKit.Label(UiKit.Stretch(rect, "Label"), label, 12, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            return UiKit.Press(rect, click);
        }

        private void Build()
        {
            var slots = MannequinView.Data?.garmentSlots;
            var garmentCount = slots == null ? 0 : slots.Length;
            var extraHeight = garmentCount == 0 ? 0 : 24 + garmentCount * 32;
            panel.sizeDelta = new Vector2(264, 242 + extraHeight);
            Text("Title", "THỬ NHÂN VẬT", -10, 22, 15, UiKit.Gold);
            var characterRow = UiKit.Rect(panel, "Characters", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -40), new Vector2(240, 32));
            choices = UiKit.Group(characterRow);
            OriginalCharacterButton = Choice(characterRow, "Original", "Nhân vật gốc", 0, 0, () => game.SelectLabCharacter(false), out originalBg);
            NewCharacterButton = Choice(characterRow, "NewCharacter", "Ngân Lam mới", 124, 0, () => game.SelectLabCharacter(true), out newBg);
            Text("WeaponTitle", "Vũ khí ghép rời", -80, 18, 12, UiKit.TextDim);
            var weaponRow = UiKit.Rect(panel, "Weapons", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -104), new Vector2(240, 32));
            weapons = UiKit.Group(weaponRow);
            SwordButton = Choice(weaponRow, "Sword", "Kiếm · chém", 0, 0, () => ChooseWeapon("sword"), out swordBg);
            StaffButton = Choice(weaponRow, "Staff", "Trượng · niệm", 124, 0, () => ChooseWeapon("staff"), out staffBg);
            GarmentButtons = new PressArea[garmentCount];
            garmentLabels = new TMP_Text[garmentCount]; shownGarments = new string[garmentCount];
            var garmentRoot = UiKit.Rect(panel, "Clothing", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -164), new Vector2(240, garmentCount * 32));
            garments = UiKit.Group(garmentRoot);
            if (garmentCount > 0)
            {
                ClothingTab = ModeTab("Phối đồ", 12, false, out clothingTabBg);
                DirectionTab = ModeTab("Xem 8 hướng", 136, true, out directionTabBg);
                BuildDirections();
            }
            for (var i = 0; i < garmentCount; i++)
            {
                var slot = i;
                var button = UiKit.Rect(garmentRoot, slots[i].id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -i * 32), new Vector2(240, 28));
                UiStyle.Pill(button, UiStyle.Hex(0x3a3024), 9);
                garmentLabels[i] = UiKit.Label(UiKit.Stretch(button, "Label"), slots[i].name + "  ·  Chọn nhân vật mới", 12, UiStyle.Parchment, TextAnchor.MiddleCenter);
                GarmentButtons[i] = UiKit.Press(button, () => CycleGarment(slot));
            }
            var attack = UiKit.Rect(panel, "Attack", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -144 - extraHeight), new Vector2(240, 30));
            UiStyle.Pill(attack, UiStyle.Hex(0x68512b), 9);
            UiKit.Label(UiKit.Stretch(attack, "Label"), "Thử đòn đang cầm", 12, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            AttackButton = UiKit.Press(attack, () => { if (!game.LabCharacterBusy && game.LabMannequin != null) game.TapSlot(0); });
            state = UiKit.Label(UiKit.Rect(panel, "State", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -180 - extraHeight), new Vector2(240, 20)), "", 11, UiKit.Gold);
            Text("Controls", "WASD đi · Shift chạy · Chuột trái đánh\nTab chọn mục tiêu", -205 - extraHeight, 30, 10, UiKit.TextDim);
        }

        private PressArea ModeTab(string label, float x, bool directions, out Image bg)
        {
            var rect = UiKit.Rect(panel, label, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -140), new Vector2(116, 20));
            bg = UiStyle.Pill(rect, UiKit.Ink, 7);
            UiKit.Label(UiKit.Stretch(rect, "Label"), label, 11, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            return UiKit.Press(rect, () => { directionsShown = directions; drawn = false; });
        }

        private void BuildDirections()
        {
            directionRoot = UiKit.Rect(panel, "EightDirections", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -164), new Vector2(240, 96));
            DirectionButtons = new PressArea[8]; directionImages = new Image[8];
            var order = new[] { 3, 4, 5, 2, -1, 6, 1, 0, 7 };
            var names = new[] { "Nam", "Tây Nam", "Tây", "Tây Bắc", "Bắc", "Đông Bắc", "Đông", "Đông Nam" };
            for (var i = 0; i < order.Length; i++)
            {
                var dir = order[i];
                var rect = UiKit.Rect(directionRoot, "Direction" + dir, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i % 3 * 82, -i / 3 * 32), new Vector2(76, 28));
                var bg = UiStyle.Pill(rect, UiKit.Ink, 8);
                UiKit.Label(UiKit.Stretch(rect, "Label"), dir < 0 ? "Đứng" : names[dir], 10, UiStyle.Parchment, TextAnchor.MiddleCenter);
                var button = UiKit.Press(rect, () => game.FaceLabDirection(dir < 0 ? game.Player.View.Direction : (Aether.Data.Dir8)dir));
                if (dir >= 0) { DirectionButtons[dir] = button; directionImages[dir] = bg; }
            }
        }

        private void CycleGarment(int slot)
        {
            var view = game.LabMannequin;
            if (game.LabCharacterBusy || view == null || !view.HasGarments) return;
            var items = MannequinView.Data.garmentSlots[slot].items;
            for (var i = 0; i < items.Length; i++)
                if (items[i].id == view.GarmentId(slot)) { game.SelectMannequinGarment(slot, (i + 1) % items.Length); return; }
        }

        private void ChooseWeapon(string id)
        {
            if (game.LabCharacterBusy || game.LabMannequin == null) return;
            for (var i = 0; i < MannequinView.Data.weapons.Length; i++)
                if (MannequinView.Data.weapons[i].id == id) { game.SelectMannequinWeapon(i); return; }
        }

        private void LateUpdate() => Refresh();

        private void Refresh()
        {
            var active = game.LabMannequin != null;
            var busy = game.LabCharacterBusy;
            var weapon = active ? game.LabMannequin.SelectedWeapon.id : null;
            var error = game.LabCharacterError;
            var direction = game.Player == null ? -1 : (int)game.Player.View.Direction;
            var clothesChanged = false;
            for (var i = 0; i < shownGarments.Length; i++)
                if (shownGarments[i] != (active ? game.LabMannequin.GarmentId(i) : null)) clothesChanged = true;
            if (drawn && direction == shownDirection && !clothesChanged && active == shownNew && busy == shownBusy && weapon == shownWeapon && error == shownError) return;
            shownDirection = direction;
            drawn = true; shownNew = active; shownBusy = busy; shownWeapon = weapon; shownError = error;
            var selected = UiStyle.Hex(0x80602c);
            originalBg.color = active ? UiKit.Ink : selected;
            newBg.color = active ? selected : UiKit.Ink;
            swordBg.color = weapon == "sword" ? selected : UiKit.Ink;
            staffBg.color = weapon == "staff" ? selected : UiKit.Ink;
            choices.alpha = busy ? 0.5f : 1;
            weapons.alpha = active && !busy ? 1 : 0.4f;
            garments.alpha = active && !busy ? 1 : 0.4f;
            if (directionRoot != null)
            {
                directionRoot.gameObject.SetActive(directionsShown);
                garments.gameObject.SetActive(!directionsShown);
                UiKit.Group(directionRoot).alpha = active && !busy ? 1 : 0.4f;
                clothingTabBg.color = directionsShown ? UiKit.Ink : selected;
                directionTabBg.color = directionsShown ? selected : UiKit.Ink;
                for (var i = 0; i < 8; i++) directionImages[i].color = i == direction ? selected : UiKit.Ink;
            }
            for (var i = 0; i < shownGarments.Length; i++)
            {
                shownGarments[i] = active ? game.LabMannequin.GarmentId(i) : null;
                garmentLabels[i].text = MannequinView.Data.garmentSlots[i].name + "  ·  " + (active ? game.LabMannequin.GarmentName(i) + "  ›" : "Chọn nhân vật mới");
            }
            state.text = error ?? (busy ? "Đang tấn công · chờ để đổi" : active ? "Bộ Ngân Lam · " + (weapon == "staff" ? "Trượng Aether" : "Kiếm Nguyệt Cương") : "Chọn Ngân Lam mới để thử ghép vũ khí");
        }
    }
}
