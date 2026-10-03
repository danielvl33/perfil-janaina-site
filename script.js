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

// ================================
// CONTADOR DOS NÚMEROS
// ================================
const counters = document.querySelectorAll("[data-number]");

if ("IntersectionObserver" in window) {
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

if ("IntersectionObserver" in window) {
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
