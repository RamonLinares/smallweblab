document.documentElement.classList.add("js");

const scrollLine = document.querySelector("[data-scroll-line]");
const heroVisual = document.querySelector("[data-hero-visual]");
const revealItems = document.querySelectorAll(".reveal");
const tiltSurfaces = document.querySelectorAll(".tilt-surface");

let ticking = false;

const updateScrollEffects = () => {
  const doc = document.documentElement;
  const scrollTop = window.scrollY;
  const scrollable = doc.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;

  if (scrollLine) {
    scrollLine.style.transform = `scaleX(${progress})`;
  }

  if (heroVisual) {
    heroVisual.style.setProperty("--hero-shift", `${Math.min(scrollTop * 0.08, 34)}px`);
  }

  ticking = false;
};

const requestScrollUpdate = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(updateScrollEffects);
};

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -6% 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (window.matchMedia("(pointer:fine)").matches) {
  tiltSurfaces.forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const bounds = surface.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;

      const rotateY = (px - 0.5) * 7;
      const rotateX = (0.5 - py) * 7;
      const offsetY = (0.5 - py) * 8;

      surface.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
      surface.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
      surface.style.setProperty("--offset-y", `${offsetY.toFixed(2)}px`);
    });

    surface.addEventListener("pointerleave", () => {
      surface.style.removeProperty("--rotate-x");
      surface.style.removeProperty("--rotate-y");
      surface.style.removeProperty("--offset-y");
    });
  });
}

updateScrollEffects();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
