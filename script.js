document.addEventListener('DOMContentLoaded', () => {

    // Tạo hiệu ứng fade-in on scroll cho các tác phẩm
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Kiểm tra xem trình duyệt có hỗ trợ IntersectionObserver không
    if ('IntersectionObserver' in window) {
        // Callback sẽ được gọi mỗi khi một item đi vào hoặc đi ra màn hình
        const observerCallback = (items, observer) => {
            items.forEach(item => {
                if (item.isIntersecting) {
                    item.target.classList.add('visible');
                    // Ngừng theo dõi item này sau khi nó đã hiện ra
                    observer.unobserve(item.target);
                }
            });
        };

        // Tùy chọn cho observer
        const observerOptions = {
            root: null, // quan sát so với viewport
            rootMargin: '0px',
            threshold: 0.1 // hiện ra khi 10% của item lọt vào màn hình
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Bắt đầu theo dõi tất cả các gallery-item
        galleryItems.forEach(item => {
            observer.observe(item);
        });
    } else {
        // Nếu trình duyệt cũ không hỗ trợ, hiện tất cả các item ngay lập tức
        galleryItems.forEach(item => {
            item.classList.add('visible');
        });
    }

});
