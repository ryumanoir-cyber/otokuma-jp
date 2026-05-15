document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');

    if (!viewport || slides.length === 0) return;

    const getIndex = () => {
      const width = viewport.clientWidth || 1;
      return Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / width)));
    };

    const sync = () => {
      const index = getIndex();
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;

      slides.forEach((slide, i) => {
        const video = slide.querySelector('video');
        if (!video) return;
        if (i === index) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const go = (delta) => {
      const index = getIndex();
      const nextIndex = Math.max(0, Math.min(slides.length - 1, index + delta));
      viewport.scrollTo({ left: nextIndex * viewport.clientWidth, behavior: 'smooth' });
    };

    prev?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      go(-1);
    });

    next?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      go(1);
    });

    viewport.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
});
