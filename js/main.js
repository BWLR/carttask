(function($, window, document) {
    // Basic page setup
    $('body').removeClass('no-js');

    // Polyfill for replaceAll
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    // Initialise cart
    iPresence.Cart.init();
}(window.jQuery, window, document));