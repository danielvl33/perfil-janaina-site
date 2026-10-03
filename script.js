// ================================
// ANO AUTOMÁTICO
// ================================
const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// ================================
// TEMA ESCURO (COM PERSISTÊNCIA)
// ================================
const themeToggle = document.getElementById("themeToggle");
let darkMode = localStorage.getItem("theme") === "dark";

const applyTheme = (isDark) => {
    if (!themeToggle) return;

    if (isDark) {
        document.documentElement.style.setProperty("--background", "#151b17");
        document.documentElement.style.setProperty("--card", "#202820");
        document.documentElement.style.setProperty("--text", "#f1f3ef");
        document.documentElement.style.setProperty("--muted", "#aeb8b0");
        document.documentElement.style.setProperty("--border", "#303a32");

        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        themeToggle.setAttribute("aria-label", "Ativar tema claro");
        document.body.classList.add("dark-theme");
    } else {
        document.documentElement.style.setProperty("--background", "#f8f7f3");
        document.documentElement.style.setProperty("--card", "#ffffff");
        document.documentElement.style.setProperty("--text", "#263229");
        document.documentElement.style.setProperty("--muted", "#68736b");
        document.documentElement.style.setProperty("--border", "#e5e5df");

        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        themeToggle.setAttribute("aria-label", "Ativar tema escuro");
        document.body.classList.remove("dark-theme");
    }
};

applyTheme(darkMode);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        darkMode = !darkMode;
        applyTheme(darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    });
}

// Configure this value when the Instagram profile URL is available.
const INSTAGRAM_URL = "COLOCAR_LINK_DO_INSTAGRAM_AQUI";
const hasInstagramURL = /^https?:\/\/\S+$/i.test(INSTAGRAM_URL)
    && INSTAGRAM_URL !== "COLOCAR_LINK_DO_INSTAGRAM_AQUI";

document.querySelectorAll("[data-instagram-link]").forEach((link) => {
    if (!hasInstagramURL) return;

    link.href = INSTAGRAM_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = "Visitar Instagram";
    link.removeAttribute("aria-disabled");

    const status = link.querySelector("[data-instagram-status]");
    if (status) status.textContent = "Acompanhe no Instagram";
});

const testimonialsGallery = document.getElementById("testimonialsGallery");
const testimonialLightbox = document.getElementById("testimonialLightbox");

