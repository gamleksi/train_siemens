
(function($) {



    $(function() {

        var	$window = $(window),
            $body = $('body');

        $(navPanel)
            .panel({
                delay: 100,
                hideOnClick: true,
                hideOnSwipe: true,
                resetScroll: true,
                resetForms: true,
                side: 'left',
                target: $body,
                visibleClass: 'navPanel-visible'
            });

    });

})(jQuery);