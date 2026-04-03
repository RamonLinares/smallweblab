document.documentElement.classList.add("js");

const ANALYTICS_STORAGE_KEY = "smallweblab.analyticsConsent";
const CONSENT_GRANTED = "granted";
const CONSENT_DENIED = "denied";
const analyticsIdMeta = document.querySelector('meta[name="google-analytics-id"]');
const analyticsMeasurementId = analyticsIdMeta?.content.trim() ?? "";
const isAnalyticsConfigured = /^G-[A-Z0-9]+$/i.test(analyticsMeasurementId);

const scrollLine = document.querySelector("[data-scroll-line]");
const heroVisual = document.querySelector("[data-hero-visual]");
const revealItems = document.querySelectorAll(".reveal");
const tiltSurfaces = document.querySelectorAll(".tilt-surface");
const prototypeGrid = document.querySelector("[data-prototype-grid]");
const prototypeCardTemplate = document.querySelector("#prototype-card-template");
const liveLinksContainer = document.querySelector("[data-live-links]");
const prototypeCountLabel = document.querySelector("[data-prototype-count-label]");
const consentModal = document.querySelector("[data-consent-modal]");
const consentBackdrop = document.querySelector("[data-consent-backdrop]");
const consentActionButtons = document.querySelectorAll("[data-consent-action]");
const openConsentButtons = document.querySelectorAll("[data-open-consent]");
const consentPrimaryButton = document.querySelector('[data-consent-action="accept"]');

let ticking = false;
let analyticsConfigured = false;
let analyticsLoadPromise = null;
let consentModalMandatory = false;
let consentState = null;

const getStoredConsent = () => {
  try {
    const storedValue = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);

    if (storedValue === CONSENT_GRANTED || storedValue === CONSENT_DENIED) {
      return storedValue;
    }
  } catch (error) {
    console.warn("Unable to read analytics consent preference.", error);
  }

  return null;
};

const setStoredConsent = (value) => {
  try {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, value);
  } catch (error) {
    console.warn("Unable to store analytics consent preference.", error);
  }
};

const updateConsentUi = (value) => {
  document.documentElement.dataset.analyticsConsent = value ?? "unset";
};

const setConsentModalState = (isOpen, { mandatory = false } = {}) => {
  if (!consentModal) {
    return;
  }

  consentModalMandatory = mandatory;

  if (isOpen) {
    consentModal.hidden = false;
    if (consentBackdrop) {
      consentBackdrop.hidden = true;
    }
    consentModal.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      consentPrimaryButton?.focus();
    });

    return;
  }

  if (consentModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  consentModal.hidden = true;
  if (consentBackdrop) {
    consentBackdrop.hidden = true;
  }
  consentModal.setAttribute("aria-hidden", "true");
};

const openConsentModal = (options = {}) => {
  if (!isAnalyticsConfigured) {
    return;
  }

  setConsentModalState(true, options);
};

const closeConsentModal = () => {
  if (consentModalMandatory) {
    return;
  }

  setConsentModalState(false);
};

const getConsentPayload = (analyticsStorage) => ({
  ad_storage: CONSENT_DENIED,
  ad_user_data: CONSENT_DENIED,
  ad_personalization: CONSENT_DENIED,
  analytics_storage: analyticsStorage
});

const applyAnalyticsConsent = (analyticsStorage) => {
  if (typeof window.gtag !== "function" || !analyticsMeasurementId) {
    return;
  }

  window.gtag("consent", "update", getConsentPayload(analyticsStorage));
};

