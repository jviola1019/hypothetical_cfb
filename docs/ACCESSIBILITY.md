# Accessibility status

Implemented: semantic headings/navigation labels, programmatic input labels, keyboard-operable native selects/buttons, visible focus outlines, descriptive text alternative on charts, SVG titles, reduced-motion CSS, horizontal bracket scroll containers with `tabindex=0`, conditional accessible text for empty states. Small screens use a stacked layout rather than desktop-width shrinking.

Unverified: WCAG 2.2 AA full audit, screen-reader experience, touch target sizing under all device text zoom levels, Firefox/WebKit rendering, automated axe scans and voice-control operation. Playwright DOM smoke tests covered 390 px and desktop Chromium layout only, and used a Worker stub due browser navigation restrictions.
