(function () {
    "use strict";

    const documentElement = document.documentElement;
    documentElement.classList.remove("no-js");
    documentElement.classList.add("js");

    const config = window.ROLEWISE_CONFIG;

    if (!config || typeof config !== "object") {
        documentElement.classList.add("config-error", "aos-fallback");
        return;
    }

    const state = {
        mobileMenuOpen: false,
        lastFocusedElement: null,
        reducedMotion: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches,
        aosInitialized: false,
        aosBootQueued: false,
        aosRefreshFrame: 0,
        aosRefreshTimer: 0,
        aosHardRefreshRequested: false,
        imageObserver: null
    };

    const socialIcons = {
        linkedin: "linkedin",
        instagram: "instagram",
        x: "twitter",
        youtube: "youtube"
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getConfigValue(path, fallback) {
        if (!path || typeof path !== "string") {
            return fallback;
        }

        const value = path.split(".").reduce(function (current, key) {
            if (current && Object.prototype.hasOwnProperty.call(current, key)) {
                return current[key];
            }

            return undefined;
        }, config);

        return value === undefined || value === null ? fallback : value;
    }

    function safeHref(value, fallback) {
        const href = String(value ?? "").trim();

        if (!href) {
            return fallback || "";
        }

        if (/^(https?:|mailto:)/i.test(href)) {
            return href;
        }

        if (/^(javascript:|data:|vbscript:)/i.test(href)) {
            return fallback || "";
        }

        return href;
    }

    function absoluteUrl(value) {
        const input = String(value ?? "").trim();

        if (!input) {
            return "";
        }

        try {
            return new URL(input, config.company.website).href;
        } catch (error) {
            return input;
        }
    }

    function currentFileName() {
        const path = window.location.pathname.split("/").filter(Boolean);
        return path[path.length - 1] || "index.html";
    }

    function getPageKey() {
        if (document.body && document.body.dataset.page) {
            return document.body.dataset.page;
        }

        const fileMap = {
            "index.html": "home",
            "about.html": "about",
            "professions.html": "professions",
            "courses.html": "courses",
            "contact.html": "contact",
            "ai-for-marketers.html": "ai-for-marketers",
            "ai-for-real-estate.html": "ai-for-real-estate",
            "ai-for-accountants.html": "ai-for-accountants",
            "ai-for-business-owners.html": "ai-for-business-owners",
            "ai-for-sales-teams.html": "ai-for-sales-teams",
            "ai-for-customer-service.html": "ai-for-customer-service",
            "privacy-policy.html": "privacy-policy",
            "terms-of-service.html": "terms-of-service",
            "cookie-policy.html": "cookie-policy"
        };

        return fileMap[currentFileName()] || "home";
    }

    function isProfessionPage(pageKey) {
        return String(pageKey).indexOf("ai-for-") === 0;
    }

    function buildLogoMarkup(extraClass) {
        const className = extraClass
            ? "site-logo " + extraClass
            : "site-logo";

        return [
            '<span class="' + escapeHtml(className) + '">',
            '<span class="site-logo__primary" data-logo-primary>' + escapeHtml(config.brand.logoPrimaryText) + "</span>",
            '<span class="site-logo__secondary" data-logo-secondary>' + escapeHtml(config.brand.logoSecondaryText) + "</span>",
            "</span>"
        ].join("");
    }

    function renderHeader() {
        const header = document.querySelector("[data-site-header]");

        if (!header) {
            return;
        }

        header.removeAttribute("data-aos");
        header.removeAttribute("data-aos-delay");
        header.removeAttribute("data-aos-duration");
        header.removeAttribute("data-aos-offset");

        header.classList.remove(
            "aos-init",
            "aos-animate"
        );

        header.style.removeProperty("transform");
        header.style.removeProperty("opacity");
        header.style.removeProperty("transition");

        header.classList.add("site-header");

        const desktopLinks = config.navigation.headerLinks.map(function (item) {
            const hasDropdown = item.hasDropdown === true;
            const itemClass = hasDropdown
                ? "site-nav__item site-nav__item--dropdown"
                : "site-nav__item";
            const dropdownId = hasDropdown
                ? "site-profession-dropdown"
                : "";

            const toggle = hasDropdown
                ? '<button class="site-nav__dropdown-toggle" type="button" aria-expanded="false" aria-controls="' + dropdownId + '" aria-label="Open profession navigation"><i data-lucide="chevron-down" aria-hidden="true"></i></button>'
                : "";

            const dropdown = hasDropdown
                ? '<div class="site-nav__dropdown" id="' + dropdownId + '"><ul>' + config.navigation.professionDropdown.map(function (profession) {
                    return '<li><a class="site-nav__dropdown-link" href="' + escapeHtml(safeHref(profession.href, "professions.html")) + '" data-nav-href="' + escapeHtml(profession.href) + '"><span>' + escapeHtml(profession.label) + '</span><i data-lucide="arrow-up-right" aria-hidden="true"></i></a></li>';
                }).join("") + "</ul></div>"
                : "";

            return '<li class="' + itemClass + '" data-nav-page="' + escapeHtml(item.page) + '"><a class="site-nav__link" href="' + escapeHtml(safeHref(item.href, "index.html")) + '" data-nav-href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a>" + toggle + dropdown + "</li>";
        }).join("");

        const mobileLinks = config.navigation.headerLinks.map(function (item) {
            const hasDropdown = item.hasDropdown === true;
            const mobileDropdownId = hasDropdown
                ? "site-mobile-profession-dropdown"
                : "";

            const toggle = hasDropdown
                ? '<button class="site-mobile-menu__dropdown-toggle" type="button" aria-expanded="false" aria-controls="' + mobileDropdownId + '" aria-label="Open profession navigation"><i data-lucide="chevron-down" aria-hidden="true"></i></button>'
                : "";

            const dropdown = hasDropdown
                ? '<div class="site-mobile-menu__dropdown" id="' + mobileDropdownId + '" aria-hidden="true" inert><div class="site-mobile-menu__dropdown-inner"><ul class="site-mobile-menu__dropdown-list">' + config.navigation.professionDropdown.map(function (profession) {
                    return '<li><a class="site-mobile-menu__dropdown-link" href="' + escapeHtml(safeHref(profession.href, "professions.html")) + '" data-nav-href="' + escapeHtml(profession.href) + '">' + escapeHtml(profession.label) + "</a></li>";
                }).join("") + "</ul></div></div>"
                : "";

            return '<li class="site-mobile-menu__item" data-nav-page="' + escapeHtml(item.page) + '"><div class="site-mobile-menu__row"><a class="site-mobile-menu__link" href="' + escapeHtml(safeHref(item.href, "index.html")) + '" data-nav-href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a>" + toggle + "</div>" + dropdown + "</li>";
        }).join("");

        header.innerHTML = [
            '<div class="site-container-wide site-header__inner">',
            '<a href="index.html" class="site-header__brand" aria-label="' + escapeHtml(config.brand.name + " home") + '">',
            buildLogoMarkup("site-header__logo"),
            "</a>",
            '<nav class="site-nav" aria-label="Primary navigation">',
            '<ul class="site-nav__list">' + desktopLinks + "</ul>",
            "</nav>",
            '<div class="site-header__actions">',
            '<a class="ui-button ui-button--primary site-header__cta" href="' + escapeHtml(safeHref(config.navigation.headerCta.href, "professions.html")) + '"><span>' + escapeHtml(config.navigation.headerCta.label) + '</span><i data-lucide="arrow-up-right" aria-hidden="true"></i></a>',
            '<button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-mobile-menu" aria-label="Open menu"><span class="site-menu-toggle__lines" aria-hidden="true"><span></span></span></button>',
            "</div>",
            "</div>",
            '<div class="site-mobile-menu" id="site-mobile-menu" aria-hidden="true">',
            '<div class="site-mobile-menu__inner site-container">',
            '<nav class="site-mobile-menu__nav" aria-label="Mobile navigation"><ul>' + mobileLinks + "</ul></nav>",
            '<div class="site-mobile-menu__footer">',
            '<p class="site-mobile-menu__footer-copy">' + escapeHtml(config.brand.shortDescription) + "</p>",
            '<a class="ui-button ui-button--primary" href="' + escapeHtml(safeHref(config.navigation.headerCta.href, "professions.html")) + '"><span>' + escapeHtml(config.navigation.headerCta.label) + '</span><i data-lucide="arrow-up-right" aria-hidden="true"></i></a>',
            '<div class="site-mobile-menu__footer-links">' + config.navigation.legalLinks.map(function (item) {
                return '<a href="' + escapeHtml(safeHref(item.href, "privacy-policy.html")) + '">' + escapeHtml(item.label) + "</a>";
            }).join("") + "</div>",
            "</div>",
            "</div>",
            "</div>"
        ].join("");
    }

    function renderFooter() {
        const footer = document.querySelector("[data-site-footer]");

        if (!footer) {
            return;
        }

        footer.classList.add("site-footer");

        const primaryLinks = config.navigation.footerPrimaryLinks.map(function (item) {
            return '<li><a class="site-footer__link" href="' + escapeHtml(safeHref(item.href, "index.html")) + '" data-nav-href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a></li>";
        }).join("");

        const professionLinks = config.navigation.footerProfessionLinks.map(function (item) {
            return '<li><a class="site-footer__link" href="' + escapeHtml(safeHref(item.href, "professions.html")) + '" data-nav-href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a></li>";
        }).join("");

        const legalLinks = config.navigation.legalLinks.map(function (item) {
            return '<li><a class="site-footer__link" href="' + escapeHtml(safeHref(item.href, "privacy-policy.html")) + '" data-nav-href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a></li>";
        }).join("");

        const legalBottom = config.navigation.legalLinks.map(function (item) {
            return '<a class="site-footer__legal-link" href="' + escapeHtml(safeHref(item.href, "privacy-policy.html")) + '">' + escapeHtml(item.label) + "</a>";
        }).join("");

        const socialLinks = Object.keys(config.socials).map(function (key) {
            const url = config.socials[key];

            if (!url) {
                return "";
            }

            const icon = socialIcons[key] || "external-link";
            const label = key === "x"
                ? "X"
                : key.charAt(0).toUpperCase() + key.slice(1);

            return '<a class="site-footer__social-link" href="' + escapeHtml(safeHref(url, "")) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(label) + '"><i data-lucide="' + escapeHtml(icon) + '" aria-hidden="true"></i></a>';
        }).join("");

        const socialMarkup = socialLinks
            ? '<div class="site-footer__socials" aria-label="Social links">' + socialLinks + "</div>"
            : "";

        footer.innerHTML = [
            '<div class="site-footer__main">',
            '<div class="site-container-wide">',
            '<div class="site-footer__top">',
            '<div class="site-footer__brand">',
            '<a href="index.html" aria-label="' + escapeHtml(config.brand.name + " home") + '">' + buildLogoMarkup("site-footer__logo") + "</a>",
            '<p class="site-footer__description" data-footer-description>' + escapeHtml(config.brand.shortDescription) + "</p>",
            '<div class="site-footer__contact">',
            '<span class="site-footer__contact-label">' + escapeHtml(config.contact.emailLabel) + "</span>",
            '<a class="site-footer__contact-link" href="mailto:' + escapeHtml(config.company.email) + '" data-company-email>' + escapeHtml(config.company.email) + "</a>",
            '<span class="site-footer__contact-label">' + escapeHtml(config.contact.addressLabel) + "</span>",
            '<address class="site-footer__address" data-company-address>' + escapeHtml(config.company.address) + "</address>",
            "</div>",
            socialMarkup,
            "</div>",
            '<div class="site-footer__navigation">',
            '<div class="site-footer__column"><h2 class="site-footer__heading">' + escapeHtml(config.ui.footerHeadings.explore) + '</h2><ul class="site-footer__links">' + primaryLinks + "</ul></div>",
            '<div class="site-footer__column"><h2 class="site-footer__heading">' + escapeHtml(config.ui.footerHeadings.professions) + '</h2><ul class="site-footer__links">' + professionLinks + "</ul></div>",
            '<div class="site-footer__column"><h2 class="site-footer__heading">' + escapeHtml(config.ui.footerHeadings.legal) + '</h2><ul class="site-footer__links">' + legalLinks + "</ul></div>",
            "</div>",
            "</div>",
            '<p class="site-footer__disclaimer" data-disclaimer="footerDisclaimer">' + escapeHtml(config.disclaimer.footerDisclaimer) + "</p>",
            '<div class="site-footer__bottom">',
            '<p class="site-footer__copyright">© <span data-current-year></span> <span data-copyright-text>' + escapeHtml(config.company.copyrightText) + "</span></p>",
            '<div class="site-footer__legal">' + legalBottom + "</div>",
            "</div>",
            "</div>",
            "</div>"
        ].join("");
    }

    function updateActiveNavigation() {
        const pageKey = getPageKey();
        const file = currentFileName();
        const professionParentActive = isProfessionPage(pageKey);

        document.querySelectorAll("[data-nav-page]").forEach(function (item) {
            const itemPage = item.dataset.navPage;
            const isCurrentPage = itemPage === pageKey;
            const isActive = isCurrentPage || (
                professionParentActive &&
                itemPage === "professions"
            );

            item.classList.toggle("is-active", isActive);

            const directLink = item.querySelector(
                ":scope > .site-nav__link, :scope > .site-mobile-menu__row .site-mobile-menu__link"
            );

            if (directLink) {
                if (isCurrentPage) {
                    directLink.setAttribute("aria-current", "page");
                } else {
                    directLink.removeAttribute("aria-current");
                }
            }
        });

        document.querySelectorAll("[data-nav-href]").forEach(function (link) {
            const target = String(link.dataset.navHref || "")
                .split("?")[0]
                .split("#")[0];

            const matches = target === file;

            if (matches) {
                link.setAttribute("aria-current", "page");
            } else if (!link.closest("[data-nav-page].is-active")) {
                link.removeAttribute("aria-current");
            }
        });
    }

    function focusableElements(container) {
        return Array.from(
            container.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.hasAttribute("hidden") &&
                element.getAttribute("aria-hidden") !== "true" &&
                element.offsetParent !== null;
        });
    }

    function setMobileMenu(open) {
        const menu = document.querySelector(".site-mobile-menu");
        const toggle = document.querySelector(".site-menu-toggle");

        if (!menu || !toggle) {
            return;
        }

        state.mobileMenuOpen = open;
        menu.classList.toggle("is-open", open);
        menu.setAttribute("aria-hidden", String(!open));
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.classList.toggle("menu-open", open);

        if (open) {
            state.lastFocusedElement = document.activeElement;

            window.requestAnimationFrame(function () {
                const focusables = focusableElements(menu);

                if (focusables.length) {
                    focusables[0].focus();
                }
            });
        } else if (
            state.lastFocusedElement &&
            typeof state.lastFocusedElement.focus === "function"
        ) {
            state.lastFocusedElement.focus();
            state.lastFocusedElement = null;
        }
    }

    function closeDesktopDropdowns(exceptItem) {
        document.querySelectorAll(".site-nav__item--dropdown.is-open").forEach(function (item) {
            if (item === exceptItem) {
                return;
            }

            item.classList.remove("is-open");

            const button = item.querySelector(".site-nav__dropdown-toggle");

            if (button) {
                button.setAttribute("aria-expanded", "false");
                button.setAttribute("aria-label", "Open profession navigation");
            }
        });
    }

    function initNavigation() {
        const menuToggle = document.querySelector(".site-menu-toggle");
        const mobileMenu = document.querySelector(".site-mobile-menu");

        if (menuToggle && !menuToggle.dataset.initialized) {
            menuToggle.dataset.initialized = "true";

            menuToggle.addEventListener("click", function () {
                setMobileMenu(!state.mobileMenuOpen);
            });
        }

        if (mobileMenu && !mobileMenu.dataset.initialized) {
            mobileMenu.dataset.initialized = "true";

            mobileMenu.addEventListener("click", function (event) {
                if (event.target === mobileMenu) {
                    setMobileMenu(false);
                    return;
                }

                const link = event.target.closest("a[href]");

                if (
                    link &&
                    !link.getAttribute("href").startsWith("#")
                ) {
                    setMobileMenu(false);
                }
            });

            mobileMenu.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    setMobileMenu(false);
                    return;
                }

                if (event.key !== "Tab") {
                    return;
                }

                const focusables = focusableElements(mobileMenu);

                if (!focusables.length) {
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            });
        }

        document.querySelectorAll(".site-mobile-menu__dropdown-toggle").forEach(function (button) {
            if (button.dataset.initialized) {
                return;
            }

            button.dataset.initialized = "true";

            button.addEventListener("click", function () {
                const targetId = button.getAttribute("aria-controls");
                const dropdown = targetId
                    ? document.getElementById(targetId)
                    : null;
                const open = button.getAttribute("aria-expanded") !== "true";

                button.setAttribute("aria-expanded", String(open));
                button.setAttribute(
                    "aria-label",
                    open
                        ? "Close profession navigation"
                        : "Open profession navigation"
                );

                if (dropdown) {
                    dropdown.classList.toggle("is-open", open);
                    dropdown.setAttribute("aria-hidden", String(!open));
                    dropdown.inert = !open;
                }
            });
        });

        document.querySelectorAll(".site-nav__dropdown-toggle").forEach(function (button) {
            if (button.dataset.initialized) {
                return;
            }

            button.dataset.initialized = "true";

            const item = button.closest(".site-nav__item--dropdown");

            button.addEventListener("click", function () {
                const open = button.getAttribute("aria-expanded") !== "true";

                closeDesktopDropdowns(open ? item : null);

                button.setAttribute("aria-expanded", String(open));
                button.setAttribute(
                    "aria-label",
                    open
                        ? "Close profession navigation"
                        : "Open profession navigation"
                );

                if (item) {
                    item.classList.toggle("is-open", open);
                }
            });

            button.addEventListener("keydown", function (event) {
                if (event.key !== "ArrowDown") {
                    return;
                }

                event.preventDefault();

                closeDesktopDropdowns(item);

                button.setAttribute("aria-expanded", "true");
                button.setAttribute(
                    "aria-label",
                    "Close profession navigation"
                );

                if (item) {
                    item.classList.add("is-open");

                    const firstLink = item.querySelector(
                        ".site-nav__dropdown-link"
                    );

                    if (firstLink) {
                        firstLink.focus();
                    }
                }
            });

            if (item) {
                item.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        event.preventDefault();

                        item.classList.remove("is-open");
                        button.setAttribute("aria-expanded", "false");
                        button.setAttribute(
                            "aria-label",
                            "Open profession navigation"
                        );
                        button.focus();
                    }
                });
            }
        });

        document.addEventListener("click", function (event) {
            if (!event.target.closest(".site-nav__item--dropdown")) {
                closeDesktopDropdowns(null);
            }

            if (
                state.mobileMenuOpen &&
                !event.target.closest(".site-mobile-menu__inner") &&
                !event.target.closest(".site-menu-toggle")
            ) {
                setMobileMenu(false);
            }
        });

        window.addEventListener("resize", function () {
            if (
                window.innerWidth > 991 &&
                state.mobileMenuOpen
            ) {
                setMobileMenu(false);
            }
        });
    }

    function applyConfigBindings(scope) {
        const root = scope || document;
        const year = String(new Date().getFullYear());

        root.querySelectorAll("[data-brand-name]").forEach(function (element) {
            element.textContent = config.brand.name;
        });

        root.querySelectorAll("[data-logo-primary]").forEach(function (element) {
            element.textContent = config.brand.logoPrimaryText;
        });

        root.querySelectorAll("[data-logo-secondary]").forEach(function (element) {
            element.textContent = config.brand.logoSecondaryText;
        });

        root.querySelectorAll("[data-company-email]").forEach(function (element) {
            element.textContent = config.company.email;

            if (element.tagName === "A") {
                element.setAttribute(
                    "href",
                    "mailto:" + config.company.email
                );
            }
        });

        root.querySelectorAll("[data-company-address]").forEach(function (element) {
            element.textContent = config.company.address;
        });

        root.querySelectorAll("[data-footer-description]").forEach(function (element) {
            element.textContent = config.brand.shortDescription;
        });

        root.querySelectorAll("[data-advertise-title]").forEach(function (element) {
            element.textContent = config.advertise.title;
        });

        root.querySelectorAll("[data-advertise-text]").forEach(function (element) {
            element.textContent = config.advertise.text;
        });

        root.querySelectorAll("[data-current-year]").forEach(function (element) {
            element.textContent = year;
        });

        root.querySelectorAll("[data-copyright-text]").forEach(function (element) {
            element.textContent = config.company.copyrightText;
        });

        root.querySelectorAll("[data-disclaimer]").forEach(function (element) {
            const key = element.dataset.disclaimer || "footerDisclaimer";
            const value = config.disclaimer[key];

            if (value) {
                element.textContent = value;
            }
        });

        root.querySelectorAll("[data-config-text]").forEach(function (element) {
            const value = getConfigValue(
                element.dataset.configText,
                ""
            );

            if (
                typeof value === "string" ||
                typeof value === "number"
            ) {
                element.textContent = String(value);
            }
        });

        root.querySelectorAll("[data-config-href]").forEach(function (element) {
            const value = getConfigValue(
                element.dataset.configHref,
                ""
            );

            const href = safeHref(value, "");

            if (href) {
                element.setAttribute("href", href);
            } else {
                element.removeAttribute("href");
            }
        });

        root.querySelectorAll("[data-config-src]").forEach(function (element) {
            const value = getConfigValue(
                element.dataset.configSrc,
                ""
            );

            if (value) {
                element.setAttribute("src", value);
            }
        });

        root.querySelectorAll("[data-social-link]").forEach(function (element) {
            const key = element.dataset.socialLink;
            const value = config.socials[key];

            if (value) {
                element.hidden = false;
                element.setAttribute("href", safeHref(value, ""));
            } else {
                element.hidden = true;
                element.removeAttribute("href");
            }
        });

        applyFormBindings(root);
    }

    function applyFormBindings(root) {
        root.querySelectorAll("[data-form-label]").forEach(function (element) {
            const key = element.dataset.formLabel;

            if (config.forms.labels[key]) {
                element.textContent = config.forms.labels[key];
            }
        });

        root.querySelectorAll("[data-form-placeholder]").forEach(function (element) {
            const key = element.dataset.formPlaceholder;

            if (config.forms.placeholders[key]) {
                element.setAttribute(
                    "placeholder",
                    config.forms.placeholders[key]
                );
            }
        });

        root.querySelectorAll('[data-form-options="inquiryType"]').forEach(function (select) {
            const placeholder = config.forms.placeholders.inquiryType;

            select.innerHTML =
                '<option value="">' +
                escapeHtml(placeholder) +
                "</option>" +
                config.forms.inquiryOptions.map(function (option) {
                    return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + "</option>";
                }).join("");
        });

        root.querySelectorAll('[data-form-options="profession"]').forEach(function (select) {
            const placeholder = config.forms.placeholders.profession;

            select.innerHTML =
                '<option value="">' +
                escapeHtml(placeholder) +
                "</option>" +
                config.forms.professionOptions.map(function (option) {
                    return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + "</option>";
                }).join("");
        });

        root.querySelectorAll("[data-form-privacy-consent]").forEach(function (element) {
            element.textContent =
                config.forms.labels.privacyConsent;
        });

        root.querySelectorAll("[data-form-privacy-text]").forEach(function (element) {
            element.textContent =
                config.forms.privacyText;
        });

        root.querySelectorAll("[data-form-submit]").forEach(function (element) {
            element.textContent =
                config.forms.submitText;
        });
    }

    function ensureMeta(name, property) {
        const selector = property
            ? 'meta[property="' + property + '"]'
            : 'meta[name="' + name + '"]';

        let meta = document.head.querySelector(selector);

        if (!meta) {
            meta = document.createElement("meta");

            if (property) {
                meta.setAttribute("property", property);
            } else {
                meta.setAttribute("name", name);
            }

            document.head.appendChild(meta);
        }

        return meta;
    }

    function ensureCanonical() {
        let link = document.head.querySelector(
            'link[rel="canonical"]'
        );

        if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "canonical");
            document.head.appendChild(link);
        }

        return link;
    }

    function applyMetadata() {
        const pageKey = getPageKey();
        const pageSeo = config.seo.pages[pageKey];

        if (!pageSeo) {
            return;
        }

        document.title =
            pageSeo.title ||
            config.brand.name;

        ensureMeta("description").setAttribute(
            "content",
            pageSeo.description ||
            config.seo.defaultDescription
        );

        ensureCanonical().setAttribute(
            "href",
            absoluteUrl(pageSeo.canonical)
        );

        ensureMeta(null, "og:title").setAttribute(
            "content",
            pageSeo.title ||
            config.brand.name
        );

        ensureMeta(null, "og:description").setAttribute(
            "content",
            pageSeo.description ||
            config.seo.defaultDescription
        );

        ensureMeta(null, "og:type").setAttribute(
            "content",
            config.seo.openGraph.type
        );

        ensureMeta(null, "og:site_name").setAttribute(
            "content",
            config.seo.openGraph.siteName
        );

        ensureMeta(null, "og:locale").setAttribute(
            "content",
            config.seo.openGraph.locale
        );

        ensureMeta(null, "og:url").setAttribute(
            "content",
            absoluteUrl(pageSeo.canonical)
        );

        ensureMeta(null, "og:image").setAttribute(
            "content",
            absoluteUrl(
                pageSeo.image ||
                config.seo.openGraph.defaultImage
            )
        );

        ensureMeta("twitter:card").setAttribute(
            "content",
            config.seo.openGraph.twitterCard
        );

        ensureMeta("twitter:title").setAttribute(
            "content",
            pageSeo.title ||
            config.brand.name
        );

        ensureMeta("twitter:description").setAttribute(
            "content",
            pageSeo.description ||
            config.seo.defaultDescription
        );

        ensureMeta("twitter:image").setAttribute(
            "content",
            absoluteUrl(
                pageSeo.image ||
                config.seo.openGraph.defaultImage
            )
        );
    }

    function setSchema(id, data) {
        let script = document.getElementById(id);

        if (!data) {
            if (script) {
                script.remove();
            }

            return;
        }

        if (!script) {
            script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = id;
            document.head.appendChild(script);
        }

        script.textContent = JSON.stringify(data);
    }

    function breadcrumbName(pageKey) {
        const names = {
            home: "Home",
            about: "About",
            professions: "Professions",
            courses: "Courses",
            contact: "Contact",
            "ai-for-marketers": "AI for Marketers",
            "ai-for-real-estate": "AI for Real Estate",
            "ai-for-accountants": "AI for Accountants",
            "ai-for-business-owners": "AI for Business Owners",
            "ai-for-sales-teams": "AI for Sales Teams",
            "ai-for-customer-service": "AI for Customer Service",
            "privacy-policy": "Privacy Policy",
            "terms-of-service": "Terms of Service",
            "cookie-policy": "Cookie Policy"
        };

        return names[pageKey] || config.brand.name;
    }

    function refreshSchemas() {
        const pageKey = getPageKey();
        const pageSeo =
            config.seo.pages[pageKey] ||
            config.seo.pages.home;

        const sameAs = Object.keys(config.socials).map(function (key) {
            return config.socials[key];
        }).filter(Boolean);

        const organization = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: config.company.legalName,
            url: absoluteUrl(config.company.website),
            email: config.company.email,
            address: {
                "@type": "PostalAddress",
                addressLocality: config.company.address
            }
        };

        if (sameAs.length) {
            organization.sameAs = sameAs;
        }

        setSchema(
            "rolewise-organization-schema",
            organization
        );

        setSchema(
            "rolewise-website-schema",
            {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: config.brand.name,
                url: absoluteUrl(config.company.website),
                description: config.seo.defaultDescription,
                publisher: {
                    "@type": "Organization",
                    name: config.company.legalName
                }
            }
        );

        if (pageKey !== "home") {
            const items = [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: absoluteUrl(
                        config.seo.pages.home.canonical
                    )
                }
            ];

            if (isProfessionPage(pageKey)) {
                items.push({
                    "@type": "ListItem",
                    position: 2,
                    name: "Professions",
                    item: absoluteUrl(
                        config.seo.pages.professions.canonical
                    )
                });
            }

            items.push({
                "@type": "ListItem",
                position: items.length + 1,
                name: breadcrumbName(pageKey),
                item: absoluteUrl(pageSeo.canonical)
            });

            setSchema(
                "rolewise-breadcrumb-schema",
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: items
                }
            );
        } else {
            setSchema(
                "rolewise-breadcrumb-schema",
                null
            );
        }

        if (pageKey === "professions") {
            setSchema(
                "rolewise-collection-schema",
                {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    name: "Profession-Specific AI Learning Paths",
                    description: config.seo.pages.professions.description,
                    url: absoluteUrl(
                        config.seo.pages.professions.canonical
                    ),
                    mainEntity: {
                        "@type": "ItemList",
                        itemListElement: config.professions.map(function (profession, index) {
                            return {
                                "@type": "ListItem",
                                position: index + 1,
                                name: profession.title,
                                url: absoluteUrl(profession.page)
                            };
                        })
                    }
                }
            );
        } else {
            setSchema(
                "rolewise-collection-schema",
                null
            );
        }

        const faqRoot = document.querySelector(
            "[data-faq-schema]"
        );

        if (faqRoot) {
            const faqEntries = Array.from(
                faqRoot.querySelectorAll(
                    ".ui-accordion__item"
                )
            ).map(function (item) {
                const question = item.querySelector(
                    ".ui-accordion__question"
                );

                const answer = item.querySelector(
                    ".ui-accordion__content-inner"
                );

                if (!question || !answer) {
                    return null;
                }

                const questionText =
                    question.textContent.trim();

                const answerText =
                    answer.textContent.trim();

                if (!questionText || !answerText) {
                    return null;
                }

                return {
                    "@type": "Question",
                    name: questionText,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: answerText
                    }
                };
            }).filter(Boolean);

            if (faqEntries.length) {
                setSchema(
                    "rolewise-faq-schema",
                    {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: faqEntries
                    }
                );
            } else {
                setSchema(
                    "rolewise-faq-schema",
                    null
                );
            }
        } else {
            setSchema(
                "rolewise-faq-schema",
                null
            );
        }
    }

    function initAccordions(scope) {
        const root = scope || document;

        function findPanel(accordion, trigger) {
            const panelId = trigger.getAttribute("aria-controls");

            if (panelId) {
                const panel = document.getElementById(panelId);

                if (
                    panel &&
                    accordion.contains(panel)
                ) {
                    return panel;
                }
            }

            return trigger.parentElement
                ? trigger.parentElement.nextElementSibling
                : null;
        }

        function setExpanded(accordion, trigger, expanded) {
            const panel = findPanel(
                accordion,
                trigger
            );

            trigger.setAttribute(
                "aria-expanded",
                String(expanded)
            );

            if (panel) {
                panel.hidden = !expanded;
                panel.classList.toggle(
                    "is-open",
                    expanded
                );
            }

            const item = trigger.closest(
                "[data-accordion-item]"
            );

            if (item) {
                item.classList.toggle(
                    "is-open",
                    expanded
                );
            }
        }

        root.querySelectorAll("[data-accordion]").forEach(function (accordion) {
            if (accordion.dataset.initialized) {
                return;
            }

            accordion.dataset.initialized = "true";

            const single =
                accordion.dataset.accordionSingle === "true";

            accordion.querySelectorAll("[data-accordion-trigger]").forEach(function (trigger) {
                setExpanded(
                    accordion,
                    trigger,
                    trigger.getAttribute("aria-expanded") === "true"
                );
            });

            accordion.addEventListener("click", function (event) {
                const trigger = event.target.closest(
                    "[data-accordion-trigger]"
                );

                if (
                    !trigger ||
                    !accordion.contains(trigger)
                ) {
                    return;
                }

                const expanded =
                    trigger.getAttribute("aria-expanded") === "true";

                if (single && !expanded) {
                    accordion.querySelectorAll(
                        '[data-accordion-trigger][aria-expanded="true"]'
                    ).forEach(function (openTrigger) {
                        if (openTrigger !== trigger) {
                            setExpanded(
                                accordion,
                                openTrigger,
                                false
                            );
                        }
                    });
                }

                setExpanded(
                    accordion,
                    trigger,
                    !expanded
                );

                window.setTimeout(
                    refreshSchemas,
                    0
                );
            });
        });
    }

    function refreshIcons() {
        if (
            !window.lucide ||
            typeof window.lucide.createIcons !== "function"
        ) {
            return;
        }

        window.lucide.createIcons({
            attrs: {
                "aria-hidden": "true"
            },
            nameAttr: "data-lucide"
        });
    }

    function getAOSNodes(scope) {
        const root = scope || document;
        const nodes = [];

        if (
            root instanceof Element &&
            root.matches("[data-aos]")
        ) {
            nodes.push(root);
        }

        if (
            root &&
            typeof root.querySelectorAll === "function"
        ) {
            root.querySelectorAll("[data-aos]").forEach(function (element) {
                nodes.push(element);
            });
        }

        return Array.from(new Set(nodes));
    }

    function removeAOSAttributes(element) {
        if (!element) {
            return;
        }

        [
            "data-aos",
            "data-aos-delay",
            "data-aos-duration",
            "data-aos-easing",
            "data-aos-offset",
            "data-aos-anchor",
            "data-aos-anchor-placement",
            "data-aos-mirror",
            "data-aos-once"
        ].forEach(function (attribute) {
            element.removeAttribute(attribute);
        });

        element.classList.remove(
            "aos-init",
            "aos-animate"
        );
    }

    function groupSectionHeaderAnimations(scope) {
        const root = scope || document;

        if (
            !root ||
            typeof root.querySelectorAll !== "function"
        ) {
            return;
        }

        root.querySelectorAll(
            ".site-section__header"
        ).forEach(function (header) {
            const animatedChildren = Array.from(
                header.querySelectorAll("[data-aos]")
            );

            if (!animatedChildren.length) {
                return;
            }

            animatedChildren.forEach(function (element) {
                removeAOSAttributes(element);
            });

            header.setAttribute(
                "data-aos",
                "fade-up"
            );
        });
    }

    function normalizeAOSNodes(scope) {
        const compactViewport =
            window.innerWidth <= 767;

        groupSectionHeaderAnimations(scope);

        getAOSNodes(scope).forEach(function (element) {
            const computedPosition =
                window.getComputedStyle(element).position;

            const mustRemainStatic =
                element.matches(
                    [
                        ".site-sticky",
                        ".swiper",
                        ".swiper-wrapper",
                        ".swiper-slide",
                        "[data-accordion-panel]",
                        "[hidden]"
                    ].join(",")
                ) ||
                computedPosition === "sticky";

            if (mustRemainStatic) {
                removeAOSAttributes(element);
                return;
            }

            const animation =
                element.getAttribute("data-aos") ||
                "fade-up";

            if (
                animation !== "fade-up" &&
                animation !== "fade"
            ) {
                element.setAttribute(
                    "data-aos",
                    "fade-up"
                );
            }

            element.removeAttribute(
                "data-aos-duration"
            );

            element.removeAttribute(
                "data-aos-easing"
            );

            element.removeAttribute(
                "data-aos-offset"
            );

            element.removeAttribute(
                "data-aos-anchor-placement"
            );

            const delay = Number(
                element.getAttribute("data-aos-delay")
            );

            if (
                Number.isFinite(delay) &&
                delay > 0
            ) {
                element.setAttribute(
                    "data-aos-delay",
                    String(
                        Math.min(
                            delay,
                            compactViewport
                                ? 80
                                : 140
                        )
                    )
                );
            } else {
                element.removeAttribute(
                    "data-aos-delay"
                );
            }
        });
    }

    function removeAOSFromInitialViewport() {
        const viewportLimit =
            window.innerHeight * 0.92;

        getAOSNodes(document).forEach(function (element) {
            const rectangle =
                element.getBoundingClientRect();

            const visibleInitially =
                rectangle.top < viewportLimit &&
                rectangle.bottom > 0;

            if (visibleInitially) {
                removeAOSAttributes(element);
            }
        });
    }

    function showAOSFallback() {
        documentElement.classList.remove(
            "aos-ready"
        );

        documentElement.classList.add(
            "aos-fallback"
        );

        getAOSNodes(document).forEach(function (element) {
            element.classList.add(
                "aos-init",
                "aos-animate"
            );
        });
    }

    function initializeAOSNow() {
        state.aosBootQueued = false;

        if (state.aosInitialized) {
            return;
        }

        if (
            state.reducedMotion ||
            !window.AOS ||
            typeof window.AOS.init !== "function"
        ) {
            showAOSFallback();
            return;
        }

        normalizeAOSNodes(document);
        removeAOSFromInitialViewport();

        documentElement.classList.remove(
            "aos-fallback"
        );

        documentElement.classList.add(
            "aos-ready"
        );

        try {
            window.AOS.init({
                once: true,
                mirror: false,
                duration: 680,
                easing: "ease-out-cubic",
                offset: 82,
                delay: 0,
                anchorPlacement: "top-bottom",
                disableMutationObserver: true,
                throttleDelay: 99,
                debounceDelay: 50,
                disable: function () {
                    return state.reducedMotion;
                }
            });

            state.aosInitialized = true;

            refreshAOS({
                hard: true
            });
        } catch (error) {
            state.aosInitialized = false;
            showAOSFallback();

            console.warn(
                "Rolewise AOS initialization failed.",
                error
            );
        }
    }

    function initAOS() {
        if (
            state.aosInitialized ||
            state.aosBootQueued
        ) {
            return;
        }

        state.aosBootQueued = true;

        const fontReadyPromise =
            document.fonts &&
                document.fonts.ready
                ? document.fonts.ready
                : Promise.resolve();

        const timeoutPromise =
            new Promise(function (resolve) {
                window.setTimeout(
                    resolve,
                    320
                );
            });

        Promise.race([
            fontReadyPromise,
            timeoutPromise
        ]).then(function () {
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(
                    initializeAOSNow
                );
            });
        });
    }

    function refreshAOS(options) {
        const settings =
            options &&
                typeof options === "object"
                ? options
                : {};

        const requestedHardRefresh =
            options === true ||
            settings.hard === true;

        const scope =
            settings.scope || document;

        normalizeAOSNodes(scope);

        if (state.reducedMotion) {
            showAOSFallback();
            return;
        }

        if (!state.aosInitialized) {
            initAOS();
            return;
        }

        const containsNewElements =
            Boolean(
                document.querySelector(
                    "[data-aos]:not(.aos-init)"
                )
            );

        state.aosHardRefreshRequested =
            state.aosHardRefreshRequested ||
            requestedHardRefresh ||
            containsNewElements;

        if (state.aosRefreshTimer) {
            window.clearTimeout(
                state.aosRefreshTimer
            );
        }

        state.aosRefreshTimer =
            window.setTimeout(function () {
                state.aosRefreshTimer = 0;

                if (state.aosRefreshFrame) {
                    window.cancelAnimationFrame(
                        state.aosRefreshFrame
                    );
                }

                state.aosRefreshFrame =
                    window.requestAnimationFrame(function () {
                        state.aosRefreshFrame = 0;

                        if (
                            !window.AOS ||
                            !state.aosInitialized
                        ) {
                            showAOSFallback();
                            return;
                        }

                        const useHardRefresh =
                            state.aosHardRefreshRequested;

                        state.aosHardRefreshRequested =
                            false;

                        if (
                            useHardRefresh &&
                            typeof window.AOS.refreshHard ===
                            "function"
                        ) {
                            window.AOS.refreshHard();
                        } else if (
                            typeof window.AOS.refresh ===
                            "function"
                        ) {
                            window.AOS.refresh();
                        }
                    });
            }, 90);
    }

    function handleImage(image) {
        if (
            !image ||
            image.dataset.imageFallbackInitialized
        ) {
            return;
        }

        image.dataset.imageFallbackInitialized =
            "true";

        image.addEventListener(
            "error",
            function () {
                const container =
                    image.closest(
                        "picture, figure, [data-image-container]"
                    ) ||
                    image.parentElement;

                if (container) {
                    container.classList.add(
                        "is-image-error"
                    );
                }

                image.classList.add(
                    "is-image-error"
                );
            },
            {
                once: true
            }
        );
    }

    function initImageFallbacks() {
        document.querySelectorAll("img").forEach(
            handleImage
        );

        if (
            state.imageObserver ||
            !window.MutationObserver
        ) {
            return;
        }

        state.imageObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (!(node instanceof Element)) {
                        return;
                    }

                    if (node.tagName === "IMG") {
                        handleImage(node);
                    }

                    node.querySelectorAll("img").forEach(
                        handleImage
                    );
                });
            });
        });

        state.imageObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    function initSmoothAnchors() {
        document.addEventListener("click", function (event) {
            const link = event.target.closest(
                'a[href*="#"]'
            );

            if (!link) {
                return;
            }

            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            let url;

            try {
                url = new URL(
                    href,
                    window.location.href
                );
            } catch (error) {
                return;
            }

            if (
                url.pathname !== window.location.pathname ||
                !url.hash
            ) {
                return;
            }

            const target = document.getElementById(
                decodeURIComponent(
                    url.hash.slice(1)
                )
            );

            if (!target) {
                return;
            }

            event.preventDefault();

            const header = document.querySelector(
                ".site-header"
            );

            const headerHeight = header
                ? header.offsetHeight
                : 0;

            const top =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight -
                20;

            window.scrollTo({
                top: Math.max(0, top),
                behavior: state.reducedMotion
                    ? "auto"
                    : "smooth"
            });

            window.history.pushState(
                null,
                "",
                url.hash
            );

            window.setTimeout(function () {
                target.setAttribute(
                    "tabindex",
                    "-1"
                );

                target.focus({
                    preventScroll: true
                });

                target.addEventListener(
                    "blur",
                    function removeTemporaryTabIndex() {
                        target.removeAttribute(
                            "tabindex"
                        );
                    },
                    {
                        once: true
                    }
                );
            }, state.reducedMotion ? 0 : 420);
        });
    }

    function createBackToTop() {
        let button = document.querySelector(
            "[data-back-to-top]"
        );

        if (!button) {
            button = document.createElement(
                "button"
            );

            button.type = "button";
            button.className = "site-back-to-top";

            button.setAttribute(
                "data-back-to-top",
                ""
            );

            button.setAttribute(
                "aria-label",
                config.ui.buttons.backToTop
            );

            button.innerHTML =
                '<i data-lucide="arrow-up" aria-hidden="true"></i>';

            document.body.appendChild(button);
        }

        if (button.dataset.initialized) {
            return;
        }

        button.dataset.initialized = "true";

        function updateVisibility() {
            button.classList.toggle(
                "is-visible",
                window.scrollY > 700
            );
        }

        button.addEventListener("click", function () {
            window.scrollTo({
                top: 0,
                behavior: state.reducedMotion
                    ? "auto"
                    : "smooth"
            });
        });

        window.addEventListener(
            "scroll",
            updateVisibility,
            {
                passive: true
            }
        );

        updateVisibility();
    }

    function readCookiePreference() {
        try {
            return window.localStorage.getItem(
                config.cookie.storageKey
            );
        } catch (error) {
            return null;
        }
    }

    function saveCookiePreference(value) {
        try {
            window.localStorage.setItem(
                config.cookie.storageKey,
                value
            );

            return true;
        } catch (error) {
            return false;
        }
    }

    function initCookieConsent() {
        let banner = document.querySelector(
            "[data-cookie-banner]"
        );

        if (!banner) {
            banner = document.createElement(
                "aside"
            );

            banner.className = "site-cookie";

            banner.setAttribute(
                "data-cookie-banner",
                ""
            );

            banner.setAttribute(
                "aria-label",
                config.cookie.title
            );

            banner.setAttribute(
                "aria-live",
                "polite"
            );

            banner.innerHTML = [
                '<div class="site-cookie__content">',
                '<h2 class="site-cookie__title">' + escapeHtml(config.cookie.title) + "</h2>",
                '<p class="site-cookie__text">' + escapeHtml(config.cookie.text) + ' <a href="' + escapeHtml(safeHref(config.cookie.privacyHref, "privacy-policy.html")) + '">' + escapeHtml(config.cookie.privacyLabel) + "</a></p>",
                '<div class="site-cookie__actions">',
                '<button class="ui-button ui-button--primary site-cookie__button" type="button" data-cookie-accept>' + escapeHtml(config.cookie.acceptLabel) + "</button>",
                '<button class="ui-button ui-button--secondary site-cookie__button site-cookie__button--decline" type="button" data-cookie-decline>' + escapeHtml(config.cookie.declineLabel) + "</button>",
                "</div>",
                "</div>"
            ].join("");

            document.body.appendChild(
                banner
            );
        }

        if (banner.dataset.initialized) {
            return;
        }

        banner.dataset.initialized =
            "true";

        const preference =
            readCookiePreference();

        if (!preference) {
            window.requestAnimationFrame(function () {
                banner.classList.add(
                    "is-visible"
                );
            });
        }

        const accept = banner.querySelector(
            "[data-cookie-accept]"
        );

        const decline = banner.querySelector(
            "[data-cookie-decline]"
        );

        function choose(value) {
            saveCookiePreference(value);

            banner.classList.remove(
                "is-visible"
            );

            document.dispatchEvent(
                new CustomEvent(
                    "rolewise:cookie-consent",
                    {
                        detail: {
                            value: value
                        }
                    }
                )
            );
        }

        if (accept) {
            accept.addEventListener(
                "click",
                function () {
                    choose("accepted");
                }
            );
        }

        if (decline) {
            decline.addEventListener(
                "click",
                function () {
                    choose("declined");
                }
            );
        }
    }

    function initReducedMotionWatcher() {
        const media = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        function update(event) {
            state.reducedMotion =
                event.matches;

            documentElement.classList.toggle(
                "reduced-motion",
                state.reducedMotion
            );

            if (state.reducedMotion) {
                showAOSFallback();
                return;
            }

            if (!state.aosInitialized) {
                initAOS();
                return;
            }

            documentElement.classList.remove(
                "aos-fallback"
            );

            documentElement.classList.add(
                "aos-ready"
            );

            refreshAOS({
                hard: true
            });
        }

        update(media);

        if (
            typeof media.addEventListener ===
            "function"
        ) {
            media.addEventListener(
                "change",
                update
            );
        } else if (
            typeof media.addListener ===
            "function"
        ) {
            media.addListener(update);
        }
    }

    function findProfession(slug) {
        return config.professions.find(function (profession) {
            return profession.slug === slug;
        }) || null;
    }

    function refreshGlobalUI(scope) {
        const root = scope || document;

        applyConfigBindings(root);
        initAccordions(root);
        refreshIcons();
        initImageFallbacks();
        updateActiveNavigation();
        refreshSchemas();

        refreshAOS({
            hard: true,
            scope: root
        });
    }

    function initialize() {
        initReducedMotionWatcher();
        renderHeader();
        renderFooter();
        applyConfigBindings(document);
        applyMetadata();
        updateActiveNavigation();
        initNavigation();
        initAccordions(document);
        initImageFallbacks();
        initSmoothAnchors();
        createBackToTop();
        initCookieConsent();
        refreshIcons();
        refreshSchemas();
        initAOS();

        window.addEventListener(
            "load",
            function () {
                refreshAOS();
            },
            {
                once: true
            }
        );
    }

    window.Rolewise = {
        config: config,
        state: state,
        escapeHtml: escapeHtml,
        getConfigValue: getConfigValue,
        findProfession: findProfession,
        applyConfigBindings: applyConfigBindings,
        applyMetadata: applyMetadata,
        updateActiveNavigation: updateActiveNavigation,
        initAccordions: initAccordions,
        refreshIcons: refreshIcons,
        refreshAOS: refreshAOS,
        refreshSchemas: refreshSchemas,
        refreshGlobalUI: refreshGlobalUI,
        setMobileMenu: setMobileMenu
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }
}());

