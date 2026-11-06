# mobileconsole

A lightweight, bookmarklet-injected mobile developer console. It adds a draggable, minimizable DevTools-style panel to the page you're inspecting.

## Features

- **Console:** run JavaScript, inspect returned values, and view page console messages, runtime errors, and unhandled promise rejections.
- **Sources:** browse script and stylesheet elements, including inline code; fetch and display same-origin external sources.
- **Mobile-first panel:** touch-friendly controls, draggable header, minimize/reopen, and responsive sizing.
- **No build step or dependencies.**

## Install as a bookmarklet

Create a browser bookmark named **MobileConsole** and set its URL to:

```javascript
javascript:(()=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/sspeth000/mobileconsole@main/mobileconsole.js';document.documentElement.appendChild(s)})()
```

Visit a page, then activate the bookmark. The console panel will appear over the page. If your browser does not let you edit a bookmark URL on mobile, create the bookmark on a desktop browser and sync bookmarks.

You can also test it by opening a page, opening its developer console, and running the contents of `mobileconsole.js`.

## Use

- Tap **Console** to execute JavaScript. Press **Run** or Enter; use Shift+Enter for a newline.
- Tap **Sources** to list script and stylesheet elements. Select an entry to view its text.
- Drag the top bar to move the panel.
- Tap **—** to minimize; use the **DevTools** button to reopen.
- Tap **×** to close and restore the original console methods.

## Limitations and safety

- Browsers restrict access to cross-origin source files. Those entries may show an error or need to be opened in a new tab.
- This is a page-context debugging helper, not a full browser DevTools replacement. It cannot inspect browser internals, network panels, private source maps, or files the page does not expose.
- Running JavaScript executes code in the current page with that page's permissions. Only use it on pages you trust, and be careful with code that changes data or submits forms.
- The bookmarklet loads the latest script from jsDelivr. For offline use, host `mobileconsole.js` yourself and update the bookmarklet URL.

## Development

The project is intentionally dependency-free. Edit `mobileconsole.js` and refresh the page after updating the bookmarklet source.

## License

MIT
