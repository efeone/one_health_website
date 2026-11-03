/**
 * OneHealth - contact.js
 * "Request a demo" modal. Creates a Lead in the Efeone (Frappe) system.
 */
(function () {
  'use strict';

  /* ---------- Settings ---------- */
  var CONFIG = {
    // Same Lead endpoint used on the efeone.com page
    API_URL: 'https://jalebi.efeone.com/api/resource/Lead',

    // Same credentials as the efeone.com contact form.
    // Note: anything in this file is visible to every visitor.
    AUTH_TOKEN: 'token ffceb203fabe2fc:773041385edd49a',

    // Saved in the Lead's custom_subject field
    SUBJECT: 'OneHealth Demo Request'
  };

  var dialog = document.getElementById('demo-dialog');
  if (!dialog) return;

  var form = document.getElementById('demo-form');
  var statusEl = document.getElementById('demo-status');
  var submitBtn = document.getElementById('demo-submit');
  var successEl = document.getElementById('demo-success');
  var lastTrigger = null;

  /* ---------- Open / close ---------- */
  function openDialog(trigger) {
    lastTrigger = trigger || null;
    resetView();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    var first = form.querySelector('input');
    if (first) first.focus();
  }

  function closeDialog() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (lastTrigger) lastTrigger.focus();
  }

  function resetView() {
    form.hidden = false;
    successEl.hidden = true;
    setStatus('', '');
    setBusy(false);
  }

  document.querySelectorAll('[data-demo-open]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault(); // stop the mailto fallback when JS is available
      openDialog(el);
    });
  });

  document.querySelectorAll('[data-demo-close]').forEach(function (el) {
    el.addEventListener('click', closeDialog);
  });

  // Click on the dark backdrop closes the dialog
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDialog();
  });

  /* ---------- Helpers ---------- */
  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'demo-status' + (type ? ' is-' + type : '');
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Sending...' : 'Send request';
  }

  function value(id) {
    return document.getElementById(id).value.trim();
  }

  /* ---------- Submit: create the Lead ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot: real visitors never see or fill this field
    if (value('demo_website')) {
      form.hidden = true;
      successEl.hidden = false;
      return;
    }

    var name = value('demo_name');
    var email = value('demo_email');
    var phone = value('demo_phone');
    var organization = value('demo_org');
    var message = value('demo_message');

    if (!name || !email) {
      setStatus('Please enter your name and email.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }

    var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (CONFIG.AUTH_TOKEN) headers['Authorization'] = CONFIG.AUTH_TOKEN;

    var payload = {
      first_name: name,
      email_id: email,
      mobile_no: phone,
      company_name: organization,
      custom_subject: CONFIG.SUBJECT,
      custom_message: message
    };

    setBusy(true);
    setStatus('', '');

    fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          // Log the server's own explanation to the browser console (F12 > Console)
          return response.text().then(function (body) {
            console.error('Lead API error', response.status, body);
            var err = new Error('Request failed with status ' + response.status);
            err.status = response.status;
            throw err;
          });
        }
        return response.json();
      })
      .then(function () {
        form.reset();
        form.hidden = true;
        successEl.hidden = false;
        setBusy(false);
      })
      .catch(function (err) {
        console.error('Demo request error:', err);
        setBusy(false);
        if (err.status) {
          setStatus('Sorry, we could not send your request (error ' + err.status + '). Please try again or email us directly.', 'error');
        } else {
          // No status = the browser never got an answer (usually a CORS block or no connection)
          setStatus('Could not reach the server (network or CORS issue). Please try again or email us directly.', 'error');
        }
      });
  });
})();