const ensureGoogleAnalytics = (initialAnalyticsStorage = CONSENT_DENIED) => {
  if (!isAnalyticsConfigured) {
    return Promise.resolve(false);
  }

  if (!analyticsConfigured) {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    window.gtag("consent", "default", getConsentPayload(CONSENT_DENIED));
    window.gtag("set", "ads_data_redaction", true);

    if (initialAnalyticsStorage === CONSENT_GRANTED) {
      window.gtag("consent", "update", getConsentPayload(CONSENT_GRANTED));
    }

    window.gtag("js", new Date());
    window.gtag("config", analyticsMeasurementId, {
      send_page_view: true
    });

    analyticsConfigured = true;
  }

  if (analyticsLoadPromise) {
    return analyticsLoadPromise;
  }

  analyticsLoadPromise = new Promise((resolve, reject) => {
    const analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsMeasurementId)}`;
    analyticsScript.addEventListener("load", () => resolve(true), { once: true });
    analyticsScript.addEventListener("error", () => reject(new Error("Failed to load Google Analytics.")), {
      once: true
    });
    document.head.append(analyticsScript);
  }).catch((error) => {
    analyticsLoadPromise = null;
    console.warn(error.message);
    return false;
  });

  return analyticsLoadPromise;
};

const handleConsentChoice = async (nextState) => {
  const previousState = consentState;
  consentState = nextState;
  setStoredConsent(nextState);
  updateConsentUi(nextState);
  setConsentModalState(false);

  const didLoadAnalytics = await ensureGoogleAnalytics(consentState);

  if (!didLoadAnalytics || previousState === nextState) {
    return;
  }

  applyAnalyticsConsent(nextState);
};

const initializeConsent = async () => {
  consentState = getStoredConsent();
  updateConsentUi(consentState);

  openConsentButtons.forEach((button) => {
    button.hidden = !isAnalyticsConfigured;
  });

  if (!isAnalyticsConfigured) {
    return;
  }

  void ensureGoogleAnalytics(consentState);

  if (consentState === CONSENT_GRANTED || consentState === CONSENT_DENIED) {
    return;
  }

  openConsentModal({ mandatory: true });
};

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

const formatPrototypeCount = (count) => {
  const suffix = count === 1 ? "" : "s";
  return `${count} synced lab prototype${suffix}`;
};

const setPrototypeCount = (count) => {
  if (prototypeCountLabel) {
    prototypeCountLabel.textContent = formatPrototypeCount(count);
  }
};

const createPrototypeTag = (tag) => {
  const item = document.createElement("li");
  item.textContent = tag;
  return item;
};

const createPrototypeLiveLink = (entry) => {
  const link = document.createElement("a");
  link.href = entry.path;
  link.textContent = entry.title;
  link.dataset.prototypeLink = "true";
  return link;
};

const attachTiltSurface = (surface) => {
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
};

const createPrototypeCard = (entry) => {
  if (!prototypeCardTemplate) {
    return null;
  }

  const fragment = prototypeCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".prototype-card");
  const visualLink = fragment.querySelector("[data-prototype-visual-link]");
  const image = fragment.querySelector("[data-prototype-image]");
  const badge = fragment.querySelector("[data-prototype-badge]");
  const eyebrow = fragment.querySelector("[data-prototype-eyebrow]");
  const path = fragment.querySelector("[data-prototype-path]");
  const title = fragment.querySelector("[data-prototype-title]");
  const summary = fragment.querySelector("[data-prototype-summary]");
  const note = fragment.querySelector("[data-prototype-note]");
  const tags = fragment.querySelector("[data-prototype-tags]");
  const openLink = fragment.querySelector("[data-prototype-open-link]");
  const sourceLink = fragment.querySelector("[data-prototype-source-link]");

  visualLink.href = entry.path;
  visualLink.setAttribute("aria-label", `Open ${entry.title}`);
  image.src = entry.previewImage;
  image.alt = entry.previewAlt;
  badge.textContent = entry.badge;
  eyebrow.textContent = entry.eyebrow;
  path.textContent = `smallweblab.com${entry.path}`;
  title.textContent = entry.title;
  summary.textContent = entry.summary;
  note.textContent = entry.note;
  openLink.href = entry.path;
  sourceLink.href = entry.repoUrl;

  tags.replaceChildren(...entry.tags.map(createPrototypeTag));

  if (window.matchMedia("(pointer:fine)").matches && card) {
    attachTiltSurface(card);
  }

  return fragment;
};

const renderPrototypeFallback = () => {
  if (!prototypeGrid) {
    return;
  }

  const note = document.createElement("p");
  note.className = "prototypes__empty";
  note.textContent = "Prototype routes will appear here as they are added to the lab catalog.";
  prototypeGrid.replaceChildren(note);
};

const initializePrototypeLab = async () => {
  if (!prototypeGrid || !prototypeCardTemplate) {
    return;
  }

  try {
    const response = await fetch("/lab/catalog.json");
    if (!response.ok) {
      throw new Error(`Prototype catalog request failed with ${response.status}`);
    }

    const entries = await response.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      setPrototypeCount(0);
      renderPrototypeFallback();
      return;
    }

    prototypeGrid.replaceChildren();
    liveLinksContainer?.querySelectorAll("[data-prototype-link]").forEach((link) => link.remove());

    entries.forEach((entry) => {
      const card = createPrototypeCard(entry);
      if (card) {
        prototypeGrid.append(card);
      }

      if (liveLinksContainer) {
        liveLinksContainer.append(createPrototypeLiveLink(entry));
      }
    });

    setPrototypeCount(entries.length);
  } catch (error) {
    console.warn("Unable to load prototype catalog.", error);
    setPrototypeCount(0);
    renderPrototypeFallback();
  }
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
  tiltSurfaces.forEach(attachTiltSurface);
}

consentActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextState =
      button.dataset.consentAction === "accept" ? CONSENT_GRANTED : CONSENT_DENIED;

    void handleConsentChoice(nextState);
  });
});

openConsentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openConsentModal();
  });
});

consentBackdrop?.addEventListener("click", () => {
  closeConsentModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeConsentModal();
  }
});

void initializePrototypeLab();
void initializeConsent();
updateScrollEffects();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
