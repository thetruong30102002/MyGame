using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab chuyển xuống ô nhập kế tiếp, Shift+Tab lùi lên (chủ dự án 28/10/2026: "các input thì nên cho tab để xuống dòng") — dùng chung
    /// mọi ô TMP_InputField (đăng nhập / đăng ký, quản trị, góp ý, bạn bè). Chỉ nhảy trong cụm gần nhất có từ 2 ô trở lên (cùng một
    /// form / bảng), thứ tự trên → dưới rồi trái → phải theo vị trí trên màn hình, hết thì vòng lại ô đầu. Ô nhiều dòng không giữ ký tự tab.
    /// Phím Tab "Đổi mục tiêu" không bắn khi đang gõ (GameInput.Typing).
    /// </summary>
    public sealed class InputTab : MonoBehaviour
    {
        // Hai ô lệch nhau dưới ngần này (điểm ảnh màn hình) theo chiều dọc coi như cùng hàng.
        private const float RowTolerance = 6f;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            var go = new GameObject("InputTab");
            DontDestroyOnLoad(go);
            go.AddComponent<InputTab>();
        }

        private void Update()
        {
            if (!Input.GetKeyDown(KeyCode.Tab)) return;
            var es = EventSystem.current;
            var current = es != null && es.currentSelectedGameObject != null ? es.currentSelectedGameObject.GetComponent<TMP_InputField>() : null;
            if (current == null || !current.isFocused) return;
            var group = Group(current);
            if (group.Count < 2) return;
            var back = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            var i = group.IndexOf(current);
            var next = group[(i + (back ? group.Count - 1 : 1)) % group.Count];
            if (current.lineType != TMP_InputField.LineType.SingleLine && current.text.Contains("\t"))
                current.text = current.text.Replace("\t", "");
            current.DeactivateInputField();
            es.SetSelectedGameObject(next.gameObject);
            next.ActivateInputField();
        }

        /// <summary>Các ô đang bật trong cụm cha gần nhất có từ 2 ô trở lên, xếp theo thứ tự đọc.</summary>
        private static List<TMP_InputField> Group(TMP_InputField current)
        {
            var list = new List<TMP_InputField>();
            for (var t = current.transform.parent; t != null; t = t.parent)
            {
                list.Clear();
                foreach (var f in t.GetComponentsInChildren<TMP_InputField>(false))
                    if (f.interactable && f.enabled) list.Add(f);
                if (list.Count >= 2) break;
            }
            list.Sort((a, b) =>
            {
                Vector2 pa = a.transform.position, pb = b.transform.position;
                if (Mathf.Abs(pa.y - pb.y) > RowTolerance) return pb.y.CompareTo(pa.y);
                return pa.x.CompareTo(pb.x);
            });
            return list;
        }
    }
}
