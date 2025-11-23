// assets/js/app.js

// ── DEPENDENCIES (CDN) ───────────────────────────────────
const deps = [
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js',
  'https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.min.js',
  'https://unpkg.com/split-type' 
];

// OPTIMIZATION: Parallel script loading as requested
async function loadScripts(urls) {
  return Promise.all(urls.map(url => 
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = false; // Maintain execution order per requirements
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    })
  ));
}

// ── UTILS ────────────────────────────────────────────────

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

function scrambleText(element, duration = 1) {
  const originalText = element.innerText;
  const length = originalText.length;
  const tl = gsap.timeline();
  const scrambleObj = { value: 0 };
  
  tl.to(scrambleObj, {
    duration: duration,
    value: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      const progress = scrambleObj.value;
      let result = "";
      for (let i = 0; i < length; i++) {
        if (i / length < progress) {
          result += originalText[i];
        } else if (originalText[i] === " ") {
          result += " ";
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      element.innerText = result;
    }
  });
  
  return tl;
}

// Enhancement: Stats Counter Animation
function animateStats() {
  const animateValue = (el, start, end, duration) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        el.textContent = end;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 16);
  };

  document.querySelectorAll('.c-stat__value').forEach(stat => {
    // Simple parsing to find the number in the string
    const text = stat.textContent;
    const number = parseInt(text.replace(/[^0-9]/g, ''));
    
    if (!isNaN(number)) {
       ScrollTrigger.create({
        trigger: stat,
        start: 'top 80%',
        scroller: '[data-scroll-container]', // Important for Locomotive
        once: true,
        onEnter: () => {
          // Only animate if we extracted a valid number
           stat.textContent = '0'; // Reset for animation
           animateValue(stat, 0, number, 2000);
           // Restore suffix if needed (basic implementation)
           setTimeout(() => { stat.textContent = text; }, 2000);
        }
      });
    }
  });
}

// Enhancement: Code Copy Functionality
function initCodeCopy() {
    // Inject copy buttons if they don't exist
    document.querySelectorAll('.c-code-wrapper').forEach((wrapper, index) => {
        if(!wrapper.querySelector('.c-code-copy')) {
            const btn = document.createElement('button');
            btn.className = 'c-code-copy';
            btn.textContent = 'Copy';
            btn.dataset.copyTarget = `code-${index}`;
            
            const pre = wrapper.querySelector('pre');
            if(pre) pre.id = `code-${index}`;
            
            wrapper.appendChild(btn);
            
            btn.addEventListener('click', () => {
                const code = pre.textContent;
                navigator.clipboard.writeText(code);
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            });
        }
    });
}

// ── MODULES ──────────────────────────────────────────────

class Scroll {
  init() {
    if (window.locoScroll) window.locoScroll.destroy();

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

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.scrollerProxy(scrollContainer, {
      scrollTop(value) {
        return arguments.length ? this.instance.scrollTo(value, 0, 0) : this.instance.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
      },
      pinType: scrollContainer.style.transform ? "transform" : "fixed"
    });

    this.instance.on('scroll', ScrollTrigger.update);
    ScrollTrigger.refresh();
    
    // Enhancement: Parallax Hero
    const hero = document.querySelector('.c-hero');
    if (hero) {
      this.instance.on('scroll', (args) => {
        const progress = args.scroll.y / window.innerHeight;
        hero.style.transform = `translateY(${progress * 30}%)`;
        hero.style.opacity = 1 - progress * 0.8;
      });
    }
    
    // FIX: Scroll Anchors
    document.querySelectorAll('[data-scroll-to]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (target && window.locoScroll) {
          window.locoScroll.scrollTo(target, { offset: -100, duration: 1200 });
        }
      });
    });
  }
}

class Header {
  init() {
    const header = document.querySelector('.c-header');
    if (!header || !window.locoScroll) return;

    let lastScroll = 0;

    window.locoScroll.on('scroll', (args) => {
      const currentScroll = args.scroll.y;
      
      if (currentScroll > lastScroll && currentScroll > 100) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      
      header.classList.toggle('is-scrolled', currentScroll > 50);
      lastScroll = currentScroll;
    });
  }
}

class Load {
  init() {
    // FIX: Robust Preloader Logic
    const preloader = document.querySelector('.c-preloader');
    if (!preloader) {
        document.documentElement.classList.remove('is-loading');
        return;
    }

    const text = preloader.querySelector('.c-preloader_text');
    const tl = gsap.timeline();
    
    if (text) {
        tl.add(scrambleText(text, 1.5));
    }

    tl.to(preloader, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
            document.documentElement.classList.remove('is-loading');
            preloader.remove();
        }
    }, "+=0.3"); // Add delay
  }
}

// ── INIT ─────────────────────────────────────────────────
document.documentElement.classList.remove('has-no-js');

window.addEventListener('DOMContentLoaded', async () => {
  await loadScripts(deps);
  
  const scroll = new Scroll();
  const header = new Header();
  const loader = new Load();

  // Init core
  scroll.init();
  loader.init();
  initCodeCopy(); // Enhancement
  animateStats(); // Enhancement
  
  setTimeout(() => header.init(), 100);

  barba.init({
    sync: true,
    debug: true,
    timeout: 7000,
    transitions: [{
      name: 'scramble-transition',
      
      async leave(data) {
        const done = this.async();
        gsap.to(data.current.container, {
          opacity: 0,
          y: -50,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: done
        });
      },

      async enter(data) {
        scroll.init();
        initCodeCopy(); // Re-init on new page
        animateStats(); // Re-init stats
        
        const heroTitle = data.next.container.querySelector('.c-hero__title');
        const nextContainer = data.next.container;
        
        gsap.set(nextContainer, { opacity: 0, y: 50 });
        
        const tl = gsap.timeline();
        tl.to(nextContainer, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        
        if(heroTitle) {
            tl.add(scrambleText(heroTitle, 1.2), "-=0.6"); 
        }
        
        header.init();
      }
    }]
  });
});
