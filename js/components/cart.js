var iPresence = iPresence || {};

iPresence.Cart = (function() {
    'use strict';

    var cssClasses = {
        'complete': 'is-checkedout',
        'products': {
            'list':   '.js-c-cart__product-list',
            'qtyMod': '.js-c-product__qty-mod',
            'qty':    '.js-c-product__qty-number',
            'total':  '.js-c-product__total'
        },
        'summary': {
            'productCount':  '.js-c-summary__items-label',
            'subTotal':      '.js-c-summary__items-value',
            'discounts':     '.js-c-summary__discounts',
            'discountsList': '.js-c-summary__discounts-items',
            'total':         '.js-c-summary__checkout-heading-value',
            'checkoutBtn':   '.js-c-summary__checkout-button'
        }
    };

    var selectors = {
        'container': $('.js-page__shopping-cart-container'),
        'products': {
            'template': $('.js-page__templates'),
            'list': $(cssClasses.products.list)
        },
        'summary': {
            'discountTemplate': $('.js-discount__template'),
            'productCount':     $(cssClasses.summary.productCount),
            'subTotal':         $(cssClasses.summary.subTotal),
            'discounts':        $(cssClasses.summary.discounts),
            'discountsList':    $(cssClasses.summary.discountsList),
            'total':            $(cssClasses.summary.total),
            'checkoutBtn':      $(cssClasses.summary.checkoutBtn)
        }
    };

    var settings = {
        'products': {
            'markup': null
        },
        'discount': {
            'markup': null
        },
        'currency': '€'
    };

    var state = { // This data could come from an AJAX endpoint, localStorage or rendered within the DOM
        'products': [
            {
                'code': 'GOKU',
                'name': 'Goku POP',
                'img': 'img/product/goku.png',
                'qty': 2,
                'price': 5
            },
            {
                'code': 'NARU',
                'name': 'Naruto POP',
                'img': 'img/product/naruto.png',
                'qty': 3,
                'price': 20
            },
            {
                'code': 'LUF',
                'name': 'Luffy POP',
                'img': 'img/product/luffy.png',
                'qty': 2,
                'price': 7.5
            }
        ],
        'items': 0,
        'total': 0.00,
        'discounts': [],
    };

    var _loadProducts = function() {
        state.products.forEach(function(product) {
            var productTemplate = (' ' + settings.products.markup).slice(1);

            // Replace values in template
            productTemplate = productTemplate.replaceAll('\\${name}', product.name);
            productTemplate = productTemplate.replaceAll('data-src="\\${img}"', 'src="' + product.img + '"');
            productTemplate = productTemplate.replaceAll('\\${code}', product.code);
            productTemplate = productTemplate.replaceAll('\\${qty}', 'value="' + product.qty + '"');
            productTemplate = productTemplate.replaceAll('\\${price}', product.price + ' ' + settings.currency);
            productTemplate = productTemplate.replaceAll('\\${total}', (product.qty * product.price) + ' ' + settings.currency);

            // Add to DOM
            selectors.products.list.append(productTemplate);
        });
    };

    var _setupEvents = function() {
        // Click events for plus/minus on quantities
        (selectors.products.list).on('click', ((cssClasses.products.qtyMod)), function(e) {
            e.preventDefault();
            var $this = $(this),
                direction = $this.data('qty'),
                qtyInput = $this.siblings(cssClasses.products.qty),
                productCode = qtyInput.data('code'),
                qty = ~~(qtyInput.val());

            qty = ('+' == direction) ? qty+1 : ((0 == qty) ? 0 : qty-1);

            _updateQty(qtyInput, qty, productCode);
        });

        // Change event for quantity text input
        (selectors.products.list).on('change keyup', ((cssClasses.products.qty)), function(e) {
            e.preventDefault();

            var $this = $(this),
                productCode = $this.data('code'),
                qty = ~~($this.val());


            _updateQty($this, qty, productCode);
        });

        // Click event for "Checkout" button
        (selectors.summary.checkoutBtn).on('click', function(e) {
            e.preventDefault();
            (selectors.container).addClass(cssClasses.complete);
        });
    };

    var _updateQty = function(el, qty, code) {
        // Get reference to product in state
        var stateProduct = state.products[ state.products.map(item => item.code).indexOf(code) ];

        // Update quantity input field
        el.val(qty);

        // Update the total amount in the product list DOM
        el.parents('.c-product').find(cssClasses.products.total).text( (qty * stateProduct.price) + ' ' + settings.currency );

        // Update the qty in the state object
        stateProduct.qty = qty;

        _updateSummary();
    };

    var _updateSummary = function() {
        var totalNumberOfProducts = 0,
            subTotal = 0,
            grandTotal = 0;

        // Reset discounts
        state.discounts = [];

        state.products.forEach(function(product) {
            // Update total count of products
            totalNumberOfProducts = totalNumberOfProducts + product.qty;

            // Update subtotal price
            subTotal = subTotal + (product.qty * product.price);

            // Update discounts
            // 1) 2-for-1 promotions: buy two of the same product, get one free, applied to GOKU items.
            if ('GOKU' == product.code) {
                if( product.qty > 1 ) {
                    state.discounts.push({
                        'description': '2x1 Goku POP offer',
                        'discount': (Math.floor(product.qty / 2) * product.price)
                    });
                }
            }

            // 2) Bulk discounts: buying x or more of a product, the price of that product is reduced,
            //    applied to NARU item. P.e. if you buy 3 or more NARU items, the price per unit should be 19.00€.
            if ('NARU' == product.code) {
                if( product.qty > 2 ) {
                    state.discounts.push({
                        'description': 'x3 Naruto POP offer',
                        'discount': (product.qty * (product.price - 19))
                    });
                }
            }
        });

        // Set grand total before subtracting discounts
        grandTotal = subTotal;

        // console.log('state.discounts', state.discounts);

        // If no discounts available then hide section
        if( 0 == state.discounts.length ) {
            selectors.summary.discounts.hide();
        } else {
            selectors.summary.discounts.show();

            // Update discount list
            selectors.summary.discountsList.html('');

            state.discounts.forEach(function(discount) {
                var discountTemplate = (' ' + settings.discount.markup).slice(1);

                // Replace values in template
                discountTemplate = discountTemplate.replaceAll('\\${description}', discount.description);
                discountTemplate = discountTemplate.replaceAll('\\${discount}', '-' + discount.discount + ' ' + settings.currency);

                // Update grandTotal inclusive of discounts
                grandTotal = grandTotal - discount.discount;

                // Add to DOM
                selectors.summary.discountsList.append(discountTemplate);
            });
        }

        // Update total count of products
        (selectors.summary.productCount).text( totalNumberOfProducts + ' item' + ((1 == totalNumberOfProducts) ? '' : 's') );

        // Update subtotal price in DOM
        (selectors.summary.subTotal).text( subTotal + ' ' + settings.currency );

        // Update grand total price in DOM
        (selectors.summary.total).text( grandTotal + ' ' + settings.currency );
    };

    var init = function() {
        // Set the html template for products from the DOM
        settings.products.markup = selectors.products.template.html();

        // Set the html template for discounts from the DOM
        settings.discount.markup = selectors.summary.discountTemplate.html();

        _loadProducts();
        _setupEvents();
        _updateSummary();
    };

    return {
        init: init
    };
})();