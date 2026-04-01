/**
 * Festival International d'Échecs de Chefchaouen 2026
 * Main JavaScript - Refactored for clarity and enhanced features
 *
 * Features:
 * - Countdown timer with live updates
 * - Staggered reveal animations
 * - Progress bar animations
 * - Asset fallback handling
 * - Respects prefers-reduced-motion
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pad a number to 2 digits (e.g., 5 -> "05")
 */
function pad(value) {
  return String(value).padStart(2, "0");
}

/**
 * Update countdown unit (days, hours, minutes, seconds)
 * Triggers animation if value changed
 */
function setUnitValue(node, value) {
  const next = pad(value);
  if (node.textContent === next) return;

  node.textContent = next;
  node.classList.remove("is-ticking");
  void node.offsetWidth; // Force reflow
  node.classList.add("is-ticking");
}

/**
 * Initialize countdown timer
 * Updates every second until event starts
 */
function initCountdown() {
  const countdown = document.querySelector("[data-countdown]");
  if (!countdown) return;

  const target = countdown.getAttribute("data-target");
  if (!target) return;

  const units = {
    days: countdown.querySelector("[data-unit='days']"),
    hours: countdown.querySelector("[data-unit='hours']"),
    minutes: countdown.querySelector("[data-unit='minutes']"),
    seconds: countdown.querySelector("[data-unit='seconds']")
  };
  const status = countdown.querySelector("[data-countdown-status]");
  const targetDate = new Date(target);

  if (Number.isNaN(targetDate.getTime())) return;

  const update = () => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      // Event has started
      Object.values(units).forEach((node) => {
        if (node) setUnitValue(node, 0);
      });
      if (status) status.textContent = "Le festival a commencé.";
      return false;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (units.days) setUnitValue(units.days, days);
    if (units.hours) setUnitValue(units.hours, hours);
    if (units.minutes) setUnitValue(units.minutes, minutes);
    if (units.seconds) setUnitValue(units.seconds, seconds);

    if (status) {
      status.textContent = "Ouverture officielle le 15 juillet 2026 à 09h00.";
    }

    return true;
  };

  update();
  const timer = window.setInterval(() => {
    const keepRunning = update();
    if (!keepRunning) window.clearInterval(timer);
  }, 1000);
}

/**
 * Initialize staggered reveal animations
 * Elements fade in and slide up as they enter viewport
 * Stagger by 80-120ms between elements for smooth cascade effect
 */
function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  if (!nodes.length) return;

  // If motion is disabled or IntersectionObserver not supported,
  // show all elements immediately
  if (reduceMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Add stagger delay based on element position
      const delay = calculateStagger(entry.target);
      if (delay > 0) {
        entry.target.style.transitionDelay = `${delay}ms`;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -5% 0px" });

  nodes.forEach((node) => observer.observe(node));
}

/**
 * Calculate stagger delay for sequential animations
 * Prevents all elements from animating at once
 * Max delay of 240ms to avoid excessive delays
 */
function calculateStagger(element) {
  if (reduceMotion) return 0;

  // Find all data-reveal siblings that come before this element
  const parent = element.parentElement;
  if (!parent) return 0;

  const siblings = Array.from(parent.querySelectorAll("[data-reveal]"));
  const index = siblings.indexOf(element);

  // Stagger by 80ms increments, cap at 240ms
  const maxIndex = 3; // Limit to prevent excessive delays
  const cappedIndex = Math.min(index, maxIndex);
  return cappedIndex * 80;
}

/**
 * Initialize progress bar animations
 * Bars animate from 0 to their data-progress value when visible
 */
function initProgressBars() {
  const bars = document.querySelectorAll("[data-progress]");
  if (!bars.length) return;

  const animate = (bar) => {
    const value = Number(bar.getAttribute("data-progress")) || 0;
    const fill = bar.querySelector(".progress__bar");
    if (!fill) return;

    requestAnimationFrame(() => {
      fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
    });
  };

  // If motion is disabled or IntersectionObserver not supported,
  // animate immediately
  if (reduceMotion || !("IntersectionObserver" in window)) {
    bars.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  bars.forEach((bar) => observer.observe(bar));
}

/**
 * Initialize asset fallback handling
 * Hides broken images gracefully
 */
function initAssetFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const mode = img.getAttribute("data-fallback");
      if (mode === "hide-parent" && img.parentElement) {
        img.parentElement.classList.add("is-hidden");
        const shell = img.closest(".hero__shell");
        if (shell) shell.classList.add("is-single");
      } else {
        img.classList.add("is-hidden");
      }
    }, { once: true });
  });
}

/**
 * Initialize presentation deck controls
 * Adds slide navigation, progress tracking and keyboard shortcuts
 */
function initDeck() {
  const slides = Array.from(document.querySelectorAll("[data-slide-title]"));
  if (!slides.length) return;

  const nav = document.querySelector("[data-slide-nav]");
  const progressBar = document.querySelector("[data-deck-progress]");
  const indexNode = document.querySelector("[data-deck-index]");
  const isDesktop = window.matchMedia("(min-width: 961px)").matches;

  const navLinks = slides.map((slide, index) => {
    const slideId = slide.id || `slide-${index + 1}`;
    if (!slide.id) slide.id = slideId;

    const label = slide.getAttribute("data-slide-title") || `Slide ${index + 1}`;
    const number = slide.getAttribute("data-slide-index") || pad(index + 1);
    slide.setAttribute("data-slide-index", number);

    if (!nav) return null;

    const link = document.createElement("a");
    link.href = `#${slideId}`;
    link.className = "deck-nav__link";
    link.setAttribute("aria-label", `${number} ${label}`);
    link.title = `${number} ${label}`;
    link.innerHTML = `
      <span class="deck-nav__number">${number}</span>
      <span class="deck-nav__title">${label}</span>
    `;
    nav.append(link);
    return link;
  });

  const setActiveSlide = (activeIndex) => {
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active-slide", index === activeIndex);
    });

    navLinks.forEach((link, index) => {
      if (!link) return;
      const isActive = index === activeIndex;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "true" : "false");
    });

    if (indexNode) {
      indexNode.textContent = slides[activeIndex]?.getAttribute("data-slide-index") || pad(activeIndex + 1);
    }

    if (progressBar) {
      progressBar.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    }
  };

  setActiveSlide(0);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (!visible) return;
      const nextIndex = slides.indexOf(visible.target);
      if (nextIndex >= 0) setActiveSlide(nextIndex);
    }, {
      threshold: [0.35, 0.55, 0.75],
      rootMargin: "-10% 0px -10% 0px"
    });

    slides.forEach((slide) => observer.observe(slide));
  }

  if (!isDesktop) return;

  const moveToSlide = (direction) => {
    const currentIndex = slides.findIndex((slide) => slide.classList.contains("is-active-slide"));
    const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.max(0, Math.min(slides.length - 1, fallbackIndex + direction));
    if (nextIndex === fallbackIndex) return;

    slides[nextIndex].scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  };

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTypingTarget = target instanceof HTMLElement && (
      target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );

    if (isTypingTarget) return;

    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      moveToSlide(1);
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      moveToSlide(-1);
    }
  });
}

/**
 * Initialize all scripts when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initReveal();
  initProgressBars();
  initAssetFallbacks();
  initDeck();
});
