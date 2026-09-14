# Nix - A Simple and Beautiful Todo App

**Nix** is a modern, offline-first task management application built with **Svelte 5 (Runes)**, **SvelteKit**, **Tailwind CSS v4**, and **Dexie (IndexedDB)**. Designed with fluid micro-animations, natural language date parsing, and an interactive stacked card interface.

---

## ✨ Features

- **⚡ Quick Command Input & Natural Language Parsing**: Quickly create todos with smart metadata extraction (`at tomorrow 3pm`, `at deadline next friday`, `on a priority high`, `on every weekday`, `with note ...`) powered by `chrono-node`.
- **🃏 Interactive Stacked List**: Sonner-style stacked task cards that seamlessly unfold on hover with smooth spring-like animations.
- **📅 Smart Date Grouping**: Tasks are automatically categorized into intuitive sections (*Today*, *Tomorrow*, specific days, and upcoming deadlines).
- **🗓️ Weekly Calendar Carousel**: Browse tasks by date using an interactive weekly carousel that highlights dates with active todos.
- **⏱️ Task Countdown & Snooze Modal**: Auto-prompt countdown modal for upcoming time-sensitive tasks with snooze (15-min) and stop controls.
- **🔍 Quick Search**: Instant search filtering across titles, notes, and priority tags with keyboard shortcuts (`Enter`, `ESC`).
- **💾 Local-First & Privacy-Focused**: All your data remains in your browser using IndexedDB (via Dexie.js) — fast, responsive, and works offline.
- **🌓 Dark / Light Mode**: Integrated theme toggle with system preference support via `mode-watcher`.

---

## 🛠️ Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (Runes reactivity) & [SvelteKit 2](https://kit.svelte.dev/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Bits UI](https://bits-ui.com/), and [@lucide/svelte](https://lucide.dev/)
- **Database / Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Natural Language Parsing**: [chrono-node](https://github.com/wanasit/chrono)
- **Carousel & Animations**: [Embla Carousel](https://www.embla-carousel.com/) & Tailwind CSS transitions
- **Notifications**: [svelte-sonner](https://svelte-sonner.vercel.app/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- `pnpm` (or `npm` / `yarn` / `bun`)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/rizkyRosyidHidayat/hinix.git
   cd todo
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Start the development server:
   ```sh
   pnpm dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Vite development server |
| `pnpm build` | Builds the production bundle |
| `pnpm preview` | Locally previews the production build |
| `pnpm check` | Runs SvelteKit sync and TypeScript diagnostics |
| `pnpm lint` | Checks code formatting and ESLint rules |
| `pnpm format` | Formats code with Prettier |
| `pnpm test` | Runs unit and component tests with Vitest |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
