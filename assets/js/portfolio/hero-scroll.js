/* hero scroll + ball rotation */
(() => {
  const reduce = matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hero = document.getElementById("hero");
  const bio  = document.getElementById("about");
  if (!hero || !bio) return;

  const idBlock = hero.querySelector(".id-block");
  const bioCopy = bio.querySelector(".bio-copy");
  const ball    = bio.querySelector(".basketball");

  let raf=null, lastY=scrollY, lastT=performance.now(), deg=0;
  const IDLE_DPS=12, SCROLL_DEG_PER_PX=.5;
  const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const sectionProgress=(el)=>{
    const r=el.getBoundingClientRect(), vh=Math.max(1,innerHeight);
    return 1 - clamp((r.bottom)/(vh+r.height),0,1);
  };

  const draw=(now)=>{
    raf=null;

    const pHero=sectionProgress(hero);
    if(idBlock){
      idBlock.style.setProperty("--id-y", `${lerp(0,-20,pHero)}px`);
      idBlock.style.setProperty("--id-scale", lerp(1,.98,pHero));
      idBlock.style.setProperty("--id-op",    lerp(1,.90,pHero));
    }

    const pBio=sectionProgress(bio);
    if(bioCopy){
      bioCopy.style.setProperty("--bio-y",  `${lerp(24,0,pBio)}px`);
      bioCopy.style.setProperty("--bio-op",  lerp(0,1,pBio));
    }

    if(!reduce && ball){
      const dt=Math.min(.05,(now-lastT)/1000); lastT=now;
      deg=(deg+IDLE_DPS*dt)%360;
      ball.style.transform=`rotate(${deg}deg)`;
    }

    requestAnimationFrame(draw);
  };

  if(!reduce){
    addEventListener("scroll",()=>{
      const dy=scrollY-lastY; lastY=scrollY;
      if (ball) deg=(deg+dy*SCROLL_DEG_PER_PX)%360;
      if(!raf){ lastT=performance.now(); raf=requestAnimationFrame(draw); }
    },{passive:true});

    addEventListener("resize",()=>{ if(!raf) raf=requestAnimationFrame(draw); });
    lastT=performance.now();
    requestAnimationFrame(draw);
  } else {
    bioCopy?.style.removeProperty("--bio-y");
    bioCopy?.style.setProperty("--bio-op",1);
  }
})();
