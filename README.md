# Vite + React + TypeScript + Tailwind CSS + Electron Desktop App

This project is a desktop application built with the following technologies:
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Electron](https://www.electronjs.org/) - Build cross-platform desktop apps with JavaScript, HTML, and CSS

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14.18+ or v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-folder>
```

2. Install dependencies
```bash
npm install
```

### Development

#### Web Development

Run the web version of the app in development mode:
```bash
npm run dev
```

#### Desktop Development

Run the desktop version of the app in development mode:
```bash
npm run electron:dev
```

Or run the Vite development server and Electron separately:
```bash
# Terminal 1: Start the Vite development server
npm run dev

# Terminal 2: Start the Electron app
npm run electron:start
```

### Building

#### Web Build

Build the web version of the app:
```bash
npm run build
```

#### Desktop Build

Build the desktop app for the current platform:
```bash
npm run electron:build
```

Package the desktop app for macOS and Windows:
```bash
npm run electron:package
```

## Project Structure

- `electron/` - Electron-specific files
  - `electron-main.cjs` - Electron main process (CommonJS)
  - `preload.cjs` - Preload script that runs before the renderer (CommonJS)
  - `tsconfig.json` - TypeScript configuration for Electron
- `src/` - Source files
  - `assets/` - Static assets like images
  - `components/` - React components
  - `App.tsx` - Main application component
  - `main.tsx` - Application entry point
  - `electron.d.ts` - TypeScript declarations for Electron
- `public/` - Public static files
- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration for web
- `vite.electron.config.ts` - Vite configuration for Electron
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration for React

## Desktop App Features

- Cross-platform desktop application (Windows, macOS, Linux)
- Native desktop experience
- Inter-process communication between main and renderer processes
- Access to system resources (file system, notifications, etc.)

## License

MIT
