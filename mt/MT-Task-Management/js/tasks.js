'use strict';

var currentEntityType = null;
var currentEntityId   = null;
var editingTaskId     = null;
var taskModal         = null;

var STATUSES = ['todo', 'in-progress', 'review', 'done'];
var STATUS_LABELS = {
  'todo': 'To Do', 'in-progress': 'In Progress',
  'review': 'Review', 'done': 'Done'
};

/* ── URL helpers ─────────────────────────────────────────── */
function getUrlParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ── Render dispatcher ───────────────────────────────────── */
function renderView() {
  var $container = $('#view-container');

  if (!currentEntityType || !currentEntityId) {
    $container.html(
      '<div class="empty-state">'
      + '<i class="bi bi-arrow-up-circle"></i>'
      + '<p>Select a project or course above to view and manage its tasks.</p>'
      + '</div>'
    );
    return;
  }

  if (currentEntityType === 'project') {
    renderKanban($container);
  } else {
    renderModuleView($container);
  }
}

/* ── Kanban (project tasks) ──────────────────────────────── */
function renderKanban($container) {
  var tasks = MT.getTasksByEntity('project', currentEntityId);
  var html  = '<div class="kanban-wrap"><div class="kanban-board">';

  STATUSES.forEach(function (status) {
    var colTasks = tasks.filter(function (t) { return t.status === status; });
    html += '<div class="kanban-col" data-status="' + status + '">'
      + '<div class="kanban-col-header"><span>' + STATUS_LABELS[status] + '</span>'
      + '<span class="badge bg-white text-dark">' + colTasks.length + '</span></div>'
      + '<div class="kanban-cards">';

    colTasks.forEach(function (t) { html += buildKanbanCard(t); });

    html += '</div>'
      + '<button class="kanban-add-btn" data-default-status="' + status + '">'
      + '<i class="bi bi-plus-lg"></i> Add Task</button>'
      + '</div>';
  });

  html += '</div></div>';

  /* summary bar */
  var total = tasks.length;
  var done  = tasks.filter(function (t) { return t.status === 'done'; }).length;
  var pct   = total ? Math.round(done / total * 100) : 0;
  html += '<div class="d-flex align-items-center gap-3 mt-3">'
    + '<div class="flex-grow-1"><div class="progress" style="height:6px">'
    + '<div class="progress-bar bg-success" style="width:' + pct + '%"></div></div></div>'
    + '<span class="text-muted small">' + done + ' / ' + total + ' done (' + pct + '%)</span>'
    + '</div>';

  $container.html(html);
}

function buildKanbanCard(task) {
  var others = STATUSES.filter(function (s) { return s !== task.status; });
  var moves  = others.map(function (s) {
    return '<li><a class="dropdown-item small" href="#" data-action="move-task" data-id="' + task.id + '" data-status="' + s + '">'
      + '<i class="bi bi-arrow-right me-1"></i>' + STATUS_LABELS[s] + '</a></li>';
  }).join('');

  return '<div class="kanban-card">'
    + '<div class="card-actions dropdown">'
    + '<button class="btn-card-menu" data-bs-toggle="dropdown" aria-label="Task options">'
    + '<i class="bi bi-three-dots-vertical"></i></button>'
    + '<ul class="dropdown-menu dropdown-menu-end">'
    + '<li><a class="dropdown-item small" href="#" data-action="edit-task" data-id="' + task.id + '">'
    + '<i class="bi bi-pencil me-1"></i>Edit</a></li>'
    + '<li><hr class="dropdown-divider my-1"></li>'
    + moves
    + '<li><hr class="dropdown-divider my-1"></li>'
    + '<li><a class="dropdown-item small text-danger" href="#" data-action="delete-task" data-id="' + task.id + '" data-name="' + escHtml(task.name) + '">'
    + '<i class="bi bi-trash me-1"></i>Delete</a></li>'
    + '</ul></div>'
    + '<div class="task-name">' + escHtml(task.name) + '</div>'
    + '<div class="mt-1">' + priorityBadge(task.priority) + '</div>'
    + (task.description ? '<div class="task-desc">' + escHtml(truncate(task.description, 90)) + '</div>' : '')
    + '</div>';
}

