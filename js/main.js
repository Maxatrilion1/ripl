/*
 * main.js
 *
 * Shared client‑side behaviour for the Ripl marketing site.  Handles
 * form submission (waitlist and investor deck), client‑side
 * validation, sending sign‑up data to the provided Google Apps
 * Script endpoint, simple analytics and the bespoke typewriter
 * animation on the investor page.  All network calls use `no‑cors`
 * mode since the Apps Script does not return CORS headers.  Errors
 * are swallowed silently.
 */

(function () {
  // Endpoint for Google Apps Script. Use the provided URL from the
  // specification. If you change this, ensure that the new script
  // accepts JSON payloads and appends data to the appropriate sheet.
  const SHEET_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwE0i1P-nsd_oaIaNUveIwXbA-wgrA06zo3LWYUkJEel3AahEiWOjFMfnHiWJAON_ej/exec';

  /**
   * Send sign‑up data to the Google Apps Script.  Payload keys
   * correspond to column headers in your Google Sheet.  The function
   * silently catches errors because `no‑cors` requests return
   * opaque responses.
   *
   * @param {Object} payload JSON payload to send
   */
  function sendToSheet(payload) {
    if (!SHEET_SCRIPT_URL) return;
    try {
      fetch(SHEET_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Network errors are ignored – the script cannot return CORS
      // responses and will always appear as opaque.  See console
      // for diagnostics during development.
      console.error('Failed to send data', err);
    }
  }

  /**
   * Basic analytics tracker.  Writes analytic events to the Google
   * Sheet by sending a payload with source set to "analytics" and
   * including the event type, page and other arbitrary details.
   *
   * @param {string} eventType Type of event (e.g., 'page_view', 'form_submit')
   * @param {Object} details Additional key/value pairs to store
   */
  function trackEvent(eventType, details = {}) {
    const payload = {
      source: 'analytics',
      eventType,
      timestamp: new Date().toISOString(),
      ...details,
    };
    sendToSheet(payload);
  }

  /**
   * Checks if an email belongs to a personal email domain.  We treat
   * addresses from common webmail providers as invalid for business
   * sign‑ups.  The check is case‑insensitive and matches the domain
   * portion of the address.
   *
   * @param {string} email Email address to validate
   * @returns {boolean} True if the email appears to be personal
   */
  function isPersonalEmail(email) {
    if (!email) return true;
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'icloud.com',
      'aol.com',
      'protonmail.com',
      'gmx.com',
      'yandex.com',
    ];
    const domain = email.split('@')[1]?.toLowerCase() || '';
    return personalDomains.includes(domain);
  }

  /**
   * Handle form submission for both venue and investor forms.  Performs
   * client‑side validation, sends data to Apps Script, posts
   * analytics and updates the UI to a completion state.
   *
   * @param {HTMLFormElement} form The form element to process
   */
  function handleFormSubmission(form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const statusEl = form.querySelector('.form-status');
      if (statusEl) statusEl.textContent = '';

      // Honeypot check – bots might fill this field
      const honeypot = form.querySelector('.honeypot input');
      if (honeypot && honeypot.value) {
        // Silently abort if the honeypot is filled
        return;
      }

      // Gather form data
      const formData = new FormData(form);
      const source = form.dataset.source;
      const payload = { source };

      // Validate required fields and build payload
      let hasError = false;
      form.querySelectorAll('input, select').forEach((input) => {
        if (input.name === 'website') {
          return;
        }
        const value = input.value.trim();
        payload[input.name] = value;
        if (input.hasAttribute('required') && !value) {
          hasError = true;
        }
      });

      // Basic email validation: ensure an @ and domain are present
      const email = payload.emailAddress;
      if (email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          hasError = true;
          if (statusEl) {
            statusEl.textContent = 'Please enter a valid email address.';
          }
        } else if (isPersonalEmail(email)) {
          // Disallow personal webmail domains for sign‑ups
          hasError = true;
          if (statusEl) {
            statusEl.textContent = 'Please use a business email (no personal domains).';
          }
        }
      }

      if (hasError) {
        if (statusEl && !statusEl.textContent) {
          statusEl.textContent = 'Please complete all required fields.';
        }
        return;
      }

      // Send data to Google Apps Script
      sendToSheet(payload);

      // Record analytics event
      const pageName = window.location.pathname.endsWith('investors.html')
        ? 'investor'
        : 'venue';
      trackEvent('form_submit', { page: pageName, source, emailAddress: email });

      // Replace form with a completion message
      const completionMessage =
        source === 'investor'
          ? "Thanks! We'll send you the deck soon! 🎉"
          : "You’re on the waitlist! 🎉";
      form.innerHTML = `<p class="completed-message">${completionMessage}</p>`;
    });
  }

  /**
   * Initialise typewriter animation for investor page.  Cycles through
   * an array of nouns, typing and deleting each at specified speeds.
   * The cycle always ends on “cafés”.
   *
   * @param {HTMLElement} targetEl Element where the typed text will appear
   */
  function initTypewriter(targetEl) {
    const nouns = ['cafés', 'gyms', 'coworking spaces'];
    let index = 0;
    let charIndex = 0;
    let deleting = false;

    function type() {
      const currentWord = nouns[index];
      // When not deleting, add one character
      if (!deleting) {
        targetEl.textContent = currentWord.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentWord.length) {
          // Pause at full word
          setTimeout(() => {
            deleting = true;
            type();
          }, 1200);
          return;
        }
      } else {
        // Deleting state
        targetEl.textContent = currentWord.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          index++;
          // After last word, reset index to 0 so the loop always
          // ends on cafés.
          if (index >= nouns.length) {
            index = 0;
          }
        }
      }
      const delay = deleting ? 45 : 70;
      setTimeout(type, delay);
    }
    type();
  }

  /**
   * Mark the current nav item as active based on the current page.
   */
  function highlightActiveNav() {
    const path = window.location.pathname;
    if (path.endsWith('investors.html')) {
      const link = document.getElementById('venueNav');
      if (link) link.classList.add('active');
    } else {
      const link = document.getElementById('investorNav');
      if (link) link.classList.add('active');
    }
  }

  // Initialise all behaviours once the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Highlight active navigation link
    highlightActiveNav();

    // Register forms
    document.querySelectorAll('form[data-source]').forEach((form) => {
      handleFormSubmission(form);
    });

    // Initialise typewriter if target exists
    const typedTarget = document.getElementById('typed-target');
    if (typedTarget) {
      initTypewriter(typedTarget);
    }

    // Send page view analytic
    const pageName = window.location.pathname.endsWith('investors.html')
      ? 'investor'
      : 'venue';
    trackEvent('page_view', { page: pageName });
  });
})();