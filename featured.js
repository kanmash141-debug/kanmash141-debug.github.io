/*
 Suspended portfolio cards / click-to-flip / tactile motion.
 Original interaction inspired by the user's screen-recording reference.
 Preserves the independently draggable hero project windows.
*/
(() => {
  "use strict";
  const stage = document.getElementById("featuredStage");
  if (!stage) return;
  const cards = [...stage.querySelectorAll(".featured-card")];
  if (!cards.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let touched = false;
  let demoPlayed = false;
  let demoTimer = null;
  let returnTimer = null;
  const flipMs = 1150; // Matches the CSS flip duration.

  const motionAllowed = () => !reduce && !document.body.classList.contains("motion-off");
  function cancelDemo() {
    touched = true;
    if (demoTimer !== null) clearTimeout(demoTimer);
    if (returnTimer !== null) clearTimeout(returnTimer);
    demoTimer = null;
    returnTimer = null;
  }
  function flip(card, on, focus = false) {
    const front = card.querySelector(".featured-face--front");
    const back = card.querySelector(".featured-face--back");
    if (!front || !back) return;
    card.classList.toggle("is-flipped",on);
    front.inert = Boolean(on);
    back.inert = !on;
    card.setAttribute("data-side",on?"back":"front");
    const visibleButton = (on?back:front).querySelector(".featured-flip");
    if (focus && visibleButton) {
      // Keyboard focus transfers after the rotated side comes into view,
      // avoiding focus-induced visual jumps at the beginning of a flip.
      window.setTimeout(() => {
        if (!card.isConnected || card.classList.contains("is-flipped") !== on) return;
        visibleButton.focus({preventScroll:true});
      },Math.round(flipMs*.56));
    }
  }
  for (const card of cards) {
    const front = card.querySelector(".featured-face--front");
    const back = card.querySelector(".featured-face--back");
    if (front) front.inert = false;
    if (back) back.inert = true;
    card.dataset.side = "front";
    card.addEventListener("click",event => {
      if (event.target.closest("a")) {
        cancelDemo();
        return;
      }
      if (event.target.closest("button:not(.featured-flip)")) return;
      cancelDemo();
      const on = !card.classList.contains("is-flipped");
      flip(card,on,event.detail === 0 && Boolean(event.target.closest(".featured-flip")));
    });
    card.addEventListener("keydown",event => {
      if (event.key === "Escape" && card.classList.contains("is-flipped")) {
        event.preventDefault();
        cancelDemo();
        flip(card,false,true);
      }
    });
    card.addEventListener("pointerenter",()=>{
      // Never interrupt someone's exploration with an auto demo flip.
      cancelDemo();
      card.closest(".featured-hanger")?.classList.add("is-engaged");
    });
    card.addEventListener("pointerleave",()=>card.closest(".featured-hanger")?.classList.remove("is-engaged"));
  }

  // A single gentle demonstration is shown the first time this section enters
  // view, echoing the reference's staggered flips without distracting loops.
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      const entry=entries[0];
      if (!entry || !entry.isIntersecting || demoPlayed || touched) return;
      demoPlayed = true;
      io.disconnect();
      demoTimer = setTimeout(() => {
        if (!motionAllowed() || document.hidden || touched || !stage.isConnected) return;
        const card=cards[1] ?? cards[0];
        if (!card || card.contains(document.activeElement)) return;
        flip(card,true,false);
        returnTimer=setTimeout(() => {
          if (!touched && card.isConnected) flip(card,false,false);
        },2800);
      },1450);
    },{threshold:.33});
    io.observe(stage);
  }
  // Hover still swings via CSS; pause/low-motion preference is inherited from
  // the site's existing motion switch.
  document.addEventListener("visibilitychange",() => {
    if (document.hidden) {
      if (demoTimer !== null) clearTimeout(demoTimer);
      if (returnTimer !== null) clearTimeout(returnTimer);
    }
  });
})();