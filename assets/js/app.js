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
  try {
    return await Promise.all(urls.map(url => 
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load: ${url}`));
        document.head.appendChild(script);
      })
    ));
  } catch (error) {
    console.error('Script loading failed:', error);
    document.documentElement.classList.remove('is-loading');
    throw error;
  }
}

// ── UTILITIES ────────────────────────────────────────────

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ── SCRAMBLE TEXT EFFECT ─────────────────────────────────
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function scrambleText(element, duration = 1) {
  if (!element) return;
  
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
  constructor() {
    this.instance = null;
    this.scrollContainer = null;
    this.scrollHandlers = [];
  }

  init() {
    // Clean up any existing instance
    if (window.locoScroll) {
      window.locoScroll.destroy();
    }

    this.scrollContainer = document.querySelector('[data-scroll-container]');
    if (!this.scrollContainer) {
      console.warn('No scroll container found');
      return;
    }

    // Initialize with better momentum settings
    this.instance = new LocomotiveScroll({
      el: this.scrollContainer,
      smooth: true,
      multiplier: 1.2,  // Increased for more momentum
      lerp: 0.06,       // Decreased for smoother, longer scroll
      class: 'is-inview',
      offset: ['30%', 0],
      repeat: false,
      firefoxMultiplier: 100,
      touchMultiplier: 3,
      scrollFromAnywhere: true,
      smartphone: {
        smooth: true,
        direction: 'vertical',
        multiplier: 2.5,
        lerp: 0.1,
        class: 'is-inview',
        offset: ['20%', 0]
      },
      tablet: {
        smooth: true,
        direction: 'vertical',
        multiplier: 2.0,
        lerp: 0.08,
        class: 'is-inview',
        offset: ['20%', 0]
      }
    });

    window.locoScroll = this.instance;

    // Better ScrollTrigger sync
    this.syncScrollTrigger();
    
    // Initialize anchor scrolling
    this.initScrollAnchors();
    
    // Update on images load
    this.updateOnImagesLoad();
  }

  syncScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);
    
    ScrollTrigger.scrollerProxy(this.scrollContainer, {
      scrollTop: (value) => {
        return arguments.length 
          ? this.instance.scrollTo(value, 0, 0) 
          : this.instance.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      },
      pinType: this.scrollContainer.style.transform ? "transform" : "fixed"
    });

    const scrollHandler = ScrollTrigger.update;
    this.instance.on('scroll', scrollHandler);
    this.scrollHandlers.push(scrollHandler);
    
    ScrollTrigger.addEventListener('refresh', () => {
      if (this.instance) this.instance.update();
    });
    
    ScrollTrigger.defaults({ scroller: this.scrollContainer });
    ScrollTrigger.refresh();
  }

  updateOnImagesLoad() {
    const images = this.scrollContainer.querySelectorAll('img');
    let loadedCount = 0;
    
    const updateScroll = () => {
      if (this.instance) {
        this.instance.update();
        ScrollTrigger.refresh();
      }
    };

    if (images.length === 0) {
      updateScroll();
      return;
    }
    
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === images.length) {
          updateScroll();
        }
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount === images.length) {
            updateScroll();
          }
        }, { once: true });
      }
    });
  }

  initScrollAnchors() {
    document.querySelectorAll('[data-scroll-to]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target && this.instance) {
          this.instance.scrollTo(target, {
            offset: -100,
            duration: 1200,
            easing: [0.25, 0.0, 0.35, 1.0]
          });
        }
      });
    });
  }

  destroy() {
    // Clean up event listeners
    this.scrollHandlers.forEach(handler => {
      if (this.instance) {
        this.instance.off('scroll', handler);
      }
    });
    this.scrollHandlers = [];
    
    if (window.locoScroll) {
      window.locoScroll.destroy();
      window.locoScroll = null;
    }
    
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    
    ScrollTrigger.getAll().forEach(t => t.kill());
    ScrollTrigger.clearMatchMedia();
    ScrollTrigger.clearScrollMemory();
  }
}

class Header {
  constructor() {
    this.header = null;
    this.lastScroll = 0;
    this.scrollHandler = null;
  }

  init() {
    this.header = document.querySelector('.c-header');
    if (!this.header || !window.locoScroll) return;

    this.scrollHandler = (args) => {
      const currentScroll = args.scroll.y;
      
      // Hide on scroll down, show on scroll up
      if (currentScroll > this.lastScroll && currentScroll > 100) {
        this.header.classList.add('is-hidden');
      } else {
        this.header.classList.remove('is-hidden');
      }
      
      // Add background when scrolled
      this.header.classList.toggle('is-scrolled', currentScroll > 50);
      
      this.lastScroll = currentScroll;
    };

    window.locoScroll.on('scroll', this.scrollHandler);

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

  destroy() {
    if (window.locoScroll && this.scrollHandler) {
      window.locoScroll.off('scroll', this.scrollHandler);
    }
  }
}

class Preloader {
  init() {
    const preloader = document.querySelector('.c-preloader');
    if (!preloader) {
      document.documentElement.classList.remove('is-loading');
      return Promise.resolve();
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
  constructor() {
    this.scrollTriggers = [];
  }

  init() {
    // Animate stats counters
    this.animateStats();
    
    // NO HERO PARALLAX - Removed to prevent sliding under
    // this.heroParallax(); // REMOVED
    
    // Code copy buttons
    this.initCodeCopy();
    
    // Add fade in animations
    this.initFadeAnimations();
  }

  animateStats() {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;
    
    document.querySelectorAll('.c-stat__value').forEach(stat => {
      const text = stat.textContent.trim();
      const hasNumber = /\d/.test(text);
      
      if (!hasNumber) return;

      const trigger = ScrollTrigger.create({
        trigger: stat,
        scroller: scrollContainer,
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
      
      this.scrollTriggers.push(trigger);
    });
  }

  initFadeAnimations() {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;

    // Fade in elements with data-fade attribute
    document.querySelectorAll('[data-fade]').forEach(el => {
      gsap.set(el, { opacity: 0, y: 30 });
      
      const trigger = ScrollTrigger.create({
        trigger: el,
        scroller: scrollContainer,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out"
          });
        }
      });
      
      this.scrollTriggers.push(trigger);
    });
  }

  initCodeCopy() {
    document.querySelectorAll('.c-code-block').forEach((block) => {
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
        }).catch(err => {
          console.error('Failed to copy:', err);
        });
      });

      wrapper.style.position = 'relative';
      wrapper.appendChild(btn);
    });
  }

  destroy() {
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.scrollTriggers = [];
  }
}

// ── BARBA PAGE TRANSITIONS ──────────────────────────────

function initBarba() {
  if (typeof barba === 'undefined') {
    console.warn('Barba.js not loaded');
    return;
  }

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
        
        // Destroy previous instances
        if (window.scrollInstance) {
          window.scrollInstance.destroy();
        }
        if (window.headerInstance) {
          window.headerInstance.destroy();
        }
        if (window.animationsInstance) {
          window.animationsInstance.destroy();
        }
        
        // Re-initialize scroll
        const scroll = new Scroll();
        scroll.init();
        window.scrollInstance = scroll;
        
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
        
        // Re-init modules with delay
        setTimeout(() => {
          const header = new Header();
          header.init();
          window.headerInstance = header;
          
          const animations = new Animations();
          animations.init();
          window.animationsInstance = animations;
        }, 100);
        
        // Update page class
        document.body.className = data.next.namespace || '';
      },

      async beforeLeave() {
        // Clean up before leaving
        if (window.animationsInstance) {
          window.animationsInstance.destroy();
        }
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
    // Continue with basic functionality
    return;
  }

  // Wait for GSAP to be ready
  if (typeof gsap === 'undefined') {
    console.error('GSAP failed to load');
    document.documentElement.classList.remove('is-loading');
    return;
  }

  // Initialize core modules
  try {
    const preloader = new Preloader();
    await preloader.init();

    const scroll = new Scroll();
    scroll.init();
    window.scrollInstance = scroll;

    // Delay header init to ensure scroll is ready
    setTimeout(() => {
      const header = new Header();
      header.init();
      window.headerInstance = header;
    }, 100);

    const animations = new Animations();
    animations.init();
    window.animationsInstance = animations;

    // Initialize Barba
    initBarba();
  } catch (error) {
    console.error('Initialization error:', error);
    document.documentElement.classList.remove('is-loading');
  }
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.locoScroll) {
    requestAnimationFrame(() => {
      window.locoScroll.update();
      ScrollTrigger.refresh();
    });
  }
});

// Optimized resize handler
const handleResize = debounce(() => {
  if (window.locoScroll) {
    window.locoScroll.update();
  }
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
}, 300);

window.addEventListener('resize', handleResize);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.scrollInstance) {
    window.scrollInstance.destroy();
  }
  if (window.headerInstance) {
    window.headerInstance.destroy();
  }
  if (window.animationsInstance) {
    window.animationsInstance.destroy();
  }
});