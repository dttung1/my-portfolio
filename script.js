const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

// Theo dõi tất cả các phần tử cần hiệu ứng
document.querySelectorAll('.slide-left, .slide-right, .fade-in').forEach((el) => {
    observer.observe(el);
});
