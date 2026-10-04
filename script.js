const REVIEW_STORAGE_KEY = "janainaReviewsStorage";

const escapeHtml = (value = "") => value.replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[char]));

const getReviews = () => {
    try {
        const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Não foi possível recuperar comentários salvos:", error);
        return [];
    }
};

const saveReviews = (reviews) => {
    try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
        return true;
    } catch (error) {
        console.warn("Não foi possível salvar comentários:", error);
        return false;
    }
};

const formatReviewDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Data indisponível";
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const createStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

const renderPublicReviews = () => {
    const publicReviewsList = document.getElementById("publicReviewsList");
    const publicAverageRating = document.getElementById("publicAverageRating");
    const publicReviewCount = document.getElementById("publicReviewCount");

    if (!publicReviewsList || !publicAverageRating || !publicReviewCount) return;

    const approvedReviews = getReviews().filter((review) => review.status === "approved");

    if (!approvedReviews.length) {
        publicReviewsList.innerHTML = '<p class="review-empty">Ainda não há avaliações aprovadas para exibir.</p>';
        publicAverageRating.textContent = "5.0 ★★★★★";
        publicReviewCount.textContent = "Baseado em 0 avaliações";
        return;
    }

    const total = approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    const average = (total / approvedReviews.length).toFixed(1);
    publicAverageRating.textContent = `${average} ${createStars(Math.round(Number(average)))}`;
    publicReviewCount.textContent = `Baseado em ${approvedReviews.length} ${approvedReviews.length === 1 ? "avaliação" : "avaliações"}`;

    publicReviewsList.innerHTML = approvedReviews
        .map((review) => `
            <article class="public-review-card">
                <div class="public-review-header">
                    <div class="public-review-person">
                        <div class="public-review-avatar">${escapeHtml((review.name || "A").charAt(0).toUpperCase())}</div>
                        <div>
                            <h3>${escapeHtml(review.name || "Cliente")}</h3>
                            <p>${formatReviewDate(review.createdAt)}</p>
                        </div>
                    </div>
                    <span class="public-review-stars" aria-label="${review.rating} de 5 estrelas">${createStars(Number(review.rating || 5))}</span>
                </div>
                <p class="public-review-text">“${escapeHtml(review.comment || "")}"</p>
            </article>
        `)
        .join("");
};

const renderReviewStatus = (status) => {
    const labels = {
        pending: "Pendente",
        approved: "Aprovada",
        rejected: "Rejeitada",
    };

    return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
};

const openReviewDialog = () => {
    const dialog = document.getElementById("reviewDialog");
    if (!dialog) return;
    dialog.showModal();
    const nameInput = document.getElementById("reviewName");
    if (nameInput) nameInput.focus();
};

const closeReviewDialog = () => {
    const dialog = document.getElementById("reviewDialog");
    if (!dialog) return;
    dialog.close();
};

