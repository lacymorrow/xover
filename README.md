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

# Cait Title

Based on the [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate), this boilerplate adds UI components from [Shadcn](https://ui.shadcn.com/), styling with [Tailwind CSS](https://tailwindcss.com/), persistance with [electron-store](https://github.com/sindresorhus/electron-store), and a structured [React](https://react.dev/) context that promotes a data flow from the top down: Main process -> Renderer process.

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Features

- 💬 App and System-wide Notifications
- 🏃‍♂️ Auto Updater
- 📦 Built-in Store
- 🖱️ Context Menu
- 🌙 Dark Mode
- ❌ Error Handler
- ⌨️ Keyboard Shortcut Manager
- 📝 Logging
- 🀱 Menu Bar for macOS, Windows, and Linux
- 📂 Multi-Window
- 🖥️ System Tray

## Getting Started

```bash

# Clone this repository
git clone https://github.com/lacymorrow/crossover.git

# Go into the repository
cd crossover

# Install dependencies
yarn

# Run the app
yarn start
```

## BuiltWith

- [Electron](https://electronjs.org/)
- [React](https://reactjs.org/)
- [React Router](https://reacttraining.com/react-router/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)

### Shadcn

Shadcn is a UI component library for React. See the [Shadcn docs](https://ui.shadcn.com/) for more information.
Use `npx shadcn-ui@latest add accordion ...` to add a component to your project.

_Current installation command (to update all ui components):_
```sh
npx shadcn-ui@latest add button checkbox dropdown-menu form input menubar radio-group scroll-area select separator sonner switch textarea
```

_To list components with updates: `npx shadcn-ui@latest diff`_

## Electron-React-Boilerplate Docs

See the Electron React Boilerplate [docs and guides here](https://electron-react-boilerplate.js.org/docs/installation)


### Tutorials

- Creating multiple windows: https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/623#issuecomment-1382717291


## License

MIT © [Lacy Morrow](https://github.com/lacymorrow)

[github-actions-status]: https://github.com/lacymorrow/electron-shadcn-boilerplate/workflows/Build/badge.svg
[github-actions-url]: https://github.com/lacymorrow/electron-shadcn-boilerplate/actions
[github-tag-image]: https://img.shields.io/github/tag/electron-react-boilerplate/electron-react-boilerplate.svg?label=version
[github-tag-url]: https://github.com/lacymorrow/electron-shadcn-boilerplate/releases/latest
[stackoverflow-img]: https://img.shields.io/badge/stackoverflow-electron_react_boilerplate-blue.svg
[stackoverflow-url]: https://stackoverflow.com/questions/tagged/electron-react-boilerplate
