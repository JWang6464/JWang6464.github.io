/* Vertical scroll-driven timeline for Work */
(function(){
  const root = document.getElementById('workTimeline');
  if(!root) return;

  const path = root.querySelector('#timeline-path');
  const items = Array.from(root.querySelectorAll('.timeline-item'));
  let pathLen = 0;
  let ticking = false;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupPath(){
    if(!path) return;
    try{
      pathLen = path.getTotalLength();
    }catch(e){
      // fallback fixed length
      pathLen = 1000;
    }
      // set explicit px units so computed styles are consistent
      path.style.strokeDasharray = pathLen + 'px';
      path.style.strokeDashoffset = pathLen + 'px';
    // ensure the SVG element spans the full timeline height so the path lines up with items
    try{
      const svgEl = root.querySelector('.timeline-svg');
      if(svgEl){
        const h = Math.max( Math.round(root.getBoundingClientRect().height), 220 );
        svgEl.style.height = h + 'px';
      }
    }catch(e){/* noop */}
    if(prefersReduced) path.style.transition = 'none';
    // initialize stroke position based on initial visibility
    try{
      const rect = root.getBoundingClientRect();
      const visible = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const ratio = rect.height > 0 ? Math.min(1, visible / rect.height) : 0;
      updateFromRatio(ratio);
    }catch(e){ /* noop */ }
  }

  // compute stop ratios for each timeline item so the line can step to markers
  let stops = [];
  function getTimelineRange(){
    const rect = root.getBoundingClientRect();
    const rootTopPage = window.scrollY + rect.top;
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    const startOffset = rootTopPage + (firstItem ? firstItem.offsetTop - (window.innerHeight * 0.35) : 0);
    const endOffset = rootTopPage + (lastItem ? lastItem.offsetTop + lastItem.offsetHeight + (window.innerHeight * 0.35) : rect.height);
    return { rootTopPage, startOffset, endOffset };
  }

  function computeStops(){
    const { rootTopPage, startOffset, endOffset } = getTimelineRange();
    const span = Math.max(1, endOffset - startOffset);
    stops = items.map(it => {
      const itemCenterPageY = rootTopPage + it.offsetTop + (it.offsetHeight / 2);
      return Math.max(0, Math.min(1, (itemCenterPageY - startOffset) / span));
    });
    if(stops.length) stops[stops.length-1] = 1;
  }

  function updateFromRatio(ratio){
    const progress = Math.max(0, Math.min(1, ratio));
    // gently amplify progress so the line doesn't feel sluggish
      const amplified = Math.min(1, progress * 1.25);
    // continuous draw (no stepping) for smoother progression
    const target = amplified;
    // if we're essentially at the end, snap the line fully drawn to avoid off-by-one stops
    if(progress >= 0.98){
      path.style.strokeDashoffset = '0px';
    }else{
      const offset = pathLen * (1 - target);
      path.style.strokeDashoffset = (offset) + 'px';
    }
    document.body.classList.toggle('is-work-visible', progress > 0.02);
    // also toggle the title more responsively
    try{
      const title = document.querySelector('#work .work-title');
      if(title) title.classList.toggle('is-visible', progress > 0.02);
    }catch(e){/* noop */}
  }

  function syncItems(progress){
    // reveal items slightly before the line reaches their marker
    // use a larger lead for the final item so it appears earlier without losing hide-on-scroll
    const baseRevealLead = 0.18;
    const extraForLast = 0.22; // extra early reveal for the final item
    const minThreshold = 0.02; // don't reveal immediately at page top
    items.forEach((item, index) => {
      const stop = stops[index] ?? 1;
      const lead = baseRevealLead + (index === items.length - 1 ? extraForLast : 0);
      const threshold = Math.max(minThreshold, stop - lead);
      const shouldReveal = progress >= threshold;
      item.classList.toggle('in-view', shouldReveal);
    });
  }

  // Use IntersectionObserver on the timeline container for reliable progress
  try{
    // build an array of thresholds 0..1 at 100 steps for smooth updates
    const thresholds = Array.from({length:101}, (_,i)=>i/100);
    const rootIo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // recompute stops when visibility/layout changes
        computeStops();
        // start/stop the rAF loop depending on visibility to save CPU
        if(entry.intersectionRatio > 0){
          if(!rafId && !prefersReduced){ computeStops(); loop(); }
        }else{
          if(rafId) cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    }, { threshold: thresholds });
    rootIo.observe(root);
  }catch(e){
    /* noop */
  }

  // scroll-driven progress (rAF loop)
  let rafId = null;
  function calcScrollProgress(){
    const { startOffset, endOffset } = getTimelineRange();
    const viewportCenter = window.scrollY + (window.innerHeight / 2);
    const span = Math.max(1, endOffset - startOffset);
    // If the user is at (or very near) the bottom of the page, treat as fully progressed
    if (window.scrollY + window.innerHeight >= (document.documentElement.scrollHeight - 8)) return 1;
    // If the viewport center is within a small buffer of the end, snap to complete
    const buffer = Math.min(window.innerHeight * 0.15, span * 0.06);
    if (viewportCenter >= endOffset - buffer) return 1;
    const p = (viewportCenter - startOffset) / span;
    return Math.max(0, Math.min(1, p));
  }

  // throttle updates to ~30fps for smoother performance
  let lastUpdate = 0;
  function loop(){
    const now = performance.now();
    if(now - lastUpdate > 33){
      const progress = calcScrollProgress();
      updateFromRatio(progress);
      syncItems(progress);
      lastUpdate = now;
    }
    rafId = requestAnimationFrame(loop);
  }

  // initialize SVG path and start the loop
  try{
    setupPath();
  }catch(e){/* noop */}

  if(!prefersReduced){
    computeStops();
    loop();
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    // refresh svg sizing and stops on resize
    try{ const svgEl = root.querySelector('.timeline-svg'); if(svgEl) svgEl.style.height = Math.max( Math.round(root.getBoundingClientRect().height), 220 ) + 'px'; }catch(e){}
    computeStops();
    rafId = requestAnimationFrame(loop);
  });

  // individual-item IntersectionObserver removed — visibility is driven by `syncItems(progress)`
  // (keeps reveal/hide behavior consistent with the SVG draw progress)

  // (setupPath already called during initialization)

})();
