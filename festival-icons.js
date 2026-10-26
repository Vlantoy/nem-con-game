(() => {
  'use strict';
  const shapes = {
    target: '<path d="M7 2h10v2h3v3h2v10h-2v3h-3v2H7v-2H4v-3H2V7h2V4h3z"/><path d="M8 7h8v2h2v6h-2v2H8v-2H6V9h2z" fill="#b77919"/><path d="M10 10h4v4h-4z" fill="#71380f"/>',
    bot: '<path d="M11 1h2v4h6v3h3v12H2V8h3V5h6z"/><path d="M5 9h14v8H5z" fill="#71380f"/><path d="M7 11h3v3H7zm7 0h3v3h-3zM8 20h3v3H8zm5 0h3v3h-3z"/>',
    people: '<path d="M4 3h6v2h2v6h-2v2H4v-2H2V5h2zm10 1h5v2h2v5h-2v2h-5zM3 15h8v2h2v6H1v-6h2zm12 0h6v2h2v6h-8z"/>',
    person: '<path d="M8 2h8v2h2v7h-2v2H8v-2H6V4h2zM6 15h12v2h3v6H3v-6h3z"/><path d="M7 17h3v6H7zm7 0h3v6h-3z" fill="#b77919"/>',
    book: '<path d="M1 3h9l2 2 2-2h9v17h-9l-2 2-2-2H1z"/><path d="M4 6h5v2H4zm0 4h5v2H4zm11-4h5v2h-5zm0 4h5v2h-5zM11 6h2v13h-2z" fill="#71380f"/>',
    rice: '<path d="M11 3h2v20h-2zM6 2h4v6H6V6H4V2zm8 4h6v4h-2v2h-4zM4 10h6v6H8v-2H4zm10 5h6v4h-2v2h-4z"/>',
    shirt: '<path d="M7 2h3v4h4V2h3l6 5-3 5-3-2v12H7V10l-3 2-3-5z"/><path d="M10 6h4v16h-4zM7 16h10v3H7z" fill="#b77919"/>',
    rope: '<path d="M4 2h14v2h3v7h-3v3h-4v-3h4V5H5v5h5v3H5v5h10v-3h3v6H3V11H1V5h3z"/>',
    sound: '<path d="M1 9h5l6-6h2v18h-2l-6-6H1zM17 7h2v10h-2zm4-3h2v16h-2z"/>',
    muted: '<path d="M1 9h5l6-6h2v18h-2l-6-6H1zM17 8h2v2h2V8h2v3h-2v2h2v3h-2v-2h-2v2h-2v-3h2v-2h-2z"/>',
    menu: '<path d="M3 4h18v3H3zm0 7h18v3H3zm0 7h18v3H3z"/>',
    reset: '<path d="M5 2v5h12v2h3v9h-3v3H7v-3h9v-2h2v-5h-2V9H5v5L0 9z"/>',
    spark: '<path d="M12 1h4l-4 8h8L9 23h-3l4-10H3z"/>',
    trophy: '<path d="M6 2h12v3h5v8h-5v3h-4v4h5v3H5v-3h5v-4H6v-3H1V5h5zM3 7v4h3V7zm15 0v4h3V7z"/>',
    mouse: '<path d="M8 1h8v2h3v3h2v12h-2v3h-3v2H8v-2H5v-3H3V6h2V3h3z"/><path d="M11 2h2v8h-2zM5 11h14v2H5z" fill="#71380f"/>',
    flag: '<path d="M4 1h3v22H4zM8 2h13v10H8z"/><path d="M11 5h7v4h-7z" fill="#b77919"/>',
    swords: '<path d="M1 1h4l12 12 3-3 2 2-3 3 4 4-4 4-4-4-3 3-2-2 3-3L1 5zm18 0h4v4l-7 7-4-4zM1 19l6-6 4 4-6 6H1z"/>',
    shield: '<path d="M11 1h2l9 4v9l-4 5-6 4-6-4-4-5V5z"/><path d="M11 5h2v13h-2zM6 9h12v3H6z" fill="#b77919"/>',
    wind: '<path d="M2 5h14V3h-4V1h6v2h2v4h-2v2H2zm0 6h19v2h2v4h-2v2h-6v-2h4v-2H2zm0 6h8v2h2v4H8v-2h1v-2H2z"/>'
  };
  const aliases = new Map(Object.entries({ '🎯':'target','🤖':'bot','👥':'people','👤':'person','👦':'person','👧':'person','📖':'book','📜':'book','🌾':'rice','🌱':'rice','🎋':'rice','👘':'shirt','🧵':'rope','🔊':'sound','🔇':'muted','☰':'menu','🔄':'reset','↺':'reset','⚡':'spark','🏆':'trophy','🖱️':'mouse','🚀':'flag','🎉':'flag','⚔️':'swords','🛡️':'shield','🌪️':'wind' }));
  const markup = (name) => `<svg class="festival-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${shapes[name] || shapes.flag}</svg>`;
  window.FestivalIcons = Object.freeze({ markup });
  const replace = (root) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.closest('svg, script, style')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    if (root.nodeType === Node.TEXT_NODE) texts.push(root);
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const node of texts) {
      if (node.parentElement?.closest('svg, script, style')) continue;
      const value = node.textContent;
      if (![...aliases.keys()].some((key) => value.includes(key))) continue;
      const fragment = document.createDocumentFragment();
      let remaining = value;
      while (remaining) {
        let found = null;
        for (const [symbol, name] of aliases) {
          const position = remaining.indexOf(symbol);
          if (position >= 0 && (!found || position < found.position)) found = { symbol, name, position };
        }
        if (!found) { fragment.append(remaining); break; }
        fragment.append(remaining.slice(0, found.position));
        const template = document.createElement('template');
        template.innerHTML = markup(found.name);
        fragment.append(template.content);
        remaining = remaining.slice(found.position + found.symbol.length);
      }
      node.replaceWith(fragment);
    }
  };
  replace(document.body);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') replace(record.target);
      else for (const node of record.addedNodes) replace(node);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
