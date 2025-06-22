// Products Management and API Integration
class ProductsManager {
    constructor() {
        this.apiBaseUrl = 'https://dummyjson.com';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Fetch products with caching
    async fetchProducts(options = {}) {
        const {
            category = '',
            search = '',
            limit = 30,
            skip = 0,
            select = ''
        } = options;

        const cacheKey = JSON.stringify(options);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            let url = `${this.apiBaseUrl}/products`;
            const params = new URLSearchParams();

            if (category) {
                url = `${this.apiBaseUrl}/products/category/${encodeURIComponent(category)}`;
            } else if (search) {
                url = `${this.apiBaseUrl}/products/search`;
                params.append('q', search);
            }

            params.append('limit', limit);
            params.append('skip', skip);
            
            if (select) {
                params.append('select', select);
            }

            const fullUrl = `${url}?${params}`;
            const response = await fetch(fullUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    // Fetch single product
    async fetchProduct(id) {
        const cacheKey = `product_${id}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/products/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    // Fetch categories
    async fetchCategories() {
        const cacheKey = 'categories';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/products/categories`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    // Get all products (for extensive catalog)
    async getAllProducts() {
        try {
            // First, get total count
            const initial = await this.fetchProducts({ limit: 1 });
            const total = initial.total;
            
            // Fetch all products in batches
            const batchSize = 100;
            const batches = Math.ceil(total / batchSize);
            const allProducts = [];
            
            for (let i = 0; i < batches; i++) {
                const skip = i * batchSize;
                const batch = await this.fetchProducts({ 
                    limit: batchSize, 
                    skip 
                });
                allProducts.push(...batch.products);
            }
            
            return {
                products: allProducts,
                total: allProducts.length
            };
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw error;
        }
    }

    // Search products with advanced filters
    async searchProducts(query, filters = {}) {
        try {
            const {
                category,
                minPrice,
                maxPrice,
                minRating,
                sortBy,
                limit = 30,
                skip = 0
            } = filters;

            let products;
            
            if (category) {
                products = await this.fetchProducts({ category, limit: 1000 });
            } else if (query) {
                products = await this.fetchProducts({ search: query, limit: 1000 });
            } else {
                products = await this.fetchProducts({ limit: 1000 });
            }

            let filtered = products.products;

            // Apply additional filters
            if (query && !category) {
                const searchTerm = query.toLowerCase();
                filtered = filtered.filter(product => 
                    product.title.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm) ||
                    product.brand?.toLowerCase().includes(searchTerm)
                );
            }

            if (minPrice !== undefined) {
                filtered = filtered.filter(product => product.price >= minPrice);
            }

            if (maxPrice !== undefined) {
                filtered = filtered.filter(product => product.price <= maxPrice);
            }

            if (minRating !== undefined) {
                filtered = filtered.filter(product => product.rating >= minRating);
            }

            // Sort products
            if (sortBy) {
                filtered = this.sortProducts(filtered, sortBy);
            }

            // Apply pagination
            const total = filtered.length;
            const paginated = filtered.slice(skip, skip + limit);

            return {
                products: paginated,
                total,
                skip,
                limit
            };
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    // Sort products
    sortProducts(products, sortBy) {
        const sorted = [...products];
        
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return sorted.sort((a, b) => b.price - a.price);
            case 'rating-desc':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'rating-asc':
                return sorted.sort((a, b) => a.rating - b.rating);
            case 'title-asc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            case 'discount-desc':
                return sorted.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
            case 'newest':
                return sorted.sort((a, b) => b.id - a.id);
            case 'popular':
                return sorted.sort((a, b) => b.rating - a.rating);
            default:
                return sorted;
        }
    }

    // Get related products
    async getRelatedProducts(productId, category) {
        try {
            const products = await this.fetchProducts({ category, limit: 20 });
            return products.products.filter(product => product.id !== productId);
        } catch (error) {
            console.error('Error fetching related products:', error);
            return [];
        }
    }

    // Get product recommendations
    async getRecommendations(limit = 10) {
        try {
            // Get highly rated products
            const products = await this.fetchProducts({ limit: 100 });
            const highRated = products.products
                .filter(product => product.rating >= 4.5)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, limit);
            
            return highRated;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }

    // Get featured products
    async getFeaturedProducts(limit = 8) {
        try {
            // Get products with high ratings and discounts
            const products = await this.fetchProducts({ limit: 100 });
            const featured = products.products
                .filter(product => 
                    product.rating >= 4.0 && 
                    (product.discountPercentage || 0) > 10
                )
                .sort((a, b) => {
                    const scoreA = product.rating + (product.discountPercentage || 0) / 10;
                    const scoreB = product.rating + (product.discountPercentage || 0) / 10;
                    return scoreB - scoreA;
                })
                .slice(0, limit);
            
            return featured;
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache stats
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // Calculate price with discount
    calculateDiscountedPrice(price, discountPercentage) {
        if (!discountPercentage) return price;
        return price * (1 - discountPercentage / 100);
    }

    // Format price for display
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    // Generate product URL slug
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    // Validate product data
    validateProduct(product) {
        const required = ['id', 'title', 'price', 'thumbnail'];
        return required.every(field => product[field] !== undefined);
    }

    // Get product stock status
    getStockStatus(stock) {
        if (stock === 0) return { status: 'out-of-stock', text: 'Out of Stock', class: 'text-danger' };
        if (stock <= 5) return { status: 'low-stock', text: `Only ${stock} left`, class: 'text-warning' };
        return { status: 'in-stock', text: 'In Stock', class: 'text-success' };
    }

    // Calculate savings
    calculateSavings(originalPrice, discountedPrice) {
        const savings = originalPrice - discountedPrice;
        const percentage = (savings / originalPrice) * 100;
        return {
            amount: savings,
            percentage: Math.round(percentage)
        };
    }
}

// Export for global usage
window.ProductsManager = ProductsManager;

// Initialize products manager
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});
