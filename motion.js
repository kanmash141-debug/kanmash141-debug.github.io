/* Kanmash portfolio: original motion-reel & interaction system.
   No video is copied or embedded from the reference website.
   The 4 scenes are CSS-built product-concept motion studies. */
(() => {
  "use strict";
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sceneEls = $$("[data-reel-scene]");
  const shell = $("#reelShell");
  const stage = $("#reelStage");
  const scrub = $("#reelScrub");
  const play = $("#reelPlay");
  const prev = $("#reelPrev");
  const next = $("#reelNext");
  const counter = $("#reelCount");
  const duration = 4000;
  const total = duration * sceneEls.length;
  let time = 0;
  let active = -1;
  let inView = false;
  let wanted = !reduced;
  let lastFrame = null;
  let raf = null;
  const isMotionOn = () => !document.body.classList.contains("motion-off") && !reduced;
  const fmt = ms => {
    const seconds = Math.floor(ms / 1000);
    return "00:" + String(seconds).padStart(2, "0");
  };
  const setScene = index => {
    if(index === active || index < 0 || index >= sceneEls.length) return;
    active = index;
    sceneEls.forEach((el,i) => {
      const shown = i === index;
      el.classList.toggle("is-active",shown);
      el.setAttribute("aria-hidden", String(!shown));
      // Avoid tabbing to links inside invisible reel slides.
      el.inert = !shown;
    });
    if(counter) counter.textContent = String(index+1).padStart(2,"0") + " / " + String(sceneEls.length).padStart(2,"0");
  };
  const render = () => {
    if(!sceneEls.length) return;
    const idx = Math.min(sceneEls.length-1,Math.max(0,Math.floor(time/duration)));
    setScene(idx);
    if(scrub && document.activeElement !== scrub){
      scrub.value = String(Math.round(100 * (time / total)));
    }
    if(shell){
      shell.style.setProperty("--reel-progress", (time / total * 100).toFixed(2)+"%");
    }
    const label = $(".reel-scrub-wrap > span");
    if(label) label.textContent = fmt(time)+" / "+fmt(total);
  };
  const paintPlay = () => {
    if(!play)return;
    const showPlaying = wanted && isMotionOn();
    play.setAttribute("aria-pressed",String(showPlaying));
    play.setAttribute("aria-label",showPlaying?"Pause reel":"Play reel");
    play.innerHTML = showPlaying ? "Ⅱ <span>Pause</span>" : "▶ <span>Play</span>";
  };
  const seek = ms => {
    time = ((ms % total)+total) % total;
    lastFrame = null;
    render();
  };
  const frame = now => {
    if(lastFrame === null) lastFrame = now;
    const delta = Math.min(50, Math.max(0,now-lastFrame));
    lastFrame = now;
    if(wanted && inView && isMotionOn()){
      time = (time+delta) % total;
      render();
    }
    raf = requestAnimationFrame(frame);
  };
  if(sceneEls.length === 4 && shell && scrub && prev && next && play){
    render();
    paintPlay();
    play.addEventListener("click",()=>{
      wanted = !wanted;
      lastFrame = null;
      paintPlay();
    });
    prev.addEventListener("click",()=>{
      const index = Math.floor(time/duration);
      seek(((index-1+sceneEls.length)%sceneEls.length)*duration);
    });
    next.addEventListener("click",()=>{
      const index = Math.floor(time/duration);
      seek(((index+1)%sceneEls.length)*duration);
    });
    scrub.addEventListener("input",()=>{
      const value = Number(scrub.value);
      time = Math.min(total-1,Math.max(0,total*value/100));
      lastFrame = null;
      render();
    });
    scrub.addEventListener("change",()=>{lastFrame = null;});
    // Arrow navigation works only while focus is inside the reel.
    shell.addEventListener("keydown",e=>{
      if(e.target === scrub)return;
      if(e.key === "ArrowLeft"){prev.click();e.preventDefault();}
      if(e.key === "ArrowRight"){next.click();e.preventDefault();}
      if(e.key === " " && e.target === stage){play.click();e.preventDefault();}
    });
    if("IntersectionObserver" in window){
      const observer = new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.target === shell){
            inView = entry.isIntersecting && entry.intersectionRatio > .12;
            lastFrame = null;
          }
        }
      },{threshold:[0,.12,.3,.7]});
      observer.observe(shell);
    } else inView = true;
    document.addEventListener("visibilitychange",()=>{lastFrame = null;});
    // Existing global motion switch remains the source of truth.
    const motionObserver = new MutationObserver(()=>{paintPlay();lastFrame=null;});
    motionObserver.observe(document.body,{attributes:true,attributeFilter:["class"]});
    raf = requestAnimationFrame(frame);
  }

  // Staggered hero text starts as the loader slides away. Keep content visible
  // if scripts fail or visitors request reduced motion.
  if(!reduced && !document.body.classList.contains("motion-off")){
    setTimeout(()=>document.body.classList.add("js-motion"),650);
  }
  // Scroll-driven details remain supplementary: content never depends on them.
  const hero = $(".hero");
  const pattern = $(".hero-motion-pattern");
  const a = $(".hero-float--a");
  const b = $(".hero-float--b");
  const timeline = $(".hero-timeline i");
  let scheduled = false;
  function scrollMotion(){
    scheduled = false;
    if(!hero)return;
    if(!isMotionOn()){
      if(pattern) pattern.style.translate = "";
      if(a)a.style.translate = "";
      if(b)b.style.translate = "";
      if(timeline)timeline.style.width="0%";
      return;
    }
    const rect = hero.getBoundingClientRect();
    const fraction = Math.max(0,Math.min(1,-rect.top / Math.max(1,rect.height)));
    if(pattern)pattern.style.translate=(fraction*70).toFixed(1)+"px 0px";
    if(a)a.style.translate="0px "+(fraction*85).toFixed(1)+"px";
    if(b)b.style.translate="0px "+(-fraction*65).toFixed(1)+"px";
    if(timeline)timeline.style.width=(fraction*100).toFixed(1)+"%";
  }
  addEventListener("scroll",()=>{
    if(!scheduled){
      scheduled=true;
      requestAnimationFrame(scrollMotion);
    }
  },{passive:true});
  scrollMotion();

  // Subtle, pointer-responsive product art: keyboard and touch remain usable.
  if(matchMedia("(hover:hover) and (pointer:fine)").matches){
    $$(".project-art").forEach(surface=>{
      const art=$(".art-card",surface);
      if(!art)return;
      surface.addEventListener("pointermove",e=>{
        if(!isMotionOn())return;
        const r=surface.getBoundingClientRect();
        const x=((e.clientX-r.left)/r.width-.5);
        const y=((e.clientY-r.top)/r.height-.5);
        art.style.translate=(x*10).toFixed(1)+"px "+(y*12).toFixed(1)+"px";
      },{passive:true});
      surface.addEventListener("pointerleave",()=>{art.style.translate="";});
      surface.addEventListener("blur",()=>{art.style.translate="";});
    });
  }

  // The creative contact ending gets a restrained magnetic effect.
  const email=$(".contact-email");
  if(email && matchMedia("(hover:hover) and (pointer:fine)").matches){
    email.addEventListener("pointermove",e=>{
      if(!isMotionOn())return;
      const r=email.getBoundingClientRect();
      const x=((e.clientX-r.left)/r.width-.5)*9;
      const y=((e.clientY-r.top)/r.height-.5)*6;
      email.style.translate=x.toFixed(1)+"px "+y.toFixed(1)+"px";
    },{passive:true});
    email.addEventListener("pointerleave",()=>{email.style.translate="";});
  }

  // Cleanup when navigating away (keeps embedded environments tidy).
  addEventListener("pagehide",()=>{
    if(raf!==null){cancelAnimationFrame(raf);raf=null;}
  },{once:true});
})();
