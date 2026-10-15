using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Full-screen manga-style player. The HUD owns it so gameplay uses its existing blocking/input flow.
    /// </summary>
    public sealed class MangaCutscene : MonoBehaviour
    {
        private RectTransform root;
        private RectTransform panel;
        private Image artwork;
        private Image inkWash;
        private RectTransform linesRoot;
        private RectTransform dialogueBox;
        private TMP_Text speakerText;
        private TMP_Text dialogueText;
        private TMP_Text sfxText;
        private TMP_Text hintText;
        private CanvasGroup group;
        private AudioSource audioSource;
        private PixelCamera cameraRig;
        private MangaCutsceneDefinition current;
        private Action completed;
        private int index;
        private bool advancing;

        public bool Open => root != null && root.gameObject.activeSelf;

        public static MangaCutscene Create(RectTransform canvas, PixelCamera camera)
        {
            var rt = UiKit.Stretch(canvas, "MangaCutscene");
            var player = rt.gameObject.AddComponent<MangaCutscene>();
            player.root = rt;
            player.cameraRig = camera;
            player.group = UiKit.Group(rt);
            player.group.alpha = 1;
            player.audioSource = rt.gameObject.AddComponent<AudioSource>();
            player.audioSource.playOnAwake = false;
            player.Build();
            rt.gameObject.SetActive(false);
            return player;
        }

        private void Build()
        {
            panel = UiKit.Stretch(root, "Panel");
            artwork = panel.gameObject.AddComponent<Image>();
            artwork.color = Color.white;
            artwork.preserveAspect = false;
            artwork.raycastTarget = false;
            var grayscale = Resources.Load<Shader>("MangaGrayscaleUI");
            if (grayscale != null) artwork.material = new Material(grayscale);

            inkWash = UiKit.Panel(UiKit.Stretch(panel, "InkWash"), new Color(0, 0, 0, 0.15f));
            inkWash.raycastTarget = false;
            linesRoot = UiKit.Stretch(panel, "SpeedLines");
            BuildSpeedLines();

            var top = UiKit.Rect(root, "TopFrame", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -13), new Vector2(1230, 18));
            UiKit.Panel(top, Color.black);
            var bottom = UiKit.Rect(root, "BottomFrame", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 13), new Vector2(1230, 18));
            UiKit.Panel(bottom, Color.black);

            dialogueBox = UiKit.Rect(root, "Dialogue", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 96), new Vector2(1050, 142));
            UiKit.Panel(dialogueBox, new Color(0.025f, 0.025f, 0.03f, 0.94f));
            var edge = new Color(1, 1, 1, 0.88f);
            UiKit.Panel(UiKit.Rect(dialogueBox, "TopInk", new Vector2(0.5f, 1), new Vector2(0.5f, 1), Vector2.zero, new Vector2(1050, 2)), edge).raycastTarget = false;
            UiKit.Panel(UiKit.Rect(dialogueBox, "BottomInk", new Vector2(0.5f, 0), new Vector2(0.5f, 0), Vector2.zero, new Vector2(1050, 2)), edge).raycastTarget = false;
            UiKit.Panel(UiKit.Rect(dialogueBox, "LeftInk", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(2, 142)), edge).raycastTarget = false;
            UiKit.Panel(UiKit.Rect(dialogueBox, "RightInk", new Vector2(1, 0.5f), new Vector2(1, 0.5f), Vector2.zero, new Vector2(2, 142)), edge).raycastTarget = false;

            speakerText = UiKit.Label(UiKit.Rect(dialogueBox, "Speaker", new Vector2(0, 1), new Vector2(0, 1), new Vector2(28, -16), new Vector2(960, 24)), "", 18, Color.white, TextAnchor.MiddleLeft, true);
            dialogueText = UiKit.Label(UiKit.Rect(dialogueBox, "Text", new Vector2(0, 1), new Vector2(0, 1), new Vector2(28, -48), new Vector2(990, 72)), "", 22, Color.white, TextAnchor.UpperLeft);
            dialogueText.textWrappingMode = TextWrappingModes.Normal;
            sfxText = UiKit.Label(UiKit.Rect(root, "SFX", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-90, 62), new Vector2(420, 110)), "", 46, Color.white, TextAnchor.MiddleCenter, true, true);
            sfxText.transform.localRotation = Quaternion.Euler(0, 0, -8);
            hintText = UiKit.Label(UiKit.Rect(root, "Hint", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-24, 24), new Vector2(310, 22)), "E · Space · bấm để tiếp tục", 13, new Color(1, 1, 1, 0.8f), TextAnchor.MiddleRight);
            UiKit.Press(root, Advance).Bouncy = false;
        }

        private void BuildSpeedLines()
        {
            // Handful of bold rays around the frame: high contrast and inexpensive on pixel-art scenes.
            for (var i = 0; i < 18; i++)
            {
                var angle = -72f + i * 8f;
                var ray = UiKit.Rect(linesRoot, "Ray" + i, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(i % 3 == 0 ? 7 : 3, 1250));
                ray.localRotation = Quaternion.Euler(0, 0, angle);
                var image = ray.gameObject.AddComponent<Image>();
                image.color = new Color(0, 0, 0, i % 3 == 0 ? 0.55f : 0.3f);
                image.raycastTarget = false;
            }
            linesRoot.gameObject.SetActive(false);
        }

        public void Play(MangaCutsceneDefinition definition, Action onComplete = null)
        {
            if (definition == null || definition.panels == null || definition.panels.Length == 0)
            {
                onComplete?.Invoke();
                return;
            }
            StopAllCoroutines();
            current = definition;
            completed = onComplete;
            index = 0;
            advancing = false;
            root.gameObject.SetActive(true);
            root.SetAsLastSibling();
            group.alpha = 0;
            StartCoroutine(Run());
        }

        public void Advance()
        {
            if (!Open || advancing) return;
            advancing = true;
        }

        private IEnumerator Run()
        {
            yield return Fade(1, 0.25f);
            while (index < current.panels.Length)
            {
                var data = current.panels[index];
                Show(data);
                yield return TransitionIn(data);
                var elapsed = 0f;
                while (!advancing && (!string.IsNullOrEmpty(data.dialogue) || elapsed < data.duration))
                {
                    elapsed += Time.unscaledDeltaTime;
                    yield return null;
                }
                advancing = false;
                yield return TransitionOut(data);
                index++;
            }
            yield return Fade(0, current.returnFade);
            root.gameObject.SetActive(false);
            current = null;
            var callback = completed;
            completed = null;
            callback?.Invoke();
        }

        private void Show(MangaPanel data)
        {
            artwork.sprite = data.image;
            artwork.color = data.image != null ? Color.white : new Color(0.08f, 0.08f, 0.1f, 1);
            panel.localScale = Vector3.one * Mathf.Max(1, data.closeUp);
            speakerText.text = data.speaker ?? "";
            speakerText.gameObject.SetActive(!string.IsNullOrWhiteSpace(data.speaker));
            dialogueText.text = data.dialogue ?? "";
            dialogueBox.gameObject.SetActive(!string.IsNullOrWhiteSpace(data.dialogue));
            sfxText.text = data.soundEffect ?? "";
            sfxText.gameObject.SetActive(!string.IsNullOrWhiteSpace(data.soundEffect));
            linesRoot.gameObject.SetActive(data.speedLines);
            if (data.shakeStrength > 0 && cameraRig != null) cameraRig.Shake(data.shakeStrength, data.shakeDuration);
            if (data.sound != null) audioSource.PlayOneShot(data.sound);
        }

        private IEnumerator TransitionIn(MangaPanel data)
        {
            const float duration = 0.24f;
            switch (data.transition)
            {
                case MangaTransition.Fade: yield return Fade(1, duration); break;
                case MangaTransition.SlideUp:
                    panel.anchoredPosition = new Vector2(0, -Screen.height * 0.12f);
                    yield return Animate(duration, t => { panel.anchoredPosition = new Vector2(0, Mathf.Lerp(-Screen.height * 0.12f, 0, t)); group.alpha = t; });
                    break;
                case MangaTransition.Zoom:
                    var target = panel.localScale;
                    panel.localScale = target * 1.12f;
                    yield return Animate(duration, t => { panel.localScale = Vector3.Lerp(target * 1.12f, target, t); group.alpha = t; });
                    break;
                default: group.alpha = 1; break;
            }
        }

        private IEnumerator TransitionOut(MangaPanel data)
        {
            if (data.transition == MangaTransition.Cut) yield break;
            yield return Fade(0, 0.16f);
        }

        private IEnumerator Fade(float target, float duration)
        {
            var start = group.alpha;
            yield return Animate(duration, t => group.alpha = Mathf.Lerp(start, target, t));
        }

        private static IEnumerator Animate(float duration, Action<float> update)
        {
            if (duration <= 0) { update(1); yield break; }
            var elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                var t = Mathf.Clamp01(elapsed / duration);
                update(t * t * (3 - 2 * t));
                yield return null;
            }
            update(1);
        }
    }
}
