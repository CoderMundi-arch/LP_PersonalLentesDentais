/* Personal Lentes Dentais — interações e animações
   Regra de ouro: o conteúdo é visível sem JS. As animações só entram com GSAP
   carregado e sem preferência por movimento reduzido (classe .anim no <html>). */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGsap && !reduce;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!animate) root.classList.remove("anim");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // Rolagem suave (só desktop com mouse; no toque fica a rolagem nativa)
  let lenis = null;
  if (animate && finePointer && window.Lenis) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: .95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    root.classList.add("lenis-on");
  }
  const headerOffset = () => -(document.querySelector(".header")?.offsetHeight || 70);
  const scrollToEl = (el, center) => {
    if (!el) return;
    if (lenis) {
      const off = center ? -(window.innerHeight - el.offsetHeight) / 2 : headerOffset();
      lenis.scrollTo(el, { offset: off, duration: 1.4 });
    } else {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: center ? "center" : "start", inline: "center" });
    }
  };
  if (lenis) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
      history.replaceState(null, "", id);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Interações que funcionam com ou sem GSAP                          */
  /* ---------------------------------------------------------------- */

  // Header com fundo após rolar
  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  toggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // FAQ: abre um por vez
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
      if (hasGsap) ScrollTrigger.refresh();
    });
  });

  // Vídeos: tocam só quando estão na tela (economiza bateria e dados)
  const autoVideos = document.querySelectorAll("video[autoplay]");
  if (reduce) autoVideos.forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (reduce) return;
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.15 });
  autoVideos.forEach((v) => videoObserver.observe(v));

  // Hero: prévia silenciosa e reprodução com som no modal já existente.
  // O segundo <source> mantém a versão anterior até o novo vídeo ser publicado.
  const heroPlay = document.querySelector("[data-hero-play]");
  const heroVideo = document.querySelector(".hero-frame video");
  heroPlay?.addEventListener("click", () => {
    if (!heroVideo) return;
    heroVideo.pause();
    const src = heroVideo.currentSrc || heroVideo.querySelector("source")?.src;
    const modal = document.querySelector(".video-modal");
    const player = modal?.querySelector("video");
    if (modal?.showModal && player && src) {
      document.querySelectorAll("video").forEach(v => v.pause());
      player.src = src;
      player.controls = true;
      player.muted = false;
      player.loop = false;
      modal.showModal();
      player.play().catch(() => {});
    } else if (src) {
      window.open(src, "_blank", "noopener");
    }
  });

  // Depoimentos em vídeo (modal)
  const modal = document.querySelector(".video-modal");
  const modalVideo = modal?.querySelector("video");
  document.querySelectorAll(".story-cover").forEach((btn) => {
    const src = (btn.dataset.video || "").trim();
    if (!src) { btn.disabled = true; return; }
    btn.addEventListener("click", () => {
      if (!modal?.showModal) { window.open(src, "_blank"); return; }
      document.querySelectorAll("video").forEach((v) => { if (v !== modalVideo) v.pause(); });
      modalVideo.src = src;
      modal.showModal();
      modalVideo.play().catch(() => {});
    });
  });
  const closeModal = () => { modal.close(); };
  modal?.querySelector(".video-modal-close").addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal?.addEventListener("close", () => { modalVideo.pause(); modalVideo.removeAttribute("src"); modalVideo.load(); });

  // Barra fixa de inscrição no celular
  const bar = document.querySelector(".mobile-bar");
  const barLink = bar?.querySelector("a");
  if (bar) {
    const seen = new Map();
    const watch = [document.querySelector(".hero"), document.getElementById("turma"), document.getElementById("inscricao")].filter(Boolean);
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      const show = ![...seen.values()].some(Boolean);
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", String(!show));
      barLink.tabIndex = show ? 0 : -1;
    }, { threshold: 0.05 });
    watch.forEach((el) => { seen.set(el, true); barObserver.observe(el); });
  }


  /* ---------------------------------------------------------------- */
  /* Seção de vídeos: prévia muda + reprodução com som e controles     */
  /* ---------------------------------------------------------------- */
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  const listBtns = [...document.querySelectorAll(".videos-list [data-goto]")];
  const playerEls = [...document.querySelectorAll("[data-player]")];
  const players = playerEls.map((el, idx) => {
    const video = el.querySelector("video");
    const shell = el.querySelector(".vplayer-shell");
    const q = (sel) => el.querySelector(sel);
    const startBtn = q("[data-start]"), toggleBtn = q("[data-toggle]"), muteBtn = q("[data-mute]"), fsBtn = q("[data-fullscreen]");
    const seek = q("[data-seek]"), vol = q("[data-volume]"), timeEl = q("[data-time]"), progress = q("[data-progress]");
    const durEl = q("[data-duration]");
    let active = false, inView = false, idleTimer = 0, seeking = false;

    const setVal = (input, pct) => input.style.setProperty("--val", pct + "%");
    const syncState = () => {
      el.classList.toggle("is-active", active);
      el.classList.toggle("is-paused", video.paused);
      el.classList.toggle("is-muted", video.muted || video.volume === 0);
      toggleBtn.setAttribute("aria-label", video.paused ? "Reproduzir" : "Pausar");
      muteBtn.setAttribute("aria-label", video.muted ? "Ativar som" : "Silenciar");
      listBtns[idx]?.classList.toggle("is-current", active);
    };
    const preview = () => {
      if (active || reduce || saveData) return;
      if (players.some((p) => p !== api && p.isActive())) { video.pause(); return; }
      if (inView) video.play().catch(() => {}); else video.pause();
    };

    video.addEventListener("loadedmetadata", () => {
      const d = fmt(video.duration);
      durEl.textContent = d;
      const ld = listBtns[idx]?.querySelector("[data-list-duration]"); if (ld) ld.textContent = d;
    });
    video.addEventListener("timeupdate", () => {
      const p = video.duration ? video.currentTime / video.duration : 0;
      progress.style.transform = `scaleX(${p})`;
      listBtns[idx]?.style.setProperty("--p", active ? p : 0);
      if (!active) return;
      timeEl.textContent = fmt(video.currentTime);
      if (!seeking) { seek.value = Math.round(p * 1000); setVal(seek, p * 100); }
    });
    ["play", "pause", "volumechange"].forEach((ev) => video.addEventListener(ev, syncState));
    video.addEventListener("ended", () => { deactivate(); video.currentTime = 0; preview(); });

    function activate() {
      active = true;
      players.forEach((p) => { if (p !== api) p.deactivate(true); });
      video.loop = false;
      video.muted = false;
      video.volume = Number(vol.value) / 100 || .8;
      video.currentTime = 0;
      video.play().catch((err) => {
        if (err && err.name === "NotAllowedError") { video.muted = true; video.play().catch(() => {}); }
      });
      syncState(); wake();
      toggleBtn.focus({ preventScroll: true });
    }
    function deactivate(stop) {
      if (!active && !stop) return;
      const wasActive = active;
      active = false;
      video.muted = true; video.loop = true;
      el.classList.remove("is-idle");
      listBtns[idx]?.style.setProperty("--p", 0);
      if (stop) video.pause();
      syncState();
      if (wasActive) players.forEach((p) => p.refresh());
    }
    function wake() {
      el.classList.remove("is-idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (active && !video.paused && !el.matches(":focus-within")) el.classList.add("is-idle"); }, 2600);
    }

    startBtn.addEventListener("click", activate);
    toggleBtn.addEventListener("click", () => { video.paused ? video.play().catch(() => {}) : video.pause(); wake(); });
    shell.addEventListener("click", (e) => {
      if (!active || e.target.closest(".vplayer-bar, [data-start]")) return;
      video.paused ? video.play().catch(() => {}) : video.pause(); wake();
    });
    shell.addEventListener("pointermove", () => { if (active) wake(); });
    el.addEventListener("keydown", (e) => {
      if (!active || e.target.matches("input")) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggleBtn.click(); }
      if (e.key === "m") muteBtn.click();
      if (e.key === "Escape" && !document.fullscreenElement) { deactivate(true); startBtn.focus(); }
    });
    seek.addEventListener("input", () => {
      seeking = true;
      if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
      setVal(seek, seek.value / 10); timeEl.textContent = fmt(video.currentTime); wake();
    });
    seek.addEventListener("change", () => { seeking = false; });
    muteBtn.addEventListener("click", () => {
      if (video.muted || video.volume === 0) { video.muted = false; if (video.volume === 0) { video.volume = .8; vol.value = 80; } }
      else video.muted = true;
      setVal(vol, video.muted ? 0 : vol.value); wake();
    });
    vol.addEventListener("input", () => {
      video.volume = vol.value / 100; video.muted = Number(vol.value) === 0;
      setVal(vol, vol.value); wake();
    });
    setVal(vol, vol.value);
    fsBtn.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (shell.requestFullscreen) shell.requestFullscreen().catch(() => {});
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    });

    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (active && !inView && !video.paused) video.pause();
      preview();
    }, { threshold: .35 }).observe(shell);

    const api = { el, activate, deactivate, video, isActive: () => active, refresh: () => preview() };
    syncState();
    return api;
  });

  listBtns.forEach((btn, i) => {
    const target = players[i];
    if (!target) return;
    btn.addEventListener("click", () => {
      scrollToEl(target.el, true);
      target.activate();
    });
    btn.addEventListener("pointerenter", () => target.el.classList.add("is-hinted"));
    btn.addEventListener("pointerleave", () => target.el.classList.remove("is-hinted"));
  });

  // Indicador do carrossel no celular
  const stage = document.querySelector(".videos-stage");
  const dots = [...document.querySelectorAll(".videos-dots span")];
  stage?.addEventListener("scroll", () => {
    const i = Math.round(stage.scrollLeft / Math.max(1, stage.scrollWidth - stage.clientWidth));
    dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
  }, { passive: true });


  /* ---------------------------------------------------------------- */
  /* Programa: carrossel dos 3 dias                                     */
  /* Desktop com animação: rola na horizontal conforme o scroll.        */
  /* Celular / sem animação: carrossel de deslizar com abas e setas.    */
  /* ---------------------------------------------------------------- */
  const daysEl = document.querySelector("[data-days]");
  if (daysEl) {
    const vp = daysEl.querySelector(".days-viewport");
    const track = daysEl.querySelector(".days-track");
    const cards = [...daysEl.querySelectorAll("[data-day-card]")];
    const tabs = [...daysEl.querySelectorAll("[data-day-go]")];
    const prevBtn = daysEl.querySelector("[data-day-prev]");
    const nextBtn = daysEl.querySelector("[data-day-next]");
    const n = cards.length;
    const seen = new Set();
    let current = -1, hTrigger = null;

    const revealList = (i) => {
      if (!animate || seen.has(i)) return;
      seen.add(i);
      gsap.fromTo(cards[i].querySelectorAll("li"), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: "power3.out", stagger: .06 });
      gsap.fromTo(cards[i].querySelector("h3"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: "power3.out" });
    };
    const setCurrent = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) return;
      current = i;
      cards.forEach((c, k) => c.classList.toggle("is-current", k === i));
      tabs.forEach((t, k) => { t.classList.toggle("is-on", k === i); t.setAttribute("aria-pressed", String(k === i)); });
      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = i === n - 1;
      if (daysInView) [i - 1, i, i + 1].forEach((k) => { if (k >= 0 && k < n) revealList(k); });
    };
    const setProgress = (p) => daysEl.style.setProperty("--dp", Math.max(0, Math.min(1, p)).toFixed(3));

    // Profundidade: o card central fica em destaque, os vizinhos giram levemente (sem escurecer)
    let daysVisible = false;
    const applyDepth = () => {
      if (!animate || !daysVisible) return;
      const vc = window.innerWidth / 2;
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const d = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - vc) / r.width));
        gsap.set(c, { rotationY: d * -8, scale: 1 - Math.min(Math.abs(d), 1) * .07, transformPerspective: 1600, transformOrigin: d < 0 ? "100% 50%" : "0% 50%" });
        const img = c.querySelector(".day-media img");
        if (img) gsap.set(img, { xPercent: d * -7, scale: 1.18 });
      });
    };

    const nativeIndex = () => {
      const left = vp.scrollLeft;
      let best = 0, bestD = Infinity;
      cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft - track.offsetLeft - left); if (d < bestD) { bestD = d; best = k; } });
      return best;
    };
    let raf = 0;
    vp.addEventListener("scroll", () => {
      if (hTrigger) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = vp.scrollWidth - vp.clientWidth;
        setProgress(max > 0 ? vp.scrollLeft / max : 0);
        setCurrent(nativeIndex());
        applyDepth();
      });
    }, { passive: true });

    const goTo = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      if (hTrigger) {
        const y = hTrigger.start + (hTrigger.end - hTrigger.start) * (i / (n - 1)) + 2;
        if (lenis) lenis.scrollTo(y, { duration: 1.3 });
        else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      } else {
        vp.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
      }
    };
    tabs.forEach((t) => t.addEventListener("click", () => goTo(Number(t.dataset.dayGo))));
    prevBtn?.addEventListener("click", () => goTo(current - 1));
    nextBtn?.addEventListener("click", () => goTo(current + 1));
    daysEl.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    });

    let daysInView = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !daysInView) { daysInView = true; const c = Math.max(0, current); [c - 1, c, c + 1].forEach((k) => { if (k >= 0 && k < n) revealList(k); }); }
    }, { threshold: .25 }).observe(daysEl);
    new IntersectionObserver(([e]) => { daysVisible = e.isIntersecting; if (daysVisible) applyDepth(); }).observe(daysEl);
    if (animate) cards.forEach((c) => gsap.set(c.querySelectorAll("li, h3"), { opacity: 0 }));
    setCurrent(0); setProgress(0);

    if (animate) {
      const daysMM = gsap.matchMedia();
      daysMM.add("(min-width: 1101px)", () => {
        daysEl.classList.add("days--h");
        const padX = () => parseFloat(getComputedStyle(vp).paddingLeft) || 0;
        const dist = () => Math.max(0, track.scrollWidth - (window.innerWidth - padX() * 2));
        const headerH = () => (document.querySelector(".header")?.offsetHeight || 70) + 20;
        // Altura do card calculada para caber inteira na tela (notebooks incluídos)
        const fit = () => {
          const bar = daysEl.querySelector(".days-bar");
          const barH = bar.offsetHeight + (parseFloat(getComputedStyle(bar).marginBottom) || 0);
          const avail = window.innerHeight - headerH() - barH - 10 - 24;
          daysEl.style.setProperty("--day-h", Math.round(Math.max(380, Math.min(640, avail))) + "px");
        };
        fit();
        ScrollTrigger.addEventListener("refreshInit", fit);
        const tween = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: daysEl, start: () => "top " + headerH(), end: () => "+=" + dist() * 1.15,
            scrub: 1, pin: true, anticipatePin: 1, refreshPriority: 7.5, invalidateOnRefresh: true,
            onUpdate: (self) => { setProgress(self.progress); setCurrent(Math.round(self.progress * (n - 1))); },
            onRefresh: applyDepth,
          },
        });
        hTrigger = tween.scrollTrigger;
        gsap.ticker.add(applyDepth);
        applyDepth();
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", fit);
          daysEl.style.removeProperty("--day-h");
          gsap.ticker.remove(applyDepth);
          hTrigger = null;
          daysEl.classList.remove("days--h");
          gsap.set(track, { clearProps: "transform" });
        };
      });
      vp.addEventListener("scroll", applyDepth, { passive: true });
      requestAnimationFrame(applyDepth);
    }
  }


  /* ---------------------------------------------------------------- */
  /* Resultados: carrossel em destaque (funciona com ou sem GSAP)      */
  /* ---------------------------------------------------------------- */
  const sc = document.querySelector("[data-showcase]");
  if (sc) {
    const stage = sc.querySelector("[data-sc-stage]");
    const cards = [...sc.querySelectorAll("[data-sc-card]")];
    const dots = [...sc.querySelectorAll("[data-sc-dot]")];
    const curEl = sc.querySelector("[data-sc-current]");
    const n = cards.length;
    const DUR = 4500;
    let active = 0, lastK = cards.map(() => 0), timer = 0, hovering = false, inView = false, interactedAt = 0;
    let scrollMode = false, scTrigger = null;

    sc.classList.add("is-js");
    sc.style.setProperty("--sc-dur", DUR / 1000 + "s");
    const cw = () => cards[0].offsetWidth || 300;
    const spacing = () => cw() * (window.innerWidth < 761 ? .78 : .74);
    const wrap = (k) => { k = ((k % n) + n) % n; return k > n / 2 ? k - n : k; };
    const scaleAt = (a) => a <= 1 ? 1 - .2 * a : a <= 2 ? .8 - .16 * (a - 1) : Math.max(.5, .64 - .14 * (a - 2));
    const opacAt = (a) => a <= 1 ? 1 - .36 * a : a <= 2 ? .64 - .36 * (a - 1) : Math.max(0, .28 - .28 * (a - 2));

    const render = (pos, jumpCheck) => {
      const sp = spacing();
      cards.forEach((c, i) => {
        const k = scrollMode ? i - pos : wrap(i - pos);
        const a = Math.abs(k);
        if (jumpCheck && Math.abs(k - lastK[i]) > 2.5) {
          c.style.transition = "none"; void c.offsetWidth;
          requestAnimationFrame(() => { c.style.transition = ""; });
        }
        lastK[i] = k;
        const x = k * sp * (a > 1 ? .94 : 1);
        c.style.transform = `translateX(${x}px) scale(${scaleAt(a)})`;
        c.style.opacity = opacAt(a);
        c.style.zIndex = String(20 - Math.round(a * 4));
        c.setAttribute("aria-hidden", String(Math.round(a) !== 0));
      });
    };
    const markActive = (i) => {
      cards.forEach((c, k) => c.classList.toggle("is-active", k === i));
      dots.forEach((d, k) => { d.classList.toggle("is-on", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
      if (curEl) curEl.textContent = String(i + 1).padStart(2, "0");
    };
    const setActive = (i, user) => {
      active = ((i % n) + n) % n;
      markActive(active);
      render(active, true);
      if (user) interactedAt = Date.now();
      schedule();
    };
    const canPlay = () => inView && !hovering && !reduce && !document.hidden && !scrollMode;
    function schedule() {
      clearTimeout(timer);
      const playing = canPlay();
      // reinicia a barrinha do ponto ativo
      sc.classList.remove("is-playing"); void sc.offsetWidth;
      if (!playing) return;
      sc.classList.add("is-playing");
      timer = setTimeout(() => setActive(active + 1), DUR);
    }

    // No modo scroll, navegar = rolar até o ponto daquele resultado
    const go = (i) => {
      if (scrollMode && scTrigger) {
        i = Math.max(0, Math.min(n - 1, i));
        const y = scTrigger.start + (scTrigger.end - scTrigger.start) * (i / (n - 1)) + 1;
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      } else setActive(i, true);
    };
    sc.querySelector("[data-sc-prev]")?.addEventListener("click", () => go(active - 1));
    sc.querySelector("[data-sc-next]")?.addEventListener("click", () => go(active + 1));
    dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
    sc.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
    });
    stage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovering = true; schedule(); } });
    stage.addEventListener("pointerleave", () => { hovering = false; schedule(); });
    document.addEventListener("visibilitychange", schedule);

    // Arrastar / deslizar
    let startX = 0, dx = 0, dragging = false, moved = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true; moved = false; startX = e.clientX; dx = 0;
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; stage.classList.add("is-drag"); clearTimeout(timer); }
      if (moved && !scrollMode) render(active - dx / spacing(), false);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-drag");
      if (moved) {
        const step = Math.round(-dx / spacing()) || (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0);
        go(active + step);
      } else {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const card = hit && hit.closest("[data-sc-card]");
        const idx = cards.indexOf(card);
        if (idx > -1 && idx !== active) go(idx);
      }
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !sc.classList.contains("is-in")) {
        if (animate) {
          cards.forEach((c, i) => { c.style.transitionDelay = Math.abs(wrap(i - active)) * .09 + "s"; });
          requestAnimationFrame(() => sc.classList.add("is-in"));
          setTimeout(() => cards.forEach((c) => { c.style.transitionDelay = ""; }), 1400);
        } else sc.classList.add("is-in");
      }
      schedule();
    }, { threshold: .3 }).observe(stage);
    window.addEventListener("resize", () => { if (!scrollMode) render(active, false); });
    setActive(0);

    // Desktop/tablet: o scroll da página percorre todas as fotos (seção fixa durante a passagem)
    if (animate) {
      const scMM = gsap.matchMedia();
      scMM.add("(min-width: 761px)", () => {
        scrollMode = true;
        clearTimeout(timer);
        sc.classList.remove("is-playing");
        sc.classList.add("is-scroll", "is-in");
        const hh = () => document.querySelector(".header")?.offsetHeight || 70;
        const fitW = () => {
          const ui = (sc.querySelector(".showcase-ui")?.offsetHeight || 60) + 40;
          const maxH = window.innerHeight - hh() - ui - 36;
          const w = Math.min(430, window.innerWidth * .3, maxH / 1.157);
          sc.style.setProperty("--cw", Math.round(Math.max(220, w)) + "px");
        };
        fitW();
        ScrollTrigger.addEventListener("refreshInit", fitW);
        const proxy = { pos: 0 };
        const tw = gsap.to(proxy, {
          pos: n - 1, ease: "none",
          scrollTrigger: {
            trigger: sc,
            start: () => "center " + Math.round(hh() + (window.innerHeight - hh()) / 2),
            end: () => "+=" + Math.round((n - 1) * window.innerHeight * .5),
            scrub: .7, pin: true, anticipatePin: 1, refreshPriority: 5, invalidateOnRefresh: true,
            onRefresh: () => render(proxy.pos, false),
          },
          onUpdate: () => {
            render(proxy.pos, false);
            const a = Math.round(proxy.pos);
            if (a !== active) { active = a; markActive(a); }
          },
        });
        scTrigger = tw.scrollTrigger;
        active = 0; markActive(0); render(0, false);
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", fitW);
          scrollMode = false; scTrigger = null;
          sc.classList.remove("is-scroll");
          sc.style.removeProperty("--cw");
          setActive(Math.round(proxy.pos));
        };
      });
    }
  }

  // Sem GSAP ou com movimento reduzido: estados finais e fim.
  const loader = document.querySelector(".loader");
  if (!animate) {
    if (loader) loader.style.display = "none";
    document.querySelectorAll(".method-step").forEach((s) => s.classList.add("is-active"));
    return;
  }

  /* ---------------------------------------------------------------- */
  /* Animações                                                         */
  /* ---------------------------------------------------------------- */

  // Divide títulos em palavras mantendo <em> e <br>
  function splitWords(el) {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const wi = document.createElement("span");
            wi.className = "wi";
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
            words.push(wi);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== "BR" && !n.classList.contains("ph")) {
          walk(n);
        }
      });
    };
    walk(el);
    return words;
  }

  const heroTitle = document.querySelector('[data-split="hero"]');
  const heroWords = heroTitle ? splitWords(heroTitle) : [];
  gsap.set(heroWords, { yPercent: 115 });

  document.querySelectorAll("[data-split]:not([data-split='hero'])").forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el, start: "top 86%", once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.028 }),
    });
  });

  // Entrada da primeira dobra (o único momento "orquestrado" de abertura)
  function heroIntro() {
    const tl = gsap.timeline();
    tl.fromTo(".hero-frame", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0)
      .to(".hero .eyebrow", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, .35)
      .to(heroWords, { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: 0.022 }, .45)
      .to(".hero-in:not(.eyebrow)", { opacity: 1, y: 0, duration: .9, ease: "power3.out", stagger: .1 }, 1.0)
      .to(".hero-chip-in", { opacity: 1, y: 0, scale: 1, duration: .9, ease: "back.out(1.6)", stagger: .14 }, 1.25)
      .from(".hero-rings", { scale: .7, opacity: 0, duration: 1.8, ease: "expo.out" }, .5)
      .set(".hero-frame", { clipPath: "none" });
  }

  // Loader curto, sem esperar imagens e vídeos
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]) : Promise.resolve();
  fontsReady.then(() => {
    gsap.timeline()
      .to(loader.querySelector("i"), { scaleX: 0, duration: .5, ease: "power2.in" })
      .to(loader, { yPercent: -100, duration: .9, ease: "power4.inOut" }, .15)
      .set(loader, { display: "none" })
      .add(heroIntro, .55);
    ScrollTrigger.refresh();
  });

  // Efeitos mais pesados só no desktop/tablet
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    // Vídeos: os dois players descem em velocidades diferentes
    gsap.fromTo(".vplayer--a", { y: 70 }, { y: -50, ease: "none", scrollTrigger: { trigger: ".videos", start: "top bottom", end: "bottom top", scrub: 1 } });
    gsap.fromTo(".vplayer--b", { y: 150 }, { y: -90, ease: "none", scrollTrigger: { trigger: ".videos", start: "top bottom", end: "bottom top", scrub: 1 } });
    gsap.fromTo(".videos-copy", { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: ".videos", start: "top bottom", end: "bottom top", scrub: 1 } });

    // Galeria em órbita (pin)
    const gallery = document.querySelector(".orbit-gallery");
    if (gallery) {
      const cards = gsap.utils.toArray(".orbit-card", gallery);
      const from = [{ x: -60, y: -40, rotation: -38 }, { x: 60, y: -40, rotation: 38 }, { x: -50, y: 40, rotation: 32 }, { x: 50, y: 40, rotation: -34 }];
      cards.forEach((c, i) => gsap.set(c, { ...from[i], autoAlpha: 0, scale: .6 }));
      gsap.timeline({ scrollTrigger: { trigger: gallery, start: "top top", end: "+=100%", scrub: 1, pin: true, anticipatePin: 1, refreshPriority: 7 } })
        .to(cards, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotation: (i) => [-10, 8, 7, -8][i], stagger: .08, duration: .4, ease: "power3.out" }, 0)
        .to(".orbit-card--one", { rotation: 12, x: 40, y: -18, duration: .6, ease: "none" }, .4)
        .to(".orbit-card--two", { rotation: -12, x: -36, y: 24, duration: .6, ease: "none" }, .4)
        .to(".orbit-card--three", { rotation: -9, x: 34, y: -26, duration: .6, ease: "none" }, .4)
        .to(".orbit-card--four", { rotation: 12, x: -36, y: 20, duration: .6, ease: "none" }, .4);
    }

    // Botões magnéticos
    if (finePointer) {
      document.querySelectorAll(".magnetic").forEach((btn) => {
        btn.addEventListener("pointermove", (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .14, y: (e.clientY - r.top - r.height / 2) * .22, duration: .35 });
        });
        btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, duration: .6, ease: "elastic.out(1, .4)" }));
      });
    }
  });



  // Reveal com fade + blur + movimento vertical
  ScrollTrigger.batch(".reveal", {
    start: "top 88%", once: true,
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: .09,
      onComplete() { this.targets().forEach((t) => t.classList.add("is-in")); gsap.set(this.targets(), { clearProps: "opacity,filter,transform" }); },
    }),
  });

  // Contadores
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const obj = { v: 0 };
    el.textContent = prefix + "0";
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.8, ease: "power2.out",
        onUpdate: () => { el.textContent = prefix + Math.round(obj.v); },
      }),
    });
  });

  // Zoom cinematográfico em imagens
  gsap.utils.toArray(".img-grow").forEach((wrap) => {
    const img = wrap.querySelector("img");
    if (!img) return;
    gsap.fromTo(img, { scale: 1.16 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });

  // Hero: câmera interativa (mouse) — palco 3D, chips em profundidade, luz e reflexo
  const hero = document.querySelector(".hero");
  if (finePointer && hero) {
    const tilt = document.querySelector(".hero-tilt");
    const frame = document.querySelector(".hero-frame");
    const rx = gsap.quickTo(tilt, "rotationX", { duration: .9, ease: "power3.out" });
    const ry = gsap.quickTo(tilt, "rotationY", { duration: .9, ease: "power3.out" });
    const chips = gsap.utils.toArray(".hero-chip").map((c) => ({
      d: Number(c.dataset.depth) || 30,
      x: gsap.quickTo(c, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(c, "y", { duration: 1.1, ease: "power3.out" }),
    }));
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      rx(ny * -9); ry(nx * 13);
      chips.forEach((c) => { c.x(nx * c.d); c.y(ny * c.d); });
      hero.style.setProperty("--sx", e.clientX - r.left + "px");
      hero.style.setProperty("--sy", e.clientY - r.top + "px");
      const fr = frame.getBoundingClientRect();
      frame.style.setProperty("--gx", ((e.clientX - fr.left) / fr.width) * 100 + "%");
      frame.style.setProperty("--gy", ((e.clientY - fr.top) / fr.height) * 100 + "%");
    });
    hero.addEventListener("pointerleave", () => { rx(0); ry(0); chips.forEach((c) => { c.x(0); c.y(0); }); });
  }

  // Hero: saída cinematográfica sincronizada ao scroll
  const heroMM = gsap.matchMedia();
  heroMM.add("(min-width: 1024px)", () => {
    const vis = document.querySelector(".hero-visual");
    gsap.set(".hero-stage", { rotationY: -10, rotationX: 4, transformPerspective: 1600 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=80%", scrub: 1, pin: true, anticipatePin: 1, refreshPriority: 10, invalidateOnRefresh: true },
    });
    tl.to(".hero-copy", { x: -110, opacity: 0, filter: "blur(12px)", ease: "power2.in", duration: .5 }, 0)
      .to(".hero-scroll, .hero-orb", { opacity: 0, duration: .25 }, 0)
      .to(".hero-stage", { rotationY: 0, rotationX: 0, ease: "power1.inOut", duration: .8 }, 0)
      .to(vis, { x: () => hero.clientWidth / 2 - (vis.offsetLeft + vis.offsetWidth / 2), scale: 1.28, ease: "power2.inOut", duration: .8 }, 0)
      .to(".hero-frame", { borderRadius: 30, ease: "power2.inOut", duration: .8 }, 0)
      .to(".hero-chip--model .hero-chip-in", { x: -160, y: -80, opacity: 0, ease: "power2.in", duration: .55 }, .1)
      .to(".hero-chip--flow .hero-chip-in", { x: 170, y: 30, opacity: 0, ease: "power2.in", duration: .55 }, .12)
      .to(".hero-chip--tag .hero-chip-in", { x: -120, y: 90, opacity: 0, ease: "power2.in", duration: .55 }, .14)
      .to(".hero-rings", { scale: 1.55, rotation: 50, opacity: .25, ease: "none", duration: .8 }, 0)
      .to({}, { duration: .2 });
  });
  heroMM.add("(max-width: 1023px)", () => {
    gsap.to(".hero-copy", { y: -60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".hero-stage", { rotationX: 14, y: 40, transformPerspective: 1200, transformOrigin: "50% 100%", ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".hero-rings", { rotation: 40, scale: 1.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
  });

  // Barra de progresso de leitura
  gsap.to(".scroll-progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  // Diferenciais em números: viram para cima em 3D
  gsap.from(".stats-grid strong", {
    rotationX: -95, opacity: 0, y: 30, transformPerspective: 700, transformOrigin: "50% 100%", duration: 1.2, ease: "expo.out", stagger: .12,
    scrollTrigger: { trigger: ".stats-grid", start: "top 85%", once: true },
  });
  gsap.to(".hero-orb", { rotation: 120, x: -80, y: 90, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 } });

  // Método: trilho que preenche, passos que acendem e contador que troca
  gsap.to(".method-rail i", {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: ".method-steps", start: "top 62%", end: "bottom 62%", scrub: .6 },
  });
  const counterNum = document.querySelector(".method-counter-num");
  const setCounter = (txt) => {
    if (!counterNum || counterNum.textContent === txt) return;
    gsap.timeline()
      .to(counterNum, { yPercent: -40, opacity: 0, duration: .22, ease: "power2.in" })
      .add(() => { counterNum.textContent = txt; })
      .fromTo(counterNum, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: "power3.out" });
  };
  const steps = gsap.utils.toArray(".method-step");
  steps.forEach((step, i) => {
    gsap.from(step, {
      rotationX: -38, y: 80, transformOrigin: "50% 0%", duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: step, start: "top 88%", once: true },
    });
    const setCurrent = (k) => steps.forEach((s, n) => s.classList.toggle("is-current", n === k));
    ScrollTrigger.create({
      trigger: step, start: "top 62%",
      onEnter: () => { step.classList.add("is-active"); setCurrent(i); setCounter(step.dataset.step); },
      onLeaveBack: () => { step.classList.remove("is-active"); setCurrent(i - 1); setCounter(i ? steps[i - 1].dataset.step : "01"); },
    });
  });
  gsap.fromTo(".method-highlight", { rotationX: 24, scale: .9, y: 60, transformPerspective: 1200, transformOrigin: "50% 100%" }, {
    rotationX: 0, scale: 1, y: 0, ease: "none",
    scrollTrigger: { trigger: ".method-highlight", start: "top bottom", end: "top 45%", scrub: 1 },
  });
  gsap.fromTo(".method-word", { xPercent: 4 }, { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".method", start: "top bottom", end: "bottom top", scrub: 1 } });

  // 06: o vídeo de fundo abre de um recorte para tela cheia
  gsap.fromTo(".live-media", { clipPath: "inset(9% 7% 9% 7% round 28px)" }, {
    clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
    scrollTrigger: { trigger: ".live", start: "top 90%", end: "top 10%", scrub: 1 },
  });
  gsap.fromTo(".live-media video", { scale: 1.18 }, {
    scale: 1, ease: "none", scrollTrigger: { trigger: ".live", start: "top bottom", end: "bottom top", scrub: 1 },
  });


  // Seção de vídeos: entrada cinematográfica, zoom suave e parallax
  gsap.utils.toArray(".vplayer").forEach((p, i) => {
    const shell = p.querySelector(".vplayer-shell");
    gsap.fromTo(shell, { clipPath: "inset(100% 0% 0% 0% round 26px)", rotation: i ? 3 : -3, yPercent: 8 }, {
      clipPath: "inset(0% 0% 0% 0% round 26px)", rotation: 0, yPercent: 0, duration: 1.5, ease: "expo.out", delay: i * .18,
      scrollTrigger: { trigger: ".videos-stage", start: "top 78%", once: true },
      onComplete: () => gsap.set(shell, { clearProps: "clipPath,transform" }),
    });
    gsap.fromTo(p, { "--z": 1.22 }, {
      "--z": 1, ease: "none",
      scrollTrigger: { trigger: p, start: "top bottom", end: "center center", scrub: 1 },
    });
    gsap.from(p.querySelectorAll(".vplayer-top > *"), {
      y: -14, opacity: 0, duration: .7, ease: "power3.out", stagger: .08, delay: .6 + i * .18,
      scrollTrigger: { trigger: ".videos-stage", start: "top 78%", once: true },
    });
  });
  gsap.fromTo(".videos-glow", { scale: .6, opacity: .3, xPercent: 10 }, {
    scale: 1.1, opacity: 1, xPercent: -8, ease: "none",
    scrollTrigger: { trigger: ".videos", start: "top bottom", end: "bottom top", scrub: 1.2 },
  });


  // Tudo incluso: a grade "deita" e se ergue com a câmera
  gsap.fromTo(".included-grid", { rotationX: 16, y: 60, transformPerspective: 1500, transformOrigin: "50% 0%" }, {
    rotationX: 0, y: 0, ease: "none",
    scrollTrigger: { trigger: ".included-grid", start: "top bottom", end: "top 40%", scrub: 1 },
  });

  // Transições entre seções: painéis escuros abrem como cortina
  gsap.utils.toArray(".mentor, .cta").forEach((sec) => {
    sec.classList.add("curtain");
    gsap.fromTo(sec, { clipPath: "inset(6% 4% 0% 4% round 40px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "top 20%", scrub: 1 },
    });
  });


  // Transição por empilhamento: a seção seguinte desliza por cima e a anterior recua
  const stackMM = gsap.matchMedia();
  stackMM.add("(min-width: 1024px)", () => {
    const pairs = [[".stats", 9], [".videos", 8], [".proof", 6], [".included", 4]];
    const made = [];
    pairs.forEach(([sel, prio]) => {
      const under = document.querySelector(sel);
      if (!under) return;
      under.classList.add("stack-under");
      const shade = document.createElement("div");
      shade.className = "stack-shade";
      under.appendChild(shade);
      made.push([under, shade]);
      const dist = () => Math.max(120, Math.min(under.offsetHeight, window.innerHeight) - 44);
      gsap.timeline({
        scrollTrigger: {
          trigger: under, start: "bottom bottom", end: () => "+=" + dist(),
          scrub: true, pin: true, pinSpacing: false, refreshPriority: prio, invalidateOnRefresh: true,
        },
      })
        .to(under, { scale: .9, yPercent: -2, ease: "none" }, 0)
        .to(shade, { opacity: .6, ease: "none" }, 0);
    });
    return () => made.forEach(([u, sh]) => { u.classList.remove("stack-under"); sh.remove(); });
  });

  // Texto que acende palavra por palavra conforme o scroll
  gsap.utils.toArray(".results-summary > p").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    p.classList.add("scrub-text");
    const spans = words.map((w, i) => {
      const sp = document.createElement("span");
      sp.className = "sw"; sp.textContent = w;
      p.appendChild(sp);
      if (i < words.length - 1) p.appendChild(document.createTextNode(" "));
      return sp;
    });
    ScrollTrigger.create({
      trigger: p, start: "top 82%", end: "bottom 45%", scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((sp, i) => sp.classList.toggle("on", i < n));
      },
    });
  });

  // Cards com perspectiva 3D e brilho que segue o cursor
  if (finePointer) {
    gsap.utils.toArray(".audience-col, .inc, .turma-item").forEach((el) => {
      el.classList.add("tilt");
      const rX = gsap.quickTo(el, "rotationX", { duration: .6, ease: "power3.out" });
      const rY = gsap.quickTo(el, "rotationY", { duration: .6, ease: "power3.out" });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        rX((ny - .5) * -7); rY((nx - .5) * 9);
        el.style.setProperty("--gx", nx * 100 + "%"); el.style.setProperty("--gy", ny * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { rX(0); rY(0); });
    });
  }

  // Turma: trilha de luz
  gsap.to(".turma-glow", { yPercent: 25, scale: 1.15, ease: "none", scrollTrigger: { trigger: ".turma", start: "top bottom", end: "bottom top", scrub: 1 } });
  gsap.fromTo(".cta-glow", { scale: .7, opacity: .4 }, { scale: 1.1, opacity: 1, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom bottom", scrub: 1 } });

  // Recalcula depois que imagens e fontes assentam
  window.addEventListener("load", () => ScrollTrigger.refresh());

})();