/* ── Module view (course tasks) ──────────────────────────── */
function renderModuleView($container) {
  var tasks = MT.getTasksByEntity('course', currentEntityId);

  if (tasks.length === 0) {
    $container.html(
      '<div class="empty-state"><i class="bi bi-journal-plus"></i>'
      + '<p>No tasks yet. Click <strong>Add Task</strong> to get started.</p></div>'
    );
    return;
  }

  /* Group by module */
  var groups  = {};
  var order   = [];
  tasks.forEach(function (t) {
    var mod = t.module ? $.trim(t.module) : '';
    var key = mod || '(No Module)';
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(t);
  });
  /* de-dup order */
  order = order.filter(function (v, i) { return order.indexOf(v) === i; });

  var html = '<div class="accordion" id="moduleAccordion">';
  order.forEach(function (mod, i) {
    var modTasks = groups[mod];
    var colId    = 'mod-col-' + i;
    var done     = modTasks.filter(function (t) { return t.status === 'done'; }).length;
    html += '<div class="accordion-item border-0 shadow-sm mb-2">'
      + '<h2 class="accordion-header">'
      + '<button class="accordion-button' + (i > 0 ? ' collapsed' : '') + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + colId + '">'
      + '<i class="bi bi-collection me-2 text-primary"></i>'
      + '<span class="me-2">' + escHtml(mod) + '</span>'
      + '<span class="badge bg-primary-subtle text-primary me-1">' + modTasks.length + ' tasks</span>'
      + '<span class="badge bg-success-subtle text-success">' + done + ' done</span>'
      + '</button></h2>'
      + '<div id="' + colId + '" class="accordion-collapse collapse' + (i === 0 ? ' show' : '') + '" data-bs-parent="#moduleAccordion">'
      + '<div class="accordion-body py-2">';

    modTasks.forEach(function (t) { html += buildModuleTaskRow(t); });

    html += '</div></div></div>';
  });
  html += '</div>';
  $container.html(html);
}

function buildModuleTaskRow(task) {
  var resources    = task.resources || [];
  var resourceHtml = resources.map(function (r) {
    if (!r.url) return '';
    return '<a href="' + escHtml(r.url) + '" target="_blank" rel="noopener noreferrer" class="resource-chip">'
      + '<i class="bi bi-link-45deg"></i>' + escHtml(r.title || r.url) + '</a>';
  }).join('');

  return '<div class="module-task-row">'
    + '<div class="module-task-body">'
    + '<div class="module-task-name">' + escHtml(task.name) + '</div>'
    + (task.description ? '<div class="module-task-desc">' + escHtml(truncate(task.description, 110)) + '</div>' : '')
    + (resourceHtml ? '<div class="mt-1 d-flex flex-wrap gap-1">' + resourceHtml + '</div>' : '')
    + '</div>'
    + '<div class="module-task-actions">'
    + priorityBadge(task.priority)
    + statusBadge(task.status)
    + '<div class="dropdown">'
    + '<button class="btn btn-link btn-sm text-muted p-0 lh-1" data-bs-toggle="dropdown" aria-label="Task options">'
    + '<i class="bi bi-three-dots-vertical"></i></button>'
    + '<ul class="dropdown-menu dropdown-menu-end">'
    + '<li><a class="dropdown-item small" href="#" data-action="edit-task" data-id="' + task.id + '">'
    + '<i class="bi bi-pencil me-1"></i>Edit</a></li>'
    + '<li><a class="dropdown-item small text-danger" href="#" data-action="delete-task" data-id="' + task.id + '" data-name="' + escHtml(task.name) + '">'
    + '<i class="bi bi-trash me-1"></i>Delete</a></li>'
    + '</ul></div></div></div>';
}

/* ── Task modal ──────────────────────────────────────────── */
function getModal() {
  if (!taskModal) {
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
  }
  return taskModal;
}

function openAddTaskModal(defaultStatus) {
  editingTaskId = null;
  $('#task-modal-title').text('Add Task');
  $('#task-form')[0].reset();
  $('#task-status').val(defaultStatus || 'todo');
  $('#task-priority').val('medium');
  $('#task-resources-list').empty();
  toggleCourseFields();
  getModal().show();
}

function openEditTaskModal(id) {
  var task = MT.getTasks().find(function (t) { return t.id === id; });
  if (!task) return;
  editingTaskId = id;
  $('#task-modal-title').text('Edit Task');
  $('#task-name').val(task.name);
  $('#task-description').val(task.description || '');
  $('#task-priority').val(task.priority || 'medium');
  $('#task-status').val(task.status || 'todo');
  $('#task-module').val(task.module || '');
  $('#task-resources-list').empty();
  (task.resources || []).forEach(function (r) { addResourceRow(r.title, r.url); });
  toggleCourseFields();
  getModal().show();
}

function toggleCourseFields() {
  if (currentEntityType === 'course') {
    $('#course-fields').show();
  } else {
    $('#course-fields').hide();
  }
}

function addResourceRow(title, url) {
  var html = '<div class="resource-row">'
    + '<input type="text" class="form-control form-control-sm resource-title" placeholder="Label (optional)" value="' + escHtml(title || '') + '">'
    + '<input type="url"  class="form-control form-control-sm resource-url"   placeholder="https://..." value="' + escHtml(url || '') + '">'
    + '<button type="button" class="btn btn-outline-danger btn-sm flex-shrink-0" data-action="remove-resource" aria-label="Remove">'
    + '<i class="bi bi-x-lg"></i></button>'
    + '</div>';
  $('#task-resources-list').append(html);
}

function collectResources() {
  var res = [];
  $('#task-resources-list .resource-row').each(function () {
    var url = $.trim($(this).find('.resource-url').val());
    if (url) {
      res.push({ title: $.trim($(this).find('.resource-title').val()) || url, url: url });
    }
  });
  return res;
}

