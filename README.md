# Sticky Notes

Single-page sticky notes app built with React and TypeScript, without UI or drag-and-drop libraries.

## Styling

Plain CSS with [CSS Modules](https://github.com/css-modules/css-modules), supported by Vite out of the box, so there is no styling dependency.

- **Scoped by component**: each component has its own `*.module.css`; `src/index.css` only holds theme variables (`:root` custom properties), a box-sizing reset and the minimum 1024×768 layout.
