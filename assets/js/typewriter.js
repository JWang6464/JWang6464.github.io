(() => {
  const el = document.getElementById("type-target");
  if (!el) return;

  const lines = [
    "AI/ML Engineer studying Computer Science (AI) + Statistics at Colby College.",
    "New Grad Software Engineer focused on full-stack product building.",
    "Building practical AI systems: data, models, and clean UX.",
    "I like shipping things that actually get used."
  ];

  let line = 0;
  let char = 0;
  let deleting = false;

  const typeSpeed = 28;
  const deleteSpeed = 16;
  const pauseAfterType = 1100;
  const pauseAfterDelete = 300;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    el.textContent = lines[0];
    return;
  }

  function tick() {
    const current = lines[line];

    if (!deleting) {
      char++;
      el.textContent = current.slice(0, char);

      if (char === current.length) {
        deleting = true;
        setTimeout(tick, pauseAfterType);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      char--;
      el.textContent = current.slice(0, char);

      if (char === 0) {
        deleting = false;
        line = (line + 1) % lines.length;
        setTimeout(tick, pauseAfterDelete);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }

  tick();
})();
