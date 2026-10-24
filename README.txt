JAVASCRIPT PROGRESS TRACKER

Files:
- index.html : page structure
- style.css  : responsive styling
- script.js  : progress, filters, storage, export, and interactions
- data.js    : topics and TRUE/FALSE starting values extracted from your sheet

HOW TO RUN
1. Keep all four files in the same folder.
2. Open index.html in Chrome or Edge. VS Code Live Server is also fine.
3. Tick a checkbox when you complete a topic. Progress saves automatically in this browser.
4. Use Export progress to download a JSON backup.

IMPORTANT
- The checked/unchecked initial state follows the TRUE/FALSE values in your provided sheet.
- Later changes are stored in this browser's localStorage. Clearing browser data may remove saved progress.
- To return to the original sheet values, press Ctrl+Shift+R and confirm Reset progress.
- If you update the tracker from GitHub Pages, commit and push index.html, style.css, script.js, and data.js together.
