(() => {
  'use strict';
  const data = window.TRACKER_DATA;
  if (!data || !Array.isArray(data.topics) || !Array.isArray(data.sections)) {
    document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:2rem"><h1>Tracker data could not be loaded</h1><p>Please keep index.html and data.js in the same folder.</p></main>';
    return;
  }

  const STORAGE_KEY = 'jsRoadmapTracker.progress.v2';
  const initial = new Map(data.topics.map(t => [t.id, !!t.done]));
  let completed = new Map(initial);
  let activeSection = 'all';
  let collapsed = new Set();
  let toastTimer;
  const $ = id => document.getElementById(id);
  const els = {
    saveStatus: $('saveStatus'), topicPill: $('topicPill'), percentValue: $('percentValue'), doneValue: $('doneValue'), overallBar: $('overallBar'), encouragement: $('encouragement'), mustValue: $('mustValue'), goodValue: $('goodValue'), remainingValue: $('remainingValue'), allCount: $('allCount'), sectionNav: $('sectionNav'), listTitle: $('listTitle'), listSubtitle: $('listSubtitle'), searchInput: $('searchInput'), statusFilter: $('statusFilter'), priorityFilter: $('priorityFilter'), resultCount: $('resultCount'), collapseBtn: $('collapseBtn'), topicList: $('topicList'), emptyState: $('emptyState'), resetFiltersBtn: $('resetFiltersBtn'), emptyClearBtn: $('emptyClearBtn'), resetDialog: $('resetDialog'), confirmResetBtn: $('confirmResetBtn'), toast: $('toast')
  };

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
      for (const t of data.topics) if (typeof saved[t.id] === 'boolean') completed.set(t.id, saved[t.id]);
    } catch (err) { console.warn('Could not load saved progress:', err); }
  }
  function saveProgress() {
    try {
      const obj = Object.fromEntries(completed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      els.saveStatus.textContent = '● Saved on this device';
    } catch (err) {
      els.saveStatus.textContent = '● Could not save';
      showToast('Browser storage is unavailable. Your progress may not persist.');
      console.warn('Could not save progress:', err);
    }
  }
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
  }
  function countTopics(items) { return items.filter(t => completed.get(t.id)).length; }
  function stats() {
    const total = data.topics.length;
    const done = data.topics.filter(t => completed.get(t.id));
    const must = data.topics.filter(t => t.priority === 'Must');
    const good = data.topics.filter(t => t.priority === 'Good to have');
    const percent = total ? Math.round(done.length / total * 100) : 0;
    els.topicPill.textContent = `${total} topics`;
    els.percentValue.textContent = `${percent}%`;
    els.doneValue.textContent = `${done.length} / ${total} done`;
    els.overallBar.style.width = `${percent}%`;
    els.mustValue.textContent = `${countTopics(must)} / ${must.length}`;
    els.goodValue.textContent = `${countTopics(good)} / ${good.length}`;
    els.remainingValue.textContent = String(total - done.length);
    els.allCount.textContent = String(total);
    els.encouragement.textContent = percent === 100 ? 'Roadmap complete — excellent work!' : percent >= 75 ? 'You are close. Keep the momentum going.' : percent >= 40 ? 'Good progress. Keep showing up consistently.' : percent > 0 ? 'Nice start. One topic at a time.' : 'Start with one small step.';
  }
  function renderSectionNav() {
    els.sectionNav.innerHTML = data.sections.map(s => {
      const items = data.topics.filter(t => t.sectionId === s.id);
      const done = countTopics(items);
      const title = s.title.replace(/^\d+\.\s*/, '');
      return `<button type="button" class="section-nav-item ${activeSection === s.id ? 'active' : ''}" data-section="${s.id}" title="${escapeAttr(title)}"><span class="nav-dot"></span><span class="nav-name">${escapeHtml(s.title)}</span><span class="nav-count">${done}/${items.length}</span></button>`;
    }).join('');
    document.querySelectorAll('[data-section]').forEach(btn => {
      btn.classList.toggle('active', String(activeSection) === btn.dataset.section);
    });
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function escapeAttr(value) { return escapeHtml(value); }
  function visibleTopics() {
    const q = els.searchInput.value.trim().toLocaleLowerCase();
    const status = els.statusFilter.value;
    const priority = els.priorityFilter.value;
    return data.topics.filter(t => {
      if (activeSection !== 'all' && t.sectionId !== Number(activeSection)) return false;
      if (status === 'done' && !completed.get(t.id)) return false;
      if (status === 'todo' && completed.get(t.id)) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (q && !`${t.title} ${t.number} ${t.priority} ${t.source}`.toLocaleLowerCase().includes(q)) return false;
      return true;
    });
  }
  function renderTopics() {
    const visible = visibleTopics();
    const selectedSection = data.sections.find(s => s.id === Number(activeSection));
    els.listTitle.textContent = activeSection === 'all' ? 'All topics' : (selectedSection ? selectedSection.title : 'All topics');
    els.listSubtitle.textContent = activeSection === 'all' ? 'Tick a topic when you feel comfortable with it.' : 'Work through this section at your own pace.';
    els.resultCount.textContent = `Showing ${visible.length} of ${data.topics.length} topics`;
    els.emptyState.hidden = visible.length !== 0;
    els.topicList.hidden = visible.length === 0;
    const groups = activeSection === 'all' ? data.sections : data.sections.filter(s => s.id === Number(activeSection));
    els.topicList.innerHTML = groups.map(section => {
      const items = visible.filter(t => t.sectionId === section.id);
      if (!items.length) return '';
      const allInSection = data.topics.filter(t => t.sectionId === section.id);
      const done = countTopics(allInSection);
      const isCollapsed = collapsed.has(section.id);
      const title = section.title.replace(/^\d+\.\s*/, '');
      const rows = items.map(t => {
        const isDone = !!completed.get(t.id);
        const priorityClass = t.priority === 'Must' ? 'tag-must' : t.priority === 'Good to have' ? 'tag-good' : 'tag-skip';
        const source = t.source && t.source !== 'Original' ? `<span class="tag tag-source">${escapeHtml(t.source)}</span>` : '';
        const state = isDone ? '<span class="done-label">✓ Done</span>' : '<span class="todo-label">Not done</span>';
        return `<label class="topic-row ${isDone ? 'completed' : ''}"><input class="topic-check" type="checkbox" data-topic-id="${t.id}" ${isDone ? 'checked' : ''} aria-label="Mark ${escapeAttr(t.title)} as completed"><span class="topic-copy"><span class="topic-name">${escapeHtml(t.title)}</span><span class="topic-meta"><span class="topic-id">${escapeHtml(t.number)}</span><span class="tag ${priorityClass}">${escapeHtml(t.priority)}</span>${source}</span></span>${state}</label>`;
      }).join('');
      return `<section class="topic-group ${isCollapsed ? 'collapsed' : ''}" data-group-id="${section.id}"><button type="button" class="group-header" data-toggle-section="${section.id}" aria-expanded="${!isCollapsed}"><span class="group-number">${escapeHtml(section.number)}</span><span class="group-title-wrap"><span class="group-title">${escapeHtml(title)}</span><span class="group-meta"><span>${done}/${allInSection.length} complete</span><span class="mini-track"><span class="mini-fill" style="display:block;width:${allInSection.length ? done / allInSection.length * 100 : 0}%"></span></span></span></span><span class="group-count">${items.length} topics</span><span class="chevron">⌄</span></button><div class="group-items">${rows}</div></section>`;
    }).join('');
    els.collapseBtn.textContent = visible.length && groups.every(s => collapsed.has(s.id) || !visible.some(t => t.sectionId === s.id)) ? 'Expand all' : 'Collapse all';
  }
  function render() { stats(); renderSectionNav(); renderTopics(); }
  function clearFilters() { els.searchInput.value = ''; els.statusFilter.value = 'all'; els.priorityFilter.value = 'all'; }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-section]');
    if (nav) { activeSection = nav.dataset.section === 'all' ? 'all' : Number(nav.dataset.section); render(); return; }
    const toggle = event.target.closest('[data-toggle-section]');
    if (toggle) { const id = Number(toggle.dataset.toggleSection); collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderTopics(); }
  });
  els.topicList.addEventListener('change', event => {
    const checkbox = event.target.closest('[data-topic-id]');
    if (!checkbox) return;
    const id = Number(checkbox.dataset.topicId);
    if (!initial.has(id)) return;
    completed.set(id, checkbox.checked);
    saveProgress(); render();
  });
  [els.searchInput, els.statusFilter, els.priorityFilter].forEach(el => el.addEventListener(el === els.searchInput ? 'input' : 'change', renderTopics));
  els.resetFiltersBtn.addEventListener('click', () => { clearFilters(); activeSection = 'all'; render(); });
  els.emptyClearBtn.addEventListener('click', () => { clearFilters(); activeSection = 'all'; render(); });
  els.collapseBtn.addEventListener('click', () => {
    const visible = visibleTopics();
    const ids = [...new Set(visible.map(t => t.sectionId))];
    const allCollapsed = ids.length > 0 && ids.every(id => collapsed.has(id));
    ids.forEach(id => allCollapsed ? collapsed.delete(id) : collapsed.add(id));
    renderTopics();
  });
  $('resetProgressBtn').addEventListener('click', () => els.resetDialog.showModal());
  $('exportBtn').addEventListener('click', () => {
    const exportData = { exportedAt: new Date().toISOString(), topics: data.topics.map(t => ({ number: t.number, title: t.title, priority: t.priority, done: !!completed.get(t.id) })) };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'javascript-progress.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('Progress exported as a JSON file.');
  });
  $('resetFiltersBtn').addEventListener('contextmenu', e => e.preventDefault());
  $('confirmResetBtn').addEventListener('click', event => {
    event.preventDefault();
    completed = new Map(initial);
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { console.warn(err); }
    els.resetDialog.close(); render(); showToast('Progress restored to the original sheet values.');
  });
  // Reset is available from the keyboard shortcut Ctrl+Shift+R to avoid accidental clicks.
  document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') { event.preventDefault(); els.resetDialog.showModal(); }
  });

  loadProgress();
  render();
})();
