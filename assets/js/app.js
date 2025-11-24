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
    this.resizeObserver = null;
  }

  init() {
    // Clean up any existing instance
    this.destroy();

    this.scrollContainer = document.querySelector('[data-scroll-container]');
    if (!this.scrollContainer) {
      console.warn('No scroll container found');
      return;
    }

    // Ensure container is visible
    this.scrollContainer.style.visibility = 'visible';
    this.scrollContainer.style.opacity = '1';

    console.log('Initializing Locomotive Scroll on:', this.scrollContainer);

    // Initialize with better momentum settings
    try {
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
      
      // Setup resize observer for dynamic content
      this.setupResizeObserver();
      
    } catch (error) {
      console.error('Failed to initialize Locomotive Scroll:', error);
      // Fallback to native scroll
      this.scrollContainer.style.overflowY = 'auto';
    }
  }

  syncScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !this.instance) {
      console.warn('GSAP, ScrollTrigger, or Locomotive instance not available');
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

    const scrollHandler = () => ScrollTrigger.update();
    this.instance.on('scroll', scrollHandler);
    this.scrollHandlers.push(scrollHandler);
    
    ScrollTrigger.addEventListener('refresh', () => {
      if (this.instance) this.instance.update();
    });
    
    ScrollTrigger.defaults({ scroller: this.scrollContainer });
    ScrollTrigger.refresh();
  }

  setupResizeObserver() {
    if (!this.scrollContainer || !this.instance) return;
    
    // Use ResizeObserver for better performance
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(debounce(() => {
        if (this.instance) {
          this.instance.update();
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }
      }, 250));
      
      this.resizeObserver.observe(this.scrollContainer);
    }
  }

  updateOnImagesLoad() {
    if (!this.scrollContainer) return;
    
    const images = this.scrollContainer.querySelectorAll('img');
    let loadedCount = 0;
    
    const updateScroll = debounce(() => {
      if (this.instance) {
        this.instance.update();
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }
    }, 100);

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
        const handleLoad = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            updateScroll();
          }
        };
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleLoad, { once: true }); // Handle errors too
      }
    });
  }

  initScrollAnchors() {
    if (!this.scrollContainer) return;
    
    const handleAnchorClick = (e) => {
      const link = e.target.closest('[data-scroll-to]');
      if (!link) return;
      
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
    };
    
    // Use event delegation for better performance
    document.addEventListener('click', handleAnchorClick);
    this.scrollHandlers.push(() => document.removeEventListener('click', handleAnchorClick));
  }

  destroy() {
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Clean up event listeners
    this.scrollHandlers.forEach(handler => {
      if (typeof handler === 'function') {
        handler();
      } else if (this.instance) {
        this.instance.off('scroll', handler);
      }
    });
    this.scrollHandlers = [];
    
    // Destroy Locomotive instance
    if (window.locoScroll) {
      window.locoScroll.destroy();
      window.locoScroll = null;
    }
    
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    
    // Clean up ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(t => t.kill());
      ScrollTrigger.clearMatchMedia();
      ScrollTrigger.clearScrollMemory();
    }
    
    // Reset container styles
    if (this.scrollContainer) {
      this.scrollContainer.style.transform = '';
      this.scrollContainer.style.willChange = '';
      this.scrollContainer.style.position = '';
    }
  }
}

class Header {
  constructor() {
    this.header = null;
    this.lastScroll = 0;
    this.scrollHandler = null;
    this.rafId = null;
    this.ticking = false;
  }

