
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motion = !reduce;
  const loader = $("#loader");
  const count = $("#loadCount");
  if (loader && !reduce) {
    const start = performance.now();
    const duration = 750;
    const frame = now => {
      const t = Math.min(1, (now - start) / duration);
      count.textContent = String(Math.round((1 - Math.pow(1 - t, 3)) * 100)).padStart(2,"0");
      if (t < 1) requestAnimationFrame(frame);
      else setTimeout(() => loader.classList.add("is-done"), 160);
    };
    requestAnimationFrame(frame);
  } else if(loader) loader.classList.add("is-done");

  const toggle = $("#motionSwitch");
  const setMotion = on => {
    motion = on;
    document.body.classList.toggle("motion-off",!on);
    toggle.setAttribute("aria-pressed",String(on));
    toggle.innerHTML = '<b aria-hidden="true"></b>' + (on ? "MOTION ON" : "MOTION OFF");
  };
  if (toggle) {
    setMotion(motion);
    toggle.addEventListener("click",() => setMotion(!motion));
  }

  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(items => {
      items.forEach(item => {
        if(item.isIntersecting) {
          item.target.classList.add("in");
          io.unobserve(item.target);
        }
      });
    },{threshold:.08,rootMargin:"0px 0px -24px 0px"});
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add("in"));

  const progress = $("#progress");
  const heroWords = $(".hero-words");
  let ticking = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.max(0,scrollY/max)*100 : 0)+"%";
    if (heroWords && motion && window.innerWidth > 900 && scrollY < window.innerHeight) {
      heroWords.style.transform = "translate3d(0,"+(scrollY*.15)+"px,0)";
      heroWords.style.opacity = String(Math.max(.15,1-scrollY/window.innerHeight*1.15));
    } else if (heroWords) {
      heroWords.style.transform = "";
      heroWords.style.opacity = "";
    }
    ticking = false;
  }
  window.addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(updateScroll)}},{passive:true});
  updateScroll();

  const clock = $("#clock");
  if(clock){
    const refresh=()=>{clock.textContent=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date())+" IST"};
    refresh();
    setInterval(refresh,60000);
  }

  // Real, movable interface panels—not decorative static images.
  let topZ = 10;
  $$(".window").forEach(panel => {
    const handle = panel.querySelector(".window-bar");
    let offsetX = 0,offsetY = 0, startX = 0,startY = 0,initialX = 0,initialY = 0,dragging=false;
    handle.addEventListener("pointerdown", e => {
      if(!motion || window.innerWidth <= 700 || e.target.closest("button")) return;
      dragging=true; startX=e.clientX;startY=e.clientY;initialX=offsetX;initialY=offsetY;
      handle.setPointerCapture(e.pointerId);
      panel.style.zIndex=String(++topZ);
    });
    handle.addEventListener("pointermove", e => {
      if(!dragging) return;
      offsetX=initialX + e.clientX-startX;
      offsetY=initialY + e.clientY-startY;
      panel.style.setProperty("--dx",offsetX+"px");
      panel.style.setProperty("--dy",offsetY+"px");
    });
    const end=()=>{dragging=false};
    handle.addEventListener("pointerup",end);
    handle.addEventListener("pointercancel",end);
    panel.addEventListener("pointermove",e=>{
      if(!motion || dragging || window.innerWidth <= 1000 || e.pointerType !== "mouse") return;
      const r=panel.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      panel.style.setProperty("--rx",(-y*5)+"deg");
      panel.style.setProperty("--ry",(x*5)+"deg");
    });
    panel.addEventListener("pointerleave",()=>{
      panel.style.setProperty("--rx","0deg");
      panel.style.setProperty("--ry","0deg");
    });
  });

  // Contextual cursor appears over project windows and showcases.
  const cursor=$("#cursor");
  if(cursor && window.matchMedia("(pointer:fine)").matches){
    window.addEventListener("pointermove",e=>{
      cursor.style.left=e.clientX+"px";
      cursor.style.top=e.clientY+"px";
      const target=e.target.closest("[data-cursor]");
      const show=target && motion;
      cursor.classList.toggle("visible",Boolean(show));
      if(show) cursor.textContent=target.getAttribute("data-cursor") || "OPEN ↗";
    },{passive:true});
    document.addEventListener("pointerleave",()=>cursor.classList.remove("visible"));
  }

  const caseInfo = {
    gpay:{
      id:"01 — FINTECH / PRODUCT CONCEPT",
      title:"What if Google Pay managed all our subscriptions?",
      lead:"A product-design exploration of making recurring payments easier to understand, review and manage from one place.",
      angle:"The idea starts with a simple question: what would an easier, calmer subscription-management experience inside an everyday payment app look like?",
      note:"Open the full original Behance case study to explore the actual design screens and process.",
      link:"https://www.behance.net/gallery/248661903/What-if-Google-Pay-managed-all-our-Subscriptions",
      art:".feature-card--gpay .featured-card__visual",
      color:"#9BACD8"
    },
    zoom:{
      id:"02 — AI / PRODUCT CONCEPT",
      title:"Zoom AI: Virtual Meeting App",
      lead:"A UI/UX product-design concept exploring how AI assistance might support virtual meetings and collaboration.",
      angle:"The concept focuses on the meeting experience and the potential for AI-supported interactions to make collaboration more useful.",
      note:"Open the full original Behance case study to explore the actual design screens and process.",
      link:"https://www.behance.net/gallery/245805183/Zoom-AI-Virtual-Meeting-App-UI-UX-Product-Design",
      art:".feature-card--zoom .featured-card__visual",
      color:"#223382"
    }
  };
  const dialog=$("#caseDialog");
  const caseArt=$("#caseArt");
  const closeDialog=$("#caseClose");
  function openProject(key){
    const p=caseInfo[key];
    if(!p || !dialog) return;
    $("#caseLabel").textContent=p.id;
    $("#caseTitle").textContent=p.title;
    $("#caseLead").textContent=p.lead;
    $("#caseAngle").textContent=p.angle;
    $("#caseNote").textContent=p.note;
    $("#caseLink").href=p.link;
    caseArt.style.background=p.color;
    caseArt.replaceChildren();
    const source=$(p.art);
    if(source) caseArt.appendChild(source.cloneNode(true));
    dialog.showModal();
    document.body.style.overflow="hidden";
  }
  $$("[data-open-project]").forEach(el => {
    el.addEventListener("click",()=>openProject(el.getAttribute("data-open-project")));
  });
  function restoreScroll(){document.body.style.overflow=""}
  if(dialog){
    closeDialog.addEventListener("click",()=>dialog.close());
    dialog.addEventListener("close",restoreScroll);
    dialog.addEventListener("click",e=>{
      if(e.target===dialog){
        const r=dialog.getBoundingClientRect();
        if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close();
      }
    });
  }

  // The drawing playground is deliberately functional.
  const canvas=$("#scratchCanvas");
  if(canvas){
    const ctx=canvas.getContext("2d",{alpha:true});
    let ink="#111144",painting=false,last=null;
    function sizeCanvas(){
      const old=document.createElement("canvas");
      old.width=canvas.width;old.height=canvas.height;
      if(old.width && old.height)old.getContext("2d").drawImage(canvas,0,0);
      const rect=canvas.getBoundingClientRect();
      const scale=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(rect.width*scale);
      canvas.height=Math.round(rect.height*scale);
      ctx.setTransform(scale,0,0,scale,0,0);
      ctx.lineCap="round";ctx.lineJoin="round";
      if(old.width)ctx.drawImage(old,0,0,old.width,old.height,0,0,rect.width,rect.height);
    }
    sizeCanvas();
    window.addEventListener("resize",sizeCanvas);
    const position=e=>{
      const r=canvas.getBoundingClientRect();
      return {x:e.clientX-r.left,y:e.clientY-r.top};
    };
    canvas.addEventListener("pointerdown",e=>{
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      painting=true;
      last=position(e);
      ctx.fillStyle=ink;
      ctx.beginPath();ctx.arc(last.x,last.y,4,0,Math.PI*2);ctx.fill();
    });
    canvas.addEventListener("pointermove",e=>{
      if(!painting)return;
      const pos=position(e);
      ctx.strokeStyle=ink;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(last.x,last.y);
      ctx.quadraticCurveTo(last.x,last.y,(last.x+pos.x)/2,(last.y+pos.y)/2);
      ctx.stroke();last=pos;
    });
    const stop=()=>{painting=false;last=null};
    canvas.addEventListener("pointerup",stop);
    canvas.addEventListener("pointercancel",stop);
    $$("[data-ink]").forEach(btn=>btn.addEventListener("click",()=>{
      ink=btn.getAttribute("data-ink");
      $$("[data-ink]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));
    }));
    $("#clearCanvas").addEventListener("click",()=>ctx.clearRect(0,0,canvas.width,canvas.height));
    $("#saveCanvas").addEventListener("click",()=>{
      const output=document.createElement("canvas");
      output.width=canvas.width;output.height=canvas.height;
      const paint=output.getContext("2d");
      paint.fillStyle="#F4F1EC";paint.fillRect(0,0,output.width,output.height);
      paint.drawImage(canvas,0,0);
      const a=document.createElement("a");a.href=output.toDataURL("image/png");
      a.download="kanmash-scratchpad.png";document.body.appendChild(a);a.click();a.remove();
    });
  }

  // Small rotating thought in About.
  const thought=$("#thought");
  const swap=$("#swapThought");
  if(thought && swap){
    const thoughts=["I LIKE MAKING COMPLEX THINGS FEEL SIMPLE.","I THINK BUTTONS SHOULD FEEL ALIVE.","GOOD DESIGN STARTS WITH A BETTER QUESTION.","I'M NOT DONE EXPERIMENTING YET."];
    let n=0;
    swap.addEventListener("click",()=>{n=(n+1)%thoughts.length;thought.textContent=thoughts[n];});
  }
})();
