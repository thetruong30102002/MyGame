import { Container, Sprite, type Texture } from 'pixi.js';
import type { CharacterTextures } from '../assets/AssetManifest';
import { layoutPiece, stanceAfter, wieldedPieces, type GearPiece } from '../gearLayers';
import type { GearLayerSlot, GearViewArt, Wield } from '../gearArt';
import { gripIn } from '../gearPixels';
import { gearTexture } from '../gearTexture';

/**
 * Lớp đồ gắn chồng lên MỘT nhân vật (người chơi hoặc người chơi khác). Hai container: `behind` nằm dưới sprite thân,
 * `front` nằm trên — Actor xếp `[bóng, behind, thân, front]`. Mỗi lần `sync()` đọc khung ĐANG hiện của thân: neo (pipeline
 * ghi trong atlas) + hướng của khung → đặt từng món theo luật thuần `layoutPiece` (đi/chém/niệm thì đồ bám theo từng khung).
 * Texture tải lười theo (ảnh, cỡ, độ hiếm); chưa tải xong thì món đó tạm ẩn.
 */
export class GearLayers {
	readonly behind = new Container();
	readonly front = new Container();
	private pieces: GearPiece[] = [];
	/** Thế cầm (kiếm / gậy): đổi theo động tác đang hiện (`stanceAfter`) — mỗi lúc chỉ vẽ một loại vũ khí. */
	stance: Wield = 'melee';
	private readonly sprites = new Map<GearLayerSlot, Sprite>();
	private readonly loaded = new Map<string, Texture | null>();
	private destroyed = false;

	constructor(
		private readonly textures: CharacterTextures,
		private readonly body: Sprite,
	) {}

	/** Danh sách món đang mặc (đã lọc món có art). Gọi lại với danh sách y hệt thì không làm gì. */
	set(pieces: readonly GearPiece[]): void {
		const key = (list: readonly GearPiece[]) => list.map((p) => `${p.slot}:${p.id}:${p.rarity}`).join('|');
		if (key(pieces) === key(this.pieces)) return;
		this.pieces = [...pieces];
		for (const [slot, s] of this.sprites) {
			if (pieces.some((p) => p.slot === slot)) continue;
			s.destroy();
			this.sprites.delete(slot);
		}
		this.sync();
	}

	get current(): readonly GearPiece[] {
		return this.pieces;
	}

	sync(): void {
		// Actor bị huỷ cả cây (root.destroy children) mà texture về muộn: không đụng sprite đã huỷ.
		if (this.destroyed || this.front.destroyed) return;
		const info = this.textures.frameInfo(this.body.texture);
		const { frameSize, anchor } = this.textures.entry;
		const ox = -Math.round(frameSize.width * anchor.x);
		const oy = -Math.round(frameSize.height * anchor.y);
		this.stance = stanceAfter(info?.anim, this.stance);
		const shown = wieldedPieces(this.pieces, this.stance);
		for (const p of this.pieces) {
			const lay = info?.gear && shown.includes(p) ? layoutPiece(p, info.gear, info.dir, info.anim) : null;
			const tex = lay ? this.texture(lay.img, p.rarity) : null;
			let s = this.sprites.get(p.slot);
			if (!lay || !tex) {
				if (s) s.visible = false;
				continue;
			}
			if (!s) {
				s = new Sprite();
				this.sprites.set(p.slot, s);
			}
			const parent = lay.front ? this.front : this.behind;
			if (s.parent !== parent) parent.addChild(s);
			if (s.texture !== tex) s.texture = tex;
			const [gx, gy] = gripIn(lay.img.grip, lay.img.scale ?? 1);
			s.anchor.set(gx / tex.width, gy / tex.height);
			s.scale.x = lay.flip ? -1 : 1;
			s.position.set(ox + lay.x, oy + lay.y);
			s.visible = true;
		}
	}

	destroy(): void {
		this.destroyed = true;
		for (const s of this.sprites.values()) s.destroy();
		this.sprites.clear();
	}

	private texture(img: GearViewArt, rarity: GearPiece['rarity']): Texture | null {
		const scale = img.scale ?? 1;
		const key = `${img.src}|${scale}|${rarity}`;
		if (this.loaded.has(key)) return this.loaded.get(key) ?? null;
		this.loaded.set(key, null);
		gearTexture(img.src, scale, rarity).then(
			(t) => {
				this.loaded.set(key, t);
				this.sync();
			},
			() => {
				/* ảnh hỏng: món đó không hiện, giữ null để không tải lại mỗi khung */
			},
		);
		return null;
	}
}
