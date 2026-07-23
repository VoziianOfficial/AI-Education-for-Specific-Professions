(function () {
    "use strict";

    const root = document.querySelector(
        "[data-about-parallax-perspectives]"
    );

    if (!root) {
        return;
    }

    const swiperElement = root.querySelector(
        "[data-about-parallax-perspectives-swiper]"
    );

    const paginationElement = root.querySelector(
        "[data-about-parallax-perspectives-pagination]"
    );

    if (
        !swiperElement ||
        typeof window.Swiper !== "function"
    ) {
        return;
    }

    /*
     * Prevent duplicate initialization.
     */

    if (swiperElement.swiper) {
        return;
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const swiper = new window.Swiper(
        swiperElement,
        {
            slidesPerView: 1,
            spaceBetween: 16,
            speed: reducedMotion ? 0 : 720,
            loop: true,
            grabCursor: true,
            watchOverflow: true,
            observer: true,
            observeParents: true,

            autoplay: reducedMotion
                ? false
                : {
                    delay: 4800,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                },

            pagination: paginationElement
                ? {
                    el: paginationElement,
                    clickable: true
                }
                : undefined,

            keyboard: {
                enabled: true,
                onlyInViewport: true
            },

            a11y: {
                enabled: true,
                prevSlideMessage:
                    "Show previous learning perspective",

                nextSlideMessage:
                    "Show next learning perspective",

                paginationBulletMessage:
                    "Go to learning perspective {{index}}"
            },

            breakpoints: {
                640: {
                    slidesPerView: 1.35,
                    spaceBetween: 18
                },

                768: {
                    slidesPerView: 2,
                    spaceBetween: 20
                },

                1100: {
                    slidesPerView: 3,
                    spaceBetween: 24
                }
            }
        }
    );

    /*
     * Recalculate after fonts and images load.
     */

    window.addEventListener(
        "load",
        function () {
            swiper.update();
        },
        {
            once: true
        }
    );
})();