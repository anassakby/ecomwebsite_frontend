// Language translations for the e-commerce website
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.translations = {
            en: {
                // Navigation
                'nav.home': 'Home',
                'nav.shop': 'Shop',
                'nav.categories': 'Categories',
                'nav.cart': 'Cart',
                'nav.signin': 'Sign In',
                'nav.theme': 'Toggle Theme',
                
                // Hero section
                'hero.title': 'Discover Amazing Products',
                'hero.subtitle': 'Premium quality at unbeatable prices',
                'hero.cta': 'Shop Now',
                
                // Products
                'products.title': 'Featured Products',
                'products.search': 'Search products...',
                'products.filter.all': 'All Categories',
                'products.filter.rating': 'Min Rating',
                'products.filter.sort': 'Sort by',
                'products.filter.clear': 'Clear Filters',
                'products.sort.default': 'Default',
                'products.sort.price-low': 'Price: Low to High',
                'products.sort.price-high': 'Price: High to Low',
                'products.sort.rating': 'Rating',
                'products.sort.name': 'Name',
                'products.showing': 'Showing {count} products',
                'products.add-to-cart': 'Add to Cart',
                'products.rating': 'Rating',
                'products.price': 'Price',
                'products.discount': 'Save',
                
                // Cart
                'cart.title': 'Shopping Cart',
                'cart.empty': 'Your cart is empty',
                'cart.total': 'Total',
                'cart.checkout': 'Proceed to Checkout',
                'cart.remove': 'Remove',
                'cart.quantity': 'Qty',
                'cart.each': 'each',
                
                // Authentication
                'auth.signin': 'Sign In',
                'auth.signup': 'Sign Up',
                'auth.name': 'Full Name',
                'auth.email': 'Email Address',
                'auth.password': 'Password',
                'auth.signin-success': 'Sign in successful! Welcome.',
                'auth.signup-success': 'Account created successfully! Welcome.',
                'auth.email-required': 'Email must end with @gmail.com',
                'auth.logout': 'Logout',
                'auth.profile': 'Profile',
                'auth.orders': 'Orders',
                
                // Checkout
                'checkout.title': 'Checkout',
                'checkout.step1': 'Review Order',
                'checkout.step2': 'Shipping Info',
                'checkout.step3': 'Payment',
                'checkout.continue': 'Continue',
                'checkout.place-order': 'Place Order',
                'checkout.success': 'Order Placed Successfully!',
                
                // General
                'general.loading': 'Loading...',
                'general.error': 'Error',
                'general.success': 'Success',
                'general.close': 'Close',
                'general.cancel': 'Cancel',
                'general.save': 'Save',
                'general.edit': 'Edit',
                'general.delete': 'Delete'
            },
            fr: {
                // Navigation
                'nav.home': 'Accueil',
                'nav.shop': 'Boutique',
                'nav.categories': 'Catégories',
                'nav.cart': 'Panier',
                'nav.signin': 'Connexion',
                'nav.theme': 'Changer le thème',
                
                // Hero section
                'hero.title': 'Découvrez des Produits Extraordinaires',
                'hero.subtitle': 'Qualité premium à prix imbattables',
                'hero.cta': 'Acheter Maintenant',
                
                // Products
                'products.title': 'Produits en Vedette',
                'products.search': 'Rechercher des produits...',
                'products.filter.all': 'Toutes Catégories',
                'products.filter.rating': 'Note Min',
                'products.filter.sort': 'Trier par',
                'products.filter.clear': 'Effacer Filtres',
                'products.sort.default': 'Par défaut',
                'products.sort.price-low': 'Prix: Croissant',
                'products.sort.price-high': 'Prix: Décroissant',
                'products.sort.rating': 'Note',
                'products.sort.name': 'Nom',
                'products.showing': 'Affichage de {count} produits',
                'products.add-to-cart': 'Ajouter au Panier',
                'products.rating': 'Note',
                'products.price': 'Prix',
                'products.discount': 'Économie',
                
                // Cart
                'cart.title': 'Panier d\'Achat',
                'cart.empty': 'Votre panier est vide',
                'cart.total': 'Total',
                'cart.checkout': 'Procéder au Paiement',
                'cart.remove': 'Supprimer',
                'cart.quantity': 'Qté',
                'cart.each': 'chacun',
                
                // Authentication
                'auth.signin': 'Connexion',
                'auth.signup': 'Inscription',
                'auth.name': 'Nom Complet',
                'auth.email': 'Adresse Email',
                'auth.password': 'Mot de Passe',
                'auth.signin-success': 'Connexion réussie! Bienvenue.',
                'auth.signup-success': 'Inscription réussie! Bienvenue.',
                'auth.email-required': 'L\'email doit se terminer par @gmail.com',
                'auth.logout': 'Déconnexion',
                'auth.profile': 'Profil',
                'auth.orders': 'Commandes',
                
                // Checkout
                'checkout.title': 'Commande',
                'checkout.step1': 'Réviser Commande',
                'checkout.step2': 'Info Livraison',
                'checkout.step3': 'Paiement',
                'checkout.continue': 'Continuer',
                'checkout.place-order': 'Passer Commande',
                'checkout.success': 'Commande Passée avec Succès!',
                
                // General
                'general.loading': 'Chargement...',
                'general.error': 'Erreur',
                'general.success': 'Succès',
                'general.close': 'Fermer',
                'general.cancel': 'Annuler',
                'general.save': 'Sauvegarder',
                'general.edit': 'Modifier',
                'general.delete': 'Supprimer'
            }
        };
    }

    init() {
        this.addLanguageToggle();
        this.translatePage();
    }

    addLanguageToggle() {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const langToggle = document.createElement('li');
            langToggle.className = 'nav-item';
            langToggle.innerHTML = `
                <button class="btn nav-link language-toggle" onclick="languageManager.toggleLanguage()">
                    <i class="fas fa-globe me-1"></i>${this.currentLanguage.toUpperCase()}
                </button>
            `;
            navbar.appendChild(langToggle);
        }
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', this.currentLanguage);
        this.translatePage();
        
        // Update language toggle button
        const langToggle = document.querySelector('.language-toggle');
        if (langToggle) {
            langToggle.innerHTML = `<i class="fas fa-globe me-1"></i>${this.currentLanguage.toUpperCase()}`;
        }
    }

    translate(key, replacements = {}) {
        let translation = this.translations[this.currentLanguage][key] || 
                         this.translations.en[key] || 
                         key;
        
        // Handle replacements like {count}
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        
        return translation;
    }

    translatePage() {
        // Translate elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.translate(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update dynamic content
        this.updateDynamicTranslations();
    }

    updateDynamicTranslations() {
        // Update product count if visible
        const productCount = document.querySelector('.products-count');
        if (productCount && productCount.dataset.count) {
            productCount.textContent = this.translate('products.showing', { 
                count: productCount.dataset.count 
            });
        }

        // Update cart if visible
        const cartTitle = document.querySelector('.cart-title');
        if (cartTitle) {
            cartTitle.textContent = this.translate('cart.title');
        }
    }
}

// Initialize language manager
const languageManager = new LanguageManager();