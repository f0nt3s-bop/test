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
      const a = Math.round(540 * (1 - p));
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

  /* ---------- map waypoints + typewriter savoir ---------- */
  const panels = document.querySelectorAll('.wp-panel');
  const wps = document.querySelectorAll('.wp');
  let twTimer = null;
  function typewriteEl(el){
    const text = el.dataset.tw || '';
    while(el.firstChild) el.removeChild(el.firstChild);
    if(twTimer){ clearInterval(twTimer); twTimer = null; }
    if(!text) return;
    const cur = document.createElement('span');
    cur.className = 'wp-savoir-cursor';
    el.appendChild(cur);
    let i = 0;
    twTimer = setInterval(()=>{
      if(i < text.length){
        el.insertBefore(document.createTextNode(text[i++]), cur);
      } else {
        clearInterval(twTimer); twTimer = null; cur.remove();
      }
    }, 24);
  }
  function showWp(id){
    wps.forEach(w=>w.classList.toggle('active', w.dataset.wp===id));
    panels.forEach(p=>p.classList.toggle('show', p.dataset.panel===id));
    const panel = document.querySelector(`.wp-panel[data-panel="${id}"]`);
    if(panel){ const tw = panel.querySelector('.wp-savoir-txt'); if(tw) typewriteEl(tw); }
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

  /* ---------- stagger text animation ---------- */
  (function(){
    function splitChars(el){
      const base = parseFloat(el.dataset.baseDelay||'0');
      const stagger = parseFloat(el.dataset.stagger||'0.04');
      const words = el.textContent.split(' ');
      let ci = 0;
      el.innerHTML = words.map((word,wi)=>{
        const chars = word.split('').map(ch=>{
          const d = (base + ci++ * stagger).toFixed(3);
          return `<span class="s-wrap"><span class="s-char" style="animation-delay:${d}s">${ch==='<'?'&lt;':ch}</span></span>`;
        }).join('');
        return `<span style="white-space:nowrap">${chars}</span>${wi<words.length-1?' ':''}`;
      }).join('');
    }
    function splitWords(el){
      const base = parseFloat(el.dataset.baseDelay||'0');
      const stagger = parseFloat(el.dataset.stagger||'0.05');
      const words = el.textContent.split(' ');
      el.innerHTML = words.map((w,i)=>{
        const d = (base + i*stagger).toFixed(3);
        return `<span class="s-wrap"><span class="s-char" style="animation-delay:${d}s">${w}</span></span>${i<words.length-1?' ':''}`;
      }).join('');
    }
    document.querySelectorAll('.stagger-chars').forEach(splitChars);
    document.querySelectorAll('.stagger-words').forEach(splitWords);
    document.querySelectorAll('.stagger-fade').forEach(img=>{
      img.style.transitionDelay = (img.dataset.delay||'0')+'s';
    });
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('stagger-play');
          e.target.querySelectorAll('.stagger-fade').forEach(el=>el.classList.add('stagger-play'));
          io.unobserve(e.target);
        }
      });
    },{threshold:0.15});
    document.querySelectorAll('.foot-animate').forEach(el=>io.observe(el));
  })();

  /* ---------- flickering grid footer ---------- */
  (function(){
    const canvas = document.getElementById('footer-grid');
    if(!canvas) return;
    const SQUARE = 2, GAP = 3, FLICKER = 0.12, MAX_OP = 0.28;
    const TEXT = 'A Via di i Pastori';
    const FONT_SIZE = 84;
    let cols, rows, squares, dpr, maskData;
    let animId = null, lastT = 0, visible = false;
    const ctx = canvas.getContext('2d');

    function buildMask(){
      const mc = document.createElement('canvas');
      mc.width = canvas.width; mc.height = canvas.height;
      const mx = mc.getContext('2d', {willReadFrequently:true});
      mx.clearRect(0,0,mc.width,mc.height);
      mx.fillStyle = 'white';
      mx.font = `700 ${FONT_SIZE*dpr}px "Bricolage Grotesque",system-ui,sans-serif`;
      mx.textAlign = 'center'; mx.textBaseline = 'middle';
      mx.fillText(TEXT, mc.width/2, mc.height/2);
      maskData = mx.getImageData(0,0,mc.width,mc.height);
    }

    function setup(){
      dpr = window.devicePixelRatio||1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w*dpr; canvas.height = h*dpr;
      canvas.style.width = w+'px'; canvas.style.height = h+'px';
      cols = Math.ceil(w/(SQUARE+GAP));
      rows = Math.ceil(h/(SQUARE+GAP));
      squares = new Float32Array(cols*rows);
      for(let i=0;i<squares.length;i++) squares[i]=Math.random()*MAX_OP;
      buildMask();
    }

    function draw(t){
      if(!visible){ animId=null; return; }
      const dt = Math.min((t-lastT)/1000, 0.1);
      lastT = t;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const sw = Math.round(SQUARE*dpr);
      for(let i=0;i<cols;i++){
        for(let j=0;j<rows;j++){
          if(Math.random()<FLICKER*dt) squares[i*rows+j]=Math.random()*MAX_OP;
          const x = Math.round(i*(SQUARE+GAP)*dpr);
          const y = Math.round(j*(SQUARE+GAP)*dpr);
          const cx = Math.min(canvas.width-1, x+Math.floor(sw/2));
          const cy = Math.min(canvas.height-1, y+Math.floor(sw/2));
          const inText = maskData && maskData.data[(cy*canvas.width+cx)*4]>0;
          let op = squares[i*rows+j];
          if(inText) op = Math.min(1, op*3+0.45);
          ctx.fillStyle = `rgba(107,114,128,${op.toFixed(3)})`;
          ctx.fillRect(x,y,sw,sw);
        }
      }
      animId = requestAnimationFrame(draw);
    }

    function start(){ if(!animId){ lastT=performance.now(); animId=requestAnimationFrame(draw); } }
    function stop(){ if(animId){ cancelAnimationFrame(animId); animId=null; } }

    document.fonts.ready.then(()=>{
      setup();
      new IntersectionObserver(entries=>{
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      },{threshold:0}).observe(canvas);
      let rto;
      window.addEventListener('resize',()=>{
        clearTimeout(rto);
        rto = setTimeout(()=>{ stop(); setup(); if(visible) start(); },120);
      });
    });
  })();

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

  /* ---------- 3D tilt — recit media cells ---------- */
  document.querySelectorAll('.recit-cell.media').forEach(cell => {
    cell.addEventListener('mousemove', e => {
      const r = cell.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      cell.style.transform = `perspective(700px) rotateX(${(-dy * 7).toFixed(2)}deg) rotateY(${(dx * 7).toFixed(2)}deg) scale3d(1.025,1.025,1.025)`;
      cell.style.boxShadow = `${-dx*14}px ${-dy*14}px 40px rgba(0,0,0,.45)`;
    });
    cell.addEventListener('mouseleave', () => {
      cell.style.transform = '';
      cell.style.boxShadow = '';
    });
  });

  /* ---------- eco selector accordion ---------- */
  const ecoSel = document.getElementById('eco-selector');
  if(ecoSel){
    ecoSel.querySelectorAll('.eco-panel').forEach(panel=>{
      panel.addEventListener('click', ()=>{
        ecoSel.querySelectorAll('.eco-panel').forEach(p=>p.classList.remove('active'));
        panel.classList.add('active');
      });
    });
  }

  /* ---------- count-up animation (phare-stats) ---------- */
  (function(){
    const bEls = document.querySelectorAll('.phare-stats .pstat b');
    bEls.forEach(b => {
      const raw = b.textContent.trim();
      const match = raw.match(/^([^0-9]*)(\d+)([^0-9]*)$/);
      if(!match) return;
      b.dataset.countTarget = match[2];
      b.dataset.countPrefix = match[1];
      b.dataset.countSuffix = match[3];
      b.textContent = match[1] + '0' + match[3];
    });
    function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
    function animateCount(b){
      const target = +b.dataset.countTarget;
      const prefix = b.dataset.countPrefix || '';
      const suffix = b.dataset.countSuffix || '';
      const duration = 2000;
      const start = performance.now();
      function frame(now){
        const t = Math.min((now - start) / duration, 1);
        b.textContent = prefix + Math.round(easeOutCubic(t) * target) + suffix;
        if(t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    const statsBlock = document.querySelector('.phare-stats');
    if(!statsBlock) return;
    const countIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        statsBlock.querySelectorAll('.pstat b[data-count-target]').forEach(animateCount);
        countIo.unobserve(e.target);
      });
    }, {threshold: 0.4});
    countIo.observe(statsBlock);
  })();

  /* ---------- feature carousel (jalons) ---------- */
  (function(){
    const fc = document.getElementById('fcarousel');
    if(!fc) return;
    const slides = fc.querySelectorAll('.fc-slide');
    const btns   = fc.querySelectorAll('.fc-btn');
    const card   = document.getElementById('fc-card');
    const fill   = document.getElementById('fc-progress-fill');
    let current  = 0;
    let rafId    = null;
    let startTs  = null;
    const DURATION = 5000;

    function goTo(idx){
      slides[current].classList.remove('active');
      btns[current].classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      btns[current].classList.add('active');
      startTs = null;
      if(fill) fill.style.width = '0%';
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function tick(ts){
      if(!startTs) startTs = ts;
      const pct = Math.min((ts - startTs) / DURATION * 100, 100);
      if(fill) fill.style.width = pct + '%';
      if(pct < 100){
        rafId = requestAnimationFrame(tick);
      } else {
        goTo(current + 1);
      }
    }

    btns.forEach((btn, i) => btn.addEventListener('click', () => goTo(i)));

    /* mouse glow */
    if(card){
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--fc-mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--fc-my', (e.clientY - r.top)  + 'px');
      });
    }

    /* start when visible */
    const fcIo = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting){
        startTs = null;
        rafId = requestAnimationFrame(tick);
        fcIo.disconnect();
      }
    }, {threshold: 0.2});
    fcIo.observe(fc);
  })();

  /* ---------- back to top ---------- */
  const btnTop = document.getElementById('btn-top');
  if(btnTop){
    btnTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
    const topVis = ()=> btnTop.classList.toggle('show', window.scrollY > 300);
    topVis(); window.addEventListener('scroll', topVis, {passive:true});
  }

})();
