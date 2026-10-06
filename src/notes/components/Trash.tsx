import type { Ref } from 'react';
import styles from './Trash.module.css';

interface TrashProps {
  active: boolean;
  ref: Ref<HTMLDivElement>;
}

export function Trash({ active, ref }: TrashProps) {
  return (
    <div
      ref={ref}
      className={styles.trash}
      data-active={active || undefined}
      role="region"
      aria-label="Trash"
    >
      <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h1.5v-8H10Zm3.5 0v8H15v-8h-1.5Z"
        />
      </svg>
      <span>{active ? 'Release to delete' : 'Drop here to delete'}</span>
    </div>
  );
}
