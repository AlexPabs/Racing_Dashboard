const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';

const App = {
  products: [],
  cart: [],
  activeFilter: 'Alle',

  async init() {
    await this.loadProducts();
    this.renderProducts();
    this.setupFilters();
    this.setupCart();
    this.setupMobileMenu();
    this.setupModal();
    this.loadCart();
    this.updateCartCount();
  },

  async loadProducts() {
    try {
      const res = await fetch('data/products.json');
      this.products = await res.json();
    } catch {
      this.products = [];
      console.error('Kunne ikke laste produkter');
    }
  },

  getCategories() {
    const cats = [...new Set(this.products.map(p => p.category))];
    return ['Alle', ...cats.sort()];
  },

  // ---- FILTERS ----
  setupFilters() {
    const container = document.getElementById('filters');
    if (!container) return;
    const categories = this.getCategories();
    container.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat === 'Alle' ? 'active' : ''}" data-category="${cat}">
        ${cat}
      </button>
    `).join('');

    container.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeFilter = btn.dataset.category;
      this.renderProducts();
    });
  },

  // ---- PRODUCTS ----
  renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const filtered = this.activeFilter === 'Alle'
      ? this.products
      : this.products.filter(p => p.category === this.activeFilter);

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-light);">
          <p>Ingen produkter i denne kategorien.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(product => this.productCard(product)).join('');
  },

  productCard(p) {
    const stockClass = p.stock === 0 ? 'out-of-stock' : p.stock <= 1 ? 'low-stock' : 'in-stock';
    const stockText = p.stock === 0 ? 'Utsolgt' : p.stock <= 1 ? `${p.stock} på lager` : `${p.stock} på lager`;

    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-image" onclick="App.openModal('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
            <path d="M13 6h5l2 4v5h-2m-4 0H9m-4 0H3v-5l2-4h3m5 0V3M6 10h12"/>
          </svg>
          <span class="stock-badge ${stockClass}">${stockText}</span>
          <span class="condition-badge">${p.condition}</span>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <span class="product-fits">${p.fits}</span>
          <p class="product-desc">${p.description}</p>
          <div class="product-footer">
            <span class="product-price">${this.formatPrice(p.price)} <small>NOK</small></span>
            ${p.stock > 0
              ? `<button class="btn btn-primary btn-sm" onclick="App.addToCart('${p.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                  Legg i kurv
                </button>`
              : `<button class="btn btn-sm" disabled>Utsolgt</button>`
            }
          </div>
        </div>
      </div>`;
  },

  // ---- MODAL ----
  setupModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  openModal(id) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    const stockClass = p.stock === 0 ? 'out-of-stock' : p.stock <= 1 ? 'low-stock' : 'in-stock';
    const stockText = p.stock === 0 ? 'Utsolgt' : `${p.stock} på lager`;

    modal.innerHTML = `
      <div class="modal-image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
          <path d="M13 6h5l2 4v5h-2m-4 0H9m-4 0H3v-5l2-4h3m5 0V3M6 10h12"/>
        </svg>
        <button class="modal-close" onclick="App.closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <span class="product-category">${p.category}</span>
        <h2 class="product-name">${p.name}</h2>
        <div class="detail-row">
          <span class="detail-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M13 6h5l2 4v5h-2m-4 0H9"/></svg>
            ${p.fits}
          </span>
          <span class="detail-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ${p.condition}
          </span>
          <span class="detail-tag stock-badge ${stockClass}" style="position:static">
            ${stockText}
          </span>
        </div>
        <p class="product-desc">${p.description}</p>
        <div class="modal-footer">
          <span class="product-price">${this.formatPrice(p.price)} <small>NOK</small></span>
          ${p.stock > 0
            ? `<button class="btn btn-primary" onclick="App.addToCart('${p.id}'); App.closeModal();">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                Legg i kurv
              </button>`
            : `<button class="btn" disabled>Utsolgt</button>`
          }
        </div>
      </div>`;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // ---- CART ----
  setupCart() {
    const cartBtn = document.getElementById('cart-btn');
    const closeBtn = document.getElementById('cart-close');
    const backdrop = document.getElementById('cart-backdrop');

    if (cartBtn) cartBtn.addEventListener('click', e => { e.preventDefault(); this.openCart(); });
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCart());
    if (backdrop) backdrop.addEventListener('click', () => this.closeCart());
  },

  openCart() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    this.renderCart();
  },

  closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  },

  loadCart() {
    try {
      this.cart = JSON.parse(localStorage.getItem('bobletoppen_cart')) || [];
    } catch {
      this.cart = [];
    }
  },

  saveCart() {
    localStorage.setItem('bobletoppen_cart', JSON.stringify(this.cart));
    this.updateCartCount();
  },

  addToCart(id) {
    const product = this.products.find(p => p.id === id);
    if (!product || product.stock === 0) return;

    const existing = this.cart.find(item => item.id === id);
    if (existing) {
      this.showToast('Denne delen er allerede i kurven');
      return;
    }

    this.cart.push({ id: product.id, name: product.name, price: product.price });
    this.saveCart();
    this.showToast(`${product.name} lagt i kurven`);
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.saveCart();
    this.renderCart();
  },

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  },

  updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = this.cart.length;
      badge.dataset.count = this.cart.length;
    }
  },

  renderCart() {
    const container = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          <p>Handlekurven er tom</p>
        </div>`;
      footer.style.display = 'none';
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
            <path d="M13 6h5l2 4v5h-2m-4 0H9m-4 0H3v-5l2-4h3"/>
          </svg>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${this.formatPrice(item.price)} NOK</div>
        </div>
        <button class="cart-item-remove" onclick="App.removeFromCart('${item.id}')">Fjern</button>
      </div>
    `).join('');

    footer.style.display = 'block';
    document.getElementById('cart-total-amount').textContent = `${this.formatPrice(this.getCartTotal())} NOK`;

    this.renderPayPalButton();
  },

  renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.innerHTML = '';

    if (typeof paypal === 'undefined') {
      container.innerHTML = `
        <a href="https://www.paypal.com" target="_blank" class="btn btn-primary btn-lg" style="width:100%; justify-content:center; background:#0070ba;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z"/>
          </svg>
          Betal med PayPal
        </a>
        <p class="cart-note">PayPal-betaling åpnes i nytt vindu</p>`;
      return;
    }

    paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: 'Bobletoppen AS - VW Deler',
            amount: {
              currency_code: 'NOK',
              value: this.getCartTotal().toFixed(2),
              breakdown: {
                item_total: { currency_code: 'NOK', value: this.getCartTotal().toFixed(2) }
              }
            },
            items: this.cart.map(item => ({
              name: item.name,
              unit_amount: { currency_code: 'NOK', value: item.price.toFixed(2) },
              quantity: '1'
            }))
          }]
        });
      },
      onApprove: (data, actions) => {
        return actions.order.capture().then(details => {
          this.cart = [];
          this.saveCart();
          this.closeCart();
          this.showToast('Betaling godkjent! Vi kontakter deg om henting.');
        });
      },
      onError: () => {
        this.showToast('Noe gikk galt med betalingen. Prøv igjen.');
      }
    }).render('#paypal-button-container');
  },

  // ---- MOBILE MENU ----
  setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  },

  // ---- UTILS ----
  formatPrice(n) {
    return n.toLocaleString('nb-NO');
  },

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
