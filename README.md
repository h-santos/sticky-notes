# Sticky Notes

Single-page sticky notes app built with React and TypeScript, without UI or drag-and-drop libraries.

**Live demo:** [sticky-notes-h-santos.vercel.app](https://sticky-notes-h-santos.vercel.app/)

## Features

- **Create** a note by clicking on the board (default 200×160px) or by dragging to draw it at the exact position and size you want. Also the **New note** button adds support for keyboard navigation.
- **Move** a note by dragging its top bar.
- **Resize** a note from its bottom-right corner. Notes stay inside the board and never get smaller than 80×60px.
- **Delete** a note by dropping it on the trash zone in the bottom-right corner. The trash highlights while the pointer is over it.
- **Bring to front**: pressing or focusing a note puts it on top of the others.
- **Text**: type directly into a note (up to 1000 characters). New notes get focus so you can start typing straight away.
- **Colours**: pick one of four colours from the note's top bar. New notes reuse the colour picked last.

### Keyboard support

- `Tab` moves between the New note button and each note's move handle, colours, text and resize handle.
- On the **move handle**, arrow keys move the note (`Shift` for bigger steps) and `Delete` or `Backspace` removes it.
- On the **resize handle**, arrow keys resize the note (`Shift` for bigger steps).
- On the **colours**, arrow keys change the colour.
- A visible hint shows the available keys while a handle has keyboard focus. Screen readers get the same instructions through `aria-describedby`, and note creation and deletion are announced through a live region.

## Requirements

- Node.js 20.19 or later
- A desktop browser: latest Google Chrome, Mozilla Firefox or Microsoft Edge, with a screen of at least 1024×768

## Getting started

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm run build      # type-check and build for production into dist/
npm run preview    # serve the production build
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Project structure

```
src/
  app/                 App shell
  notes/
    model/             Note types, constants, id factory and the pure state reducer
    components/        Board, NoteView, Trash and the keyboard help text
  shared/
    geometry/          Framework-agnostic geometry helpers (points, rects, clamping, hit testing)
    hooks/             Generic usePointerDrag hook
    keyboard/          Arrow and delete key helpers
  test/                Test setup
```

## Architecture

The app is built with React 19 and TypeScript in strict mode on Vite, with no runtime dependencies besides React: dragging, geometry and styling are implemented from scratch. Code is organised by responsibility. `src/notes/model` holds the domain: note types, constants and a pure reducer with `create`, `move`, `resize`, `remove`, `bringToFront`, `editText` and `changeColor` actions. `src/notes/components` holds the UI. `src/shared` contains framework-agnostic geometry helpers and a generic `usePointerDrag` hook. Dependencies point one way only, from components to model to shared, so the domain logic is tested without rendering anything.

All note state lives in a single `useReducer` in `Board`. Updates are immutable with structural sharing: unchanged notes keep their object identity, and an action that changes nothing returns the previous state so React skips the render. Notes talk to the board through a `NoteController` object created once with `useMemo`; since it never changes, the memoised `NoteView` components only re-render when their own note does, which keeps typing and dragging cheap. Every pointer gesture (drawing a new note, moving, resizing) goes through `usePointerDrag`, built on Pointer Events: it listens on `window` so a drag survives the pointer leaving the element, tracks a single `pointerId`, can be cancelled mid-drag with Escape (or by the browser via `pointercancel`), and cleans up on unmount. While a note is dragged it renders from local draft state and only commits to the reducer on release, so a drag re-renders that note alone.

Keyboard and pointer interactions share the same geometry code, so both respect the board bounds and the minimum note size. Accessibility relies on native elements where possible: the colour picker is a group of real radio buttons, handles are buttons described by hidden help text, and a live region announces created and deleted notes. Notes are kept in memory only and are lost on reload: persistence was left out due to time constraints, but since all state goes through a single reducer it could be added with few changes. The project is covered by unit tests for the geometry, the reducer and the drag hook, and by integration tests of the board, using Vitest and Testing Library.

### Styling

Plain CSS with [CSS Modules](https://github.com/css-modules/css-modules), supported by Vite out of the box, so there is no styling dependency.

- **Scoped by component**: each component has its own `*.module.css`; `src/index.css` only holds theme variables (`:root` custom properties), a box-sizing reset and the minimum 1024×768px layout.
- **Role-based class names**: short camelCase names that describe what an element is (`grip`, `resizeHandle`, `trash`), with no prefixes or BEM since modules already scope them.
- **State through attributes and pseudo-classes**: component state is exposed as `data-*` attributes (`data-interaction`, `data-color`, `data-active`) instead of modifier classes, so JSX never builds class strings; native states are styled with pseudo-classes (`:checked`, `:focus-visible`, `:focus-within`), so the styles follow the browser's own state.
