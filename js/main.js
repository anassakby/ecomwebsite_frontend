// Main application initialization and utilities
class ECommerceApp {
    constructor() {
        this.isLoading = false;
        this.currentPage = 1;
        this.productsPerPage = 20;
        this.totalProducts = 0;
        this.currentFilters = {
            category: '',
            search: '',
            sort: '',
            minPrice: '',
            maxPrice: '',
            rating: []
        };
        
        this.init();
    }

    async init() {
        this.initTheme();
        
        // Initialize language system if available
        if (typeof languageManager !== 'undefined') {
            languageManager.init();
        }
        
        this.initEventListeners();
        this.initAnimations();
        this.initCheckoutModal();
        await this.loadCategories();
        await this.loadProducts();
        this.updateCartUI();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    initEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.loadProducts();
            }, 500);
        });

        // Sort
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // Price filter
        document.getElementById('applyPriceFilter').addEventListener('click', () => {
            this.currentFilters.minPrice = document.getElementById('minPrice').value;
            this.currentFilters.maxPrice = document.getElementById('maxPrice').value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // Rating filter
        document.querySelectorAll('#ratingFilter input').forEach(input => {
            input.addEventListener('change', () => {
                this.updateRatingFilter();
            });
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Checkout - Remove direct event listener since it's handled by modal attribute

        // Smooth scrolling
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    initAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    async loadCategories() {
        try {
            const response = await fetch('https://dummyjson.com/products/categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categories = await response.json();
            
            const container = document.getElementById('categoriesFilter');
            container.innerHTML = '';
            
            // Add "All" category first
            const allCategory = document.createElement('div');
            allCategory.className = 'category-item active';
            allCategory.textContent = 'All Products';
            allCategory.addEventListener('click', () => {
                this.selectCategory('', allCategory);
            });
            container.appendChild(allCategory);
            
            categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item';
                // Handle both string and object category formats
                const categoryName = typeof category === 'string' ? category : category.name || category.slug;
                const displayName = this.capitalizeWords(categoryName.replace(/-/g, ' '));
                categoryElement.textContent = displayName;
                categoryElement.addEventListener('click', () => {
                    this.selectCategory(categoryName, categoryElement);
                });
                container.appendChild(categoryElement);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            // Create fallback categories if API fails
            this.createFallbackCategories();
        }
    }

    createFallbackCategories() {
        const fallbackCategories = [
            'All Products', 'smartphones', 'laptops', 'fragrances', 'skincare', 
            'groceries', 'home-decoration', 'furniture', 'tops', 'womens-dresses',
            'womens-shoes', 'mens-shirts', 'mens-shoes', 'mens-watches', 
            'womens-watches', 'womens-bags', 'womens-jewellery', 'sunglasses',
            'automotive', 'motorcycle', 'lighting'
        ];
        
        const container = document.getElementById('categoriesFilter');
        container.innerHTML = '';
        
        fallbackCategories.forEach((category, index) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = index === 0 ? 'category-item active' : 'category-item';
            categoryElement.textContent = index === 0 ? category : this.capitalizeWords(category.replace(/-/g, ' '));
            categoryElement.addEventListener('click', () => {
                this.selectCategory(index === 0 ? '' : category, categoryElement);
            });
            container.appendChild(categoryElement);
        });
    }

    selectCategory(category, element) {
        // Remove active class from all categories
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected category
        element.classList.add('active');
        
        // Update filter and reload products
        this.currentFilters.category = category;
        this.currentPage = 1;
        this.loadProducts();
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            let url = 'https://dummyjson.com/products';
            const params = new URLSearchParams();
            
            // Apply category filter
            if (this.currentFilters.category) {
                url = `https://dummyjson.com/products/category/${encodeURIComponent(this.currentFilters.category)}`;
            }
            
            // Apply search filter
            if (this.currentFilters.search) {
                url = `https://dummyjson.com/products/search?q=${encodeURIComponent(this.currentFilters.search)}`;
            }
            
            // Add pagination - get more products to ensure good variety
            const skip = (this.currentPage - 1) * this.productsPerPage;
            params.append('limit', Math.max(this.productsPerPage, 100));
            params.append('skip', skip);
            
            const fullUrl = `${url}${url.includes('?') ? '&' : '?'}${params}`;
            const response = await fetch(fullUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            let products = data.products || [];
            this.totalProducts = data.total || products.length;
            
            // Apply client-side filters
            products = this.applyClientFilters(products);
            
            this.renderProducts(products);
            this.renderPagination();
            this.updateProductsCount(products.length);
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Error loading products', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    applyClientFilters(products) {
        let filtered = [...products];
        
        // Price filter
        if (this.currentFilters.minPrice || this.currentFilters.maxPrice) {
            const min = parseFloat(this.currentFilters.minPrice) || 0;
            const max = parseFloat(this.currentFilters.maxPrice) || Infinity;
            filtered = filtered.filter(product => product.price >= min && product.price <= max);
        }
        
        // Rating filter
        if (this.currentFilters.rating.length > 0) {
            const minRating = Math.min(...this.currentFilters.rating);
            filtered = filtered.filter(product => product.rating >= minRating);
        }
        
        // Sort
        if (this.currentFilters.sort) {
            filtered = this.sortProducts(filtered, this.currentFilters.sort);
        }
        
        return filtered;
    }

    sortProducts(products, sortBy) {
        switch (sortBy) {
            case 'price-asc':
                return products.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return products.sort((a, b) => b.price - a.price);
            case 'rating-desc':
                return products.sort((a, b) => b.rating - a.rating);
            case 'title-asc':
                return products.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc':
                return products.sort((a, b) => b.title.localeCompare(a.title));
            default:
                return products;
        }
    }

    renderProducts(products) {
        const container = document.getElementById('productsGrid');
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No products found</h4>
                    <p class="text-muted">Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }
        
        products.forEach((product, index) => {
            const productCard = this.createProductCard(product);
            productCard.classList.add('stagger-item');
            productCard.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(productCard);
        });
        
        // Add event listeners to Add to Cart buttons
        this.bindAddToCartButtons();
    }

    bindAddToCartButtons() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('button').dataset.productId);
                const title = e.target.closest('button').dataset.productTitle;
                const price = parseFloat(e.target.closest('button').dataset.productPrice);
                const image = e.target.closest('button').dataset.productImage;
                
                cart.addToCart(id, title, price, image);
            });
        });
    }

    createProductCard(product) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 col-12';
        
        const discountPrice = product.discountPercentage 
            ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
            : product.price.toFixed(2);
        
        col.innerHTML = `
            <div class="product-card hover-lift">
                <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                <div class="product-content">
                    <h5 class="product-title">${product.title}</h5>
                    <div class="product-price">
                        ${product.discountPercentage ? 
                            `<span class="text-decoration-line-through text-muted me-2">$${product.price.toFixed(2)}</span>
                             <span>$${discountPrice}</span>` 
                            : `$${discountPrice}`}
                    </div>
                    <div class="product-rating">
                        <div class="rating-stars">
                            ${this.generateStars(product.rating)}
                        </div>
                        <small class="text-muted">(${product.rating})</small>
                    </div>
                    <button class="btn btn-primary add-to-cart-btn btn-hover-effect" 
                            data-product-id="${product.id}" 
                            data-product-title="${product.title}" 
                            data-product-price="${discountPrice}" 
                            data-product-image="${product.thumbnail}">
                        <i class="fas fa-cart-plus me-2"></i>Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        return col;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        container.innerHTML = '';
        
        const totalPages = Math.ceil(this.totalProducts / this.productsPerPage);
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="app.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        `;
        container.appendChild(prevLi);
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `
                <a class="page-link" href="#" onclick="app.changePage(${i})">${i}</a>
            `;
            container.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="app.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        `;
        container.appendChild(nextLi);
    }

    changePage(page) {
        if (page < 1 || page > Math.ceil(this.totalProducts / this.productsPerPage)) return;
        
        this.currentPage = page;
        this.loadProducts();
        this.scrollToProducts();
    }

    updateRatingFilter() {
        const checkedBoxes = document.querySelectorAll('#ratingFilter input:checked');
        this.currentFilters.rating = Array.from(checkedBoxes).map(box => parseInt(box.value));
        this.currentPage = 1;
        this.loadProducts();
    }

    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            category: '',
            search: '',
            sort: '',
            minPrice: '',
            maxPrice: '',
            rating: []
        };
        
        // Reset form inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.querySelectorAll('#ratingFilter input').forEach(input => {
            input.checked = false;
        });
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.currentPage = 1;
        this.loadProducts();
        this.showToast('Filters cleared', 'success');
    }

    updateProductsCount(count) {
        document.getElementById('productsCount').textContent = count;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        
        if (show) {
            spinner.style.display = 'block';
            productsGrid.style.opacity = '0.5';
        } else {
            spinner.style.display = 'none';
            productsGrid.style.opacity = '1';
        }
    }

    handleCheckout() {
        const items = cart.getItems();
        if (items.length === 0) {
            this.showToast('Your cart is empty', 'warning');
            return;
        }
        
        // Populate checkout modal
        this.populateCheckoutModal();
        
        // Close cart offcanvas
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        if (cartOffcanvas) {
            cartOffcanvas.hide();
        }
    }

    populateCheckoutModal() {
        const items = cart.getItems();
        const checkoutItems = document.getElementById('checkoutItems');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        if (items.length === 0) {
            checkoutItems.innerHTML = '<p class="text-muted">No items in cart</p>';
            checkoutTotal.textContent = '0.00';
            return;
        }
        
        checkoutItems.innerHTML = items.map(item => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;" class="me-2">
                    <div>
                        <small class="fw-bold">${item.title}</small>
                        <small class="text-muted d-block">Qty: ${item.quantity}</small>
                    </div>
                </div>
                <span class="fw-bold">$${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
            </div>
        `).join('');
        
        const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
        checkoutTotal.textContent = total.toFixed(2);
    }

    initCheckoutModal() {
        const proceedBtn = document.getElementById('proceedToPayment');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                // Show step 2
                document.getElementById('checkoutStep1').classList.add('d-none');
                document.getElementById('checkoutStep2').classList.remove('d-none');
                
                // Clear cart after successful payment
                setTimeout(() => {
                    cart.clearCart();
                }, 2000);
            });
        }
        
        // Reset modal when closed
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.addEventListener('hidden.bs.modal', () => {
                document.getElementById('checkoutStep1').classList.remove('d-none');
                document.getElementById('checkoutStep2').classList.add('d-none');
            });
        }
    }

    updateCartUI() {
        const items = cart.getItems();
        const cartCount = document.querySelector('.cart-count');
        const cartBtn = document.querySelector('.cart-btn');
        
        cartCount.textContent = items.reduce((total, item) => total + item.quantity, 0);
        
        if (items.length > 0) {
            cartBtn.classList.add('animate-bounce');
            setTimeout(() => cartBtn.classList.remove('animate-bounce'), 1000);
        }
    }

    scrollToProducts() {
        document.getElementById('products').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    handleScroll() {
        const nav = document.querySelector('.glass-nav');
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(var(--primary-rgb), 0.2)';
        } else {
            nav.style.background = 'rgba(var(--primary-rgb), 0.1)';
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-${this.getToastIcon(type)} text-${type} me-2"></i>
                    <strong class="me-auto">E-commerce</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }
}

// Utility functions
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ECommerceApp();
});
