using System.Collections.Generic;
using static HavenLord.Core.TalentsFmt;

namespace HavenLord.Core
{
    /// <summary>
    /// Phần chữ + phân loại kỹ năng của packages/sim/src/skills.ts (isSwordSkill, isGroundTarget, skillFacts, powerText, estimateText).
    /// Chuỗi tiếng Việt phải ra y hệt TS — test vector Tests~/vectors/talents-full.json.
    /// </summary>
    public sealed class Skills
    {
        private readonly SimData _d;

        public Skills(SimData data) => _d = data;

        /// <summary>Đòn kiếm: hệ thép, chém trước mặt / xoay chém, hoặc kiếm pháp nguyên tố (blade).</summary>
        public static bool IsSwordSkill(SkillDef s) => s.Element == "steel" || s.Kind == "melee" || s.Kind == "spin" || T(s.Blade);

        /// <summary>Kiểu đòn cần ĐIỂM nhắm trên mặt đất (zone đi theo / bám người thì không).</summary>
        public static bool IsGroundTarget(SkillDef s) =>
            s.Kind == "aoe_target" || s.Kind == "pillar" || s.Kind == "wall" || s.Kind == "barrage" || s.Kind == "summon" || (s.Kind == "zone" && !T(s.Follow) && !T(s.Move)) || (s.Kind == "spin" && (s.Range ?? 0) > 0);

