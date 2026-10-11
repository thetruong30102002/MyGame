using System;
using System.Collections.Generic;
using Aether.Core;
using Aether.Core.World;
using Aether.Data;
using Aether.Net;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>
    /// Kim cương + dịch vụ NPC (chép `ShopPanel` / `GloryPanel` / `CalendarPanel` / `WaystonePanel` + phần `useSession` của web —
    /// docs/ke-hoach-kim-cuong.md K1, docs/ke-hoach-the-gioi.md mục 3). Mọi số liệu do máy chủ đẩy về (`wallet`, `daily`, `goals`,
    /// `buffs`, `hubs`); máy này chỉ gửi ý định. Bình mua ở quầy Bram áp vào chiến đấu (sát thương lên quái / nhận từ quái).
    /// </summary>
    public sealed partial class GameController
    {
        private Shop shop;
        private Rewards rewards;
        public Shop ShopRules => shop ??= new Shop(sim);
        public Rewards RewardRules => rewards ??= new Rewards(sim);
        public Regions RegionRulesPublic => RegionRules;
        /// <summary>Vùng đang đứng.</summary>
        public string CurrentRegion => region?.region;
        /// <summary>null = được sang vùng <paramref name="id"/>; còn lại là câu giải thích (cổng vùng).</summary>
        public string RegionGatePublic(string id) => id == region?.region ? null : RegionGateFor(id);
        /// <summary>Khoá `vùng/map` của map đang đứng.</summary>
        public string CurrentMapKey => map != null ? $"{region.region}/{map.def.id}" : null;

        public long Diamonds { get; private set; }
        public DailyView Daily { get; private set; }
        public List<GoalView> Goals { get; private set; }
        /// <summary>Bình đang có hiệu lực + lúc nhận (giây Time.time) — còn lại = remaining − (bây giờ − lúc nhận).</summary>
        public List<(BuffView buff, float at)> Buffs { get; } = new List<(BuffView, float)>();
        /// <summary>Trạm (khoá `vùng/map`) đã từng đặt chân tới — máy chủ ghi; null = chưa hỏi.</summary>
        public List<string> Hubs { get; private set; }
        /// <summary>Tăng mỗi khi có số liệu mới — cửa sổ dịch vụ đang mở dựng lại.</summary>
        public int RewardsVersion { get; private set; }

        private bool OnRewards(ServerMessage m)
        {
            switch (m)
            {
                case ServerWallet w:
                    Diamonds = w.Diamonds;
                    break;
                case ServerDaily d:
                    Daily = d.Daily;
                    break;
                case ServerGoals g:
                    Goals = g.List;
                    break;
                case ServerGift gf:
                {
                    var parts = new List<string>();
                    if (gf.Gift.Diamonds > 0) parts.Add($"{gf.Gift.Diamonds} kim cương");
                    if (gf.Gift.Coins > 0) parts.Add($"{gf.Gift.Coins} xu");
                    if (gf.Gift.Potions > 0) parts.Add($"{gf.Gift.Potions} bình");
                    hud.Toast($"{gf.Title}: +{string.Join(", ", parts)}", "loot");
                    break;
                }
                case ServerBuffs b:
                    Buffs.Clear();
                    foreach (var x in b.List) Buffs.Add((x, Time.time));
                    ApplyBuffs();
                    break;
                case ServerBought bo:
                {
                    var item = FindShopItem(bo.Item);
                    hud.Toast(item != null ? $"Đã mua {item.Name}" : "Đã mua", "loot");
                    break;
                }
                case ServerHubs h:
                    Hubs = h.List;
                    break;
                default:
                    return false;
            }
            RewardsVersion += 1;
            return true;
        }

        private ShopItem FindShopItem(string id)
        {
            foreach (var it in ShopRules.Items) if (it.Id == id) return it;
            return null;
        }

        /// <summary>Giây còn lại của một bình (đếm lùi tại máy từ lúc nhận).</summary>
        public double BuffRemaining((BuffView buff, float at) b) => Math.Max(0, b.buff.Remaining - (Time.time - b.at));

        /// <summary>Bình Cuồng Lực / Hộ Thân đang có → hệ số sát thương lên quái / nhận từ quái của chiến đấu.</summary>
        private void ApplyBuffs()
        {
            var list = new List<(string, double)>();
            foreach (var b in Buffs) if (BuffRemaining(b) > 0) list.Add((b.buff.Kind, b.buff.Mult));
            var m = Shop.BuffMults(list);
            combat.SetBuffs(m.TryGetValue("dmg", out var d) ? d : 1, m.TryGetValue("guard", out var g) ? g : 1);
        }

        private float buffTick;

        /// <summary>Mỗi giây: bình hết giờ thì thôi áp (máy chủ cũng gửi `buffs` mới khi hết).</summary>
        private void TickBuffs(float dt)
        {
            buffTick += dt;
            if (buffTick < 1) return;
            buffTick = 0;
            if (Buffs.Count > 0) ApplyBuffs();
        }

        public void Checkin() => online?.Send(new ClientCheckin());
        public void RequestGoals() => online?.Send(new ClientGoals());
        public void ClaimGoal(string id) => online?.Send(new ClientGoalClaim { Id = id });
        public void RequestHubs() => online?.Send(new ClientHubs());

        public void Buy(string itemId)
        {
            var it = FindShopItem(itemId);
            if (it == null || online == null) return;
            if (Diamonds < it.Price)
            {
                hud.Toast($"Cần {it.Price} kim cương (đang có {Diamonds})", "warn");
                return;
            }
            online.Send(new ClientShopBuy { Item = itemId });
        }

        /// <summary>NPC dịch vụ: quầy Bram → cửa hàng, cột dịch chuyển → bảng trạm, Bia Danh Vọng → mục tiêu. false = NPC thường (thoại).</summary>
        private bool OpenService(Npc n)
        {
            if (online == null) return false;
            var key = n.Key ?? "";
            foreach (var mk in ShopRules.MerchantNpcs)
                if (mk == key)
                {
                    hud.Panels.Show(UI.Panels.Kind.Shop);
                    return true;
                }
            if (key.StartsWith("waystone_", StringComparison.Ordinal))
            {
                RequestHubs();
                hud.Panels.Show(UI.Panels.Kind.Waystone);
                return true;
            }
            if (key == RewardRules.Chronicler.Npc)
            {
                RequestGoals();
                hud.Panels.Show(UI.Panels.Kind.Glory);
                return true;
            }
            return false;
        }

        /// <summary>Cột dịch chuyển: tới trạm `key` (`vùng/map`, đã từng tới), trả xu, đứng cạnh cột ở trạm đó. Chép `teleport` của web.</summary>
        public void Teleport(string key)
        {
            var (r, mapId) = GameDatabase.SplitMapKey(key, region.region);
            var def = RegionRules.RegionDef(r);
            if (def == null || def.Hub != mapId) return;
            if (r == region.region && map != null && mapId == map.def.id)
            {
                hud.Toast("Bạn đang ở trạm này rồi", "info");
                return;
            }
            if (Hubs == null || !Hubs.Contains(key))
            {
                hud.Toast($"Chưa tới {def.Name} — phải đặt chân tới trạm một lần mới dịch chuyển được", "warn");
                return;
            }
            var cost = (long)RegionRules.WaystoneCost;
            if (combat.Pc.Coins < cost)
            {
                hud.Toast($"Cần {cost} xu để dịch chuyển (đang có {combat.Pc.Coins})", "warn");
                return;
            }
            var why = r != region.region ? RegionGateFor(r) : null;
            if (why != null)
            {
                hud.Toast(why, "warn");
                return;
            }
            combat.Pc.Coins -= cost;
            online?.Send(new ClientSpend { Reason = "waystone", Amount = cost });
            hud.Panels.Close();
            hud.Toast($"−{cost} xu · dịch chuyển tới {def.Name}", "info");
            StartCoroutine(ChangeMap(key, def.Waystone.Spot, false));
        }
    }
}