const setupReviewForm = () => {
    const dialog = document.getElementById("reviewDialog");
    const form = document.getElementById("reviewForm");
    const formStatus = document.getElementById("reviewFormStatus");
    const openButton = document.getElementById("openReviewDialogBtn");
    const cancelButton = document.getElementById("cancelReviewBtn");
    const closeButton = document.getElementById("closeReviewDialogBtn");
    const ratingInput = document.getElementById("reviewRating");
    const starButtons = [...document.querySelectorAll(".star-button")];

    if (!dialog || !form || !ratingInput || !starButtons.length) return;

    const resetStars = () => {
        starButtons.forEach((button) => {
            button.textContent = "☆";
            button.classList.remove("is-active");
        });
        ratingInput.value = "";
    };

    const setStars = (value) => {
        starButtons.forEach((button) => {
            const isActive = Number(button.dataset.value) <= Number(value);
            button.textContent = isActive ? "★" : "☆";
            button.classList.toggle("is-active", isActive);
        });
        ratingInput.value = String(value);
    };

    starButtons.forEach((button) => {
        button.addEventListener("click", () => setStars(Number(button.dataset.value)));
        button.addEventListener("mouseenter", () => setStars(Number(button.dataset.value)));
        button.addEventListener("mouseleave", () => {
            const currentValue = Number(ratingInput.value || 0);
            if (!currentValue) resetStars();
            else setStars(currentValue);
        });
    });

    if (openButton) openButton.addEventListener("click", openReviewDialog);
    if (cancelButton) cancelButton.addEventListener("click", closeReviewDialog);
    if (closeButton) closeButton.addEventListener("click", closeReviewDialog);

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeReviewDialog();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = (form.elements.name.value || "").trim();
        const email = (form.elements.email.value || "").trim();
        const rating = Number(form.elements.rating.value || 0);
        const comment = (form.elements.comment.value || "").trim();
        const consent = form.elements.consent.checked;
        const file = form.elements.photo.files?.[0];

        if (!name || !comment || !consent || !rating) {
            formStatus.textContent = "Preencha nome, avaliação, depoimento e autorização para continuar.";
            formStatus.classList.add("is-error");
            return;
        }

        if (comment.length < 20) {
            formStatus.textContent = "O depoimento deve ter pelo menos 20 caracteres.";
            formStatus.classList.add("is-error");
            return;
        }

        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                formStatus.textContent = "Tipo de imagem inválido. Use JPG, JPEG, PNG ou WEBP.";
                formStatus.classList.add("is-error");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                formStatus.textContent = "A imagem deve ter até 2 MB.";
                formStatus.classList.add("is-error");
                return;
            }
        }

        const nextReviews = getReviews();
        const review = {
            id: crypto.randomUUID ? crypto.randomUUID() : `review-${Date.now()}`,
            name,
            email,
            rating,
            comment,
            photo: "",
            status: "pending",
            consent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                review.photo = String(reader.result || "");
                nextReviews.unshift(review);
                if (!saveReviews(nextReviews)) {
                    formStatus.textContent = "Não foi possível salvar sua avaliação. Tente novamente.";
                    formStatus.classList.add("is-error");
                    return;
                }
                form.reset();
                resetStars();
                formStatus.textContent = "Obrigado pelo seu depoimento! Sua avaliação será analisada antes de ser publicada.";
                formStatus.classList.remove("is-error");
                renderPublicReviews();
                setTimeout(() => closeReviewDialog(), 1600);
            };
            reader.readAsDataURL(file);
            return;
        }

        nextReviews.unshift(review);
        if (!saveReviews(nextReviews)) {
            formStatus.textContent = "Não foi possível salvar sua avaliação. Tente novamente.";
            formStatus.classList.add("is-error");
            return;
        }

        form.reset();
        resetStars();
        formStatus.textContent = "Obrigado pelo seu depoimento! Sua avaliação será analisada antes de ser publicada.";
        formStatus.classList.remove("is-error");
        renderPublicReviews();
        setTimeout(() => closeReviewDialog(), 1600);
    });
};

