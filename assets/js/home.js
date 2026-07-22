(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const homeState = {
        activeHeroProfession: config.professions[0] ? config.professions[0].slug : "",
        activeRoleProfession: config.professions[0] ? config.professions[0].slug : "",
        activePromptProfession: config.professions[0] ? config.professions[0].slug : "",
        activeToolCategory: "Writing & Research",
        promptCopyTimer: null,
        roleTransitionTimer: null,
        swipers: []
    };

    const toolIcons = {
        "Writing & Research": "file-search",
        "Analysis": "chart-no-axes-combined",
        "Content Creation": "pen-tool",
        "Automation": "workflow",
        "Communication": "messages-square"
    };

    function getProfession(slug) {
        return config.professions.find(function (profession) {
            return profession.slug === slug;
        }) || config.professions[0] || null;
    }

    function getProfessionTool(profession, category) {
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

    function updatePressedButtons(buttons, activeValue, attribute) {
        buttons.forEach(function (button) {
            const value = button.getAttribute(attribute);
            const active = value === activeValue;

            button.classList.toggle("is-active", active);

            if (button.hasAttribute("aria-pressed")) {
                button.setAttribute("aria-pressed", String(active));
            }

            if (button.hasAttribute("aria-selected")) {
                button.setAttribute("aria-selected", String(active));
                button.setAttribute("tabindex", active ? "0" : "-1");
            }
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

    function bindHorizontalKeyboard(buttons) {
        buttons.forEach(function (button, index) {
            if (button.dataset.homeKeyboardInitialized) {
                return;
            }

            button.dataset.homeKeyboardInitialized = "true";

            button.addEventListener("keydown", function (event) {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    focusAdjacentButton(buttons, index, 1);
                }

                if (event.key === "ArrowLeft") {
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

    function renderHeroSelector() {
        const root = document.querySelector("[data-home-hero-selector]");

        if (!root) {
            return;
        }

        const list = root.querySelector("[data-home-hero-selector-list]");

        if (!list) {
            return;
        }

        list.innerHTML = config.professions.map(function (profession, index) {
            return [
                '<button class="home-hero__selector-button',
                index === 0 ? " is-active" : "",
                '" type="button" data-home-hero-profession="',
                escapeHtml(profession.slug),
                '" aria-pressed="',
                index === 0 ? "true" : "false",
                '">',
                escapeHtml(profession.shortTitle),
                "</button>"
            ].join("");
        }).join("");

        const buttons = Array.from(
            list.querySelectorAll("[data-home-hero-profession]")
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setHeroProfession(button.dataset.homeHeroProfession);
            });
        });

        bindHorizontalKeyboard(buttons);
        setHeroProfession(homeState.activeHeroProfession);
    }

    function setHeroProfession(slug) {
        const profession = getProfession(slug);

        if (!profession) {
            return;
        }

        homeState.activeHeroProfession = profession.slug;

        const root = document.querySelector("[data-home-hero-selector]");
        const caption = document.querySelector("[data-home-hero-workflow]");
        const icon = document.querySelector("[data-home-hero-workflow-icon]");
        const status = document.querySelector("[data-home-hero-status]");

        if (root) {
            updatePressedButtons(
                Array.from(root.querySelectorAll("[data-home-hero-profession]")),
                profession.slug,
                "data-home-hero-profession"
            );
        }

        if (caption) {
            caption.textContent = profession.workflowCaption;
        }

        if (icon) {
            icon.innerHTML = '<i data-lucide="' + escapeHtml(profession.icon) + '" aria-hidden="true"></i>';
        }

        if (status) {
            status.textContent = profession.shortTitle;
        }

        Rolewise.refreshIcons();
    }

    function renderProfessionRail() {
        const track = document.querySelector("[data-home-profession-rail]");

        if (!track) {
            return;
        }

        track.innerHTML = config.professions.map(function (profession) {
            return [
                '<li class="home-profession-rail__item">',
                '<a class="home-profession-rail__link" href="',
                escapeHtml(profession.page),
                '">',
                '<i class="home-profession-rail__icon" data-lucide="',
                escapeHtml(profession.icon),
                '" aria-hidden="true"></i>',
                '<span class="home-profession-rail__label">',
                escapeHtml(profession.shortTitle),
                "</span>",
                "</a>",
                "</li>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function initBuiltTabs() {
        const root = document.querySelector("[data-home-built-tabs]");

        if (!root) {
            return;
        }

        const buttons = Array.from(
            root.querySelectorAll("[data-home-built-tab]")
        );

        const panels = Array.from(
            root.querySelectorAll("[data-home-built-panel]")
        );

        if (!buttons.length || !panels.length) {
            return;
        }

        function activate(value) {
            buttons.forEach(function (button) {
                const active = button.dataset.homeBuiltTab === value;

                button.setAttribute("aria-selected", String(active));
                button.setAttribute("tabindex", active ? "0" : "-1");
            });

            panels.forEach(function (panel) {
                const active = panel.dataset.homeBuiltPanel === value;

                panel.hidden = !active;
                panel.setAttribute("aria-hidden", String(!active));
            });

            Rolewise.refreshAOS();
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                activate(button.dataset.homeBuiltTab);
            });
        });

        bindHorizontalKeyboard(buttons);

        const selected = buttons.find(function (button) {
            return button.getAttribute("aria-selected") === "true";
        });

        activate(
            selected
                ? selected.dataset.homeBuiltTab
                : buttons[0].dataset.homeBuiltTab
        );
    }

    function renderRoleSelector() {
        const root = document.querySelector("[data-home-role-selector]");

        if (!root) {
            return;
        }

        const desktopList = root.querySelector("[data-home-role-list]");
        const mobileList = root.querySelector("[data-home-role-mobile-list]");

        if (desktopList) {
            desktopList.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="home-role-selector__button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-home-role-button="',
                    escapeHtml(profession.slug),
                    '" aria-selected="',
                    index === 0 ? "true" : "false",
                    '" tabindex="',
                    index === 0 ? "0" : "-1",
                    '">',
                    '<i class="home-role-selector__button-icon" data-lucide="',
                    escapeHtml(profession.icon),
                    '" aria-hidden="true"></i>',
                    '<span class="home-role-selector__button-label">',
                    escapeHtml(profession.shortTitle),
                    "</span>",
                    '<i class="home-role-selector__button-arrow" data-lucide="arrow-up-right" aria-hidden="true"></i>',
                    "</button>"
                ].join("");
            }).join("");
        }

        if (mobileList) {
            mobileList.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="home-role-selector__mobile-button',
                    index === 0 ? " is-active" : "",
                    '" type="button" role="tab" data-home-role-mobile-button="',
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
            root.querySelectorAll("[data-home-role-button]")
        );

        const mobileButtons = Array.from(
            root.querySelectorAll("[data-home-role-mobile-button]")
        );

        desktopButtons.forEach(function (button) {
            const slug = button.dataset.homeRoleButton;
            const profession = getProfession(slug);

            if (profession) {
                preloadImage(profession.directoryImage);
            }

            button.addEventListener("click", function () {
                setRoleProfession(slug);
            });

            button.addEventListener("mouseenter", function () {
                if (window.matchMedia("(hover: hover)").matches) {
                    setRoleProfession(slug);
                }
            });

            button.addEventListener("focus", function () {
                setRoleProfession(slug);
            });
        });

        mobileButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setRoleProfession(button.dataset.homeRoleMobileButton);
            });
        });

        bindHorizontalKeyboard(desktopButtons);
        bindHorizontalKeyboard(mobileButtons);
        setRoleProfession(homeState.activeRoleProfession, true);
    }

    function setRoleProfession(slug, immediate) {
        const profession = getProfession(slug);
        const root = document.querySelector("[data-home-role-selector]");

        if (!profession || !root) {
            return;
        }

        if (
            homeState.activeRoleProfession === profession.slug &&
            !immediate
        ) {
            return;
        }

        homeState.activeRoleProfession = profession.slug;

        updatePressedButtons(
            Array.from(root.querySelectorAll("[data-home-role-button]")),
            profession.slug,
            "data-home-role-button"
        );

        updatePressedButtons(
            Array.from(root.querySelectorAll("[data-home-role-mobile-button]")),
            profession.slug,
            "data-home-role-mobile-button"
        );

        const stage = root.querySelector("[data-home-role-stage]");
        const image = root.querySelector("[data-home-role-image]");
        const title = root.querySelector("[data-home-role-title]");
        const description = root.querySelector("[data-home-role-description]");
        const label = root.querySelector("[data-home-role-label]");
        const icon = root.querySelector("[data-home-role-icon]");
        const tags = root.querySelector("[data-home-role-tags]");
        const link = root.querySelector("[data-home-role-link]");

        if (homeState.roleTransitionTimer) {
            window.clearTimeout(homeState.roleTransitionTimer);
        }

        const updateContent = function () {
            if (image) {
                image.src = profession.directoryImage;
                image.alt = profession.shortTitle + " professional working in a realistic workplace";
            }

            if (title) {
                title.textContent = profession.title;
            }

            if (description) {
                description.textContent = profession.description;
            }

            if (label) {
                label.textContent = profession.shortTitle;
            }

            if (icon) {
                icon.innerHTML = '<i data-lucide="' + escapeHtml(profession.icon) + '" aria-hidden="true"></i>';
            }

            if (tags) {
                tags.innerHTML = profession.tasks.slice(0, 4).map(function (task) {
                    return '<span class="home-role-selector__tag">' + escapeHtml(task) + "</span>";
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
        };

        if (immediate || Rolewise.state.reducedMotion) {
            updateContent();
            return;
        }

        if (stage) {
            stage.classList.add("is-changing");
        }

        homeState.roleTransitionTimer = window.setTimeout(
            updateContent,
            180
        );
    }

    function renderPromptLibrary() {
        const root = document.querySelector("[data-home-prompt-library]");

        if (!root) {
            return;
        }

        const tabs = root.querySelector("[data-home-prompt-tabs]");

        if (tabs) {
            tabs.innerHTML = config.professions.map(function (profession, index) {
                return [
                    '<button class="ui-tabs__button" type="button" role="tab" data-home-prompt-tab="',
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
            root.querySelectorAll("[data-home-prompt-tab]")
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setPromptProfession(button.dataset.homePromptTab);
            });
        });

        bindHorizontalKeyboard(buttons);
        setPromptProfession(homeState.activePromptProfession);
    }

    function setPromptProfession(slug) {
        const profession = getProfession(slug);
        const root = document.querySelector("[data-home-prompt-library]");

        if (!profession || !root) {
            return;
        }

        homeState.activePromptProfession = profession.slug;

        updatePressedButtons(
            Array.from(root.querySelectorAll("[data-home-prompt-tab]")),
            profession.slug,
            "data-home-prompt-tab"
        );

        const list = root.querySelector("[data-home-prompt-list]");

        if (!list) {
            return;
        }

        list.innerHTML = profession.prompts.slice(0, 3).map(function (item, index) {
            const buttonId = "home-prompt-copy-" + profession.slug + "-" + index;

            return [
                '<article class="home-prompt-card">',
                '<div class="home-prompt-card__top">',
                '<span class="home-prompt-card__category">',
                escapeHtml(item.category),
                "</span>",
                '<button class="home-prompt-card__copy" id="',
                escapeHtml(buttonId),
                '" type="button" data-home-copy-prompt data-prompt-text="',
                escapeHtml(item.prompt),
                '" aria-label="Copy ',
                escapeHtml(item.title),
                ' prompt">',
                '<i data-lucide="copy" aria-hidden="true"></i>',
                '<span data-copy-status>',
                escapeHtml(config.ui.buttons.copyPrompt),
                "</span>",
                "</button>",
                "</div>",
                '<h3 class="home-prompt-card__title">',
                escapeHtml(item.title),
                "</h3>",
                '<p class="home-prompt-card__prompt">',
                escapeHtml(item.prompt),
                "</p>",
                '<div class="home-prompt-card__footer">',
                '<span class="home-prompt-card__profession">',
                escapeHtml(profession.shortTitle),
                "</span>",
                "<span>Human review required</span>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        bindPromptCopyButtons(list);
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
                    reject(new Error("Copy command failed"));
                }
            } catch (error) {
                textarea.remove();
                reject(error);
            }
        });
    }

    function bindPromptCopyButtons(scope) {
        scope.querySelectorAll("[data-home-copy-prompt]").forEach(function (button) {
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
                    document.querySelectorAll("[data-home-copy-prompt].is-copied").forEach(function (activeButton) {
                        activeButton.classList.remove("is-copied");

                        const activeStatus = activeButton.querySelector("[data-copy-status]");

                        if (activeStatus) {
                            activeStatus.textContent = config.ui.buttons.copyPrompt;
                        }

                        const icon = activeButton.querySelector("[data-lucide]");

                        if (icon) {
                            icon.setAttribute("data-lucide", "copy");
                        }
                    });

                    button.classList.add("is-copied");

                    if (status) {
                        status.textContent = config.ui.buttons.copied;
                    }

                    const icon = button.querySelector("[data-lucide]");

                    if (icon) {
                        icon.setAttribute("data-lucide", "check");
                    }

                    Rolewise.refreshIcons();

                    if (homeState.promptCopyTimer) {
                        window.clearTimeout(homeState.promptCopyTimer);
                    }

                    homeState.promptCopyTimer = window.setTimeout(function () {
                        button.classList.remove("is-copied");

                        if (status) {
                            status.textContent = config.ui.buttons.copyPrompt;
                        }

                        const currentIcon = button.querySelector("svg");

                        if (currentIcon) {
                            currentIcon.outerHTML = '<i data-lucide="copy" aria-hidden="true"></i>';
                        }

                        Rolewise.refreshIcons();
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

    function renderTools() {
        const root = document.querySelector("[data-home-tools]");

        if (!root) {
            return;
        }

        const tabs = root.querySelector("[data-home-tool-tabs]");
        const categories = [
            "Writing & Research",
            "Analysis",
            "Content Creation",
            "Automation",
            "Communication"
        ];

        if (tabs) {
            tabs.innerHTML = categories.map(function (category, index) {
                return [
                    '<button class="ui-tabs__button" type="button" role="tab" data-home-tool-tab="',
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
            root.querySelectorAll("[data-home-tool-tab]")
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setToolCategory(button.dataset.homeToolTab);
            });
        });

        bindHorizontalKeyboard(buttons);
        setToolCategory(homeState.activeToolCategory);
    }

    function setToolCategory(category) {
        const root = document.querySelector("[data-home-tools]");

        if (!root) {
            return;
        }

        homeState.activeToolCategory = category;

        updatePressedButtons(
            Array.from(root.querySelectorAll("[data-home-tool-tab]")),
            category,
            "data-home-tool-tab"
        );

        const rows = root.querySelector("[data-home-tools-rows]");

        if (!rows) {
            return;
        }

        rows.innerHTML = config.professions.map(function (profession) {
            const tool = getProfessionTool(profession, category);

            if (!tool) {
                return "";
            }

            return [
                '<div class="home-tools__row">',
                '<div class="home-tools__cell">',
                '<span class="home-tools__mobile-label">Profession</span>',
                '<span class="home-tools__category">',
                '<i data-lucide="',
                escapeHtml(profession.icon),
                '" aria-hidden="true"></i>',
                escapeHtml(profession.shortTitle),
                "</span>",
                "</div>",
                '<div class="home-tools__cell">',
                '<span class="home-tools__mobile-label">Use case</span>',
                "<span>",
                escapeHtml(tool.useCase),
                "</span>",
                "</div>",
                '<div class="home-tools__cell">',
                '<span class="home-tools__mobile-label">Review needs</span>',
                "<span>",
                escapeHtml(tool.reviewNeeds),
                "</span>",
                "</div>",
                '<div class="home-tools__cell">',
                '<span class="home-tools__mobile-label">Team fit</span>',
                "<span>",
                escapeHtml(tool.teamFit),
                "</span>",
                "</div>",
                '<div class="home-tools__cell">',
                '<span class="home-tools__mobile-label">Learning curve</span>',
                "<span>",
                escapeHtml(tool.learningCurve),
                "</span>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        const heading = root.querySelector("[data-home-tools-category]");

        if (heading) {
            heading.textContent = category;
        }

        const icon = root.querySelector("[data-home-tools-icon]");

        if (icon) {
            icon.innerHTML = '<i data-lucide="' + escapeHtml(toolIcons[category] || "layout-grid") + '" aria-hidden="true"></i>';
        }

        Rolewise.refreshIcons();
        Rolewise.refreshAOS();
    }

    function renderPracticeMosaic() {
        const mosaic = document.querySelector("[data-home-practice-mosaic]");

        if (!mosaic) {
            return;
        }

        mosaic.innerHTML = config.professions.map(function (profession, index) {
            const wideClass = index === 2 || index === 5
                ? " home-practice__card--wide"
                : "";

            return [
                '<a class="home-practice__card',
                wideClass,
                '" href="',
                escapeHtml(profession.page),
                '" aria-label="Explore ',
                escapeHtml(profession.title),
                '">',
                '<img class="home-practice__card-image" src="',
                escapeHtml(profession.mosaicImage),
                '" alt="',
                escapeHtml(profession.shortTitle),
                ' professional working with authentic workplace materials" width="900" height="720" loading="lazy">',
                '<span class="home-practice__card-overlay" aria-hidden="true"></span>',
                '<span class="home-practice__card-arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>',
                '<span class="home-practice__card-content">',
                '<span class="home-practice__card-label">Profession learning path</span>',
                '<span class="home-practice__card-title">',
                escapeHtml(profession.shortTitle),
                "</span>",
                "</span>",
                "</a>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderLearningCards() {
        const container = document.querySelector("[data-home-learning-cards]");

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
                '<article class="home-learning-card">',
                '<img class="home-learning-card__image" src="',
                escapeHtml(format.image),
                '" alt="Professionals taking part in ',
                escapeHtml(format.title.toLowerCase()),
                '" width="900" height="1160" loading="lazy">',
                '<span class="home-learning-card__overlay" aria-hidden="true"></span>',
                '<div class="home-learning-card__content">',
                '<span class="home-learning-card__icon" aria-hidden="true"><i data-lucide="',
                escapeHtml(format.icon),
                '"></i></span>',
                '<h3 class="home-learning-card__title">',
                escapeHtml(format.title),
                "</h3>",
                '<p class="home-learning-card__text">',
                escapeHtml(format.description),
                "</p>",
                '<a class="home-learning-card__link" href="',
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

    function renderTeamFormats() {
        const container = document.querySelector("[data-home-team-formats]");

        if (!container) {
            return;
        }

        container.innerHTML = config.courses.teamFormats.map(function (format) {
            return [
                '<div class="home-team__format">',
                '<i class="home-team__format-icon" data-lucide="',
                escapeHtml(format.icon),
                '" aria-hidden="true"></i>',
                '<span class="home-team__format-title">',
                escapeHtml(format.title),
                "</span>",
                "</div>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function renderStartChips() {
        const container = document.querySelector("[data-home-start-chips]");

        if (!container) {
            return;
        }

        container.innerHTML = config.professions.map(function (profession) {
            return [
                '<a class="home-start__chip" href="',
                escapeHtml(profession.page),
                '">',
                escapeHtml(profession.shortTitle),
                "</a>"
            ].join("");
        }).join("");
    }

    function initMarquee() {
        const marquee = document.querySelector("[data-home-marquee]");

        if (!marquee || marquee.dataset.marqueeInitialized) {
            return;
        }

        marquee.dataset.marqueeInitialized = "true";

        const viewport = marquee.querySelector(".home-marquee__viewport");
        const group = marquee.querySelector(".home-marquee__group");

        if (!viewport || !group) {
            return;
        }

        if (viewport.querySelectorAll(".home-marquee__group").length === 1) {
            const clone = group.cloneNode(true);

            clone.setAttribute("aria-hidden", "true");
            viewport.appendChild(clone);
        }

        marquee.addEventListener("focusin", function () {
            viewport.style.animationPlayState = "paused";
        });

        marquee.addEventListener("focusout", function () {
            if (!Rolewise.state.reducedMotion) {
                viewport.style.animationPlayState = "";
            }
        });
    }

    function initHomeSwipers() {
        if (
            !window.Swiper ||
            typeof window.Swiper !== "function"
        ) {
            return;
        }

        document.querySelectorAll("[data-home-swiper]").forEach(function (root, index) {
            if (root.dataset.swiperInitialized) {
                return;
            }

            const swiperElement = root.querySelector(".swiper");

            if (!swiperElement) {
                return;
            }

            root.dataset.swiperInitialized = "true";

            const nextButton = root.querySelector("[data-home-swiper-next]");
            const previousButton = root.querySelector("[data-home-swiper-prev]");
            const pagination = root.querySelector("[data-home-swiper-pagination]");
            const wide = root.dataset.homeSwiper === "wide";

            const instance = new window.Swiper(swiperElement, {
                slidesPerView: 1.08,
                spaceBetween: 14,
                speed: Rolewise.state.reducedMotion ? 0 : 620,
                watchOverflow: true,
                grabCursor: true,
                keyboard: {
                    enabled: true,
                    onlyInViewport: true
                },
                navigation: nextButton && previousButton
                    ? {
                        nextEl: nextButton,
                        prevEl: previousButton
                    }
                    : undefined,
                pagination: pagination
                    ? {
                        el: pagination,
                        clickable: true
                    }
                    : undefined,
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    1200: {
                        slidesPerView: wide ? 2 : 3,
                        spaceBetween: 24
                    }
                },
                a11y: {
                    enabled: true,
                    containerMessage: "Rolewise AI content slider " + String(index + 1),
                    nextSlideMessage: "Next item",
                    prevSlideMessage: "Previous item"
                }
            });

            homeState.swipers.push(instance);
        });
    }

    function refreshHomeUI() {
        Rolewise.refreshIcons();
        Rolewise.refreshAOS();
        Rolewise.refreshSchemas();
    }

    function initializeHome() {
        if (!document.body.classList.contains("home-page")) {
            return;
        }

        renderHeroSelector();
        renderProfessionRail();
        initBuiltTabs();
        renderRoleSelector();
        renderPromptLibrary();
        renderTools();
        renderPracticeMosaic();
        renderLearningCards();
        renderTeamFormats();
        renderStartChips();
        initMarquee();
        initHomeSwipers();
        refreshHomeUI();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeHome,
            {
                once: true
            }
        );
    } else {
        initializeHome();
    }
}());