        /// <summary>Kiểu đòn + khống chế thành chữ cho tooltip / bảng Tiềm năng.</summary>
        public List<string> SkillFacts(SkillDef s)
        {
            var r = _d.TalentRuleNums;
            var o = new List<string>();
            var range = Str(s.Range);
            var radius = Str(s.Radius);
            var pierce = T(s.Pierce) ? ", xuyên mục tiêu" : "";
            switch (s.Kind)
            {
                case "aoe_self":
                    o.Add($"Vùng quanh mình, bán kính {radius}");
                    break;
                case "aoe_target":
                    o.Add(T(s.Fall)
                        ? $"Rơi từ trời xuống chỗ nhắm (tầm {range}) sau {Num(s.Delay ?? 0)}s, bán kính {radius}"
                        : $"Vùng tại chỗ nhắm (tầm {range}), bán kính {radius}");
                    break;
                case "pillar":
                    o.Add($"Trồi tại chỗ nhắm (tầm {range}) sau {Num(s.Delay ?? 0)}s, bán kính {radius}");
                    break;
                case "cone":
                    o.Add($"Hình nón {Str((s.Angle ?? 0) * 2)}°, dài {range}");
                    break;
                case "line":
                    o.Add($"Đường thẳng dài {range}, rộng {Str((s.Width ?? 0) * 2)}");
                    break;
                case "dash":
                    o.Add($"Lướt {range}, không trúng đòn {Num(s.Iframes ?? 0)}s{(T(s.Trail) ? ", vệt chém dọc đường" : s.Power > 0 ? ", chém quái đi qua" : "")}");
                    break;
                case "zone":
                {
                    var ticks = Str(Js.Round((s.Duration ?? 0) / (s.Tick ?? 1)));
                    var dur = Num(s.Duration ?? 0);
                    if (T(s.Rain)) o.Add($"Mưa {dur}s tại chỗ nhắm (tầm {range}), bán kính {radius}: quái trong vùng ướt liên tục");
                    else if (T(s.Bolts))
                        o.Add($"Mây giông {dur}s tại chỗ nhắm (tầm {range}), bán kính {radius}, {ticks} nhịp × {Str(r.ThunderBolts)} tia sét ({Str(r.ThunderRainBolts)} nếu mây trong mưa của mình), ưu tiên quái ướt");
                    else if (T(s.Move))
                        o.Add($"Lốc đi theo hướng nhắm {Str(Js.Round(s.Move.Value * (s.Duration ?? 0)))}px trong {dur}s, bán kính {radius}, {ticks} nhịp, cuốn quái theo");
                    else
                    {
                        var follow = T(s.Follow);
                        o.Add($"{(follow ? "Quanh mình" : "Vùng")} {dur}s{(follow ? "" : " tại chỗ nhắm")}, bán kính {radius}, {ticks} nhịp{(T(s.Pull) ? ", hút quái" : "")}");
                    }
                    break;
                }
                case "wall":
                    o.Add($"Tường dài {Str((s.Width ?? 0) * 2)} tại chỗ nhắm (tầm {range}), đứng {Num(s.Duration ?? 0)}s: chặn quái đi qua + chặn đạn quái{(T(s.Tick) ? ", đốt quái áp sát" : "")}");
                    break;
                case "ward":
                    o.Add(s.Element == "steel"
                        ? $"Gạt đạn {Num(s.Duration ?? 0)}s: đạn quái bay tới gần bị chém bay ngược về kẻ bắn"
                        : $"Khiên {Num(s.Duration ?? 0)}s quanh mình: phản đạn quái về kẻ bắn");
                    break;
                case "spin":
                    o.Add((s.Range ?? 0) > 0 ? $"Xoáy chém tại chỗ nhắm (tầm {range}), bán kính {radius}" : $"Xoay chém quanh mình, bán kính {radius}");
                    if (T(s.AfterGuard)) o.Add($"vừa đỡ / gạt / phản đòn (trong {Num(r.CounterAfter)}s): mạnh thêm ×{Num(s.AfterGuard.Value)}");
                    break;
                case "barrage":
                    o.Add($"{Str(s.Count)} viên rơi rải trong {Num(s.Duration ?? 0)}s khắp vùng bán kính {radius} tại chỗ nhắm (tầm {range}), mỗi viên bán kính {Str(s.Width)}");
                    break;
                case "melee":
                {
                    // Trảm không ghi gì: chỉ đòn chém có góc / dồn lực / nhiều nhát mới cần nói.
                    var arc = T(s.Arc) ? $", góc {Str(s.Arc.Value * 2)}°" : "";
                    if ((s.Count ?? 1) > 1) o.Add($"Chuỗi {Str(s.Count)} nhát chém, tầm {range}{arc}");
                    else if (T(s.Arc) || T(s.Charge)) o.Add($"Chém trước mặt, tầm {range}{arc}{(T(s.Charge) ? $", dồn lực {Num(s.Charge.Value)}s" : "")}");
                    break;
                }
                case "guard":
                    o.Add(s.Guard == "parry"
                        ? $"Cửa sổ đỡ {Num(s.Duration ?? 0)}s: hoá giải một đòn (cả đạn) rồi phản"
                        : s.Guard == "still"
                            ? $"Bất động {Num(s.Duration ?? 0)}s: hoá giải + phản lại mọi đòn (chém, đạn, đòn vùng)"
                            : $"Giữ thế {Num(s.Duration ?? 0)}s: chặn + phản đòn cận chiến, đạn/đòn vùng còn {Str(Js.Round(r.GuardShot * 100))}%");
                    break;
                case "blink":
                    o.Add($"Ra sau lưng mục tiêu trong tầm {range} rồi chém");
                    break;
                case "summon":
                    o.Add(s.Element == "earth"
                        ? $"Triệu hồi {Num(s.Duration ?? 0)}s tại chỗ nhắm (tầm {range}): dậm đất mỗi {Num(s.Tick ?? 1)}s, bán kính {radius}"
                        : $"{Str(s.Count)} phân thân {Num(s.Duration ?? 0)}s tại chỗ nhắm (tầm {range}), mỗi bóng chém mỗi {Num(s.Tick ?? 1)}s, bán kính {radius}");
                    break;
                case "projectile":
                    if ((s.Count ?? 1) > 1) o.Add($"{Str(s.Count)} lưỡi toả quạt {Str((s.Spread ?? 0) * ((s.Count ?? 1) - 1))}°, bắn xa {range}{pierce}");
                    else if (T(s.Returns)) o.Add($"Phóng kiếm bay xa {range}, xuyên mục tiêu rồi bay về tay (mỗi chiều trúng mỗi quái một lần)");
                    else if (s.Element == "steel") o.Add($"Luồng kiếm bay xa {range}{pierce}");
                    else o.Add($"Bắn xa {range}{pierce}");
                    break;
            }
            var h = s.Hit;
            if (h != null)
            {
                if (T(h.Knock)) o.Add($"đẩy lùi {Str(h.Knock)}");
                if (T(h.Stun)) o.Add($"choáng {Num(h.Stun.Value)}s");
                if (T(h.Launch)) o.Add($"hất {Num(h.Launch.Value)}s");
                if (T(h.Freeze)) o.Add($"đóng băng {Num(h.Freeze.Value)}s");
                if (T(h.FreezeChilled)) o.Add($"đóng băng {Num(h.FreezeChilled.Value)}s mục tiêu ướt/lạnh");
                if (T(h.Drain)) o.Add($"hút máu {Str(Js.Round(h.Drain.Value * 100))}%");
                if (T(h.Armor)) o.Add($"phá giáp {Num(h.Armor.Value)}s");
                if (T(h.Sunder)) o.Add($"quái đang bị phá giáp: vỡ giáp {Num(h.Sunder.Value)}s (nhận thêm {Str(Js.Round((r.SunderTaken - 1) * 100))}%)");
            }
            if (T(s.Crit)) o.Add(s.Crit.Value >= 1 ? "chắc chắn chí mạng" : $"+{Str(Js.Round(s.Crit.Value * 100))}% chí mạng");
            return o;
        }

