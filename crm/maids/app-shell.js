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

  function makeLogoutButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle theme-toggle--topbar topbar-logout';
    btn.setAttribute('aria-label', 'Выйти из аккаунта');
    btn.innerHTML = '<i class="ti ti-logout-2" aria-hidden="true"></i>';
    btn.addEventListener('click', logout);
    return btn;
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

    var actions = document.createElement('div');
    actions.className = 'app-topbar-actions';

    if (pageTitle() === 'Настройки') {
      actions.appendChild(makeLogoutButton());
    }
    actions.appendChild(makeToggleButton('theme-toggle--topbar', false));

    bar.appendChild(actions);
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

  function initMobileSectionAnchor() {
    var columnsRow = document.getElementById('columns-row');
    var anchor = document.getElementById('mobile-section-anchor');
    var deskRow = document.getElementById('desktop-header-row');
    if (!columnsRow) return;

    document.body.classList.add('has-section-anchor');

    var dotEl = document.getElementById('mobile-anchor-dot');
    var labelEl = document.getElementById('mobile-anchor-label');
    var countEl = document.getElementById('mobile-anchor-count');
    var columns = columnsRow.children;
    var mainEl = document.querySelector('.main');

    function positionBar(el) {
      if (!el || !mainEl) return;
      if (window.innerWidth <= 768) {
        el.style.left = '';
        el.style.right = '';
        return;
      }
      var rect = mainEl.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.right = (window.innerWidth - rect.right) + 'px';
    }

    function positionAll() {
      positionBar(anchor);
      positionBar(deskRow);
    }

    if (mainEl && window.ResizeObserver) {
      new ResizeObserver(positionAll).observe(mainEl);
    }
    window.addEventListener('resize', positionAll);
    positionAll();

    function activeColumn() {
      var mid = columnsRow.scrollLeft + columnsRow.clientWidth / 2;
      var best = null;
      var bestDist = Infinity;
      for (var i = 0; i < columns.length; i++) {
        var col = columns[i];
        var center = col.offsetLeft + col.offsetWidth / 2;
        var dist = Math.abs(center - mid);
        if (dist < bestDist) { bestDist = dist; best = col; }
      }
      return best;
    }

    function syncAnchor() {
      if (!anchor) return;
      var col = activeColumn();
      if (!col) return;
      var header = col.querySelector('.col-header');
      if (!header) return;
      var dot = header.querySelector('.col-dot');
      var count = header.querySelector('.col-count');
      if (dotEl && dot) dotEl.style.background = dot.style.background;
      if (labelEl) labelEl.textContent = header.getAttribute('data-label') || '';
      if (countEl && count) countEl.textContent = count.textContent;
    }

    function syncDeskRow() {
      if (!deskRow) return;
      for (var i = 0; i < columns.length; i++) {
        var header = columns[i].querySelector('.col-header');
        if (!header) continue;
        var dot = header.querySelector('.col-dot');
        var count = header.querySelector('.col-count');
        var itemDot = document.getElementById('dh-dot-' + i);
        var itemLabel = document.getElementById('dh-label-' + i);
        var itemCount = document.getElementById('dh-count-' + i);
        if (itemDot && dot) itemDot.style.background = dot.style.background;
        if (itemLabel) itemLabel.textContent = header.getAttribute('data-label') || '';
        if (itemCount && count) itemCount.textContent = count.textContent;
      }
    }

    function sync() {
      syncAnchor();
      syncDeskRow();
    }

    columnsRow.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    window.syncMobileSectionAnchor = sync;
    sync();
  }

  function logout() {
    try { localStorage.removeItem('broneboxtoken'); } catch (e) {}
    window.location.href = '/login';
  }

  function buildAvatarMenu() {
    var avatarWrap = document.querySelector('.sidebar .avatar-wrap');
    if (!avatarWrap) return;

    avatarWrap.classList.add('avatar-wrap--interactive');

    var menu = document.createElement('div');
    menu.className = 'avatar-menu';
    menu.innerHTML =
      '<button type="button" class="avatar-menu-item avatar-menu-logout">' +
        '<i class="ti ti-logout-2" aria-hidden="true"></i><span>Выйти из аккаунта</span>' +
      '</button>';
    document.body.appendChild(menu);

    function positionMenu() {
      var rect = avatarWrap.getBoundingClientRect();
      menu.style.top = (rect.bottom + 6) + 'px';
      menu.style.left = rect.left + 'px';
    }

    function closeMenu() {
      menu.classList.remove('open');
    }

    avatarWrap.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('open');
      if (willOpen) positionMenu();
      menu.classList.toggle('open', willOpen);
    });

    menu.querySelector('.avatar-menu-logout').addEventListener('click', function (e) {
      e.stopPropagation();
      logout();
    });

    document.addEventListener('click', closeMenu);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
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

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function pushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  var _pushBtns = [];

  function setPushIcon(state) {
    _pushBtns.forEach(function (btn) {
      var icon = btn.querySelector('i');
      var label = btn.querySelector('.theme-toggle-label');
      btn.classList.remove('push-toggle--denied', 'push-toggle--active');
      if (state === 'active') {
        icon.className = 'ti ti-bell-filled';
        btn.classList.add('push-toggle--active');
        btn.setAttribute('aria-label', 'Уведомления включены — нажмите, чтобы выключить');
        if (label) label.textContent = 'Уведомления включены';
      } else if (state === 'denied') {
        icon.className = 'ti ti-bell-off';
        btn.classList.add('push-toggle--denied');
        btn.setAttribute('aria-label', 'Уведомления заблокированы в браузере');
        if (label) label.textContent = 'Уведомления заблокированы';
      } else {
        icon.className = 'ti ti-bell';
        btn.setAttribute('aria-label', 'Включить уведомления');
        if (label) label.textContent = 'Уведомления';
      }
    });
  }

  function refreshPushButtonState() {
    if (!_pushBtns.length) return;
    if (Notification.permission === 'denied') { setPushIcon('denied'); return; }
    if (Notification.permission !== 'granted') { setPushIcon('default'); return; }
    navigator.serviceWorker.getRegistration('/crm/').then(function (reg) {
      if (!reg) { setPushIcon('default'); return; }
      reg.pushManager.getSubscription().then(function (sub) {
        setPushIcon(sub ? 'active' : 'default');
      });
    }).catch(function () { setPushIcon('default'); });
  }

  function doSubscribePush() {
    return navigator.serviceWorker.register('/crm/sw.js', { scope: '/crm/' })
      .then(function () { return navigator.serviceWorker.ready; })
      .then(function (reg) { return reg.pushManager.getSubscription().then(function (sub) { return { reg: reg, sub: sub }; }); })
      .then(function (r) {
        if (r.sub) return r.sub;
        return fetch(API + '/push/vapid-public-key')
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data.publicKey) throw new Error('VAPID ключ не настроен на сервере');
            return r.reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(data.publicKey)
            });
          });
      })
      .then(function (sub) {
        var token = localStorage.getItem('broneboxtoken');
        var json = sub.toJSON();
        return fetch(API + '/push/subscribe', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys })
        });
      });
  }

  function doUnsubscribePush() {
    return navigator.serviceWorker.getRegistration('/crm/').then(function (reg) {
      if (!reg) return;
      return reg.pushManager.getSubscription().then(function (sub) {
        if (!sub) return;
        var endpoint = sub.endpoint;
        var token = localStorage.getItem('broneboxtoken');
        return sub.unsubscribe().then(function () {
          return fetch(API + '/push/unsubscribe', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: endpoint })
          }).catch(function () {});
        });
      });
    });
  }

  function togglePush() {
    if (Notification.permission === 'denied') {
      window.showToast && window.showToast('Уведомления заблокированы в настройках браузера', 'warning');
      return;
    }

    navigator.serviceWorker.getRegistration('/crm/').then(function (reg) {
      var subP = (reg && Notification.permission === 'granted') ? reg.pushManager.getSubscription() : Promise.resolve(null);
      subP.then(function (sub) {
        if (sub) {
          doUnsubscribePush().then(function () {
            setPushIcon('default');
            window.showToast && window.showToast('Уведомления выключены', 'info');
          });
          return;
        }

        var permissionPromise = Notification.permission === 'default'
          ? Notification.requestPermission()
          : Promise.resolve(Notification.permission);

        permissionPromise.then(function (permission) {
          if (permission !== 'granted') { refreshPushButtonState(); return; }
          doSubscribePush().then(function () {
            setPushIcon('active');
            window.showToast && window.showToast('Уведомления включены', 'success');
          }).catch(function (e) {
            console.error(e);
            window.showToast && window.showToast('Не удалось включить уведомления', 'danger');
          });
        });
      });
    });
  }

  function makePushToggleButton(extraClass, withLabel) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle push-toggle ' + extraClass;
    var html = '<i class="ti ti-bell" aria-hidden="true"></i>';
    if (withLabel) html += '<span class="theme-toggle-label">Уведомления</span>';
    btn.innerHTML = html;
    btn.addEventListener('click', togglePush);
    return btn;
  }

  function initPushToggle() {
    if (!pushSupported()) return;

    var sidebarBottom = document.querySelector('.sidebar-bottom');
    if (sidebarBottom) {
      var sidebarBtn = makePushToggleButton('theme-toggle--sidebar', true);
      sidebarBottom.insertBefore(sidebarBtn, sidebarBottom.firstChild);
      _pushBtns.push(sidebarBtn);
    }

    var actions = document.querySelector('.app-topbar-actions');
    if (actions) {
      var topbarBtn = makePushToggleButton('theme-toggle--topbar', false);
      actions.insertBefore(topbarBtn, actions.firstChild);
      _pushBtns.push(topbarBtn);
    }

    if (!_pushBtns.length) return;
    refreshPushButtonState();
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    buildSidebarToggle();
    buildTopbar();
    buildTabbar();
    buildAvatarMenu();
    initMobileSectionAnchor();
    initPushToggle();
    connectSSE();
  });
})();
