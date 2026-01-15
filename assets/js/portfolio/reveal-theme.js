/* reveals + theme flip + bg drift */
(() => {
  const reduce = matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const body = document.body;
  const about = document.getElementById("about");
  if (!about) return;

  const copy     = about.querySelector(".bio-copy");
  const ballWrap = about.querySelector(".ball-wrap");
  const portrait = about.querySelector(".portrait");

  copy?.classList.add("reveal");
  ballWrap?.classList.add("reveal");
  portrait?.classList.add("reveal");

  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      body.classList.toggle("theme-cream", e.isIntersecting);
    });
  }, { threshold: 0.15 });

  sectionIO.observe(about);

  const reveals = document.querySelectorAll(".reveal");
  if (reduce) {
    reveals.forEach(el => el.classList.add("in"));
  } else {
    const revealIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove("in");
          requestAnimationFrame(() =>
            requestAnimationFrame(() => e.target.classList.add("in"))
          );
        } else {
          e.target.classList.remove("in");
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

    reveals.forEach(el => revealIO.observe(el));
  }

  addEventListener("pointermove", e => {
    body.style.setProperty("--bgx", (e.clientX - innerWidth/2)*0.02 + "px");
    body.style.setProperty("--bgy", (e.clientY - innerHeight/2)*0.02 + "px");
  }, { passive:true });
})();
