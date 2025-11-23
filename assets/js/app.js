// assets/js/app.js

// ── DEPENDENCIES (CDN) ───────────────────────────────────
const deps = [
  'https://cdn.jsdelivr.net/npm/gsap@3.11.3/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.11.3/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js',
  'https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.min.js',
  'https://cdn.jsdelivr.net/npm/split-type@0.3.3/umd/split-type.min.js'
];

async function loadScripts(urls) {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  });
  return Promise.all(promises);
}

// ── MODULES (Mimic original app.js structure) ─────────────
class Scroll {
  init() {
    this.instance = new LocomotiveScroll({
      el: document.querySelector('[data-scroll-container]'),
      smooth: true,
      smartphone: { smooth: true },
      tablet: { smooth: true }
    });
    this.instance.on('scroll', () => {});
    window.lenis = this.instance; // expose globally
  }
}

class Load {
  init() {
    // Preloader logic from original
    const preloader = document.querySelector('.c-preloader');
    if (!preloader) return;

    const head = document.querySelector('#preloaderHead');
    const content = document.querySelector('#preloaderContent');
    const chars = [
      ...new SplitType(head, { types: 'chars' }).chars,
      ...new SplitType(content, { types: 'chars' }).chars
    ];

    gsap.set(chars, { opacity: 0 });
    gsap.to(chars, {
      opacity: 1,
      duration: 0.02,
      stagger: {
        each: 0.02,
        onComplete: () => {
          setTimeout(() => {
            gsap.to(preloader, {
              opacity: 0,
              duration: 0.6,
              onComplete: () => preloader.remove()
            });
          }, 800);
        }
      }
    });
  }
}

class Header {
  init() {
    const header = document.querySelector('.c-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 50);
    });
  }
}

// ── INIT ─────────────────────────────────────────────────
document.documentElement.classList.remove('has-no-js');

window.addEventListener('DOMContentLoaded', async () => {
  await loadScripts(deps);
  gsap.registerPlugin(ScrollTrigger);

  // Initialize modules
  new Scroll().init();
  new Header().init();
  new Load().init();

  // Page transitions
  Barba.init({
    views: [{
      namespace: 'default',
      afterEnter() {
        // Re-init scroll + animations on new page
        document.querySelectorAll('[data-scroll]').forEach(el => {
          el.classList.remove('is-inview');
        });
        window.lenis.update();
        ScrollTrigger.refresh();
      }
    }],
    transitions: [{
      name: 'default',
      leave({ current }) {
        return gsap.to(current.container, { opacity: 0, duration: 0.3 });
      },
      enter({ next }) {
        next.container.style.opacity = '0';
        return gsap.to(next.container, { opacity: 1, duration: 0.5, delay: 0.1 });
      }
    }]
  });
});
