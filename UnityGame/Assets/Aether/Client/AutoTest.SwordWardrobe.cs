using System.Collections;
using Aether.Data;
using UnityEngine;
namespace Aether.Client
{
    public sealed partial class AutoTest
    {
        private IEnumerator SwordWardrobeTest(GameController game)
        {
            if(!game.InLab||!game.ToggleSwordWardrobe()){Fail("Không bật được bộ kiếm sĩ3 cấp/8 hướng");yield break;}yield return null;var rig=game.SwordWardrobe;var savedLevel=game.Combat.Pc.Level;
            game.Combat.Pc.Level=1;if(rig.SelectTier(1)||rig.SelectWeapon(1)||rig.SelectTier(-1)){Fail("Cho mặc lv5/cởi bộ khi lv1");yield break;}
            game.Combat.Pc.Level=5;if(!rig.SelectTier(1)||!rig.SelectWeapon(1)||rig.SelectTier(2)||rig.SelectWeapon(2)){Fail("Sai chặn lv5/lv10");yield break;}
            game.Combat.Pc.Level=10;if(!rig.SelectTier(2)||!rig.SelectWeapon(2)){Fail("Không mở đồ lv10");yield break;}game.Combat.Pc.Level=savedLevel;
            var poses=0;var swaps=0;
            foreach(var gender in new[]{"male","female"})for(var tier=0;tier<3;tier++)
            {
                rig.SelectGender(gender);rig.SelectTier(tier);
                for(var d=0;d<8;d++)foreach(var a in new[]{"idle","walk","run","attack"})
                {
                    var count=a=="idle"?1:a=="attack"?15:8;
                    for(var f=0;f<count;f++)
                    {
                        rig.SeekForTest(a,f,(Dir8)d);yield return null;var sr=rig.GetComponentsInChildren<SpriteRenderer>();if(sr.Length!=4||sr[0].sprite==null||sr[1].sprite==null||sr[3].sprite==null){Fail("Thiếu thân/đầu/ngón tay "+gender+"/"+tier+"/"+d+"/"+a+"/"+f);yield break;}
                        var body=sr[0].sprite;var head=sr[1].sprite;var headAt=sr[1].transform.localPosition;
                        for(var w=0;w<3;w++){if(!rig.SelectWeapon(w)||sr[2].sprite==null||sr[0].sprite!=body||sr[1].sprite!=head||sr[1].transform.localPosition!=headAt){Fail("Thay kiếm đổi thân/đầu hoặc thiếu kiếm");yield break;}swaps++;}
                        foreach(var r in sr)if(r.enabled&&(r.sprite.pixelsPerUnit!=96||r.sprite.texture.filterMode!=FilterMode.Point||r.sprite.texture.mipmapCount!=1||r.transform.localScale!=Vector3.one)){Fail("Sai scale/PPU/lọc ảnh");yield break;}poses++;
                    }
                    if(a=="idle"||a=="run"||a=="attack"&&d%2==0){rig.SelectWeapon(tier);rig.SeekForTest(a,a=="attack"?6:0,(Dir8)d);yield return Shot("wardrobe-"+gender+"-tier"+tier+"-"+d+"-"+a);}
                }
            }
            for(var h=0;h<rig.HeadCount;h++)for(var d=0;d<8;d++){rig.SelectHead(h);rig.SeekForTest("idle",0,(Dir8)d);yield return null;var avatar=rig.GetComponentsInChildren<SpriteRenderer>()[1];if(avatar.sprite.rect.size!=new Vector2(96,96)||avatar.sprite.pivot!=new Vector2(48,30)){Fail("Đầu không theo chuẩn global");yield break;}}
            rig.SelectGender("female");rig.SelectTier(2);rig.SelectWeapon(2);rig.SeekForTest("attack",6,Dir8.S);rig.ToggleHead();rig.ToggleWeapon();yield return Shot("wardrobe-body-only-no-head-no-sword");if(rig.GetComponentsInChildren<SpriteRenderer>()[1].enabled||rig.GetComponentsInChildren<SpriteRenderer>()[2].enabled){Fail("Tắt đầu/kiếm không sạch renderer");yield break;}rig.ToggleHead();rig.ToggleWeapon();
            rig.PlayAttack();yield return new WaitForSeconds(1.5f);if(rig.Attacking){Fail("Chém không hồi thế");yield break;}
            // Đi qua đúng đường nút UI -> kho đồ -> ApplyGear -> renderer, không chỉ gọi selector ảnh.
            rig.SeekForTest("idle",0,Dir8.S);
            for(var i=0;i<3;i++)
            {
                var next=(rig.TierIndex+1)%3;if(!game.StepWardrobeOutfit(1)||rig.TierIndex!=next){Fail("Đổi bộ qua kho không đồng bộ ảnh");yield break;}
                var wornBody=game.Gear.Equip["body"].Id;var sr=rig.GetComponentsInChildren<SpriteRenderer>();var bodySprite=sr[0].sprite;
                for(var w=0;w<3;w++){var blade=(rig.WeaponIndex+1)%3;if(!game.StepWardrobeBlade(1)||rig.WeaponIndex!=blade||game.Gear.Equip["body"].Id!=wornBody||sr[0].sprite!=bodySprite){Fail("Đổi kiếm trong kho làm đổi bộ hoặc không đồng bộ ảnh");yield break;}}
            }
            yield return Shot("wardrobe-inventory-synced");
            var hud=FindFirstObjectByType<UI.Hud>();hud.Panels.Show(UI.Panels.Kind.Inventory);yield return null;
            var doll=FindFirstObjectByType<UI.SwordWardrobePaperdoll>();if(doll==null||doll.RenderedHead!=rig.PortraitHead){Fail("Túi đồ còn dùng người/đầu cũ thay vì nhân vật ghép");yield break;}yield return Shot("wardrobe-bag-new-items-and-body");hud.Panels.Close();
            game.ToggleSwordWardrobe();yield return null;if(!game.Player.View.Renderer.enabled){Fail("Tắt mẫu không khôi phục nhân vật gốc");yield break;}
            log.WriteLine("PASS SwordWardrobeV4:1536 poses,4608 independent sword swaps,30 heads/8 directions,3 level gates,no-undress,head/weapon off,PPU96 point,restore. Actual poses="+poses+" swaps="+swaps);
        }
    }
}
