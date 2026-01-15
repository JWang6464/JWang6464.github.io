/* projects slider */
(() => {
  const track = document.getElementById('projTrack');
  const prev  = document.getElementById('projPrev');
  const next  = document.getElementById('projNext');
  if(!track || !prev || !next) return;

  const cardW = () =>
    track.querySelector('.proj-card')?.getBoundingClientRect().width || 360;
  const gap = () =>
    parseFloat(getComputedStyle(track).gap) || 24;
  const step = () => cardW() + gap();

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  const updateBtns = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max;
  };

  const go = dir => {
    track.scrollTo({
      left: clamp(track.scrollLeft + dir*step(), 0, track.scrollWidth),
      behavior: "smooth"
    });
  };

  prev.addEventListener("click",()=>go(-1));
  next.addEventListener("click",()=>go(1));
  track.addEventListener("scroll",updateBtns,{passive:true});
  addEventListener("resize",updateBtns);

  let startX=0, scrollLeft=0, dragging=false;
  track.addEventListener("pointerdown",e=>{
    dragging=true;
    startX=e.clientX;
    scrollLeft=track.scrollLeft;
  });
  addEventListener("pointerup",()=>dragging=false);
  addEventListener("pointermove",e=>{
    if(!dragging) return;
    track.scrollLeft = scrollLeft + (startX - e.clientX);
  });

  track.setAttribute("tabindex","0");
  track.addEventListener("keydown",e=>{
    if(e.key==="ArrowRight"){ e.preventDefault(); go(1); }
    if(e.key==="ArrowLeft"){ e.preventDefault(); go(-1); }
  });

  requestAnimationFrame(updateBtns);
})();
