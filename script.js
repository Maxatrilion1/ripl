/*
 * Form handling for the waitlist sign‑up.
 *
 * After submission, each sign‑up card is replaced with a simple
 * completion message. In a real deployment you would instead send
 * the data to your backend or mailing service.
 */

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.waitlist-form');

  // URL of your deployed Google Apps Script. This web app receives sign‑up
  // submissions and writes them to your Google Sheet. If you leave this
  // empty, no request will be sent. When you deploy your own script as a
  // web app, copy its URL and paste it here.
  const SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKePVzjZHy-IugjWWGXOiWVDXjDoyFNUOoG47F7SvyNoEXDJ0q8WZl2fQi5eqDa8cQ/exec';

  forms.forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();

      // Extract business name and email from the inputs
      const businessField = form.querySelector('input[name="business"]');
      const emailField = form.querySelector('input[name="email"]');
      const businessName = businessField ? businessField.value.trim() : '';
      const emailAddress = emailField ? emailField.value.trim() : '';

      // If a script URL is provided, send the data to Google Sheets
      if (SHEET_SCRIPT_URL) {
        try {
          fetch(SHEET_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ businessName, emailAddress }),
          });
        } catch (e) {
          // Swallow any errors silently since CORS responses are opaque
          console.error('Failed to send data to Google Sheets', e);
        }
      }

      // Show completion message and hide the form
      const card = form.closest('.signup-card');
      if (card) {
        card.innerHTML = '<p class="completed-message">You\'re on the waitlist! 🎉</p>';
      }
    });
  });
});