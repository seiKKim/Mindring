const swiper = new Swiper('.swiper', {
    lazy: true,
    loop: true,
    slidesPerView: 3.1,
    spaceBetween: 20,
    loopedSlides: 1,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false,
    },
    navigation: {
        nextEl: '.button-next',
        prevEl: '.button-prev',
    },
});