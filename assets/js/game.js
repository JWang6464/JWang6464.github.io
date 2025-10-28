// footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// parallax on bg (respects reduce-motion)
(() => {
  const scene = document.querySelector(".office-scene");
  const vid = scene?.querySelector(".bg-video");
  if (!scene || !vid) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  let raf = null, tx = 0, ty = 0;
  const draw = () => { raf = null; vid.style.transform = `translate(${tx}px, ${ty}px) scale(1.04)`; };
  const move = (cx, cy) => {
    tx = (cx / innerWidth - 0.5) * 8;
    ty = (cy / innerHeight - 0.5) * 6;
    if (raf === null) raf = requestAnimationFrame(draw);
  };
  scene.addEventListener("mousemove", e => move(e.clientX, e.clientY), { passive:true });
  scene.addEventListener("touchmove", e => { const t = e.touches?.[0]; if (t) move(t.clientX, t.clientY); }, { passive:true });
})();

// pause video when offscreen
(() => {
  const v = document.querySelector(".bg-video");
  if (!v || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) { const p = target.play?.(); if (p && p.catch) p.catch(() => {}); }
      else { target.pause?.(); }
    });
  }, { threshold:0.15 });
  io.observe(v);
})();

// bots: left->right with wrap, mixed speeds, click to defeat (spiral where clicked)
(() => {
  const drones = Array.from(document.querySelectorAll(".drone"));
  const victory = document.getElementById("victory-msg");
  const rewardLink = document.getElementById("reward-link");
  const scene = document.querySelector(".office-scene");
  if (!drones.length || !victory || !rewardLink || !scene) return;

  const FAST_MIN = 180, FAST_MAX = 260;
  const MED_MIN  = 90,  MED_MAX  = 140;
  const FAST_RATIO = 0.55;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const movers = [];
  let defeated = 0;
  let running = true;

  const rnd = (min, max) => Math.random() * (max - min) + min;
  const pickSpeed = () => (Math.random() < FAST_RATIO) ? rnd(FAST_MIN, FAST_MAX) : rnd(MED_MIN, MED_MAX);
  const bounds = () => scene.getBoundingClientRect();

  // init
  const b0 = bounds();
  drones.forEach(d => {
    d.setAttribute("draggable", "false");
    d.setAttribute("tabindex", "0");
    d.setAttribute("role", "button");
    d.setAttribute("aria-label", "disable bot");

    const dur = Math.round(900 + Math.random() * 500);
    const drift = (Math.random() < 0.5 ? -1 : 1) * Math.round(30 + Math.random() * 70);
    d.style.setProperty("--dur", `${dur}ms`);
    d.style.setProperty("--drift", `${drift}px`);

    const dw = d.getBoundingClientRect().width || 140;
    const dh = d.getBoundingClientRect().height || 140;

    const startX = rnd(-dw, b0.width * 0.4);
    const startY = rnd(0, Math.max(0, b0.height - dh));

    const speed = pickSpeed();
    movers.push({ el:d, x:startX, y:startY, w:dw, h:dh, speed, active:true });
  });

  // keep inside vertically on resize
  addEventListener("resize", () => {
    const b = bounds();
    movers.forEach(m => {
      m.y = Math.min(Math.max(0, m.y), Math.max(0, b.height - m.h));
    });
  });

  // loop
  let last = performance.now();
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!reduce) {
      const b = bounds();
      for (const m of movers) {
        if (!m.active) continue;

        m.x += m.speed * dt; // move right

        // wrap to left
        if (m.x > b.width) {
          m.x = -m.w;
          m.y = Math.min(Math.max(0, rnd(0, b.height - m.h)), Math.max(0, b.height - m.h));
          m.speed = pickSpeed();
        }

        const rot = (m.speed * 0.02) % 15;
        m.el.style.transform = `translate(${m.x}px, ${m.y}px) rotate(${rot}deg)`;
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // freeze position at click, then spiral there (no teleport)
  const hit = (drone) => {
    const m = movers.find(mm => mm.el === drone);
    if (!m || !m.active) return;

    m.active = false;

    const sceneRect = scene.getBoundingClientRect();
    const botRect   = drone.getBoundingClientRect();
    drone.style.left = `${botRect.left - sceneRect.left}px`;
    drone.style.top  = `${botRect.top  - sceneRect.top }px`;
    drone.style.transform = "none";

    drone.classList.add("hit");
    defeated++;

    if (defeated === movers.length) {
      victory.classList.add("show");
      setTimeout(() => rewardLink.focus(), 250);
      running = false;
    }
  };

  drones.forEach(drone => {
    drone.addEventListener("click", () => hit(drone));
    drone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(drone); }
    });
  });
})();
