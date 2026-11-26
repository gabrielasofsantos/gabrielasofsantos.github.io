(() => {
  const root = document.documentElement;
  const key = 'portfolio-navigation';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;
  let recovery;
  const reset = () => {
    navigating = false;
    clearTimeout(recovery);
    delete root.dataset.pageTransition;
    try { sessionStorage.removeItem(key); } catch {}
  };
  try {
    const pending = JSON.parse(sessionStorage.getItem(key) || 'null');
    sessionStorage.removeItem(key);
    if (pending && Date.now() - pending.time < 15000 && pending.path === location.pathname && !reduced()) {
      root.dataset.pageTransition = 'enter';
    }
  } catch {}
  window.portfolioNavigate = href => {
    if (navigating) return;
    const url = new URL(href, location.href);
    if (url.href === location.href || reduced()) { location.assign(url.href); return; }
    navigating = true;
    root.dataset.pageTransition = 'leave';
    try { sessionStorage.setItem(key, JSON.stringify({ path: url.pathname, time: Date.now() })); } catch {}
    recovery = setTimeout(reset, 10000);
    setTimeout(() => location.assign(url.href), 140);
  };
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || /\.[a-z0-9]+$/i.test(url.pathname)) return;
    event.preventDefault();
    window.portfolioNavigate(url.href);
  });
  const ready = async () => {
    if (root.dataset.pageTransition !== 'enter') return;
    const images = [...document.querySelectorAll('main img')].filter(img => {
      const box = img.getBoundingClientRect();
      return box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
    });
    await Promise.race([
      Promise.all(images.map(img => img.decode?.().catch(() => {}) )),
      new Promise(resolve => setTimeout(resolve, 1800)),
    ]);
    requestAnimationFrame(() => requestAnimationFrame(reset));
  };
  document.addEventListener('DOMContentLoaded', ready, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
  // Always restore visibility, even if an image or hydration fails.
  setTimeout(() => { if (root.dataset.pageTransition === 'enter') reset(); }, 2500);
})();