if (testimonialsGallery && testimonialLightbox) {
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxCounter = document.getElementById("lightboxCounter");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrevious = document.getElementById("lightboxPrevious");
    const lightboxNext = document.getElementById("lightboxNext");
    let testimonials = [];
    let activeTestimonial = 0;
    let lastFocusedElement = null;

    const showTestimonial = (index) => {
        activeTestimonial = (index + testimonials.length) % testimonials.length;
        const testimonial = testimonials[activeTestimonial];
        lightboxImage.src = testimonial.src;
        lightboxImage.alt = `Print do depoimento ${String(activeTestimonial + 1).padStart(2, "0")}`;
        lightboxCounter.textContent = `${activeTestimonial + 1} / ${testimonials.length}`;
        lightboxPrevious.disabled = testimonials.length < 2;
        lightboxNext.disabled = testimonials.length < 2;
    };

    const openLightbox = (index, trigger) => {
        lastFocusedElement = trigger;
        showTestimonial(index);
        testimonialLightbox.showModal();
        lightboxClose.focus();
    };

    const closeLightbox = () => {
        if (testimonialLightbox.open) testimonialLightbox.close();
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrevious.addEventListener("click", () => showTestimonial(activeTestimonial - 1));
    lightboxNext.addEventListener("click", () => showTestimonial(activeTestimonial + 1));

    testimonialLightbox.addEventListener("click", (event) => {
        if (event.target === testimonialLightbox) closeLightbox();
    });

    testimonialLightbox.addEventListener("close", () => {
        lightboxImage.removeAttribute("src");
        if (lastFocusedElement?.isConnected) lastFocusedElement.focus();
    });

    testimonialLightbox.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeLightbox();
        } else if (event.key === "ArrowLeft" && testimonials.length > 1) {
            event.preventDefault();
            showTestimonial(activeTestimonial - 1);
        } else if (event.key === "ArrowRight" && testimonials.length > 1) {
            event.preventDefault();
            showTestimonial(activeTestimonial + 1);
        }
    });

    fetch("assets/depoimentos/manifest.json")
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((manifest) => {
            if (!Array.isArray(manifest)) throw new Error("Manifesto de depoimentos inválido");

            testimonials = manifest
                .filter((item) => item && /^depoimento-\d{2,}\.(?:png|jpe?g|webp)$/i.test(item.src))
                .map((item) => ({ src: `assets/depoimentos/${item.src}` }));

            if (testimonials.length === 0) {
                const emptyState = document.createElement("p");
                emptyState.className = "testimonials-empty";
                emptyState.textContent = "Os depoimentos autorizados serão adicionados aqui.";
                testimonialsGallery.append(emptyState);
                return;
            }

            testimonials.forEach((testimonial, index) => {
                const card = document.createElement("button");
                card.className = "testimonial-card";
                card.type = "button";
                card.style.setProperty("--testimonial-index", index);
                card.setAttribute("aria-label", `Ampliar print do depoimento ${String(index + 1).padStart(2, "0")}`);

                const image = document.createElement("img");
                image.src = testimonial.src;
                image.alt = `Print do depoimento ${String(index + 1).padStart(2, "0")}`;
                image.loading = "lazy";
                image.decoding = "async";
                image.addEventListener("error", () => {
                    card.remove();
                }, { once: true });

                const zoomHint = document.createElement("span");
                zoomHint.className = "testimonial-zoom-hint";
                const zoomIcon = document.createElement("i");
                zoomIcon.className = "fa-solid fa-expand";
                zoomIcon.setAttribute("aria-hidden", "true");
                const zoomText = document.createElement("span");
                zoomText.textContent = "Ampliar";
                zoomHint.append(zoomIcon, zoomText);
                card.append(image, zoomHint);
                card.addEventListener("click", () => openLightbox(index, card));
                testimonialsGallery.append(card);
            });
        })
        .catch((error) => {
            const errorState = document.createElement("p");
            errorState.className = "testimonials-empty";
            errorState.setAttribute("role", "status");
            errorState.textContent = "Não foi possível carregar os depoimentos agora.";
            testimonialsGallery.append(errorState);
            console.error("Erro ao carregar a galeria de depoimentos:", error);
        })
        .finally(() => testimonialsGallery.setAttribute("aria-busy", "false"));
}

// ================================
// CONTADOR DOS NÚMEROS
// ================================
const counters = document.querySelectorAll("[data-number]");
const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const element = entry.target;
                const target = Number(element.dataset.number);
                let current = 0;
                const duration = 1500;
                const increment = target / (duration / 16);

                const update = () => {
                    current += increment;

                    if (current >= target) {
                        element.textContent = target.toLocaleString("pt-BR");
                        return;
                    }

                    element.textContent = Math.floor(current).toLocaleString("pt-BR");
                    requestAnimationFrame(update);
                };

                update();
                observer.unobserve(element);
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
} else {
    counters.forEach((counter) => {
        counter.textContent = Number(counter.dataset.number).toLocaleString("pt-BR");
    });
}

// ================================
// ANIMAÇÃO AO ROLAR
// ================================
const animatedElements = document.querySelectorAll(
    ".info-card, .mentoria, .highlight-card"
);

if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const animationObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    animationObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    animatedElements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(25px)";
        element.style.transition =
            "opacity .6s ease, transform .6s ease";

        animationObserver.observe(element);
    });
} else {
    animatedElements.forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
    });
}
