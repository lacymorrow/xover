# CrossOver 🎯

A desktop crosshair overlay application built with Electron, React, and TypeScript. This application provides customizable crosshairs for gaming and screen targeting applications.

CrossOver data is stored as `config.json` in the Per-user application data directory, which by default points to:
- `%APPDATA%` on Windows (e.g. `C:\Users\username\AppData\Roaming\CrossOver`)
- `$XDG_CONFIG_HOME` or `~/.config` on Linux (e.g. `~/.config/CrossOver`)
- `~/Library/Application Support` on macOS (e.g. `~/Library/Application Support/CrossOver`)

#### Disable the "Lock" keybind

Open the `config.json` file and change the `keybind` value to `""` (empty string) to disable the "Lock" keybind:

```json
{
  "keybinds": {
    "lock": "",
		// ...
  }
}
```

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## ✨ Features

- 🎯 Customizable crosshair overlays
- 🚀 React for the UI
- 🖥️ Electron for cross-platform desktop app development
- 📘 TypeScript for type-safe code
- 🎨 TailwindCSS for styling
- 🔌 Inter-process communication (IPC) between main and renderer processes
- 🌍 Global context for state management
- 🖼️ Multi-window support (main window and child window)
- 🔔 App and System-wide Notifications
- 🔄 Auto Updater
- 💾 Built-in Store with electron-store
- 🖱️ Context Menu
- 🌙 Dark Mode
- ❌ Error Handler
- ⌨️ Keyboard Shortcut Manager
- 📝 Logging
- 🀱 Menu Bar for macOS, Windows, and Linux
- 📂 Multi-Window
- 🖥️ System Tray
- 🎨 UI components from [Shadcn](https://ui.shadcn.com/)

## 🚀 Getting Started

1. Clone this repository

   ```bash
   git clone https://github.com/lacymorrow/crossover.git
   ```

2. Go into the repository

   ```bash
   cd crossover
   ```

3. Install dependencies

   ```bash
   npm install
   ```

4. Start the development server

   ```bash
   npm run start
   ```

## 📁 Project Structure

- `src/main`: Contains the main process code
- `src/renderer`: Contains the renderer process code (React components)
- `src/config`: Contains configuration files
- `src/utils`: Contains utility functions

## 📜 Available Scripts

- `npm run start`: Start the app in development mode
- `npm run package`: Build the app for production
- `npm run lint`: Run the linter
- `npm run test`: Run tests

## Production

### Auto Update

After publishing your first version, you can enable auto-update by uncommenting the `update` function contents in `src/main/auto-update.ts`.

## Built With

- [Electron](https://electronjs.org/)
- [React](https://reactjs.org/)
- [React Router](https://reacttraining.com/react-router/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Development

### Tailwind CSS

We use Tailwind CSS for styling. See the [Tailwind CSS docs](https://tailwindcss.com/docs) for more information.

Some Tailwind plugins have been added for convenience:

- [Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate) - `tailwindcss-animate`
- [Tailwind Container Queries](https://github.com/tailwindlabs/tailwindcss-container-queries) - `@tailwindcss/container-queries`
- Child selectors to target immediate children like `child:w-xl`
- Don't forget group selectors too: `group` (Parent) `group-hover:bg-gray-100` (Child)

### Shadcn

Shadcn is a UI component library for React. See the [Shadcn docs](https://ui.shadcn.com/) for more information.
Use `npx shadcn-ui@latest add accordion ...` to add a component to your project.

_Current installation command (to update all ui components):_

```sh
npx shadcn-ui@latest add button checkbox dropdown-menu form input menubar radio-group scroll-area select separator sonner switch textarea
```

_To list components with updates: `npx shadcn-ui@latest diff`_

### Build for production

```sh
npm run package
```

#### Important Notes

- The `src/main/auto-update.ts` file is where the auto-updater is configured. Uncomment the `update` function to enable auto-update after publishing your first version.
- The app icon will **ALWAYS** be the default Electron icon in development. You will need to build the app with `npm run package` to get a new icon.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Electron-React-Boilerplate

See the Electron React Boilerplate [docs and guides here](https://electron-react-boilerplate.js.org/docs/installation)

#### Tutorials

- Creating multiple windows: <https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/623#issuecomment-1382717291>

## 📄 License

This project is licensed under the CC-BY-NC-SA-4.0 License.

[github-actions-status]: https://github.com/lacymorrow/crossover/workflows/Build/badge.svg
[github-actions-url]: https://github.com/lacymorrow/crossover/actions
[github-tag-image]: https://img.shields.io/github/tag/lacymorrow/crossover.svg?label=version
[github-tag-url]: https://github.com/lacymorrow/crossover/releases/latest