  init() {
    this.header = document.querySelector('.c-header');
    if (!this.header) {
      console.warn('Header element not found');
      return;
    }
    
    if (!window.locoScroll) {
      console.warn('Locomotive Scroll not initialized');
      return;
    }

    // Use RAF for better performance
    this.scrollHandler = (args) => {
      if (!this.ticking) {
        this.rafId = requestAnimationFrame(() => {
          this.updateHeader(args.scroll.y);
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    window.locoScroll.on('scroll', this.scrollHandler);

    // Active nav state
    this.updateActiveNav();
  }

  updateHeader(currentScroll) {
    // Hide on scroll down, show on scroll up
    if (currentScroll > this.lastScroll && currentScroll > 100) {
      this.header.classList.add('is-hidden');
    } else {
      this.header.classList.remove('is-hidden');
    }
    
    // Add background when scrolled
    this.header.classList.toggle('is-scrolled', currentScroll > 50);
    
    this.lastScroll = currentScroll;
  }

  updateActiveNav() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.c-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      const linkPage = href.split('/').pop();
      if (linkPage === currentPage || 
          (currentPage === 'index.html' && (href === '/' || href === './')) ||
          currentPath.endsWith(href)) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (window.locoScroll && this.scrollHandler) {
      window.locoScroll.off('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    
    this.header = null;
    this.lastScroll = 0;
    this.ticking = false;
  }
}

class Preloader {
  constructor() {
    this.preloader = null;
  }

  init() {
    this.preloader = document.querySelector('.c-preloader');
    if (!this.preloader) {
      console.log('No preloader element found');
      document.documentElement.classList.remove('is-loading');
      return Promise.resolve();
    }

    // Check for preloader text - try both class names
    let text = this.preloader.querySelector('.c-preloader_text, .c-preloader__text');
    
    const tl = gsap.timeline({
      onComplete: () => {
        console.log('Preloader animation complete');
        document.documentElement.classList.remove('is-loading');
        if (this.preloader && this.preloader.parentNode) {
          this.preloader.parentNode.removeChild(this.preloader);
        }
        this.preloader = null;
      }
    });
    
    // Scramble effect on preloader text if it exists
    if (text) {
      console.log('Animating preloader text');
      tl.add(scrambleText(text, 1.5));
    }
    
    // Fade out preloader
    tl.to(this.preloader, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: text ? 0.3 : 0
    });

    return tl;
  }

  destroy() {
    if (this.preloader && this.preloader.parentNode) {
      this.preloader.parentNode.removeChild(this.preloader);
    }
    this.preloader = null;
  }
}

class Animations {
  constructor() {
    this.scrollTriggers = [];
    this.animations = [];
  }

  init() {
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('ScrollTrigger not loaded');
      return;
    }

    // Clean up any existing triggers
    this.destroy();

    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Animate stats counters
      this.animateStats();
      
      // Code copy buttons
      this.initCodeCopy();
      
      // Add fade in animations
      this.initFadeAnimations();
      
      // Refresh ScrollTrigger after all animations are set up
      ScrollTrigger.refresh();
    });
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
          
          const anim = gsap.to(obj, {
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
          
          this.animations.push(anim);
        }
      });
      
      this.scrollTriggers.push(trigger);
    });
  }

  initFadeAnimations() {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;

    // Fade in elements with data-fade attribute
    document.querySelectorAll('[data-fade]').forEach((el, index) => {
      gsap.set(el, { opacity: 0, y: 30 });
      
      const trigger = ScrollTrigger.create({
        trigger: el,
        scroller: scrollContainer,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const anim = gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.05, // Stagger effect
            ease: "power2.out"
          });
          
          this.animations.push(anim);
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
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      
      const handleCopy = async () => {
        try {
          const code = block.textContent.trim();
          await navigator.clipboard.writeText(code);
          btn.querySelector('span').textContent = 'Copied!';
          btn.classList.add('is-copied');
          
          setTimeout(() => {
            btn.querySelector('span').textContent = 'Copy';
            btn.classList.remove('is-copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = block.textContent.trim();
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            btn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
              btn.querySelector('span').textContent = 'Copy';
            }, 2000);
          } catch (e) {
            console.error('Fallback copy failed:', e);
          }
          document.body.removeChild(textarea);
        }
      };
      
      btn.addEventListener('click', handleCopy);
      
      wrapper.style.position = 'relative';
      wrapper.appendChild(btn);
    });
  }

  destroy() {
    // Kill all animations
    this.animations.forEach(anim => {
      if (anim && anim.kill) {
        anim.kill();
      }
    });
    this.animations = [];
    
    // Kill all scroll triggers
    this.scrollTriggers.forEach(trigger => {
      if (trigger && trigger.kill) {
        trigger.kill();
      }
    });
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
    this.clickHandler = null;
    this.closeHandler = null;
    this.escHandler = null;
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
    // Create bound handlers for proper cleanup
    this.clickHandler = () => this.open();
    this.closeHandler = () => this.close();
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    
    // Open menu
    this.island.addEventListener('click', this.clickHandler);
    
    // Close menu
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this.closeHandler);
    }
    
    // Close on escape key
    document.addEventListener('keydown', this.escHandler);

    // Handle menu link clicks with event delegation
    this.menu.addEventListener('click', (e) => {
      const link = e.target.closest('[data-nav-link]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
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
      }
      // For regular links, let Barba handle the transition
      // The menu will stay open to act as a curtain
    });
  }

  prepareAnimation() {
    // Set initial states
    gsap.set(this.menu, { opacity: 0 });
    gsap.set(this.menuLinks, { 
      opacity: 0, 
      y: 50 
    });
    
    if (this.closeBtn) {
      gsap.set(this.closeBtn, { 
        opacity: 0, 
        scale: 0.8,
        rotation: -90 
      });
    }
  }

  open() {
    if (this.isOpen || !this.menu) return;
    this.isOpen = true;

    console.log('Opening menu');

    // Disable scroll
    document.body.classList.add('menu-active');
    this.menu.classList.add('is-active');
    
    if (window.locoScroll) {
      window.locoScroll.stop();
    }

    // Kill existing timeline if any
    if (this.timeline) {
      this.timeline.kill();
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
    if (this.closeBtn) {
      this.timeline.to(this.closeBtn, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.4,
        ease: "back.out(1.7)"
      }, "-=0.2");
    }

    // Stagger menu links
    if (this.menuLinks.length > 0) {
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
  }

  close() {
    if (!this.isOpen || !this.menu) return;
    this.isOpen = false;

    console.log('Closing menu');

    // Kill existing timeline if any
    if (this.timeline) {
      this.timeline.kill();
    }

    // Create closing animation timeline
    const closeTimeline = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('menu-active');
        this.menu.classList.remove('is-active');
        
        if (window.locoScroll) {
          window.locoScroll.start();
        }
        
        // Reset for next animation
        this.prepareAnimation();
      }
    });

    // Fade out links
    if (this.menuLinks.length > 0) {
      closeTimeline.to(this.menuLinks, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        stagger: 0.03,
        ease: "power2.in"
      });
    }

    // Fade out close button
    if (this.closeBtn) {
      closeTimeline.to(this.closeBtn, {
        opacity: 0,
        scale: 0.8,
        rotation: 90,
        duration: 0.3,
        ease: "power2.in"
      }, "-=0.2");
    }

    // Fade out menu background
    closeTimeline.to(this.menu, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.1");
  }

  destroy() {
    // Remove event listeners
    if (this.island && this.clickHandler) {
      this.island.removeEventListener('click', this.clickHandler);
    }
    
    if (this.closeBtn && this.closeHandler) {
      this.closeBtn.removeEventListener('click', this.closeHandler);
    }
    
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
    
    // Kill timeline
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    
    // Clean up classes
    document.body.classList.remove('menu-active');
    if (this.menu) {
      this.menu.classList.remove('is-active');
    }
    
    // Reset state
    this.isOpen = false;
    // Don't null out references - keep them for singleton pattern
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
    debug: false, // Set to true for debugging
    timeout: 7000,
    prevent: ({ el }) => {
      // Prevent Barba from handling certain links
      const href = el.getAttribute('href');
      return !href || 
             href.startsWith('#') || 
             href.startsWith('mailto:') || 
             href.startsWith('tel:') ||
             el.getAttribute('target') === '_blank' ||
             el.classList.contains('no-barba');
    },
    
    transitions: [{
      name: 'default',
      
      async leave(data) {
        console.log('Leaving page:', data.current.url.href);
        const done = this.async();
        
        // Check if menu is currently covering the screen
        const isMenuOpen = window.dynamicNavInstance && window.dynamicNavInstance.isOpen;
        
        document.body.classList.add('is-transitioning');
        
        // LOGIC CHANGE: "Curtain" approach
        // If menu is open, don't fade out - the old page stays visible behind the menu
        // If menu is closed (normal link click), run the fade out animation
        if (isMenuOpen) {
          console.log('Menu is open - keeping old page visible behind curtain');
          done(); 
        } else {
          // Normal fade out for standard navigation
          gsap.to(data.current.container, {
            opacity: 0,
            y: -30,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: done
          });
        }
      },

      async beforeEnter(data) {
        // Scroll to top immediately
        window.scrollTo(0, 0);
        
        // Prepare next container
        const container = data.next.container;
        const scrollContainer = container.querySelector('[data-scroll-container]');
        
        // Ensure visibility
        if (scrollContainer) {
          scrollContainer.style.transform = '';
          scrollContainer.style.willChange = '';
          scrollContainer.style.position = '';
          scrollContainer.style.visibility = 'visible';
          scrollContainer.style.opacity = '1';
        }
        
        // Check if menu is open to determine initial state
        const isMenuOpen = window.dynamicNavInstance && window.dynamicNavInstance.isOpen;
        
        if (isMenuOpen) {
          // If menu is open, make container immediately visible (but hidden behind menu)
          gsap.set(container, { 
            opacity: 1,
            y: 0
          });
        } else {
          // Normal transition - prepare for fade in
          gsap.set(container, { 
            opacity: 0,
            y: 30
          });
        }
      },

      async enter(data) {
        console.log('Entering page:', data.next.url.href);
        
        const isMenuOpen = window.dynamicNavInstance && window.dynamicNavInstance.isOpen;
        const container = data.next.container;
        
        // Destroy page-specific instances (but NOT dynamicNavInstance)
        console.log('Cleaning up page-specific instances...');
        
        if (window.scrollInstance) {
          window.scrollInstance.destroy();
          window.scrollInstance = null;
        }
        
        if (window.headerInstance) {
          window.headerInstance.destroy();
          window.headerInstance = null;
        }
        
        if (window.animationsInstance) {
          window.animationsInstance.destroy();
          window.animationsInstance = null;
        }
        
        // Note: We deliberately DON'T destroy dynamicNavInstance here
        // It needs to persist to maintain menu state
        
        // Update body classes
        document.body.classList.remove('is-transitioning');
        // Don't remove menu-active if menu is open
        
        // LOGIC CHANGE: Handle visibility based on menu state
        if (isMenuOpen) {
          // Page is already visible (set in beforeEnter), just sitting behind the menu
          console.log('New page ready behind menu curtain');
        } else {
          // Normal fade in for standard navigation
          await gsap.to(container, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        }
        
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Re-initialize page-specific modules
        console.log('Re-initializing page modules...');
        
        // Initialize scroll first
        const scroll = new Scroll();
        scroll.init();
        window.scrollInstance = scroll;
        
        // Wait a bit for scroll to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize other modules
        const header = new Header();
        header.init();
        window.headerInstance = header;
        
        const animations = new Animations();
        animations.init();
        window.animationsInstance = animations;
        
        // LOGIC CHANGE: Close menu NOW to reveal the new page
        // This creates the smooth "curtain reveal" effect
        if (isMenuOpen && window.dynamicNavInstance) {
          console.log('Closing menu to reveal new page');
          window.dynamicNavInstance.close();
        }
        
        // Animate hero title if present
        const heroTitle = container.querySelector('.c-hero__title');
        if (heroTitle && !isMenuOpen) { // Only animate if not coming from menu
          scrambleText(heroTitle, 1.2);
        }
        
        console.log('Page transition complete');
      },

      async afterEnter(data) {
        // Final updates after everything is loaded
        setTimeout(() => {
          if (window.scrollInstance && window.scrollInstance.instance) {
            window.scrollInstance.instance.update();
          }
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }, 200);
        
        // Update page namespace
        document.body.className = data.next.namespace || '';
        
        // Update active navigation
        if (window.headerInstance) {
          window.headerInstance.updateActiveNav();
        }
      }
    }],
    
    views: [],
    
    // Global hooks
    requestError(trigger, action, url, response) {
      console.error('Barba request error:', { trigger, action, url, response });
      
      // Fallback to regular navigation on error
      if (url) {
        window.location.href = url.href;
      }
      
      return false;
    }
  });

  // Handle browser back/forward buttons
  barba.hooks.after(() => {
    window.ga && ga('send', 'pageview', location.pathname);
  });
}

