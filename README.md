# PDF Dark Mode

A PDF viewer with dark mode and page tools. Hosted at [pdfdarkmode.click](https://pdfdarkmode.click).

## Features

- **Dark mode** - Respects system theme, inverts PDF colors
- **Upload or URL** - Load PDFs from device or public URL
- **Export pages** - Extract page ranges as new PDFs
- **Markdown conversion** - Convert pages to markdown via AI
- **Fit modes** - Fit to width or height

## Keyboard Shortcuts

All shortcuts use `Ctrl+X` as a prefix:

| Shortcut    | Action              |
| ----------- | ------------------- |
| `Ctrl+X U`  | Upload PDF          |
| `Ctrl+X E`  | Export pages        |
| `Ctrl+X M`  | Convert to markdown |
| `Ctrl+X F`  | Toggle fit mode     |
| `↑` / `↓`   | Navigate pages      |
| number keys | Jump to page        |

## Tech

Next.js, React PDF, pdf-lib, Tailwind CSS, deployed on Cloudflare.
