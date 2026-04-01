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

const sendPageView = () => {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`
  });
};

const applyAnalyticsConsent = (analyticsStorage, { sendInitialPageView = false } = {}) => {
  if (typeof window.gtag !== "function" || !analyticsMeasurementId) {
    return;
  }

  const consentPayload = getConsentPayload(analyticsStorage);

  if (!analyticsConfigured) {
    window.gtag("consent", "default", consentPayload);
    window.gtag("config", analyticsMeasurementId, {
      send_page_view: sendInitialPageView
    });
    analyticsConfigured = true;
    return;
  }

  window.gtag("consent", "update", consentPayload);

  if (analyticsStorage === CONSENT_GRANTED && sendInitialPageView) {
    sendPageView();
  }
};

const ensureGoogleAnalytics = () => {
  if (!isAnalyticsConfigured) {
    return Promise.resolve(false);
  }

  if (analyticsLoadPromise) {
    return analyticsLoadPromise;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());

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

  if (nextState === CONSENT_GRANTED) {
    const didLoadAnalytics = await ensureGoogleAnalytics();

    if (didLoadAnalytics) {
      applyAnalyticsConsent(CONSENT_GRANTED, {
        sendInitialPageView: previousState !== CONSENT_GRANTED
      });
    }

    return;
  }

  if (analyticsConfigured && previousState === CONSENT_GRANTED) {
    applyAnalyticsConsent(CONSENT_DENIED);
  }
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

  if (consentState === CONSENT_GRANTED) {
    const didLoadAnalytics = await ensureGoogleAnalytics();

    if (didLoadAnalytics) {
      applyAnalyticsConsent(CONSENT_GRANTED, {
        sendInitialPageView: true
      });
    }

    return;
  }

  if (consentState === CONSENT_DENIED) {
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

void initializeConsent();
updateScrollEffects();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
