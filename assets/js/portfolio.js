// scroll transitions + spin the ball video faster when you scroll faster
(() => {
  // respect user motion prefs
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // grab sections (bail if not on this page)
  const hero = document.getElementById("hero");
  const bio  = document.getElementById("bio");
  if (!hero || !bio) return;

  // bits we animate
  const idBlock = hero.querySelector(".id-block");
  const phWrap  = hero.querySelector(".portrait-wrap");
  const bioCopy = bio.querySelector(".bio-copy");
  const ballVid = bio.querySelector(".basketball-video");
  const ballFallback = bio.querySelector(".basketball-fallback");

  let raf = null;
  let lastY = window.scrollY;
  let velocity = 0; // how fast user is scrolling (px/frame-ish)

  // tiny utils
  const lerp = (a,b,t)=>a+(b-a)*t;
  const clamp = (v,min,max)=>Math.max(min, Math.min(max, v));

  // section progress 0..1 based on viewport
  function sectionProgress(el){
    const r = el.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    return 1 - clamp((r.bottom) / (vh + r.height), 0, 1);
  }

  // hide fallback once video can play
  if (ballVid){
    const ready = () => ballVid.classList.add("is-ready");
    ballVid.addEventListener("canplay",    ready, { once:true });
    ballVid.addEventListener("loadeddata", ready, { once:true });
  }

  // tweakables
  const BASE_RATE = 0.6;  // idle speed (1.0 = real-time)
  const MAX_RATE  = 3.0;  // cap
  const BOOST_K   = 0.03; // how spicy scroll → speed

  const draw = () => {
    raf = null;

    // intro moves up + shrinks a little as it scrolls out
    const pHero = sectionProgress(hero);
    if (idBlock){
      idBlock.style.setProperty("--id-y", `${lerp(0, -40, pHero)}px`);
      idBlock.style.setProperty("--id-scale", lerp(1, 0.96, pHero));
      idBlock.style.setProperty("--id-op", lerp(1, 0.85, pHero));
    }
    if (phWrap){
      phWrap.style.setProperty("--ph-y", `${lerp(0, -60, pHero)}px`);
      phWrap.style.setProperty("--ph-scale", lerp(1, 0.94, pHero));
      phWrap.style.setProperty("--ph-op", lerp(1, 0.8, pHero));
    }

    // bio slides/fades in
    const pBio = sectionProgress(bio);
    if (bioCopy){
      bioCopy.style.setProperty("--bio-y", `${lerp(24, 0, pBio)}px`);
      bioCopy.style.setProperty("--bio-op", lerp(0, 1, pBio));
    }

    // ball: bump playbackRate with scroll velocity
    if (ballVid && !reduce){
      const boost = clamp(Math.abs(velocity) * BOOST_K, 0, MAX_RATE - BASE_RATE);
      const target = clamp(BASE_RATE + boost, 0.1, MAX_RATE);
      const cur = ballVid.playbackRate || BASE_RATE;
      ballVid.playbackRate = cur + (target - cur) * 0.15; // smooth toward target

      // keep playing (browsers sometimes pause offscreen)
      if (ballVid.paused) {
        const p = ballVid.play();
        if (p && p.catch) p.catch(() => {});
      }
    }

    // let the velocity chill out
    velocity *= 0.86;
    requestAnimationFrame(draw);
  };

  if (!reduce){
    // track scroll speed + kick the render loop
    addEventListener("scroll", () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      velocity = clamp(velocity + dy, -60, 60);
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive:true });

    addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(draw); });
    requestAnimationFrame(draw);
  } else {
    // low-motion: keep it static
    if (bioCopy){
      bioCopy.style.removeProperty("--bio-y");
      bioCopy.style.setProperty("--bio-op", 1);
    }
    if (ballVid){ ballVid.pause(); }
  }
})();
