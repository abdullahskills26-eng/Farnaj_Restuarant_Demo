/**
 * Cart state (persisted, synced across tabs), slide-over cart drawer
 * and "Order via WhatsApp" checkout.
 */

/* ======================= State ======================= */

const CartManager = (() => {
  const CART_KEY = "farnaj.cart.v1";
  const ORDER_TYPE_KEY = "farnaj.orderType.v1";
  const MAX_QTY = 50;
  const listeners = new Set();

  const sanitize = (raw) =>
    (Array.isArray(raw) ? raw : [])
      .filter((line) => line && getMenuItem(line.id) && Number.isInteger(line.qty) && line.qty > 0)
      .map((line) => ({ id: Number(line.id), qty: Math.min(line.qty, MAX_QTY) }));

  const loadOrderType = () => (SafeStorage.get(ORDER_TYPE_KEY, "delivery") === "pickup" ? "pickup" : "delivery");

  let lines = sanitize(SafeStorage.get(CART_KEY, []));
  let orderType = loadOrderType();

  const notify = (change = {}) => {
    SafeStorage.set(CART_KEY, lines);
    SafeStorage.set(ORDER_TYPE_KEY, orderType);
    listeners.forEach((fn) => fn(change));
  };

  // Keep multiple open tabs in sync
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_KEY && event.key !== ORDER_TYPE_KEY) return;
    lines = sanitize(SafeStorage.get(CART_KEY, []));
    orderType = loadOrderType();
    listeners.forEach((fn) => fn({ external: true }));
  });

  const getQty = (id) => lines.find((line) => line.id === Number(id))?.qty ?? 0;

  const setQty = (id, qty) => {
    id = Number(id);
    if (!getMenuItem(id)) return;
    const next = Math.max(0, Math.min(Math.floor(qty) || 0, MAX_QTY));
    const existing = lines.find((line) => line.id === id);

    if (next === 0) lines = lines.filter((line) => line.id !== id);
    else if (existing) existing.qty = next;
    else lines.push({ id, qty: next });

    notify({ id });
  };

  const subtotal = () => lines.reduce((sum, line) => sum + getMenuItem(line.id).price * line.qty, 0);
  const deliveryFee = () => (lines.length === 0 || orderType === "pickup" ? 0 : SITE_CONFIG.deliveryFee);

  return {
    MAX_QTY,
    getQty,
    setQty,
    add: (id, qty = 1) => setQty(id, getQty(id) + qty),
    remove: (id) => setQty(id, 0),
    clear: () => {
      lines = [];
      notify();
    },
    getLines: () =>
      lines.map((line) => {
        const item = getMenuItem(line.id);
        return { item, qty: line.qty, total: item.price * line.qty };
      }),
    count: () => lines.reduce((sum, line) => sum + line.qty, 0),
    subtotal,
    deliveryFee,
    total: () => subtotal() + deliveryFee(),
    getOrderType: () => orderType,
    setOrderType: (type) => {
      orderType = type === "pickup" ? "pickup" : "delivery";
      notify({ orderType });
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();

/* ======================= Drawer UI ======================= */

const CartDrawer = (() => {
  const CUSTOMER_KEY = "farnaj.customer.v1";
  let overlay;
  const els = {};

  const $ = (id) => document.getElementById(id);

  const init = () => {
    const root = $("cartDrawer");
    if (!root) return;

    overlay = Overlay.create(root, { initialFocus: ".drawer-close" });

    Object.assign(els, {
      count: $("cartCountLabel"),
      empty: $("cartEmpty"),
      filled: $("cartFilled"),
      list: $("cartList"),
      subtotal: $("cartSubtotal"),
      delivery: $("cartDelivery"),
      total: $("cartTotal"),
      checkout: $("checkoutBtn"),
      clear: $("clearCartBtn"),
      form: $("checkoutForm"),
      addressGroup: $("addressGroup"),
      orderTypeButtons: root.querySelectorAll("[data-order-type]"),
    });

    restoreCustomer();

    els.list.addEventListener("click", onListClick);
    els.clear.addEventListener("click", () => {
      CartManager.clear();
      Toast.show("Your cart has been cleared", { icon: "trash-2", tone: "neutral" });
    });
    els.orderTypeButtons.forEach((btn) =>
      btn.addEventListener("click", () => CartManager.setOrderType(btn.dataset.orderType))
    );
    els.form.addEventListener("submit", (event) => {
      event.preventDefault();
      checkout();
    });
    els.form.addEventListener("input", (event) => {
      clearFieldError(event.target);
      saveCustomer();
    });

    CartManager.subscribe(render);
    render();
  };

  /* ---------- Rendering ---------- */

  const lineTemplate = ({ item, qty, total }) => `
    <li class="cart-line flex gap-3 py-4" data-id="${item.id}">
      <img src="${escapeHtml(item.image)}" alt="" data-fallback loading="lazy"
           class="h-16 w-16 shrink-0 rounded-xl object-cover bg-brand-bg">
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-semibold leading-snug text-slate-800">${escapeHtml(item.name)}</p>
          <button type="button" data-cart-action="remove" class="icon-btn -mr-1 -mt-1 h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-brand-pink"
                  aria-label="Remove ${escapeHtml(item.name)}">
            <i data-lucide="trash-2" class="h-4 w-4"></i>
          </button>
        </div>
        <p class="text-xs text-slate-500">${formatPrice(item.price)} each</p>
        <div class="mt-2 flex items-center justify-between">
          <div class="stepper stepper--sm" role="group" aria-label="Quantity for ${escapeHtml(item.name)}">
            <button type="button" data-cart-action="dec" aria-label="Decrease quantity"><i data-lucide="minus" class="h-3.5 w-3.5"></i></button>
            <span aria-live="polite">${qty}</span>
            <button type="button" data-cart-action="inc" aria-label="Increase quantity" ${qty >= CartManager.MAX_QTY ? "disabled" : ""}><i data-lucide="plus" class="h-3.5 w-3.5"></i></button>
          </div>
          <span class="text-sm font-bold text-brand-purple">${formatPrice(total)}</span>
        </div>
      </div>
    </li>`;

  const render = () => {
    if (!els.list) return;

    // Remember focused control so re-rendering doesn't drop keyboard focus
    const active = document.activeElement;
    const focusedId = els.list.contains(active) ? active.closest("[data-id]")?.dataset.id : null;
    const focusedAction = focusedId ? active.dataset.cartAction : null;

    const lines = CartManager.getLines();
    const count = CartManager.count();
    const isPickup = CartManager.getOrderType() === "pickup";

    els.count.textContent = `${count} ${count === 1 ? "item" : "items"}`;
    els.empty.hidden = lines.length > 0;
    els.filled.hidden = lines.length === 0;
    els.list.innerHTML = lines.map(lineTemplate).join("");

    els.subtotal.textContent = formatPrice(CartManager.subtotal());
    els.delivery.textContent = isPickup ? "Free (Pick-up)" : formatPrice(SITE_CONFIG.deliveryFee);
    els.total.textContent = formatPrice(CartManager.total());
    els.checkout.disabled = lines.length === 0;

    els.orderTypeButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.orderType === CartManager.getOrderType())));
    els.addressGroup.hidden = isPickup;

    refreshIcons();

    if (focusedId) {
      const target =
        els.list.querySelector(`[data-id="${focusedId}"] [data-cart-action="${focusedAction}"]:not([disabled])`) ||
        els.list.querySelector(`[data-id="${focusedId}"] [data-cart-action="dec"]`) ||
        overlay.root.querySelector(".drawer-close");
      target?.focus({ preventScroll: true });
    }
  };

  const onListClick = (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const id = Number(button.closest("[data-id]").dataset.id);
    const action = button.dataset.cartAction;

    if (action === "inc") CartManager.add(id, 1);
    if (action === "dec") CartManager.add(id, -1);
    if (action === "remove") {
      const name = getMenuItem(id).name;
      CartManager.remove(id);
      Toast.show(`${name} removed`, { icon: "trash-2", tone: "neutral" });
    }
  };

  /* ---------- Customer details ---------- */

  const fields = () => ({
    name: els.form.elements.customerName,
    phone: els.form.elements.customerPhone,
    address: els.form.elements.customerAddress,
    notes: els.form.elements.customerNotes,
  });

  const saveCustomer = () => {
    const f = fields();
    SafeStorage.set(CUSTOMER_KEY, { name: f.name.value, phone: f.phone.value, address: f.address.value });
  };

  const restoreCustomer = () => {
    const saved = SafeStorage.get(CUSTOMER_KEY, {});
    const f = fields();
    if (typeof saved.name === "string") f.name.value = saved.name;
    if (typeof saved.phone === "string") f.phone.value = saved.phone;
    if (typeof saved.address === "string") f.address.value = saved.address;
  };

  const setFieldError = (field, message) => {
    field.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${field.id}Error`);
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  };

  const clearFieldError = (field) => {
    if (!field?.id) return;
    field.removeAttribute("aria-invalid");
    const error = document.getElementById(`${field.id}Error`);
    if (error) error.hidden = true;
  };

  const validate = () => {
    const f = fields();
    const invalid = [];
    Object.values(f).forEach(clearFieldError);

    if (f.name.value.trim().length < 2) {
      setFieldError(f.name, "Please enter your name.");
      invalid.push(f.name);
    }
    const digits = f.phone.value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      setFieldError(f.phone, "Please enter a valid phone number, e.g. 0300-1234567.");
      invalid.push(f.phone);
    }
    if (CartManager.getOrderType() === "delivery" && f.address.value.trim().length < 8) {
      setFieldError(f.address, "Please enter your complete delivery address.");
      invalid.push(f.address);
    }

    invalid[0]?.focus();
    return invalid.length === 0;
  };

  /* ---------- Checkout ---------- */

  const buildWhatsAppMessage = () => {
    const f = fields();
    const isPickup = CartManager.getOrderType() === "pickup";
    const itemLines = CartManager.getLines().map(
      ({ item, qty, total }, i) => `${i + 1}. ${item.name} x ${qty} = ${formatPrice(total)}`
    );

    return [
      `*New Order - ${SITE_CONFIG.brand}*`,
      `Order Type: ${isPickup ? "Self Pick-up (Chour Chowk Branch)" : "Home Delivery"}`,
      "",
      "*Items:*",
      ...itemLines,
      "",
      `Subtotal: ${formatPrice(CartManager.subtotal())}`,
      `Delivery Fee: ${isPickup ? "Free (Pick-up)" : formatPrice(SITE_CONFIG.deliveryFee)}`,
      `*Grand Total: ${formatPrice(CartManager.total())}*`,
      "",
      "*Customer Details:*",
      `Name: ${f.name.value.trim()}`,
      `Phone: ${f.phone.value.trim()}`,
      ...(isPickup ? [] : [`Delivery Address: ${f.address.value.trim()}`]),
      ...(f.notes.value.trim() ? [`Notes: ${f.notes.value.trim()}`] : []),
    ].join("\n");
  };

  const checkout = () => {
    if (CartManager.count() === 0) return;
    if (!validate()) {
      Toast.show("Please complete your details to place the order", { icon: "circle-alert", tone: "error" });
      return;
    }
    saveCustomer();
    const url = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, "_blank", "noopener");
    Toast.show("Opening WhatsApp — just press send to confirm your order!", { icon: "message-circle" });
  };

  return {
    init,
    open: () => overlay?.open(),
    close: () => overlay?.close(),
  };
})();

document.addEventListener("DOMContentLoaded", CartDrawer.init);
