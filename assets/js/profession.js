(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const professionState = {
        activeToolCategory: "",
        copyResetTimer: null,
        sectionObserver: null
    };

    const toolIcons = {
        "Writing & Research": "file-search",
        "Analysis": "chart-no-axes-combined",
        "Content Creation": "pen-tool",
        "Automation": "workflow",
        "Communication": "messages-square"
    };

    const sharedReviewPoints = [
        {
            "title": "Verify accuracy",
            "description": "Check facts, names, dates, calculations, sources, assumptions, and missing context.",
            "icon": "scan-search"
        },
        {
            "title": "Protect information",
            "description": "Confirm authorization, confidentiality, data minimization, organizational policy, and tool terms.",
            "icon": "shield-check"
        },
        {
            "title": "Review professional fit",
            "description": "Assess tone, terminology, audience suitability, role standards, and the intended workplace use.",
            "icon": "briefcase-business"
        },
        {
            "title": "Retain human ownership",
            "description": "Keep a responsible person accountable for approval, escalation, communication, and final application.",
            "icon": "badge-check"
        }
    ];

    function getPathValue(object, path) {
        if (!object || !path) {
            return undefined;
        }

        return path.split(".").reduce(function (value, key) {
            if (
                value === null ||
                value === undefined ||
                typeof value !== "object"
            ) {
                return undefined;
            }

            return value[key];
        }, object);
    }

    function getFirstValue(object, paths) {
        for (let index = 0; index < paths.length; index += 1) {
            const value = getPathValue(object, paths[index]);

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return undefined;
    }

    function getText(object, paths, fallback) {
        const value = getFirstValue(object, paths);

        if (
            typeof value === "string" ||
            typeof value === "number"
        ) {
            return String(value);
        }

        return fallback || "";
    }

    function getArray(object, paths) {
        const value = getFirstValue(object, paths);

        return Array.isArray(value) ? value : [];
    }

    function getCurrentProfession() {
        const slug = document.body.dataset.profession || "";

        return config.professions.find(function (profession) {
            return profession.slug === slug;
        }) || null;
    }

    function getEntryTitle(entry, fallback) {
        if (typeof entry === "string") {
            return entry;
        }

        return getText(
            entry,
            [
                "title",
                "name",
                "label",
                "task",
                "category"
            ],
            fallback
        );
    }

    function getEntryDescription(entry, fallback) {
        if (!entry || typeof entry === "string") {
            return fallback || "";
        }

        return getText(
            entry,
            [
                "description",
                "summary",
                "text",
                "detail",
                "overview"
            ],
            fallback
        );
    }

    function setText(selector, value) {
        if (!value) {
            return;
        }

        document.querySelectorAll(selector).forEach(function (element) {
            element.textContent = value;
        });
    }

    function setHref(selector, href) {
        if (!href) {
            return;
        }

        document.querySelectorAll(selector).forEach(function (element) {
            element.href = href;
        });
    }

    function setImage(selector, src, alt) {
        if (!src) {
            return;
        }

        document.querySelectorAll(selector).forEach(function (image) {
            image.src = src;

            if (alt) {
                image.alt = alt;
            }
        });
    }

    function setIcon(selector, iconName) {
        if (!iconName) {
            return;
        }

        document.querySelectorAll(selector).forEach(function (element) {
            element.innerHTML =
                '<i data-lucide="' +
                escapeHtml(iconName) +
                '" aria-hidden="true"></i>';
        });
    }

    function safeColor(value) {
        if (
            typeof value !== "string" ||
            value.length > 50 ||
            /[;{}]/.test(value)
        ) {
            return "";
        }

        return value;
    }

    function applyProfessionIdentity(profession) {
        const shortTitle = getText(
            profession,
            [
                "shortTitle",
                "label",
                "profession"
            ],
            profession.title
        );

        const heroTitle = getText(
            profession,
            [
                "hero.title",
                "heroTitle",
                "title"
            ],
            profession.title
        );

        const heroAccent = getText(
            profession,
            [
                "hero.accent",
                "heroAccent",
                "shortTitle"
            ],
            shortTitle
        );

        const description = getText(
            profession,
            [
                "hero.description",
                "heroDescription",
                "description"
            ],
            ""
        );

        const icon = getText(
            profession,
            [
                "hero.icon",
                "icon"
            ],
            "briefcase-business"
        );

        const accent = safeColor(
            getText(
                profession,
                [
                    "accent",
                    "colors.accent"
                ],
                ""
            )
        );

        const accentLight = safeColor(
            getText(
                profession,
                [
                    "accentLight",
                    "colors.accentLight"
                ],
                ""
            )
        );

        if (accent) {
            document.body.style.setProperty(
                "--profession-accent",
                accent
            );
        }

        if (accentLight) {
            document.body.style.setProperty(
                "--profession-accent-light",
                accentLight
            );
        }

        setText("[data-profession-title]", heroTitle);
        setText("[data-profession-short-title]", shortTitle);
        setText("[data-profession-title-accent]", heroAccent);
        setText("[data-profession-description]", description);
        setIcon("[data-profession-icon]", icon);

        const heroImage = getText(
            profession,
            [
                "hero.image",
                "heroImage",
                "images.hero",
                "directoryImage"
            ],
            ""
        );

        const overviewPrimaryImage = getText(
            profession,
            [
                "overview.primaryImage",
                "overviewPrimaryImage",
                "images.overviewPrimary",
                "mosaicImage",
                "directoryImage"
            ],
            heroImage
        );

        const overviewSecondaryImage = getText(
            profession,
            [
                "overview.secondaryImage",
                "overviewSecondaryImage",
                "images.overviewSecondary",
                "directoryImage"
            ],
            heroImage
        );

        const reviewImage = getText(
            profession,
            [
                "review.image",
                "reviewImage",
                "images.review",
                "mosaicImage",
                "directoryImage"
            ],
            heroImage
        );

        setImage(
            "[data-profession-hero-image]",
            heroImage,
            shortTitle + " professional working in an authentic workplace"
        );

        setImage(
            "[data-profession-overview-primary]",
            overviewPrimaryImage,
            shortTitle + " professional preparing practical workplace material"
        );

        setImage(
            "[data-profession-overview-secondary]",
            overviewSecondaryImage,
            "Detailed view of a practical " +
            shortTitle.toLowerCase() +
            " workflow"
        );

        setImage(
            "[data-profession-review-image]",
            reviewImage,
            shortTitle + " professional reviewing work before final use"
        );

        const workflowCaption = getText(
            profession,
            [
                "workflowCaption",
                "hero.workflowCaption",
                "hero.cardTitle"
            ],
            ""
        );

        const heroCardText = getText(
            profession,
            [
                "hero.cardText",
                "heroCardText",
                "overview.lead",
                "description"
            ],
            ""
        );

        setText(
            "[data-profession-hero-card-title]",
            workflowCaption || "Practical AI for " + shortTitle
        );

        setText(
            "[data-profession-hero-card-text]",
            heroCardText
        );

        const overviewTitle = getText(
            profession,
            [
                "overview.title",
                "overviewTitle"
            ],
            "AI Through the Work You Already Do"
        );

        const overviewLead = getText(
            profession,
            [
                "overview.lead",
                "overviewLead"
            ],
            description
        );

        const overviewCopy = getText(
            profession,
            [
                "overview.description",
                "overview.copy",
                "overviewText"
            ],
            ""
        );

        setText(
            "[data-profession-overview-title]",
            overviewTitle
        );

        setText(
            "[data-profession-overview-lead]",
            overviewLead
        );

        setText(
            "[data-profession-overview-copy]",
            overviewCopy
        );

        const pageTitle = getText(
            profession,
            [
                "seo.title",
                "metaTitle"
            ],
            ""
        );

        const metaDescription = getText(
            profession,
            [
                "seo.description",
                "metaDescription"
            ],
            ""
        );

        if (pageTitle) {
            document.title = pageTitle;
        }

        if (metaDescription) {
            const meta = document.querySelector(
                'meta[name="description"]'
            );

            if (meta) {
                meta.content = metaDescription;
            }
        }
    }

    function renderHeroTags(profession) {
        const container = document.querySelector(
            "[data-profession-hero-tags]"
        );

        if (!container) {
            return;
        }

        const tasks = getArray(
            profession,
            [
                "tasks",
                "taskExamples"
            ]
        );

        container.innerHTML = tasks.slice(0, 4).map(function (task) {
            return [
                '<span class="profession-hero__card-tag">',
                escapeHtml(getEntryTitle(task, "Practical task")),
                "</span>"
            ].join("");
        }).join("");
    }

    function renderOverviewPoints(profession) {
        const container = document.querySelector(
            "[data-profession-overview-points]"
        );

        if (!container) {
            return;
        }

        let points = getArray(
            profession,
            [
                "overview.points",
                "overviewPoints"
            ]
        );

        if (!points.length) {
            points = getArray(
                profession,
                [
                    "tasks",
                    "taskExamples"
                ]
            ).slice(0, 3);
        }

        container.innerHTML = points.slice(0, 4).map(function (point) {
            return [
                '<li class="profession-overview__point">',
                '<i data-lucide="check" aria-hidden="true"></i>',
                "<span>",
                escapeHtml(getEntryTitle(point, "Practical workplace context")),
                "</span>",
                "</li>"
            ].join("");
        }).join("");
    }

    function renderTasks(profession) {
        const container = document.querySelector(
            "[data-profession-tasks]"
        );

        if (!container) {
            return;
        }

        const tasks = getArray(
            profession,
            [
                "tasks",
                "taskExamples"
            ]
        );

        container.innerHTML = tasks.map(function (task, index) {
            const title = getEntryTitle(task, "Professional task");
            const description = getEntryDescription(
                task,
                "Explore how preparation, structured prompting, review, and responsible application may support this task."
            );

            const icon = typeof task === "object"
                ? getText(task, ["icon"], profession.icon)
                : profession.icon;

            const marker = typeof task === "object"
                ? getText(
                    task,
                    [
                        "marker",
                        "category",
                        "label"
                    ],
                    "Practical task"
                )
                : "Practical task";

            return [
                '<article class="profession-task-card" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 40, 180)),
                '">',
                '<div class="profession-task-card__top">',
                '<i class="profession-task-card__icon" data-lucide="',
                escapeHtml(icon || "briefcase-business"),
                '" aria-hidden="true"></i>',
                "</div>",
                '<h3 class="profession-task-card__title">',
                escapeHtml(title),
                "</h3>",
                '<p class="profession-task-card__text">',
                escapeHtml(description),
                "</p>",
                '<span class="profession-task-card__marker">',
                escapeHtml(marker),
                "</span>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderWorkflows(profession) {
        const container = document.querySelector(
            "[data-profession-workflows]"
        );

        if (!container) {
            return;
        }

        const workflows = getArray(
            profession,
            [
                "workflows",
                "workflowExamples"
            ]
        );

        container.innerHTML = workflows.map(function (workflow, index) {
            const title = getEntryTitle(
                workflow,
                "Professional workflow"
            );

            const summary = getEntryDescription(
                workflow,
                "Use supplied workplace context to prepare, generate, review, and adapt a useful working output."
            );

            const aiContribution = getText(
                workflow,
                [
                    "aiContribution",
                    "aiSupport",
                    "ai",
                    "support"
                ],
                "Support preparation, structure, drafting, comparison, or organization based on the supplied context."
            );

            const humanReview = getText(
                workflow,
                [
                    "humanReview",
                    "review",
                    "reviewNeeds"
                ],
                "Verify accuracy, appropriateness, policy alignment, professional standards, and suitability before use."
            );

            return [
                '<article class="profession-workflow-card" data-aos="fade-up">',
                '<div class="profession-workflow-card__heading">',
                '<h3 class="profession-workflow-card__title">',
                escapeHtml(title),
                "</h3>",
                "</div>",
                '<div class="profession-workflow-card__content">',
                '<p class="profession-workflow-card__summary">',
                escapeHtml(summary),
                "</p>",
                '<div class="profession-workflow-card__details">',
                '<div class="profession-workflow-card__detail">',
                '<span class="profession-workflow-card__detail-label">AI contribution</span>',
                '<p class="profession-workflow-card__detail-text">',
                escapeHtml(aiContribution),
                "</p>",
                "</div>",
                '<div class="profession-workflow-card__detail">',
                '<span class="profession-workflow-card__detail-label">Human review</span>',
                '<p class="profession-workflow-card__detail-text">',
                escapeHtml(humanReview),
                "</p>",
                "</div>",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
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
        scope.querySelectorAll("[data-profession-copy-prompt]").forEach(function (button) {
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
                    document.querySelectorAll("[data-profession-copy-prompt].is-copied").forEach(function (activeButton) {
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

                    if (professionState.copyResetTimer) {
                        window.clearTimeout(
                            professionState.copyResetTimer
                        );
                    }

                    professionState.copyResetTimer = window.setTimeout(function () {
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

    function renderPrompts(profession) {
        const container = document.querySelector(
            "[data-profession-prompts]"
        );

        if (!container) {
            return;
        }

        const prompts = getArray(
            profession,
            [
                "prompts",
                "promptExamples"
            ]
        );

        container.innerHTML = prompts.slice(0, 3).map(function (prompt, index) {
            const title = getEntryTitle(prompt, "Practical prompt");
            const category = getText(
                prompt,
                [
                    "category",
                    "label",
                    "type"
                ],
                "Professional prompt"
            );

            const promptText = getText(
                prompt,
                [
                    "prompt",
                    "text",
                    "template",
                    "body"
                ],
                ""
            );

            return [
                '<article class="profession-prompt-card" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 60, 120)),
                '">',
                '<div class="profession-prompt-card__top">',
                '<span class="profession-prompt-card__category">',
                escapeHtml(category),
                "</span>",
                '<button class="profession-prompt-card__copy" type="button" data-profession-copy-prompt data-prompt-text="',
                escapeHtml(promptText),
                '" aria-label="Copy ',
                escapeHtml(title),
                ' prompt">',
                '<i data-lucide="copy" aria-hidden="true"></i>',
                '<span data-copy-status>',
                escapeHtml(config.ui.buttons.copyPrompt),
                "</span>",
                "</button>",
                "</div>",
                '<h3 class="profession-prompt-card__title">',
                escapeHtml(title),
                "</h3>",
                '<p class="profession-prompt-card__prompt">',
                escapeHtml(promptText),
                "</p>",
                '<div class="profession-prompt-card__footer">',
                '<span class="profession-prompt-card__review">',
                '<i data-lucide="shield-check" aria-hidden="true"></i>',
                "Human review required",
                "</span>",
                "<span>Adapt before use</span>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        bindCopyButtons(container);
    }

    function updateToolButtons(buttons, category) {
        buttons.forEach(function (button) {
            const active =
                button.dataset.professionToolTab === category;

            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
            button.setAttribute("tabindex", active ? "0" : "-1");
        });
    }

    function focusAdjacentTool(buttons, currentIndex, direction) {
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

    function setToolCategory(profession, category) {
        const tool = getArray(
            profession,
            [
                "toolCategories",
                "tools"
            ]
        ).find(function (item) {
            return getText(
                item,
                [
                    "name",
                    "title",
                    "category"
                ],
                ""
            ) === category;
        });

        if (!tool) {
            return;
        }

        professionState.activeToolCategory = category;

        updateToolButtons(
            Array.from(
                document.querySelectorAll("[data-profession-tool-tab]")
            ),
            category
        );

        setText(
            "[data-profession-tool-category]",
            category
        );

        setText(
            "[data-profession-tool-use-case]",
            getText(
                tool,
                [
                    "useCase",
                    "description",
                    "summary"
                ],
                ""
            )
        );

        setText(
            "[data-profession-tool-review]",
            getText(
                tool,
                [
                    "reviewNeeds",
                    "review"
                ],
                ""
            )
        );

        setText(
            "[data-profession-tool-team]",
            getText(
                tool,
                [
                    "teamFit",
                    "team"
                ],
                ""
            )
        );

        setText(
            "[data-profession-tool-learning]",
            getText(
                tool,
                [
                    "learningCurve",
                    "learning"
                ],
                ""
            )
        );

        setIcon(
            "[data-profession-tool-icon]",
            toolIcons[category] || profession.icon
        );

        Rolewise.refreshIcons();
        Rolewise.refreshAOS();
    }

    function renderTools(profession) {
        const root = document.querySelector(
            "[data-profession-tools]"
        );

        if (!root) {
            return;
        }

        const tools = getArray(
            profession,
            [
                "toolCategories",
                "tools"
            ]
        );

        const tabs = root.querySelector(
            "[data-profession-tool-tabs]"
        );

        if (!tabs || !tools.length) {
            return;
        }

        tabs.innerHTML = tools.map(function (tool, index) {
            const category = getText(
                tool,
                [
                    "name",
                    "title",
                    "category"
                ],
                "Tool category"
            );

            return [
                '<button class="ui-tabs__button" type="button" role="tab" data-profession-tool-tab="',
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

        const buttons = Array.from(
            tabs.querySelectorAll("[data-profession-tool-tab]")
        );

        buttons.forEach(function (button, index) {
            button.addEventListener("click", function () {
                setToolCategory(
                    profession,
                    button.dataset.professionToolTab
                );
            });

            button.addEventListener("keydown", function (event) {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    focusAdjacentTool(buttons, index, 1);
                }

                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    focusAdjacentTool(buttons, index, -1);
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

        const initialCategory = getText(
            tools[0],
            [
                "name",
                "title",
                "category"
            ],
            ""
        );

        setToolCategory(profession, initialCategory);
    }

    function renderReviewPoints(profession) {
        const container = document.querySelector(
            "[data-profession-review-list]"
        );

        if (!container) {
            return;
        }

        let points = getArray(
            profession,
            [
                "review.checklist",
                "reviewChecklist",
                "reviewPoints"
            ]
        );

        if (!points.length) {
            points = sharedReviewPoints;
        }

        container.innerHTML = points.map(function (point) {
            const title = getEntryTitle(
                point,
                "Human review"
            );

            const description = getEntryDescription(
                point,
                "Review the output before professional use."
            );

            const icon = typeof point === "object"
                ? getText(point, ["icon"], "shield-check")
                : "shield-check";

            return [
                '<div class="profession-review__item">',
                '<i class="profession-review__item-icon" data-lucide="',
                escapeHtml(icon),
                '" aria-hidden="true"></i>',
                '<div class="profession-review__item-content">',
                '<span class="profession-review__item-title">',
                escapeHtml(title),
                "</span>",
                '<span class="profession-review__item-text">',
                escapeHtml(description),
                "</span>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        const reviewTitle = getText(
            profession,
            [
                "review.title",
                "reviewTitle"
            ],
            "Human Review Remains Essential"
        );

        const reviewText = getText(
            profession,
            [
                "review.description",
                "reviewText",
                "disclaimer"
            ],
            ""
        );

        setText(
            "[data-profession-review-title]",
            reviewTitle
        );

        setText(
            "[data-profession-review-text]",
            reviewText
        );
    }

    function renderLearningFormats(profession) {
        const container = document.querySelector(
            "[data-profession-learning]"
        );

        if (!container) {
            return;
        }

        const preferredSlugs = getArray(
            profession,
            [
                "learningFormatSlugs",
                "learning.formats"
            ]
        );

        const fallbackSlugs = [
            "profession-guides",
            "prompt-workshops",
            "team-training"
        ];

        const selectedSlugs = preferredSlugs.length
            ? preferredSlugs
            : fallbackSlugs;

        const formats = selectedSlugs.map(function (entry) {
            const slug = typeof entry === "string"
                ? entry
                : getText(entry, ["slug"], "");

            return config.courses.learningFormats.find(function (format) {
                return format.slug === slug;
            });
        }).filter(Boolean).slice(0, 3);

        container.innerHTML = formats.map(function (format) {
            return [
                '<article class="profession-learning-card">',
                '<img class="profession-learning-card__image" src="',
                escapeHtml(format.image),
                '" alt="Professionals participating in ',
                escapeHtml(format.title.toLowerCase()),
                '" width="900" height="1160" loading="lazy">',
                '<span class="profession-learning-card__overlay" aria-hidden="true"></span>',
                '<div class="profession-learning-card__content">',
                '<span class="profession-learning-card__icon" aria-hidden="true">',
                '<i data-lucide="',
                escapeHtml(format.icon),
                '"></i>',
                "</span>",
                '<h3 class="profession-learning-card__title">',
                escapeHtml(format.title),
                "</h3>",
                '<p class="profession-learning-card__text">',
                escapeHtml(format.description),
                "</p>",
                '<a class="profession-learning-card__link" href="',
                escapeHtml(format.href),
                '">',
                escapeHtml(format.cta),
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderFaq(profession) {
        const container = document.querySelector(
            "[data-profession-faq]"
        );

        if (!container) {
            return;
        }

        const faqs = getArray(
            profession,
            [
                "faqs",
                "faq"
            ]
        );

        container.innerHTML = faqs.map(function (faq, index) {
            const question = getText(
                faq,
                [
                    "question",
                    "title"
                ],
                "Profession-specific AI question"
            );

            const answer = getText(
                faq,
                [
                    "answer",
                    "description",
                    "text"
                ],
                ""
            );

            const triggerId =
                "profession-faq-trigger-" +
                profession.slug +
                "-" +
                String(index);

            const panelId =
                "profession-faq-panel-" +
                profession.slug +
                "-" +
                String(index);

            return [
                '<article class="ui-accordion__item" data-accordion-item>',
                '<h3 class="ui-accordion__heading">',
                '<button class="ui-accordion__trigger" id="',
                escapeHtml(triggerId),
                '" type="button" aria-expanded="',
                index === 0 ? "true" : "false",
                '" aria-controls="',
                escapeHtml(panelId),
                '" data-accordion-trigger>',
                "<span>",
                escapeHtml(question),
                "</span>",
                '<span class="ui-accordion__icon" aria-hidden="true">',
                '<i data-lucide="plus"></i>',
                "</span>",
                "</button>",
                "</h3>",
                '<div class="ui-accordion__panel" id="',
                escapeHtml(panelId),
                '" role="region" aria-labelledby="',
                escapeHtml(triggerId),
                '"',
                index === 0 ? "" : " hidden",
                " data-accordion-panel>",
                '<div class="ui-accordion__content">',
                "<p>",
                escapeHtml(answer),
                "</p>",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderDisclaimer(profession) {
        const disclaimer = getText(
            profession,
            [
                "disclaimer",
                "educationalDisclaimer"
            ],
            getText(
                config,
                [
                    "disclaimers.educational",
                    "disclaimers.general"
                ],
                ""
            )
        );

        setText(
            "[data-profession-disclaimer]",
            disclaimer
        );
    }

    function renderNextLinks(profession) {
        const container = document.querySelector(
            "[data-profession-next-links]"
        );

        if (!container) {
            return;
        }

        const currentIndex = config.professions.findIndex(function (item) {
            return item.slug === profession.slug;
        });

        const ordered = [];

        for (let offset = 1; offset < config.professions.length; offset += 1) {
            const index =
                (currentIndex + offset) %
                config.professions.length;

            ordered.push(config.professions[index]);
        }

        container.innerHTML = ordered.slice(0, 3).map(function (item) {
            return [
                '<a class="profession-next__link" href="',
                escapeHtml(item.page),
                '">',
                "<span>",
                escapeHtml(item.title),
                "</span>",
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>"
            ].join("");
        }).join("");
    }

    function initSubnavigation() {
        const nav = document.querySelector(
            "[data-profession-subnav]"
        );

        if (!nav) {
            return;
        }

        const links = Array.from(
            nav.querySelectorAll('a[href^="#"]')
        );

        const sections = links.map(function (link) {
            const id = link.getAttribute("href").slice(1);

            return document.getElementById(id);
        }).filter(Boolean);

        if (!links.length || !sections.length) {
            return;
        }

        function activate(id) {
            links.forEach(function (link) {
                const active =
                    link.getAttribute("href") === "#" + id;

                link.classList.toggle("is-active", active);

                if (active) {
                    link.setAttribute("aria-current", "true");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }

        if (!("IntersectionObserver" in window)) {
            activate(sections[0].id);
            return;
        }

        professionState.sectionObserver =
            new IntersectionObserver(
                function (entries) {
                    const visible = entries
                        .filter(function (entry) {
                            return entry.isIntersecting;
                        })
                        .sort(function (first, second) {
                            return second.intersectionRatio - first.intersectionRatio;
                        });

                    if (visible.length) {
                        activate(visible[0].target.id);
                    }
                },
                {
                    rootMargin:
                        "calc((var(--header-height) + 90px) * -1) 0px -55% 0px",
                    threshold: [0.08, 0.2, 0.4, 0.6]
                }
            );

        sections.forEach(function (section) {
            professionState.sectionObserver.observe(section);
        });

        activate(sections[0].id);
    }

    function initializeProfession() {
        if (!document.body.classList.contains("profession-page")) {
            return;
        }

        const profession = getCurrentProfession();

        if (!profession) {
            return;
        }

        applyProfessionIdentity(profession);
        renderHeroTags(profession);
        renderOverviewPoints(profession);
        renderTasks(profession);
        renderWorkflows(profession);
        renderPrompts(profession);
        renderTools(profession);
        renderReviewPoints(profession);
        renderLearningFormats(profession);
        renderFaq(profession);
        renderDisclaimer(profession);
        renderNextLinks(profession);
        initSubnavigation();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeProfession,
            {
                "once": true
            }
        );
    } else {
        initializeProfession();
    }
}());
