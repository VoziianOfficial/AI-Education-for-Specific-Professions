(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const professionsState = {
        activeSelectorProfession: config.professions[0]
            ? config.professions[0].slug
            : "",
        activePromptProfession: config.professions[0]
            ? config.professions[0].slug
            : "",
        activeToolCategory: "Writing & Research",
        selectorTransitionTimer: null,
        copyResetTimer: null
    };

    const toolIcons = {
        "Writing & Research": "file-search",
        "Analysis": "chart-no-axes-combined",
        "Content Creation": "pen-tool",
        "Automation": "workflow",
        "Communication": "messages-square"
    };

    const sharedSkills = [
        {
            "title": "Prompting",
            "description": "Provide clear purpose, approved context, constraints, examples, output structure, and review criteria.",
            "icon": "message-square-text"
        },
        {
            "title": "Reviewing",
            "description": "Check accuracy, relevance, completeness, assumptions, source support, tone, and professional suitability.",
            "icon": "scan-search"
        },
        {
            "title": "Organizing",
            "description": "Turn supplied information into structured notes, checklists, summaries, categories, and working documents.",
            "icon": "list-tree"
        },
        {
            "title": "Comparing",
            "description": "Evaluate options through stated criteria without treating generated output as a final recommendation.",
            "icon": "columns-3"
        },
        {
            "title": "Documenting",
            "description": "Record source material, changes, unresolved questions, review decisions, and responsible ownership.",
            "icon": "notebook-tabs"
        },
        {
            "title": "Communicating",
            "description": "Adapt reviewed information for the intended audience while preserving accuracy, context, and appropriate tone.",
            "icon": "messages-square"
        }
    ];

    function getProfession(slug) {
        return config.professions.find(function (profession) {
            return profession.slug === slug;
        }) || config.professions[0] || null;
    }

    function getToolByCategory(profession, category) {
        if (!profession || !Array.isArray(profession.toolCategories)) {
            return null;
        }

        return profession.toolCategories.find(function (tool) {
            return tool.name === category;
        }) || null;
    }

    function preloadImage(src) {
        if (!src) {
            return;
        }

        const image = new Image();
        image.src = src;
    }

    function updateTabButtons(buttons, activeValue, attributeName) {
        buttons.forEach(function (button) {
            const active =
                button.getAttribute(attributeName) === activeValue;

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
            if (button.dataset.professionsKeyboardInitialized) {
                return;
            }

            button.dataset.professionsKeyboardInitialized = "true";

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

    function renderDirectory() {
        const grid = document.querySelector("[data-professions-directory]");

        if (!grid) {
            return;
        }

        grid.innerHTML = config.professions.map(function (profession) {
            const taskMarkup = profession.tasks.slice(0, 3).map(function (task) {
                return '<span class="professions-directory-card__task">' +
                    escapeHtml(task) +
                    "</span>";
            }).join("");

            return [
                '<a class="professions-directory-card" href="',
                escapeHtml(profession.page),
                '" style="--directory-image: url(\'',
                escapeHtml(profession.directoryImage),
                '\')" aria-label="Explore ',
                escapeHtml(profession.title),
                '">',
                '<span class="professions-directory-card__top">',
                '<i class="professions-directory-card__icon" data-lucide="',
                escapeHtml(profession.icon),
                '" aria-hidden="true"></i>',
                '<span class="professions-directory-card__arrow" aria-hidden="true">',
                '<i data-lucide="arrow-up-right"></i>',
                "</span>",
                "</span>",
                '<span class="professions-directory-card__content">',
                '<span class="professions-directory-card__title">',
                escapeHtml(profession.title),
                "</span>",
                '<span class="professions-directory-card__description">',
                escapeHtml(profession.description),
                "</span>",
                '<span class="professions-directory-card__tasks">',
                taskMarkup,
                "</span>",
                "</span>",
                "</a>"
            ].join("");
        }).join("");

        grid.querySelectorAll(".professions-directory-card").forEach(function (card) {
            const imageUrl = card.style.getPropertyValue("--directory-image");

            if (imageUrl) {
                const match = imageUrl.match(/url\(["']?(.*?)["']?\)/);

                if (match && match[1]) {
                    preloadImage(match[1]);
                }
            }
        });

        Rolewise.refreshIcons();
    }

    function renderMosaic() {
        const grid = document.querySelector("[data-professions-mosaic]");

        if (!grid) {
            return;
        }

        grid.innerHTML = config.professions.map(function (profession, index) {
            const wideClass = index === 2 || index === 5
                ? " professions-mosaic__card--wide"
                : "";

            return [
                '<a class="professions-mosaic__card',
                wideClass,
                '" href="',
                escapeHtml(profession.page),
                '" aria-label="Explore ',
                escapeHtml(profession.title),
                '">',
                '<img class="professions-mosaic__image" src="',
                escapeHtml(profession.mosaicImage),
                '" alt="',
                escapeHtml(profession.shortTitle),
                ' professional working in an authentic workplace setting" width="1000" height="760" loading="lazy">',
                '<span class="professions-mosaic__overlay" aria-hidden="true"></span>',
                '<span class="professions-mosaic__arrow" aria-hidden="true">',
                '<i data-lucide="arrow-up-right"></i>',
                "</span>",
                '<span class="professions-mosaic__content">',
                '<span class="professions-mosaic__label">Profession learning path</span>',
                '<span class="professions-mosaic__title">',
                escapeHtml(profession.shortTitle),
                "</span>",
                "</span>",
                "</a>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderSelector() {
        const root = document.querySelector("[data-professions-selector]");

        if (!root) {
            return;
        }

        const desktopList = root.querySelector("[data-professions-selector-list]");
        const mobileList = root.querySelector("[data-professions-selector-mobile-list]");

        if (desktopList) {
            desktopList.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="professions-selector__button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-professions-selector-button="',
                    escapeHtml(profession.slug),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    '<i class="professions-selector__button-icon" data-lucide="',
                    escapeHtml(profession.icon),
                    '" aria-hidden="true"></i>',
                    '<span class="professions-selector__button-label">',
                    escapeHtml(profession.shortTitle),
                    "</span>",
                    '<i class="professions-selector__button-arrow" data-lucide="arrow-up-right" aria-hidden="true"></i>',
                    "</button>"
                ].join("");
            }).join("");
        }

        if (mobileList) {
            mobileList.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="professions-selector__mobile-button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-professions-selector-mobile-button="',
                    escapeHtml(profession.slug),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    escapeHtml(profession.shortTitle),
                    "</button>"
                ].join("");
            }).join("");
        }

        const desktopButtons = Array.from(
            root.querySelectorAll("[data-professions-selector-button]")
        );

        const mobileButtons = Array.from(
            root.querySelectorAll("[data-professions-selector-mobile-button]")
        );

        desktopButtons.forEach(function (button) {
            const slug = button.dataset.professionsSelectorButton;
            const profession = getProfession(slug);

            if (profession) {
                preloadImage(profession.directoryImage);
            }

            button.addEventListener("click", function () {
                setSelectorProfession(slug);
            });

            button.addEventListener("focus", function () {
                setSelectorProfession(slug);
            });

            button.addEventListener("mouseenter", function () {
                if (window.matchMedia("(hover: hover)").matches) {
                    setSelectorProfession(slug);
                }
            });
        });

        mobileButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setSelectorProfession(
                    button.dataset.professionsSelectorMobileButton
                );
            });
        });

        bindTabKeyboard(desktopButtons);
        bindTabKeyboard(mobileButtons);

        setSelectorProfession(
            professionsState.activeSelectorProfession,
            true
        );
    }

    function setSelectorProfession(slug, immediate) {
        const profession = getProfession(slug);
        const root = document.querySelector("[data-professions-selector]");

        if (!profession || !root) {
            return;
        }

        if (
            profession.slug === professionsState.activeSelectorProfession &&
            !immediate
        ) {
            return;
        }

        professionsState.activeSelectorProfession = profession.slug;

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-professions-selector-button]")),
            profession.slug,
            "data-professions-selector-button"
        );

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-professions-selector-mobile-button]")),
            profession.slug,
            "data-professions-selector-mobile-button"
        );

        const stage = root.querySelector("[data-professions-selector-stage]");
        const image = root.querySelector("[data-professions-selector-image]");
        const icon = root.querySelector("[data-professions-selector-icon]");
        const label = root.querySelector("[data-professions-selector-label]");
        const title = root.querySelector("[data-professions-selector-title]");
        const description = root.querySelector("[data-professions-selector-description]");
        const tasks = root.querySelector("[data-professions-selector-tasks]");
        const link = root.querySelector("[data-professions-selector-link]");

        if (professionsState.selectorTransitionTimer) {
            window.clearTimeout(
                professionsState.selectorTransitionTimer
            );
        }

        function updateContent() {
            if (image) {
                image.src = profession.directoryImage;
                image.alt =
                    profession.shortTitle +
                    " professional working in an authentic workplace";
            }

            if (icon) {
                icon.innerHTML =
                    '<i data-lucide="' +
                    escapeHtml(profession.icon) +
                    '" aria-hidden="true"></i>';
            }

            if (label) {
                label.textContent = profession.shortTitle;
            }

            if (title) {
                title.textContent = profession.title;
            }

            if (description) {
                description.textContent = profession.description;
            }

            if (tasks) {
                tasks.innerHTML = profession.tasks.slice(0, 5).map(function (task) {
                    return '<span class="professions-selector__task">' +
                        escapeHtml(task) +
                        "</span>";
                }).join("");
            }

            if (link) {
                link.href = profession.page;
                link.setAttribute(
                    "aria-label",
                    "Explore " + profession.title
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

        professionsState.selectorTransitionTimer = window.setTimeout(
            updateContent,
            180
        );
    }

    function renderWorkflowDirectory() {
        const list = document.querySelector("[data-professions-workflows]");

        if (!list) {
            return;
        }

        list.innerHTML = config.professions.map(function (profession) {
            const taskTags = profession.tasks.slice(0, 4).map(function (task) {
                return '<span class="professions-workflows__tag">' +
                    escapeHtml(task) +
                    "</span>";
            }).join("");

            const workflowTags = profession.workflows.slice(0, 3).map(function (workflow) {
                return '<span class="professions-workflows__tag">' +
                    escapeHtml(workflow.title) +
                    "</span>";
            }).join("");

            return [
                '<article class="professions-workflows__row">',
                '<div class="professions-workflows__profession">',
                '<i class="professions-workflows__profession-icon" data-lucide="',
                escapeHtml(profession.icon),
                '" aria-hidden="true"></i>',
                '<h3 class="professions-workflows__profession-title">',
                escapeHtml(profession.shortTitle),
                "</h3>",
                "</div>",
                '<div class="professions-workflows__content">',
                '<div class="professions-workflows__group">',
                '<span class="professions-workflows__group-label">Task examples</span>',
                '<div class="professions-workflows__tags">',
                taskTags,
                "</div>",
                "</div>",
                '<div class="professions-workflows__group">',
                '<span class="professions-workflows__group-label">Workflow topics</span>',
                '<div class="professions-workflows__tags">',
                workflowTags,
                "</div>",
                "</div>",
                "</div>",
                '<a class="professions-workflows__link" href="',
                escapeHtml(profession.page),
                '" aria-label="Explore ',
                escapeHtml(profession.title),
                '">',
                '<i data-lucide="arrow-up-right" aria-hidden="true"></i>',
                "</a>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderSharedSkills() {
        const grid = document.querySelector("[data-professions-skills]");

        if (!grid) {
            return;
        }

        grid.innerHTML = sharedSkills.map(function (skill, index) {
            const delay = Math.min(index * 40, 180);

            return [
                '<article class="professions-skill" data-aos="fade-up" data-aos-delay="',
                String(delay),
                '">',
                '<i class="professions-skill__icon" data-lucide="',
                escapeHtml(skill.icon),
                '" aria-hidden="true"></i>',
                '<h3 class="professions-skill__title">',
                escapeHtml(skill.title),
                "</h3>",
                '<p class="professions-skill__text">',
                escapeHtml(skill.description),
                "</p>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderPromptFilters() {
        const root = document.querySelector("[data-professions-prompts]");

        if (!root) {
            return;
        }

        const tabs = root.querySelector("[data-professions-prompt-tabs]");

        if (tabs) {
            tabs.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="ui-tabs__button" type="button" role="tab" data-professions-prompt-tab="',
                    escapeHtml(profession.slug),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    escapeHtml(profession.shortTitle),
                    "</button>"
                ].join("");
            }).join("");
        }

        const buttons = Array.from(
            root.querySelectorAll("[data-professions-prompt-tab]")
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setPromptProfession(
                    button.dataset.professionsPromptTab
                );
            });
        });

        bindTabKeyboard(buttons);

        setPromptProfession(
            professionsState.activePromptProfession
        );
    }

    function setPromptProfession(slug) {
        const profession = getProfession(slug);
        const root = document.querySelector("[data-professions-prompts]");

        if (!profession || !root) {
            return;
        }

        professionsState.activePromptProfession = profession.slug;

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-professions-prompt-tab]")),
            profession.slug,
            "data-professions-prompt-tab"
        );

        const list = root.querySelector("[data-professions-prompt-list]");

        if (!list) {
            return;
        }

        list.innerHTML = profession.prompts.slice(0, 3).map(function (prompt, index) {
            const id =
                "professions-copy-" +
                profession.slug +
                "-" +
                String(index);

            return [
                '<article class="professions-prompt-card">',
                '<div class="professions-prompt-card__top">',
                '<span class="professions-prompt-card__category">',
                escapeHtml(prompt.category),
                "</span>",
                '<button class="professions-prompt-card__copy" id="',
                escapeHtml(id),
                '" type="button" data-professions-copy-prompt data-prompt-text="',
                escapeHtml(prompt.prompt),
                '" aria-label="Copy ',
                escapeHtml(prompt.title),
                ' prompt">',
                '<i data-lucide="copy" aria-hidden="true"></i>',
                '<span data-copy-status>',
                escapeHtml(config.ui.buttons.copyPrompt),
                "</span>",
                "</button>",
                "</div>",
                '<h3 class="professions-prompt-card__title">',
                escapeHtml(prompt.title),
                "</h3>",
                '<p class="professions-prompt-card__prompt">',
                escapeHtml(prompt.prompt),
                "</p>",
                '<div class="professions-prompt-card__footer">',
                '<span class="professions-prompt-card__profession">',
                escapeHtml(profession.shortTitle),
                "</span>",
                "<span>Review before use</span>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        bindCopyButtons(list);
        Rolewise.refreshIcons();
        Rolewise.refreshAOS();
    }

    function writeClipboard(text) {
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function" &&
            window.isSecureContext
        ) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            const textarea = document.createElement("textarea");

            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.top = "-9999px";
            textarea.style.left = "-9999px";

            document.body.appendChild(textarea);
            textarea.select();

            try {
                const successful = document.execCommand("copy");

                textarea.remove();

                if (successful) {
                    resolve();
                } else {
                    reject(new Error("Copy failed"));
                }
            } catch (error) {
                textarea.remove();
                reject(error);
            }
        });
    }

    function resetCopyButton(button) {
        button.classList.remove("is-copied");

        const status = button.querySelector("[data-copy-status]");

        if (status) {
            status.textContent = config.ui.buttons.copyPrompt;
        }

        const icon = button.querySelector("svg, [data-lucide]");

        if (icon) {
            icon.outerHTML =
                '<i data-lucide="copy" aria-hidden="true"></i>';
        }

        Rolewise.refreshIcons();
    }

    function bindCopyButtons(scope) {
        scope.querySelectorAll("[data-professions-copy-prompt]").forEach(function (button) {
            if (button.dataset.copyInitialized) {
                return;
            }

            button.dataset.copyInitialized = "true";

            button.addEventListener("click", function () {
                const prompt = button.dataset.promptText || "";
                const status = button.querySelector("[data-copy-status]");

                if (!prompt) {
                    return;
                }

                writeClipboard(prompt).then(function () {
                    document.querySelectorAll("[data-professions-copy-prompt].is-copied").forEach(function (activeButton) {
                        if (activeButton !== button) {
                            resetCopyButton(activeButton);
                        }
                    });

                    button.classList.add("is-copied");

                    if (status) {
                        status.textContent = config.ui.buttons.copied;
                    }

                    const icon = button.querySelector("svg, [data-lucide]");

                    if (icon) {
                        icon.outerHTML =
                            '<i data-lucide="check" aria-hidden="true"></i>';
                    }

                    Rolewise.refreshIcons();

                    if (professionsState.copyResetTimer) {
                        window.clearTimeout(
                            professionsState.copyResetTimer
                        );
                    }

                    professionsState.copyResetTimer = window.setTimeout(function () {
                        resetCopyButton(button);
                    }, 2200);
                }).catch(function () {
                    if (status) {
                        status.textContent = "Copy unavailable";
                    }

                    window.setTimeout(function () {
                        if (status) {
                            status.textContent = config.ui.buttons.copyPrompt;
                        }
                    }, 2200);
                });
            });
        });
    }

    function renderToolFilters() {
        const root = document.querySelector("[data-professions-tools]");

        if (!root) {
            return;
        }

        const categories = [
            "Writing & Research",
            "Analysis",
            "Content Creation",
            "Automation",
            "Communication"
        ];

        const tabs = root.querySelector("[data-professions-tool-tabs]");

        if (tabs) {
            tabs.innerHTML = categories.map(function (category, index) {
                return [
                    '<button class="ui-tabs__button" type="button" role="tab" data-professions-tool-tab="',
                    escapeHtml(category),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    escapeHtml(category),
                    "</button>"
                ].join("");
            }).join("");
        }

        const buttons = Array.from(
            root.querySelectorAll("[data-professions-tool-tab]")
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setToolCategory(
                    button.dataset.professionsToolTab
                );
            });
        });

        bindTabKeyboard(buttons);

        setToolCategory(
            professionsState.activeToolCategory
        );
    }

    function setToolCategory(category) {
        const root = document.querySelector("[data-professions-tools]");

        if (!root) {
            return;
        }

        professionsState.activeToolCategory = category;

        updateTabButtons(
            Array.from(root.querySelectorAll("[data-professions-tool-tab]")),
            category,
            "data-professions-tool-tab"
        );

        const grid = root.querySelector("[data-professions-tool-grid]");

        if (!grid) {
            return;
        }

        grid.innerHTML = config.professions.map(function (profession) {
            const tool = getToolByCategory(profession, category);

            if (!tool) {
                return "";
            }

            return [
                '<article class="professions-tool-card">',
                '<span class="professions-tool-card__icon" aria-hidden="true">',
                '<i data-lucide="',
                escapeHtml(toolIcons[category] || profession.icon),
                '"></i>',
                "</span>",
                '<div class="professions-tool-card__content">',
                '<span class="professions-tool-card__profession">',
                escapeHtml(profession.shortTitle),
                "</span>",
                '<h3 class="professions-tool-card__title">',
                escapeHtml(category),
                "</h3>",
                '<p class="professions-tool-card__description">',
                escapeHtml(tool.useCase),
                "</p>",
                '<div class="professions-tool-card__meta">',
                '<div class="professions-tool-card__meta-row">',
                '<span class="professions-tool-card__meta-label">Review needs</span>',
                "<span>",
                escapeHtml(tool.reviewNeeds),
                "</span>",
                "</div>",
                '<div class="professions-tool-card__meta-row">',
                '<span class="professions-tool-card__meta-label">Team fit</span>',
                "<span>",
                escapeHtml(tool.teamFit),
                "</span>",
                "</div>",
                '<div class="professions-tool-card__meta-row">',
                '<span class="professions-tool-card__meta-label">Learning curve</span>',
                "<span>",
                escapeHtml(tool.learningCurve),
                "</span>",
                "</div>",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
        Rolewise.refreshAOS();
    }

    function renderLearningFormats() {
        const container = document.querySelector("[data-professions-learning]");

        if (!container) {
            return;
        }

        const selectedSlugs = [
            "profession-guides",
            "prompt-workshops",
            "team-training"
        ];

        const formats = selectedSlugs.map(function (slug) {
            return config.courses.learningFormats.find(function (format) {
                return format.slug === slug;
            });
        }).filter(Boolean);

        container.innerHTML = formats.map(function (format) {
            return [
                '<article class="professions-learning-card">',
                '<img class="professions-learning-card__image" src="',
                escapeHtml(format.image),
                '" alt="Professionals participating in ',
                escapeHtml(format.title.toLowerCase()),
                '" width="900" height="1160" loading="lazy">',
                '<span class="professions-learning-card__overlay" aria-hidden="true"></span>',
                '<div class="professions-learning-card__content">',
                '<span class="professions-learning-card__icon" aria-hidden="true">',
                '<i data-lucide="',
                escapeHtml(format.icon),
                '"></i>',
                "</span>",
                '<h3 class="professions-learning-card__title">',
                escapeHtml(format.title),
                "</h3>",
                '<p class="professions-learning-card__text">',
                escapeHtml(format.description),
                "</p>",
                '<a class="professions-learning-card__link" href="',
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

    function renderStartChips() {
        const container = document.querySelector("[data-professions-start-chips]");

        if (!container) {
            return;
        }

        container.innerHTML = config.professions.map(function (profession) {
            return [
                '<a class="professions-start__chip" href="',
                escapeHtml(profession.page),
                '">',
                escapeHtml(profession.shortTitle),
                "</a>"
            ].join("");
        }).join("");
    }

    function initializeProfessions() {
        if (!document.body.classList.contains("professions-page")) {
            return;
        }

        renderDirectory();
        renderMosaic();
        renderSelector();
        renderWorkflowDirectory();
        renderSharedSkills();
        renderPromptFilters();
        renderToolFilters();
        renderLearningFormats();
        renderStartChips();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeProfessions,
            {
                "once": true
            }
        );
    } else {
        initializeProfessions();
    }
}());