// ── INITIALIZE ───────────────────────────────────────────

async function initializeApp() {
  console.log('DOM Content Loaded - Initializing app');
  
  // Check if this is first load or a Barba navigation
  const isFirstLoad = !window.appInitialized;
  window.appInitialized = true;
  
  // Add is-loading class only on first load
  if (isFirstLoad) {
    document.documentElement.classList.add('is-loading');
  }
  
  try {
    // Load dependencies only once
    if (isFirstLoad) {
      console.log('Loading dependencies...');
      await loadScripts(deps);
      console.log('Dependencies loaded successfully');
      
      // Verify GSAP is ready
      if (typeof gsap === 'undefined') {
        throw new Error('GSAP failed to load');
      }
    }
    
    // Initialize preloader only on first load
    if (isFirstLoad) {
      console.log('Initializing preloader...');
      const preloader = new Preloader();
      await preloader.init();
    }
    
    // Initialize smooth scroll
    console.log('Initializing smooth scroll...');
    const scroll = new Scroll();
    scroll.init();
    window.scrollInstance = scroll;
    
    // Small delay to ensure scroll is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize header
    console.log('Initializing header...');
    const header = new Header();
    header.init();
    window.headerInstance = header;
    
    // Initialize animations
    console.log('Initializing animations...');
    const animations = new Animations();
    animations.init();
    window.animationsInstance = animations;
    
    // SINGLETON PATTERN: Only initialize DynamicNav once
    // This allows the menu state to persist across page transitions
    if (!window.dynamicNavInstance) {
      console.log('Initializing Dynamic Island Navigation...');
      const dynamicNav = new DynamicIslandNav();
      dynamicNav.init();
      window.dynamicNavInstance = dynamicNav;
    } else {
      console.log('Dynamic Island Navigation already initialized - maintaining state');
    }
    
    // Initialize Barba only once
    if (isFirstLoad) {
      console.log('Initializing page transitions...');
      initBarba();
    }
    
    console.log('App initialization complete');
    
  } catch (error) {
    console.error('Initialization error:', error);
    document.documentElement.classList.remove('is-loading');
    
    // Fallback: ensure basic functionality
    document.body.style.overflow = 'auto';
  }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page is visible again
    requestAnimationFrame(() => {
      if (window.locoScroll) {
        window.locoScroll.update();
      }
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
