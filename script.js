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
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
};

const createStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);
const reviewRatingLabels = ["", "Muito ruim", "Ruim", "Regular", "Muito bom", "Excelente"];
let activeReviewFilter = "all";
let showAllPublicReviews = false;

const renderPublicReviews = () => {
    const publicReviewsList = document.getElementById("publicReviewsList");
    const publicAverageRating = document.getElementById("publicAverageRating");
    const publicReviewCount = document.getElementById("publicReviewCount");
    const publicAverageStars = document.getElementById("publicAverageStars");
    const publicReviewQuality = document.getElementById("publicReviewQuality");
    const reviewControls = document.getElementById("reviewControls");
    const showAllButton = document.getElementById("showAllReviewsBtn");

    if (!publicReviewsList || !publicAverageRating || !publicReviewCount) return;

    const approvedReviews = getReviews().filter((review) => review.status === "approved");

    if (!approvedReviews.length) {
        publicAverageRating.textContent = "—";
        publicReviewCount.textContent = "Ainda não há avaliações verificadas";
        if (publicAverageStars) {
            publicAverageStars.textContent = "☆☆☆☆☆";
            publicAverageStars.setAttribute("aria-label", "Sem avaliações");
        }
        if (publicReviewQuality) publicReviewQuality.textContent = "Aguardando avaliações";
        if (reviewControls) reviewControls.hidden = true;
        if (showAllButton) showAllButton.hidden = true;
        publicReviewsList.innerHTML = `
            <div class="review-empty-state">
                <span class="review-empty-mark" aria-hidden="true"><i class="fa-regular fa-comment-dots"></i></span>
                <h3>Seja a primeira pessoa a compartilhar sua experiência</h3>
                <p>Seu depoimento pode ajudar outras pessoas a conhecerem este trabalho.</p>
                <button class="btn primary" type="button" data-open-review>Deixar minha avaliação</button>
            </div>`;
        publicReviewsList.querySelector("[data-open-review]")?.addEventListener("click", () => {
            document.getElementById("openReviewDialogBtn")?.click();
        });
        return;
    }

    const total = approvedReviews.reduce((sum, review) => sum + Math.min(5, Math.max(1, Number(review.rating) || 0)), 0);
    const average = (total / approvedReviews.length).toFixed(1);
    const averageRounded = Math.round(Number(average));
    const quality = Number(average) >= 4.5 ? "Excelente" : Number(average) >= 3.5 ? "Muito bom" : Number(average) >= 2.5 ? "Regular" : Number(average) >= 1.5 ? "Precisa melhorar" : "Muito ruim";
    publicAverageRating.textContent = average;
    publicReviewCount.textContent = `Baseado em ${approvedReviews.length} ${approvedReviews.length === 1 ? "avaliação verificada" : "avaliações verificadas"}`;
    if (publicAverageStars) {
        publicAverageStars.textContent = createStars(averageRounded);
        publicAverageStars.setAttribute("aria-label", `${averageRounded} de 5 estrelas`);
    }
    if (publicReviewQuality) publicReviewQuality.textContent = quality;
    if (reviewControls) reviewControls.hidden = false;

    const sortedReviews = approvedReviews
        .filter((review) => activeReviewFilter === "all" || Number(review.rating) === Number(activeReviewFilter))
        .sort((first, second) => {
            if (document.getElementById("reviewSort")?.value === "rating") {
                return Number(second.rating) - Number(first.rating) || new Date(second.createdAt) - new Date(first.createdAt);
            }
            return new Date(second.createdAt) - new Date(first.createdAt);
        });
    const visibleReviews = showAllPublicReviews ? sortedReviews : sortedReviews.slice(0, 3);

    publicReviewsList.innerHTML = visibleReviews.length ? visibleReviews
        .map((review) => `
            <article class="public-review-card">
                <div class="public-review-header">
                    <div class="public-review-person">
                        ${review.photo && /^data:image\/(?:jpeg|png|webp);base64,/i.test(review.photo)
                            ? `<img class="public-review-avatar" src="${review.photo}" alt="" loading="lazy">`
                            : `<span class="public-review-avatar" aria-hidden="true">${escapeHtml((review.name || "A").trim().charAt(0).toUpperCase())}</span>`}
                        <div>
                            <h3>${escapeHtml(review.name || "Cliente")}</h3>
                            <p>${formatReviewDate(review.createdAt)}</p>
                        </div>
                    </div>
                </div>
                <span class="public-review-stars" role="img" aria-label="${Math.min(5, Math.max(1, Number(review.rating) || 0))} de 5 estrelas">${createStars(Math.min(5, Math.max(1, Number(review.rating) || 0)))}</span>
                <span class="public-review-quote-mark" aria-hidden="true">“</span>
                <p class="public-review-text">“${escapeHtml(review.comment || "")}"</p>
                <div class="public-review-verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Avaliação verificada</div>
            </article>
        `)
        .join("") : '<p class="review-no-results">Não encontramos avaliações com essa nota.</p>';

    if (showAllButton) {
        showAllButton.hidden = sortedReviews.length <= 3;
        showAllButton.textContent = showAllPublicReviews ? "Ver menos depoimentos" : "Ver todos os depoimentos";
        showAllButton.setAttribute("aria-expanded", String(showAllPublicReviews));
    }
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
    document.querySelector(".star-button[tabindex='0']")?.focus();
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
    const ratingDescription = document.getElementById("ratingDescription");
    const steps = [...document.querySelectorAll(".review-form-step")];
    const stepCount = document.getElementById("reviewStepCount");
    const progressBar = document.getElementById("reviewProgressBar");
    const backButton = document.getElementById("reviewStepBackBtn");
    const nextButton = document.getElementById("reviewStepNextBtn");
    const submitButton = document.getElementById("reviewSubmitBtn");
    const successPanel = document.getElementById("reviewSuccess");
    const returnButton = document.getElementById("reviewReturnBtn");
    const photoInput = document.getElementById("reviewPhoto");
    const uploadZone = document.getElementById("reviewUploadZone");
    const photoPreview = document.getElementById("reviewPhotoPreview");
    const photoImage = document.getElementById("reviewPhotoImage");
    const photoName = document.getElementById("reviewPhotoName");
    const removePhotoButton = document.getElementById("removeReviewPhotoBtn");
    const filterButtons = [...document.querySelectorAll("[data-rating-filter]")];
    const showAllButton = document.getElementById("showAllReviewsBtn");
    const sortSelect = document.getElementById("reviewSort");

    if (!dialog || !form || !ratingInput || !starButtons.length) return;

    let currentStep = 1;
    let selectedRating = 0;
    let photoPreviewUrl = "";
    let opener = null;

    const showFormError = (message) => {
        formStatus.textContent = message;
        formStatus.classList.toggle("is-error", Boolean(message));
    };

    const paintStars = (value) => {
        starButtons.forEach((button) => {
            const rating = Number(button.dataset.value);
            const isActive = rating <= value;
            button.textContent = isActive ? "★" : "☆";
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-checked", String(rating === selectedRating));
            button.tabIndex = rating === (selectedRating || 1) ? 0 : -1;
        });
    };

    const previewStars = (value) => {
        paintStars(value);
        if (ratingDescription) ratingDescription.textContent = `${value} — ${reviewRatingLabels[value]}`;
    };

    const setStars = (value, focus = false) => {
        selectedRating = value;
        ratingInput.value = String(value);
        paintStars(value);
        if (ratingDescription) ratingDescription.textContent = `${value} — ${reviewRatingLabels[value]}`;
        if (focus) starButtons[value - 1]?.focus();
    };

    const setStep = (step) => {
        currentStep = Math.min(4, Math.max(1, step));
        steps.forEach((section) => {
            const active = Number(section.dataset.step) === currentStep;
            section.hidden = !active;
            section.classList.toggle("is-current", active);
        });
        stepCount.textContent = `${currentStep} de 4`;
        progressBar.setAttribute("aria-valuenow", String(currentStep));
        progressBar.setAttribute("aria-valuetext", `Etapa ${currentStep} de 4`);
        progressBar.style.setProperty("--review-progress", `${currentStep * 25}%`);
        backButton.hidden = currentStep === 1;
        nextButton.hidden = currentStep === 4;
        submitButton.hidden = currentStep !== 4;
        cancelButton.hidden = currentStep !== 1;
        showFormError("");
        const focusTarget = currentStep === 1
            ? starButtons[selectedRating ? selectedRating - 1 : 0]
            : steps[currentStep - 1].querySelector("input:not([type='file']), textarea, button");
        focusTarget?.focus({ preventScroll: true });
    };

    const clearPhotoPreview = () => {
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        photoPreviewUrl = "";
        photoInput.value = "";
        photoImage.removeAttribute("src");
        photoName.textContent = "";
        photoPreview.hidden = true;
        uploadZone.hidden = false;
    };

    const previewPhoto = (file) => {
        if (!file) return true;
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const extensionIsAllowed = /\.(?:jpe?g|png|webp)$/i.test(file.name);
        if (!(allowedTypes.includes(file.type) || (!file.type && extensionIsAllowed))) {
            showFormError("Formato de imagem inválido. Escolha uma imagem JPG, PNG ou WEBP.");
            photoInput.value = "";
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            showFormError("A imagem deve ter até 2 MB.");
            photoInput.value = "";
            return false;
        }
        showFormError("");
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        photoPreviewUrl = URL.createObjectURL(file);
        photoImage.src = photoPreviewUrl;
        photoName.textContent = file.name;
        photoPreview.hidden = false;
        uploadZone.hidden = true;
        return true;
    };

    const validateStep = () => {
        if (currentStep === 1 && !selectedRating) {
            showFormError("Escolha uma nota para continuar.");
            starButtons[0].focus();
            return false;
        }
        if (currentStep === 2) {
            const comment = form.elements.comment.value.trim();
            if (comment.length < 20) {
                showFormError("Conte sua experiência com pelo menos 20 caracteres.");
                form.elements.comment.focus();
                return false;
            }
        }
        if (currentStep === 3) {
            const name = form.elements.name.value.trim();
            if (!name) {
                showFormError("Informe seu nome para continuar.");
                form.elements.name.focus();
                return false;
            }
            if (form.elements.email.value && !form.elements.email.validity.valid) {
                showFormError("Confira se o e-mail informado está correto.");
                form.elements.email.focus();
                return false;
            }
        }
        showFormError("");
        return true;
    };

    starButtons.forEach((button) => {
        button.addEventListener("click", () => setStars(Number(button.dataset.value)));
        button.addEventListener("mouseenter", () => previewStars(Number(button.dataset.value)));
        button.addEventListener("mouseleave", () => {
            paintStars(selectedRating);
            if (ratingDescription) ratingDescription.textContent = selectedRating
                ? `${selectedRating} — ${reviewRatingLabels[selectedRating]}`
                : "Selecione uma nota";
        });
        button.addEventListener("focus", () => previewStars(Number(button.dataset.value)));
        button.addEventListener("blur", () => {
            paintStars(selectedRating);
            if (ratingDescription) ratingDescription.textContent = selectedRating
                ? `${selectedRating} — ${reviewRatingLabels[selectedRating]}`
                : "Selecione uma nota";
        });
        button.addEventListener("keydown", (event) => {
            const index = starButtons.indexOf(button);
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                setStars(Math.min(5, index + 2), true);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                setStars(Math.max(1, index), true);
            } else if (event.key === "Home") {
                event.preventDefault();
                setStars(1, true);
            } else if (event.key === "End") {
                event.preventDefault();
                setStars(5, true);
            }
        });
    });

    if (openButton) openButton.addEventListener("click", () => {
        opener = openButton;
        form.reset();
        selectedRating = 0;
        ratingInput.value = "";
        paintStars(0);
        if (ratingDescription) ratingDescription.textContent = "Selecione uma nota";
        clearPhotoPreview();
        setStep(1);
        successPanel.hidden = true;
        form.hidden = false;
        document.getElementById("reviewStepProgress").hidden = false;
        openReviewDialog();
    });
    if (cancelButton) cancelButton.addEventListener("click", closeReviewDialog);
    if (closeButton) closeButton.addEventListener("click", closeReviewDialog);
    if (returnButton) returnButton.addEventListener("click", closeReviewDialog);
    backButton.addEventListener("click", () => setStep(currentStep - 1));
    nextButton.addEventListener("click", () => {
        if (validateStep()) setStep(currentStep + 1);
    });

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeReviewDialog();
    });

    dialog.addEventListener("close", () => {
        if (opener?.isConnected) opener.focus();
    });

    if (photoInput) photoInput.addEventListener("change", () => previewPhoto(photoInput.files?.[0]));
    if (removePhotoButton) removePhotoButton.addEventListener("click", clearPhotoPreview);
    if (uploadZone) {
        ["dragenter", "dragover"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.add("is-dragging");
        }));
        ["dragleave", "drop"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.remove("is-dragging");
        }));
        uploadZone.addEventListener("drop", (event) => {
            const file = event.dataTransfer.files?.[0];
            if (!file || !previewPhoto(file)) return;
            const transfer = new DataTransfer();
            transfer.items.add(file);
            photoInput.files = transfer.files;
        });
    }

    filterButtons.forEach((button) => button.addEventListener("click", () => {
        activeReviewFilter = button.dataset.ratingFilter;
        showAllPublicReviews = false;
        filterButtons.forEach((filter) => {
            const active = filter === button;
            filter.classList.toggle("is-active", active);
            filter.setAttribute("aria-pressed", String(active));
        });
        renderPublicReviews();
    }));
    if (sortSelect) sortSelect.addEventListener("change", renderPublicReviews);
    if (showAllButton) showAllButton.addEventListener("click", () => {
        showAllPublicReviews = !showAllPublicReviews;
        renderPublicReviews();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (currentStep !== 4) {
            if (validateStep()) setStep(currentStep + 1);
            return;
        }
        const consent = form.elements.consent.checked;
        if (!consent) {
            showFormError("Marque a autorização para enviar sua avaliação.");
            form.elements.consent.focus();
            return;
        }

        const name = (form.elements.name.value || "").trim();
        const email = (form.elements.email.value || "").trim();
        const rating = Number(form.elements.rating.value || 0);
        const comment = (form.elements.comment.value || "").trim();
        const file = form.elements.photo.files?.[0];

        if (!name || !comment || !consent || !rating || comment.length < 20 || (file && !previewPhoto(file))) {
            if (!formStatus.textContent) showFormError("Confira os campos antes de enviar sua avaliação.");
            return;
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

        const setSubmitting = (submitting) => {
            submitButton.disabled = submitting;
            submitButton.innerHTML = submitting
                ? '<span class="review-loading-spinner" aria-hidden="true"></span> Enviando...'
                : "Enviar avaliação";
            if (submitting) showFormError("");
        };

        const completeSubmission = () => {
            form.reset();
            selectedRating = 0;
            ratingInput.value = "";
            paintStars(0);
            clearPhotoPreview();
            renderPublicReviews();
            form.hidden = true;
            document.getElementById("reviewStepProgress").hidden = true;
            successPanel.hidden = false;
            successPanel.querySelector("button")?.focus();
            setSubmitting(false);
        };

        const savePendingReview = () => {
            nextReviews.unshift(review);
            if (!saveReviews(nextReviews)) {
                setSubmitting(false);
                showFormError("Não foi possível salvar sua avaliação. Tente novamente.");
                return;
            }
            completeSubmission();
        };

        setSubmitting(true);
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                review.photo = String(reader.result || "");
                savePendingReview();
            };
            reader.onerror = () => {
                setSubmitting(false);
                showFormError("Não foi possível ler essa imagem. Tente escolher outro arquivo.");
            };
            reader.readAsDataURL(file);
            return;
        }

        savePendingReview();
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
