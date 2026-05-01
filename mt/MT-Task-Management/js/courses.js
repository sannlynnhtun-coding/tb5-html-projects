'use strict';

var editingCourseId = null;
var courseModal     = null;

/* ── Render grid ─────────────────────────────────────────── */
function renderCourses() {
  var courses = MT.getCourses();
  var $grid   = $('#courses-grid');

  if (courses.length === 0) {
    $grid.html(
      '<div class="col-12"><div class="empty-state">'
      + '<i class="bi bi-book-plus"></i>'
      + '<p>No courses yet.<br>Click <strong>Add Course</strong> to get started.</p>'
      + '</div></div>'
    );
    return;
  }

  var html = '';
  courses.forEach(function (c) {
    var tasks = MT.getTasksByEntity('course', c.id);
    var done  = tasks.filter(function (t) { return t.status === 'done'; }).length;
    var total = tasks.length;
    var pct   = total ? Math.round(done / total * 100) : 0;

    html += '<div class="col-sm-6 col-lg-4">'
      + '<div class="card entity-card border-0 shadow-sm h-100">'
      + '<div class="card-body d-flex flex-column">'

      /* header */
      + '<div class="d-flex justify-content-between align-items-start mb-1">'
      + '<div class="me-2 min-width-0">'
      + '<h5 class="card-title mb-1 text-truncate">' + escHtml(c.name) + '</h5>'
      + providerBadge(c.provider)
      + '</div>'
      + '<div class="dropdown flex-shrink-0">'
      + '<button class="btn btn-link btn-sm text-muted p-0 lh-1" data-bs-toggle="dropdown" aria-label="Course options">'
      + '<i class="bi bi-three-dots-vertical"></i></button>'
      + '<ul class="dropdown-menu dropdown-menu-end">'
      + '<li><a class="dropdown-item" href="#" data-action="edit-course" data-id="' + c.id + '">'
      + '<i class="bi bi-pencil me-2"></i>Edit</a></li>'
      + '<li><a class="dropdown-item text-danger" href="#" data-action="delete-course" data-id="' + c.id + '" data-name="' + escHtml(c.name) + '">'
      + '<i class="bi bi-trash me-2"></i>Delete</a></li>'
      + '</ul></div></div>'

      /* instructor */
      + (c.instructor
          ? '<p class="text-muted small mb-2 mt-2"><i class="bi bi-person-fill me-1"></i>' + escHtml(c.instructor) + '</p>'
          : '<div class="mt-2"></div>')

      /* description */
      + '<p class="card-text text-muted small flex-grow-1 mb-3">'
      + escHtml(truncate(c.description, 100) || '—') + '</p>'

      /* progress */
      + '<div class="small text-muted d-flex justify-content-between mb-1">'
      + '<span><i class="bi bi-list-check me-1"></i>Progress</span>'
      + '<span>' + done + ' / ' + total + ' tasks</span></div>'
      + '<div class="progress mb-0"><div class="progress-bar bg-info" style="width:' + pct + '%"></div></div>'
      + '</div>'

      /* footer */
      + '<div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">'
      + '<a href="tasks.html?type=course&id=' + c.id + '" class="btn btn-info btn-sm w-100">'
      + '<i class="bi bi-collection me-1"></i>View Tasks</a>'
      + '</div></div></div>';
  });

  $grid.html(html);
}

/* ── Modal helpers ───────────────────────────────────────── */
function getModal() {
  if (!courseModal) {
    courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
  }
  return courseModal;
}

function openAddCourseModal() {
  editingCourseId = null;
  $('#course-modal-title').text('Add Course');
  $('#course-form')[0].reset();
  getModal().show();
}

function openEditCourseModal(id) {
  var c = MT.getCourses().find(function (x) { return x.id === id; });
  if (!c) return;
  editingCourseId = id;
  $('#course-modal-title').text('Edit Course');
  $('#course-name').val(c.name);
  $('#course-description').val(c.description || '');
  $('#course-instructor').val(c.instructor || '');
  $('#course-provider').val(c.provider || 'Other');
  getModal().show();
}

/* ── Init ────────────────────────────────────────────────── */
$(function () {
  renderCourses();

  $('#btn-add-course').on('click', openAddCourseModal);

  $('#course-form').on('submit', function (e) {
    e.preventDefault();
    var data = {
      name:        $.trim($('#course-name').val()),
      description: $.trim($('#course-description').val()),
      instructor:  $.trim($('#course-instructor').val()),
      provider:    $('#course-provider').val()
    };
    if (!data.name) { $('#course-name').focus(); return; }
    if (editingCourseId) { data.id = editingCourseId; }

    MT.saveCourse(data);
    getModal().hide();
    renderCourses();
    showToast(editingCourseId ? 'Course updated.' : 'Course added.');
    editingCourseId = null;
  });

  $(document).on('click', '[data-action="edit-course"]', function (e) {
    e.preventDefault();
    openEditCourseModal($(this).data('id'));
  });

  $(document).on('click', '[data-action="delete-course"]', function (e) {
    e.preventDefault();
    var id   = $(this).data('id');
    var name = $(this).data('name');
    confirmDelete(name, function () {
      MT.deleteCourse(id);
      renderCourses();
      showToast('Course deleted.', 'danger');
    });
  });
});
