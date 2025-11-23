// assets/js/app.js
// M0NARQ Industrial-AI.One - Full Production Script
// Locomotive.ca-inspired smooth scroll + Barba transitions + GSAP animations

// ── DEPENDENCIES ─────────────────────────────────────────
const deps = [
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js',
  'https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.min.js'
];

async function loadScripts(urls) {
  return Promise.all(urls.map(url => 
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    })
  ));
}

// ── SCRAMBLE TEXT EFFECT ─────────────────────────────────
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function scrambleText(element, duration = 1) {
  const originalText = element.textContent.trim();
  const length = originalText.length;
  const scrambleObj = { value: 0 };
  
  return gsap.to(scrambleObj, {
    duration,
    value: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      const progress = scrambleObj.value;
      let result = "";
      
      for (let i = 0; i < length; i++) {
        if (i / length < progress) {
          result += originalText[i];
        } else if (originalText[i] === " " || originalText[i] === "\n") {
          result += originalText[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      element.textContent = result;
    },
    onComplete: () => {
      element.textContent = originalText;
    }
  });
}

// ── MODULES ──────────────────────────────────────────────

class Scroll {
  init() {
    if (window.locoScroll) {
      window.locoScroll.destroy();
    }

    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;

    this.instance = new LocomotiveScroll({
      el: scrollContainer,
      smooth: true,
      multiplier: 1.0,
      lerp: 0.1,
      smartphone: { smooth: true },
      tablet: { smooth: true }
    });

    window.locoScroll = this.instance;

    // Sync with ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    ScrollTrigger.scrollerProxy(scrollContainer, {
      scrollTop(value) {
        return arguments.length 
          ? window.locoScroll.scrollTo(value, 0, 0) 
          : window.locoScroll.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return {
          top: 0, 
          left: 0, 
          width: window.innerWidth, 
          height: window.innerHeight
        };
      },
      pinType: scrollContainer.style.transform ? "transform" : "fixed"
    });

    this.instance.on('scroll', ScrollTrigger.update);
    ScrollTrigger.addEventListener('refresh', () => this.instance.update());
    ScrollTrigger.refresh();

    // Scroll Anchor Links
    this.initScrollAnchors();
  }

  initScrollAnchors() {
    document.querySelectorAll('[data-scroll-to]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target && window.locoScroll) {
          window.locoScroll.scrollTo(target, {
            offset: -100,
            duration: 1200,
            easing: [0.25, 0.0, 0.35, 1.0]
          });
        }
      });
    });
  }

  destroy() {
    if (window.locoScroll) {
      window.locoScroll.destroy();
      window.locoScroll = null;
    }
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}

class Header {
  init() {
    const header = document.querySelector('.c-header');
    if (!header || !window.locoScroll) return;

    let lastScroll = 0;

    window.locoScroll.on('scroll', (args) => {
      const currentScroll = args.scroll.y;
      
      // Hide on scroll down, show on scroll up
      if (currentScroll > lastScroll && currentScroll > 100) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      
      // Add background when scrolled
      header.classList.toggle('is-scrolled', currentScroll > 50);
      
      lastScroll = currentScroll;
    });

    // Active nav state
    this.updateActiveNav();
  }

  updateActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.c-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }
}

class Preloader {
  init() {
    const preloader = document.querySelector('.c-preloader');
    if (!preloader) {
      document.documentElement.classList.remove('is-loading');
      return;
    }

    const text = preloader.querySelector('.c-preloader_text');
    const tl = gsap.timeline();
    
    // Scramble effect on preloader text
    if (text) {
      tl.add(scrambleText(text, 1.5));
    }
    
    // Fade out preloader
    tl.to(preloader, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.3,
      onComplete: () => {
        document.documentElement.classList.remove('is-loading');
        preloader.remove();
      }
    });

    return tl;
  }
}

