(function () {
    "use strict";

    const Rolewise = window.Rolewise;
    const config = window.ROLEWISE_CONFIG;

    if (!Rolewise || !config) {
        return;
    }

    const escapeHtml = Rolewise.escapeHtml;

    const contactState = {
        submitting: false,
        resetTimer: null
    };

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

    function normalizeValue(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function getContactCategories() {
        return getArray(
            config,
            [
                "contact.categories",
                "contactCategories",
                "forms.contact.categories"
            ]
        );
    }

    function getCategoryValue(category, index) {
        if (typeof category === "string") {
            return normalizeValue(category);
        }

        return getText(
            category,
            [
                "value",
                "slug",
                "id"
            ],
            "inquiry-" + String(index + 1)
        );
    }

    function getCategoryTitle(category) {
        if (typeof category === "string") {
            return category;
        }

        return getText(
            category,
            [
                "title",
                "name",
                "label"
            ],
            "General Inquiry"
        );
    }

    function getCategoryDescription(category) {
        if (typeof category === "string") {
            return "Share the context and information relevant to your inquiry.";
        }

        return getText(
            category,
            [
                "description",
                "text",
                "summary"
            ],
            "Share the context and information relevant to your inquiry."
        );
    }

    function getCategoryIcon(category) {
        if (!category || typeof category === "string") {
            return "message-square";
        }

        return getText(
            category,
            [
                "icon"
            ],
            "message-square"
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

    function applyContactInformation() {
        const email = getText(
            config,
            [
                "mail.recipientEmail",
                "company.email",
                "contact.email"
            ],
            ""
        );

        const phone = getText(
            config,
            [
                "company.phone",
                "contact.phone"
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

        document.querySelectorAll("[data-contact-email]").forEach(function (element) {
            element.textContent = email;

            if (element.tagName === "A") {
                element.href = "mailto:" + email;
            }
        });

        document.querySelectorAll("[data-contact-phone]").forEach(function (element) {
            element.textContent = phone;

            if (element.tagName === "A") {
                element.href = "tel:" + phone.replace(/[^\d+]/g, "");
            }
        });

        setText("[data-contact-address]", address);

        const responseNote = getText(
            config,
            [
                "forms.contact.responseNote",
                "contact.responseNote"
            ],
            ""
        );

        setText("[data-contact-response-note]", responseNote);
    }

    function renderCategories() {
        const container = document.querySelector(
            "[data-contact-categories]"
        );

        if (!container) {
            return;
        }

        const categories = getContactCategories();

        container.innerHTML = categories.map(function (category, index) {
            const value = getCategoryValue(category, index);
            const title = getCategoryTitle(category);
            const description = getCategoryDescription(category);
            const icon = getCategoryIcon(category);

            return [
                '<article class="contact-category-card" data-aos="fade-up" data-aos-delay="',
                String(Math.min(index * 50, 150)),
                '">',
                '<div class="contact-category-card__top">',
                '<i class="contact-category-card__icon" data-lucide="',
                escapeHtml(icon),
                '" aria-hidden="true"></i>',
                '<span class="contact-category-card__number">',
                String(index + 1).padStart(2, "0"),
                "</span>",
                "</div>",
                '<div class="contact-category-card__content">',
                '<h3 class="contact-category-card__title">',
                escapeHtml(title),
                "</h3>",
                '<p class="contact-category-card__text">',
                escapeHtml(description),
                "</p>",
                '<a class="contact-category-card__link" href="#contact-form" data-contact-category-value="',
                escapeHtml(value),
                '">',
                "Select this inquiry",
                '<i data-lucide="arrow-right" aria-hidden="true"></i>',
                "</a>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");

        Rolewise.refreshIcons();
    }

    function populateInquirySelect() {
        const select = document.querySelector(
            "[data-contact-inquiry]"
        );

        if (!select) {
            return;
        }

        const categories = getContactCategories();
        const currentValue = select.value;

        select.innerHTML = [
            '<option value="">Select an inquiry type</option>',
            categories.map(function (category, index) {
                const value = getCategoryValue(category, index);
                const title = getCategoryTitle(category);

                return [
                    '<option value="',
                    escapeHtml(value),
                    '">',
                    escapeHtml(title),
                    "</option>"
                ].join("");
            }).join("")
        ].join("");

        if (
            currentValue &&
            Array.from(select.options).some(function (option) {
                return option.value === currentValue;
            })
        ) {
            select.value = currentValue;
        }
    }

    function findInquiryValue(requestedValue) {
        const normalizedRequested = normalizeValue(requestedValue);
        const categories = getContactCategories();

        if (!normalizedRequested) {
            return "";
        }

        const directMatch = categories.find(function (category, index) {
            const value = getCategoryValue(category, index);
            const title = getCategoryTitle(category);

            return (
                normalizeValue(value) === normalizedRequested ||
                normalizeValue(title) === normalizedRequested
            );
        });

        if (directMatch) {
            return getCategoryValue(
                directMatch,
                categories.indexOf(directMatch)
            );
        }

        const partialMatch = categories.find(function (category, index) {
            const value = normalizeValue(
                getCategoryValue(category, index)
            );

            const title = normalizeValue(
                getCategoryTitle(category)
            );

            return (
                value.includes(normalizedRequested) ||
                normalizedRequested.includes(value) ||
                title.includes(normalizedRequested) ||
                normalizedRequested.includes(title)
            );
        });

        if (partialMatch) {
            return getCategoryValue(
                partialMatch,
                categories.indexOf(partialMatch)
            );
        }

        return "";
    }

    function selectInquiry(value, scrollToForm) {
        const select = document.querySelector(
            "[data-contact-inquiry]"
        );

        if (!select) {
            return;
        }

        const matchedValue = findInquiryValue(value);

        if (!matchedValue) {
            return;
        }

        select.value = matchedValue;
        select.dispatchEvent(
            new Event("change", {
                "bubbles": true
            })
        );

        clearFieldError(select);

        if (scrollToForm) {
            const formSection = document.getElementById(
                "contact-form"
            );

            if (formSection) {
                formSection.scrollIntoView({
                    "behavior": Rolewise.state.reducedMotion
                        ? "auto"
                        : "smooth",
                    "block": "start"
                });
            }

            window.setTimeout(function () {
                select.focus({
                    "preventScroll": true
                });
            }, Rolewise.state.reducedMotion ? 0 : 550);
        }
    }

    function applyQueryParameters() {
        const params = new URLSearchParams(
            window.location.search
        );

        const requestedInquiry =
            params.get("inquiry") ||
            params.get("category") ||
            params.get("service") ||
            "";

        const profession =
            params.get("profession") ||
            params.get("role") ||
            "";

        const message = params.get("message") || "";

        if (requestedInquiry) {
            selectInquiry(requestedInquiry, false);
        }

        const messageField = document.querySelector(
            '[name="message"]'
        );

        if (messageField && message) {
            messageField.value = message.slice(0, 5000);
        }

        if (
            messageField &&
            profession &&
            !messageField.value.trim()
        ) {
            messageField.value =
                "I would like information about practical AI learning for " +
                profession +
                ".";
        }
    }

    function bindCategoryLinks() {
        document.addEventListener("click", function (event) {
            const link = event.target.closest(
                "[data-contact-category-value]"
            );

            if (!link) {
                return;
            }

            event.preventDefault();

            selectInquiry(
                link.dataset.contactCategoryValue,
                true
            );
        });
    }

    function getFieldErrorElement(field) {
        if (!field || !field.name) {
            return null;
        }

        return document.querySelector(
            '[data-form-error-for="' +
            CSS.escape(field.name) +
            '"]'
        );
    }

    function setFieldError(field, message) {
        if (!field) {
            return;
        }

        field.setAttribute("aria-invalid", "true");

        const error = getFieldErrorElement(field);

        if (error) {
            error.textContent = message;
        }
    }

    function clearFieldError(field) {
        if (!field) {
            return;
        }

        field.removeAttribute("aria-invalid");

        const error = getFieldErrorElement(field);

        if (error) {
            error.textContent = "";
        }
    }

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
            value
        );
    }

    function validatePhone(value) {
        if (!value) {
            return true;
        }

        return /^[+()\d\s.-]{6,30}$/.test(value);
    }

    function validateField(field) {
        if (!field || !field.name) {
            return true;
        }

        const value = field.type === "checkbox"
            ? field.checked
            : field.value.trim();

        clearFieldError(field);

        if (field.name === "fullName") {
            if (!value) {
                setFieldError(
                    field,
                    "Please enter your full name."
                );
                return false;
            }

            if (value.length < 2) {
                setFieldError(
                    field,
                    "Please enter at least 2 characters."
                );
                return false;
            }
        }

        if (field.name === "email") {
            if (!value) {
                setFieldError(
                    field,
                    "Please enter your email address."
                );
                return false;
            }

            if (!validateEmail(value)) {
                setFieldError(
                    field,
                    "Please enter a valid email address."
                );
                return false;
            }
        }

        if (
            field.name === "phone" &&
            !validatePhone(value)
        ) {
            setFieldError(
                field,
                "Please enter a valid phone number."
            );
            return false;
        }

        if (
            field.name === "inquiryType" &&
            !value
        ) {
            setFieldError(
                field,
                "Please select an inquiry type."
            );
            return false;
        }

        if (field.name === "message") {
            if (!value) {
                setFieldError(
                    field,
                    "Please describe your inquiry."
                );
                return false;
            }

            if (value.length < 20) {
                setFieldError(
                    field,
                    "Please provide at least 20 characters."
                );
                return false;
            }

            if (value.length > 5000) {
                setFieldError(
                    field,
                    "Please keep your message under 5,000 characters."
                );
                return false;
            }
        }

        if (
            field.name === "privacyConsent" &&
            field.checked !== true
        ) {
            setFieldError(
                field,
                "Please confirm that you have read the privacy notice."
            );
            return false;
        }

        return true;
    }

    function validateForm(form) {
        const fieldNames = [
            "fullName",
            "email",
            "phone",
            "inquiryType",
            "message",
            "privacyConsent"
        ];

        let valid = true;
        let firstInvalidField = null;

        fieldNames.forEach(function (name) {
            const field = form.elements[name];

            if (
                field &&
                !validateField(field)
            ) {
                valid = false;

                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        if (firstInvalidField) {
            firstInvalidField.focus();
        }

        return valid;
    }

    function bindLiveValidation(form) {
        Array.from(form.elements).forEach(function (field) {
            if (
                !field.name ||
                field.name === "company" ||
                field.name === "sourcePage"
            ) {
                return;
            }

            const eventName =
                field.type === "checkbox" ||
                    field.tagName === "SELECT"
                    ? "change"
                    : "input";

            field.addEventListener(eventName, function () {
                if (field.hasAttribute("aria-invalid")) {
                    validateField(field);
                }
            });

            field.addEventListener("blur", function () {
                if (
                    field.value ||
                    field.type === "checkbox"
                ) {
                    validateField(field);
                }
            });
        });
    }

    function setFormLoading(form, loading) {
        const submit = form.querySelector(
            "[data-contact-submit]"
        );

        contactState.submitting = loading;

        if (!submit) {
            return;
        }

        submit.disabled = loading;
        submit.classList.toggle("is-loading", loading);
        submit.setAttribute(
            "aria-busy",
            String(loading)
        );
    }

    function showFormStatus(form, type, message) {
        const status = form.querySelector(
            "[data-contact-status]"
        );

        if (!status) {
            return;
        }

        status.classList.remove(
            "is-visible",
            "contact-form__status--success",
            "contact-form__status--error"
        );

        status.classList.add(
            "is-visible",
            type === "success"
                ? "contact-form__status--success"
                : "contact-form__status--error"
        );

        const iconName = type === "success"
            ? "circle-check"
            : "circle-alert";

        status.innerHTML = [
            '<i data-lucide="',
            iconName,
            '" aria-hidden="true"></i>',
            "<span>",
            escapeHtml(message),
            "</span>"
        ].join("");

        status.setAttribute(
            "role",
            type === "success" ? "status" : "alert"
        );

        Rolewise.refreshIcons();

        if (contactState.resetTimer) {
            window.clearTimeout(
                contactState.resetTimer
            );
        }

        if (type === "success") {
            contactState.resetTimer = window.setTimeout(function () {
                status.classList.remove("is-visible");
            }, 12000);
        }
    }

    async function parseResponse(response) {
        const contentType =
            response.headers.get("content-type") || "";

        if (
            contentType.includes("application/json")
        ) {
            return response.json();
        }

        const text = await response.text();

        return {
            "success": response.ok,
            "message": text
        };
    }

    async function submitForm(form) {
        if (contactState.submitting) {
            return;
        }

        const status = form.querySelector(
            "[data-contact-status]"
        );

        if (status) {
            status.classList.remove("is-visible");
        }

        if (!validateForm(form)) {
            showFormStatus(
                form,
                "error",
                "Please review the highlighted fields and try again."
            );
            return;
        }

        const sourcePage = form.elements.sourcePage;

        if (sourcePage) {
            sourcePage.value =
                window.location.pathname +
                window.location.search;
        }

        const formData = new FormData(form);
        const action =
            form.getAttribute("action") ||
            "contact.php";

        setFormLoading(form, true);

        try {
            const response = await fetch(action, {
                "method": "POST",
                "body": formData,
                "headers": {
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },
                "credentials": "same-origin"
            });

            const result = await parseResponse(response);

            if (
                !response.ok ||
                result.success !== true
            ) {
                throw new Error(
                    result.message ||
                    "Your inquiry could not be submitted."
                );
            }

            const successMessage =
                result.message ||
                getText(
                    config,
                    [
                        "forms.contact.successMessage",
                        "ui.messages.formSuccess"
                    ],
                    "Thank you. Your inquiry has been submitted."
                );

            showFormStatus(
                form,
                "success",
                successMessage
            );

            const selectedInquiry =
                form.elements.inquiryType
                    ? form.elements.inquiryType.value
                    : "";

            form.reset();

            if (
                form.elements.inquiryType &&
                selectedInquiry
            ) {
                form.elements.inquiryType.value =
                    selectedInquiry;
            }

            Array.from(form.elements).forEach(function (field) {
                clearFieldError(field);
            });

            const statusElement = form.querySelector(
                "[data-contact-status]"
            );

            if (statusElement) {
                statusElement.focus({
                    "preventScroll": true
                });
            }
        } catch (error) {
            const errorMessage =
                error && error.message
                    ? error.message
                    : getText(
                        config,
                        [
                            "forms.contact.errorMessage",
                            "ui.messages.formError"
                        ],
                        "Something went wrong. Please try again later."
                    );

            showFormStatus(
                form,
                "error",
                errorMessage
            );
        } finally {
            setFormLoading(form, false);
        }
    }

    function initializeForm() {
        const form = document.querySelector(
            "[data-contact-form]"
        );

        if (!form) {
            return;
        }

        const endpoint = getText(
            config,
            [
                "forms.contact.endpoint",
                "forms.contact.action"
            ],
            "contact.php"
        );

        form.action = endpoint;
        form.method = "post";
        form.noValidate = true;

        const sourcePage = form.elements.sourcePage;

        if (sourcePage) {
            sourcePage.value =
                window.location.pathname +
                window.location.search;
        }

        bindLiveValidation(form);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitForm(form);
        });
    }

    function initializeContact() {
        if (!document.body.classList.contains("contact-page")) {
            return;
        }

        applyContactInformation();
        renderCategories();
        populateInquirySelect();
        bindCategoryLinks();
        initializeForm();
        applyQueryParameters();
        Rolewise.refreshGlobalUI(document);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeContact,
            {
                "once": true
            }
        );
    } else {
        initializeContact();
    }
}());