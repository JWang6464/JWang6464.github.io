/* spin + scroll glue */
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
  const sectionProgress=(el)=>{ const r=el.getBoundingClientRect(), vh=Math.max(1,innerHeight); return 1 - clamp((r.bottom)/(vh+r.height),0,1); };

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
    lastT=performance.now(); requestAnimationFrame(draw);
  }else{
    bioCopy?.style.removeProperty("--bio-y");
    bioCopy?.style.setProperty("--bio-op",1);
  }
})();

/* shards bg */
(() => {
  let cvs = document.getElementById("crystalsFx");
  if (!cvs) { cvs = document.createElement("canvas"); cvs.id = "crystalsFx"; }
  cvs.classList.add("bgfx");
  if (cvs.parentElement !== document.body) document.body.prepend(cvs);
  Object.assign(cvs.style,{position:"fixed",inset:"0",zIndex:"-1",display:"block",pointerEvents:"none"});

  const ctx = cvs.getContext("2d",{alpha:true});

  let w=0,h=0,dpr=1,t=0;
  let mx=-1,my=-1, pmx=-1,pmy=-1, mvx=0,mvy=0, lastMoveT=performance.now();
  const shards=[], pulses=[];
  const BASE=[112,156,140], MID=[152,190,175], HI=[220,238,232];

  const RADIUS=48, REST=0.12, FRICTION=0.05, DAMP=0.992, PULSE_FORCE=12.0, PULSE_SPEED=5.2;
  const rand=(a,b)=>a+Math.random()*(b-a), mix=(a,b,p)=>a*(1-p)+b*p, rgba=(r,g,b,a)=>`rgba(${r|0},${g|0},${b|0},${a})`, len=(x,y)=>Math.hypot(x,y)||1;

  function makeShard(){
    const size=rand(22,56), sides=(Math.random()<0.4?6:7), axis=Math.random()*Math.PI*2, verts=[];
    for(let i=0;i<sides;i++){
      const a=i*(Math.PI*2/sides)+rand(-0.18,0.18), align=Math.cos(a-axis), taper=0.55+0.45*Math.abs(align);
      const r=size*rand(0.65,1.0)*taper; verts.push([Math.cos(a)*r, Math.sin(a)*r]);
    }
    for(let i=0;i<verts.length;i++){
      const p=verts[i], n=verts[(i+1)%verts.length], b=verts[(i-1+verts.length)%verts.length];
      const vx=b[0]-n[0], vy=b[1]-n[1], l=len(vx,vy), nx=-vy/l, ny=vx/l;
      p[0]+=nx*1.2; p[1]+=ny*1.2;
    }
    return { x:rand(0,w), y:rand(0,h), vx:rand(-0.3,0.3), vy:rand(-0.3,0.3), rot:rand(0,Math.PI*2), rv:rand(-0.005,0.005), size, hue:rand(0.35,0.8), verts, mass:size*0.3 };
  }

  function resize(){
    dpr=Math.min(2, devicePixelRatio||1);
    w=innerWidth|0; h=innerHeight|0;
    cvs.width=w*dpr; cvs.height=h*dpr;
    cvs.style.width="100vw"; cvs.style.height="100vh";
    ctx.setTransform(dpr,0,0,dpr,0,0);

    shards.length=0;
    const count=Math.floor((w*h)/32000);
    for(let i=0;i<count;i++) shards.push(makeShard());
  }

  function applyImpulse(s,jx,jy){ s.vx+=jx/s.mass; s.vy+=jy/s.mass; }

  function collideMouse(s){
    if(mx<0) return;
    const dx=s.x-mx, dy=s.y-my, dist=Math.hypot(dx,dy), hitR=RADIUS+s.size*0.42;
    if(dist<hitR){
      const nx=dx/(dist||1), ny=dy/(dist||1), relvx=s.vx-mvx*12, relvy=s.vy-mvy*12, vn=relvx*nx+relvy*ny;
      if(vn<0){
        const j=-(1+REST)*vn/(1/s.mass); applyImpulse(s,nx*j,ny*j);
        const tx=-ny, ty=nx, vt=relvx*tx+relvy*ty, jt=-FRICTION*vt/(1/s.mass); applyImpulse(s,tx*jt,ty*jt);
      }
      const pen=(hitR-dist); s.x+=nx*pen*0.22; s.y+=ny*pen*0.22;
    }
  }

  function update(dt){
    const now=performance.now(), dtt=Math.max(1, now-lastMoveT);
    mvx=(mx>=0 && pmx>=0)?(mx-pmx)/dtt:0; mvy=(my>=0 && pmy>=0)?(my-pmy)/dtt:0; lastMoveT=now; pmx=mx; pmy=my;

    for(const s of shards){
      collideMouse(s);
      for(const p of pulses){
        const dx=s.x-p.x, dy=s.y-p.y, d=Math.hypot(dx,dy);
        if(d>p.r-22 && d<p.r+22){
          const nx=dx/(d||1), ny=dy/(d||1), k=(1-Math.abs(d-p.r)/22);
          applyImpulse(s, nx*PULSE_FORCE*k, ny*PULSE_FORCE*k);
        }
      }
      s.x+=s.vx*dt*60; s.y+=s.vy*dt*60; s.rot+=s.rv*dt*60;
      s.vx*=DAMP; s.vy*=DAMP; s.rv*=DAMP;
      if(s.x<-80)s.x=w+80; else if(s.x>w+80)s.x=-80;
      if(s.y<-80)s.y=h+80; else if(s.y>h+80)s.y=-80;
    }

    for(let i=pulses.length-1;i>=0;i--){
      const p=pulses[i]; p.r+=PULSE_SPEED*dt*60; p.a*=0.97;
      if(p.a<0.02) pulses.splice(i,1);
    }
  }

  function drawShard(s){
    ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.rot);
    const p=s.hue, r=mix(BASE[0],mix(MID[0],HI[0],p),p), g=mix(BASE[1],mix(MID[1],HI[1],p),p), b=mix(BASE[2],mix(MID[2],HI[2],p),p);
    const grad=ctx.createLinearGradient(-s.size,-s.size,s.size,s.size);
    grad.addColorStop(0,  rgba(r+10,g+14,b+12,0.35));
    grad.addColorStop(0.45,rgba(r+26,g+28,b+28,0.95));
    grad.addColorStop(1,  rgba(r,g,b,0.65));
    ctx.fillStyle=grad;

    ctx.beginPath(); ctx.moveTo(s.verts[0][0],s.verts[0][1]);
    for(let i=1;i<s.verts.length;i++) ctx.lineTo(s.verts[i][0],s.verts[i][1]);
    ctx.closePath(); ctx.fill();

    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.10)"; ctx.stroke();

    ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.lineWidth=1.3; ctx.beginPath();
    for(let i=0;i<s.verts.length;i++){
      const a=s.verts[i], b=s.verts[(i+1)%s.verts.length];
      const ex=b[0]-a[0], ey=b[1]-a[1], L=Math.hypot(ex,ey)||1, nx=-ey/L, ny=ex/L;
      if(nx*-0.6 + ny*-0.8 > 0.1){ ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); }
    }
    ctx.strokeStyle="rgba(255,255,255,0.22)"; ctx.stroke(); ctx.restore();

    ctx.save(); ctx.globalCompositeOperation="lighter";
    for(let i=0;i<s.verts.length;i++){
      const a=s.verts[i], b=s.verts[(i+1)%s.verts.length], mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
      const g2=ctx.createRadialGradient(mx,my,0,mx,my,4);
      g2.addColorStop(0,"rgba(255,255,255,0.55)");
      g2.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(mx,my,2,0,Math.PI*2); ctx.fill();
    }
    ctx.restore(); ctx.restore();
  }

  function drawPulse(p){
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
    g.addColorStop(0,`rgba(255,255,255,${p.a*0.8})`);
    g.addColorStop(0.6,`rgba(220,245,235,${p.a*0.35})`);
    g.addColorStop(1,`rgba(255,255,255,0)`);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();

    ctx.save(); ctx.globalCompositeOperation="lighter";
    ctx.strokeStyle=`rgba(210,240,230,${p.a*1.2})`;
    ctx.lineWidth=4; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  function frame(now){
    const dt=Math.min(40, now - t || 16)/1000; t=now;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="rgba(240,247,243,0.42)";
    ctx.fillRect(0,0,w,h);
    update(dt);
    for(const p of pulses) drawPulse(p);
    shards.sort((a,b)=>a.y-b.y);
    for(const s of shards) drawShard(s);
    requestAnimationFrame(frame);
  }

  addEventListener("pointermove",(e)=>{ mx=e.clientX; my=e.clientY; },{passive:true});
  addEventListener("pointerleave",()=>{ pmx=mx=-1; pmy=my=-1; });
  addEventListener("pointerdown",(e)=>{ pulses.push({x:e.clientX,y:e.clientY,r:10,a:1}); });

  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);

  requestAnimationFrame(() => {
    document.body.classList.remove("rest-bg-off");
    document.body.classList.add("rest-bg-on");
  });
})();

