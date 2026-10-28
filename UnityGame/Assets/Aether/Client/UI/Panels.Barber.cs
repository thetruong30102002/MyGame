using UnityEngine;
namespace Aether.Client.UI
{
    public sealed partial class Panels
    {
        private void BuildBarber()
        {
            Text(content, "Appearance", new Vector2(0, 1), new Vector2(0, 1), new Vector2(4, -12), new Vector2(900, 60), "Nhân vật hiện dùng diện mạo Lữ khách hoàn chỉnh.", 20, UiKit.TextMain);
        }
    }
}
