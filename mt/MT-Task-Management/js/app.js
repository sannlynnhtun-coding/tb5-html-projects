'use strict';

/* ── Active nav link ─────────────────────────────────────── */
$(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  $('.navbar-nav .nav-link').each(function () {
    if ($(this).attr('href') === page) {
      $(this).addClass('active').attr('aria-current', 'page');
    }
  });
});

/* ── Utility functions ───────────────────────────────────── */
function escHtml(str) {
  return $('<div>').text(str || '').html();
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function priorityBadge(p) {
  var map    = { critical: 'danger', high: 'warning', medium: 'primary', low: 'secondary' };
  var labels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  var cls    = map[p] || 'secondary';
  return '<span class="badge text-bg-' + cls + ' me-1">' + (labels[p] || escHtml(p)) + '</span>';
}

function statusBadge(s) {
  var map    = { todo: 'secondary', 'in-progress': 'warning', review: 'info', done: 'success' };
  var labels = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
  var cls    = map[s] || 'secondary';
  return '<span class="badge text-bg-' + cls + '">' + (labels[s] || escHtml(s)) + '</span>';
}

function providerBadge(p) {
  var colors = {
    'Pluralsight': 'danger', 'YouTube': 'danger', 'Coursera': 'primary',
    'Udemy': 'warning', 'edX': 'dark', 'LinkedIn Learning': 'primary',
    'freeCodeCamp': 'success', 'Instructor': 'secondary', 'Other': 'secondary'
  };
  var cls = colors[p] || 'secondary';
  return '<span class="badge text-bg-' + cls + ' provider-badge">' + escHtml(p || 'Other') + '</span>';
}

/* ── Toast notification ──────────────────────────────────── */
function showToast(msg, type) {
  type = type || 'success';
  var id   = 'toast-' + Date.now();
  var icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
  var html = '<div id="' + id + '" class="toast align-items-center text-bg-' + type + ' border-0" role="alert" data-bs-autohide="true" data-bs-delay="2500">'
    + '<div class="d-flex"><div class="toast-body d-flex align-items-center gap-2">'
    + '<i class="bi ' + icon + '"></i> ' + escHtml(msg) + '</div>'
    + '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>'
    + '</div></div>';
  $('#toast-container').append(html);
  var el = document.getElementById(id);
  var t  = new bootstrap.Toast(el);
  t.show();
  el.addEventListener('hidden.bs.toast', function () { el.remove(); });
}

/* ── Delete confirmation ─────────────────────────────────── */
function confirmDelete(name, callback) {
  if (window.confirm('Delete "' + name + '"?\nThis cannot be undone.')) {
    callback();
  }
}