const initAdminDashboard = () => {
    const adminPage = document.body.dataset.page === "admin";
    if (!adminPage) return;

    const list = document.getElementById("adminReviewsList");
    const stats = {
        total: document.getElementById("adminTotalReviews"),
        pending: document.getElementById("adminPendingReviews"),
        approved: document.getElementById("adminApprovedReviews"),
        rejected: document.getElementById("adminRejectedReviews"),
        average: document.getElementById("adminAverageRating"),
    };
    const statusFilter = document.getElementById("adminStatusFilter");
    const searchInput = document.getElementById("adminSearch");
    const starFilter = document.getElementById("adminStarFilter");
    const modal = document.getElementById("adminReviewModal");
    const modalContent = document.getElementById("adminReviewModalContent");
    const closeModalBtn = document.getElementById("adminCloseModalBtn");
    const editForm = document.getElementById("adminEditForm");

    if (!list || !stats.total) return;

    const renderStats = (reviews) => {
        const pending = reviews.filter((review) => review.status === "pending").length;
        const approved = reviews.filter((review) => review.status === "approved").length;
        const rejected = reviews.filter((review) => review.status === "rejected").length;
        const totalValue = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
        const avg = reviews.length ? (totalValue / reviews.length).toFixed(1) : "0.0";

        stats.total.textContent = String(reviews.length);
        stats.pending.textContent = String(pending);
        stats.approved.textContent = String(approved);
        stats.rejected.textContent = String(rejected);
        stats.average.textContent = `${avg} ⭐`;
    };

    const getFilteredReviews = () => {
        const reviews = getReviews();
        const status = statusFilter ? statusFilter.value : "all";
        const star = starFilter ? starFilter.value : "all";
        const term = (searchInput ? searchInput.value : "").trim().toLowerCase();

        return reviews.filter((review) => {
            const matchesStatus = status === "all" || review.status === status;
            const matchesStar = star === "all" || Number(review.rating) === Number(star);
            const matchesSearch = !term || `${review.name} ${review.comment}`.toLowerCase().includes(term);
            return matchesStatus && matchesStar && matchesSearch;
        });
    };

    const openModal = (reviewId) => {
        if (!modal || !modalContent) return;
        const review = getReviews().find((item) => item.id === reviewId);
        if (!review) return;

        modalContent.innerHTML = `
            <div class="review-detail-card">
                <div class="review-detail-head">
                    <div>
                        <h3>${escapeHtml(review.name || "Cliente")}</h3>
                        <p>${formatReviewDate(review.createdAt)} · ${renderReviewStatus(review.status)}</p>
                    </div>
                    ${review.photo ? `<img src="${review.photo}" alt="Foto de ${escapeHtml(review.name || "cliente")}" class="review-detail-photo">` : ""}
                </div>
                <p class="review-detail-stars">${createStars(Number(review.rating || 0))}</p>
                <p class="review-detail-text">${escapeHtml(review.comment || "")}</p>
                <div class="review-detail-meta">
                    <span>Email: ${escapeHtml(review.email || "Não informado")}</span>
                    <span>Consentimento: ${review.consent ? "Sim" : "Não"}</span>
                </div>
                <div class="review-detail-actions">
                    <button type="button" data-action="approve" data-id="${review.id}" class="btn small success">Aprovar</button>
                    <button type="button" data-action="reject" data-id="${review.id}" class="btn small warning">Rejeitar</button>
                    <button type="button" data-action="edit" data-id="${review.id}" class="btn small">Editar</button>
                    <button type="button" data-action="delete" data-id="${review.id}" class="btn small danger">Excluir</button>
                </div>
            </div>
        `;

        modal.showModal();
    };

    const closeModal = () => {
        if (modal) modal.close();
    };

    const renderList = () => {
        const reviews = getFilteredReviews();
        renderStats(getReviews());

        if (!reviews.length) {
            list.innerHTML = '<div class="admin-empty">Nenhum resultado encontrado.</div>';
            return;
        }

        list.innerHTML = reviews.map((review) => `
            <article class="admin-review-item status-${review.status}">
                <div class="admin-review-main">
                    ${review.photo ? `<img src="${review.photo}" alt="${escapeHtml(review.name || "Cliente")}" class="admin-review-thumb">` : '<div class="admin-review-thumb placeholder">Foto</div>'}
                    <div class="admin-review-copy">
                        <div class="admin-review-header">
                            <h3>${escapeHtml(review.name || "Cliente")}</h3>
                            ${renderReviewStatus(review.status)}
                        </div>
                        <p class="admin-review-stars">${createStars(Number(review.rating || 0))}</p>
                        <p>${escapeHtml((review.comment || "").slice(0, 140))}${(review.comment || "").length > 140 ? "…" : ""}</p>
                        <small>${formatReviewDate(review.createdAt)}</small>
                    </div>
                </div>
                <div class="admin-review-actions">
                    <button type="button" data-action="view" data-id="${review.id}" class="btn small">Visualizar</button>
                    <button type="button" data-action="approve" data-id="${review.id}" class="btn small success">Aprovar</button>
                    <button type="button" data-action="reject" data-id="${review.id}" class="btn small warning">Rejeitar</button>
                    <button type="button" data-action="edit" data-id="${review.id}" class="btn small">Editar</button>
                    <button type="button" data-action="delete" data-id="${review.id}" class="btn small danger">Excluir</button>
                </div>
            </article>
        `).join("");
    };

    const updateReviewStatus = (reviewId, status) => {
        const reviews = getReviews();
        const next = reviews.map((review) => review.id === reviewId ? { ...review, status, updatedAt: new Date().toISOString() } : review);
        saveReviews(next);
        renderList();
    };

    const deleteReview = (reviewId) => {
        const confirmed = window.confirm("Tem certeza que deseja excluir este depoimento? Esta ação não poderá ser desfeita.");
        if (!confirmed) return;
        const reviews = getReviews().filter((review) => review.id !== reviewId);
        saveReviews(reviews);
        closeModal();
        renderList();
    };

    if (statusFilter) statusFilter.addEventListener("change", renderList);
    if (starFilter) starFilter.addEventListener("change", renderList);
    if (searchInput) searchInput.addEventListener("input", renderList);

    document.body.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const action = button.dataset.action;
        const reviewId = button.dataset.id;
        if (!action || !reviewId) return;

        if (action === "view") openModal(reviewId);
        if (action === "approve") updateReviewStatus(reviewId, "approved");
        if (action === "reject") updateReviewStatus(reviewId, "rejected");
        if (action === "delete") deleteReview(reviewId);
        if (action === "edit") {
            const reviews = getReviews();
            const review = reviews.find((item) => item.id === reviewId);
            if (!review) return;
            editForm.elements.id.value = review.id;
            editForm.elements.editName.value = review.name || "";
            editForm.elements.editComment.value = review.comment || "";
            editForm.elements.editRating.value = String(review.rating || 5);
            editForm.elements.editStatus.value = review.status || "pending";
            document.getElementById("adminEditPanel").hidden = false;
        }
    });

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.body.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action='approve']");
        if (!target) return;
        const reviewId = target.dataset.id;
        if (reviewId) updateReviewStatus(reviewId, "approved");
    });

    if (editForm) {
        editForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const reviewId = editForm.elements.id.value;
            const updates = {
                name: (editForm.elements.editName.value || "").trim(),
                comment: (editForm.elements.editComment.value || "").trim(),
                rating: Number(editForm.elements.editRating.value || 5),
                status: editForm.elements.editStatus.value,
                updatedAt: new Date().toISOString(),
            };

            if (!updates.name || !updates.comment) return;
            const reviews = getReviews().map((review) => review.id === reviewId ? { ...review, ...updates } : review);
            saveReviews(reviews);
            editForm.reset();
            document.getElementById("adminEditPanel").hidden = true;
            renderList();
        });
    }

    renderList();
};

