using HavenLord.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>Whole-character animation controls in the skill lab.</summary>
    public sealed class LabCharacterPanel : MonoBehaviour
    {
        private GameController game;
        private RectTransform panel;
        private CanvasGroup visibility;
        private Image swordBg, staffBg;
        private readonly Image[] directionImages = new Image[8];
        private TMP_Text state;
        public PressArea SwordButton { get; private set; }
        public PressArea StaffButton { get; private set; }
        public PressArea AttackButton { get; private set; }
        public PressArea[] DirectionButtons { get; private set; }

        public static LabCharacterPanel Create(RectTransform parent, GameController game)
        {
            var root = UiKit.Rect(parent, "LabCharacterOptions", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-16, -266), new Vector2(264, 312));
            UiStyle.Card(root, UiStyle.CardKind.Hud, 5, false, true);
            var result = root.gameObject.AddComponent<LabCharacterPanel>();
            result.game = game; result.panel = root; result.visibility = UiKit.Group(root);
            result.Build(); return result;
        }

        public bool ContainsScreenPoint(Vector2 at) => panel != null && panel.gameObject.activeInHierarchy && RectTransformUtility.RectangleContainsScreenPoint(panel, at, null);

        private PressArea Choice(string name, string label, Vector2 position, Vector2 size, System.Action click, out Image bg)
        {
            var rect = UiKit.Rect(panel, name, new Vector2(0, 1), new Vector2(0, 1), position, size);
            bg = UiStyle.Pill(rect, UiKit.Ink, 8);
            UiKit.Label(UiKit.Stretch(rect, "Label"), label, 12, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            return UiKit.Press(rect, click);
        }

        private void Build()
        {
            UiKit.Label(UiKit.Rect(panel, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -10), new Vector2(240, 26)), "LỮ KHÁCH · KIẾM / TRƯỢNG", 15, UiKit.Gold);
            SwordButton = Choice("Sword", "Kiếm · chém", new Vector2(12, -46), new Vector2(116, 32), () => game.SelectIntegratedWeapon("sword"), out swordBg);
            StaffButton = Choice("Staff", "Trượng · niệm", new Vector2(136, -46), new Vector2(116, 32), () => game.SelectIntegratedWeapon("staff"), out staffBg);
            DirectionButtons = new PressArea[8];
            var order = new[] { 3, 4, 5, 2, -1, 6, 1, 0, 7 };
            var names = new[] { "Nam", "Tây Nam", "Tây", "Tây Bắc", "Bắc", "Đông Bắc", "Đông", "Đông Nam" };
            for (var i = 0; i < order.Length; i++)
            {
                var direction = order[i];
                var button = Choice("Direction" + direction, direction < 0 ? "Đứng" : names[direction], new Vector2(12 + i % 3 * 82, -94 - i / 3 * 32), new Vector2(76, 28),
                    () => game.FaceLabDirection(direction < 0 ? game.Player.View.Direction : (Dir8)direction), out var background);
                if (direction >= 0) { DirectionButtons[direction] = button; directionImages[direction] = background; }
            }
            AttackButton = Choice("Attack", "Thử đòn đang cầm", new Vector2(12, -202), new Vector2(240, 30), () => { if (!game.LabCharacterBusy) game.TapSlot(0); }, out _);
            state = UiKit.Label(UiKit.Rect(panel, "State", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -240), new Vector2(240, 20)), "", 11, UiKit.Gold);
            UiKit.Label(UiKit.Rect(panel, "Controls", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -266), new Vector2(240, 36)), "WASD đi · Shift chạy · Chuột trái đánh", 10, UiKit.TextDim);
        }

        private void LateUpdate()
        {
            if (game == null || game.Player == null) return;
            var hidden = game.MainPanelOpen;
            visibility.alpha = hidden ? 0 : 1; visibility.blocksRaycasts = !hidden; visibility.interactable = !hidden && !game.LabCharacterBusy;
            var selected = UiStyle.Hex(0x80602c);
            swordBg.color = game.IntegratedHeld == "sword" ? selected : UiKit.Ink;
            staffBg.color = game.IntegratedHeld == "staff" ? selected : UiKit.Ink;
            for (var d = 0; d < 8; d++) directionImages[d].color = d == (int)game.Player.View.Direction ? selected : UiKit.Ink;
            state.text = game.LabCharacterBusy ? "Đang thi triển" : game.IntegratedHeld == "staff" ? "Trượng · phép Haven" : game.IntegratedHeld == "sword" ? "Kiếm · chém" : "Tay không";
        }
    }
}
