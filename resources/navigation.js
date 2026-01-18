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

    // Инициализация сворачиваемых блоков content
    initCollapsibleTopics();
});

// Функция инициализации сворачиваемых topic-block
function initCollapsibleTopics() {
    const topicBlocks = document.querySelectorAll('.topic-block');

    topicBlocks.forEach(function(block) {
        const h4 = block.querySelector('h4');
        if (!h4) return;

        // Проверяем, не была ли уже добавлена обёртка
        if (h4.parentElement.classList.contains('topic-header')) return;

        // Создаём обёртку для заголовка
        const header = document.createElement('div');
        header.className = 'topic-header';

        // Создаём иконку
        const toggle = document.createElement('span');
        toggle.className = 'topic-toggle';
        toggle.innerHTML = '▼';

        // Вставляем обёртку перед h4
        h4.parentNode.insertBefore(header, h4);

        // Перемещаем h4 внутрь обёртки
        header.appendChild(h4);
        header.appendChild(toggle);

        // Добавляем обработчик клика
        header.addEventListener('click', function() {
            block.classList.toggle('expanded');
        });
    });

    // Инициализация сворачиваемых content блоков с h5
    initCollapsibleContent();
}

// Функция инициализации сворачиваемых content блоков
function initCollapsibleContent() {
    const contentBlocks = document.querySelectorAll('.topic-block .content');

    contentBlocks.forEach(function(content) {
        const h5 = content.querySelector('h5');
        if (!h5) return;

        // Проверяем, не была ли уже добавлена обёртка
        if (h5.classList.contains('content-header')) return;

        // Добавляем класс для стилизации
        h5.classList.add('content-header');

        // Создаём иконку
        const toggle = document.createElement('span');
        toggle.className = 'content-toggle';
        toggle.innerHTML = '▼';
        h5.appendChild(toggle);

        // По умолчанию контент свёрнут
        content.classList.add('collapsed');

        // Добавляем обработчик клика на h5
        h5.addEventListener('click', function() {
            content.classList.toggle('collapsed');
        });
    });
}