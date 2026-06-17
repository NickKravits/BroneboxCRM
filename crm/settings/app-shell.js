/* ============================================================
   BroneBox CRM — App Shell JS
   - Persists & toggles the light/dark theme (data-theme on <html>)
   - Builds a theme-toggle button in the desktop sidebar
   - Builds a mobile top bar (title + theme toggle)
   - Builds a mobile bottom tab bar, cloned from the sidebar nav

   Pairs with: app-shell.css
   The actual theme *application* on first paint happens via a tiny
   inline script in <head> (before any CSS loads) — this file just
   keeps things in sync and builds the extra UI.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'bronebox-theme';

  function getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function setTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    syncToggleButtons(theme);
  }

  function syncToggleButtons(theme) {
    var icon = theme === 'light' ? 'ti-moon' : 'ti-sun';
    var label = theme === 'light' ? 'Тёмная тема' : 'Светлая тема';
    var buttons = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var iconEl = btn.querySelector('i');
      if (iconEl) iconEl.className = 'ti ' + icon;
      var labelEl = btn.querySelector('.theme-toggle-label');
      if (labelEl) labelEl.textContent = label;
      btn.setAttribute('aria-label', label);
    }
  }

  function toggleTheme() {
    var next = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  function makeToggleButton(extraClass, withLabel) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle ' + extraClass;

    var theme = getTheme();
    var icon = theme === 'light' ? 'ti-moon' : 'ti-sun';
    var label = theme === 'light' ? 'Тёмная тема' : 'Светлая тема';
    btn.setAttribute('aria-label', label);

    var html = '<i class="ti ' + icon + '" aria-hidden="true"></i>';
    if (withLabel) {
      html += '<span class="theme-toggle-label">' + label + '</span>';
    }
    btn.innerHTML = html;
    btn.addEventListener('click', toggleTheme);
    return btn;
  }

  // Desktop: small circular toggle above the sidebar collapse button
  function buildSidebarToggle() {
    var sidebarBottom = document.querySelector('.sidebar-bottom');
    if (!sidebarBottom) return;
    sidebarBottom.insertBefore(makeToggleButton('theme-toggle--sidebar', true), sidebarBottom.firstChild);
  }

  // Derive a short page title from <title>BroneBox CRM — XXX</title>
  function pageTitle() {
    var t = (document.title || '').replace(/^BroneBox CRM\s*[-—]\s*/, '').trim();
    return t || 'BroneBox';
  }

  // Mobile: fixed top bar with page title + theme toggle
  function buildTopbar() {
    var bar = document.createElement('header');
    bar.className = 'app-topbar';

    var title = document.createElement('span');
    title.className = 'app-topbar-title';
    title.textContent = pageTitle();
    bar.appendChild(title);

    bar.appendChild(makeToggleButton('theme-toggle--topbar', false));
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Mobile: fixed bottom tab bar, cloned from the existing sidebar nav
  function buildTabbar() {
    var items = document.querySelectorAll('.sidebar .nav-items .nav-item');
    if (!items.length) return;

    var nav = document.createElement('nav');
    nav.className = 'app-tabbar';

    items.forEach(function (item) {
      var icon = item.querySelector('i');
      var label = item.querySelector('.nav-label');

      var a = document.createElement('a');
      a.href = item.getAttribute('href') || '#';
      a.className = 'app-tab' + (item.classList.contains('active') ? ' active' : '');

      var html = '';
      if (icon) html += '<i class="' + icon.className + '" aria-hidden="true"></i>';
      html += '<span>' + (label ? label.textContent.trim() : '') + '</span>';
      a.innerHTML = html;

      nav.appendChild(a);
    });

    document.body.appendChild(nav);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    buildSidebarToggle();
    buildTopbar();
    buildTabbar();
  });
})();
