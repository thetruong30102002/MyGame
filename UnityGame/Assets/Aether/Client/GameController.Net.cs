using System;
using System.Collections.Generic;
using Aether.Client.Combat;
using Aether.Core;
using Aether.Data;
using Aether.Net;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>
    /// Mạng của vòng lặp chơi: người chơi khác, quái DÙNG CHUNG (máy chủ giữ máu; người gần nhất làm chủ chạy AI, máy khác diễn
    /// theo), kinh tế ở máy chủ (cấp / EXP / xu / bình về qua tin eco), gửi vị trí, lưu tiến độ.
    /// </summary>
    public sealed partial class GameController
    {
        private readonly Dictionary<string, Fighter> netMobs = new Dictionary<string, Fighter>();
        private float mobPosT;

        private string MyId => online?.Character.Id;

        private void OnServer(ServerMessage m)
        {
            switch (m)
            {
                case ServerWelcome w:
                    remotes.Clear();
                    foreach (var p in w.Players) remotes.Upsert(p);
                    lastSent = "";
                    SendGearView(true);
                    if (map != null)
                    {
                        online.Send(new ClientMap { Map = online.Progress.Map });
                        if (HasSharedZones()) online.Send(new ClientMobSub { On = true });
                    }
                    break;
                case ServerJoin j:
                    remotes.Upsert(j.Player);
                    break;
                case ServerLeave l:
                    remotes.Remove(l.Id);
                    break;
                case ServerGear g:
                    remotes.SetGear(g.Id, g.Gear);
                    break;
                case ServerSnapshot s:
                    foreach (var p in s.Players) remotes.Apply(p);
                    break;
                case ServerKicked k:
                    hud.Toast("Bị đẩy ra: " + k.Reason, "warn");
                    break;
                case ServerAction ac:
                {
                    var r = remotes.Find(ac.Id);
                    if (r?.Actor == null) break;
                    var dir = Dir8Util.TryParse(ac.Dir, out var d) ? d : r.Actor.View.Direction;
                    r.Dir = Dir8Util.Names[(int)dir];
                    if (wieldMoves != null && wieldMoves.TryWieldOf(ac.Anim, out var wield)) remotes.NoteStance(r, wield);
                    var far = Math.Abs(r.Actor.X - player.X) > 1400 || Math.Abs(r.Actor.Y - player.Y) > 1400;
                    if (ac.Fx != null && !far)
                        combat.EchoCast(r.Actor, ac.Skill, ac.Anim, dir, ac.Fx.Ax, ac.Fx.Ay, ac.Fx.Tx, ac.Fx.Ty, ac.Fx.Cd);
                    else r.Actor.View.PlayOnce(ac.Anim, dir);
                    break;
                }
                case ServerPvpHit h:
                    if (h.To == MyId) combat.IncomingPvp(h.From, h.Dmg, h.Crit == true, h.Kx, h.Ky);
                    else combat.ShowPvpHit(remotes.Find(h.To)?.Actor, h.Dmg, h.Crit == true);
                    if (h.From == MyId && remotes.Find(h.To) is RemotePlayers.Remote victim) focus ??= victim;
                    break;
                case ServerPvpKill k:
                    hud.Toast(k.By == MyId ? $"Bạn đã hạ gục {k.ToName}!" : k.To == MyId ? $"{k.ByName} đã hạ gục bạn" : $"{k.ByName} hạ gục {k.ToName}", "boss");
                    break;
                case ServerChat c:
                    OnChat(c);
                    break;
                case ServerSystem sys:
                    SystemChat(sys.Text);
                    hud.Toast(sys.Text, "info");
                    break;
                case ServerWhisper wh:
                    OnWhisper(wh);
                    break;
                case ServerSocial so:
                    OnSocial(so);
                    break;
                case ServerEco e:
                    combat.SetEconomy(e.Level, e.Exp, e.Coins, e.Potions, e.Gain?.Exp ?? 0, e.Gain != null && e.Gain.Reason != "quest" && e.Gain.Reason != "checkin" ? e.Gain.Coins : 0);
                    var pr = online.Progress;
                    pr.Level = e.Level;
                    pr.Exp = e.Exp;
                    pr.Coins = e.Coins;
                    pr.Potions = e.Potions;
                    if (e.BonusPoints.HasValue) bonusPoints = e.BonusPoints.Value;
                    break;
                case ServerMobs ms:
                    if (map == null || ms.Map != online.Progress.Map) break;
                    foreach (var v in ms.List) UpsertNetMob(v);
                    break;
                case ServerMobSpawn sp:
                    UpsertNetMob(sp.Mob);
                    break;
                case ServerMobMove mm:
                    foreach (var mv in mm.List)
                    {
                        if (!netMobs.TryGetValue(mv.Id, out var f) || f.Net.Owned) continue;
                        f.Net.Tx = mv.X;
                        f.Net.Ty = mv.Y;
                        f.Net.Dir = mv.Dir ?? f.Net.Dir;
                        f.Net.Anim = mv.Anim ?? f.Net.Anim;
                    }
                    break;
                case ServerMobHp hp:
                    if (netMobs.TryGetValue(hp.Id, out var fh)) combat.NetSync(fh, hp.Hp, hp.By != MyId ? hp.Dmg : 0);
                    break;
                case ServerMobDie d:
                    if (netMobs.TryGetValue(d.Id, out var fd)) combat.NetKill(fd, d.Credit != null && d.Credit.Contains(MyId));
                    break;
                case ServerMobOwner o:
                    if (netMobs.TryGetValue(o.Id, out var fo)) fo.Net.Owned = o.Owner == MyId;
                    break;
                case ServerMobCc mcc:
                    if (netMobs.TryGetValue(mcc.Id, out var fcc)) combat.NetControl(fcc, mcc.Cc);
                    break;
                case ServerMobAct act:
                    if (netMobs.TryGetValue(act.Id, out var fa) && !fa.Net.Owned) combat.NetAct(fa, ToMsg(act.Act));
                    break;
                default:
                    OnRewards(m);
                    break;
            }
        }

        private static MobActMsg ToMsg(MobAct a)
        {
            switch (a)
            {
                case MobActWind w: return new MobActMsg { K = "wind", Dir = w.Dir, S = w.S };
                case MobActMelee me: return new MobActMsg { K = "melee", X = me.X, Y = me.Y, Nx = me.Nx, Ny = me.Ny };
                case MobActShot sh: return new MobActMsg { K = "shot", X = sh.X, Y = sh.Y, Nx = sh.Nx, Ny = sh.Ny };
                case MobActAoe ao: return new MobActMsg { K = "aoe", X = ao.X, Y = ao.Y };
                default: return new MobActMsg { K = a?.K };
            }
        }

        /// <summary>Một quái dùng chung từ máy chủ: có rồi thì cập nhật (nối lại mạng), chưa có thì dựng.</summary>
        private void UpsertNetMob(MobView m)
        {
            if (netMobs.TryGetValue(m.Id, out var old))
            {
                old.Net.Owned = m.Owner == MyId;
                if (m.Dead && !old.Dead) combat.NetKill(old, false);
                else if (!m.Dead && old.Dead) combat.NetRespawn(old, m.X, m.Y);
                else if (!m.Dead) combat.NetSync(old, m.Hp);
                old.Net.Tx = m.X;
                old.Net.Ty = m.Y;
                return;
            }
            MonsterZone zone = null;
            foreach (var z in map.def.monsterZones) if (z.id == m.Zone) zone = z;
            var zd = zone != null ? WorldPopulation.ToCore(zone) : null;
            if (zd != null && m.Home != null)
            {
                zd.X = m.Home.X;
                zd.Y = m.Home.Y;
                zd.Radius = m.Home.R;
            }
            var net = new NetMob { Id = m.Id, Owned = m.Owner == MyId, Tx = m.X, Ty = m.Y };
            var f = population.SpawnMob(m.Type, m.X, m.Y, zd, net, m.Dead ? 1 : 0, m.Level ?? zd?.Level);
            if (f == null) return;
            if (m.Boss) f.RegionBoss = f.Boss = true;
            if (m.HpMax > 0) f.HpMax = m.HpMax;
            f.Hp = m.Dead ? 0 : Math.Min(m.Hp, f.HpMax);
            netMobs[m.Id] = f;
        }

        /// <summary>Báo máy chủ vị trí các quái mình làm chủ — 10 lần/giây, chỉ con có đổi.</summary>
        private void SendMobPositions(float dt)
        {
            if (online == null || netMobs.Count == 0) return;
            mobPosT += dt;
            if (mobPosT < 0.1f) return;
            mobPosT = 0;
            var list = new List<MobMove>();
            foreach (var f in netMobs.Values)
            {
                var n = f.Net;
                if (!n.Owned || f.Dead) continue;
                var a = f.Actor;
                var x = Js.Round(a.X);
                var y = Js.Round(a.Y);
                var anim = a.View.Animation == "walk" ? "walk" : "idle";
                var dir = Dir8Util.Names[(int)a.View.Direction];
                if (x == n.Tx && y == n.Ty && anim == n.Anim && dir == n.Dir) continue;
                n.Tx = x;
                n.Ty = y;
                n.Anim = anim;
                n.Dir = dir;
                list.Add(new MobMove { Id = n.Id, X = x, Y = y, Dir = dir, Anim = anim });
            }
            if (list.Count > 0) online.Send(new ClientMobPos { List = list });
        }

        bool ICombatHooks.Online => online != null;

        void ICombatHooks.OnCast(SkillDef skill, string anim, Dir8 dir, double ax, double ay, double tx, double ty, double cooldown)
        {
            NoteStance(anim);
            if (online == null) return;
            if (!System.Linq.Enumerable.Contains(Protocol.ACTION_ANIMS, anim)) anim = "attack";
            var ground = Core.Skills.IsGroundTarget(skill);
            var fx = new ActionFx { Ax = Math.Round(ax, 3), Ay = Math.Round(ay, 3), Cd = Math.Round(cooldown, 3) };
            if (ground && !double.IsNaN(tx) && !double.IsNaN(ty))
            {
                fx.Tx = Js.Round(tx);
                fx.Ty = Js.Round(ty);
            }
            online.Send(new ClientAction { Anim = anim, Dir = Dir8Util.Names[(int)dir], Skill = skill.Id, Fx = fx });
        }

        void ICombatHooks.PvpDown(string by) => online?.Send(new ClientPvpDown { By = by });

        void ICombatHooks.ReportKill(Fighter f) => online?.Send(new ClientKill { Type = f.Type, Zone = f.Zone });

        void ICombatHooks.NetHit(Fighter f, int amount) => online?.Send(new ClientMobHit { Id = f.Net.Id, Dmg = amount });

        void ICombatHooks.NetAggro(Fighter f) => online?.Send(new ClientMobAggro { Id = f.Net.Id });

        void ICombatHooks.NetCc(Fighter f, MobCc cc)
        {
            if (online == null || f.Net == null) return;
            online.Send(new ClientMobCc { Id = f.Net.Id, Cc = cc });
        }

        void ICombatHooks.NetAct(Fighter f, string kind, double x, double y, double nx, double ny, string dir, double seconds)
        {
            if (online == null || f.Net == null) return;
            MobAct act;
            switch (kind)
            {
                case "wind": act = new MobActWind { Dir = dir, S = Math.Round(seconds, 3) }; break;
                case "melee": act = new MobActMelee { X = x, Y = y, Nx = Math.Round(nx, 3), Ny = Math.Round(ny, 3) }; break;
                case "shot": act = new MobActShot { X = x, Y = y, Nx = Math.Round(nx, 3), Ny = Math.Round(ny, 3) }; break;
                default: act = new MobActAoe { X = x, Y = y }; break;
            }
            online.Send(new ClientMobAct { Id = f.Net.Id, Act = act });
        }

        /// <summary>Gửi vị trí 10 lần/giây, chỉ khi có thay đổi; lưu vị trí vào tiến độ mỗi 5 giây.</summary>
        private void SendMove(float dt)
        {
            if (online == null) return;
            saveTimer += dt;
            if (saveTimer >= 5)
            {
                saveTimer = 0;
                SavePosition();
            }
            moveTimer += dt;
            if (moveTimer < 0.1f) return;
            moveTimer = 0;
            var x = Js.Round(player.X);
            var y = Js.Round(player.Y);
            var dir = Dir8Util.Names[(int)player.View.Direction];
            var anim = player.View.BaseAnimation;
            var hp = Math.Ceiling(combat.Pc.Hp);
            var key = $"{x},{y},{dir},{anim},{playerCharacter},{hp},{combat.Pc.HpMax}";
            if (key == lastSent) return;
            lastSent = key;
            online.Send(new ClientMove { X = x, Y = y, Dir = dir, Anim = anim, Sprite = playerCharacter, Hp = hp, HpMax = combat.Pc.HpMax });
        }

        private void SavePosition()
        {
            if (WritePosition()) online.Save();
        }

        private void OnBeforeSave() => WritePosition();

        /// <summary>Ghi vị trí hiện tại vào tiến độ; true = có thay đổi.</summary>
        private bool WritePosition()
        {
            if (online == null || player == null || map == null) return false;
            var pr = online.Progress;
            var x = Js.Round(player.X);
            var y = Js.Round(player.Y);
            if (pr.X == x && pr.Y == y) return false;
            pr.X = x;
            pr.Y = y;
            return true;
        }
    }
}
