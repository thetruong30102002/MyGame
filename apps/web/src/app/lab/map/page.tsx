import { notFound } from 'next/navigation';
import { MapLab } from './MapLab';

export const metadata = { title: 'Map Lab — Aether Chronicle' };

/** Phòng thử Bản đồ lớn (phím M) — chỉ có ở dev (bản build trả 404). */
export default function MapLabPage() {
	if (process.env.NODE_ENV === 'production') notFound();
	return <MapLab />;
}
