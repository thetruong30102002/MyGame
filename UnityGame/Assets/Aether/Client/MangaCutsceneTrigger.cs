using Aether.Client.UI;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>Optional scene trigger for playing a manga cutscene asset when the player enters a 2D trigger.</summary>
    [RequireComponent(typeof(Collider2D))]
    public sealed class MangaCutsceneTrigger : MonoBehaviour
    {
        [SerializeField] private MangaCutsceneDefinition cutscene;
        [SerializeField] private bool playOnce = true;
        private bool played;
        private bool wasInside;
        private Collider2D trigger;
        private GameController game;

        private void Awake() => trigger = GetComponent<Collider2D>();

        private void Reset()
        {
            var trigger = GetComponent<Collider2D>();
            trigger.isTrigger = true;
        }

        private void Update()
        {
            if (game == null) game = FindFirstObjectByType<GameController>();
            var player = game != null ? game.Player : null;
            var inside = player != null && trigger != null && trigger.bounds.Contains(player.transform.position);
            if (inside && !wasInside) Play(game);
            wasInside = inside;
        }

        /// <summary>Can also be called by an existing interaction or story event.</summary>
        public void Play()
        {
            if (played && playOnce) return;
            var game = FindFirstObjectByType<GameController>();
            Play(game);
        }

        private void Play(GameController game)
        {
            if ((played && playOnce) || game == null || cutscene == null) return;
            played = true;
            game.PlayCutscene(cutscene);
        }
    }
}
