/* KANMASH / gaze-following 3D-rendered portrait + blink + controls.
 * Original 2.5D interactive head effect. Lightweight compositor transforms,
 * viewport-aware updates, reduced-motion and keyboard accessibility.
 */
(() => {
  'use strict';
  const poster = document.getElementById('characterHeroPoster');
  const tilt = document.getElementById('characterTilt');
  const gazeAnchor = document.getElementById('characterFigure');
  if (!poster || !tilt || !gazeAnchor) return;
  const eyes = [...gazeAnchor.querySelectorAll('.character-eye')];
  let gazeLimits = eyes.map(e=>Math.max(3,e.getBoundingClientRect().width*.085));
  const measureEyes=()=>{gazeLimits=eyes.map(e=>Math.max(3,e.getBoundingClientRect().width*.085));};
  window.addEventListener('resize',measureEyes,{passive:true});
  const expand = document.getElementById('characterExpand');
  const expression = document.getElementById('characterExpression');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const allowed = () => !reduce && !document.body.classList.contains('motion-off');
  let visible = true, raf=0, lastBlink=0, blinkTimer=0, winkTimer=0;
  const look = {x:0,y:0,tx:0,ty:0};
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const lerp=(a,b,k)=>a+(b-a)*k;
  function syncLook(){
    if (!allowed() || !visible) {raf=0;return;}
    look.x=lerp(look.x,look.tx,.085);
    look.y=lerp(look.y,look.ty,.085);
    const x=look.x,y=look.y;
    // Use a single tiny translate for pupils; primary portrait doesn't distort.
    for (const [i,e] of eyes.entries()){
      const pupil=e.querySelector('.character-iris');
      if (!pupil)continue;
      const max=gazeLimits[i] || 6;
      pupil.style.setProperty('--eye-x',(x*max).toFixed(2)+'px');
      pupil.style.setProperty('--eye-y',(y*max*.58).toFixed(2)+'px');
    }
    tilt.style.setProperty('--look-y',(x*5.5).toFixed(2)+'deg');
    tilt.style.setProperty('--look-x',(-y*3.7).toFixed(2)+'deg');
    raf=(Math.abs(look.x-look.tx)+Math.abs(look.y-look.ty)>0.001) ? window.requestAnimationFrame(syncLook) : 0;
  }
  function startLook(){if(!raf && allowed() && visible) raf=window.requestAnimationFrame(syncLook);}
  function restGaze(){look.tx=0;look.ty=0;}
  function pointerLook(e){
    if(!finePointer || !allowed())return;
    const r=poster.getBoundingClientRect();
    look.tx=clamp(((e.clientX-r.left)/r.width-.5)*2,-1,1);
    look.ty=clamp(((e.clientY-r.top)/r.height-.5)*2,-1,1);
    startLook();
  }
  // Track the cursor inside and outside the hero, with a gentle return at leave.
  window.addEventListener('pointermove',pointerLook,{passive:true});
  window.addEventListener('pointerleave',restGaze,{passive:true});
  poster.addEventListener('focusout',()=>{if(!poster.contains(document.activeElement)) restGaze();});
  function blink(which=eyes){
    if(!allowed() || document.hidden || !visible)return;
    for(const e of which){
      e.classList.remove('is-blinking');
      // restart keyframes only when explicitly blinking (not every frame)
      void e.offsetWidth;
      e.classList.add('is-blinking');
      window.setTimeout(()=>e.classList.remove('is-blinking'),230);
    }
  }
  function autoBlink(){
    if(!allowed() || document.hidden || !visible)return;
    const now=performance.now();
    if(now-lastBlink>2100){blink();lastBlink=now;}
  }
  function scheduleBlink(){
    window.clearTimeout(blinkTimer);
    blinkTimer=window.setTimeout(()=>{
      autoBlink();scheduleBlink();
    },2700+Math.random()*2600);
  }
  expression?.addEventListener('click',()=>{
    if(!allowed())return;
    window.clearTimeout(winkTimer);
    const right=eyes[1];
    const wink=()=>{
      right?.classList.add('is-winking');
      gazeAnchor.classList.add('is-reacting');
      look.tx=-.65;look.ty=-.25;
      winkTimer=window.setTimeout(()=>{
        right?.classList.remove('is-winking');
        gazeAnchor.classList.remove('is-reacting');
        restGaze();blink();
      },420);
    };
    wink();
    expression.setAttribute('aria-label','Wink again');
  });
  function fallbackExpand(){
    const open=!poster.classList.contains('is-expanded');
    poster.classList.toggle('is-expanded',open);
    document.body.classList.toggle('character-hero-expanded',open);
    expand?.setAttribute('aria-label',open?'Close expanded hero':'Expand animated hero');
    if(open)expand?.focus();
  }
  expand?.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement===poster){await document.exitFullscreen();return;}
      if(poster.requestFullscreen){await poster.requestFullscreen();return;}
    }catch(e){/* some browsers deny fullscreen; use a visible fallback */}
    fallbackExpand();
  });
  document.addEventListener('fullscreenchange',()=>{
    const open=document.fullscreenElement===poster;
    expand?.setAttribute('aria-label',open?'Exit full screen':'Expand animated hero');
    expand?.setAttribute('aria-pressed',String(open));
  });
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape' && poster.classList.contains('is-expanded')) fallbackExpand();
  });
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(([entry])=>{
      visible=Boolean(entry?.isIntersecting);
      if(visible){startLook();if(!blinkTimer)scheduleBlink();}
      else{window.clearTimeout(blinkTimer);blinkTimer=0; if(raf){window.cancelAnimationFrame(raf);raf=0;}}
    },{threshold:0.03});io.observe(poster);
  }
  const statusObserver=new MutationObserver(()=>{
    if(allowed()){measureEyes();startLook();scheduleBlink();}
    else{
      window.clearTimeout(blinkTimer);blinkTimer=0;
      restGaze();
      tilt.style.removeProperty('--look-x');tilt.style.removeProperty('--look-y');
      for(const e of eyes){e.classList.remove('is-winking','is-blinking');e.querySelector('.character-iris')?.style.removeProperty('--eye-x');e.querySelector('.character-iris')?.style.removeProperty('--eye-y');}
      if(raf){window.cancelAnimationFrame(raf);raf=0;}
    }
  });statusObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){startLook();scheduleBlink()}else{window.clearTimeout(blinkTimer);blinkTimer=0;}});
  if(allowed()){startLook();scheduleBlink();}
})();