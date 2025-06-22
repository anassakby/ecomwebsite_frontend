// Shopping Cart Management
class ShoppingCart {
    constructor() {
        this.items = this.loadFromStorage();
        this.init();
    }

    init() {
        this.updateCartDisplay();
        this.bindEvents();
    }

    bindEvents() {
        // Listen for cart updates
        document.addEventListener('cartUpdated', () => {
            this.updateCartDisplay();
            this.saveToStorage();
        });
    }

    addToCart(id, title, price, image) {
        const existingItem = this.items.find(item => item.id === id);
        const isFirstProduct = this.items.length === 0 && !existingItem;
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id,
                title,
                price: parseFloat(price),
                image,
                quantity: 1
            });
        }
        
        this.triggerCartUpdate();
        
        // Show celebration for first product
        if (isFirstProduct) {
            this.showFirstProductCelebration();
        } else {
            this.showAddToCartAnimation();
        }
    }

    removeFromCart(id) {
        const index = this.items.findIndex(item => item.id === parseInt(id));
        if (index > -1) {
            const item = this.items[index];
            this.items.splice(index, 1);
            this.triggerCartUpdate();
            
            if (window.app) {
                window.app.showToast(`${item.title} removed from cart`, 'info');
            }
        }
    }

    updateQuantity(id, quantity) {
        const item = this.items.find(item => item.id === parseInt(id));
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(id);
            } else {
                item.quantity = parseInt(quantity);
                this.triggerCartUpdate();
            }
        }
    }

    getItems() {
        return this.items;
    }

    getTotalPrice() {
        return this.items.reduce((total, item) => total + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    }

    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    clearCart() {
        this.items = [];
        this.triggerCartUpdate();
    }

    triggerCartUpdate() {
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Update main app UI if available
        if (window.app) {
            window.app.updateCartUI();
        }
    }

    showAddToCartAnimation() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('shake-animation');
            setTimeout(() => {
                cartBtn.classList.remove('shake-animation');
            }, 500);
        }
    }

    showFirstProductCelebration() {
        const celebrationModal = new bootstrap.Modal(document.getElementById('celebrationModal'));
        celebrationModal.show();
        
        // Add celebration animation to cart button
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('cart-celebration');
            setTimeout(() => {
                cartBtn.classList.remove('cart-celebration');
            }, 2000);
        }
    }

    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartTotal();
        this.updateCheckoutButton();
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.getTotalItems();
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        
        if (!cartItemsContainer || !cartEmpty) return;
        
        if (this.items.length === 0) {
            cartItemsContainer.style.display = 'none';
            cartEmpty.style.display = 'block';
            return;
        }
        
        cartItemsContainer.style.display = 'block';
        cartEmpty.style.display = 'none';
        
        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item animate-slide-right">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image me-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.title}</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary fw-bold">$${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                            <div class="quantity-controls">
                                <button class="btn btn-sm btn-outline-secondary quantity-btn" 
                                        onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="mx-2 fw-bold">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary quantity-btn" 
                                        onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <small class="text-muted">$${parseFloat(item.price).toFixed(2)} each</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2" 
                            onclick="cart.removeFromCart(${item.id})"
                            title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            const total = this.getTotalPrice();
            cartTotal.textContent = total.toFixed(2);
        }
        
        // Also update checkout total if modal is open
        const checkoutTotal = document.getElementById('checkoutTotal');
        if (checkoutTotal) {
            const total = this.getTotalPrice();
            checkoutTotal.textContent = total.toFixed(2);
        }
    }

    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            const hasItems = this.items.length > 0;
            checkoutBtn.disabled = !hasItems;
            
            if (hasItems) {
                checkoutBtn.innerHTML = `
                    <i class="fas fa-credit-card me-2"></i>
                    Checkout ($${this.getTotalPrice().toFixed(2)})
                `;
            } else {
                checkoutBtn.innerHTML = `
                    <i class="fas fa-credit-card me-2"></i>
                    Checkout
                `;
            }
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('ecommerce_cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('ecommerce_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    }

    // Export cart data for potential integration
    exportCart() {
        return {
            items: this.items,
            total: this.getTotalPrice(),
            itemCount: this.getTotalItems(),
            timestamp: new Date().toISOString()
        };
    }

    // Import cart data
    importCart(cartData) {
        if (cartData && Array.isArray(cartData.items)) {
            this.items = cartData.items;
            this.triggerCartUpdate();
            
            if (window.app) {
                window.app.showToast('Cart imported successfully', 'success');
            }
        }
    }

    // Get cart summary for checkout
    getCheckoutSummary() {
        return {
            items: this.items.map(item => ({
                productId: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            totalItems: this.getTotalItems(),
            subtotal: this.getTotalPrice(),
            tax: this.getTotalPrice() * 0.1, // 10% tax
            shipping: this.getTotalPrice() > 50 ? 0 : 9.99, // Free shipping over $50
            total: this.getTotalPrice() + (this.getTotalPrice() * 0.1) + (this.getTotalPrice() > 50 ? 0 : 9.99)
        };
    }

    // Apply discount code
    applyDiscount(discountCode) {
        const discounts = {
            'SAVE10': 0.1,
            'WELCOME20': 0.2,
            'NEWUSER': 0.15
        };
        
        const discount = discounts[discountCode.toUpperCase()];
        if (discount) {
            this.discount = discount;
            this.discountCode = discountCode;
            this.triggerCartUpdate();
            
            if (window.app) {
                window.app.showToast(`Discount applied: ${(discount * 100).toFixed(0)}% off!`, 'success');
            }
            return true;
        } else {
            if (window.app) {
                window.app.showToast('Invalid discount code', 'error');
            }
            return false;
        }
    }

    // Remove discount
    removeDiscount() {
        this.discount = 0;
        this.discountCode = null;
        this.triggerCartUpdate();
        
        if (window.app) {
            window.app.showToast('Discount removed', 'info');
        }
    }

    // Get discounted total
    getDiscountedTotal() {
        const subtotal = this.getTotalPrice();
        const discountAmount = subtotal * (this.discount || 0);
        return subtotal - discountAmount;
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}
