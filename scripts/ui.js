/**
 * Shared UI primitives: safe storage, HTML escaping, icons,
 * image fallbacks, overlay (drawer / modal) controller and toasts.
 */

const SafeStorage = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode / blocked) — app still works in-memory */
    }
  },
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const refreshIcons = () => {
  if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
};

/* ---------- Image fallback (any <img data-fallback>) ---------- */

const FALLBACK_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6B1B6D"/><stop offset="1" stop-color="#E40066"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(160 110)"><path d="M10 0v30a10 10 0 0 0 20 0V0M20 0v80"/><path d="M70 0c-12 0-20 14-20 34 0 12 8 16 20 16v30"/></g></svg>`
  );

document.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (img.tagName !== "IMG" || !img.hasAttribute("data-fallback") || img.dataset.failed) return;
    img.dataset.failed = "true";
    img.src = FALLBACK_IMAGE;
  },
  true
);

/* ---------- Overlay controller (drawers & modals) ---------- */

const Overlay = (() => {
  const stack = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const lockScroll = () => {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : "";
  };

  const unlockScroll = () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };

  document.addEventListener("keydown", (event) => {
    const top = stack[stack.length - 1];
    if (!top) return;

    if (event.key === "Escape") {
      event.preventDefault();
      top.close();
      return;
    }

    if (event.key === "Tab") {
      const nodes = [...top.root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /**
   * @param {HTMLElement} root  element with class "overlay"
   * @param {{ initialFocus?: string, onOpen?: Function, onClose?: Function }} options
   */
  const create = (root, { initialFocus, onOpen, onClose } = {}) => {
    let lastFocused = null;

    const controller = {
      root,
      get isOpen() {
        return root.classList.contains("is-open");
      },
      open() {
        if (controller.isOpen) return;
        lastFocused = document.activeElement;
        stack.push(controller);
        root.classList.add("is-open");
        root.setAttribute("aria-hidden", "false");
        lockScroll();
        onOpen?.();
        const target = (initialFocus && root.querySelector(initialFocus)) || root.querySelector(FOCUSABLE);
        // wait a frame so the element is visible (visibility transition) before focusing
        requestAnimationFrame(() => target?.focus({ preventScroll: true }));
      },
      close() {
        if (!controller.isOpen) return;
        stack.splice(stack.indexOf(controller), 1);
        root.classList.remove("is-open");
        root.setAttribute("aria-hidden", "true");
        if (!stack.length) unlockScroll();
        onClose?.();
        lastFocused?.focus?.({ preventScroll: true });
      },
      toggle() {
        controller.isOpen ? controller.close() : controller.open();
      },
    };

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-overlay-close]")) controller.close();
    });

    return controller;
  };

  return { create };
})();

/* ---------- Toast notifications ---------- */

const Toast = (() => {
  let container;

  const show = (message, { icon = "circle-check", tone = "success" } = {}) => {
    container ||= document.getElementById("toastRegion");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast--${tone}`;
    toast.innerHTML = `<i data-lucide="${icon}" class="h-5 w-5 shrink-0"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    refreshIcons();

    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 600); // safety if transitions are disabled
    }, 2600);
  };

  return { show };
})();
