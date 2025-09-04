/***************
 * DATA
 ***************/
const PRODUCTS = [
  { id: 'p1', name: 'Paracetamol 500mg', cat: 'OTC', price: 3.99, desc: 'Effective pain and fever relief', icon: '💊' },
  { id: 'p2', name: 'Vitamin C 1000mg', cat: 'Wellness', price: 8.99, desc: 'Boosts immune system function', icon: '🍊' },
  { id: 'p3', name: 'Digital Thermometer', cat: 'Devices', price: 12.99, desc: 'Fast and accurate temperature reading', icon: '🌡️' },
  { id: 'p4', name: 'Blood Pressure Monitor', cat: 'Devices', price: 45.99, desc: 'Professional home blood pressure tracking', icon: '❤️' },
  { id: 'p5', name: 'Omega-3 Fish Oil', cat: 'Supplements', price: 15.99, desc: 'Supports heart and brain health', icon: '🐟' },
  { id: 'p6', name: 'Hand Sanitizer', cat: 'Hygiene', price: 5.99, desc: 'Kills 99.9% of germs without water', icon: '🧴' }
];

const COUPONS = { MED10: 10, WELCOME5: 5 };
let appliedCoupon = localStorage.getItem('medicalplus_coupon') || '';

/***************
 * HELPERS
 ***************/
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => `$${n.toFixed(2)}`;

/***************
 * CART FUNCTIONALITY
 ***************/
let cart = JSON.parse(localStorage.getItem('medicalplus_cart')) || [];

const updateCartCount = () => {
  const cartCount = $('#cartCount') || document.createElement('span');
  cartCount.id = 'cartCount';
  cartCount.className = 'cart-count';
  cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
  
  const cartIcon = $('.cart-icon');
  if (cartIcon && !cartIcon.contains(cartCount)) {
    cartIcon.appendChild(cartCount);
  }
};

const addToCart = (productId) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      icon: product.icon
    });
  }
  
  localStorage.setItem('medicalplus_cart', JSON.stringify(cart));
  updateCartCount();
  showNotification(`${product.name} added to cart!`);
  renderCart();
};