/* theme flip + reveals + tiny bg drift */
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

  const sectionIO = new IntersectionObserver((ents)=>{
    for (const e of ents){
      if (e.target === about){
        if (e.isIntersecting) body.classList.add("theme-cream");
        else body.classList.remove("theme-cream");
      }
    }
  }, { threshold: 0.15 });
  sectionIO.observe(about);

  const reveals = document.querySelectorAll(".reveal");
  if (reduce){
    reveals.forEach(el => el.classList.add("in"));
  }else{
    const revealIO = new IntersectionObserver((ents)=>{
      for (const e of ents){
        if (e.isIntersecting){
          e.target.classList.remove("in");
          requestAnimationFrame(()=>requestAnimationFrame(()=>e.target.classList.add("in")));
        }else{
          e.target.classList.remove("in");
        }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(el => revealIO.observe(el));
  }

  addEventListener("pointermove",(e)=>{
    const x=(e.clientX-innerWidth/2)*0.02, y=(e.clientY-innerHeight/2)*0.02;
    body.style.setProperty("--bgx", x+"px");
    body.style.setProperty("--bgy", y+"px");
  }, {passive:true});
})();

/* work: milestone band */
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

  const io = new IntersectionObserver((entries)=>{
    for (const e of entries){
      if (e.isIntersecting) e.target.classList.add("in");
      else e.target.classList.remove("in");
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  list.querySelectorAll(".ms").forEach(ms => io.observe(ms));

  updateProgress();
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress);
})();


/* projects slider */
(() => {
  const track = document.getElementById('projTrack');
  const prev  = document.getElementById('projPrev');
  const next  = document.getElementById('projNext');
  if(!track || !prev || !next) return;

  const cardW = () => track.querySelector('.proj-card')?.getBoundingClientRect().width || 360;
  const gap   = () => parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
  const step  = () => cardW() + gap();

  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  const updateBtns = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max;
  };

  const go = dir => {
    const target = clamp(track.scrollLeft + (dir * step()), 0, track.scrollWidth);
    track.scrollTo({ left: target, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(+1));
  track.addEventListener('scroll', updateBtns, { passive:true });
  addEventListener('resize', updateBtns);

  // drag to scroll
  let sx=0, sl=0, drag=false;
  const start = e => { drag=true; sx=(e.touches?e.touches[0].clientX:e.clientX); sl=track.scrollLeft; track.classList.add('drag'); };
  const move  = e => { if(!drag) return; const x=(e.touches?e.touches[0].clientX:e.clientX); track.scrollLeft = sl + (sx - x); };
  const end   = () => { drag=false; track.classList.remove('drag'); };

  track.addEventListener('pointerdown', start);
  track.addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  track.addEventListener('touchstart', start, {passive:true});
  track.addEventListener('touchmove',  move,  {passive:false});
  track.addEventListener('touchend',   end);

  // keyboard
  track.setAttribute('tabindex','0');
  track.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowRight'){ e.preventDefault(); go(+1); }
    if(e.key==='ArrowLeft'){  e.preventDefault(); go(-1); }
  });

  // init
  requestAnimationFrame(updateBtns);
})();
