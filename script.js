// Vẽ biểu đồ tiến độ khảo sát 4 tỉnh trọng điểm
const ctx = document.getElementById('myChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Bến Tre', 'Trà Vinh', 'Tiền Giang', 'Vĩnh Long'],
        datasets: [{
            label: 'Số hộ đã khảo sát',
            data: [45, 30, 25, 20],
            backgroundColor: '#40916c'
        }]
    },
    options: {
        scales: { y: { beginAtZero: true, max: 100 } }
    }
});

console.log("Hệ thống quản lý đề tài đã sẵn sàng!");