const removeFromCart = (productId) => {
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('medicalplus_cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
};

const updateQuantity = (productId, delta) => {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  localStorage.setItem('medicalplus_cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
};

const computeTotals = () => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon && COUPONS[appliedCoupon.toUpperCase()] ? (subtotal * COUPONS[appliedCoupon.toUpperCase()] / 100) : 0;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
};

/***************
 * UI UPDATES
 ***************/
const renderFeaturedProducts = () => {
  const productsContainer = $('#featuredProducts');
  if (!productsContainer) return;
  
  productsContainer.innerHTML = PRODUCTS.map(product => `
    <div class="product-card">
      <div class="product-img">${product.icon}</div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <span class="price">${fmt(product.price)}</span>
        <button class="add-to-cart" onclick="addToCart('${product.id}')">
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
};

const renderCart = () => {
  const itemsRoot = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  const couponInput = document.getElementById('couponInput');
  if (couponInput) couponInput.value = appliedCoupon || '';
  if (!itemsRoot || !subtotalEl || !totalEl) return;

  if (cart.length === 0) {
    itemsRoot.innerHTML = `
      <div class="card" style="text-align:center; padding:30px;">
        <i class="fas fa-bag-shopping" style="font-size:2rem;color:var(--primary);"></i>
        <p style="margin-top:10px;color:var(--muted);">Your cart is empty. Explore products to add items.</p>
      </div>
    `;
  } else {
    itemsRoot.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item__icon">${item.icon || '🛒'}</div>
        <div>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">${fmt(item.price)}</div>
          <div class="qty" aria-label="Quantity selector">
            <button onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity('${item.id}', 1)" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <div>
          <button class="btn ghost" onclick="removeFromCart('${item.id}')" aria-label="Remove item"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  const { subtotal, total } = computeTotals();
  subtotalEl.textContent = fmt(subtotal);
  totalEl.textContent = fmt(total);
};

const openCart = () => {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('show');
  backdrop.setAttribute('aria-hidden', 'false');
  renderCart();
};

const closeCart = () => {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('show');
  backdrop.setAttribute('aria-hidden', 'true');
};

const showNotification = (message, type = 'success') => {
  // Remove any existing notification
  const existingNotification = $('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create new notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <p>${message}</p>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;
  
  // Add styles if not already added
  if (!$('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        background: var(--success);
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
      }
      .notification.error {
        background: var(--danger);
      }
      .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
      }
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
};

/***************
 * MOBILE NAVIGATION
 ***************/
const setupMobileNav = () => {
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      menuBtn.innerHTML = navLinks.classList.contains('open') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
    });
  }
};

/***************
 * SMOOTH SCROLLING
 ***************/
const setupSmoothScroll = () => {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = $(targetId);
      if (targetElement) {
        // Close mobile menu if open
        const navLinks = $('#navLinks');
        const menuBtn = $('#menuBtn');
        if (navLinks && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
        
        // Scroll to element
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
};

/***************
 * INITIALIZATION
 ***************/
document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  updateCartCount();
  setupMobileNav();
  setupSmoothScroll();
  setupCartUI();
  
  // Newsletter form submission
  const newsletterForm = $('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        showNotification('Thank you for subscribing to our newsletter!');
        emailInput.value = '';
      }
    });
  }
});
/***************
 * SCROLL TO TOP FUNCTIONALITY
 ***************/
const setupScrollToTop = () => {
  const scrollToTopBtn = $('#scrollToTopBtn');
  
  if (!scrollToTopBtn) return;
  
  // Show/hide button based on scroll position
  const toggleScrollToTopButton = () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Event listeners
  window.addEventListener('scroll', toggleScrollToTopButton);
  scrollToTopBtn.addEventListener('click', scrollToTop);
};

/***************
 * INITIALIZATION
 ***************/
document.addEventListener('DOMContentLoaded', () => {
  // Your existing initialization code
  renderFeaturedProducts();
  updateCartCount();
  setupMobileNav();
  setupSmoothScroll();
  setupCartUI();
  
  // Add scroll to top functionality
  setupScrollToTop();
  
  // Newsletter form submission
  const newsletterForm = $('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        showNotification('Thank you for subscribing to our newsletter!');
        emailInput.value = '';
      }
    });
  }
});

/***************
 * CART UI SETUP AND FAQ/CONTACT LOGIC
 ***************/
const setupCartUI = () => {
  const cartIconLink = document.querySelector('.cart-icon a');
  const closeBtn = document.getElementById('cartCloseBtn');
  const backdrop = document.getElementById('cartBackdrop');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponInput = document.getElementById('couponInput');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cartIconLink) {
    cartIconLink.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (backdrop) backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = (couponInput.value || '').trim().toUpperCase();
      if (COUPONS[code]) {
        appliedCoupon = code;
        localStorage.setItem('medicalplus_coupon', appliedCoupon);
        showNotification(`Coupon ${code} applied!`);
        renderCart();
      } else if (code === '') {
        appliedCoupon = '';
        localStorage.removeItem('medicalplus_coupon');
        showNotification('Coupon cleared');
        renderCart();
      } else {
        showNotification('Invalid coupon code', 'error');
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
      }
      const { total } = computeTotals();
      showNotification(`Checkout successful! Paid ${fmt(total)}.`);
      cart = [];
      localStorage.setItem('medicalplus_cart', JSON.stringify(cart));
      updateCartCount();
      renderCart();
      closeCart();
    });
  }

  // FAQ accordion
  $$('.faq-item .faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  // Contact form validation
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      const valid = name.value.trim().length >= 2 && /.+@.+\..+/.test(email.value) && message.value.trim().length >= 10;
      if (!valid) {
        showNotification('Please complete the form correctly.', 'error');
        return;
      }
      showNotification('Thanks! We\'ll get back to you soon.');
      name.value = '';
      email.value = '';
      message.value = '';
    });
  }
};