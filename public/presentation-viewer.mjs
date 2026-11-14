// Load PDF.js only after a presentation has been decrypted, never on page startup.
let pdfLibrary;
function loadPdfLibrary() {
  if (!pdfLibrary) pdfLibrary = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.min.mjs').then(lib => {
    lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
    return lib;
  }).catch(error => { pdfLibrary = null; throw error; });
  return pdfLibrary;
}

export async function mountPresentation(blob, container, isCurrent) {
  const lib = await loadPdfLibrary();
  if (!isCurrent()) return () => {};
  const loading = lib.getDocument({data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false});
  const pdf = await loading.promise;
  if (!isCurrent()) { await pdf.destroy(); return () => {}; }
  const toolbar = document.createElement('div'); toolbar.className = 'pdf-toolbar';
  const previous = document.createElement('button'); previous.type = 'button'; previous.textContent = '← Previous';
  const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Next →';
  const counter = document.createElement('span'); counter.setAttribute('aria-live', 'polite');
  const viewport = document.createElement('div'); viewport.className = 'pdf-viewport';
  const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img');
  viewport.append(canvas); toolbar.append(previous, counter, next); container.replaceChildren(toolbar, viewport);
  let pageNumber = 1, disposed = false, task = null, resizeTimer, generation = 0;
  async function render() {
    const version = ++generation;
    task?.cancel();
    previous.disabled = true; next.disabled = true;
    try {
      const page = await pdf.getPage(pageNumber);
      if (disposed || version !== generation) return;
      const size = page.getViewport({scale:1});
      const scale = Math.max(.1, Math.min((viewport.clientWidth - 16) / size.width, (viewport.clientHeight - 16) / size.height));
      const fitted = page.getViewport({scale});
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      // Replace the canvas so a cancelled render can never race with the next one.
      const surface = canvas.cloneNode();
      surface.width = Math.ceil(fitted.width * ratio); surface.height = Math.ceil(fitted.height * ratio);
      surface.style.width = `${fitted.width}px`; surface.style.height = `${fitted.height}px`;
      surface.setAttribute('aria-label', `Slide ${pageNumber} of ${pdf.numPages}`);
      viewport.replaceChildren(surface);
      counter.textContent = `${pageNumber} / ${pdf.numPages}`;
      task = page.render({canvasContext: surface.getContext('2d'), viewport: fitted, transform: ratio === 1 ? null : [ratio,0,0,ratio,0,0]});
      await task.promise;
    } catch(error) {
      if (!disposed && version === generation && error.name !== 'RenderingCancelledException') counter.textContent = 'Could not render slide. Use Open PDF above.';
    } finally {
      if (!disposed && version === generation) { previous.disabled = pageNumber <= 1; next.disabled = pageNumber >= pdf.numPages; }
    }
  }
  previous.addEventListener('click', () => { if(pageNumber > 1) { pageNumber--; render(); } });
  next.addEventListener('click', () => { if(pageNumber < pdf.numPages) { pageNumber++; render(); } });
  const onKey = event => {
    if (!isCurrent() || /INPUT|TEXTAREA/.test(event.target.tagName)) return;
    if(event.key === 'ArrowRight' && !next.disabled) { event.preventDefault(); next.click(); }
    if(event.key === 'ArrowLeft' && !previous.disabled) { event.preventDefault(); previous.click(); }
  };
  document.addEventListener('keydown', onKey);
  const observer = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 120); });
  observer.observe(viewport);
  await render();
  return () => { disposed = true; generation++; observer.disconnect(); clearTimeout(resizeTimer); document.removeEventListener('keydown', onKey); task?.cancel(); pdf.destroy(); container.replaceChildren(); };
}
