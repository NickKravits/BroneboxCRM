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

  function buildSidebarToggle() {
    var sidebarBottom = document.querySelector('.sidebar-bottom');
    if (!sidebarBottom) return;
    sidebarBottom.insertBefore(makeToggleButton('theme-toggle--sidebar', true), sidebarBottom.firstChild);
  }

  function pageTitle() {
    var t = (document.title || '').replace(/^BroneBox CRM\s*[-—]\s*/, '').trim();
    return t || 'BroneBox';
  }

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

  function logout() {
    try { localStorage.removeItem('broneboxtoken'); } catch (e) {}
    window.location.href = '/login';
  }

  function buildAvatarMenu() {
    var avatarWrap = document.querySelector('.sidebar .avatar-wrap');
    if (!avatarWrap || avatarWrap.querySelector('.avatar-menu')) return;

    avatarWrap.classList.add('avatar-wrap--interactive');

    var menu = document.createElement('div');
    menu.className = 'avatar-menu';
    menu.innerHTML =
      '<button type="button" class="avatar-menu-item avatar-menu-logout">' +
        '<i class="ti ti-logout-2" aria-hidden="true"></i><span>Выйти из аккаунта</span>' +
      '</button>';
    avatarWrap.appendChild(menu);

    avatarWrap.addEventListener('click', function (e) {
      e.stopPropagation();
      avatarWrap.classList.toggle('avatar-menu-open');
    });

    menu.querySelector('.avatar-menu-logout').addEventListener('click', function (e) {
      e.stopPropagation();
      logout();
    });

    document.addEventListener('click', function () {
      avatarWrap.classList.remove('avatar-menu-open');
    });
  }

  var TOAST_ICONS = {
    success: 'ti-circle-check',
    danger:  'ti-circle-x',
    info:    'ti-info-circle',
    warning: 'ti-alert-triangle'
  };

  function getToastContainer() {
    var el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-container';
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  window.showToast = function (message, type, duration) {
    type = type || 'info';
    duration = duration || 3500;
    var container = getToastContainer();
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<i class="ti ' + (TOAST_ICONS[type] || 'ti-info-circle') + '" aria-hidden="true"></i>' +
      '<span class="toast-text">' + message + '</span>' +
      '<button class="toast-close" aria-label="Закрыть"><i class="ti ti-x"></i></button>';
    toast.querySelector('.toast-close').addEventListener('click', function () {
      window.hideToast(toast);
    });
    container.appendChild(toast);
    setTimeout(function () { window.hideToast(toast); }, duration);
  };

  window.hideToast = function (toast) {
    if (!toast || toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
  };

  var _sseActive = false;

  function parseSSE(chunk, onEvent) {
    var blocks = chunk.split('\n\n');
    var rest = blocks.pop();
    blocks.forEach(function (block) {
      var lines = block.split('\n');
      var evType = 'message';
      var evData = '';
      lines.forEach(function (line) {
        if (line.indexOf('event:') === 0) {
          evType = line.slice(6).trim();
        } else if (line.indexOf('data:') === 0) {
          evData += (evData ? '\n' : '') + line.slice(5).trim();
        }
      });
      if (evData) onEvent(evType, evData);
    });
    return rest;
  }

  function fmtDate(str) {
    if (!str || str.length < 10) return str;
    return str.slice(8, 10) + '.' + str.slice(5, 7) + '.' + str.slice(0, 4);
  }

  var SSE_TOASTS = {
    new_booking:    { text: 'Новое бронирование',     type: 'info' },
    update_booking: { text: 'Бронирование обновлено', type: 'warning' },
    delete_booking: { text: 'Бронирование удалено',   type: 'danger' }
  };

  function handleSSEEvent(type, rawData) {
    var cfg = SSE_TOASTS[type];
    if (cfg) {
      try {
        var d = JSON.parse(rawData);
        var msg = cfg.text;
        if (d.objectName) msg += ' — ' + d.objectName;
        if (d.checkin && d.checkout) msg += ' · ' + fmtDate(d.checkin) + ' – ' + fmtDate(d.checkout);
        window.showToast(msg, cfg.type, 7000);
      } catch (e) {
        window.showToast(cfg.text, cfg.type, 7000);
      }
      window.dispatchEvent(new CustomEvent('bronebox:reload'));
    }
  }

  function connectSSE() {
    var token;
    try { token = localStorage.getItem('broneboxtoken'); } catch (e) {}
    if (!token) return;

    _sseActive = true;

    fetch(API + '/events', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
      if (!res.ok || !res.body) {
        _sseActive = false;
        setTimeout(connectSSE, 10000);
        return;
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';

      function read() {
        reader.read().then(function (ref) {
          if (ref.done) {
            _sseActive = false;
            setTimeout(connectSSE, 5000);
            return;
          }
          buf = parseSSE(buf + decoder.decode(ref.value, { stream: true }), handleSSEEvent);
          read();
        }).catch(function () {
          _sseActive = false;
          setTimeout(connectSSE, 5000);
        });
      }
      read();
    }).catch(function () {
      _sseActive = false;
      setTimeout(connectSSE, 10000);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    buildSidebarToggle();
    buildTopbar();
    buildTabbar();
    buildAvatarMenu();
    connectSSE();
  });
})();