class Animations {
  init() {
    // Animate stats counters
    this.animateStats();
    
    // Parallax hero
    this.heroParallax();
    
    // Code copy buttons
    this.initCodeCopy();
  }

  animateStats() {
    document.querySelectorAll('.c-stat__value').forEach(stat => {
      const text = stat.textContent.trim();
      const hasNumber = /\d/.test(text);
      
      if (!hasNumber) return;

      ScrollTrigger.create({
        trigger: stat,
        scroller: '[data-scroll-container]',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          // Extract number and suffix
          const match = text.match(/^([\d.]+)(.*)$/);
          if (!match) return;
          
          const endValue = parseFloat(match[1]);
          const suffix = match[2];
          const obj = { value: 0 };
          
          gsap.to(obj, {
            value: endValue,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              const current = obj.value % 1 === 0 
                ? Math.floor(obj.value) 
                : obj.value.toFixed(1);
              stat.textContent = current + suffix;
            }
          });
        }
      });
    });
  }

  heroParallax() {
    const hero = document.querySelector('.c-hero');
    if (!hero || !window.locoScroll) return;

    window.locoScroll.on('scroll', (args) => {
      const progress = args.scroll.y / window.innerHeight;
      if (progress <= 1) {
        gsap.to(hero, {
          y: progress * 150,
          opacity: Math.max(0.2, 1 - progress * 0.8),
          duration: 0
        });
      }
    });
  }

  initCodeCopy() {
    document.querySelectorAll('.c-code-block').forEach((block, index) => {
      // Add copy button
      const wrapper = block.closest('.c-code-wrapper');
      if (!wrapper || wrapper.querySelector('.c-code-copy')) return;

      const btn = document.createElement('button');
      btn.className = 'c-code-copy';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      
      btn.addEventListener('click', () => {
        const code = block.textContent.trim();
        navigator.clipboard.writeText(code).then(() => {
          btn.querySelector('span').textContent = 'Copied!';
          setTimeout(() => {
            btn.querySelector('span').textContent = 'Copy';
          }, 2000);
        });
      });

      wrapper.style.position = 'relative';
      wrapper.appendChild(btn);
    });
  }
}

// ── BARBA PAGE TRANSITIONS ──────────────────────────────

function initBarba() {
  barba.init({
    sync: true,
    debug: false,
    timeout: 7000,
    
    transitions: [{
      name: 'default',
      
      async leave(data) {
        const done = this.async();
        
        // Fade out
        gsap.to(data.current.container, {
          opacity: 0,
          y: -30,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: done
        });
      },

      async enter(data) {
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Re-initialize scroll
        const scroll = new Scroll();
        scroll.init();
        
        // Animate in
        const container = data.next.container;
        const heroTitle = container.querySelector('.c-hero__title');
        
        gsap.set(container, { opacity: 0, y: 30 });
        
        const tl = gsap.timeline();
        
        tl.to(container, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        });
        
        // Scramble hero title
        if (heroTitle) {
          tl.add(scrambleText(heroTitle, 1.2), "-=0.4");
        }
        
        // Re-init modules
        const header = new Header();
        header.init();
        
        const animations = new Animations();
        animations.init();
        
        // Update page class
        document.body.className = data.next.namespace || '';
      }
    }]
  });
}

// ── INITIALIZE ───────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  // Load dependencies
  try {
    await loadScripts(deps);
  } catch (error) {
    console.error('Failed to load dependencies:', error);
    document.documentElement.classList.remove('is-loading');
    return;
  }

  // Initialize core modules
  const preloader = new Preloader();
  await preloader.init();

  const scroll = new Scroll();
  scroll.init();

  const header = new Header();
  setTimeout(() => header.init(), 100);

  const animations = new Animations();
  animations.init();

  // Initialize Barba
  initBarba();
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.locoScroll) {
    window.locoScroll.update();
  }
});

// Resize handler
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.locoScroll) {
      window.locoScroll.update();
    }
    ScrollTrigger.refresh();
  }, 250);
});