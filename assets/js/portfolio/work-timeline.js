/* work timeline */
(() => {
  const band = document.querySelector("#work .band");
  const list = document.querySelector("#work .milestones");
  if (!band || !list) return;

  const updateProgress = () => {
    const r = band.getBoundingClientRect();
    const vh = innerHeight || 1;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh*0.25)));
    band.style.setProperty("--railP", p.toFixed(4));
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e =>
      e.target.classList.toggle("in", e.isIntersecting)
    );
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

  list.querySelectorAll(".ms").forEach(ms => io.observe(ms));

  updateProgress();
  addEventListener("scroll", updateProgress, { passive:true });
  addEventListener("resize", updateProgress);
})();
