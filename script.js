// URL for Google Apps Script to handle submissions. Replace with your own endpoint.
const SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwE0i1P-nsd_oaIaNUveIwXbA-wgrA06zo3LWYUkJEel3AahEiWOjFMfnHiWJAON_ej/exec';

document.addEventListener('DOMContentLoaded', () => {
  // Elements for toggling views
  const venueView = document.getElementById('venueView');
  const investorView = document.getElementById('investorView');
  const investorToggle = document.getElementById('investorToggle');
  const investBtn = document.getElementById('investBtn');
  const backBtn = document.getElementById('backBtn');

  // Show investor view
  function showInvestor() {
    venueView.classList.add('hidden');
    investorView.classList.remove('hidden');
  }
  // Show venue view
  function showVenue() {
    investorView.classList.add('hidden');
    venueView.classList.remove('hidden');
  }
  // Attach click handlers
  if (investorToggle) investorToggle.addEventListener('click', showInvestor);
  if (investBtn) investBtn.addEventListener('click', showInvestor);
  if (backBtn) backBtn.addEventListener('click', showVenue);

  // Typed effect for investor subheadline
  const typedElem = document.getElementById('typed-keyword');
  const keywords = ['cafés', 'gyms', 'coworking spaces', 'hostels'];
  let keywordIndex = 0;
  let charIndex = 0;
  let isTyping = true;

  function typeEffect() {
    const currentWord = keywords[keywordIndex];
    if (isTyping) {
      // Add characters one by one
      if (charIndex < currentWord.length) {
        typedElem.textContent += currentWord.charAt(charIndex);
        charIndex++;
        setTimeout(typeEffect, 120);
      } else {
        // Pause at full word
        isTyping = false;
        setTimeout(typeEffect, 1200);
      }
    } else {
      // Delete characters one by one
      if (charIndex > 0) {
        typedElem.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        setTimeout(typeEffect, 60);
      } else {
        // Move to next word
        isTyping = true;
        keywordIndex = (keywordIndex + 1) % keywords.length;
        setTimeout(typeEffect, 300);
      }
    }
  }
  // Start the typing loop
  if (typedElem) typeEffect();

  // Handle venue form submissions (both forms)
  function attachVenueFormHandler(formId, successId) {
    const form = document.getElementById(formId);
    const successMessage = document.getElementById(successId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const businessNameInput = form.querySelector('input[name="businessName"]');
      const emailInput = form.querySelector('input[name="emailAddress"]');
      const businessName = businessNameInput ? businessNameInput.value : '';
      const emailAddress = emailInput ? emailInput.value : '';
      // Send data to Google Apps Script if URL is defined
      const payload = {
        businessName: businessName,
        emailAddress: emailAddress,
        source: 'venue'
      };
      if (SHEET_SCRIPT_URL) {
        fetch(SHEET_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch((err) => {
          console.error('Submission error:', err);
        });
      }
      // Hide form and show success
      form.style.display = 'none';
      if (successMessage) successMessage.style.display = 'block';
    });
  }
  attachVenueFormHandler('venueForm', 'venueSuccess');
  attachVenueFormHandler('venueForm2', 'venueSuccess2');

  // Handle investor form submission
  const investorForm = document.getElementById('investorForm');
  const investorSuccess = document.getElementById('investorSuccess');
  if (investorForm) {
    investorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = investorForm.querySelector('input[name="name"]');
      const emailInput = investorForm.querySelector('input[name="emailAddress"]');
      const name = nameInput ? nameInput.value : '';
      const emailAddress = emailInput ? emailInput.value : '';
      const payload = {
        name: name,
        emailAddress: emailAddress,
        source: 'investor'
      };
      if (SHEET_SCRIPT_URL) {
        fetch(SHEET_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch((err) => {
          console.error('Submission error:', err);
        });
      }
      // Hide form and show success
      investorForm.style.display = 'none';
      if (investorSuccess) investorSuccess.style.display = 'block';
    });
  }
});