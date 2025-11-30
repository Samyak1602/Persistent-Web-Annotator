# Persistent Web Annotator

A Chrome Extension built with React, Vite, and TailwindCSS that allows you to add persistent annotations to any webpage. All data is stored locally using `chrome.storage.local` - no backend required!

## Features

- **Context Menu Integration**: Right-click on selected text and choose "Add ContextMemo" to create a note
- **Persistent Highlights**: Your annotations are saved with yellow highlights that persist across page reloads
- **Shadow DOM Isolation**: UI components are injected using Shadow DOM to prevent CSS conflicts
- **Dashboard Popup**: View and manage notes for the current page or search across all pages
- **Smart DOM Locators**: Uses a hybrid selector strategy to reliably find and restore text selections

## Tech Stack

- **Build Tool**: Vite with `@crxjs/vite-plugin` for HMR and manifest handling
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Manifest**: V3
- **Storage**: `chrome.storage.local`

## Project Structure

```
src/
├── background/          # Service worker for context menu
├── content/             # Content script with Shadow DOM injection
├── popup/               # Dashboard UI
├── components/          # Shared React components
├── utils/               # Storage and DOM locator utilities
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## Setup & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Usage

1. **Create a note:**
   - Select text on any webpage
   - Right-click and choose "Add ContextMemo"
   - Enter your note in the floating input
   - Click "Save" or press Ctrl+Enter

2. **View notes:**
   - Click the extension icon in the toolbar
   - View notes for the current page or use "Global Search" to find notes across all pages

3. **Delete notes:**
   - Click the ✕ button next to any note in the popup
   - The highlight will be removed from the page immediately

## Storage Schema

Notes are stored in `chrome.storage.local` with the following structure:

```json
{
  "notes": [
    {
      "id": "uuid-v4",
      "url": "https://example.com/page",
      "content": "User input note",
      "domLocator": {
        "selector": "body > div > p",
        "textOffset": 123,
        "textContent": "selected text"
      },
      "createdAt": 123456789
    }
  ]
}
```

## Permissions

- `storage`: Store notes locally
- `activeTab`: Access current tab information
- `scripting`: Inject content scripts
- `contextMenus`: Add context menu items
- `host_permissions`: Access all URLs for content script injection

## Development Notes

- The content script uses Shadow DOM to isolate React components from page styles
- DOM locators use a hybrid strategy combining CSS selectors with text offsets for reliable restoration
- Highlights are restored automatically when pages load
- The extension works with SPAs (Single Page Applications) by monitoring DOM changes