(function () {
    "use strict";

    if (window.__ROLEWISE_SITE_IDENTITY_INITIALIZED__) {
        return;
    }

    const config = window.ROLEWISE_CONFIG;

    if (!config || !config.siteIdentity) {
        return;
    }

    window.__ROLEWISE_SITE_IDENTITY_INITIALIZED__ = true;

    const defaults = {
        brandName: "Rolewise AI",
        shortName: "Rolewise",
        email: "hello@rolewise.ai",
        address: "Stockholm, Sweden",
        website: "https://rolewise.ai"
    };

    const identityState = {
        applying: false,
        refreshQueued: false,
        observer: null
    };

    function stringValue(value, fallback) {
        if (
            typeof value === "string" &&
            value.trim() !== ""
        ) {
            return value.trim();
        }

        return fallback || "";
    }

    function escapeIdentityHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getSiteIdentity() {
        const source = config.siteIdentity || {};

        return {
            brandName: stringValue(
                source.brandName,
                defaults.brandName
            ),
            shortName: stringValue(
                source.shortName,
                defaults.shortName
            ),
            logoPrimaryText: stringValue(
                source.logoPrimaryText,
                source.shortName || defaults.shortName
            ),
            logoSecondaryText: stringValue(
                source.logoSecondaryText,
                "AI"
            ),
            email: stringValue(
                source.email,
                defaults.email
            ),
            address: stringValue(
                source.address,
                defaults.address
            ),
            website: stringValue(
                source.website,
                defaults.website
            ).replace(/\/+$/, ""),
            favicon: stringValue(
                source.favicon,
                "assets/images/favicon.svg"
            )
        };
    }

    function replaceIdentityString(value, identity) {
        if (typeof value !== "string" || value === "") {
            return value;
        }

        const brandToken =
            "__ROLEWISE_COMPLETE_BRAND_NAME__";

        let result = value;

        result = result
            .split(defaults.brandName)
            .join(brandToken);

        result = result
            .split(defaults.shortName)
            .join(identity.shortName);

        result = result
            .split(brandToken)
            .join(identity.brandName);

        const replacements = [
            [
                "mailto:" + defaults.email,
                "mailto:" + identity.email
            ],
            [
                defaults.email,
                identity.email
            ],
            [
                defaults.address,
                identity.address
            ],
            [
                defaults.website,
                identity.website
            ]
        ];

        replacements.forEach(function (replacement) {
            const currentValue = replacement[0];
            const nextValue = replacement[1];

            if (
                !currentValue ||
                !nextValue ||
                currentValue === nextValue
            ) {
                return;
            }

            result = result
                .split(currentValue)
                .join(nextValue);
        });

        return result;
    }

    function replaceConfigValue(value, identity) {
        if (typeof value === "string") {
            return replaceIdentityString(
                value,
                identity
            );
        }

        if (Array.isArray(value)) {
            return value.map(function (entry) {
                return replaceConfigValue(
                    entry,
                    identity
                );
            });
        }

        if (
            value &&
            typeof value === "object"
        ) {
            Object.keys(value).forEach(function (key) {
                value[key] = replaceConfigValue(
                    value[key],
                    identity
                );
            });
        }

        return value;
    }

    function synchronizeConfig(identity) {
        Object.keys(config).forEach(function (key) {
            if (key === "siteIdentity") {
                return;
            }

            config[key] = replaceConfigValue(
                config[key],
                identity
            );
        });

        config.brand = config.brand || {};
        config.company = config.company || {};
        config.mail = config.mail || {};

        config.brand.name = identity.brandName;
        config.brand.shortName = identity.shortName;
        config.brand.logoPrimaryText =
            identity.logoPrimaryText;
        config.brand.logoSecondaryText =
            identity.logoSecondaryText;

        config.company.legalName =
            identity.brandName;
        config.company.email =
            identity.email;
        config.company.address =
            identity.address;
        config.company.website =
            identity.website;

        config.mail.recipientEmail =
            identity.email;

        if (
            !config.mail.fromName ||
            config.mail.fromName ===
            defaults.brandName + " Website"
        ) {
            config.mail.fromName =
                identity.brandName + " Website";
        }

        if (
            !config.mail.subjectPrefix ||
            config.mail.subjectPrefix ===
            "[" + defaults.brandName + " Inquiry]"
        ) {
            config.mail.subjectPrefix =
                "[" + identity.brandName + " Inquiry]";
        }
    }

    function queryElements(root, selector) {
        const elements = [];

        if (
            root instanceof Element &&
            root.matches(selector)
        ) {
            elements.push(root);
        }

        if (
            root &&
            typeof root.querySelectorAll === "function"
        ) {
            root.querySelectorAll(selector)
                .forEach(function (element) {
                    elements.push(element);
                });
        }

        return Array.from(new Set(elements));
    }

    function setElementText(element, value) {
        if (
            !element ||
            element.textContent === value
        ) {
            return;
        }

        element.textContent = value;
    }

    function setElementAttribute(
        element,
        attribute,
        value
    ) {
        if (
            !element ||
            !value ||
            element.getAttribute(attribute) === value
        ) {
            return;
        }

        element.setAttribute(attribute, value);
    }

    function replaceTextNodes(
        root,
        identity
    ) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    const parent =
                        node.parentElement;

                    if (!parent) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (
                        parent.closest(
                            "script, style, noscript, template, textarea"
                        )
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (
                        !node.nodeValue ||
                        node.nodeValue.trim() === ""
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];

        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        nodes.forEach(function (node) {
            const nextValue =
                replaceIdentityString(
                    node.nodeValue,
                    identity
                );

            if (nextValue !== node.nodeValue) {
                node.nodeValue = nextValue;
            }
        });
    }

    function replaceElementAttributes(
        root,
        identity
    ) {
        const attributes = [
            "href",
            "src",
            "content",
            "title",
            "aria-label",
            "alt",
            "placeholder"
        ];

        queryElements(root, "*")
            .forEach(function (element) {
                attributes.forEach(function (attribute) {
                    if (
                        !element.hasAttribute(attribute)
                    ) {
                        return;
                    }

                    const currentValue =
                        element.getAttribute(attribute);

                    const nextValue =
                        replaceIdentityString(
                            currentValue,
                            identity
                        );

                    if (nextValue !== currentValue) {
                        element.setAttribute(
                            attribute,
                            nextValue
                        );
                    }
                });
            });
    }

    function updateEmailElements(
        root,
        identity
    ) {
        queryElements(
            root,
            [
                "[data-contact-email]",
                "[data-company-email]"
            ].join(",")
        ).forEach(function (element) {
            setElementText(
                element,
                identity.email
            );

            if (element.matches("a")) {
                setElementAttribute(
                    element,
                    "href",
                    "mailto:" + identity.email
                );
            }
        });

        queryElements(
            root,
            [
                "a[href^='mailto:']",
                "[data-contact-email-link]"
            ].join(",")
        ).forEach(function (element) {
            if (!element.matches("a")) {
                return;
            }

            setElementAttribute(
                element,
                "href",
                "mailto:" + identity.email
            );

            if (
                element.textContent.includes("@")
            ) {
                setElementText(
                    element,
                    identity.email
                );
            }

            const ariaLabel =
                element.getAttribute("aria-label");

            if (ariaLabel) {
                setElementAttribute(
                    element,
                    "aria-label",
                    replaceIdentityString(
                        ariaLabel,
                        identity
                    )
                );
            }
        });
    }

    function updateAddressElements(
        root,
        identity
    ) {
        queryElements(
            root,
            [
                "[data-contact-address]",
                "[data-company-address]"
            ].join(",")
        ).forEach(function (element) {
            setElementText(
                element,
                identity.address
            );
        });
    }

    function updateBrandElements(
        root,
        identity
    ) {
        queryElements(
            root,
            [
                "[data-brand-name]",
                "[data-company-name]",
                "[data-company-legal-name]"
            ].join(",")
        ).forEach(function (element) {
            setElementText(
                element,
                identity.brandName
            );
        });

        queryElements(
            root,
            "[data-logo-primary]"
        ).forEach(function (element) {
            setElementText(
                element,
                identity.logoPrimaryText
            );
        });

        queryElements(
            root,
            "[data-logo-secondary]"
        ).forEach(function (element) {
            setElementText(
                element,
                identity.logoSecondaryText
            );
        });
    }

    function updateTextLogos(
        root,
        identity
    ) {
        const logoSelectors = [
            ".site-logo",
            "[data-site-logo]",
            ".site-header__logo",
            ".site-footer__logo",
            ".mobile-navigation__logo",
            ".mobile-menu__logo"
        ].join(",");

        const links = new Set();

        queryElements(
            root,
            logoSelectors
        ).forEach(function (candidate) {
            const link = candidate.matches("a")
                ? candidate
                : candidate.closest("a") ||
                candidate.querySelector("a");

            if (link) {
                links.add(link);
            }
        });

        links.forEach(function (link) {
            let primary = link.querySelector(
                ".site-logo__primary"
            );

            let secondary = link.querySelector(
                ".site-logo__suffix"
            );

            if (!primary || !secondary) {
                link.innerHTML = [
                    '<span class="site-logo__primary">',
                    escapeIdentityHtml(
                        identity.logoPrimaryText
                    ),
                    "</span>",
                    '<span class="site-logo__suffix">',
                    escapeIdentityHtml(
                        identity.logoSecondaryText
                    ),
                    "</span>"
                ].join("");

                primary = link.querySelector(
                    ".site-logo__primary"
                );

                secondary = link.querySelector(
                    ".site-logo__suffix"
                );
            }

            setElementText(
                primary,
                identity.logoPrimaryText
            );

            setElementText(
                secondary,
                identity.logoSecondaryText
            );

            setElementAttribute(
                link,
                "href",
                "index.html"
            );

            setElementAttribute(
                link,
                "aria-label",
                identity.brandName + " home"
            );
        });
    }

    function updateFavicon(identity) {
        document.querySelectorAll(
            "link[rel~='icon']"
        ).forEach(function (link) {
            setElementAttribute(
                link,
                "href",
                identity.favicon
            );
        });
    }

    function replaceJsonValue(
        value,
        identity
    ) {
        if (typeof value === "string") {
            return replaceIdentityString(
                value,
                identity
            );
        }

        if (Array.isArray(value)) {
            return value.map(function (entry) {
                return replaceJsonValue(
                    entry,
                    identity
                );
            });
        }

        if (
            value &&
            typeof value === "object"
        ) {
            Object.keys(value).forEach(function (key) {
                value[key] = replaceJsonValue(
                    value[key],
                    identity
                );
            });
        }

        return value;
    }

    function updateJsonLd(identity) {
        document.querySelectorAll(
            'script[type="application/ld+json"]'
        ).forEach(function (script) {
            try {
                const schema = JSON.parse(
                    script.textContent
                );

                const nextSchema =
                    replaceJsonValue(
                        schema,
                        identity
                    );

                const serialized =
                    JSON.stringify(nextSchema);

                if (
                    serialized !==
                    script.textContent
                ) {
                    script.textContent =
                        serialized;
                }
            } catch (error) {
                return;
            }
        });
    }

    function updateDocumentHead(identity) {
        const nextTitle =
            replaceIdentityString(
                document.title,
                identity
            );

        if (nextTitle !== document.title) {
            document.title = nextTitle;
        }

        replaceElementAttributes(
            document.head,
            identity
        );

        updateFavicon(identity);
        updateJsonLd(identity);
    }

    function applySiteIdentity(root) {
        if (identityState.applying) {
            return;
        }

        identityState.applying = true;

        try {
            const identity =
                getSiteIdentity();

            const target =
                root &&
                    (
                        root instanceof Document ||
                        root instanceof Element ||
                        root instanceof DocumentFragment
                    )
                    ? root
                    : document;

            replaceTextNodes(
                target,
                identity
            );

            replaceElementAttributes(
                target,
                identity
            );

            updateBrandElements(
                target,
                identity
            );

            updateEmailElements(
                target,
                identity
            );

            updateAddressElements(
                target,
                identity
            );

            updateTextLogos(
                target,
                identity
            );

            updateDocumentHead(identity);
        } finally {
            identityState.applying = false;
        }
    }

    function scheduleIdentityRefresh() {
        if (identityState.refreshQueued) {
            return;
        }

        identityState.refreshQueued = true;

        window.requestAnimationFrame(function () {
            identityState.refreshQueued = false;
            applySiteIdentity(document);
        });
    }

    function patchRolewiseRefresh() {
        window.Rolewise =
            window.Rolewise || {};

        const Rolewise =
            window.Rolewise;

        if (
            Rolewise.__siteIdentityPatched
        ) {
            return;
        }

        Rolewise.__siteIdentityPatched = true;

        const originalRefresh =
            Rolewise.refreshGlobalUI;

        if (
            typeof originalRefresh ===
            "function"
        ) {
            Rolewise.refreshGlobalUI =
                function () {
                    const result =
                        originalRefresh.apply(
                            this,
                            arguments
                        );

                    applySiteIdentity(
                        arguments[0] || document
                    );

                    return result;
                };
        }

        Rolewise.applySiteIdentity =
            applySiteIdentity;

        Rolewise.getSiteIdentity =
            getSiteIdentity;
    }

    function initializeIdentityObserver() {
        if (
            identityState.observer ||
            !document.documentElement
        ) {
            return;
        }

        identityState.observer =
            new MutationObserver(
                function (mutations) {
                    const addedContent =
                        mutations.some(
                            function (mutation) {
                                return (
                                    mutation.addedNodes.length >
                                    0
                                );
                            }
                        );

                    if (addedContent) {
                        scheduleIdentityRefresh();
                    }
                }
            );

        identityState.observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );
    }

    function initializeSiteIdentity() {
        patchRolewiseRefresh();
        applySiteIdentity(document);
    

        window.setTimeout(
            scheduleIdentityRefresh,
            100
        );

        window.setTimeout(
            scheduleIdentityRefresh,
            500
        );
    }

    const identity = getSiteIdentity();

    synchronizeConfig(identity);
    patchRolewiseRefresh();

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeSiteIdentity,
            {
                once: true
            }
        );
    } else {
        initializeSiteIdentity();
    }

    window.addEventListener(
        "load",
        scheduleIdentityRefresh,
        {
            once: true
        }
    );
}());