        /// <summary>Uy lực ghi trên bảng Tiềm năng theo kiểu đòn.</summary>
        public static string PowerText(SkillDef s)
        {
            var p = Num(s.Power);
            switch (s.Kind)
            {
                case "heal":
                    return $"hồi {Str(Js.Round(s.Power * 100))}% máu tối đa";
                case "guard":
                    return $"phản đòn ×{p}";
                case "ward":
                    return $"đạn phản ×{p}";
                case "zone":
                    return T(s.Rain) ? "không gây sát thương" : T(s.Bolts) ? $"uy lực ×{p} mỗi tia sét" : $"uy lực ×{p} mỗi nhịp";
                case "wall":
                    return T(s.Tick) ? $"uy lực ×{p} mỗi nhịp đốt" : $"uy lực ×{p} lúc đá trồi";
                case "barrage":
                    return $"uy lực ×{p} mỗi viên";
                case "projectile":
                    return (s.Count ?? 1) > 1 ? $"uy lực ×{p} mỗi lưỡi" : T(s.Returns) ? $"uy lực ×{p} mỗi lượt (đi + về)" : $"uy lực ×{p}";
                case "melee":
                    return (s.Count ?? 1) > 1 ? $"uy lực ×{p} mỗi nhát" : $"uy lực ×{p}";
                default:
                    return $"uy lực ×{p}";
            }
        }

        /// <summary>Ước lượng sát thương cho tooltip — <paramref name="hit"/> = sát thương MỘT đòn / nhịp / tia / viên.</summary>
        public static string EstimateText(SkillDef s, double hit)
        {
            var ticks = Str(Js.Round((s.Duration ?? 0) / (s.Tick ?? 1)));
            var h = Str(hit);
            switch (s.Kind)
            {
                case "zone":
                    return T(s.Rain) ? "làm ướt, không gây sát thương" : T(s.Bolts) ? $"≈ {h} mỗi tia × {ticks} nhịp" : $"≈ {h} mỗi nhịp × {ticks}";
                case "guard":
                    return $"phản đòn ≈ {h}";
                case "ward":
                    return $"đạn phản ≈ {h}";
                case "wall":
                    return T(s.Tick) ? $"≈ {h} mỗi nhịp đốt × {ticks}" : $"≈ {h} lúc đá trồi";
                case "barrage":
                    return $"≈ {h} mỗi viên × {Str(s.Count)}";
                case "melee":
                    return (s.Count ?? 1) > 1 ? $"≈ {h} mỗi nhát × {Str(s.Count)}" : $"≈ {h} sát thương";
                case "spin":
                    return T(s.AfterGuard) ? $"≈ {h} sát thương (vừa đỡ đòn: ≈ {Str(Js.Round(hit * s.AfterGuard.Value))})" : $"≈ {h} sát thương";
                default:
                    return (s.Count ?? 1) > 1 ? $"≈ {h} mỗi lưỡi × {Str(s.Count)}" : T(s.Returns) ? $"≈ {h} mỗi lượt × 2 (đi + về)" : $"≈ {h} sát thương";
            }
        }
    }
}