/* ── Entity selector UI ──────────────────────────────────── */
function populateSelects() {
  var $proj   = $('#filter-project');
  var $course = $('#filter-course');

  $proj.empty().append('<option value="">— Select Project —</option>');
  MT.getProjects().forEach(function (p) {
    $proj.append('<option value="' + p.id + '">' + escHtml(p.name) + '</option>');
  });

  $course.empty().append('<option value="">— Select Course —</option>');
  MT.getCourses().forEach(function (c) {
    $course.append('<option value="' + c.id + '">' + escHtml(c.name) + '</option>');
  });
}

function applyEntityUI() {
  if (currentEntityType === 'project') {
    $('#filter-type').val('project');
    $('#project-filter-row').show();
    $('#course-filter-row').hide();
    $('#filter-project').val(currentEntityId || '');
    $('#entity-title').text($('#filter-project option:selected').text());
  } else if (currentEntityType === 'course') {
    $('#filter-type').val('course');
    $('#project-filter-row').hide();
    $('#course-filter-row').show();
    $('#filter-course').val(currentEntityId || '');
    $('#entity-title').text($('#filter-course option:selected').text());
  } else {
    $('#filter-type').val('');
    $('#project-filter-row').hide();
    $('#course-filter-row').hide();
    $('#entity-title').text('');
  }
  $('#btn-add-task').toggle(!!(currentEntityType && currentEntityId));
}

/* ── Init ────────────────────────────────────────────────── */
$(function () {
  populateSelects();

  var urlType = getUrlParam('type');
  var urlId   = getUrlParam('id');
  if (urlType && urlId) {
    currentEntityType = urlType;
    currentEntityId   = urlId;
  }

  applyEntityUI();
  renderView();

  /* Entity type toggle */
  $('#filter-type').on('change', function () {
    currentEntityType = $(this).val() || null;
    currentEntityId   = null;
    $('#project-filter-row, #course-filter-row').hide();
    if (currentEntityType === 'project') { $('#project-filter-row').show(); $('#filter-project').val(''); }
    if (currentEntityType === 'course')  { $('#course-filter-row').show();  $('#filter-course').val('');  }
    $('#btn-add-task').hide();
    $('#entity-title').text('');
    renderView();
  });

  $('#filter-project').on('change', function () {
    currentEntityId = $(this).val() || null;
    $('#entity-title').text($(this).find('option:selected').text());
    $('#btn-add-task').toggle(!!currentEntityId);
    renderView();
  });

  $('#filter-course').on('change', function () {
    currentEntityId = $(this).val() || null;
    $('#entity-title').text($(this).find('option:selected').text());
    $('#btn-add-task').toggle(!!currentEntityId);
    renderView();
  });

  /* Add task button */
  $('#btn-add-task').on('click', function () { openAddTaskModal(); });

  /* Kanban column "add" button */
  $(document).on('click', '.kanban-add-btn', function () {
    openAddTaskModal($(this).data('default-status'));
  });

  /* Edit task */
  $(document).on('click', '[data-action="edit-task"]', function (e) {
    e.preventDefault();
    openEditTaskModal($(this).data('id'));
  });

  /* Delete task */
  $(document).on('click', '[data-action="delete-task"]', function (e) {
    e.preventDefault();
    var id   = $(this).data('id');
    var name = $(this).data('name');
    confirmDelete(name, function () {
      MT.deleteTask(id);
      renderView();
      showToast('Task deleted.', 'danger');
    });
  });

  /* Move task (kanban) */
  $(document).on('click', '[data-action="move-task"]', function (e) {
    e.preventDefault();
    MT.saveTask({ id: $(this).data('id'), status: $(this).data('status') });
    renderView();
    showToast('Moved to ' + STATUS_LABELS[$(this).data('status')] + '.');
  });

  /* Add resource row */
  $('#btn-add-resource').on('click', function () { addResourceRow(); });

  /* Remove resource row */
  $(document).on('click', '[data-action="remove-resource"]', function () {
    $(this).closest('.resource-row').remove();
  });

  /* Task form submit */
  $('#task-form').on('submit', function (e) {
    e.preventDefault();
    var data = {
      name:        $.trim($('#task-name').val()),
      description: $.trim($('#task-description').val()),
      priority:    $('#task-priority').val(),
      status:      $('#task-status').val(),
      entityType:  currentEntityType,
      entityId:    currentEntityId
    };
    if (!data.name) { $('#task-name').focus(); return; }

    if (currentEntityType === 'course') {
      data.module    = $.trim($('#task-module').val());
      data.resources = collectResources();
    }

    if (editingTaskId) { data.id = editingTaskId; }
    MT.saveTask(data);
    getModal().hide();
    renderView();
    showToast(editingTaskId ? 'Task updated.' : 'Task added.');
    editingTaskId = null;
  });
});
