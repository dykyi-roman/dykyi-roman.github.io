function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 20,
            behavior: 'smooth'
        });
    }
    
    // Если боковая навигация в мобильном виде и развернута, сворачиваем её после выбора
    if (window.innerWidth <= 1200) {
        const sideNav = document.querySelector('.side-nav');
        if (sideNav.classList.contains('expanded')) {
            sideNav.classList.remove('expanded');
        }
    }
}

// Функция для переключения состояния боковой навигации
function toggleSideNav() {
    const sideNav = document.querySelector('.side-nav');
    sideNav.classList.toggle('expanded');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик клика для кнопки переключения
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleSideNav);
    }
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', function() {
        // Если ширина экрана больше 1200px, убираем класс expanded
        if (window.innerWidth > 1200) {
            const sideNav = document.querySelector('.side-nav');
            sideNav.classList.remove('expanded');
        }
    });
});