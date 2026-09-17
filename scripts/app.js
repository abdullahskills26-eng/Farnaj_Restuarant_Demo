/**
 * App bootstrap: category filter, menu grid, wishlist, search modal,
 * header/location wiring and floating controls.
 */

const App = (() => {
  const WISHLIST_KEY = "farnaj.wishlist.v1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    category: "All",
    wishlist: new Set(
      (SafeStorage.get(WISHLIST_KEY, []) || []).filter((id) => getMenuItem(id)).map(Number)
    ),
    pendingQty: new Map(), // per-card quantity chosen before "Add To Cart"
  };

  const els = {};
  let wishlistOverlay;
  let searchOverlay;

  const $ = (id) => document.getElementById(id);
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

  /* ======================= Layout helpers ======================= */

  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty("--header-h", `${els.header.offsetHeight}px`);
  };

  const stickyOffset = () => els.header.offsetHeight + els.categoryBar.offsetHeight;

  const scrollToElement = (element, extra = 12) => {
    const top = element.getBoundingClientRect().top + window.scrollY - stickyOffset() - extra;
    window.scrollTo({ top: Math.max(top, 0), behavior: scrollBehavior() });
  };

  /* ======================= Categories ======================= */

  const renderCategoryTabs = () => {
    els.categoryTabs.innerHTML = CATEGORIES.map((category) => {
      const count = category === "All" ? menuData.length : menuData.filter((i) => i.category === category).length;
      return `
        <button type="button" class="category-tab" data-category="${escapeHtml(category)}" aria-pressed="${category === state.category}">
          <i data-lucide="${CATEGORY_ICONS[category] || "utensils"}" class="h-4 w-4"></i>
          <span>${escapeHtml(category)}</span>
          <span class="category-tab__count">${count}</span>
        </button>`;
    }).join("");
  };

  const setCategory = (category, { scroll = "auto" } = {}) => {
    if (!CATEGORIES.includes(category)) return;
    state.category = category;

    els.categoryTabs.querySelectorAll(".category-tab").forEach((tab) => {
      const active = tab.dataset.category === category;
      tab.setAttribute("aria-pressed", String(active));
      if (active) {
        const left = tab.offsetLeft - (els.categoryTabs.clientWidth - tab.offsetWidth) / 2;
        els.categoryTabs.scrollTo({ left, behavior: scrollBehavior() });
      }
    });

    renderMenu();

    // "auto": only jump back up if the reader has scrolled past the start of the menu
    const menuTop = els.menuSection.getBoundingClientRect().top - stickyOffset();
    if (scroll === "always" || (scroll === "auto" && menuTop < -1)) scrollToElement(els.menuSection, 0);
  };

  /* ======================= Menu grid ======================= */

  const cardTemplate = (item) => {
    const wished = state.wishlist.has(item.id);
    const inCart = CartManager.getQty(item.id);
    const pending = state.pendingQty.get(item.id) || 1;
    const name = escapeHtml(item.name);

    return `
      <article id="dish-${item.id}" class="menu-card group" data-id="${item.id}">
        <div class="relative aspect-[16/10] overflow-hidden bg-brand-bg sm:aspect-[4/3]">
          <img src="${escapeHtml(item.image)}" alt="${name}" loading="lazy" decoding="async" data-fallback
               class="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105">
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent"></div>
          <button type="button" data-action="wishlist" class="wish-btn ${wished ? "is-active" : ""}"
                  aria-pressed="${wished}" aria-label="${wished ? "Remove" : "Add"} ${name} ${wished ? "from" : "to"} wishlist">
            <i data-lucide="heart" class="h-[18px] w-[18px]"></i>
          </button>
          <span class="in-cart-chip" data-in-cart ${inCart ? "" : "hidden"}>
            <i data-lucide="shopping-bag" class="h-3.5 w-3.5"></i><span data-in-cart-count>${inCart} in cart</span>
          </span>
        </div>

        <div class="flex flex-1 flex-col p-4 sm:p-5">
          <h4 class="font-semibold leading-snug text-slate-900">${name}</h4>
          ${item.urdu ? `<p lang="ur" dir="rtl" class="font-urdu mt-1 text-left text-[0.95rem] text-brand-purple/80">${escapeHtml(item.urdu)}</p>` : ""}
          <p class="mt-2 text-sm leading-relaxed text-slate-500">${escapeHtml(getItemDescription(item))}</p>

          <div class="mt-auto pt-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-lg font-bold text-brand-purple">${formatPrice(item.price)}</p>
              <div class="stepper" role="group" aria-label="Quantity for ${name}">
                <button type="button" data-action="dec" aria-label="Decrease quantity" ${pending <= 1 ? "disabled" : ""}>
                  <i data-lucide="minus" class="h-4 w-4"></i>
                </button>
                <span data-pending-qty aria-live="polite">${pending}</span>
                <button type="button" data-action="inc" aria-label="Increase quantity">
                  <i data-lucide="plus" class="h-4 w-4"></i>
                </button>
              </div>
            </div>
            <button type="button" data-action="add" class="btn-primary mt-3 w-full">
              <i data-lucide="shopping-cart" class="h-4 w-4"></i> Add To Cart
            </button>
          </div>
        </div>
      </article>`;
  };

  const renderMenu = () => {
    const categories = state.category === "All" ? CATEGORIES.slice(1) : [state.category];

    els.menuGrid.innerHTML = categories
      .map((category, index) => {
        const items = menuData.filter((item) => item.category === category);
        const headingId = `group-${index}`;
        return `
          <section class="menu-group" aria-labelledby="${headingId}">
            <div class="mb-5 flex items-end justify-between gap-4">
              <h3 id="${headingId}" class="flex items-center gap-3 text-xl font-bold text-slate-900 sm:text-2xl">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-pink/10 text-brand-pink">
                  <i data-lucide="${CATEGORY_ICONS[category] || "utensils"}" class="h-5 w-5"></i>
                </span>
                ${escapeHtml(category)}
              </h3>
              <span class="shrink-0 text-sm font-medium text-slate-500">${items.length} ${items.length === 1 ? "dish" : "dishes"}</span>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              ${items.map(cardTemplate).join("")}
            </div>
          </section>`;
      })
      .join("");

    const shown = state.category === "All" ? menuData.length : menuData.filter((i) => i.category === state.category).length;
    els.menuCount.textContent = `Showing ${shown} ${shown === 1 ? "dish" : "dishes"}${state.category === "All" ? "" : ` in ${state.category}`}`;

    els.menuGrid.classList.remove("is-entering");
    void els.menuGrid.offsetWidth; // restart entrance animation
    els.menuGrid.classList.add("is-entering");
    refreshIcons();
  };

  const updatePendingQty = (card, id, qty) => {
    qty = Math.max(1, Math.min(qty, CartManager.MAX_QTY));
    state.pendingQty.set(id, qty);
    card.querySelector("[data-pending-qty]").textContent = qty;
    card.querySelector('[data-action="dec"]').disabled = qty <= 1;
    card.querySelector('[data-action="inc"]').disabled = qty >= CartManager.MAX_QTY;
  };

  const updateCardCartState = (id) => {
    const card = $(`dish-${id}`);
    if (!card) return;
    const qty = CartManager.getQty(id);
    const chip = card.querySelector("[data-in-cart]");
    chip.hidden = qty === 0;
    chip.querySelector("[data-in-cart-count]").textContent = `${qty} in cart`;
  };

  const onGridClick = (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".menu-card");
    const id = Number(card.dataset.id);
    const pending = state.pendingQty.get(id) || 1;

    switch (button.dataset.action) {
      case "inc":
        updatePendingQty(card, id, pending + 1);
        break;
      case "dec":
        updatePendingQty(card, id, pending - 1);
        break;
      case "wishlist":
        toggleWishlist(id);
        break;
      case "add":
        addToCart(id, pending, { openDrawer: true });
        updatePendingQty(card, id, 1);
        break;
    }
  };

  const addToCart = (id, qty = 1, { openDrawer = false } = {}) => {
    const item = getMenuItem(id);
    if (!item) return;
    const before = CartManager.getQty(id);
    CartManager.add(id, qty);
    const added = CartManager.getQty(id) - before;

    if (added <= 0) {
      Toast.show(`Maximum quantity for ${item.name} reached`, { icon: "circle-alert", tone: "error" });
      return;
    }
    Toast.show(`${item.name} ×${added} added to cart`, { icon: "shopping-bag" });
    if (openDrawer) CartDrawer.open();
  };

  /* ======================= Wishlist ======================= */

  const saveWishlist = () => SafeStorage.set(WISHLIST_KEY, [...state.wishlist]);

  const toggleWishlist = (id) => {
    const item = getMenuItem(id);
    if (!item) return;
    const adding = !state.wishlist.has(id);
    adding ? state.wishlist.add(id) : state.wishlist.delete(id);
    saveWishlist();

    document.querySelectorAll(`[data-id="${id}"] .wish-btn`).forEach((btn) => {
      btn.classList.toggle("is-active", adding);
      btn.setAttribute("aria-pressed", String(adding));
      btn.setAttribute("aria-label", `${adding ? "Remove" : "Add"} ${item.name} ${adding ? "from" : "to"} wishlist`);
      if (adding) {
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
      }
    });

    renderWishlist();
    Toast.show(adding ? `${item.name} saved to wishlist` : `${item.name} removed from wishlist`, {
      icon: adding ? "heart" : "heart-off",
      tone: adding ? "love" : "neutral",
    });
  };

  const renderWishlist = () => {
    const items = [...state.wishlist].map(getMenuItem).filter(Boolean);
    const count = items.length;

    els.wishlistBadge.textContent = count;
    els.wishlistBadge.hidden = count === 0;
    els.wishlistCountLabel.textContent = `${count} saved ${count === 1 ? "dish" : "dishes"}`;
    els.wishlistEmpty.hidden = count > 0;
    els.wishlistList.hidden = count === 0;

    els.wishlistList.innerHTML = items
      .map(
        (item) => `
        <li class="flex items-center gap-3 py-4" data-id="${item.id}">
          <img src="${escapeHtml(item.image)}" alt="" data-fallback loading="lazy" class="h-16 w-16 shrink-0 rounded-xl object-cover bg-brand-bg">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold leading-snug text-slate-800">${escapeHtml(item.name)}</p>
            <p class="mt-0.5 text-sm font-bold text-brand-purple">${formatPrice(item.price)}</p>
          </div>
          <button type="button" data-wishlist-action="add" class="btn-primary btn-sm" aria-label="Add ${escapeHtml(item.name)} to cart">
            <i data-lucide="plus" class="h-4 w-4"></i> Add
          </button>
          <button type="button" data-wishlist-action="remove" class="icon-btn h-9 w-9 text-brand-pink hover:bg-rose-50" aria-label="Remove ${escapeHtml(item.name)} from wishlist">
            <i data-lucide="heart-off" class="h-4 w-4"></i>
          </button>
        </li>`
      )
      .join("");
    refreshIcons();
  };

  const onWishlistClick = (event) => {
    const button = event.target.closest("[data-wishlist-action]");
    if (!button) return;
    const id = Number(button.closest("[data-id]").dataset.id);
    if (button.dataset.wishlistAction === "add") addToCart(id, 1);
    if (button.dataset.wishlistAction === "remove") {
      toggleWishlist(id);
      els.wishlistDrawer.querySelector(".drawer-close").focus();
    }
  };

  /* ======================= Search ======================= */

  const normalize = (text) => String(text || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

  const searchIndex = menuData.map((item) => ({
    item,
    haystack: normalize(`${item.name} ${item.urdu} ${item.category} ${getItemDescription(item)}`),
  }));

  const runSearch = () => {
    const query = normalize(els.searchInput.value.trim());
    const tokens = query.split(/\s+/).filter(Boolean);

    els.searchSuggestions.hidden = tokens.length > 0;
    if (!tokens.length) {
      els.searchResults.innerHTML = "";
      els.searchEmpty.hidden = true;
      els.searchStatus.textContent = "";
      return;
    }

    const results = searchIndex.filter(({ haystack }) => tokens.every((t) => haystack.includes(t))).map((r) => r.item);
    els.searchEmpty.hidden = results.length > 0;
    els.searchStatus.textContent = `${results.length} ${results.length === 1 ? "result" : "results"}`;

    els.searchResults.innerHTML = results
      .map(
        (item) => `
        <li class="flex items-center gap-2 rounded-2xl p-2 transition hover:bg-brand-bg" data-id="${item.id}">
          <button type="button" data-search-action="go" class="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left">
            <img src="${escapeHtml(item.image)}" alt="" data-fallback loading="lazy" class="h-14 w-14 shrink-0 rounded-xl object-cover bg-brand-bg">
            <span class="min-w-0">
              <span class="block truncate font-semibold text-slate-800">${escapeHtml(item.name)}</span>
              <span class="block truncate text-xs text-slate-500">${escapeHtml(item.category)}</span>
            </span>
            <span class="ml-auto shrink-0 pl-2 text-sm font-bold text-brand-purple">${formatPrice(item.price)}</span>
          </button>
          <button type="button" data-search-action="add" class="btn-primary btn-sm shrink-0" aria-label="Add ${escapeHtml(item.name)} to cart">
            <i data-lucide="plus" class="h-4 w-4"></i><span class="hidden sm:inline">Add</span>
          </button>
        </li>`
      )
      .join("");
    refreshIcons();
  };

  const goToDish = (id) => {
    const item = getMenuItem(id);
    if (!item) return;
    searchOverlay.close();
    if (state.category !== "All" && state.category !== item.category) setCategory(item.category, { scroll: "none" });

    const card = $(`dish-${id}`);
    if (!card) return;
    scrollToElement(card, 16);
    card.classList.remove("is-highlighted");
    void card.offsetWidth;
    card.classList.add("is-highlighted");
    setTimeout(() => card.querySelector('[data-action="add"]')?.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 500);
  };

  const onSearchClick = (event) => {
    const suggestion = event.target.closest("[data-suggestion]");
    if (suggestion) {
      els.searchInput.value = suggestion.dataset.suggestion;
      runSearch();
      els.searchInput.focus();
      return;
    }
    const button = event.target.closest("[data-search-action]");
    if (!button) return;
    const id = Number(button.closest("[data-id]").dataset.id);
    if (button.dataset.searchAction === "go") goToDish(id);
    if (button.dataset.searchAction === "add") addToCart(id, 1);
  };

  /* ======================= Header / global ======================= */

  const renderCartBadge = () => {
    const count = CartManager.count();
    const previous = Number(els.cartBadge.dataset.count || 0);
    els.cartBadge.textContent = count > 99 ? "99+" : count;
    els.cartBadge.dataset.count = count;
    els.cartBadge.hidden = count === 0;
    els.cartTotalHeader.textContent = formatPrice(CartManager.subtotal());
    els.cartButton.setAttribute("aria-label", `Open cart, ${count} ${count === 1 ? "item" : "items"}`);

    if (count > previous) {
      els.cartBadge.classList.remove("bump");
      void els.cartBadge.offsetWidth;
      els.cartBadge.classList.add("bump");
    }
  };

  const onCartChange = (change) => {
    renderCartBadge();
    els.locationSelect.value = CartManager.getOrderType();
    if (change.id) updateCardCartState(change.id);
    else menuData.forEach((item) => updateCardCartState(item.id));
  };

  const onDocumentClick = (event) => {
    const trigger = event.target.closest("[data-open-cart], [data-open-search], [data-open-wishlist], [data-add-to-cart], [data-filter-category], [data-scroll-top]");
    if (!trigger) return;

    if (trigger.hasAttribute("data-open-cart")) {
      wishlistOverlay.close();
      CartDrawer.open();
    }
    else if (trigger.hasAttribute("data-open-search")) searchOverlay.open();
    else if (trigger.hasAttribute("data-open-wishlist")) wishlistOverlay.open();
    else if (trigger.hasAttribute("data-add-to-cart")) addToCart(Number(trigger.dataset.addToCart), 1, { openDrawer: true });
    else if (trigger.hasAttribute("data-filter-category")) {
      event.preventDefault();
      setCategory(trigger.dataset.filterCategory, { scroll: "always" });
    } else if (trigger.hasAttribute("data-scroll-top")) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
    }
  };

  const onKeydown = (event) => {
    const typing = event.target.closest("input, textarea, select, [contenteditable]");
    const shortcut = (event.key === "/" && !typing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey));
    if (shortcut && !searchOverlay.isOpen) {
      event.preventDefault();
      searchOverlay.open();
    }
  };

  const onScroll = (() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      els.backToTop.classList.toggle("is-visible", window.scrollY > 600);
      const barTop = els.categoryBar.getBoundingClientRect().top;
      els.categoryBar.classList.toggle("is-stuck", barTop <= els.header.offsetHeight + 0.5);
    };
    return () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
  })();

  /** Open 11:00 AM – 12:30 AM (next day), evaluated in Pakistan time. */
  const renderOpenStatus = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const part = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    const minutes = part("hour") * 60 + part("minute");
    const open = minutes >= 11 * 60 || minutes < 30;

    document.querySelectorAll("[data-open-status]").forEach((el) => {
      el.classList.toggle("is-open", open);
      el.querySelector("[data-open-status-text]").textContent = open ? "Open now" : "Closed · Opens 11:00 AM";
    });
  };

  /* ======================= Init ======================= */

  const init = () => {
    Object.assign(els, {
      header: $("siteHeader"),
      categoryBar: $("categoryBar"),
      categoryTabs: $("categoryTabs"),
      menuSection: $("menu"),
      menuGrid: $("menuGrid"),
      menuCount: $("menuCount"),
      cartButton: $("cartButton"),
      cartBadge: $("cartBadge"),
      cartTotalHeader: $("cartTotalHeader"),
      wishlistBadge: $("wishlistBadge"),
      wishlistDrawer: $("wishlistDrawer"),
      wishlistList: $("wishlistList"),
      wishlistEmpty: $("wishlistEmpty"),
      wishlistCountLabel: $("wishlistCountLabel"),
      searchModal: $("searchModal"),
      searchInput: $("searchInput"),
      searchResults: $("searchResults"),
      searchEmpty: $("searchEmpty"),
      searchStatus: $("searchStatus"),
      searchSuggestions: $("searchSuggestions"),
      locationSelect: $("locationSelect"),
      backToTop: $("backToTop"),
    });

    syncHeaderHeight();
    if ("ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(els.header);
    else window.addEventListener("resize", syncHeaderHeight);

    wishlistOverlay = Overlay.create(els.wishlistDrawer, { initialFocus: ".drawer-close" });
    searchOverlay = Overlay.create(els.searchModal, {
      initialFocus: "#searchInput",
      onOpen: () => {
        els.searchInput.select();
        runSearch();
      },
    });

    renderCategoryTabs();
    renderMenu();
    renderWishlist();
    renderCartBadge();

    els.locationSelect.value = CartManager.getOrderType();
    els.locationSelect.addEventListener("change", () => {
      CartManager.setOrderType(els.locationSelect.value);
      Toast.show(
        els.locationSelect.value === "pickup" ? "Self pick-up selected — no delivery fee" : "Home delivery selected",
        { icon: els.locationSelect.value === "pickup" ? "store" : "bike" }
      );
    });

    els.categoryTabs.addEventListener("click", (event) => {
      const tab = event.target.closest(".category-tab");
      if (tab) setCategory(tab.dataset.category);
    });
    els.menuGrid.addEventListener("click", onGridClick);
    els.wishlistList.addEventListener("click", onWishlistClick);
    els.searchModal.addEventListener("click", onSearchClick);
    els.searchInput.addEventListener("input", runSearch);
    els.searchModal.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const first = els.searchResults.querySelector("[data-id]");
      if (first) goToDish(Number(first.dataset.id));
    });

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    CartManager.subscribe(onCartChange);

    renderOpenStatus();
    setInterval(renderOpenStatus, 60 * 1000);

    document.querySelectorAll("[data-current-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
    refreshIcons();
  };

  return { init, setCategory };
})();

document.addEventListener("DOMContentLoaded", App.init);
