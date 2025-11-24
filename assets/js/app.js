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
  if (!element) return Promise.resolve();
  
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
      window.locoScroll = null;
    }

    this.scrollContainer = document.querySelector('[data-scroll-container]');
    if (!this.scrollContainer) {
      console.warn('No scroll container found');
      return;
    }

    console.log('Initializing Locomotive Scroll on:', this.scrollContainer);

    // Initialize with better momentum settings
    this.instance = new LocomotiveScroll({
      el: this.scrollContainer,
      smooth: true,
      multiplier: 1.2,
      lerp: 0.06,
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
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded');
      return;
    }

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
        setTimeout(() => {
          this.instance.update();
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }, 100);
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
    
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(t => t.kill());
      ScrollTrigger.clearMatchMedia();
      ScrollTrigger.clearScrollMemory();
    }
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
      console.log('No preloader element found');
      document.documentElement.classList.remove('is-loading');
      return Promise.resolve();
    }

    // Check for preloader text - try both class names
    let text = preloader.querySelector('.c-preloader_text');
    if (!text) {
      text = preloader.querySelector('.c-preloader__text');
    }
    
    const tl = gsap.timeline();
    
    // Scramble effect on preloader text if it exists
    if (text) {
      console.log('Animating preloader text');
      tl.add(scrambleText(text, 1.5));
    } else {
      console.warn('Preloader text element not found');
    }
    
    // Fade out preloader
    tl.to(preloader, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: text ? 0.3 : 0,
      onComplete: () => {
        console.log('Preloader animation complete');
        document.documentElement.classList.remove('is-loading');
        preloader.style.display = 'none';
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
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('ScrollTrigger not loaded');
      return;
    }

    // Animate stats counters
    this.animateStats();
    
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

class DynamicIslandNav {
  constructor() {
    this.island = null;
    this.menu = null;
    this.closeBtn = null;
    this.menuLinks = [];
    this.isOpen = false;
    this.timeline = null;
  }

  init() {
    this.island = document.getElementById('navIsland');
    this.menu = document.getElementById('navMenu');
    this.closeBtn = document.getElementById('navClose');
    this.menuLinks = [...document.querySelectorAll('[data-nav-link]')];

    if (!this.island || !this.menu) {
      console.warn('Dynamic Island elements not found');
      return;
    }

    this.setupEventListeners();
    this.prepareAnimation();
  }

  setupEventListeners() {
    // Open menu
    this.island.addEventListener('click', () => this.open());
    
    // Close menu
    this.closeBtn.addEventListener('click', () => this.close());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Handle menu link clicks
    this.menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // If it's an anchor link on the same page
        if (href.startsWith('#')) {
          e.preventDefault();
          this.close();
          
          // Scroll to section after menu closes
          setTimeout(() => {
            const target = document.querySelector(href);
            if (target && window.locoScroll) {
              window.locoScroll.scrollTo(target, {
                offset: -100,
                duration: 1200
              });
            }
          }, 600);
        } else {
          // For page navigation, just close menu
          // Let Barba handle the page transition
          this.close();
        }
      });
    });
  }

  prepareAnimation() {
    // Set initial states
    gsap.set(this.menu, { opacity: 0 });
    gsap.set(this.menuLinks, { 
      opacity: 0, 
      y: 50 
    });
    gsap.set(this.closeBtn, { 
      opacity: 0, 
      scale: 0.8,
      rotation: -90 
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    console.log('Opening menu');

    // Disable scroll
    document.body.classList.add('menu-active');
    this.menu.classList.add('is-active');
    
    if (window.locoScroll) {
      window.locoScroll.stop();
    }

    // Create opening animation timeline
    this.timeline = gsap.timeline();
    
    // Fade in menu background
    this.timeline.to(this.menu, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });

    // Animate close button
    this.timeline.to(this.closeBtn, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.4,
      ease: "back.out(1.7)"
    }, "-=0.2");

    // Stagger menu links
    this.timeline.to(this.menuLinks, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power3.out"
    }, "-=0.3");

    // Scramble effect on each link text
    this.menuLinks.forEach((link, index) => {
      const textElement = link.querySelector('.c-nav-menu__link-text');
      if (textElement) {
        this.timeline.add(
          scrambleText(textElement, 0.6),
          `-=${0.6 - (index * 0.05)}`
        );
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    console.log('Closing menu');

    // Create closing animation timeline
    const closeTimeline = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('menu-active');
        this.menu.classList.remove('is-active');
        
        if (window.locoScroll) {
          window.locoScroll.start();
        }
      }
    });

    // Fade out links
    closeTimeline.to(this.menuLinks, {
      opacity: 0,
      y: -30,
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.in"
    });

    // Fade out close button
    closeTimeline.to(this.closeBtn, {
      opacity: 0,
      scale: 0.8,
      rotation: 90,
      duration: 0.3,
      ease: "power2.in"
    }, "-=0.2");

    // Fade out menu background
    closeTimeline.to(this.menu, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.1");
  }

  destroy() {
    if (this.timeline) {
      this.timeline.kill();
    }
    document.body.classList.remove('menu-active');
    if (this.menu) {
      this.menu.classList.remove('is-active');
    }
  }
}

