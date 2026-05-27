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
  function computeStops(){
    const rect = root.getBoundingClientRect();
    const rootTopPage = window.scrollY + rect.top;
    // expand the mapping window so the line can complete past the visible area if needed
    const startOffset = rootTopPage - (window.innerHeight * 0.25);
    const endOffset = rootTopPage + rect.height + (window.innerHeight * 0.25);
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
    const rect = root.getBoundingClientRect();
    const rootTopPage = window.scrollY + rect.top;
    // use an expanded mapping window so the line can reach the end even when page is short
    const startOffset = rootTopPage - (window.innerHeight * 0.15);
    const endOffset = rootTopPage + rect.height - (window.innerHeight * 0.25);
    const viewportCenter = window.scrollY + (window.innerHeight / 2);
    const p = (viewportCenter - startOffset) / Math.max(1, endOffset - startOffset);
    return Math.max(0, Math.min(1, p));
  }

  // throttle updates to ~30fps for smoother performance
  let lastUpdate = 0;
  function loop(){
    const now = performance.now();
    if(now - lastUpdate > 33){
      updateFromRatio(calcScrollProgress());
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
    computeStops();
    rafId = requestAnimationFrame(loop);
  });

  // observe individual items to reveal markers/content
    try{
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        en.target.classList.toggle('in-view', en.isIntersecting);
      });
    }, { threshold: 0.25 });
    items.forEach(item => io.observe(item));
  }catch(e){/* noop */}

  // (setupPath already called during initialization)

})();
