export const MOVE_HELP_ID = 'note-move-help';
export const RESIZE_HELP_ID = 'note-resize-help';

export function KeyboardHelp() {
  return (
    <>
      <p id={MOVE_HELP_ID} hidden>
        Use the arrow keys to move the note, with Shift for bigger steps. Press Delete or Backspace
        to remove it.
      </p>
      <p id={RESIZE_HELP_ID} hidden>
        Use the arrow keys to resize the note, with Shift for bigger steps.
      </p>
    </>
  );
}
