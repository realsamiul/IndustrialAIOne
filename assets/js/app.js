// assets/js/app.js

// ── DEPENDENCIES (CDN) ───────────────────────────────────
// We load SplitType for text manipulation and GSAP for the animation engine
const deps = [
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js',
  'https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.min.js',
  'https://unpkg.com/split-type' 
];

async function loadScripts(urls) {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
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

// ── UTILS: Scramble Text Effect ──────────────────────────
// Mimics the high-end "decoding" effect seen on the reference site
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

function scrambleText(element, duration = 1) {
  const originalText = element.innerText;
  const length = originalText.length;
  
  // Create a timeline for this specific element
  const tl = gsap.timeline();
  
  // Object to tween
  const scrambleObj = { value: 0 };
  
  tl.to(scrambleObj, {
    duration: duration,
    value: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      const progress = scrambleObj.value;
      let result = "";
      
      for (let i = 0; i < length; i++) {
        // If we are past the progress point for this char, show original
        if (i / length < progress) {
          result += originalText[i];
        } else if (originalText[i] === " ") {
          result += " ";
        } else {
          // Otherwise show random char
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      element.innerText = result;
    }
  });
  
  return tl;
}

// ── MODULES ──────────────────────────────────────────────

class Scroll {
  init() {
    // Destroy existing instance if present (for Barba re-init)
    if (window.locoScroll) window.locoScroll.destroy();

    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;

    this.instance = new LocomotiveScroll({
      el: scrollContainer,
      smooth: true,
      multiplier: 1.0, // Exact friction of original site
      lerp: 0.1,       // "Heaviness" of the scroll (lower = heavier)
      smartphone: { smooth: true },
      tablet: { smooth: true }
    });

    window.locoScroll = this.instance;

    // Sync ScrollTrigger with Locomotive Scroll
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
  }
}

class Header {
  init() {
    const header = document.querySelector('.c-header');
    if (!header || !window.locoScroll) return;

    let lastScroll = 0;

    // Use Locomotive's scroll event for native-feeling nav hiding
    window.locoScroll.on('scroll', (args) => {
      const currentScroll = args.scroll.y;
      
      if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling Down -> Hide
        header.classList.add('is-hidden');
      } else {
        // Scrolling Up -> Show
        header.classList.remove('is-hidden');
      }
      
      // Solid background when not at top
      header.classList.toggle('is-scrolled', currentScroll > 50);
      
      lastScroll = currentScroll;
    });
  }
}

class Load {
  init() {
    const preloader = document.querySelector('.c-preloader');
    if (!preloader) return;

    const text = preloader.querySelector('.c-preloader_text');
    
    // Scramble the loading text
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
    });
  }
}

// ── INIT ─────────────────────────────────────────────────
document.documentElement.classList.remove('has-no-js');

window.addEventListener('DOMContentLoaded', async () => {
  await loadScripts(deps);
  
  // 1. Initialize Core Modules
  const scroll = new Scroll();
  const header = new Header();
  const loader = new Load();

  scroll.init();
  loader.init();
  
  // Wait a moment for layout to settle before init header listeners
  setTimeout(() => header.init(), 100);

  // 2. Initialize Barba for Page Transitions
  barba.init({
    sync: true,
    debug: true,
    timeout: 7000,
    transitions: [{
      name: 'scramble-transition',
      
      async leave(data) {
        const done = this.async();
        
        // Animate out current container
        gsap.to(data.current.container, {
          opacity: 0,
          y: -50,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: done
        });
      },

      async enter(data) {
        // 1. Re-init Scroll on new page immediately
        scroll.init();
        
        // 2. Scramble Effect on Hero Title of new page
        const heroTitle = data.next.container.querySelector('.c-hero__title');
        const nextContainer = data.next.container;
        
        // Set initial state
        gsap.set(nextContainer, { opacity: 0, y: 50 });
        
        // Animate In
        const tl = gsap.timeline();
        tl.to(nextContainer, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        
        if(heroTitle) {
            // Split text first to avoid layout shift during scramble
            // Note: For simple scramble, we just target the element text content
            tl.add(scrambleText(heroTitle, 1.2), "-=0.6"); 
        }
        
        // 3. Re-init header logic for new scroll instance
        header.init();
      }
    }]
  });
});

