using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>Giữ câu Việt gốc để đổi ngôn ngữ ngay cả sau khi nhãn đã hiện tiếng Anh.</summary>
    public sealed class LocalizedLabel : MonoBehaviour
    {
        private TMP_Text label;
        private string original;
        private string rendered;
        private int version = -1;

        private void Awake() => label = GetComponent<TMP_Text>();

        private void LateUpdate()
        {
            if (label == null) return;
            if (label.text != rendered)
            {
                original = label.text;
                version = -1;
            }
            if (version == Loc.Version) return;
            rendered = Loc.T(original);
            if (label.text != rendered) label.text = rendered;
            version = Loc.Version;
        }
    }
}
