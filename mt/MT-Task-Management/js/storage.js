'use strict';

var MT = (function () {
  var KEYS = {
    PROJECTS: 'mt_tm_projects',
    COURSES:  'mt_tm_courses',
    TASKS:    'mt_tm_tasks'
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }

  function persist(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ─── Projects ──────────────────────────────── */
  function getProjects() { return load(KEYS.PROJECTS); }

  function saveProject(data) {
    var list = getProjects();
    if (data.id) {
      var idx = list.findIndex(function (p) { return p.id === data.id; });
      if (idx !== -1) {
        list[idx] = $.extend({}, list[idx], data, { updatedAt: new Date().toISOString() });
      }
    } else {
      data.id = uid();
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    persist(KEYS.PROJECTS, list);
    return data;
  }

  function deleteProject(id) {
    persist(KEYS.PROJECTS, load(KEYS.PROJECTS).filter(function (p) { return p.id !== id; }));
    persist(KEYS.TASKS,    load(KEYS.TASKS).filter(function (t) {
      return !(t.entityType === 'project' && t.entityId === id);
    }));
  }

  /* ─── Courses ───────────────────────────────── */
  function getCourses() { return load(KEYS.COURSES); }

  function saveCourse(data) {
    var list = getCourses();
    if (data.id) {
      var idx = list.findIndex(function (c) { return c.id === data.id; });
      if (idx !== -1) {
        list[idx] = $.extend({}, list[idx], data, { updatedAt: new Date().toISOString() });
      }
    } else {
      data.id = uid();
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    persist(KEYS.COURSES, list);
    return data;
  }

  function deleteCourse(id) {
    persist(KEYS.COURSES, load(KEYS.COURSES).filter(function (c) { return c.id !== id; }));
    persist(KEYS.TASKS,   load(KEYS.TASKS).filter(function (t) {
      return !(t.entityType === 'course' && t.entityId === id);
    }));
  }

  /* ─── Tasks ─────────────────────────────────── */
  function getTasks() { return load(KEYS.TASKS); }

  function getTasksByEntity(type, id) {
    return load(KEYS.TASKS).filter(function (t) {
      return t.entityType === type && t.entityId === id;
    });
  }

  function saveTask(data) {
    var list = getTasks();
    if (data.id) {
      var idx = list.findIndex(function (t) { return t.id === data.id; });
      if (idx !== -1) {
        list[idx] = $.extend({}, list[idx], data, { updatedAt: new Date().toISOString() });
      }
    } else {
      data.id = uid();
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    persist(KEYS.TASKS, list);
    return data;
  }

  function deleteTask(id) {
    persist(KEYS.TASKS, load(KEYS.TASKS).filter(function (t) { return t.id !== id; }));
  }

  /* ─── Stats ─────────────────────────────────── */
  function getStats() {
    var tasks = getTasks();
    return {
      projects: getProjects().length,
      courses:  getCourses().length,
      tasks:    tasks.length,
      done:     tasks.filter(function (t) { return t.status === 'done'; }).length
    };
  }

  return {
    getProjects: getProjects, saveProject: saveProject, deleteProject: deleteProject,
    getCourses:  getCourses,  saveCourse:  saveCourse,  deleteCourse:  deleteCourse,
    getTasks:    getTasks,    getTasksByEntity: getTasksByEntity,
    saveTask:    saveTask,    deleteTask: deleteTask,
    getStats:    getStats
  };
})();
