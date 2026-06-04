/* ============================================================
   A VIA DI I PASTORI — interactions
   ============================================================ */
(function(){
  'use strict';

  /* topo textures are now SVG backgrounds via CSS */

  /* ---------- nav scrolled state ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = ()=>{ nav.classList.toggle('scrolled', window.scrollY > 60); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---------- trail spine progress + altitude ---------- */
  const prog  = document.querySelector('.trail-progress');
  const hiker = document.querySelector('.trail-hiker');
  function trailUpdate(){
    const trail = document.querySelector('.trail');
    if(!trail) return;
    const rect = trail.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height - vh*0.5;
    const passed = Math.min(Math.max(-rect.top + vh*0.5, 0), total);
    const ratio = total>0 ? passed/total : 0;
    if(prog){
      const full = trail.offsetHeight;
      prog.style.height = (full*ratio) + 'px';
    }
    if(hiker){
      const visible = rect.top < vh*0.5 && rect.bottom > vh*0.5;
      hiker.style.display = visible ? 'block' : 'none';
      hiker.style.top = (vh*0.5 - 8) + 'px';
    }
  }
  trailUpdate(); window.addEventListener('scroll', trailUpdate, {passive:true});
  window.addEventListener('resize', trailUpdate);

  /* ---------- altimeter rail ---------- */
  const altEl   = document.getElementById('alt');
  const altFill = document.getElementById('alt-fill');
  const altMark = document.getElementById('alt-mark');
  const altVal  = document.getElementById('alt-val');
  function altUpdate(){
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p   = Math.min(window.scrollY / max, 1);
    const pct = (p * 100).toFixed(1) + '%';
    if(altFill) altFill.style.height = pct;
    if(altMark) altMark.style.top = pct;
    if(altVal){
      const a = Math.round(2150 * (1 - p));
      altVal.textContent = a > 0 ? a.toLocaleString('fr-FR') + ' m' : 'Mer';
    }
    if(altEl) altEl.classList.toggle('show', window.scrollY > 60);
  }
  altUpdate(); window.addEventListener('scroll', altUpdate, {passive:true});

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* ---------- map waypoints ---------- */
  const panels = document.querySelectorAll('.wp-panel');
  const wps = document.querySelectorAll('.wp');
  function showWp(id){
    wps.forEach(w=>w.classList.toggle('active', w.dataset.wp===id));
    panels.forEach(p=>p.classList.toggle('show', p.dataset.panel===id));
  }
  wps.forEach(w=> w.addEventListener('click', ()=> showWp(w.dataset.wp)));
  if(wps.length) showWp(wps[0].dataset.wp);

  /* ---------- map trail path (procedural) ---------- */
  const mapCanvas = document.querySelector('.map-canvas');
  if(mapCanvas){
    const grid = [];
    for(let i=1;i<10;i++) grid.push(`<line x1="${i*100}" y1="0" x2="${i*100}" y2="525" stroke="rgba(92,74,53,.10)" stroke-width="1"/>`);
    for(let j=1;j<6;j++) grid.push(`<line x1="0" y1="${j*100}" x2="1000" y2="${j*100}" stroke="rgba(92,74,53,.10)" stroke-width="1"/>`);
    let cont='';
    for(let r=0;r<5;r++){
      const rr=70+r*55; let d='';
      for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;const wob=Math.sin(a*3+r)*14+Math.cos(a*2-r)*10;
        const x=560+Math.cos(a)*(rr+wob)*1.6;const y=250+Math.sin(a)*(rr+wob);d+=(i===0?'M':'L')+x.toFixed(0)+' '+y.toFixed(0)+' ';}
      cont+=`<path d="${d}Z" fill="none" stroke="rgba(92,74,53,.16)" stroke-width="1.2"/>`;
    }
    const trailPath = 'M 150 380 C 250 330, 280 300, 360 300 S 520 250, 590 200 S 760 150, 850 140';
    mapCanvas.innerHTML = `<svg viewBox="0 0 1000 525" preserveAspectRatio="xMidYMid slice">
      ${grid.join('')}${cont}
      <path d="${trailPath}" fill="none" stroke="rgba(140,80,40,.35)" stroke-width="9" stroke-linecap="round"/>
      <path d="${trailPath}" fill="none" stroke="var(--terre)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
    </svg>`;
  }

  /* ---------- reservation form ---------- */
  document.querySelectorAll('.seg').forEach(seg=>{
    seg.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{
      seg.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }));
  });
  const stepper = document.querySelector('.stepper');
  if(stepper){
    const val = stepper.querySelector('.val');
    stepper.querySelector('[data-step="-"]').addEventListener('click', ()=>{
      val.textContent = String(Math.max(1, (+val.textContent)-1)).padStart(2,'0');
    });
    stepper.querySelector('[data-step="+"]').addEventListener('click', ()=>{
      val.textContent = String(Math.min(20, (+val.textContent)+1)).padStart(2,'0');
    });
  }
  const form = document.querySelector('#resa-form');
  if(form) form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Collect form data and send to Formspree
    const data = new FormData(form);
    const btn = form.querySelector('.resa-submit');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;
    fetch('https://formspree.io/f/xbdzaqkz', {
      method:'POST',
      body: data,
      headers:{ 'Accept':'application/json' }
    }).then(r=>{
      if(r.ok){
        btn.textContent = 'Demande envoyée ✓';
        btn.style.background = 'var(--maquis)';
        form.reset();
        const seg = form.querySelector('.seg');
        if(seg){ const first = seg.querySelector('button'); if(first) first.classList.add('active'); }
        const v = form.querySelector('.val'); if(v) v.textContent = '02';
      } else {
        btn.textContent = 'Erreur — réessayez';
        btn.disabled = false;
      }
    }).catch(()=>{
      btn.textContent = 'Erreur — réessayez';
      btn.disabled = false;
    });
  });

  /* ---------- mobile burger → scroll to réservation ---------- */
  const burger = document.querySelector('.nav-burger');
  if(burger) burger.addEventListener('click', ()=>{
    const t = document.querySelector('#reserver');
    if(t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior:'smooth' });
  });

  /* ---------- lightbox galerie ---------- */
  const lightbox     = document.getElementById('lightbox');
  const lightboxMedia = document.getElementById('lightbox-media');
  const lightboxClose = document.getElementById('lightbox-close');
  function openLightbox(src, type){
    if(type === 'video'){
      lightboxMedia.innerHTML = `<video src="${src}" autoplay muted loop playsinline controls style="max-width:92vw;max-height:88vh;border-radius:5px;display:block;box-shadow:0 24px 80px rgba(0,0,0,.7)"></video>`;
    } else {
      lightboxMedia.innerHTML = `<img src="${src}" alt="" style="max-width:92vw;max-height:88vh;border-radius:5px;display:block;box-shadow:0 24px 80px rgba(0,0,0,.7)">`;
    }
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lightbox.classList.remove('show');
    setTimeout(()=>{ lightboxMedia.innerHTML = ''; }, 300);
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.gal-item').forEach(item=>{
    item.addEventListener('click', ()=> openLightbox(item.dataset.src, item.dataset.type));
  });
  if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if(lightbox) lightbox.addEventListener('click', e=>{ if(e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeLightbox(); });

  /* ---------- dark mode ---------- */
  const btnTheme = document.getElementById('btn-theme');
  (function(){
    const saved = localStorage.getItem('avdip-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(saved === 'dark' || (!saved && prefersDark)) document.documentElement.dataset.theme = 'dark';
  })();
  if(btnTheme) btnTheme.addEventListener('click', ()=>{
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? '' : 'dark';
    localStorage.setItem('avdip-theme', isDark ? 'light' : 'dark');
  });

  /* ---------- back to top ---------- */
  const btnTop = document.getElementById('btn-top');
  if(btnTop){
    btnTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
    const topVis = ()=> btnTop.classList.toggle('show', window.scrollY > 300);
    topVis(); window.addEventListener('scroll', topVis, {passive:true});
  }

})();
