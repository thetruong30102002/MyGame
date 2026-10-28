using System;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>Transition played when a manga panel enters or leaves.</summary>
    public enum MangaTransition { Cut, Fade, SlideUp, Zoom }

    [Serializable]
    public sealed class MangaPanel
    {
        [Tooltip("Illustration for this panel. Sprite import should use Point filtering for pixel art.")]
        public Sprite image;
        public string speaker;
        [TextArea(2, 6)] public string dialogue;
        [TextArea(1, 3)] public string soundEffect;
        [Min(0)] public float duration = 2.5f;
        [Range(1, 1.6f)] public float closeUp = 1.08f;
        public bool speedLines;
        [Min(0)] public float shakeStrength;
        [Min(0)] public float shakeDuration = 0.2f;
        public AudioClip sound;
        public MangaTransition transition = MangaTransition.Fade;
    }

    /// <summary>Reusable, data-driven manga cutscene. Create via Assets &gt; Create &gt; Haven Lord &gt; Manga Cutscene.</summary>
    [CreateAssetMenu(fileName = "MangaCutscene", menuName = "Haven Lord/Manga Cutscene")]
    public sealed class MangaCutsceneDefinition : ScriptableObject
    {
        public MangaPanel[] panels = Array.Empty<MangaPanel>();
        [Min(0)] public float returnFade = 0.35f;
    }
}
