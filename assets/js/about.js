(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const aboutState = {
        activePurpose: "purpose",
        activeStatement: 0,
        statementCount: 0
    };

    function activatePurposeTab(value, moveFocus) {
        const root = document.querySelector("[data-about-purpose-tabs]");

        if (!root) {
            return;
        }

        const buttons = Array.from(
            root.querySelectorAll("[data-about-purpose-tab]")
        );

        const panels = Array.from(
            root.querySelectorAll("[data-about-purpose-panel]")
        );

        const activeButton = buttons.find(function (button) {
            return button.dataset.aboutPurposeTab === value;
        });

        if (!activeButton) {
            return;
        }

        aboutState.activePurpose = value;

        buttons.forEach(function (button) {
            const active =
                button.dataset.aboutPurposeTab === value;

            button.setAttribute(
                "aria-selected",
                String(active)
            );

            button.setAttribute(
                "tabindex",
                active ? "0" : "-1"
            );
        });

        panels.forEach(function (panel) {
            const active =
                panel.dataset.aboutPurposePanel === value;

            panel.hidden = !active;
            panel.setAttribute(
                "aria-hidden",
                String(!active)
            );
        });

        if (moveFocus) {
            activeButton.focus();
        }

        Rolewise.refreshAOS();
    }

    function focusPurposeTab(buttons, currentIndex, direction) {
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

        const nextButton = buttons[nextIndex];

        activatePurposeTab(
            nextButton.dataset.aboutPurposeTab,
            true
        );
    }

    function initPurposeTabs() {
        const root = document.querySelector("[data-about-purpose-tabs]");

        if (!root || root.dataset.initialized) {
            return;
        }

        root.dataset.initialized = "true";

        const buttons = Array.from(
            root.querySelectorAll("[data-about-purpose-tab]")
        );

        if (!buttons.length) {
            return;
        }

        buttons.forEach(function (button, index) {
            button.addEventListener("click", function () {
                activatePurposeTab(
                    button.dataset.aboutPurposeTab,
                    false
                );
            });

            button.addEventListener("keydown", function (event) {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    focusPurposeTab(buttons, index, 1);
                }

                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    focusPurposeTab(buttons, index, -1);
                }

                if (event.key === "Home") {
                    event.preventDefault();

                    activatePurposeTab(
                        buttons[0].dataset.aboutPurposeTab,
                        true
                    );
                }

                if (event.key === "End") {
                    event.preventDefault();

                    activatePurposeTab(
                        buttons[buttons.length - 1].dataset.aboutPurposeTab,
                        true
                    );
                }
            });
        });

        const selectedButton = buttons.find(function (button) {
            return button.getAttribute("aria-selected") === "true";
        });

        activatePurposeTab(
            selectedButton
                ? selectedButton.dataset.aboutPurposeTab
                : buttons[0].dataset.aboutPurposeTab,
            false
        );
    }

    function updateStatementCounter(root) {
        const counter = root.querySelector("[data-about-needs-counter]");

        if (!counter) {
            return;
        }

        counter.textContent =
            "Statement " +
            String(aboutState.activeStatement + 1) +
            " of " +
            String(aboutState.statementCount);
    }

    function showStatement(index, announce) {
        const root = document.querySelector("[data-about-needs-slider]");

        if (!root) {
            return;
        }

        const statements = Array.from(
            root.querySelectorAll("[data-about-needs-statement]")
        );

        if (!statements.length) {
            return;
        }

        let nextIndex = index;

        if (nextIndex < 0) {
            nextIndex = statements.length - 1;
        }

        if (nextIndex >= statements.length) {
            nextIndex = 0;
        }

        aboutState.activeStatement = nextIndex;
        aboutState.statementCount = statements.length;

        statements.forEach(function (statement, statementIndex) {
            const active = statementIndex === nextIndex;

            statement.classList.toggle(
                "is-active",
                active
            );

            statement.hidden = !active;

            statement.setAttribute(
                "aria-hidden",
                String(!active)
            );
        });

        updateStatementCounter(root);

        if (announce) {
            const liveRegion = root.querySelector(
                "[data-about-needs-live]"
            );

            const activeStatement = statements[nextIndex];

            if (liveRegion && activeStatement) {
                liveRegion.textContent =
                    activeStatement.textContent.trim();
            }
        }

        Rolewise.refreshAOS();
    }

    function initNeedsSlider() {
        const root = document.querySelector("[data-about-needs-slider]");

        if (!root || root.dataset.initialized) {
            return;
        }

        root.dataset.initialized = "true";

        const statements = Array.from(
            root.querySelectorAll("[data-about-needs-statement]")
        );

        const previousButton = root.querySelector(
            "[data-about-needs-prev]"
        );

        const nextButton = root.querySelector(
            "[data-about-needs-next]"
        );

        if (!statements.length) {
            return;
        }

        aboutState.statementCount = statements.length;

        const activeIndex = statements.findIndex(function (statement) {
            return statement.classList.contains("is-active");
        });

        showStatement(
            activeIndex >= 0 ? activeIndex : 0,
            false
        );

        if (previousButton) {
            previousButton.addEventListener("click", function () {
                showStatement(
                    aboutState.activeStatement - 1,
                    true
                );
            });
        }

        if (nextButton) {
            nextButton.addEventListener("click", function () {
                showStatement(
                    aboutState.activeStatement + 1,
                    true
                );
            });
        }

        root.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft") {
                event.preventDefault();

                showStatement(
                    aboutState.activeStatement - 1,
                    true
                );
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();

                showStatement(
                    aboutState.activeStatement + 1,
                    true
                );
            }

            if (event.key === "Home") {
                event.preventDefault();
                showStatement(0, true);
            }

            if (event.key === "End") {
                event.preventDefault();

                showStatement(
                    aboutState.statementCount - 1,
                    true
                );
            }
        });

        let touchStartX = 0;
        let touchEndX = 0;

        root.addEventListener(
            "touchstart",
            function (event) {
                if (!event.changedTouches.length) {
                    return;
                }

                touchStartX =
                    event.changedTouches[0].clientX;
            },
            {
                passive: true
            }
        );

        root.addEventListener(
            "touchend",
            function (event) {
                if (!event.changedTouches.length) {
                    return;
                }

                touchEndX =
                    event.changedTouches[0].clientX;

                const distance =
                    touchEndX - touchStartX;

                if (Math.abs(distance) < 54) {
                    return;
                }

                if (distance > 0) {
                    showStatement(
                        aboutState.activeStatement - 1,
                        true
                    );
                } else {
                    showStatement(
                        aboutState.activeStatement + 1,
                        true
                    );
                }
            },
            {
                passive: true
            }
        );
    }

    function renderProfessionLinks() {
        const container = document.querySelector(
            "[data-about-profession-links]"
        );

        if (!container) {
            return;
        }

        container.innerHTML = config.professions.map(function (profession) {
            return [
                '<a class="about-explore__link" href="',
                Rolewise.escapeHtml(profession.page),
                '">',
                "<span>",
                Rolewise.escapeHtml(profession.title),
                "</span>",
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function initCircularRing() {
        const ring = document.querySelector("[data-about-rotating-ring]");

        if (!ring) {
            return;
        }

        if (Rolewise.state.reducedMotion) {
            ring.style.animation = "none";
        }
    }

    function initializeAbout() {
        if (!document.body.classList.contains("about-page")) {
            return;
        }

        initPurposeTabs();
        initNeedsSlider();
        renderProfessionLinks();
        initCircularRing();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAbout,
            {
                once: true
            }
        );
    } else {
        initializeAbout();
    }
}());