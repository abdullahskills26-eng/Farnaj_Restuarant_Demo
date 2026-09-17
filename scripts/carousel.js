/**
 * Hero carousel — auto-play (pauses on hover, focus, hidden tab or user toggle),
 * arrow + dot navigation, keyboard arrows and touch swipe.
 *
 * Markup contract:
 *   [data-carousel]
 *     [data-carousel-track] > slides
 *     [data-carousel-prev] [data-carousel-next] [data-carousel-toggle]
 *     [data-carousel-dots] [data-carousel-progress]
 */

class Carousel {
  constructor(root, { interval = 4000 } = {}) {
    this.root = root;
    this.track = root.querySelector("[data-carousel-track]");
    this.slides = [...this.track.children];
    this.dotsWrap = root.querySelector("[data-carousel-dots]");
    this.progress = root.querySelector("[data-carousel-progress]");
    this.toggleBtn = root.querySelector("[data-carousel-toggle]");
    this.interval = interval;

    this.index = 0;
    this.elapsed = 0;
    this.lastFrame = null;
    this.userPaused = false;
    this.hovering = false;
    this.focusWithin = false;

    this.buildDots();
    this.bindEvents();
    this.goTo(0);
    requestAnimationFrame((t) => this.tick(t));
  }

  get halted() {
    return this.userPaused || this.hovering || this.focusWithin || document.hidden;
  }

  buildDots() {
    this.dots = this.slides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => this.goTo(i));
      this.dotsWrap.appendChild(dot);
      return dot;
    });
  }

  bindEvents() {
    this.root.querySelectorAll("[data-carousel-prev]").forEach((btn) => btn.addEventListener("click", () => this.prev()));
    this.root.querySelectorAll("[data-carousel-next]").forEach((btn) => btn.addEventListener("click", () => this.next()));
    this.toggleBtn?.addEventListener("click", () => this.setUserPaused(!this.userPaused));

    this.root.addEventListener("mouseenter", () => (this.hovering = true));
    this.root.addEventListener("mouseleave", () => (this.hovering = false));
    // Only keyboard focus pauses; a tap on an arrow shouldn't stop auto-play on mobile.
    this.root.addEventListener("focusin", (e) => (this.focusWithin = e.target.matches(":focus-visible")));
    this.root.addEventListener("focusout", (e) => {
      if (!this.root.contains(e.relatedTarget)) this.focusWithin = false;
    });

    this.root.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "ArrowRight") this.next();
    });

    // Touch / pen swipe
    let startX = null;
    let startY = null;
    this.track.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      startX = e.clientX;
      startY = e.clientY;
    });
    this.track.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? this.next() : this.prev());
    });
    this.track.addEventListener("pointercancel", () => (startX = null));
  }

  tick(now) {
    if (this.lastFrame !== null && !this.halted) {
      this.elapsed += now - this.lastFrame;
      if (this.elapsed >= this.interval) this.next();
    }
    this.lastFrame = now;
    if (this.progress) this.progress.style.transform = `scaleX(${Math.min(this.elapsed / this.interval, 1)})`;
    requestAnimationFrame((t) => this.tick(t));
  }

  goTo(index) {
    const count = this.slides.length;
    this.index = (index + count) % count;
    this.elapsed = 0;
    this.track.style.transform = `translateX(-${this.index * 100}%)`;

    this.slides.forEach((slide, i) => {
      const active = i === this.index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    this.dots.forEach((dot, i) => {
      const active = i === this.index;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  next() {
    this.goTo(this.index + 1);
  }

  prev() {
    this.goTo(this.index - 1);
  }

  setUserPaused(paused) {
    this.userPaused = paused;
    if (!this.toggleBtn) return;
    this.toggleBtn.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    this.toggleBtn.setAttribute("aria-pressed", String(paused));
    this.toggleBtn.classList.toggle("is-paused", paused);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-carousel]").forEach((root) => new Carousel(root, { interval: 4000 }));
});
