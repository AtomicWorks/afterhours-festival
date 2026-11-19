// Motion layer: intro, scroll choreography, cursor, marquee and micro-interactions.
// Everything decorative defers to window.afterhoursMotion.paused (reduced motion or the footer toggle).
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const paused = () => window.afterhoursMotion?.paused ?? reduced.matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  window.afterhoursPointer = { x: 0, y: 0 };
  window.afterhoursScroll = { v: 0 };

  /* ---------- Text splitting ---------- */
  function splitLines(el) {
    const lines = [[]];
    const keep = [];
    [...el.childNodes].forEach(node => {
      if (node.nodeName === 'BR') lines.push([]);
      else if (node.nodeType === 1 && node.getAttribute('aria-hidden') === 'true') keep.push(node);
      else lines[lines.length - 1].push(node);
    });
    el.textContent = '';
    lines.forEach((nodes, i) => {
      const line = document.createElement('span');
      line.className = 'line';
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      inner.style.setProperty('--li', i);
      nodes.forEach(n => inner.appendChild(n));
      line.appendChild(inner);
      el.appendChild(line);
    });
    keep.forEach(n => el.appendChild(n));
    el.classList.add('split');
  }

  function splitInto(el, mode, cls) {
    let index = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = mode === 'chars' ? [...child.textContent] : child.textContent.split(/(\s+)/);
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = cls;
            span.style.setProperty('--ci', index++);
            span.textContent = part;
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.nodeName !== 'SUP') walk(child);
      });
    };
    walk(el);
    return index;
  }

  /* ---------- Intro ---------- */
  const heroTitle = $('#hero-title');
  const heroOriginal = heroTitle.innerHTML;
  const heroChars = splitInto(heroTitle, 'chars', 'char');
  $$('.char', heroTitle).forEach(c => c.setAttribute('aria-hidden', 'true'));

  async function intro() {
    const loader = $('.loader');
    if (root.classList.contains('intro') && !paused()) {
      if (!location.hash) { history.scrollRestoration = 'manual'; scrollTo(0, 0); }
      const count = $('.loader-count');
      const bar = $('.loader-bar i');
      const fonts = Promise.race([document.fonts?.ready || Promise.resolve(), wait(1800)]);
      const start = performance.now();
      const duration = 1250;
      await new Promise(resolve => {
        const tick = now => {
          const t = clamp((now - start) / duration);
          const e = easeInOut(t);
          count.textContent = String(Math.round(e * 100)).padStart(3, '0');
          bar.style.transform = `scaleX(${e})`;
          t < 1 ? requestAnimationFrame(tick) : resolve();
        };
        requestAnimationFrame(tick);
      });
      await fonts;
      try { sessionStorage.setItem('ah-intro', '1'); } catch {}
      root.classList.add('loader-out');
      await wait(520);
    } else {
      await Promise.race([document.fonts?.ready || Promise.resolve(), wait(500)]);
    }
    root.classList.add('hero-in');
    window.dispatchEvent(new Event('afterhours-intro'));
    setTimeout(() => {
      root.classList.remove('intro', 'loader-out');
      loader?.remove();
    }, 1100);
    // Restore the original markup so the wordmark keeps its native kerning.
    setTimeout(() => { heroTitle.innerHTML = heroOriginal; heroTitle.classList.add('settled'); }, 900 + heroChars * 55 + 1200);
  }
  intro();

  /* ---------- Headings: line masks & scroll-scrubbed words ---------- */
  $$('h2.reveal').forEach(splitLines);
  const scrub = $('.scrub');
  let scrubWords = [];
  if (scrub) {
    splitInto(scrub, 'words', 'word');
    scrubWords = $$('.word', scrub);
  }

  /* ---------- Generic reveals ---------- */
  const revealGroups = [
    ['.section-heading > p'], ['.manifesto-bottom > *'], ['.lineup-toolbar', '.lineup-foot'],
    ['.stage'], ['.invitation > div:not(.section-index)', '.concept-note'], ['.info > div > p'],
    ['.faq details'], ['.footer-top > *']
  ];
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealIO.unobserve(entry.target);
    if (entry.target.classList.contains('section-index')) scramble(entry.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;

  const observe = el => (revealIO ? revealIO.observe(el) : el.classList.add('in'));
  revealGroups.forEach(selectors => {
    $$(selectors.join(',')).forEach((el, i) => {
      el.classList.add('fx');
      el.style.setProperty('--d', `${(i % 6) * 90}ms`);
      observe(el);
    });
  });

  /* ---------- Section index scramble ---------- */
  const glyphs = '01✳/<>_—#+';
  function scramble(el) {
    if (paused() || el.dataset.scrambled) return;
    el.dataset.scrambled = '1';
    const finalText = el.textContent;
    const start = performance.now();
    const duration = 700;
    const step = now => {
      const t = clamp((now - start) / duration);
      const reveal = Math.floor(t * finalText.length);
      el.textContent = [...finalText].map((ch, i) => (i < reveal || ch === ' ' ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('');
      t < 1 ? requestAnimationFrame(step) : (el.textContent = finalText);
    };
    requestAnimationFrame(step);
  }
  $$('.section-index').forEach(el => { el.classList.add('fx', 'fx-fade'); observe(el); });

  /* ---------- Lineup rows: staggered entrance on load & filter ---------- */
  const list = $('#artist-list');
  const prepRows = () => $$('.artist-row', list).forEach(row => {
    if (row.dataset.prepped) return;
    row.dataset.prepped = '1';
    row.classList.add('fx', 'fx-row');
    row.style.setProperty('--d', `${(Number(row.style.getPropertyValue('--i')) || 0) * 70}ms`);
    observe(row);
  });
  prepRows();
  new MutationObserver(prepRows).observe(list, { childList: true });

  /* ---------- Footer wordmark ---------- */
  const footerWord = $('.footer-word');
  if (footerWord) {
    splitInto(footerWord, 'chars', 'fchar');
    footerWord.classList.add('fx', 'fx-word');
    observe(footerWord);
  }

  /* ---------- Night drawer: animate items only when it opens ---------- */
  const nightDialog = $('#night-dialog');
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-night]')) return;
    nightDialog.classList.add('entering');
    setTimeout(() => nightDialog.classList.remove('entering'), 1200);
  });

  /* ---------- Nav: sticky, hide on scroll down, active section ---------- */
  const nav = $('.nav');
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const navLinks = $$('.nav nav a');
  if (revealIO) {
    const sectionIO = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => sectionIO.observe(s));
  }

  /* ---------- Countdown ---------- */
  const countdown = $('#countdown');
  const doors = new Date('2027-07-23T22:00:00+02:00').getTime();
  const pad = n => String(n).padStart(2, '0');
  const updateCountdown = () => {
    const diff = Math.max(0, doors - Date.now());
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    countdown.textContent = diff ? `${d}D ${pad(h)}H ${pad(m)}M ${pad(s)}S` : 'NOW';
  };
  if (countdown) { updateCountdown(); setInterval(updateCountdown, 1000); }

  /* ---------- Marquee tapes ---------- */
  const tapes = $$('.ticker').map(ticker => {
    const track = ticker.firstElementChild;
    const unit = track.innerHTML;
    return { ticker, track, unit, speed: Number(ticker.dataset.speed) || 1, x: 0, width: 0 };
  });
  function layoutTapes() {
    tapes.forEach(t => {
      const unit = `<span class="tape-unit">${t.unit}</span>`;
      t.track.innerHTML = unit;
      const unitWidth = t.track.firstElementChild.getBoundingClientRect().width;
      if (!unitWidth) return;
      const copies = Math.max(2, Math.ceil((innerWidth * 1.3) / unitWidth) + 1);
      t.track.innerHTML = unit.repeat(copies);
      t.width = unitWidth;
    });
  }
  root.classList.add('js-marquee');
  layoutTapes();
  document.fonts?.ready.then(layoutTapes);

  /* ---------- Cursor, preview card, magnetic, tilt (fine pointers only) ---------- */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor-label"></span>';
  const cursorLabel = cursor.firstChild;
  const cur = { x: pointer.x, y: pointer.y, s: 1 };

  const preview = document.createElement('div');
  preview.className = 'artist-preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = '<div class="artist-art"><span></span><span></span></div><div class="ap-foot"><b></b><span>VIEW PROFILE ↗</span></div>';
  const prevArt = $('.artist-art', preview);
  const prev = { x: 0, y: 0, r: 0, on: false, art: -1 };
  $('#lineup').appendChild(preview);

  function enableFine() {
    if (!cursor.isConnected) document.body.appendChild(cursor);
    root.classList.add('has-cursor');
  }
  if (finePointer.matches) enableFine();
  finePointer.addEventListener?.('change', () => (finePointer.matches ? enableFine() : root.classList.remove('has-cursor')));

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    window.afterhoursPointer.x = (e.clientX / innerWidth) * 2 - 1;
    window.afterhoursPointer.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });

  const cursorTargets = [
    ['.artist-name', 'VIEW'], ['.add-artist', ''], ['.stage', ''], ['a, button, summary, label, input[type=range]', '']
  ];
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    let state = '', label = '';
    for (const [sel, text] of cursorTargets) {
      if (e.target.closest(sel)) { state = sel === '.artist-name' ? 'label' : sel === '.stage' ? 'stage' : 'hover'; label = text; break; }
    }
    cursor.dataset.state = state;
    cursorLabel.textContent = label;

    const row = e.target.closest('.artist-row');
    const showPreview = row && !paused() && innerWidth > 1050 && !e.target.closest('.add-artist');
    if (showPreview) {
      const idx = Number(row.dataset.art);
      if (prev.art !== idx) {
        prevArt.className = `artist-art art-${idx}`;
        const name = row.querySelector('.roll').dataset.text;
        const meta = row.querySelector('.artist-time');
        prevArt.children[0].textContent = meta.querySelector('span').textContent;
        prevArt.children[1].textContent = meta.firstChild.textContent.trim();
        $('b', preview).textContent = name;
        prev.art = idx;
        if (!prev.on) { prev.x = Math.min(pointer.x + 56, innerWidth - 290); prev.y = pointer.y; }
      }
    }
    prev.on = !!showPreview;
    preview.classList.toggle('on', prev.on);
  });
  list.addEventListener('pointerleave', () => { prev.on = false; preview.classList.remove('on'); });

  // Magnetic controls
  const magnetic = '.button, .add-artist, .my-night-trigger, .sound-control, .upload-label';
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || paused()) return;
    const el = e.target.closest(magnetic);
    if (!el) return;
    const b = el.getBoundingClientRect();
    const strength = el.classList.contains('add-artist') ? .35 : .18;
    el.style.setProperty('--mx', `${(e.clientX - (b.left + b.width / 2)) * strength}px`);
    el.style.setProperty('--my', `${(e.clientY - (b.top + b.height / 2)) * strength}px`);
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    const el = e.target.closest?.(magnetic);
    if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); }
  });

  // Stage tilt + glare
  $$('.stage').forEach(stage => {
    const art = $('.stage-art', stage);
    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || paused()) return;
      const b = art.getBoundingClientRect();
      const x = clamp((e.clientX - b.left) / b.width), y = clamp((e.clientY - b.top) / b.height);
      art.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
      art.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
      art.style.setProperty('--gx', `${x * 100}%`);
      art.style.setProperty('--gy', `${y * 100}%`);
    });
    stage.addEventListener('pointerleave', () => {
      art.style.setProperty('--rx', '0deg');
      art.style.setProperty('--ry', '0deg');
    });
  });

  /* ---------- Toggle feedback: pop, count bump, flying spark ---------- */
  const trigger = $('.my-night-trigger');
  window.addEventListener('afterhours-toggle', e => {
    const { added, source } = e.detail || {};
    const restart = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    if (!paused()) { restart(source, 'pop'); restart(trigger, 'bump'); }
    if (!added || !source || paused() || source.closest('dialog')) return;
    navHidden = false;
    nav.classList.remove('hide');
    const from = source.getBoundingClientRect();
    const to = trigger.getBoundingClientRect();
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.textContent = '✳';
    spark.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spark);
    const sx = from.left + from.width / 2, sy = from.top + from.height / 2;
    const tx = to.left + to.width - 46, ty = to.top + to.height / 2;
    const anim = spark.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%,-50%) scale(.4) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${lerp(sx, tx, .45)}px, ${Math.min(sy, ty) - 120}px) translate(-50%,-50%) scale(1.4) rotate(180deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${tx}px, ${ty}px) translate(-50%,-50%) scale(.5) rotate(360deg)`, opacity: .9 }
    ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' });
    anim.onfinish = () => spark.remove();
  });

  /* ---------- Main loop ---------- */
  const hero = $('.hero');
  const manifesto = $('.manifesto');
  const invitation = $('.invitation');
  const asterisk = $('.asterisk');
  let lastY = scrollY, velocity = 0, navHidden = false, lastTime = performance.now();

  function frame(now) {
    const dt = Math.min(64, now - lastTime) / 16.67;
    lastTime = now;
    const y = scrollY;
    const vh = innerHeight;
    const rawV = y - lastY;
    lastY = y;
    velocity = lerp(velocity, rawV, .18);
    window.afterhoursScroll.v = velocity;
    const still = paused();

    // Progress + nav
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 40);
    if (Math.abs(rawV) > 2 && !document.querySelector('dialog[open]')) {
      const hide = rawV > 0 && y > vh * .6;
      if (hide !== navHidden) { navHidden = hide; nav.classList.toggle('hide', hide); }
    }

    // Hero parallax
    if (y < vh * 1.3) {
      const p = clamp(y / (hero.offsetHeight || vh));
      hero.style.setProperty('--hs', still ? 0 : p.toFixed(4));
    }

    // Manifesto: words light up as they cross the viewport
    if (scrubWords.length) {
      const b = scrub.getBoundingClientRect();
      if (b.bottom > -100 && b.top < vh + 100) {
        const p = still ? 1 : clamp((vh * .85 - b.top) / (b.height + vh * .35));
        const lit = p * scrubWords.length * 1.15;
        scrubWords.forEach((w, i) => w.style.setProperty('--w', clamp(lit - i).toFixed(3)));
      }
      if (asterisk && !still) {
        const mb = manifesto.getBoundingClientRect();
        asterisk.style.rotate = `${(vh - mb.top) * .25}deg`;
      }
    }

    // Invitation: outline fill + star spin
    if (invitation) {
      const b = invitation.getBoundingClientRect();
      if (b.bottom > 0 && b.top < vh) {
        const p = still ? 1 : clamp((vh - b.top) / (vh * .9));
        invitation.style.setProperty('--fill', `${(1 - p) * 100}%`);
        invitation.style.setProperty('--spin', still ? '0deg' : `${(vh - b.top) * .3}deg`);
      }
    }

    // Tapes
    if (!still) {
      const boost = 1 + Math.min(6, Math.abs(velocity) * .25);
      const dir = velocity < -0.5 ? -1 : 1;
      tapes.forEach(t => {
        if (!t.width) return;
        t.x -= t.speed * 1.1 * boost * dir * dt;
        t.x = ((t.x % t.width) - t.width) % t.width;
        t.track.style.transform = `translate3d(${t.x}px,0,0) skewX(${clamp(-velocity * .25, -10, 10) * Math.sign(t.speed)}deg)`;
      });
    }

    // Cursor
    if (root.classList.contains('has-cursor')) {
      const k = still ? 1 : 1 - Math.pow(1 - .22, dt);
      cur.x = lerp(cur.x, pointer.x, k);
      cur.y = lerp(cur.y, pointer.y, k);
      cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      cursor.classList.toggle('visible', pointer.active && !document.querySelector('dialog[open]'));
    }

    // Preview card
    if (prev.on || preview.classList.contains('on')) {
      const k = 1 - Math.pow(1 - .12, dt);
      const dx = Math.min(pointer.x + 56, innerWidth - 290) - prev.x;
      prev.x = lerp(prev.x, Math.min(pointer.x + 56, innerWidth - 290), k);
      prev.y = lerp(prev.y, pointer.y, k);
      prev.r = lerp(prev.r, clamp(dx * .06, -12, 12), .1);
      preview.style.transform = `translate3d(${prev.x}px, ${prev.y}px, 0) translate(0, -50%) rotate(${prev.r}deg)`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layoutTapes, 150); });
  window.addEventListener('afterhours-motion', () => {
    if (paused()) tapes.forEach(t => (t.track.style.transform = `translate3d(${t.x}px,0,0)`));
    hero.style.setProperty('--hs', 0);
  });
})();
