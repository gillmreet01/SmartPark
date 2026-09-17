import type { SlotStatus } from '../api/types';
import { STATUS_META } from '../lib/format';

export default function StatusBadge({ status }: { status: SlotStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`chip ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
