(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const legalState = {
        observer: null,
        activeSectionId: "",
        scrollFrame: null
    };

    const fallbackPages = [
        {
            slug: "privacy-policy",
            title: "Privacy Policy",
            href: "privacy-policy.html",
            icon: "shield-check",
            description: "Learn how inquiry information, technical data, cookies, and privacy-related requests may be handled."
        },
        {
            slug: "terms-of-service",
            title: "Terms of Service",
            href: "terms-of-service.html",
            icon: "file-check-2",
            description: "Review the conditions that apply when accessing and using Rolewise AI information, resources, and inquiry routes."
        },
        {
            slug: "cookie-policy",
            title: "Cookie Policy",
            href: "cookie-policy.html",
            icon: "cookie",
            description: "Review information about essential storage, preference choices, analytics controls, and browser settings."
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

    function normalizeSlug(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\.html?(?:[?#].*)?$/i, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function getCurrentLegalSlug() {
        const bodySlug = normalizeSlug(
            document.body.dataset.legalPage ||
            document.body.dataset.legal ||
            ""
        );

        if (bodySlug) {
            return bodySlug;
        }

        const filename = window.location.pathname
            .split("/")
            .filter(Boolean)
            .pop() || "";

        return normalizeSlug(filename);
    }

    function getLegalPages() {
        const configuredPages = getArray(
            config,
            [
                "legal.pages",
                "legalPages",
                "navigation.legal",
                "footer.legalLinks"
            ]
        );

        if (!configuredPages.length) {
            return fallbackPages;
        }

        return configuredPages.map(function (page, index) {
            if (typeof page === "string") {
                const fallback = fallbackPages[index] || {};

                return {
                    slug: normalizeSlug(page),
                    title: fallback.title || page,
                    href: page,
                    icon: fallback.icon || "file-text",
                    description: fallback.description || ""
                };
            }

            const href = getText(
                page,
                [
                    "href",
                    "url",
                    "page"
                ],
                fallbackPages[index]
                    ? fallbackPages[index].href
                    : ""
            );

            const fallback = fallbackPages.find(function (item) {
                return (
                    item.slug === normalizeSlug(href) ||
                    item.slug === normalizeSlug(
                        getText(page, ["slug", "id"], "")
                    )
                );
            }) || fallbackPages[index] || {};

            return {
                slug: normalizeSlug(
                    getText(
                        page,
                        [
                            "slug",
                            "id",
                            "key"
                        ],
                        href
                    )
                ),
                title: getText(
                    page,
                    [
                        "title",
                        "label",
                        "name"
                    ],
                    fallback.title || "Legal Information"
                ),
                href: href || fallback.href || "#",
                icon: getText(
                    page,
                    [
                        "icon"
                    ],
                    fallback.icon || "file-text"
                ),
                description: getText(
                    page,
                    [
                        "description",
                        "summary",
                        "text"
                    ],
                    fallback.description || ""
                )
            };
        });
    }

    function getCurrentLegalPage() {
        const currentSlug = getCurrentLegalSlug();

        return getLegalPages().find(function (page) {
            return (
                page.slug === currentSlug ||
                normalizeSlug(page.href) === currentSlug
            );
        }) || null;
    }

    function setText(selector, value) {
        if (!value) {
            return;
        }

        document.querySelectorAll(selector).forEach(function (element) {
            element.textContent = value;
        });
    }

    function applyContactDetails() {
        const email = getText(
            config,
            [
                "mail.recipientEmail",
                "company.email",
                "contact.email"
            ],
            ""
        );

        const address = getText(
            config,
            [
                "company.address",
                "contact.address"
            ],
            ""
        );

        const legalName = getText(
            config,
            [
                "company.legalName",
                "company.name",
                "brand.name"
            ],
            ""
        );

        document.querySelectorAll("[data-contact-email]").forEach(function (element) {
            element.textContent = email;

            if (element.tagName === "A" && email) {
                element.href = "mailto:" + email;
            }
        });

        setText("[data-contact-address]", address);
        setText("[data-company-legal-name]", legalName);
    }

    function applyLegalMetadata() {
        const page = getCurrentLegalPage();
        const currentSlug = getCurrentLegalSlug();

        const effectiveDate = getText(
            config,
            [
                "legal.effectiveDate",
                "legal.dates.effective",
                "legalPagesMetadata.effectiveDate"
            ],
            ""
        );

        const updatedDate = getText(
            config,
            [
                "legal.updatedDate",
                "legal.lastUpdated",
                "legal.dates.updated",
                "legalPagesMetadata.updatedDate"
            ],
            effectiveDate
        );

        const jurisdiction = getText(
            config,
            [
                "legal.jurisdiction",
                "company.jurisdiction"
            ],
            ""
        );

        setText("[data-legal-effective-date]", effectiveDate);
        setText("[data-legal-updated-date]", updatedDate);
        setText("[data-legal-jurisdiction]", jurisdiction);

        if (page) {
            setText("[data-legal-page-title]", page.title);
        }

        document.documentElement.dataset.legalPage = currentSlug;
    }

    function getLegalSections() {
        return Array.from(
            document.querySelectorAll(
                ".legal-content .legal-section[id], [data-legal-section][id]"
            )
        );
    }

    function getSectionLabel(section, index) {
        const customLabel =
            section.dataset.legalNavLabel ||
            section.dataset.navLabel ||
            "";

        if (customLabel) {
            return customLabel;
        }

        const title = section.querySelector(
            ".legal-section__title, h2, h3"
        );

        if (title) {
            return title.textContent.trim();
        }

        return "Section " + String(index + 1);
    }

    function renderNavigation() {
        const list = document.querySelector(
            "[data-legal-nav-list]"
        );

        if (!list) {
            return;
        }

        const sections = getLegalSections();

        if (!sections.length) {
            return;
        }

        list.innerHTML = sections.map(function (section, index) {
            return [
                '<a class="legal-navigation__link" href="#',
                escapeHtml(section.id),
                '" data-legal-nav-link>',
                "<span>",
                escapeHtml(getSectionLabel(section, index)),
                "</span>",
                "</a>"
            ].join("");
        }).join("");
    }

    function setActiveSection(sectionId) {
        if (!sectionId || legalState.activeSectionId === sectionId) {
            return;
        }

        legalState.activeSectionId = sectionId;

        document.querySelectorAll("[data-legal-nav-link]").forEach(function (link) {
            const active =
                link.getAttribute("href") === "#" + sectionId;

            link.classList.toggle("is-active", active);

            if (active) {
                link.setAttribute("aria-current", "true");

                if (
                    window.matchMedia("(max-width: 991px)").matches &&
                    !Rolewise.state.reducedMotion
                ) {
                    link.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center"
                    });
                }
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function initializeSectionObserver() {
        const sections = getLegalSections();

        if (!sections.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            setActiveSection(sections[0].id);
            return;
        }

        legalState.observer = new IntersectionObserver(
            function (entries) {
                const visibleEntries = entries
                    .filter(function (entry) {
                        return entry.isIntersecting;
                    })
                    .sort(function (first, second) {
                        if (first.boundingClientRect.top === second.boundingClientRect.top) {
                            return second.intersectionRatio - first.intersectionRatio;
                        }

                        return first.boundingClientRect.top - second.boundingClientRect.top;
                    });

                if (visibleEntries.length) {
                    setActiveSection(visibleEntries[0].target.id);
                }
            },
            {
                rootMargin:
                    "calc((var(--header-height) + 40px) * -1) 0px -62% 0px",
                threshold: [0.04, 0.12, 0.25, 0.45]
            }
        );

        sections.forEach(function (section) {
            legalState.observer.observe(section);
        });

        const hashId = window.location.hash.slice(1);
        const initialSection = hashId
            ? document.getElementById(hashId)
            : sections[0];

        setActiveSection(
            initialSection && sections.includes(initialSection)
                ? initialSection.id
                : sections[0].id
        );
    }

    function scrollToSection(section) {
        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: Rolewise.state.reducedMotion
                ? "auto"
                : "smooth",
            block: "start"
        });

        setActiveSection(section.id);

        if (
            window.history &&
            typeof window.history.replaceState === "function"
        ) {
            window.history.replaceState(
                null,
                "",
                "#" + section.id
            );
        }
    }

    function bindNavigation() {
        document.addEventListener("click", function (event) {
            const link = event.target.closest(
                "[data-legal-nav-link]"
            );

            if (!link) {
                return;
            }

            const href = link.getAttribute("href") || "";

            if (!href.startsWith("#")) {
                return;
            }

            const section = document.getElementById(
                href.slice(1)
            );

            if (!section) {
                return;
            }

            event.preventDefault();
            scrollToSection(section);
        });
    }

    function renderRelatedPages() {
        const container = document.querySelector(
            "[data-legal-related]"
        );

        if (!container) {
            return;
        }

        const currentSlug = getCurrentLegalSlug();
        const pages = getLegalPages();

        container.innerHTML = pages.map(function (page, index) {
            const current =
                page.slug === currentSlug ||
                normalizeSlug(page.href) === currentSlug;

            return [
                '<article class="legal-related-card',
                current ? " is-current" : "",
                '" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 50, 120)),
                '">',
                '<div class="legal-related-card__top">',
                '<i class="legal-related-card__icon" data-lucide="',
                escapeHtml(page.icon),
                '" aria-hidden="true"></i>',
                "</div>",
                '<div class="legal-related-card__content">',
                '<h3 class="legal-related-card__title">',
                escapeHtml(page.title),
                "</h3>",
                '<p class="legal-related-card__text">',
                escapeHtml(page.description),
                "</p>",
                '<a class="legal-related-card__link" href="',
                escapeHtml(page.href),
                '"',
                current ? ' aria-current="page"' : "",
                ">",
                current ? "Current policy" : "Read this policy",
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function createBackToTopButton() {
        let button = document.querySelector(
            "[data-legal-back-to-top]"
        );

        if (button) {
            return button;
        }

        button = document.createElement("button");
        button.className = "legal-back-to-top";
        button.type = "button";
        button.setAttribute(
            "aria-label",
            "Back to the top of this page"
        );
        button.setAttribute(
            "data-legal-back-to-top",
            ""
        );

        button.innerHTML =
            '<i data-lucide="arrow-up" aria-hidden="true"></i>';

        document.body.appendChild(button);

        return button;
    }

    function updateBackToTopButton(button) {
        if (!button) {
            return;
        }

        button.classList.toggle(
            "is-visible",
            window.scrollY > 700
        );
    }

    function initializeBackToTop() {
        const button = createBackToTopButton();

        updateBackToTopButton(button);

        window.addEventListener(
            "scroll",
            function () {
                if (legalState.scrollFrame) {
                    return;
                }

                legalState.scrollFrame =
                    window.requestAnimationFrame(function () {
                        updateBackToTopButton(button);
                        legalState.scrollFrame = null;
                    });
            },
            {
                passive: true
            }
        );

        button.addEventListener("click", function () {
            window.scrollTo({
                top: 0,
                behavior: Rolewise.state.reducedMotion
                    ? "auto"
                    : "smooth"
            });
        });
    }

    function initializePrintButtons() {
        document.querySelectorAll("[data-legal-print]").forEach(function (button) {
            if (button.dataset.legalPrintInitialized) {
                return;
            }

            button.dataset.legalPrintInitialized = "true";

            button.addEventListener("click", function () {
                window.print();
            });
        });
    }

    function secureExternalLinks() {
        document.querySelectorAll(
            '.legal-content a[target="_blank"]'
        ).forEach(function (link) {
            const rel = new Set(
                (link.getAttribute("rel") || "")
                    .split(/\s+/)
                    .filter(Boolean)
            );

            rel.add("noopener");
            rel.add("noreferrer");

            link.setAttribute(
                "rel",
                Array.from(rel).join(" ")
            );
        });
    }

    function handleInitialHash() {
        if (!window.location.hash) {
            return;
        }

        const section = document.getElementById(
            window.location.hash.slice(1)
        );

        if (!section) {
            return;
        }

        window.setTimeout(function () {
            section.scrollIntoView({
                behavior: "auto",
                block: "start"
            });

            setActiveSection(section.id);
        }, 80);
    }

    function initializeLegalPage() {
        if (!document.body.classList.contains("legal-page")) {
            return;
        }

        applyContactDetails();
        applyLegalMetadata();
        renderNavigation();
        renderRelatedPages();
        bindNavigation();
        initializeSectionObserver();
        initializeBackToTop();
        initializePrintButtons();
        secureExternalLinks();
        handleInitialHash();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLegalPage,
            {
                once: true
            }
        );
    } else {
        initializeLegalPage();
    }
}());
