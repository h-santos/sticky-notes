import styles from './Board.module.css';

export function Board() {
  return (
    <main className={styles.board} aria-label="Sticky notes board">
      <p className={styles.empty}>No notes yet.</p>
    </main>
  );
}