// ── BARBA PAGE TRANSITIONS ──────────────────────────────

function initBarba() {
  if (typeof barba === 'undefined') {
    console.warn('Barba.js not loaded - skipping page transitions');
    return;
  }

  console.log('Initializing Barba.js');

  barba.init({
    sync: true,
    debug: true, // Enable debug for troubleshooting
    timeout: 7000,
    prevent: ({ el }) => {
      // Prevent Barba from handling anchor links
      return el.getAttribute('href').startsWith('#');
    },
    
    transitions: [{
      name: 'default',
      
      async leave(data) {
        console.log('Leaving page:', data.current.url.href);
        const done = this.async();
        
        // Close menu if open
        if (window.dynamicNavInstance && window.dynamicNavInstance.isOpen) {
          window.dynamicNavInstance.close();
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        document.body.classList.add('is-transitioning');
        
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
        console.log('Entering page:', data.next.url.href);
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Destroy previous instances
        console.log('Destroying previous instances...');
        if (window.scrollInstance) {
          window.scrollInstance.destroy();
        }
        if (window.headerInstance) {
          window.headerInstance.destroy();
        }
        if (window.animationsInstance) {
          window.animationsInstance.destroy();
        }
        if (window.dynamicNavInstance) {
          window.dynamicNavInstance.destroy();
        }
        
        // Wait for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // FIX: Set container to visible immediately to prevent white screen
        const container = data.next.container;
        gsap.set(container, { opacity: 1, y: 0 });
        
        // Remove transitioning class
        document.body.classList.remove('is-transitioning');
        
        console.log('Re-initializing scroll...');
        const scroll = new Scroll();
        scroll.init();
        window.scrollInstance = scroll;
        
        // Animate hero title if present
        const heroTitle = container.querySelector('.c-hero__title');
        
        const tl = gsap.timeline();
        
        // Scramble hero title
        if (heroTitle) {
          console.log('Animating hero title');
          tl.add(scrambleText(heroTitle, 1.2));
        }
        
        // Re-init modules with delay
        setTimeout(() => {
          console.log('Re-initializing modules...');
          
          const header = new Header();
          header.init();
          window.headerInstance = header;
          
          const animations = new Animations();
          animations.init();
          window.animationsInstance = animations;

          const dynamicNav = new DynamicIslandNav();
          dynamicNav.init();
          window.dynamicNavInstance = dynamicNav;
          
          console.log('All modules re-initialized');
        }, 200);
        
        // Update page class
        document.body.className = data.next.namespace || '';
      },

      async beforeLeave() {
        console.log('Before leave hook');
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
  console.log('DOM Content Loaded - Initializing app');
  
  // Add is-loading class immediately
  document.documentElement.classList.add('is-loading');
  
  // Load dependencies
  try {
    console.log('Loading dependencies...');
    await loadScripts(deps);
    console.log('Dependencies loaded successfully');
  } catch (error) {
    console.error('Failed to load dependencies:', error);
    document.documentElement.classList.remove('is-loading');
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
    console.log('Initializing preloader...');
    const preloader = new Preloader();
    await preloader.init();

    console.log('Initializing smooth scroll...');
    const scroll = new Scroll();
    scroll.init();
    window.scrollInstance = scroll;

    // Delay header init to ensure scroll is ready
    setTimeout(() => {
      console.log('Initializing header...');
      const header = new Header();
      header.init();
      window.headerInstance = header;
    }, 100);

    console.log('Initializing animations...');
    const animations = new Animations();
    animations.init();
    window.animationsInstance = animations;

    console.log('Initializing Dynamic Island Navigation...');
    const dynamicNav = new DynamicIslandNav();
    dynamicNav.init();
    window.dynamicNavInstance = dynamicNav;

    // Initialize Barba
    console.log('Initializing page transitions...');
    initBarba();
    
    console.log('App initialization complete');
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
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
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
  if (window.dynamicNavInstance) {
    window.dynamicNavInstance.destroy();
  }
});

console.log('App.js loaded and ready');
