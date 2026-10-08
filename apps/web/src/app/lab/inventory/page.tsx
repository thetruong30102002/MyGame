import { notFound } from 'next/navigation';
import { InventoryLab } from './InventoryLab';

export const metadata = { title: 'Inventory Lab — Aether Chronicle' };

/** Phòng thử Kho đồ — chỉ có ở dev (bản build trả 404). */
export default function InventoryLabPage() {
	if (process.env.NODE_ENV === 'production') notFound();
	return <InventoryLab />;
}
