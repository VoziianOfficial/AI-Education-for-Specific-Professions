(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const coursesState = {
        activePathIndex: 0,
        pathTransitionTimer: null
    };

    const comparisonDetails = {
        "profession-guides": {
            "bestFor": "Independent role exploration",
            "interaction": "Self-directed",
            "focus": "Role context, tasks, prompts, and review habits",
            "nextStep": "Explore a profession page"
        },
        "prompt-workshops": {
            "bestFor": "Professionals building clearer prompt habits",
            "interaction": "Facilitated practice",
            "focus": "Context, constraints, output structure, and review criteria",
            "nextStep": "Submit a workshop inquiry"
        },
        "tool-tutorials": {
            "bestFor": "Visitors comparing AI tool categories",
            "interaction": "Guided or self-directed",
            "focus": "Use cases, limitations, review needs, and team fit",
            "nextStep": "Ask about available tutorials"
        },
        "workflow-sessions": {
            "bestFor": "Professionals mapping a recurring task",
            "interaction": "Practical session",
            "focus": "Preparation, generation, review, and application",
            "nextStep": "Describe the workflow"
        },
        "team-training": {
            "bestFor": "Teams developing shared working habits",
            "interaction": "Group learning",
            "focus": "Role differences, governance, review, and responsible use",
            "nextStep": "Start a corporate inquiry"
        },
        "custom-programs": {
            "bestFor": "Organizations with several roles or specific priorities",
            "interaction": "Inquiry-based",
            "focus": "Tailored topics, formats, professional contexts, and delivery",
            "nextStep": "Share your requirements"
        }
    };

    function getProfessionForPath(path) {
        if (!path) {
            return null;
        }

        return config.professions.find(function (profession) {
            return profession.page === path.href;
        }) || config.professions.find(function (profession) {
            return profession.shortTitle === path.profession;
        }) || null;
    }

    function preloadImage(src) {
        if (!src) {
            return;
        }

        const image = new Image();
        image.src = src;
    }

    function updateTabButtons(buttons, activeIndex) {
        buttons.forEach(function (button, index) {
            const active = index === activeIndex;

            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
            button.setAttribute("tabindex", active ? "0" : "-1");
        });
    }

    function focusAdjacentButton(buttons, currentIndex, direction) {
        if (!buttons.length) {
            return;
        }

        let nextIndex = currentIndex + direction;

        if (nextIndex < 0) {
            nextIndex = buttons.length - 1;
        }

        if (nextIndex >= buttons.length) {
            nextIndex = 0;
        }

        buttons[nextIndex].focus();
        buttons[nextIndex].click();
    }

    function bindTabKeyboard(buttons) {
        buttons.forEach(function (button, index) {
            if (button.dataset.coursesKeyboardInitialized) {
                return;
            }

            button.dataset.coursesKeyboardInitialized = "true";

            button.addEventListener("keydown", function (event) {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    focusAdjacentButton(buttons, index, 1);
                }

                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusAdjacentButton(buttons, index, -1);
                }

                if (event.key === "Home") {
                    event.preventDefault();
                    buttons[0].focus();
                    buttons[0].click();
                }

                if (event.key === "End") {
                    event.preventDefault();
                    buttons[buttons.length - 1].focus();
                    buttons[buttons.length - 1].click();
                }
            });
        });
    }

    function renderLearningFormats() {
        const grid = document.querySelector("[data-courses-formats]");

        if (!grid) {
            return;
        }

        grid.innerHTML = config.courses.learningFormats.map(function (format, index) {
            return [
                '<article class="courses-format-card" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 50, 200)),
                '">',
                '<div class="courses-format-card__top">',
                '<i class="courses-format-card__icon" data-lucide="',
                escapeHtml(format.icon),
                '" aria-hidden="true"></i>',
                "</div>",
                '<div class="courses-format-card__content">',
                '<h3 class="courses-format-card__title">',
                escapeHtml(format.title),
                "</h3>",
                '<p class="courses-format-card__text">',
                escapeHtml(format.description),
                "</p>",
                '<a class="courses-format-card__link" href="',
                escapeHtml(format.href),
                '">',
                escapeHtml(format.cta),
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderFeaturedPaths() {
        const root = document.querySelector("[data-courses-paths]");

        if (!root) {
            return;
        }

        const paths = config.courses.featuredLearningPaths;
        const desktopList = root.querySelector("[data-courses-path-list]");
        const mobileList = root.querySelector("[data-courses-path-mobile-list]");

        if (desktopList) {
            desktopList.innerHTML = paths.map(function (path, index) {
                const profession = getProfessionForPath(path);
                const icon = profession ? profession.icon : "book-open-text";

                return [
                    '<button class="courses-paths__button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-courses-path-button="',
                    String(index),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    '<i class="courses-paths__button-icon" data-lucide="',
                    escapeHtml(icon),
                    '" aria-hidden="true"></i>',
                    '<span class="courses-paths__button-label">',
                    escapeHtml(path.profession),
                    "</span>",
                    '<i class="courses-paths__button-arrow" data-lucide="arrow-up-right" aria-hidden="true"></i>',
                    "</button>"
                ].join("");
            }).join("");
        }

        if (mobileList) {
            mobileList.innerHTML = paths.map(function (path, index) {
                return [
                    '<button class="courses-paths__mobile-button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-courses-path-mobile-button="',
                    String(index),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    escapeHtml(path.profession),
                    "</button>"
                ].join("");
            }).join("");
        }

        paths.forEach(function (path) {
            preloadImage(path.image);
        });

        const desktopButtons = Array.from(
            root.querySelectorAll("[data-courses-path-button]")
        );

        const mobileButtons = Array.from(
            root.querySelectorAll("[data-courses-path-mobile-button]")
        );

        desktopButtons.forEach(function (button) {
            const index = Number(button.dataset.coursesPathButton);

            button.addEventListener("click", function () {
                setFeaturedPath(index);
            });

            button.addEventListener("focus", function () {
                setFeaturedPath(index);
            });

            button.addEventListener("mouseenter", function () {
                if (window.matchMedia("(hover: hover)").matches) {
                    setFeaturedPath(index);
                }
            });
        });

        mobileButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setFeaturedPath(
                    Number(button.dataset.coursesPathMobileButton)
                );
            });
        });

        bindTabKeyboard(desktopButtons);
        bindTabKeyboard(mobileButtons);
        setFeaturedPath(0, true);
    }

    function setFeaturedPath(index, immediate) {
        const root = document.querySelector("[data-courses-paths]");
        const paths = config.courses.featuredLearningPaths;

        if (!root || !paths.length) {
            return;
        }

        const safeIndex = Math.max(
            0,
            Math.min(index, paths.length - 1)
        );

        if (
            safeIndex === coursesState.activePathIndex &&
            !immediate
        ) {
            return;
        }

        const path = paths[safeIndex];
        const profession = getProfessionForPath(path);
        const iconName = profession
            ? profession.icon
            : "book-open-text";

        coursesState.activePathIndex = safeIndex;

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-courses-path-button]")),
            safeIndex
        );

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-courses-path-mobile-button]")),
            safeIndex
        );

        const stage = root.querySelector("[data-courses-path-stage]");
        const image = root.querySelector("[data-courses-path-image]");
        const icon = root.querySelector("[data-courses-path-icon]");
        const label = root.querySelector("[data-courses-path-label]");
        const title = root.querySelector("[data-courses-path-title]");
        const description = root.querySelector("[data-courses-path-description]");
        const skills = root.querySelector("[data-courses-path-skills]");
        const link = root.querySelector("[data-courses-path-link]");

        if (coursesState.pathTransitionTimer) {
            window.clearTimeout(
                coursesState.pathTransitionTimer
            );
        }

        function updateContent() {
            if (image) {
                image.src = path.image;
                image.alt =
                    path.profession +
                    " professionals participating in practical AI learning";
            }

            if (icon) {
                icon.innerHTML =
                    '<i data-lucide="' +
                    escapeHtml(iconName) +
                    '" aria-hidden="true"></i>';
            }

            if (label) {
                label.textContent =
                    path.profession + " · " + path.format;
            }

            if (title) {
                title.textContent = path.title;
            }

            if (description) {
                description.textContent = path.description;
            }

            if (skills) {
                skills.innerHTML = path.skills.map(function (skill) {
                    return '<span class="courses-paths__skill">' +
                        escapeHtml(skill) +
                        "</span>";
                }).join("");
            }

            if (link) {
                link.href = path.href;
                link.setAttribute(
                    "aria-label",
                    "Explore " + path.title
                );
            }

            if (stage) {
                stage.classList.remove("is-changing");
            }

            Rolewise.refreshIcons();
            Rolewise.refreshAOS();
        }

        if (immediate || Rolewise.state.reducedMotion) {
            updateContent();
            return;
        }

        if (stage) {
            stage.classList.add("is-changing");
        }

        coursesState.pathTransitionTimer = window.setTimeout(
            updateContent,
            180
        );
    }

    function renderWorkshopFormats() {
        const grid = document.querySelector("[data-courses-workshops]");

        if (!grid) {
            return;
        }

        grid.innerHTML = config.courses.workshopFormats.map(function (format, index) {
            const markers = [
                "Shared context",
                "Guided exercises",
                "Role discussion",
                "Tailored direction"
            ];

            return [
                '<article class="courses-workshop-card" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 50, 150)),
                '">',
                '<i class="courses-workshop-card__icon" data-lucide="',
                escapeHtml(format.icon),
                '" aria-hidden="true"></i>',
                '<h3 class="courses-workshop-card__title">',
                escapeHtml(format.title),
                "</h3>",
                '<p class="courses-workshop-card__text">',
                escapeHtml(format.description),
                "</p>",
                '<span class="courses-workshop-card__marker">',
                escapeHtml(markers[index] || "Practical learning"),
                "</span>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderTeamFormats() {
        const container = document.querySelector("[data-courses-team-formats]");

        if (!container) {
            return;
        }

        container.innerHTML = config.courses.teamFormats.map(function (format) {
            return [
                '<div class="courses-teams__format">',
                '<i class="courses-teams__format-icon" data-lucide="',
                escapeHtml(format.icon),
                '" aria-hidden="true"></i>',
                '<div class="courses-teams__format-content">',
                '<span class="courses-teams__format-title">',
                escapeHtml(format.title),
                "</span>",
                '<span class="courses-teams__format-text">',
                escapeHtml(format.description),
                "</span>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderComparisonTable() {
        const body = document.querySelector("[data-courses-compare-rows]");

        if (!body) {
            return;
        }

        body.innerHTML = config.courses.learningFormats.map(function (format) {
            const details = comparisonDetails[format.slug] || {
                "bestFor": "Visitors exploring a practical learning option",
                "interaction": "Format may vary",
                "focus": format.description,
                "nextStep": format.cta
            };

            return [
                '<div class="courses-compare__row">',
                '<div class="courses-compare__cell">',
                '<span class="courses-compare__mobile-label">Format</span>',
                '<span class="courses-compare__format">',
                '<i data-lucide="',
                escapeHtml(format.icon),
                '" aria-hidden="true"></i>',
                escapeHtml(format.title),
                "</span>",
                "</div>",
                '<div class="courses-compare__cell">',
                '<span class="courses-compare__mobile-label">Best for</span>',
                "<span>",
                escapeHtml(details.bestFor),
                "</span>",
                "</div>",
                '<div class="courses-compare__cell">',
                '<span class="courses-compare__mobile-label">Interaction</span>',
                "<span>",
                escapeHtml(details.interaction),
                "</span>",
                "</div>",
                '<div class="courses-compare__cell">',
                '<span class="courses-compare__mobile-label">Primary focus</span>',
                "<span>",
                escapeHtml(details.focus),
                "</span>",
                "</div>",
                '<div class="courses-compare__cell">',
                '<span class="courses-compare__mobile-label">Next step</span>',
                '<a class="ui-icon-link" href="',
                escapeHtml(format.href),
                '">',
                escapeHtml(details.nextStep),
                '<i data-lucide="arrow-up-right" aria-hidden="true"></i>',
                "</a>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function initializeCourses() {
        if (!document.body.classList.contains("courses-page")) {
            return;
        }

        renderLearningFormats();
        renderFeaturedPaths();
        renderWorkshopFormats();
        renderTeamFormats();
        renderComparisonTable();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeCourses,
            {
                "once": true
            }
        );
    } else {
        initializeCourses();
    }
}());
