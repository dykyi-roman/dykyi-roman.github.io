/**
 * Photo carousel — an endlessly scrolling strip of photos taken from pages/gallery.html.
 * The gallery page stays the single source of truth: tiles are fetched, sampled and cloned
 * once, so no photo list is duplicated here.
 */
(function () {
    const GALLERY_URL = 'gallery.html';
    const VISIBLE_PHOTOS = 20;
    const SECONDS_PER_PHOTO = 3;

    function shuffle(items) {
        const result = items.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function buildItem(tile) {
        const img = tile.querySelector('img');
        if (!img) return null;

        const link = document.createElement('a');
        link.className = 'carousel-item';
        link.href = tile.getAttribute('href');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', tile.getAttribute('aria-label') || 'Photo on Instagram');

        const picture = document.createElement('img');
        picture.src = img.getAttribute('src');
        picture.alt = '';
        picture.width = 105;
        picture.height = 140;
        picture.loading = 'lazy';
        picture.decoding = 'async';

        link.appendChild(picture);
        return link;
    }

    function render(carousel, tiles) {
        const photos = shuffle(tiles).slice(0, VISIBLE_PHOTOS);
        const items = photos.map(buildItem).filter(Boolean);
        if (!items.length) return;

        const track = document.createElement('div');
        track.className = 'carousel-track';
        // Two identical halves: the keyframe shifts by exactly one half, so the loop is seamless.
        items.forEach(item => track.appendChild(item));
        items.forEach(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.tabIndex = -1;
            track.appendChild(clone);
        });

        track.style.setProperty('--carousel-duration', (items.length * SECONDS_PER_PHOTO) + 's');
        carousel.innerHTML = '';
        carousel.appendChild(track);
        carousel.hidden = false;
    }

    function init() {
        const carousel = document.querySelector('.photo-carousel');
        if (!carousel) return;

        fetch(GALLERY_URL)
            .then(response => response.ok ? response.text() : Promise.reject(response.status))
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                render(carousel, Array.from(doc.querySelectorAll('.gallery-item')));
            })
            .catch(error => console.error('Error loading gallery photos:', error));
    }

    // Deferred until load so the globe and maps get the bandwidth first.
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