const initYear = () => {
    const yearElement = document.getElementById("year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
};

const initTheme = () => {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    let darkMode = false;

    try {
        darkMode = localStorage.getItem("theme") === "dark";
    } catch (error) {
        console.warn("Não foi possível recuperar a preferência de tema:", error);
    }

    const applyTheme = (isDark) => {
        if (isDark) {
            document.documentElement.style.setProperty("--background", "#151b17");
            document.documentElement.style.setProperty("--card", "#202820");
            document.documentElement.style.setProperty("--text", "#f1f3ef");
            document.documentElement.style.setProperty("--muted", "#aeb8b0");
            document.documentElement.style.setProperty("--border", "#303a32");

            themeToggle.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
            themeToggle.setAttribute("aria-label", "Ativar tema claro");
            document.body.classList.add("dark-theme");
        } else {
            document.documentElement.style.setProperty("--background", "#f8f7f3");
            document.documentElement.style.setProperty("--card", "#ffffff");
            document.documentElement.style.setProperty("--text", "#263229");
            document.documentElement.style.setProperty("--muted", "#606b63");
            document.documentElement.style.setProperty("--border", "#e5e5df");

            themeToggle.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
            themeToggle.setAttribute("aria-label", "Ativar tema escuro");
            document.body.classList.remove("dark-theme");
        }
    };

    applyTheme(darkMode);

    themeToggle.addEventListener("click", () => {
        darkMode = !darkMode;
        applyTheme(darkMode);
        try {
            localStorage.setItem("theme", darkMode ? "dark" : "light");
        } catch (error) {
            console.warn("Não foi possível salvar a preferência de tema:", error);
        }
    });
};

const initNavigation = () => {
    document.querySelectorAll(".site-nav").forEach((navigation) => {
        const toggle = navigation.querySelector(".nav-toggle");
        const menu = navigation.querySelector(".site-nav-links");
        if (!toggle || !menu) return;

        const closeMenu = (restoreFocus = false) => {
            navigation.classList.remove("menu-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Abrir menu");
            if (restoreFocus) toggle.focus();
        };

        toggle.addEventListener("click", () => {
            const isOpen = toggle.getAttribute("aria-expanded") === "true";
            navigation.classList.toggle("menu-open", !isOpen);
            toggle.setAttribute("aria-expanded", String(!isOpen));
            toggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
        });

        menu.addEventListener("click", (event) => {
            if (event.target.closest("a")) closeMenu();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && navigation.classList.contains("menu-open")) {
                closeMenu(true);
            }
        });
    });
};

const initTestimonialsGallery = () => {
    const testimonialsGallery = document.getElementById("testimonialsGallery");
    const testimonialLightbox = document.getElementById("testimonialLightbox");

    if (!testimonialsGallery || !testimonialLightbox) return;

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
};

const initCounters = () => {
    const counters = document.querySelectorAll("[data-number]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        return;
    }

    counters.forEach((counter) => {
        counter.textContent = Number(counter.dataset.number).toLocaleString("pt-BR");
    });
};

const initRevealAnimations = () => {
    const animatedElements = document.querySelectorAll(".info-card, .mentoria, .highlight-card");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
            element.style.transition = "opacity .6s ease, transform .6s ease";
            animationObserver.observe(element);
        });
        return;
    }

    animatedElements.forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
    });
};

const initSite = () => {
    renderPublicReviews();
    setupReviewForm();
    initAdminDashboard();
    initYear();
    initTheme();
    initNavigation();
    initTestimonialsGallery();
    initCounters();
    initRevealAnimations();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite);
} else {
    initSite();
}
