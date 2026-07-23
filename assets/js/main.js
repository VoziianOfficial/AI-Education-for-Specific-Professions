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
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        aosInitialized: false,
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

        if (/^(https?:|mailto:|tel:)/i.test(href)) {
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

    function initAOS() {
        if (state.aosInitialized) {
            return;
        }

        if (
            !window.AOS ||
            typeof window.AOS.init !== "function"
        ) {
            documentElement.classList.add(
                "aos-fallback"
            );
            return;
        }

        window.AOS.init({
            duration: state.reducedMotion ? 0 : 780,
            easing: "ease-out-cubic",
            once: true,
            offset: 72,
            delay: 0,
            anchorPlacement: "top-bottom",
            disable: state.reducedMotion
        });

        state.aosInitialized = true;

        documentElement.classList.add(
            "aos-ready"
        );

        documentElement.classList.remove(
            "aos-fallback"
        );
    }

    function refreshAOS() {
        if (
            window.AOS &&
            typeof window.AOS.refreshHard === "function"
        ) {
            window.AOS.refreshHard();
        } else if (
            window.AOS &&
            typeof window.AOS.refresh === "function"
        ) {
            window.AOS.refresh();
        }
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
        }

        update(media);

        if (
            typeof media.addEventListener === "function"
        ) {
            media.addEventListener(
                "change",
                update
            );
        } else if (
            typeof media.addListener === "function"
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

        window.setTimeout(function () {
            refreshSchemas();
            refreshAOS();
        }, 0);
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
        initAOS();

        window.setTimeout(function () {
            refreshSchemas();
            refreshAOS();
        }, 0);
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
