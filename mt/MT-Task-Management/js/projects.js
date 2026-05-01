'use strict';

var editingProjectId = null;
var projectModal     = null;

/* ── Render grid ─────────────────────────────────────────── */
function renderProjects() {
  var projects = MT.getProjects();
  var $grid    = $('#projects-grid');

  if (projects.length === 0) {
    $grid.html(
      '<div class="col-12"><div class="empty-state">'
      + '<i class="bi bi-folder-plus"></i>'
      + '<p>No projects yet.<br>Click <strong>Add Project</strong> to get started.</p>'
      + '</div></div>'
    );
    return;
  }

  var html = '';
  projects.forEach(function (p) {
    var tasks = MT.getTasksByEntity('project', p.id);
    var done  = tasks.filter(function (t) { return t.status === 'done'; }).length;
    var total = tasks.length;
    var pct   = total ? Math.round(done / total * 100) : 0;

    html += '<div class="col-sm-6 col-lg-4">'
      + '<div class="card entity-card border-0 shadow-sm h-100">'
      + '<div class="card-body d-flex flex-column">'

      /* header row */
      + '<div class="d-flex justify-content-between align-items-start mb-2">'
      + '<h5 class="card-title mb-0 me-2 text-truncate">' + escHtml(p.name) + '</h5>'
      + '<div class="dropdown flex-shrink-0">'
      + '<button class="btn btn-link btn-sm text-muted p-0 lh-1" data-bs-toggle="dropdown" aria-label="Project options">'
      + '<i class="bi bi-three-dots-vertical"></i></button>'
      + '<ul class="dropdown-menu dropdown-menu-end">'
      + '<li><a class="dropdown-item" href="#" data-action="edit-project" data-id="' + p.id + '">'
      + '<i class="bi bi-pencil me-2"></i>Edit</a></li>'
      + '<li><a class="dropdown-item text-danger" href="#" data-action="delete-project" data-id="' + p.id + '" data-name="' + escHtml(p.name) + '">'
      + '<i class="bi bi-trash me-2"></i>Delete</a></li>'
      + '</ul></div></div>'

      /* description */
      + '<p class="card-text text-muted small flex-grow-1 mb-3">'
      + escHtml(truncate(p.description, 100) || '—') + '</p>'

      /* progress */
      + '<div class="small text-muted d-flex justify-content-between mb-1">'
      + '<span><i class="bi bi-list-check me-1"></i>Progress</span>'
      + '<span>' + done + ' / ' + total + ' tasks</span></div>'
      + '<div class="progress mb-0"><div class="progress-bar bg-success" style="width:' + pct + '%"></div></div>'
      + '</div>'

      /* footer */
      + '<div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">'
      + '<a href="tasks.html?type=project&id=' + p.id + '" class="btn btn-primary btn-sm w-100">'
      + '<i class="bi bi-kanban me-1"></i>View Tasks</a>'
      + '</div></div></div>';
  });

  $grid.html(html);
}

/* ── Modal helpers ───────────────────────────────────────── */
function getModal() {
  if (!projectModal) {
    projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
  }
  return projectModal;
}

function openAddModal() {
  editingProjectId = null;
  $('#project-modal-title').text('Add Project');
  $('#project-form')[0].reset();
  getModal().show();
}

function openEditModal(id) {
  var p = MT.getProjects().find(function (x) { return x.id === id; });
  if (!p) return;
  editingProjectId = id;
  $('#project-modal-title').text('Edit Project');
  $('#project-name').val(p.name);
  $('#project-description').val(p.description || '');
  getModal().show();
}

/* ── Init ────────────────────────────────────────────────── */
$(function () {
  renderProjects();

  $('#btn-add-project').on('click', openAddModal);

  $('#project-form').on('submit', function (e) {
    e.preventDefault();
    var data = {
      name:        $.trim($('#project-name').val()),
      description: $.trim($('#project-description').val())
    };
    if (!data.name) { $('#project-name').focus(); return; }
    if (editingProjectId) { data.id = editingProjectId; }

    MT.saveProject(data);
    getModal().hide();
    renderProjects();
    showToast(editingProjectId ? 'Project updated.' : 'Project created.');
    editingProjectId = null;
  });

  $(document).on('click', '[data-action="edit-project"]', function (e) {
    e.preventDefault();
    openEditModal($(this).data('id'));
  });

  $(document).on('click', '[data-action="delete-project"]', function (e) {
    e.preventDefault();
    var id   = $(this).data('id');
    var name = $(this).data('name');
    confirmDelete(name, function () {
      MT.deleteProject(id);
      renderProjects();
      showToast('Project deleted.', 'danger');
    });
  });
});
