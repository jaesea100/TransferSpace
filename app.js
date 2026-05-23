/* ============ Supabase Client + Auth ============ */
const SUPABASE_URL = 'https://mbdxdrwnvdukkfseicfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZHhkcndudmR1a2tmc2VpY2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDAwNTAsImV4cCI6MjA5MjIxNjA1MH0.uwN_ZYS1F1sy9P-lsMaxHodonTlH5b2d70RETpOk78o';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT_USER = null;
let AUTH_MODE = 'signin'; // 'signin' or 'signup'
let AUTH_REQUIRED = true;

// --- Auth UI ---
function authDisplayName() {
  if (!CURRENT_USER) return '';
  const meta = CURRENT_USER.user_metadata || {};
  return meta.full_name || meta.name || CURRENT_USER.email?.split('@')[0] || 'Signed in';
}
function updateAuthUI() {
  const signedIn = Boolean(CURRENT_USER);
  const signInBtn = document.getElementById('topSignInBtn');
  const signOutBtn = document.getElementById('topSignOutBtn');
  const sbMenuSignIn = document.getElementById('sbMenuSignIn');
  const sbMenuSignOut = document.getElementById('sbMenuSignOut');
  const settingsSignInBtn = document.getElementById('settingsSignInBtn');
  const settingsSignOutBtn = document.getElementById('settingsSignOutBtn');
  const authStatus = document.getElementById('authStatus');
  const authStatusName = document.getElementById('authStatusName');
  const settingsWorkspaceStatus = document.getElementById('settingsWorkspaceStatus');
  const settingsSessionPill = document.getElementById('settingsSessionPill');
  const sbUser = document.getElementById('sbUser');
  const sbAvatar = document.getElementById('sbAvatar');
  const sbUserName = document.getElementById('sbUserName');
  const sbUserSub = document.getElementById('sbUserSub');
  const profileAvatar = document.getElementById('profileAvatar');
  if (signInBtn) signInBtn.style.display = signedIn ? 'none' : '';
  if (signOutBtn) signOutBtn.style.display = 'none';
  if (sbMenuSignIn) sbMenuSignIn.style.display = signedIn ? 'none' : '';
  if (sbMenuSignOut) sbMenuSignOut.style.display = signedIn ? '' : 'none';
  if (settingsSignInBtn) settingsSignInBtn.style.display = signedIn ? 'none' : '';
  if (settingsSignOutBtn) settingsSignOutBtn.style.display = signedIn ? '' : 'none';
  if (authStatus) authStatus.style.display = signedIn ? 'inline-flex' : 'none';
  if (authStatusName) authStatusName.textContent = authDisplayName();
  if (settingsWorkspaceStatus) settingsWorkspaceStatus.textContent = signedIn ? 'Private sync' : 'Local preview';
  if (settingsSessionPill) settingsSessionPill.textContent = signedIn ? 'Signed in' : 'Signed out';
  if (sbUser) {
    sbUser.title = signedIn ? 'Account menu' : 'Sign in';
    sbUser.onclick = toggleUserMenu;
  }
  if (!signedIn) {
    if (sbAvatar) {
      sbAvatar.textContent = 'TS';
      sbAvatar.style.background = '';
    }
    if (profileAvatar) {
      profileAvatar.textContent = 'TS';
      profileAvatar.style.background = '';
    }
    if (sbUserName) sbUserName.textContent = 'Not signed in';
    if (sbUserSub) sbUserSub.textContent = 'Sign in to sync';
  }
}
function toggleUserMenu(event) {
  event?.stopPropagation();
  const menu = document.getElementById('sbUserMenu');
  const trigger = document.getElementById('sbUser');
  if (!menu) return;
  const isOpen = menu.classList.toggle('active');
  trigger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
function closeUserMenu() {
  document.getElementById('sbUserMenu')?.classList.remove('active');
  document.getElementById('sbUser')?.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', function(event) {
  const menu = document.getElementById('sbUserMenu');
  const trigger = document.getElementById('sbUser');
  if (!menu || !menu.classList.contains('active')) return;
  if (menu.contains(event.target) || trigger?.contains(event.target)) return;
  closeUserMenu();
});
function showAuthModal(required = true) {
  AUTH_REQUIRED = required;
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('active'));
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  errEl.style.color = '';
  errEl.style.background = '';
}
function hideAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('active');
  modal.style.display = 'none';
}
function toggleAuthMode(e) {
  e.preventDefault();
  AUTH_MODE = AUTH_MODE === 'signin' ? 'signup' : 'signin';
  document.getElementById('authTitle').textContent = AUTH_MODE === 'signin' ? 'Sign in to TransferSpace' : 'Create your account';
  document.getElementById('authSubtitle').textContent = AUTH_MODE === 'signin' ? 'Your essays, documents, and applications — synced and secure.' : 'Start organizing your transfer journey.';
  document.getElementById('authSubmitBtn').textContent = AUTH_MODE === 'signin' ? 'Sign in' : 'Create account';
  document.getElementById('authToggleText').textContent = AUTH_MODE === 'signin' ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authToggleLink').textContent = AUTH_MODE === 'signin' ? 'Sign up' : 'Sign in';
  document.getElementById('authError').style.display = 'none';
}
async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  btn.disabled = true;
  btn.textContent = AUTH_MODE === 'signin' ? 'Signing in…' : 'Creating account…';
  errEl.style.display = 'none';
  try {
    let result;
    if (AUTH_MODE === 'signup') {
      result = await sb.auth.signUp({ email, password });
    } else {
      result = await sb.auth.signInWithPassword({ email, password });
    }
    if (result.error) throw result.error;
    // Handle email confirmation requirement for signups
    if (AUTH_MODE === 'signup' && result.data.user && !result.data.session) {
      errEl.textContent = 'Check your email to confirm your account, then sign in.';
      errEl.style.display = 'block';
      errEl.style.color = 'var(--success)';
      errEl.style.background = 'color-mix(in srgb, var(--success) 8%, var(--bg-surface))';
      AUTH_MODE = 'signin';
      document.getElementById('authSubmitBtn').textContent = 'Sign in';
      document.getElementById('authToggleText').textContent = "Don't have an account?";
      document.getElementById('authToggleLink').textContent = 'Sign up';
      document.getElementById('authTitle').textContent = 'Sign in to TransferSpace';
      btn.disabled = false;
      btn.textContent = 'Sign in';
      return;
    }
    CURRENT_USER = result.data.user;
    hideAuthModal();
    await onAuthSuccess();
  } catch (err) {
    errEl.textContent = err.message || 'Authentication failed.';
    errEl.style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = AUTH_MODE === 'signin' ? 'Sign in' : 'Create account';
}
async function signInWithProvider(provider) {
  const errEl = document.getElementById('authError');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.style.color = '';
    errEl.style.background = '';
  }
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.href.split('#')[0],
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      },
    });
    if (error) throw error;
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || `Could not start ${provider} sign in.`;
      errEl.style.display = 'block';
    } else {
      toast(`Could not start ${provider} sign in.`);
    }
  }
}
async function signOut() {
  closeUserMenu();
  const { error } = await sb.auth.signOut();
  if (error) {
    toast('Sign out failed: ' + error.message);
    return;
  }
  CURRENT_USER = null;
  if (NOTIF_CHANNEL) { sb.removeChannel(NOTIF_CHANNEL); NOTIF_CHANNEL = null; }
  NOTIFS = [];
  updateNotifBadge();
  resetPersonalWorkspace();
  renderWorkspaceViews();
  goto('applications');
  toast('Signed out.');
}
async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    CURRENT_USER = session.user;
    return true;
  }
  return false;
}
async function onAuthSuccess() {
  const app = document.getElementById('view-app');
  app?.classList.add('active');
  document.documentElement.classList.add('in-app');
  loadCurrentUserWorkspace();
  await loadSchoolsFromDB();
  renderWorkspaceViews();
  goto('applications');
  updateAuthUI();
  toast(`Welcome back${CURRENT_USER.email ? ', ' + CURRENT_USER.email.split('@')[0] : ''}!`);
  loadAllDocumentsData();
  loadBookmarks();
  loadDecisions().then(() => patchKanbanCards());
  loadProfile();
  populateFitMajorOptions();
  maybeShowFirstLoginHelp();
  // Notifications
  syncNotifPrefs();
  loadNotifications();
  subscribeNotifications();
  setTimeout(checkAndSendDeadlineEmails, 3000); // run after school data loads
}

// --- Documents Data Layer ---
let DB_ESSAYS = [];
let DB_DOCUMENTS = [];
let DB_LORS = [];

async function loadAllDocumentsData() {
  if (!CURRENT_USER) return;
  const [essaysRes, docsRes, lorsRes] = await Promise.all([
    sb.from('essays').select('*').eq('user_id', CURRENT_USER.id).order('updated_at', { ascending: false }),
    sb.from('documents').select('*').eq('user_id', CURRENT_USER.id).order('created_at', { ascending: false }),
    sb.from('lors').select('*').eq('user_id', CURRENT_USER.id).order('created_at', { ascending: false }),
  ]);
  DB_ESSAYS = essaysRes.data || [];
  DB_DOCUMENTS = docsRes.data || [];
  DB_LORS = lorsRes.data || [];
  renderDocumentsPage();
}

// --- Essay CRUD ---
let AUTOSAVE_TIMER = null;
let CURRENT_ESSAY_ID = null;

async function createEssay(data = {}) {
  if (!CURRENT_USER) return null;
  const row = {
    user_id: CURRENT_USER.id,
    title: data.title || 'Untitled Essay',
    school: data.school || '',
    target_words: data.target_words || 500,
    body: data.body || '',
    tags: data.tags || [],
    status: 'draft',
    version: 1,
  };
  const { data: inserted, error } = await sb.from('essays').insert(row).select().single();
  if (error) { toast('Error creating essay: ' + error.message); return null; }
  // Save initial version
  await sb.from('essay_versions').insert({
    essay_id: inserted.id, version: 1, body: inserted.body,
    word_count: inserted.body.trim() ? inserted.body.trim().split(/\s+/).length : 0,
  });
  DB_ESSAYS.unshift(inserted);
  renderDocumentsPage();
  return inserted;
}

async function updateEssay(id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data: updated, error } = await sb.from('essays').update(updates).eq('id', id).select().single();
  if (error) { toast('Error saving: ' + error.message); return null; }
  const idx = DB_ESSAYS.findIndex(e => e.id === id);
  if (idx >= 0) DB_ESSAYS[idx] = updated;
  return updated;
}

async function saveEssayVersion(essayId, body) {
  const essay = DB_ESSAYS.find(e => e.id === essayId);
  if (!essay) return;
  const newVersion = essay.version + 1;
  await sb.from('essay_versions').insert({
    essay_id: essayId, version: newVersion, body,
    word_count: body.trim() ? body.trim().split(/\s+/).length : 0,
  });
  await updateEssay(essayId, { version: newVersion, body });
}

async function deleteEssay(id) {
  const { error } = await sb.from('essays').delete().eq('id', id);
  if (error) { toast('Error deleting: ' + error.message); return; }
  DB_ESSAYS = DB_ESSAYS.filter(e => e.id !== id);
  closeEssayEditor();
  renderDocumentsPage();
  toast('Essay deleted.');
}

async function loadEssayVersions(essayId) {
  const { data } = await sb.from('essay_versions').select('*').eq('essay_id', essayId).order('version', { ascending: false });
  return data || [];
}

function onEssaySchoolSelectChange() {
  const sel = document.getElementById('essaySchoolSelect');
  const customInput = document.getElementById('essaySchoolInput');
  if (!sel || !customInput) return;
  if (sel.value === '__custom__') {
    customInput.style.display = 'block';
    customInput.value = '';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = sel.value; // hidden value drives the saved school name
  }
  autosaveEssay();
}

function autosaveEssay() {
  if (AUTOSAVE_TIMER) clearTimeout(AUTOSAVE_TIMER);
  AUTOSAVE_TIMER = setTimeout(async () => {
    if (!CURRENT_ESSAY_ID) return;
    const body = document.getElementById('essayBody')?.value || '';
    const titleInput = document.getElementById('essayTitleInput')?.value || '';
    // School comes from the dropdown unless user picked "Other" (then the
    // text input takes over).
    const sel = document.getElementById('essaySchoolSelect');
    const customInput = document.getElementById('essaySchoolInput');
    let schoolInput = '';
    if (sel) {
      schoolInput = (sel.value === '__custom__')
        ? (customInput?.value || '')
        : sel.value;
    } else {
      schoolInput = customInput?.value || '';
    }
    const tagsInput = document.getElementById('essayTagsInput')?.value || '';
    const targetInput = parseInt(document.getElementById('essayTargetInput')?.value) || 500;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    await updateEssay(CURRENT_ESSAY_ID, { body, title: titleInput, school: schoolInput, tags, target_words: targetInput });
    const saveEl = document.getElementById('essaySaveStatus');
    if (saveEl) {
      saveEl.textContent = 'Saved just now';
      saveEl.style.color = 'var(--success)';
    }
  }, 1500);
}

// --- Document Upload ---
let UPLOAD_FILES = [];

function openUploadModal() {
  if (!CURRENT_USER) { showAuthModal(); return; }
  UPLOAD_FILES = [];
  document.getElementById('uploadFileList').innerHTML = '';
  document.getElementById('uploadSubmitBtn').disabled = true;
  document.getElementById('uploadModal').style.display = 'flex';
  // Setup drag and drop
  const dz = document.getElementById('uploadDropzone');
  dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = 'var(--accent-primary)'; dz.style.background = 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-surface))'; };
  dz.ondragleave = () => { dz.style.borderColor = 'var(--border-strong)'; dz.style.background = ''; };
  dz.ondrop = (e) => { e.preventDefault(); dz.style.borderColor = 'var(--border-strong)'; dz.style.background = ''; handleFileSelect({ target: { files: e.dataTransfer.files } }); };
}
function closeUploadModal() { document.getElementById('uploadModal').style.display = 'none'; UPLOAD_FILES = []; }

function handleFileSelect(e) {
  const newFiles = Array.from(e.target.files);
  UPLOAD_FILES = [...UPLOAD_FILES, ...newFiles];
  renderUploadFileList();
  document.getElementById('uploadSubmitBtn').disabled = UPLOAD_FILES.length === 0;
}
function removeUploadFile(idx) {
  UPLOAD_FILES.splice(idx, 1);
  renderUploadFileList();
  document.getElementById('uploadSubmitBtn').disabled = UPLOAD_FILES.length === 0;
}
function renderUploadFileList() {
  const el = document.getElementById('uploadFileList');
  if (UPLOAD_FILES.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = UPLOAD_FILES.map((f, i) => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:.5rem .6rem; background:var(--bg-inset); border-radius:var(--radius-sm); margin-bottom:.4rem;">
      <div style="font-size:.88rem;"><strong>${f.name}</strong> <span style="color:var(--text-muted); margin-left:.5rem;">${(f.size/1024).toFixed(0)} KB</span></div>
      <button class="btn btn-danger btn-sm" style="padding:.2rem .5rem;" onclick="removeUploadFile(${i})">✕</button>
    </div>
  `).join('');
}

async function submitUpload() {
  if (!CURRENT_USER || UPLOAD_FILES.length === 0) return;
  const btn = document.getElementById('uploadSubmitBtn');
  btn.disabled = true; btn.textContent = 'Uploading…';
  const category = document.getElementById('uploadCategory').value;
  const tags = document.getElementById('uploadTags').value.split(',').map(t => t.trim()).filter(Boolean);

  for (const file of UPLOAD_FILES) {
    const ext = file.name.split('.').pop().toLowerCase();
    const storagePath = `${CURRENT_USER.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await sb.storage.from('documents').upload(storagePath, file);
    if (upErr) { toast(`Upload failed for ${file.name}: ${upErr.message}`); continue; }

    const { data: docRow, error: dbErr } = await sb.from('documents').insert({
      user_id: CURRENT_USER.id,
      name: file.name,
      category,
      file_type: ext.toUpperCase(),
      file_size: file.size,
      storage_path: storagePath,
      tags,
    }).select().single();
    if (!dbErr && docRow) DB_DOCUMENTS.unshift(docRow);
  }
  toast(`${UPLOAD_FILES.length} file(s) uploaded.`);
  UPLOAD_FILES = [];
  closeUploadModal();
  renderDocumentsPage();
  btn.disabled = false; btn.textContent = 'Upload files';
}

async function deleteDocument(id) {
  const doc = DB_DOCUMENTS.find(d => d.id === id);
  if (!doc) return;
  if (doc.storage_path) await sb.storage.from('documents').remove([doc.storage_path]);
  await sb.from('documents').delete().eq('id', id);
  DB_DOCUMENTS = DB_DOCUMENTS.filter(d => d.id !== id);
  renderDocumentsPage();
  toast('Document deleted.');
}

async function getDocumentUrl(storagePath) {
  const { data } = await sb.storage.from('documents').createSignedUrl(storagePath, 3600);
  return data?.signedUrl || '#';
}

// --- LOR CRUD ---
function openLorModal(lorId = null) {
  if (!CURRENT_USER) { showAuthModal(); return; }
  document.getElementById('lorEditId').value = lorId || '';
  document.getElementById('lorModalTitle').textContent = lorId ? 'Edit Letter of Recommendation' : 'Request a Letter of Recommendation';
  if (lorId) {
    const lor = DB_LORS.find(l => l.id === lorId);
    if (lor) {
      document.getElementById('lorName').value = lor.recommender_name;
      document.getElementById('lorEmail').value = lor.recommender_email || '';
      document.getElementById('lorRole').value = lor.recommender_role || '';
      document.getElementById('lorSchools').value = (lor.schools || []).join(', ');
      document.getElementById('lorStatus').value = lor.status;
    }
  } else {
    document.getElementById('lorForm').reset();
  }
  document.getElementById('lorModal').style.display = 'flex';
}
function closeLorModal() { document.getElementById('lorModal').style.display = 'none'; }

async function handleLorSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('lorEditId').value;
  const data = {
    recommender_name: document.getElementById('lorName').value.trim(),
    recommender_email: document.getElementById('lorEmail').value.trim(),
    recommender_role: document.getElementById('lorRole').value.trim(),
    schools: document.getElementById('lorSchools').value.split(',').map(s => s.trim()).filter(Boolean),
    status: document.getElementById('lorStatus').value,
    updated_at: new Date().toISOString(),
  };
  // Set timestamp fields based on status
  if (data.status === 'requested' && !editId) data.requested_at = new Date().toISOString();
  if (data.status === 'confirmed') data.confirmed_at = new Date().toISOString();
  if (data.status === 'submitted') data.submitted_at = new Date().toISOString();

  if (editId) {
    const { data: updated, error } = await sb.from('lors').update(data).eq('id', editId).select().single();
    if (error) { toast('Error: ' + error.message); return; }
    const idx = DB_LORS.findIndex(l => l.id === editId);
    if (idx >= 0) DB_LORS[idx] = updated;
    toast('LOR updated.');
  } else {
    data.user_id = CURRENT_USER.id;
    const { data: inserted, error } = await sb.from('lors').insert(data).select().single();
    if (error) { toast('Error: ' + error.message); return; }
    DB_LORS.unshift(inserted);
    toast('LOR request saved.');
  }
  closeLorModal();
  renderDocumentsPage();
}

async function deleteLor(id) {
  await sb.from('lors').delete().eq('id', id);
  DB_LORS = DB_LORS.filter(l => l.id !== id);
  renderDocumentsPage();
  toast('LOR removed.');
}

function lorStatusTag(status) {
  const map = {
    not_requested: { cls: 'muted', label: 'Not requested' },
    requested: { cls: 'warm', label: 'Requested' },
    confirmed: { cls: 'success', label: 'Confirmed' },
    submitted: { cls: 'success', label: 'Submitted' },
  };
  const s = map[status] || map.not_requested;
  return `<span class="tag ${s.cls}">${s.label}</span>`;
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- Dynamic Rendering ---
function renderDocumentsPage() {
  renderEssayCards();
  renderDocumentCards();
  renderLorRows();
  refreshDocsCounts();
}

function renderEssayCards() {
  const grid = document.querySelector('[data-docs-section="essays"] .doc-grid');
  const countEl = document.querySelector('[data-docs-section="essays"] .ds-count');
  const notebookCountEl = document.querySelector('[data-docs-section="essays"] .ds-notebook-count');
  if (!grid) return;
  if (countEl) countEl.textContent = DB_ESSAYS.length;
  const groupsForCount = DB_ESSAYS.length ? groupEssaysBySchool(DB_ESSAYS) : [];
  if (notebookCountEl) notebookCountEl.textContent = groupsForCount.length;
  if (DB_ESSAYS.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:.9rem; padding:1rem 0;">No notebooks yet. Click "+ New notebook" to start one.</div>';
    return;
  }
  const groups = groupsForCount;
  grid.innerHTML = groups.map((group) => {
    const colors = schoolNotebookColors(group.school);
    const coverStyle = `--nb-cover:${colors.cover}; --nb-spine:${colors.spine}; --nb-ink:${colors.ink};`;
    const safeKey = encodeURIComponent(group.school);
    return `
      <button type="button" class="doc-card essay-notebook" style="${coverStyle}" data-doc-cat="essays" data-title="${group.school}" onclick="openNotebookView('${safeKey}')">
        <span class="notebook-rings" aria-hidden="true"></span>
        <span class="notebook-spine" aria-hidden="true"></span>
        <span class="notebook-cover-title">${group.school}</span>
      </button>
    `;
  }).join('');
}

function essayWordCount(essay) {
  return essay?.body && essay.body.trim() ? essay.body.trim().split(/\s+/).length : 0;
}

function cleanEssaySchoolName(value) {
  const raw = (value || '').trim();
  if (!raw) return 'General essays';
  const beforeDot = raw.split(/[·|]/)[0].trim();
  const beforeDash = beforeDot.split(/\s[-–]\s/)[0].trim();
  return beforeDash || raw;
}

function notebookInitials(label) {
  if (!label || label === 'General essays') return 'TS';
  return label
    .replace(/university|college|the|of|at|and/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || label.slice(0, 2).toUpperCase();
}

/* School → notebook cover colors. Falls back to user accent for unknown schools. */
const SCHOOL_NOTEBOOK_COLORS = {
  'michigan':       { cover: '#00274C', spine: '#FFCB05', ink: '#FFCB05' }, // maize/blue
  'rice':           { cover: '#00205B', spine: '#C1C6C8', ink: '#FFFFFF' }, // navy/grey
  'berkeley':       { cover: '#003262', spine: '#FDB515', ink: '#FDB515' }, // cal blue/gold
  'ucla':           { cover: '#2774AE', spine: '#FFD100', ink: '#FFD100' },
  'usc':            { cover: '#990000', spine: '#FFCC00', ink: '#FFCC00' },
  'stanford':       { cover: '#8C1515', spine: '#FFFFFF', ink: '#FFFFFF' },
  'harvard':        { cover: '#A51C30', spine: '#FFFFFF', ink: '#FFFFFF' },
  'yale':           { cover: '#00356B', spine: '#FFFFFF', ink: '#FFFFFF' },
  'princeton':      { cover: '#E77500', spine: '#000000', ink: '#000000' },
  'brown':          { cover: '#4E3629', spine: '#ED1C24', ink: '#FFFFFF' },
  'cornell':        { cover: '#B31B1B', spine: '#FFFFFF', ink: '#FFFFFF' },
  'dartmouth':      { cover: '#00693E', spine: '#FFFFFF', ink: '#FFFFFF' },
  'columbia':       { cover: '#004B87', spine: '#9BCBEB', ink: '#FFFFFF' },
  'penn':           { cover: '#011F5B', spine: '#990000', ink: '#FFFFFF' },
  'mit':            { cover: '#8A8B8C', spine: '#A31F34', ink: '#FFFFFF' },
  'caltech':        { cover: '#FF6C0C', spine: '#76777B', ink: '#FFFFFF' },
  'duke':           { cover: '#001A57', spine: '#FFFFFF', ink: '#FFFFFF' },
  'jhu':            { cover: '#002D72', spine: '#68ACE5', ink: '#FFFFFF' },
  'johns hopkins':  { cover: '#002D72', spine: '#68ACE5', ink: '#FFFFFF' },
  'northwestern':   { cover: '#4E2A84', spine: '#FFFFFF', ink: '#FFFFFF' },
  'chicago':        { cover: '#800000', spine: '#FFFFFF', ink: '#FFFFFF' },
  'notre dame':     { cover: '#0C2340', spine: '#C99700', ink: '#C99700' },
  'georgetown':     { cover: '#041E42', spine: '#8C8C8C', ink: '#FFFFFF' },
  'vanderbilt':     { cover: '#000000', spine: '#CFAE70', ink: '#CFAE70' },
  'emory':          { cover: '#012169', spine: '#B58500', ink: '#FFFFFF' },
  'nyu':            { cover: '#57068C', spine: '#FFFFFF', ink: '#FFFFFF' },
  'cmu':            { cover: '#C41230', spine: '#000000', ink: '#FFFFFF' },
  'carnegie':       { cover: '#C41230', spine: '#000000', ink: '#FFFFFF' },
  'tufts':          { cover: '#3E8EDE', spine: '#82C341', ink: '#FFFFFF' },
  'bu':             { cover: '#CC0000', spine: '#FFFFFF', ink: '#FFFFFF' },
  'boston univ':    { cover: '#CC0000', spine: '#FFFFFF', ink: '#FFFFFF' },
  'boston college': { cover: '#8A100B', spine: '#BC9B6A', ink: '#FFFFFF' },
  'tulane':         { cover: '#006747', spine: '#418FDE', ink: '#FFFFFF' },
  'unc':            { cover: '#7BAFD4', spine: '#FFFFFF', ink: '#13294B' },
  'uva':            { cover: '#232D4B', spine: '#E57200', ink: '#E57200' },
  'virginia':       { cover: '#232D4B', spine: '#E57200', ink: '#E57200' },
  'florida':        { cover: '#0021A5', spine: '#FA4616', ink: '#FA4616' },
  'georgia tech':   { cover: '#B3A369', spine: '#003057', ink: '#003057' },
  'texas':          { cover: '#BF5700', spine: '#FFFFFF', ink: '#FFFFFF' },
  'ut austin':      { cover: '#BF5700', spine: '#FFFFFF', ink: '#FFFFFF' },
  'wisconsin':      { cover: '#C5050C', spine: '#FFFFFF', ink: '#FFFFFF' },
  'illinois':       { cover: '#13294B', spine: '#E84A27', ink: '#E84A27' },
  'washu':          { cover: '#A51417', spine: '#003B49', ink: '#FFFFFF' },
  'rutgers':        { cover: '#CC0033', spine: '#FFFFFF', ink: '#FFFFFF' },
  'ohio':           { cover: '#BB0000', spine: '#666666', ink: '#FFFFFF' },
  'uc san diego':   { cover: '#182B49', spine: '#FFCD00', ink: '#FFCD00' },
  'uc santa barbara':{cover: '#003660', spine: '#FEBC11', ink: '#FEBC11' },
  'uc santa cruz':  { cover: '#003C6C', spine: '#FDC700', ink: '#FDC700' },
  'uc irvine':      { cover: '#0064A4', spine: '#FFD200', ink: '#FFD200' },
  'uc davis':       { cover: '#022851', spine: '#FFBF00', ink: '#FFBF00' },
  'uc riverside':   { cover: '#003DA5', spine: '#FFB81C', ink: '#FFB81C' },
};

function schoolNotebookColors(label) {
  // General essays → use user's accent color from the runtime CSS variable.
  if (!label || label === 'General essays') {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1A3EBF';
    return { cover: accent, spine: '#F9F8F3', ink: '#FFFFFF' };
  }
  const key = label.toLowerCase();
  // Try direct key, then partial-match (e.g. "U Michigan" → "michigan").
  if (SCHOOL_NOTEBOOK_COLORS[key]) return SCHOOL_NOTEBOOK_COLORS[key];
  for (const k of Object.keys(SCHOOL_NOTEBOOK_COLORS)) {
    if (key.includes(k)) return SCHOOL_NOTEBOOK_COLORS[k];
  }
  // Fallback — accent color.
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1A3EBF';
  return { cover: accent, spine: '#F9F8F3', ink: '#FFFFFF' };
}

function groupEssaysBySchool(essays) {
  const map = new Map();
  essays.forEach(essay => {
    const school = cleanEssaySchoolName(essay.school);
    if (!map.has(school)) {
      map.set(school, { school, initials: notebookInitials(school), essays: [] });
    }
    map.get(school).essays.push(essay);
  });
  return Array.from(map.values()).map(group => {
    group.essays.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    return group;
  });
}

/* =============== Notebook picker (create new notebook) =============== */
function notebookSchoolOptions() {
  // Schools the user is already tracking become first-class options.
  const tracked = USER_APPS
    .map(a => byId(a.id))
    .filter(Boolean)
    .map(s => s.short || s.name);
  // Schools that already have a notebook — to avoid duplicates we still
  // show them but mark them so the user knows.
  const existing = new Set(
    DB_ESSAYS.map(e => cleanEssaySchoolName(e.school))
  );
  const seen = new Set();
  const opts = [];
  opts.push({ value: '__general__', label: 'General essays' });
  tracked.forEach(name => {
    if (seen.has(name)) return;
    seen.add(name);
    const taken = existing.has(name) ? ' · already started' : '';
    opts.push({ value: name, label: `${name}${taken}` });
  });
  opts.push({ value: '__custom__', label: 'Other (type a name)…' });
  return opts;
}

function openNotebookPicker() {
  if (!CURRENT_USER) { showAuthModal(); return; }
  const select = document.getElementById('notebookPickerSchool');
  if (!select) return;
  const opts = notebookSchoolOptions();
  select.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  // Wire the "Other" option to reveal a custom-name input.
  select.onchange = () => {
    document.getElementById('notebookPickerCustomWrap').style.display =
      select.value === '__custom__' ? 'block' : 'none';
  };
  document.getElementById('notebookPickerCustomWrap').style.display = 'none';
  document.getElementById('notebookPickerCustom').value = '';
  document.getElementById('notebookPickerModal').classList.add('active');
}

function closeNotebookPicker() {
  document.getElementById('notebookPickerModal')?.classList.remove('active');
}

/* Open a notebook → drawer listing every essay in that group */
function openNotebookView(encodedKey) {
  const school = decodeURIComponent(encodedKey || '');
  const groups = groupEssaysBySchool(DB_ESSAYS);
  const group = groups.find(g => g.school === school);
  if (!group) { toast('Notebook not found.'); return; }
  const colors = schoolNotebookColors(group.school);
  const totalWords = group.essays.reduce((sum, e) => sum + essayWordCount(e), 0);
  const totalTarget = group.essays.reduce((sum, e) => sum + (e.target_words || 500), 0);

  let bodyHtml = '';
  if (group.essays.length === 0) {
    bodyHtml = `
      <div class="notebook-view-empty">
        <div class="nve-icon" aria-hidden="true">✎</div>
        <div class="nve-title">No essays in this notebook yet.</div>
        <div class="nve-sub">Start your first draft to see it here.</div>
      </div>
    `;
  } else {
    bodyHtml = group.essays.map(e => {
      const wc = essayWordCount(e);
      const target = e.target_words || 500;
      const pct = target ? Math.min(100, Math.round((wc / target) * 100)) : 0;
      const statusKey = pct >= 100 ? 'done' : (pct >= 50 ? 'progress' : 'draft');
      const statusLabel = pct >= 100 ? 'Complete' : (pct >= 50 ? 'In progress' : 'Draft');
      const versionBadge = e.version > 1 ? `<span class="nvr-version">v${e.version}</span>` : '';
      const updatedLabel = timeAgo(e.updated_at || e.created_at) || 'just now';
      return `
        <button type="button" class="notebook-view-row" onclick="closeNotebookView(); openEssayEditor('${e.id}')">
          <div class="nvr-main">
            <div class="nvr-title-row">
              <span class="nvr-title">${e.title || 'Untitled Essay'}</span>
              ${versionBadge}
            </div>
            <div class="nvr-meta">
              <span>${wc}/${target} words</span>
              <span class="nvr-dot">·</span>
              <span>${updatedLabel}</span>
              <span class="nvr-status nvr-status-${statusKey}">${statusLabel}</span>
            </div>
            <div class="nvr-progress" aria-hidden="true"><span style="width:${pct}%; background:${colors.cover};"></span></div>
          </div>
          <div class="nvr-pct">${pct}<span>%</span></div>
        </button>
      `;
    }).join('');
  }

  const modal = document.getElementById('notebookViewModal');
  const card = modal.querySelector('.notebook-view-card');
  card.style.setProperty('--nb-cover', colors.cover);
  card.style.setProperty('--nb-ink', colors.ink);
  modal.querySelector('#notebookViewTitle').textContent = group.school;
  modal.querySelector('#notebookViewSummary').textContent = group.essays.length === 0
    ? 'Empty notebook'
    : `${group.essays.length} essay${group.essays.length === 1 ? '' : 's'} · ${totalWords}/${totalTarget} words`;
  modal.querySelector('#notebookViewList').innerHTML = bodyHtml;
  modal.querySelector('#notebookViewSchoolKey').value = group.school;
  modal.classList.add('active');
}

/* Delete every essay inside a notebook (the notebook disappears with them). */
async function deleteNotebookFromView() {
  const school = document.getElementById('notebookViewSchoolKey').value || '';
  const label = school || 'General essays';
  if (!confirm(`Delete the entire "${label}" notebook? Every essay inside will be permanently removed.`)) return;
  const groups = groupEssaysBySchool(DB_ESSAYS);
  const group = groups.find(g => g.school === school);
  if (!group) { closeNotebookView(); return; }
  // Delete each essay row in Supabase, then refresh once at the end.
  for (const essay of group.essays) {
    const { error } = await sb.from('essays').delete().eq('id', essay.id);
    if (error) { toast('Error deleting essay: ' + error.message); return; }
    DB_ESSAYS = DB_ESSAYS.filter(e => e.id !== essay.id);
  }
  closeNotebookView();
  toast(`Deleted ${label} notebook.`);
  renderDocumentsPage();
}

function closeNotebookView() {
  document.getElementById('notebookViewModal')?.classList.remove('active');
}

function notebookViewAddEssay() {
  const school = document.getElementById('notebookViewSchoolKey').value || '';
  const realSchool = (school === 'General essays') ? '' : school;
  closeNotebookView();
  createEssay({ school: realSchool, title: 'Untitled Essay', target_words: 500 })
    .then(essay => { if (essay) openEssayEditor(essay.id); });
}

async function createNotebookFromPicker() {
  const select = document.getElementById('notebookPickerSchool');
  if (!select) return;
  let school = select.value;
  if (school === '__general__') school = '';
  if (school === '__custom__') {
    const custom = document.getElementById('notebookPickerCustom').value.trim();
    if (!custom) { toast('Type a name for the notebook.'); return; }
    school = custom;
  }
  // A notebook is just the school grouping of its essays — create one
  // starter essay so the notebook appears immediately.
  const essay = await createEssay({
    title: 'Untitled Essay',
    school: school,
    target_words: 500,
  });
  closeNotebookPicker();
  if (essay) openEssayEditor(essay.id);
}

function classifyTranscriptDoc(doc) {
  const name = (doc.name || doc.file_name || '').toLowerCase();
  if (/midterm|mid.term|mid.report|semester.grade/i.test(name)) return 'midterm';
  if (/sat|act|test.?score|exam.?score|standardized/i.test(name)) return 'testscores';
  if (/transcript|official/i.test(name)) return 'transcript';
  return null;
}

function syncRequiredDocs() {
  const transcripts = DB_DOCUMENTS.filter(d => d.category === 'transcripts');
  const detected = { transcript: false, midterm: false, testscores: false };
  transcripts.forEach(doc => {
    const type = classifyTranscriptDoc(doc);
    if (type) detected[type] = true;
  });
  // Any unclassified transcript upload counts as an official transcript
  if (transcripts.length > 0 && !detected.transcript && !detected.midterm && !detected.testscores) {
    detected.transcript = true;
  }
  ['transcript', 'midterm', 'testscores'].forEach(type => {
    const card = document.querySelector(`#requiredDocsList .vault-card[data-doc="${type}"]`);
    if (!card) return;
    const icon = card.querySelector('.vc-icon');
    const isNow = detected[type];
    const was = card.classList.contains('verified');
    if (isNow === was) return;
    card.classList.toggle('verified', isNow);
    if (icon) { icon.classList.toggle('pending-icon', !isNow); icon.classList.toggle('verified-icon', isNow); }
  });
}

function renderDocumentCards() {
  // Render transcripts
  const tGrid = document.querySelector('[data-docs-section="transcripts"] .doc-grid');
  const tCount = document.querySelector('[data-docs-section="transcripts"] .ds-count');
  const transcripts = DB_DOCUMENTS.filter(d => d.category === 'transcripts');
  if (tGrid) {
    if (tCount) tCount.textContent = transcripts.length;
    if (transcripts.length === 0) {
      tGrid.innerHTML = '<div class="transcript-empty-hint">Upload transcripts above — they\'ll appear here.</div>';
    } else {
      tGrid.innerHTML = transcripts.map(d => docCardHTML(d, 'transcripts')).join('');
    }
  }
  syncRequiredDocs();
  // Render activities
  const aGrid = document.querySelector('[data-docs-section="activities"] .doc-grid');
  const aCount = document.querySelector('[data-docs-section="activities"] .ds-count');
  const activities = DB_DOCUMENTS.filter(d => d.category === 'activities');
  if (aGrid) {
    if (aCount) aCount.textContent = activities.length;
    if (activities.length === 0) {
      aGrid.innerHTML = '<div style="color:var(--text-muted); font-size:.9rem; padding:1rem 0;">No activity documents yet.</div>';
    } else {
      aGrid.innerHTML = activities.map(d => docCardHTML(d, 'activities')).join('');
    }
  }
}

function docCardHTML(d, cat) {
  const isPdf = (d.file_type || '').toUpperCase() === 'PDF';
  const tags = (d.tags || []).map(t => `<span class="dc-chip">${t}</span>`).join('');
  const sizeStr = d.file_size ? (d.file_size > 1048576 ? (d.file_size / 1048576).toFixed(1) + ' MB' : (d.file_size / 1024).toFixed(0) + ' KB') : '';
  return `
    <div class="doc-card ${isPdf ? 'pdf' : ''}" data-doc-cat="${cat}" data-title="${d.name}" onclick="previewDocument('${d.id}')">
      <div class="doc-icon">${d.file_type || 'FILE'}</div>
      <div class="dc-name">${d.name}</div>
      <div class="dc-meta">${d.file_type || ''} · ${sizeStr} · ${timeAgo(d.created_at)}</div>
      <div class="dc-chips">${tags}</div>
      <button class="btn btn-danger btn-sm" style="position:absolute; top:.5rem; right:.5rem; padding:.15rem .4rem; font-size:.75rem;" onclick="event.stopPropagation(); deleteDocument('${d.id}')">✕</button>
    </div>
  `;
}

async function previewDocument(id) {
  const doc = DB_DOCUMENTS.find(d => d.id === id);
  if (!doc || !doc.storage_path) { toast('No file available.'); return; }
  const url = await getDocumentUrl(doc.storage_path);
  if (!url || url === '#') { toast('Could not generate preview link.'); return; }

  document.getElementById('docPreviewTitle').textContent = doc.name;
  const sizeStr = doc.file_size ? (doc.file_size > 1048576 ? (doc.file_size/1048576).toFixed(1)+' MB' : (doc.file_size/1024).toFixed(0)+' KB') : '';
  document.getElementById('docPreviewMeta').textContent = `${doc.file_type || ''} ${sizeStr ? '· '+sizeStr : ''} · uploaded ${timeAgo(doc.created_at)}`;
  document.getElementById('docPreviewDownload').href = url;

  const content = document.getElementById('docPreviewContent');
  const ft = (doc.file_type || '').toUpperCase();
  if (ft === 'PDF') {
    content.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`;
  } else if (['PNG','JPG','JPEG','WEBP'].includes(ft)) {
    content.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain; padding:1rem;" alt="${doc.name}"/>`;
  } else {
    content.innerHTML = `
      <div style="text-align:center; padding:3rem;">
        <div style="font-size:2.5rem; margin-bottom:1rem; opacity:.4;">${ft || 'FILE'}</div>
        <div style="font-size:1.1rem; font-weight:500; margin-bottom:.5rem;">${doc.name}</div>
        <div style="color:var(--text-muted); margin-bottom:1.5rem;">This file type can't be previewed in the browser.</div>
        <a href="${url}" target="_blank" class="btn btn-primary btn-sm">Open in new tab ↗</a>
      </div>`;
  }
  document.getElementById('docPreviewModal').style.display = 'flex';
}
function closeDocPreview() { document.getElementById('docPreviewModal').style.display = 'none'; }

function renderLorRows() {
  const container = document.querySelector('[data-docs-section="lors"] .lor-list');
  const countEl = document.querySelector('[data-docs-section="lors"] .ds-count');
  if (!container) return;
  if (countEl) countEl.textContent = DB_LORS.length;
  if (DB_LORS.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-size:.9rem; padding:1rem 0;">No letters of recommendation yet.</div>';
    return;
  }
  container.innerHTML = DB_LORS.map(l => {
    const schools = (l.schools || []).join(' · ');
    const statusDate = l.submitted_at || l.confirmed_at || l.requested_at || l.created_at;
    return `
      <div class="lor-row" data-doc-cat="lors" data-title="${l.recommender_name}">
        <div>
          <div class="lor-name">${l.recommender_name}</div>
          <div class="lor-email">${l.recommender_email || ''} ${l.recommender_role ? '· ' + l.recommender_role : ''}</div>
        </div>
        <div>${lorStatusTag(l.status)} ${statusDate ? '<span style="color:var(--text-muted); font-size:.78rem; margin-left:.3rem;">' + timeAgo(statusDate) + '</span>' : ''}</div>
        <div class="mono text-muted" style="font-size: .82rem;">${schools || '—'}</div>
        <div style="display:flex; gap:.3rem;">
          <button class="btn btn-ghost btn-sm" onclick="openLorModal('${l.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLor('${l.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- Essay Editor (dynamic, Supabase-backed) ---
async function openEssayEditor(id) {
  if (!CURRENT_USER) { showAuthModal(); return; }

  // If no ID or 'new', create a new essay
  if (!id || id === 'new') {
    const essay = await createEssay();
    if (!essay) return;
    id = essay.id;
  }

  const e = DB_ESSAYS.find(es => es.id === id);
  if (!e) { toast('Essay not found.'); return; }

  CURRENT_ESSAY_ID = id;
  const wordCount = e.body && e.body.trim() ? e.body.trim().split(/\s+/).length : 0;
  const charCount = (e.body || '').length;
  const pct = Math.min(100, Math.round(wordCount / (e.target_words || 500) * 100));

  // Load version history
  const versions = await loadEssayVersions(id);
  const versionsHTML = versions.length > 0 ? versions.map((v, i) => `
    <div class="essay-version ${i === 0 ? 'current' : ''}" onclick="${i > 0 ? `restoreVersion('${id}','${v.id}')` : ''}" style="${i > 0 ? 'cursor:pointer;' : ''}">
      <span>v${v.version}${i === 0 ? ' — current' : ''}</span>
      <span>${timeAgo(v.created_at)}</span>
    </div>
  `).join('') : '<div style="color:var(--text-muted); font-size:.85rem;">No versions yet.</div>';

  // Build the school <select> with the user's tracked schools, the
  // current value (so existing essays keep their school), plus options
  // for "General essays" and a custom typed name.
  const trackedNames = USER_APPS
    .map(a => byId(a.id))
    .filter(Boolean)
    .map(s => s.short || s.name);
  const currentClean = cleanEssaySchoolName(e.school);
  const isGeneral = !e.school || currentClean === 'General essays';
  const isTracked = trackedNames.includes(currentClean);
  const schoolOpts = [];
  schoolOpts.push(`<option value="" ${isGeneral ? 'selected' : ''}>General essays</option>`);
  trackedNames.forEach(name => {
    schoolOpts.push(`<option value="${name}" ${name === currentClean ? 'selected' : ''}>${name}</option>`);
  });
  if (!isGeneral && !isTracked) {
    // Preserve whatever school the essay already has, even if untracked.
    schoolOpts.push(`<option value="${currentClean}" selected>${currentClean} (untracked)</option>`);
  }
  schoolOpts.push(`<option value="__custom__">Other (type below)…</option>`);

  document.getElementById('essayModalBox').innerHTML = `
    <div class="modal-head">
      <div style="flex:1;">
        <select id="essaySchoolSelect" onchange="onEssaySchoolSelectChange()" style="border:none; background:none; font-size:.78rem; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); font-weight:600; padding:0; margin-bottom:.3rem; cursor:pointer;">
          ${schoolOpts.join('')}
        </select>
        <input type="text" id="essaySchoolInput" value="${e.school || ''}" placeholder="Custom school or prompt type" oninput="autosaveEssay()" style="display:none; border:1px solid var(--border); background:var(--bg-surface); border-radius:var(--radius-sm); font-size:.78rem; color:var(--text-primary); width:100%; padding:.3rem .5rem; margin-bottom:.3rem;" />
        <input type="text" id="essayTitleInput" value="${e.title || ''}" placeholder="Essay title…" oninput="autosaveEssay()" style="border:none; background:none; font-size:1.2rem; font-weight:600; width:100%; padding:0; color:var(--text-primary);" />
      </div>
      <button class="drawer-close" onclick="closeEssayEditor()"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="essay-editor">
      <div class="essay-main">
        <div class="essay-sub">
          <span id="wcLive">${wordCount}</span> / <input type="number" id="essayTargetInput" value="${e.target_words || 500}" onchange="autosaveEssay()" style="border:none; background:none; width:3.5rem; text-align:center; font:inherit;" /> words · <span id="ccLive">${charCount}</span> chars ·
          <span class="text-success" id="essaySaveStatus">Saved ${timeAgo(e.updated_at)}</span>
        </div>
        <textarea class="essay-body" id="essayBody" oninput="onEssayInput()" placeholder="Start writing…">${e.body || ''}</textarea>
      </div>
      <aside class="essay-side">
        <h5>Details</h5>
        <div class="kv"><span class="mono">Target</span><span>${e.target_words || 500} words</span></div>
        <div class="kv"><span class="mono">Status</span><span>${e.status || 'draft'}</span></div>
        <div class="kv"><span class="mono">Completion</span><span id="pctLive">${pct}%</span></div>

        <h5 style="margin-top: 1.2rem;">Versions</h5>
        <div class="essay-versions">${versionsHTML}</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:.5rem; width:100%;" onclick="saveNewVersion()">+ Save new version</button>

        <h5 style="margin-top: 1.2rem;">Tags</h5>
        <div style="margin-bottom:.5rem;">
          <input type="text" id="essayTagsInput" value="${(e.tags || []).join(', ')}" placeholder="Add tags…" oninput="autosaveEssay()" style="border:1px solid var(--border); border-radius:var(--radius-sm); padding:.35rem .6rem; width:100%; font-size:.85rem;"/>
        </div>

        <div class="mt-2" style="display:flex; gap: .4rem; flex-direction: column;">
          <button class="btn btn-danger btn-sm" onclick="if(confirm('Delete this essay permanently?')) deleteEssay('${id}')">🗑 Delete essay</button>
        </div>
      </aside>
    </div>
  `;
  document.getElementById('essayModal').classList.add('active');
}

function onEssayInput() {
  const body = document.getElementById('essayBody');
  const wcEl = document.getElementById('wcLive');
  const target = parseInt(document.getElementById('essayTargetInput')?.value) || 500;
  if (!body || !wcEl) return;
  const v = body.value;
  const wc = v.trim() ? v.trim().split(/\s+/).length : 0;
  wcEl.textContent = wc;
  document.getElementById('ccLive').textContent = v.length;
  document.getElementById('pctLive').textContent = Math.min(100, Math.round(wc / target * 100)) + '%';
  // Color the word count based on proximity to target
  const ratio = wc / target;
  wcEl.className = ratio > 1 ? 'wc-over' : ratio >= 0.9 ? 'wc-warning' : 'wc-safe';
  document.getElementById('essaySaveStatus').textContent = 'Saving…';
  document.getElementById('essaySaveStatus').style.color = 'var(--text-muted)';
  autosaveEssay();
}

async function saveNewVersion() {
  if (!CURRENT_ESSAY_ID) return;
  const body = document.getElementById('essayBody')?.value || '';
  await saveEssayVersion(CURRENT_ESSAY_ID, body);
  toast('New version saved.');
  openEssayEditor(CURRENT_ESSAY_ID); // refresh to show new version
}

async function restoreVersion(essayId, versionId) {
  const { data: ver } = await sb.from('essay_versions').select('body').eq('id', versionId).single();
  if (!ver) return;
  await updateEssay(essayId, { body: ver.body });
  toast('Version restored.');
  openEssayEditor(essayId);
}

// Override enterApp to use auth
const _originalEnterApp = typeof enterApp === 'function' ? enterApp : null;

/* ============ verified school data ============ */
// Runtime school catalogue. Loaded from Supabase first, with schools-data.js as
// a verified CDS/official-page fallback for file:// use and restrictive RLS.
const SCHOOLS = [];
let SCHOOL_DATA_SOURCE = 'loading';
let SCHOOLS_LOADING = false;

// No starter applications. Real workspaces start empty.
const STARTER_APPS = [];
const USER_APPS = [];

const SCHOOL_ID_BY_IPEDS = {
  '204796':'ohio_state',
  '186380':'rutgers',
  '179867':'washu',
  '164924':'boston_college',
  '164988':'bu',
  '217156':'brown',
  '110404':'caltech',
  '211440':'cmu',
  '190150':'columbia',
  '190415':'cornell',
  '182670':'dartmouth',
  '198419':'duke',
  '139658':'emory',
  '131496':'georgetown',
  '139755':'gatech',
  '166027':'harvard',
  '162928':'jhu',
  '166683':'mit',
  '193900':'nyu',
  '147767':'northwestern',
  '186131':'princeton',
  '227757':'rice',
  '243744':'stanford',
  '168148':'tufts',
  '160755':'tulane',
  '110635':'berkeley',
  '110644':'ucd',
  '110653':'uci',
  '110662':'ucla',
  '110671':'ucr',
  '110680':'ucsd',
  '110705':'ucsb',
  '110714':'ucsc',
  '144050':'uchicago',
  '134130':'uf',
  '145637':'uiuc',
  '170976':'umich',
  '199120':'unc',
  '152080':'notredame',
  '215062':'upenn',
  '123961':'usc',
  '228778':'ut',
  '234076':'uva',
  '240444':'uw_madison',
  '221999':'vanderbilt',
  '130794':'yale',
  '164465':'amherst',
  '161004':'bowdoin',
  '126614':'cu_boulder',
  '168342':'williams',
};

const IVY_IPEDS = new Set(['190415','215062','166027','130794','190150','182670','217156','186131']);
const UC_IPEDS = new Set(['110635','110644','110653','110662','110671','110680','110705','110714']);

function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function boolOrNull(value) {
  if (value === true || value === false) return value;
  if (value === null || value === undefined || value === '') return null;
  return String(value).toLowerCase() === 'true';
}
function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return String(value).split(/[;,]/).map(v => v.trim()).filter(Boolean);
  }
}
function slugFromName(name) {
  return String(name || 'school').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function schoolIdForRow(row) {
  const ipeds = String(row.id || row.ipedsId || '');
  return SCHOOL_ID_BY_IPEDS[ipeds] || slugFromName(row.name || ipeds);
}
function tagsForRow(row) {
  const tags = [];
  const type = String(row.type || '').replace(' Non-Profit', '').replace(' For-Profit', '').trim();
  if (type) tags.push(type);
  if (IVY_IPEDS.has(String(row.id))) tags.push('Ivy');
  return tags.length ? tags : ['Institution'];
}
function transferTermsForRow(row) {
  return [
    boolOrNull(row.accepts_fall) ? 'Fall' : '',
    boolOrNull(row.accepts_spring) ? 'Spring' : '',
    boolOrNull(row.accepts_transfer_winter) ? 'Winter' : '',
    boolOrNull(row.accepts_transfer_summer) ? 'Summer' : '',
  ].filter(Boolean);
}
function parseDeadlineCell(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const numeric = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  const named = raw.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})$/i);
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  let month = null;
  let day = null;
  if (numeric) {
    month = Number(numeric[1]);
    day = Number(numeric[2]);
  } else if (named) {
    month = months.indexOf(named[1].toLowerCase()) + 1;
    day = Number(named[2]);
  }
  if (!month || !day) return null;
  const now = new Date();
  let d = new Date(now.getFullYear(), month - 1, day);
  if (d.getTime() < localDayStart().getTime() - 86400000) d = new Date(now.getFullYear() + 1, month - 1, day);
  return d.toISOString().slice(0, 10);
}

const TERM_DEADLINE_OVERRIDES = {
  '164924': [
    { term: 'Fall', closing: 'March 15', notification: 'May 20', source: 'https://www.bc.edu/content/bc-web/admission/apply/transfer.html', sourceType: 'official' },
    { term: 'Spring', closing: 'November 1', notification: 'December 15', source: 'https://www.bc.edu/content/bc-web/admission/apply/transfer.html', sourceType: 'official' },
  ],
  '110404': [
    { term: 'Fall', closing: 'February 1', notification: 'Mid-April', source: 'https://www.admissions.caltech.edu/apply/transfer-applicants/transfer-deadlines', sourceType: 'official' },
  ],
  '227757': [
    { term: 'Spring', closing: 'October 15', notification: 'December 1', source: 'https://admission.rice.edu/apply/transfer-applicants', sourceType: 'official' },
    { term: 'Fall', closing: 'March 15', notification: 'June', source: 'https://admission.rice.edu/apply/transfer-applicants', sourceType: 'official' },
  ],
  '110714': [
    { term: 'Winter', closing: 'August 15', source: 'https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html', sourceType: 'official' },
    { term: 'Fall', closing: 'December 1', notification: 'March-May', source: 'https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html', sourceType: 'official' },
  ],
  '144050': [
    { term: 'Transfer priority', closing: 'March 1', source: 'https://collegeadmissions.uchicago.edu/files/documents/uchicago-glance.pdf', sourceType: 'official' },
  ],
  '170976': [
    {
      term: 'Winter',
      closing: 'October 1',
      source: 'https://admissions.umich.edu/apply/transfer-applicants/requirements-deadlines',
      sourceType: 'official',
    },
    {
      term: 'Fall',
      closing: 'February 1',
      source: 'https://admissions.umich.edu/apply/transfer-applicants/requirements-deadlines',
      sourceType: 'official',
    },
    {
      term: 'Spring half term',
      closing: 'February 1',
      source: 'https://admissions.umich.edu/apply/transfer-applicants/requirements-deadlines',
      sourceType: 'official',
    },
    {
      term: 'Summer half term',
      closing: 'February 1',
      source: 'https://admissions.umich.edu/apply/transfer-applicants/requirements-deadlines',
      sourceType: 'official',
    },
  ],
  '145637': [
    { term: 'Spring', closing: 'October 15', notification: 'By November 15', source: 'https://www.admissions.illinois.edu/Apply/Transfer/dates', sourceType: 'official' },
    { term: 'Fall priority', closing: 'February 1', notification: 'By April 15', source: 'https://www.admissions.illinois.edu/Apply/Transfer/dates', sourceType: 'official' },
    { term: 'Fall final', closing: 'April 1', notification: 'By June 1', source: 'https://www.admissions.illinois.edu/Apply/Transfer/dates', sourceType: 'official' },
  ],
  '199120': [
    { term: 'Fall', closing: 'February 15', notification: 'Late April', source: 'https://www.collegetransfer.net/UniversityOfNorthCarolinaAtChapelHill/TransferProfile/tabid/145/Default.aspx', sourceType: 'secondary' },
    { term: 'Materials estimate', closing: 'March 15', source: 'https://www.reddit.com/r/UNC/comments/1ruadk6/unc_transfer_application_fee_issue_deadline_today/', sourceType: 'secondary' },
  ],
};

const GPA_FALLBACK_OVERRIDES = {
  '186380': { value: 3.3, display: '3.20-3.50', label: 'Estimated competitive transfer GPA', sourceType: 'reddit', source: 'https://www.reddit.com/r/rutgers/comments/13vddz4/what_was_your_gpa_as_transfer_student/' },
  '179867': { value: 3.9, display: '3.85-3.90', label: 'Estimated competitive transfer GPA', sourceType: 'reddit', source: 'https://www.reddit.com/r/TransferToTop25/comments/1q1fj3f/washu_transfer_nontraditional_student/' },
  '164924': { value: 3.7, display: '3.70+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/boston-college-transfer-acceptance-rate-requirements-application-deadlines/' },
  '217156': { value: 3.88, display: '3.86-3.91', label: 'Average admitted transfer GPA estimate', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/brown-transfer-acceptance-rate-requirements-application-deadlines/' },
  '110404': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/how-to-get-into-caltech' },
  '211440': { value: 3.75, display: '3.75', label: 'Average enrolling transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/carnegie-mellon-transfer-acceptance-rate-requirements-application-deadlines/' },
  '190150': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/columbia-transfer-acceptance-rate-requirements-application-deadlines/' },
  '190415': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/cornell-transfer-acceptance-rate-requirements-application-deadlines/' },
  '182670': { value: 3.7, display: '3.70+', label: 'Successful transfer GPA estimate', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/dartmouth-transfer-acceptance-rate-requirements-application-deadlines/' },
  '166027': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/harvard-transfer-acceptance-rate-requirements-application-deadline/' },
  '166683': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/mit-transfer-acceptance-rate-requirements-application-deadlines/' },
  '193900': { value: 3.7, display: '3.70+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/nyu-transfer-acceptance-rate-requirements-application-deadline/' },
  '147767': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/northwestern-transfer-acceptance-rate-requirements-application-deadlines/' },
  '186131': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/princeton-transfer-acceptance-rate-requirements-application-deadlines/' },
  '243744': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/stanford-transfer-acceptance-rate-requirements-application-deadline/' },
  '168148': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/tufts-transfer-acceptance-rate-requirements-application-deadlines/' },
  '160755': { value: 3.5, display: '3.50+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/tulane-transfer-acceptance-rate-requirements-application-deadlines/' },
  '110705': { value: 3.4, display: '3.40+', label: 'Selective transfer GPA guidance', sourceType: 'official', source: 'https://catalog.ucsb.edu/pages/gpvPXfPGQwfIwCJfItrm' },
  '110714': { value: 3.47, display: '3.47', label: 'Mean transfer GPA', sourceType: 'official', source: 'https://admissions.ucsc.edu/posts/statistics' },
  '144050': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/uchicago-university-transfer-acceptance-rate-requirements-application-deadlines/' },
  '145637': { value: 3.5, display: '2.00-3.50', label: 'Major-dependent GPA guideline', sourceType: 'official', source: 'https://www.admissions.illinois.edu/faq/applicant-transfer' },
  '170976': { value: 3.0, display: '3.00+', label: 'Engineering minimum transfer GPA', sourceType: 'official', source: 'https://admissions.umich.edu/apply/transfer-applicants/requirements-deadlines' },
  '199120': { value: 3.7, display: '3.70', label: 'Average admitted transfer GPA estimate', sourceType: 'secondary', source: 'https://www.collegevine.com/faq/27250/unc-transfer-gpa-requirements' },
  '215062': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/upenn-transfer-acceptance-rate-requirements-application-deadlines/' },
  '123961': { value: 3.86, display: '3.73-4.00', label: 'Admitted transfer GPA range', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/usc-transfer-acceptance-rate-requirements-application-deadline/' },
  '228778': { value: 3.5, display: '3.50+', label: 'Estimated successful transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/ut-austin-transfer-acceptance-rate-requirements-application-deadlines/' },
  '240444': { value: 3.5, display: '3.00-3.50+', label: 'Competitive transfer GPA guidance', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/uw-madison-transfer-acceptance-rate-requirements-application-deadlines-3/' },
  '221999': { value: 3.7, display: '3.70+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/vanderbilt-transfer-acceptance-rate-requirements-application-deadlines/' },
  '130794': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/yale-transfer-acceptance-rate-requirements-application-deadlines/' },
};

const AVG_GPA_FALLBACK_OVERRIDES = {
  '204796': { value: 3.25, display: '3.25', label: 'Average enrolled transfer GPA', sourceType: 'official', source: 'https://undergrad.osu.edu/apply/transfer/admission-criteria' },
  '198419': { value: 3.9, display: '3.85-4.00', label: 'Average admitted transfer GPA estimate', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/duke-transfer-acceptance-rate-requirements-application-deadlines/' },
  '139658': { value: 3.5, display: '3.50+', label: 'Admitted transfer GPA guidance', sourceType: 'official', source: 'https://apply.web.emory.edu/apply/transfer.html' },
  '131496': { value: 3.85, display: '3.80-3.90', label: 'Average admitted transfer GPA estimate', sourceType: 'secondary', source: 'https://collegegazette.com/georgetown-transfer-acceptance-rate-gpa-requirements/' },
  '139755': { value: 3.77, display: '3.77', label: 'Average admitted transfer GPA', sourceType: 'official', source: 'https://admission.gatech.edu/images/pdf/2024TransferProfile.pdf' },
  '162928': { value: 3.9, display: '3.90+', label: 'Estimated competitive transfer GPA', sourceType: 'reddit', source: 'https://www.reddit.com/r/TransferToTop25/comments/1klhp56/uchicago_rejection_accepted_to_johns_hopkins_and/' },
  '227757': { value: 3.5, display: '3.50+', label: 'Admitted transfer GPA guidance', sourceType: 'official', source: 'https://admission.rice.edu/apply/transfer-applicants' },
  '110635': { value: 3.83, display: '3.65-4.00', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '110644': { value: 3.68, display: '3.44-3.92', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '110653': { value: 3.8, display: '3.59-4.00', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '110662': { value: 3.88, display: '3.76-4.00', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '110671': { value: 3.53, display: '3.23-3.83', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '110680': { value: 3.75, display: '3.55-3.94', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admissions.ucsd.edu/transfer/' },
  '110705': { value: 3.72, display: '3.50-3.94', label: 'Middle 50% admitted transfer GPA', sourceType: 'official', source: 'https://admission.universityofcalifornia.edu/counselors/_files/documents/ccc-transfer-application-data.pdf' },
  '134130': { value: 3.6, display: '3.60', label: 'Student-reported admitted transfer GPA estimate', sourceType: 'reddit', source: 'https://www.reddit.com/r/ufl/comments/1jgjnog/uf_transfer_acceptance_is_so_late/' },
  '145637': { value: 3.63, display: '3.25-4.00', label: 'Enrolled transfer GPA range', sourceType: 'official', source: 'https://www.pb.uillinois.edu/documents/transfer-characteristics/PB_Transfer_Characteristics_Fall24.pdf' },
  '170976': { value: 3.71, display: '3.71', label: 'Student-reported admitted transfer GPA estimate', sourceType: 'reddit', source: 'https://www.reddit.com/r/TransferToTop25/comments/1b8amfh/i_have_no_idea_how_i_got_into_umich/' },
  '152080': { value: 3.75, display: '3.75+', label: 'Admitted transfer GPA guidance', sourceType: 'official', source: 'https://admissions.nd.edu/apply/resources-for/transfer-applicants/' },
  '234076': { value: 3.5, display: '3.50', label: 'Average admitted transfer GPA', sourceType: 'official', source: 'https://admission.virginia.edu/transfer/transfer-faq' },
  '164465': { value: 3.7, display: '3.70+', label: 'Admitted transfer GPA guidance', sourceType: 'official', source: 'https://www.amherst.edu/admission/apply/transfer' },
  '161004': { value: 3.5, display: '3.50+', label: 'Estimated competitive transfer GPA', sourceType: 'secondary', source: 'https://www.collegevine.com/faq/7964/bowdoin-college-transfer-acceptance-rate' },
  '126614': { value: 3.42, display: '3.42', label: 'Average incoming transfer GPA sample', sourceType: 'official', source: 'https://www.colorado.edu/engineering-advising/get-your-degree/transfer-credit-transfer-students' },
  '168342': { value: 3.75, display: '3.75+', label: 'Estimated competitive transfer GPA', sourceType: 'reddit', source: 'https://www.reddit.com/r/TransferToTop25/comments/1j85ivj/williams_transfer/' },
};

const MIN_CREDIT_FALLBACK_OVERRIDES = {
  '204796': { display: '30 hrs', value: 30, label: '30 semester hours for college-only review', sourceType: 'official', source: 'https://undergrad.osu.edu/apply/transfer/admission-criteria' },
  '198419': { display: '1 year', value: null, label: 'One full year of transferable college work', sourceType: 'official', source: 'https://admissions.duke.edu/apply/' },
  '139658': { display: '28 hrs', value: 28, label: 'Minimum completed or in-progress credits', sourceType: 'official', source: 'https://apply.web.emory.edu/apply/transfer.html' },
  '139755': { display: '30 hrs', value: 30, label: 'Recommended completed semester hours', sourceType: 'secondary', source: 'https://www.collegetransitions.com/blog/georgia-tech-transfer-acceptance-rate-requirements-application-deadlines/' },
  '134130': { display: '60 hrs', value: 60, label: 'AA degree or 60 semester hours eligibility path', sourceType: 'official', source: 'https://admissions.ufl.edu/apply/transfer/eligibility' },
  '152080': { display: '1 year', value: null, label: 'One full academic year required', sourceType: 'official', source: 'https://admissions.nd.edu/apply/resources-for/transfer-applicants/' },
};

function termDeadlinesForRow(row) {
  const ipeds = String(row.id || row.ipedsId || '');
  const override = TERM_DEADLINE_OVERRIDES[ipeds];
  if (override) return override;

  const deadlines = [];
  if (row['fall-closing-date']) {
    deadlines.push({
      term: 'Fall',
      closing: row['fall-closing-date'],
      notification: row['fall-notification-date'] || '',
      sourceType: 'cds',
    });
  }
  if (row['spring-closing-date']) {
    deadlines.push({
      term: 'Spring',
      closing: row['spring-closing-date'],
      notification: row['spring-notification-date'] || '',
      sourceType: 'cds',
    });
  }
  return deadlines;
}

function bestDeadline(row) {
  const candidates = termDeadlinesForRow(row).map(d => parseDeadlineCell(d.closing)).filter(Boolean).sort();
  return candidates[0] || `${new Date().getFullYear() + 1}-03-01`;
}
function compactDeadlineTerm(term) {
  const raw = String(term || '').trim();
  if (!raw) return 'Transfer';
  if (/materials/i.test(raw)) return 'Materials';
  if (/fall/i.test(raw)) return raw.replace(/\s*closing\s*date/i, '').trim();
  if (/spring/i.test(raw)) return raw.replace(/\s*closing\s*date/i, '').trim();
  if (/winter/i.test(raw)) return raw.replace(/\s*closing\s*date/i, '').trim();
  if (/summer/i.test(raw)) return raw.replace(/\s*closing\s*date/i, '').trim();
  return raw;
}
function compactDeadlineLabelFromEntry(entry) {
  if (!entry) return 'Transfer deadline';
  const term = compactDeadlineTerm(entry.term);
  if (/deadline|materials/i.test(term)) return term;
  return `${term} transfer`;
}
function deadlineTypeForRow(row) {
  const deadlineTerms = termDeadlinesForRow(row).map(d => d.term);
  const terms = deadlineTerms.length ? deadlineTerms : transferTermsForRow(row);
  if (terms.length) return `${terms.join('/')} transfer`;
  if (row['fall-closing-date'] && row['spring-closing-date']) return 'Fall/Spring transfer';
  if (row['spring-closing-date']) return 'Spring transfer';
  return 'Transfer deadline';
}
function stableColor(id, fallback = '#1D4E89') {
  const palette = ['#003262','#8C1515','#011F5B','#00693E','#4E3629','#003087','#57068C','#A51417','#CC0033','#BF5700','#0C2340','#232D4B'];
  let n = 0;
  String(id || '').split('').forEach(ch => { n = (n + ch.charCodeAt(0)) % palette.length; });
  return palette[n] || fallback;
}

const APPLICATION_PLATFORM_OVERRIDES = {
  ohio_state: { label: 'Ohio State application', platforms: ['Direct'] },
  rutgers: { label: 'Rutgers application', platforms: ['Direct'] },
  washu: { label: 'Common App', platforms: ['Common App'] },
  boston_college: { label: 'Common App', platforms: ['Common App'] },
  bu: { label: 'Common App', platforms: ['Common App'] },
  brown: { label: 'Common App', platforms: ['Common App'] },
  caltech: { label: 'Caltech application', platforms: ['Direct'] },
  cmu: { label: 'Common App', platforms: ['Common App'] },
  columbia: { label: 'Coalition application', platforms: ['Coalition'] },
  cornell: { label: 'Common App', platforms: ['Common App'] },
  dartmouth: { label: 'Common App', platforms: ['Common App'] },
  duke: { label: 'Common App', platforms: ['Common App'] },
  emory: { label: 'Common App', platforms: ['Common App'] },
  georgetown: { label: 'Georgetown application', platforms: ['Direct'] },
  gatech: { label: 'Georgia Tech application', platforms: ['Direct'] },
  harvard: { label: 'Common App / Coalition', platforms: ['Common App', 'Coalition'] },
  jhu: { label: 'Common App', platforms: ['Common App'] },
  mit: { label: 'MIT application', platforms: ['Direct'] },
  nyu: { label: 'Common App', platforms: ['Common App'] },
  northwestern: { label: 'Common App', platforms: ['Common App'] },
  princeton: { label: 'Common App / Coalition / QuestBridge', platforms: ['Common App', 'Coalition', 'QuestBridge'] },
  rice: { label: 'Common App / Coalition', platforms: ['Common App', 'Coalition'] },
  stanford: { label: 'Common App', platforms: ['Common App'] },
  tufts: { label: 'Common App', platforms: ['Common App'] },
  tulane: { label: 'Common App', platforms: ['Common App'] },
  berkeley: { label: 'UC Application', platforms: ['UC Application'] },
  ucd: { label: 'UC Application', platforms: ['UC Application'] },
  uci: { label: 'UC Application', platforms: ['UC Application'] },
  ucla: { label: 'UC Application', platforms: ['UC Application'] },
  ucr: { label: 'UC Application', platforms: ['UC Application'] },
  ucsd: { label: 'UC Application', platforms: ['UC Application'] },
  ucsb: { label: 'UC Application', platforms: ['UC Application'] },
  ucsc: { label: 'UC Application', platforms: ['UC Application'] },
  uchicago: { label: 'Common App', platforms: ['Common App'] },
  uf: { label: 'Florida transfer application', platforms: ['Direct'] },
  uiuc: { label: 'myIllini / Common App', platforms: ['Direct', 'Common App'] },
  cu_boulder: { label: 'CU Boulder application / Common App', platforms: ['Direct', 'Common App'] },
  umich: { label: 'Common App', platforms: ['Common App'] },
  unc: { label: 'Common App', platforms: ['Common App'] },
  notredame: { label: 'Common App', platforms: ['Common App'] },
  upenn: { label: 'Common App', platforms: ['Common App'] },
  usc: { label: 'Common App', platforms: ['Common App'] },
  ut: { label: 'ApplyTexas', platforms: ['ApplyTexas'] },
  uva: { label: 'Common App', platforms: ['Common App'] },
  uw_madison: { label: 'UW application / Common App', platforms: ['Direct', 'Common App'] },
  vanderbilt: { label: 'Common App', platforms: ['Common App'] },
  yale: { label: 'Common App / Coalition / QuestBridge', platforms: ['Common App', 'Coalition', 'QuestBridge'] },
  amherst: { label: 'Common App', platforms: ['Common App'] },
  bowdoin: { label: 'Common App', platforms: ['Common App'] },
  williams: { label: 'Common App', platforms: ['Common App'] },
};

function applicationPlatformForRow(row, id) {
  const override = APPLICATION_PLATFORM_OVERRIDES[id];
  if (override) return override;
  const raw = String(row.application_platform || row.platform || '').trim();
  if (raw) return { label: raw, platforms: [raw] };
  return { label: 'Institutional application', platforms: ['Direct'] };
}

function mapSchoolRow(row) {
  const ipeds = String(row.id || '');
  const id = schoolIdForRow(row);
  const applicationPlatform = applicationPlatformForRow(row, id);
  const avgGpa = numOrNull(row.avg_gpa_transfer);
  const rawMinGpa = numOrNull(row.min_gpa);
  const legacyGpaFallback = GPA_FALLBACK_OVERRIDES[ipeds];
  const legacyFallbackIsMinimum = !!legacyGpaFallback && /minimum|major-dependent|selective/i.test(legacyGpaFallback.label || '');
  const gpaFallback = AVG_GPA_FALLBACK_OVERRIDES[ipeds] || (!legacyFallbackIsMinimum ? legacyGpaFallback : null);
  const minGpaFallback = legacyFallbackIsMinimum ? legacyGpaFallback : null;
  const minCreditFallback = MIN_CREDIT_FALLBACK_OVERRIDES[ipeds];
  const hasGpaFallback = avgGpa == null && !!gpaFallback;
  const hasMinGpaFallback = rawMinGpa == null && !!minGpaFallback;
  const minGpa = rawMinGpa ?? (hasMinGpaFallback ? minGpaFallback.value : null);
  const gpaValue = avgGpa ?? (hasGpaFallback ? gpaFallback.value : null);
  const acceptDecimal = numOrNull(row.acceptance_rate_transfer);
  const fee = numOrNull(row.app_fee);
  const sourceFile = row._source_file || 'Common Data Set Section D';
  const sourceNotes = row._source_notes || '';
  const termDeadlines = termDeadlinesForRow(row);
  const transferTerms = termDeadlines.length ? termDeadlines.map(d => d.term) : transferTermsForRow(row);
  return {
    id,
    ipedsId: ipeds,
    name: row.name,
    short: shortenName(row.name),
    state: row.state || '',
    location: row.location || '',
    type: tagsForRow(row),
    accept: acceptDecimal == null ? null : Math.round(acceptDecimal * 1000) / 10,
    gpa: gpaValue,
    avgGpa,
    minGpa,
    gpaDisplay: hasGpaFallback ? gpaFallback.display : '',
    gpaIsFallback: hasGpaFallback,
    gpaIsEstimate: hasGpaFallback && gpaFallback.sourceType !== 'official',
    gpaSourceLink: hasGpaFallback ? gpaFallback.source : '',
    gpaSourceType: hasGpaFallback ? gpaFallback.sourceType : (avgGpa != null ? 'official' : ''),
    minGpaIsFallback: hasMinGpaFallback,
    minGpaDisplay: hasMinGpaFallback ? minGpaFallback.display : '',
    minGpaSourceLink: hasMinGpaFallback ? minGpaFallback.source : '',
    minGpaSourceType: hasMinGpaFallback ? minGpaFallback.sourceType : (rawMinGpa != null ? 'official' : ''),
    minGpaSource: rawMinGpa != null ? 'Minimum college GPA' : (hasMinGpaFallback ? minGpaFallback.label : 'Minimum GPA not published'),
    gpaSource: avgGpa != null ? 'Avg transfer GPA' : (gpaFallback ? gpaFallback.label : 'Avg transfer GPA not published'),
    platform: applicationPlatform.label,
    platforms: applicationPlatform.platforms,
    deadline: bestDeadline(row),
    deadlineType: deadlineTypeForRow(row),
    tuition: { in: numOrNull(row.tuition_in_state) || 0, out: numOrNull(row.tuition_out_of_state) || 0 },
    undergrad: numOrNull(row.undergrad_population) || 0,
    aid: boolOrNull(row.is_need_blind) ? 'Need-blind admission' : 'See official financial aid policies',
    cc: UC_IPEDS.has(ipeds),
    majors: arrayValue(row.popular_majors),
    maxCredits: numOrNull(row.max_credits_accepted),
    residencyCredits: numOrNull(row.residency_credits_required),
    minCredits: numOrNull(row.min_credits_required) ?? minCreditFallback?.value ?? null,
    minCreditsDisplay: row.min_credits_required ? '' : minCreditFallback?.display || '',
    minCreditsSource: minCreditFallback?.label || '',
    minCreditsSourceLink: minCreditFallback?.source || '',
    inStateMinGpa: numOrNull(row.in_state_min_GPA),
    lowestTransferGrade: row.lowest_letter_grade_for_credit || '',
    transferInfoLink: row.transfer_info_link || '',
    applyLink: row.apply_link || row.transfer_info_link || '',
    schoolUrl: row.school_url || '',
    fee,
    waiver: fee === 0,
    color: stableColor(id),
    accent: '#4F7CFF',
    transferTerms,
    termDeadlines,
    fallClosingDate: row['fall-closing-date'] || '',
    springClosingDate: row['spring-closing-date'] || '',
    fallNotificationDate: row['fall-notification-date'] || '',
    springNotificationDate: row['spring-notification-date'] || '',
    sourceFile,
    sourceNotes,
    sourceLabel: sourceNotes ? 'CDS Section D + extractor notes' : 'CDS Section D + official transfer page',
  };
}
function hydrateSchools(rows, source) {
  const mapped = (rows || []).map(mapSchoolRow).filter(s => s.id && s.name);
  mapped.sort((a, b) => {
    if ((a.accept ?? 999) !== (b.accept ?? 999)) return (a.accept ?? 999) - (b.accept ?? 999);
    return a.name.localeCompare(b.name);
  });
  SCHOOLS.splice(0, SCHOOLS.length, ...mapped);
  SCHOOL_DATA_SOURCE = source || 'verified-cds';
  EX_FAVS = new Set(USER_APPS.map(a => a.id));
}
function loadSchoolsFromVerifiedFallback() {
  const rows = window.TRANSFERSPACE_SCHOOL_DATA || [];
  hydrateSchools(rows, 'verified CDS fallback');
  return rows.length;
}
function formatGpa(s) {
  if (s?.gpaIsFallback && s.gpaDisplay) {
    const display = String(s.gpaDisplay).replace(/\s/g, '');
    const range = display.match(/^(\d+(?:\.\d+)?)-\d+(?:\.\d+)?\+?$/);
    const compact = range ? `${range[1]}+` : display;
    return `${s.gpaIsEstimate ? '~' : ''}${compact}`;
  }
  return typeof s?.gpa === 'number' && !Number.isNaN(s.gpa) ? s.gpa.toFixed(2) : '—';
}
function hasPublishedGpa(s) {
  return typeof s?.gpa === 'number' && Number.isFinite(s.gpa);
}
function formatMinGpa(s) {
  if (s?.minGpaIsFallback && s.minGpaDisplay) return `${s.minGpaSourceType === 'official' ? '' : '~'}${s.minGpaDisplay}`;
  return typeof s?.minGpa === 'number' && Number.isFinite(s.minGpa) ? s.minGpa.toFixed(2) : '—';
}
function hasMinGpa(s) {
  return typeof s?.minGpa === 'number' && Number.isFinite(s.minGpa);
}
function formatMinCredits(s) {
  if (s?.minCreditsDisplay) return s.minCreditsDisplay;
  return s?.minCredits || '—';
}
function formatAcceptance(s) {
  return typeof s?.accept === 'number' && Number.isFinite(s.accept) ? `${s.accept}%` : '—';
}
function gpaLabel(s) {
  return s?.gpaSource || 'Avg transfer GPA';
}
function formatFee(s) {
  if (s?.fee === 0) return 'FREE';
  if (typeof s?.fee === 'number') return '$' + s.fee;
  return 'See source';
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}
function userStorageKey(name) {
  return CURRENT_USER ? `ts-${name}-${CURRENT_USER.id}` : null;
}
function saveUserApps() {
  const key = userStorageKey('apps');
  if (key) localStorage.setItem(key, JSON.stringify(USER_APPS));
}
function loadUserApps() {
  USER_APPS.splice(0, USER_APPS.length);
  const key = userStorageKey('apps');
  if (!key) return;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) USER_APPS.push(...saved);
  } catch (e) {}
}
function saveUserTimelineExtras() {
  const key = userStorageKey('timeline');
  if (key) localStorage.setItem(key, JSON.stringify({ tasks: CUSTOM_TASKS, notes: TL_NOTES }));
}
function loadUserTimelineExtras() {
  CUSTOM_TASKS.splice(0, CUSTOM_TASKS.length);
  TL_NOTES = {};
  const key = userStorageKey('timeline');
  if (!key) return;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (Array.isArray(saved.tasks)) CUSTOM_TASKS.push(...saved.tasks);
    if (saved.notes && typeof saved.notes === 'object') TL_NOTES = saved.notes;
  } catch (e) {}
}
function resetPersonalWorkspace() {
  USER_APPS.splice(0, USER_APPS.length);
  CUSTOM_TASKS.splice(0, CUSTOM_TASKS.length);
  TL_NOTES = {};
  SCRATCHPAD_CACHE = {};
  DB_ESSAYS = [];
  DB_DOCUMENTS = [];
  DB_LORS = [];
  DB_BOOKMARKS = [];
  if (typeof DB_DECISIONS !== 'undefined') DB_DECISIONS = {};
  if (typeof DB_PROFILE !== 'undefined') DB_PROFILE = null;
  EX_FAVS = new Set();
  Object.assign(USER_PROFILE, DEFAULT_PROFILE);
}
function loadCurrentUserWorkspace() {
  loadUserApps();
  loadUserTimelineExtras();
  EX_FAVS = new Set(USER_APPS.map(a => a.id));
}
function renderWorkspaceViews() {
  updateAuthUI();
  syncSidebarFromProfile();
  updateProfilePreview();
  populateFitMajorOptions();
  renderTabs();
  renderSchoolGrid();
  initExploreGlobe();
  renderExploreGlobePreview();
  renderKanban();
  renderAppList();
  renderTimeline();
  renderDocumentsPage();
  refreshDocsCounts();
  renderNotifs();
}

/* =============== helpers =============== */
const byId = id => SCHOOLS.find(s => s.id === id);
const today = () => new Date();
const localDayStart = value => {
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = value ? new Date(value) : today();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const daysTo = dateStr => {
  const t = localDayStart().getTime();
  const d = localDayStart(dateStr).getTime();
  return Math.round((d - t) / 86400000);
};
const isUpcomingDeadline = dateStr => daysTo(dateStr) > 0;
const schoolDeadlineDays = s => daysTo(compactDeadlineDate(s));
const hasUpcomingSchoolDeadline = s => isUpcomingDeadline(compactDeadlineDate(s));
const isRecentlyClosedDeadline = dateStr => {
  const d = daysTo(dateStr);
  return d < 0 && d >= -14;
};
const fmtDate = dateStr => {
  const d = localDayStart(dateStr);
  return d.toLocaleDateString('en-US',{month:'short', day:'numeric', year:'numeric'});
};
const deadlinePhrase = dateStr => {
  const d = daysTo(dateStr);
  if (d > 1) return `${d} days`;
  if (d === 1) return 'tomorrow';
  if (d === 0) return 'closed today';
  return `closed ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago`;
};
function upcomingDeadlineEntry(s) {
  const rows = (s?.termDeadlines || [])
    .map(item => ({ ...item, date: parseDeadlineCell(item.closing) }))
    .filter(item => item.date)
    .sort((a, b) => localDayStart(a.date) - localDayStart(b.date));
  return rows.find(item => daysTo(item.date) >= 0) || rows[0] || null;
}
function compactDeadlineType(s) {
  return compactDeadlineLabelFromEntry(upcomingDeadlineEntry(s)) || s?.deadlineType || 'Transfer deadline';
}
function compactDeadlineDate(s) {
  return upcomingDeadlineEntry(s)?.date || s?.deadline;
}
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* =============== routing =============== */
const ROUTE_ALIASES = {
  dashboard: 'applications',
  explore: 'schools',
  resources: 'resources',
  stats: 'schools',
  gpachart: 'schools',
  documents: 'materials',
  schools: 'schools',
  applications: 'applications',
  materials: 'materials',
  timeline: 'timeline',
  profile: 'profile',
  settings: 'settings'
};
const ROUTE_PAGE_IDS = {
  schools: 'explore',
  resources: 'resources',
  applications: 'applications',
  materials: 'documents',
  timeline: 'timeline',
  profile: 'profile',
  settings: 'settings'
};
const LEGACY_TOOL_PAGES = new Set(['stats', 'gpachart']);
function canonicalRoute(page) {
  return ROUTE_ALIASES[page] || page;
}
function pageIdForRoute(page) {
  return ROUTE_PAGE_IDS[canonicalRoute(page)] || page;
}
function activatePage(pageId, activeRoute) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-' + pageId);
  if (!pageEl) return;
  pageEl.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`.nav-item[data-page="${activeRoute}"]`).forEach(el => el.classList.add('active'));
  const main = document.querySelector('.main');
  if (main) main.scrollTop = 0;
  window.scrollTo({top: 0, behavior: 'auto'});
}
function runRouteEntry(route) {
  if (route === 'materials') {
    renderDocumentsPage();
    refreshDocsCounts();
  }
  if (route === 'profile') {
    hydrateProfilePage();
    syncProfileFromForm();
  }
  if (route === 'schools') {
    populateFitMajorOptions();
    initExploreGlobe();
    renderExploreGlobePreview();
    renderSchoolGrid();
    const inp = document.getElementById('fitGpaInput');
    if (inp && inp.value) runFitEstimator();
  }
  if (route === 'resources') renderBookmarks();
  if (route === 'applications') {
    renderKanban();
    renderAppList();
  }
  if (route === 'timeline') renderTimeline();
}
function goto(page) {
  const route = canonicalRoute(page);
  activatePage(pageIdForRoute(route), route);
  runRouteEntry(route);
}
function gotoLegacy(page) {
  if (!LEGACY_TOOL_PAGES.has(page)) return goto(page);
  activatePage(page, canonicalRoute(page));

  // Insights pages — render on entry so the latest SCHOOLS data is shown
  if (page === 'stats') renderStatsPanel();
  if (page === 'gpachart') renderGpaChart();
  if (page === 'resources') renderBookmarks();
}
function enterApp() {
  const app = document.getElementById('view-app');
  hideAuthModal();
  app?.classList.add('active', 'app-entering');
  document.documentElement.classList.add('in-app');
  goto('applications');
  populateFitMajorOptions();
  setTimeout(() => app?.classList.remove('app-entering'), 420);
}
function exitApp() {
  window.location.href = 'info.html';
}

/* =============== sidebar =============== */
function toggleSidebar() {
  document.getElementById('appShell')?.classList.remove('collapsed');
}

/* =============== theme =============== */
function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  try { localStorage.setItem('ts-theme', next); } catch(e){}
}
(function initTheme(){
  try {
    const saved = localStorage.getItem('ts-theme');
    if (saved) document.documentElement.dataset.theme = saved;
  } catch(e){}
})();

/* =============== command palette =============== */
let cmdIndex = 0;
function openCmdK() {
  document.getElementById('cmdk').classList.add('active');
  setTimeout(() => document.getElementById('cmdkInput').focus(), 50);
  renderCmdK();
}
function closeCmdK() {
  document.getElementById('cmdk').classList.remove('active');
  document.getElementById('cmdkInput').value = '';
}
function renderCmdK() {
  const q = document.getElementById('cmdkInput').value.toLowerCase().trim();
  const list = document.getElementById('cmdkList');
  const nav = [
    { type:'Navigate', label:'Schools', action: ()=>{goto('schools');closeCmdK();}, icon:'SC' },
    { type:'Navigate', label:'Resources', action: ()=>{goto('resources');closeCmdK();}, icon:'RE' },
    { type:'Navigate', label:'Applications', action: ()=>{goto('applications');closeCmdK();}, icon:'AP' },
    { type:'Navigate', label:'Materials', action: ()=>{goto('materials');closeCmdK();}, icon:'MA' },
    { type:'Navigate', label:'Timeline', action: ()=>{goto('timeline');closeCmdK();}, icon:'TI' },
    { type:'Navigate', label:'Profile', action: ()=>{goto('profile');closeCmdK();}, icon:'PR' },
    { type:'Navigate', label:'Settings', action: ()=>{goto('settings');closeCmdK();}, icon:'SE' },
    { type:'Action', label:'Toggle theme', action: ()=>{toggleTheme();closeCmdK();}, icon:'TH' },
    { type:'Action', label:'Add a school', action: ()=>{goto('schools');closeCmdK();toast('Search the catalogue to add a school.');}, icon:'AD' },
  ];
  const schoolItems = SCHOOLS.map(s => {
    const isAdded = USER_APPS.some(a => a.id === s.id);
    return {
      type:'School', label: s.name, sub: `${s.state} · ${formatAcceptance(s)} accept`,
      action: () => {
        if (isAdded) {
          openAppModal(s.id);
        } else {
          addSchoolToList(s.id);
          renderCmdK();
        }
        closeCmdK();
      },
      icon: s.short.slice(0,1)
    };
  });
  const all = [...nav, ...schoolItems];
  const filtered = q ? all.filter(x => (x.label + ' ' + (x.sub||'')).toLowerCase().includes(q)) : all;
  cmdIndex = 0;
  const groups = {};
  filtered.forEach(x => { groups[x.type] = groups[x.type] || []; groups[x.type].push(x); });
  let html = '';
  Object.keys(groups).forEach(g => {
    html += `<div class="cmdk-group-label">${g}</div>`;
    groups[g].forEach(x => {
      const itemIndex = filtered.indexOf(x);
      html += `<div class="cmdk-item" data-i="${itemIndex}">
        <span class="cmdk-icon">${x.icon}</span>
        <div style="flex:1"><div>${x.label}</div>${x.sub ? `<div style="font-size:.73rem;color:var(--text-muted)">${x.sub}</div>` : ''}</div>
        <span class="cmdk-kbd">Enter</span>
      </div>`;
    });
  });
  if (!filtered.length) html = `<div style="padding:1.2rem;text-align:center;color:var(--text-muted);font-size:.85rem;">Nothing matches &ldquo;${q}&rdquo;.</div>`;
  list.innerHTML = html;
  // wire clicks
  const items = list.querySelectorAll('.cmdk-item');
  items.forEach(el => {
    el.onclick = () => filtered[Number(el.dataset.i)]?.action();
  });
}
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const cmdk = document.getElementById('cmdk');
    cmdk.classList.contains('active') ? closeCmdK() : openCmdK();
  } else if (e.key === 'Escape') {
    closeCmdK();
    closeDrawer();
  } else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    openCmdK();
  }
});

/* =============== Notifications =============== */

let NOTIF_CHANNEL = null;
let NOTIFS = [];

// ── Sync prefs to Supabase ────────────────────────────────────────────────
async function syncNotifPrefs() {
  if (!CURRENT_USER) return;
  const s = getNotifSettings();
  const days = JSON.parse(localStorage.getItem('ts-deadline-reminders') || '[30]').map(Number);
  await sb.from('user_notification_prefs').upsert({
    user_id: CURRENT_USER.id,
    email_on: s.email !== false,
    inapp_on: s.inapp !== false,
    digest_on: s.digest !== false,
    lor_on: s.lor !== false,
    sms_on: !!s.sms,
    deadline_days: days,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

// ── Load & render in-app notifications ───────────────────────────────────
async function loadNotifications() {
  if (!CURRENT_USER) return;
  const { data } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', CURRENT_USER.id)
    .order('created_at', { ascending: false })
    .limit(30);
  NOTIFS = data || [];
  renderNotifPanel();
  updateNotifBadge();
}

function renderNotifPanel() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (!NOTIFS.length) {
    list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
    return;
  }
  list.innerHTML = NOTIFS.map(n => {
    const icon = n.type === 'warning' ? '⚠' : n.type === 'success' ? '✓' : '•';
    const age = relativeTime(n.created_at);
    return `<div class="notif-item${n.read ? '' : ' unread'}" onclick="markNotifRead('${n.id}')">
      <div class="notif-icon ${n.type}">${icon}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${escapeHtml(n.title)}</div>
        ${n.body ? `<div class="notif-item-sub">${escapeHtml(n.body)}</div>` : ''}
        <div class="notif-item-time">${age}</div>
      </div>
    </div>`;
  }).join('');
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const count = NOTIFS.filter(n => !n.read).length;
  badge.textContent = count > 9 ? '9+' : String(count);
  badge.hidden = count === 0;
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  const bell = document.getElementById('notifBell');
  if (!panel) return;
  const open = panel.hidden;
  panel.hidden = !open;
  bell?.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) markAllNotifsRead();
}

async function markNotifRead(id) {
  await sb.from('notifications').update({ read: true }).eq('id', id);
  const n = NOTIFS.find(x => x.id === id);
  if (n) n.read = true;
  renderNotifPanel();
  updateNotifBadge();
}

async function markAllNotifsRead() {
  if (!CURRENT_USER || !NOTIFS.some(n => !n.read)) return;
  await sb.from('notifications').update({ read: true }).eq('user_id', CURRENT_USER.id).eq('read', false);
  NOTIFS.forEach(n => { n.read = true; });
  renderNotifPanel();
  updateNotifBadge();
}

function subscribeNotifications() {
  if (!CURRENT_USER) return;
  if (NOTIF_CHANNEL) sb.removeChannel(NOTIF_CHANNEL);
  NOTIF_CHANNEL = sb
    .channel(`notifs-${CURRENT_USER.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${CURRENT_USER.id}`,
    }, payload => {
      NOTIFS.unshift(payload.new);
      renderNotifPanel();
      updateNotifBadge();
      // Show toast for warnings
      if (payload.new.type === 'warning') toast(payload.new.title);
    })
    .subscribe();
}

// ── Deadline emails (triggered on login after schools load) ───────────────
async function checkAndSendDeadlineEmails() {
  if (!CURRENT_USER) return;
  const s = getNotifSettings();
  if (s.email === false) return;

  const days = JSON.parse(localStorage.getItem('ts-deadline-reminders') || '[30]').map(Number);
  const upcoming = [];

  for (const app of USER_APPS) {
    const school = SCHOOLS.find(sc => sc.id === app.id);
    if (!school) continue;
    const dateStr = compactDeadlineDate(school);
    if (!dateStr) continue;
    const d = daysTo(dateStr);
    const matched = days.filter(threshold => d > 0 && d <= threshold);
    if (!matched.length) continue;
    const bestMatch = Math.min(...matched);
    upcoming.push({
      schoolId: school.id,
      school: school.name,
      term: compactDeadlineType(school),
      daysLeft: d,
      date: fmtDate(dateStr),
      threshold: bestMatch,
    });
  }

  if (!upcoming.length) return;

  try {
    await sb.functions.invoke('notify', { body: { type: 'deadline', deadlines: upcoming } });
  } catch (e) {
    console.warn('Deadline notification failed:', e);
  }
}

// ── Test notification (Settings panel button) ─────────────────────────────
async function sendTestNotification() {
  const status = document.getElementById('notifTestStatus');
  if (!CURRENT_USER) {
    if (status) status.textContent = 'Sign in first.';
    return;
  }
  if (status) status.textContent = 'Sending…';
  try {
    await sb.functions.invoke('notify', { body: { type: 'test' } });
    if (status) status.textContent = 'Sent! Check your inbox.';
  } catch {
    if (status) status.textContent = 'Failed — check RESEND_API_KEY secret.';
  }
  setTimeout(() => { if (status) status.textContent = ''; }, 5000);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderNotifs() {} // legacy stub — kept for compatibility

document.addEventListener('click', e => {
  const panel = document.getElementById('notifPanel');
  const wrap = document.getElementById('notifWrap');
  if (panel && !panel.hidden && wrap && !wrap.contains(e.target)) {
    panel.hidden = true;
    document.getElementById('notifBell')?.setAttribute('aria-expanded', 'false');
  }
});

function openDrawer() {}
function closeDrawer() {}

/* =============== toast =============== */
function toast(msg) {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; el.style.transition = '.2s'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}

function toastUndo(msg, undoFn, delay) {
  delay = delay || 7000;
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast toast-with-undo';
  let gone = false;
  const tid = setTimeout(() => {
    if (!gone) { gone = true; el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; el.style.transition = '.2s'; setTimeout(() => el.remove(), 250); }
  }, delay);
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'toast-undo-btn';
  btn.textContent = 'Undo';
  btn.onclick = () => { if (!gone) { gone = true; clearTimeout(tid); undoFn(); el.remove(); } };
  el.appendChild(msgSpan);
  el.appendChild(btn);
  stack.appendChild(el);
}

/* =============== user profile (live-synced to sidebar) =============== */
const AVATAR_GRADIENTS = {
  violet: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  indigo: 'linear-gradient(135deg,#4f46e5,#6366f1)',
  teal:   'linear-gradient(135deg,#0d9488,#14b8a6)',
  amber:  'linear-gradient(135deg,#d97706,#f59e0b)',
  rose:   'linear-gradient(135deg,#e11d48,#f43f5e)',
  slate:  'linear-gradient(135deg,#334155,#64748b)',
};

const DEFAULT_PROFILE = {
  name: 'Transfer Student',
  email: '',
  currentSchool: 'Current college',
  major: 'Undecided',
  gpa: '',
  credits: '',
  transferTerm: 'Fall 2026',
  homeState: '',
  avatarColor: 'teal',
};
const USER_PROFILE = cloneData(DEFAULT_PROFILE);

function initialsFrom(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function firstName(name) {
  const p = (name || '').trim().split(/\s+/)[0];
  return p || 'there';
}

function updateProfile(field, val) {
  USER_PROFILE[field] = val;
  syncSidebarFromProfile();
  updateProfilePreview();
  if (field === 'avatarColor') {
    document.querySelectorAll('.ac-swatch').forEach(s => {
      s.classList.toggle('selected', s.dataset.color === val);
    });
  }
}

function syncSidebarFromProfile() {
  if (!CURRENT_USER) {
    updateAuthUI();
    return;
  }
  const initials = initialsFrom(USER_PROFILE.name);
  const sbName = document.getElementById('sbUserName');
  const sbSub  = document.getElementById('sbUserSub');
  const sbAv   = document.getElementById('sbAvatar');
  const pfAv   = document.getElementById('profileAvatar');
  if (sbName) sbName.textContent = firstName(USER_PROFILE.name);
  if (sbSub)  sbSub.textContent  = `${USER_PROFILE.currentSchool} · ${abbrMajor(USER_PROFILE.major)}`;
  const grad = AVATAR_GRADIENTS[USER_PROFILE.avatarColor] || AVATAR_GRADIENTS.violet;
  if (sbAv) { sbAv.textContent = initials; sbAv.style.background = grad; }
  if (pfAv) { pfAv.textContent = initials; pfAv.style.background = grad; }
}

function abbrMajor(m) {
  const map = {
    'Computer Science': 'CS',
    'Business': 'Business',
    'Economics': 'Econ',
    'Engineering': 'Eng',
    'Undecided': 'Undecided',
  };
  return map[m] || m;
}

function updateProfilePreview() {
  const el = document.getElementById('profilePreview');
  if (!el) return;
  const initials = initialsFrom(USER_PROFILE.name);
  const grad = AVATAR_GRADIENTS[USER_PROFILE.avatarColor] || AVATAR_GRADIENTS.violet;
  el.innerHTML = `
    <div class="avatar" style="width: 36px; height: 36px; font-size: .78rem; background: ${grad};">${initials}</div>
    <div style="display: flex; flex-direction: column; gap: .15rem;">
      <span class="pp-label">Sidebar preview</span>
      <div><b>${firstName(USER_PROFILE.name)}</b> · ${USER_PROFILE.currentSchool} · ${abbrMajor(USER_PROFILE.major)}</div>
    </div>`;
}
/* =============== explore =============== */
function profileMajorTokens() {
  const major = (USER_PROFILE.major || '').toLowerCase();
  if (!major || major.includes('undecided')) return [];
  const aliases = {
    'computer science': ['computer science', 'cs', 'engineering'],
    'business': ['business', 'economics'],
    'economics': ['economics', 'business', 'social sci'],
    'engineering': ['engineering', 'computer science', 'cs'],
    'biology': ['biology', 'health'],
    'psychology': ['psychology', 'psych'],
    'political science': ['political sci', 'social sci', 'international relations'],
    'communications': ['communications', 'journalism', 'social sci'],
    'nursing': ['nursing', 'health', 'biology']
  };
  for (const key of Object.keys(aliases)) {
    if (major.includes(key)) return aliases[key];
  }
  return [major];
}

function schoolMatchesProfileMajor(s) {
  const tokens = profileMajorTokens();
  if (!tokens.length) return true;
  const hay = (s.majors || []).join(' ').toLowerCase();
  return tokens.some(t => hay.includes(t));
}

function profileHomeStateCode() {
  return stateCodeFromName(USER_PROFILE.homeState || '');
}

function profileStateScore(s) {
  const home = profileHomeStateCode();
  if (!home) return 0;
  if (s.state === home) return -2.2;
  if (regionFor(s.state) === regionFor(home)) return -0.45;
  return 0.35;
}

function profileMajorScore(s) {
  const tokens = profileMajorTokens();
  if (!tokens.length) return 0;
  return schoolMatchesProfileMajor(s) ? -1.4 : 2.2;
}

function profileGpaScore(s) {
  const userGpa = Number(USER_PROFILE.gpa) || 3.5;
  if (!hasPublishedGpa(s)) return 0.65;
  const gap = userGpa - s.gpa;
  if (gap < -0.35) return 2.4 + Math.abs(gap) * 2.2;
  if (gap < -0.1) return 0.95 + Math.abs(gap) * 1.4;
  if (gap <= 0.85) return -0.55;
  return -0.15;
}

function profileSelectivityScore(s) {
  if (typeof s.accept !== 'number' || !Number.isFinite(s.accept)) return 0.7;
  const userGpa = Number(USER_PROFILE.gpa) || 3.5;
  const majorMatch = schoolMatchesProfileMajor(s);
  let score = Math.min(1.6, Math.max(0.04, s.accept / 55));
  if (s.accept < 10 && userGpa < 3.8) score += 0.9;
  if (s.accept <= 35 && userGpa >= 3.7 && majorMatch) score -= 0.35;
  if (s.accept >= 55) score += 0.2;
  return score;
}

function profileDeadlineScore(s) {
  const d = schoolDeadlineDays(s);
  if (!Number.isFinite(d)) return 0.3;
  if (d < 0) return 1.5;
  if (d <= 45) return -0.25;
  if (d <= 150) return 0;
  return 0.22;
}

function profileFitScore(s) {
  return profileMajorScore(s)
    + profileStateScore(s)
    + profileGpaScore(s)
    + profileSelectivityScore(s)
    + profileDeadlineScore(s);
}

function bestFitSchools() {
  const hasProfileSignal = Boolean(profileMajorTokens().length || profileHomeStateCode() || USER_PROFILE.gpa);
  const pool = SCHOOLS
    .filter(s => {
      if (!hasProfileSignal) return hasPublishedGpa(s) && typeof s.accept === 'number' && s.accept <= 45;
      return true;
    })
    .map(s => ({ school: s, score: profileFitScore(s) }))
    .sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.001) return a.score - b.score;
      return (a.school.accept ?? 999) - (b.school.accept ?? 999);
    });
  const threshold = hasProfileSignal ? 2.05 : 2.7;
  const strong = pool.filter(item => item.score <= threshold).slice(0, 10);
  return strong.length >= 5 ? strong.map(item => item.school) : pool.slice(0, 8).map(item => item.school);
}

function isProfileFitSchool(s) {
  return bestFitSchools().some(best => best.id === s.id);
}

const SCHOOL_SEARCH_KEYWORDS = {
  ohio_state: ['osu', 'ohio state', 'fisher', 'arts and sciences', 'college of engineering'],
  rutgers: ['rutgers new brunswick', 'rutgers business school', 'school of arts and sciences', 'soe'],
  washu: ['washu', 'washington university', 'olin', 'mckelvey', 'arts and sciences'],
  boston_college: ['bc', 'carroll school', 'morrissey college', 'lynch school'],
  bu: ['boston university', 'questrom', 'cas', 'college of arts and sciences', 'college of engineering'],
  brown: ['brown university', 'brown college', 'school of engineering', 'watson'],
  caltech: ['california institute of technology', 'cal tech', 'engineering and applied science'],
  cmu: ['carnegie mellon', 'tepper', 'school of computer science', 'scs', 'mellon college', 'college of engineering'],
  columbia: ['columbia college', 'fu foundation', 'seas', 'engineering', 'school of general studies'],
  cornell: ['dyson', 'sha', 'hotel school', 'engineering', 'arts and sciences', 'ilr', 'cals', 'college of agriculture and life sciences'],
  dartmouth: ['dartmouth college', 'thayer', 'tuck', 'arts and sciences'],
  duke: ['duke university', 'trinity college', 'pratt', 'fuqua', 'sanford'],
  emory: ['emory college', 'goizueta', 'oxford college', 'college of arts and sciences'],
  georgetown: ['georgetown university', 'mcdonough', 'sfs', 'school of foreign service', 'georgetown college'],
  gatech: ['georgia tech', 'georgia institute of technology', 'college of computing', 'scheller', 'college of engineering'],
  harvard: ['harvard college', 'seas', 'engineering and applied sciences'],
  jhu: ['johns hopkins', 'hopkins', 'whiting', 'krieger', 'peabody'],
  mit: ['massachusetts institute of technology', 'sloan', 'school of engineering', 'eecs'],
  nyu: ['new york university', 'stern', 'tandon', 'cas', 'college of arts and science'],
  northwestern: ['northwestern university', 'mccormick', 'weinberg', 'medill', 'kellogg'],
  princeton: ['princeton university', 'princeton college', 'school of engineering', 'spiA', 'public and international affairs'],
  rice: ['rice university', 'george r brown', 'school of engineering', 'wiess school', 'jones school'],
  stanford: ['stanford gsb', 'school of engineering', 'humanities and sciences'],
  tufts: ['tufts university', 'school of engineering', 'arts and sciences'],
  tulane: ['tulane university', 'freeman', 'school of science and engineering', 'newcomb tulane'],
  berkeley: ['cal', 'uc berkeley', 'haas', 'eecs', 'letters and science', 'college of engineering'],
  ucd: ['uc davis', 'davis', 'college of agricultural and environmental sciences', 'college of letters and science'],
  uci: ['uc irvine', 'irvine', 'merage', 'henry samueli', 'donald bren'],
  ucla: ['uc la', 'uc los angeles', 'anderson', 'henry samueli', 'letters and science'],
  ucr: ['uc riverside', 'riverside', 'bourns', 'school of business'],
  ucsd: ['uc san diego', 'san diego', 'jacobs', 'rady', 'revelle', 'muir'],
  ucsb: ['uc santa barbara', 'santa barbara', 'college of engineering', 'letters and science'],
  ucsc: ['uc santa cruz', 'santa cruz', 'baskin', 'jack baskin'],
  uchicago: ['university of chicago', 'u chicago', 'booth', 'college'],
  uf: ['university of florida', 'florida', 'warrington', 'herbert wertheim'],
  uiuc: ['illinois', 'urbana champaign', 'grainger', 'gies', 'las', 'college of liberal arts and sciences'],
  cu_boulder: ['colorado boulder', 'cu boulder', 'leeds', 'college of engineering and applied science'],
  umich: ['michigan', 'ann arbor', 'ross', 'business school', 'lsa', 'college of literature science and the arts', 'engineering', 'coe'],
  unc: ['chapel hill', 'kenan flagler', 'college of arts and sciences', 'unc chapel hill'],
  notredame: ['notre dame', 'mendoza', 'college of arts and letters', 'college of science'],
  upenn: ['penn', 'wharton', 'seas', 'school of engineering and applied science', 'college of arts and sciences'],
  usc: ['university of southern california', 'marshall', 'viterbi', 'dornsife', 'annenberg'],
  ut: ['ut austin', 'texas austin', 'mccombs', 'cockrell', 'moody', 'college of natural sciences', 'liberal arts'],
  uva: ['university of virginia', 'mcintire', 'engineering', 'college of arts and sciences', 'batten'],
  uw_madison: ['wisconsin madison', 'university of wisconsin', 'wisconsin school of business', 'letters and science'],
  vanderbilt: ['vanderbilt university', 'peabody', 'blair', 'college of arts and science', 'school of engineering'],
  yale: ['yale college', 'school of engineering', 'som'],
  amherst: ['amherst college', 'liberal arts college'],
  bowdoin: ['bowdoin college', 'liberal arts college'],
  williams: ['williams college', 'liberal arts college']
};

const SEARCH_ALIASES = {
  ai: ['artificial intelligence', 'computer science', 'data science'],
  bio: ['biology', 'biological sciences', 'biochemistry', 'health medicine', 'pre med'],
  business: ['business', 'finance', 'management', 'accounting', 'marketing', 'wharton', 'ross', 'stern', 'tepper', 'mccombs', 'marshall', 'mendoza', 'haas', 'questrom', 'goizueta', 'kenan flagler'],
  comp: ['computer science'],
  cs: ['computer science', 'software', 'coding', 'college of computing', 'school of computer science'],
  data: ['data science', 'statistics', 'computer science'],
  eecs: ['electrical engineering', 'computer science', 'cs', 'engineering'],
  econ: ['economics'],
  engineering: ['engineering', 'computer science', 'eecs', 'mechanical engineering', 'electrical engineering', 'college of engineering', 'school of engineering', 'viterbi', 'pratt', 'mccormick', 'grainger', 'cockrell'],
  finance: ['business', 'finance', 'economics', 'wharton', 'stern', 'ross', 'mccombs'],
  health: ['health medicine', 'biology', 'pre med', 'premed', 'nursing'],
  lac: ['liberal arts', 'liberal arts college'],
  med: ['health medicine', 'biology', 'pre med', 'premed'],
  prelaw: ['political science', 'political sci', 'social sciences', 'history', 'philosophy'],
  premed: ['biology', 'health medicine', 'chemistry', 'biochemistry'],
  'pre-med': ['biology', 'health medicine', 'chemistry', 'biochemistry'],
  poli: ['political science', 'political sci'],
  polisci: ['political science', 'political sci'],
  psych: ['psychology', 'social sciences'],
  psychology: ['psychology', 'social sciences'],
  stats: ['statistics', 'data science', 'math'],
  texas: ['state:tx', 'texas', 'applytexas'],
  california: ['state:ca', 'california', 'uc application']
};

const US_STATE_NAMES = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut',
  DE:'Delaware', DC:'District of Columbia', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois',
  IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts',
  MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
  NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota',
  OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington',
  WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming'
};
const STATE_CODES_BY_NAME = Object.entries(US_STATE_NAMES).reduce((acc, [code, name]) => {
  acc[normalizeSearch(name)] = code.toLowerCase();
  return acc;
}, {});
Object.keys(US_STATE_NAMES).forEach(code => { STATE_CODES_BY_NAME[code.toLowerCase()] = code.toLowerCase(); });

function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function searchField(prefix, value) {
  const text = normalizeSearch(value);
  return text ? `${prefix}:${text}` : '';
}

function searchWords(value) {
  return normalizeSearch(value).split(' ').filter(Boolean);
}

function queryTokens(raw) {
  return searchWords(raw).filter(token => token.length > 1 || /\d/.test(token));
}

function stateSearchTerms(token) {
  const key = normalizeSearch(token);
  const code = STATE_CODES_BY_NAME[key];
  if (!code) return [];
  return [`state:${code}`, `state:${normalizeSearch(US_STATE_NAMES[code.toUpperCase()])}`];
}

function stateCodeForSearchToken(token) {
  return STATE_CODES_BY_NAME[normalizeSearch(token)] || '';
}

function expandedSearchTerms(token) {
  const normalized = normalizeSearch(token);
  if (stateCodeForSearchToken(normalized)) return [];
  const terms = new Set([normalized]);
  (SEARCH_ALIASES[normalized] || []).forEach(alias => {
    const normalizedAlias = normalizeSearch(alias);
    if (normalizedAlias && !/^state\s+/.test(normalizedAlias)) terms.add(normalizedAlias);
  });
  return Array.from(terms);
}

function schoolSearchText(s) {
  return [
    s.id, s.ipedsId,
    s.name, s.short, s.location, regionFor(s.state), s.platform, s.aid,
    ...(s.platforms || []),
    ...(s.type || []),
    ...(s.majors || []),
    ...(s.majors || []).map(m => searchField('major', m)),
    ...(SCHOOL_SEARCH_KEYWORDS[s.id] || []),
    ...(SCHOOL_SEARCH_KEYWORDS[s.id] || []).map(k => searchField('college', k))
  ].filter(Boolean).map(normalizeSearch).join(' ');
}

function containsSearchTerm(hay, term) {
  const normalized = normalizeSearch(term);
  if (!normalized) return false;
  if (normalized.includes(' ')) return hay.includes(normalized);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}`).test(hay);
}

function schoolMatchesSearch(s, rawQuery) {
  const phrase = normalizeSearch(rawQuery);
  if (!phrase) return true;
  const exactStateCode = stateCodeForSearchToken(phrase);
  if (exactStateCode) return String(s.state || '').toLowerCase() === exactStateCode;

  const hay = schoolSearchText(s);
  if (containsSearchTerm(hay, phrase)) return true;

  const tokens = queryTokens(rawQuery);
  if (!tokens.length) return true;
  return tokens.every(token => {
    const stateCode = stateCodeForSearchToken(token);
    if (stateCode) return String(s.state || '').toLowerCase() === stateCode;
    return expandedSearchTerms(token).some(term => containsSearchTerm(hay, term));
  });
}

const EX_TABS = [
  { id:'all', label:'All Schools', filter: ()=>true },
  { id:'fit', label:'Best Fit', filter: s => isProfileFitSchool(s) },
  { id:'ivy', label:'Ivies & Elites', filter: s => s.type.includes('Ivy') || ['stanford','mit','cmu','usc','vanderbilt'].includes(s.id) },
  { id:'pub', label:'Public Universities', filter: s => s.type.includes('Public') },
  { id:'lac', label:'Liberal Arts', filter: s => ['dartmouth','brown','amherst','bowdoin','williams'].includes(s.id) },
  { id:'cc',  label:'CC Agreements', filter: s => s.cc },
  {
    id:'gems',
    label:'Hidden Gems',
    note:'Transfer admission is meaningfully more accessible here than regular first-year admission, so these are worth a closer transfer-specific look.',
    filter: s => ['umich','usc','vanderbilt','tulane','notredame','bu','rutgers','ucla','berkeley','columbia'].includes(s.id)
  },
];
let EX_ACTIVE_TAB = 'all';
let EX_FAVS = new Set(USER_APPS.map(a=>a.id));
let EX_VIEW = 'grid';

function renderTabs() {
  const el = document.getElementById('exTabs');
  el.innerHTML = EX_TABS.map(t => {
    const count = SCHOOLS.filter(t.filter).length;
    return `<button class="ex-tab ${t.id===EX_ACTIVE_TAB?'active':''}" onclick="setTab('${t.id}')">${t.label} <span class="badge">${count}</span></button>`;
  }).join('');
}
function setTab(id) { EX_ACTIVE_TAB = id; renderTabs(); renderSchoolGrid(); }

/* ---- multi-criteria filter engine ---- */
const REGION_MAP = {
  Northeast: ['MA','NY','PA','CT','NH','RI','NJ','ME','VT'],
  South:     ['NC','TN','LA','TX','FL','GA','AL','MS','SC','KY','VA','AR','OK','WV','DC','MD'],
  West:      ['CA','WA','OR','NV','AZ','UT','CO','ID','MT','WY','HI','AK','NM'],
  Midwest:   ['MI','OH','IL','IN','WI','MN','IA','MO','KS','NE','SD','ND'],
};
function regionFor(state) {
  for (const [region, states] of Object.entries(REGION_MAP)) {
    if (states.includes(state)) return region;
  }
  return 'Other';
}
function normalizeDeadlineType(t) {
  if (/Rolling/i.test(t))   return 'Rolling';
  if (/Priority/i.test(t))  return 'Priority';
  if (/Spring/i.test(t))    return 'Spring';
  if (/Fall/i.test(t))      return 'Fall';
  return 'Fall';
}
function getCheckedValues(group) {
  const panel = document.querySelector(`[data-filter="${group}"]`);
  if (!panel) return [];
  return Array.from(panel.querySelectorAll('input[type=checkbox]:checked'))
    .map(i => i.value || i.dataset.value)
    .filter(Boolean);
}
function getActiveChipValues(group) {
  const panel = document.querySelector(`[data-filter="${group}"]`);
  if (!panel) return { all: [], active: [] };
  const all = Array.from(panel.querySelectorAll('.chip'))
    .map(c => c.dataset.value || c.textContent.trim());
  const active = Array.from(panel.querySelectorAll('.chip.active'))
    .map(c => c.dataset.value || c.textContent.trim());
  return { all, active };
}

function rangeFilterNumber(id, fallback) {
  const el = document.getElementById(id);
  if (!el || el.dataset.dirty !== 'true') return fallback;
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function markRangeFilterDirty(el) {
  if (el) el.dataset.dirty = 'true';
  onFilter();
}

function normalizeExploreFilterDefaults() {
  const gpa = document.getElementById('gpaRange');
  const acc = document.getElementById('accRange');
  const search = document.getElementById('schoolSearch');
  if (gpa) { gpa.value = '2.5'; delete gpa.dataset.dirty; }
  if (acc) { acc.value = '100'; delete acc.dataset.dirty; }
  if (search) search.value = '';
  document.querySelectorAll('[data-filter="platform"] input[type=checkbox]').forEach(input => {
    input.checked = false;
  });
  document.querySelectorAll('[data-filter="deadline"] .chip.active, [data-filter="fee"] .chip.active, [data-filter="region"] .chip.active, [data-filter="transfer"] .chip.active').forEach(chip => {
    chip.classList.remove('active');
  });
  const gpaVal = document.getElementById('gpaVal');
  const accVal = document.getElementById('accVal');
  const badge = document.getElementById('filterActiveCount');
  const searchWrap = document.querySelector('.ex-search');
  if (gpaVal) gpaVal.textContent = '2.50';
  if (accVal) accVal.textContent = '100%';
  if (badge) badge.textContent = '';
  if (searchWrap) searchWrap.classList.remove('has-value');
}

function applyFilters() {
  const tab = EX_TABS.find(t => t.id === EX_ACTIVE_TAB);
  const gpa = rangeFilterNumber('gpaRange', 2.5);
  const acc = rangeFilterNumber('accRange', 100);
  const q   = (document.getElementById('schoolSearch')?.value || '').trim().toLowerCase();

  const plats = getCheckedValues('platform');

  // Chip-based filters: empty = no filter (show all), any active = require match
  const region   = getActiveChipValues('region');
  const deadline = getActiveChipValues('deadline');
  const fee      = getActiveChipValues('fee');
  const xfer     = getActiveChipValues('transfer');

  const activeRegions   = region.active.length > 0 ? region.active : null;
  const activeDeadlines = deadline.active.length > 0 ? deadline.active : null;
  const activeFee       = fee.active.length > 0 ? new Set(fee.active) : null;
  const activeXfer      = xfer.active.length > 0 ? new Set(xfer.active) : null;

  // Count active filters for badge
  var filterCount = 0;
  if (gpa > 2.5) filterCount++;
  if (acc < 100) filterCount++;
  if (plats.length > 0) filterCount++;
  if (activeRegions) filterCount++;
  if (activeDeadlines) filterCount++;
  if (activeFee) filterCount++;
  if (activeXfer) filterCount++;
  if (q) filterCount++;
  var badge = document.getElementById('filterActiveCount');
  if (badge) badge.textContent = filterCount > 0 ? filterCount + ' active' : '';

  return SCHOOLS.filter(s => {
    if (!tab.filter(s)) return false;
    if (hasPublishedGpa(s) && s.gpa < gpa) return false;
    if (typeof s.accept === 'number' && s.accept > acc) return false;

    if (q && !schoolMatchesSearch(s, q)) return false;

    if (plats.length && !plats.some(platform => (s.platforms || [s.platform]).includes(platform))) return false;

    if (activeRegions && !activeRegions.includes(regionFor(s.state))) return false;

    if (activeDeadlines && !activeDeadlines.includes(normalizeDeadlineType(compactDeadlineType(s)))) return false;

    // Fee filters
    if (activeFee) {
      var feeMatch = false;
      if (activeFee.has('waiver') && s.waiver) feeMatch = true;
      if (activeFee.has('free') && s.fee === 0) feeMatch = true;
      if (!feeMatch) return false;
    }

    // Transfer-specific filters
    if (activeXfer) {
      if (activeXfer.has('cc') && !s.cc) return false;
      if (activeXfer.has('instate') && !(s.tuition && s.tuition.in && s.tuition.out && s.tuition.in < s.tuition.out)) return false;
      if (activeXfer.has('needblind') && !/need-blind|no-loan|need-based|meets full/i.test(s.aid || '')) return false;
    }

    return true;
  });
}

function sortSchools(arr) {
  const mode = document.getElementById('sortSelect')?.value || 'relevant';
  const copy = [...arr];
  if (mode === 'relevant') {
    copy.sort((a, b) => {
      const fit = profileFitScore(a) - profileFitScore(b);
      if (Math.abs(fit) > 0.001) return fit;
      return (a.accept ?? 999) - (b.accept ?? 999);
    });
  }
  else if (mode === 'deadline') {
    copy.sort((a,b) => {
      const ad = localDayStart(compactDeadlineDate(a)).getTime();
      const bd = localDayStart(compactDeadlineDate(b)).getTime();
      return ad - bd || a.name.localeCompare(b.name);
    });
  }
  else if (mode === 'accept') copy.sort((a,b) => (b.accept ?? -1) - (a.accept ?? -1));
  else if (mode === 'alpha') copy.sort((a,b) => a.name.localeCompare(b.name));
  return copy;
}

function onFilter() {
  const gpaEl = document.getElementById('gpaRange');
  const accEl = document.getElementById('accRange');
  if (gpaEl) document.getElementById('gpaVal').textContent = Number(gpaEl.value).toFixed(2);
  if (accEl) document.getElementById('accVal').textContent = accEl.value + '%';
  const search = document.getElementById('schoolSearch');
  const searchWrap = document.querySelector('.ex-search');
  if (search && searchWrap) searchWrap.classList.toggle('has-value', !!search.value);
  renderSchoolGrid();
}
function clearSearch() {
  const s = document.getElementById('schoolSearch');
  if (s) { s.value = ''; s.focus(); onFilter(); }
}
function resetFilters() {
  normalizeExploreFilterDefaults();
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = 'relevant';
  EX_ACTIVE_TAB = 'all';
  renderTabs();
  onFilter();
  toast('Filters cleared.');
}
function setView(v) {
  EX_VIEW = v;
  document.querySelectorAll('#viewToggle button').forEach((b,i) => b.classList.toggle('active', (i===0 && v==='grid') || (i===1 && v==='table')));
  document.getElementById('schoolGrid').style.display = v==='grid'?'grid':'none';
  document.getElementById('schoolTable').style.display = v==='table'?'block':'none';
  renderSchoolGrid();
}

const STATE_COORDS = {
  AL:[32.8,-86.8], AK:[64.2,-149.5], AZ:[34.3,-111.7], AR:[35.0,-92.4], CA:[36.8,-119.4],
  CO:[39.0,-105.5], CT:[41.6,-72.7], DC:[38.9,-77.0], DE:[39.0,-75.5], FL:[28.0,-82.0],
  GA:[33.0,-83.5], HI:[20.8,-156.3], IA:[42.0,-93.5], ID:[44.2,-114.4], IL:[40.0,-89.2],
  IN:[40.0,-86.1], KS:[38.5,-98.0], KY:[37.8,-85.8], LA:[31.0,-92.0], MA:[42.2,-71.8],
  MD:[39.0,-76.7], ME:[45.3,-69.0], MI:[44.3,-85.6], MN:[46.3,-94.2], MO:[38.5,-92.5],
  MS:[32.7,-89.7], MT:[47.0,-110.0], NC:[35.5,-79.4], ND:[47.5,-100.5], NE:[41.5,-99.8],
  NH:[43.7,-71.6], NJ:[40.1,-74.7], NM:[34.4,-106.1], NV:[39.3,-116.6], NY:[42.9,-75.0],
  OH:[40.3,-82.8], OK:[35.6,-97.5], OR:[44.0,-120.5], PA:[41.0,-77.8], RI:[41.7,-71.6],
  SC:[33.8,-80.9], SD:[44.4,-100.2], TN:[35.8,-86.4], TX:[31.0,-99.9], UT:[39.3,-111.7],
  VA:[37.5,-78.7], VT:[44.0,-72.7], WA:[47.4,-120.7], WI:[44.6,-89.8], WV:[38.6,-80.6],
  WY:[43.0,-107.5]
};
const SCHOOL_COORDS = {
  umich:[42.28,-83.74], berkeley:[37.87,-122.26], ucla:[34.07,-118.45], stanford:[37.43,-122.17],
  mit:[42.36,-71.09], cmu:[40.44,-79.94], cornell:[42.45,-76.48], upenn:[39.95,-75.19],
  harvard:[42.37,-71.12], yale:[41.31,-72.93], columbia:[40.81,-73.96], dartmouth:[43.70,-72.29],
  brown:[41.83,-71.40], vanderbilt:[36.14,-86.80], usc:[34.02,-118.29], unc:[35.91,-79.05],
  ucsd:[32.88,-117.23], ucsb:[34.41,-119.85], uci:[33.65,-117.84], ucd:[38.54,-121.75],
  ucr:[33.97,-117.33], ucsc:[36.99,-122.06], duke:[36.00,-78.94], princeton:[40.34,-74.65],
  northwestern:[42.06,-87.68], nyu:[40.73,-73.99], rice:[29.72,-95.40], emory:[33.79,-84.32],
  georgetown:[38.91,-77.07], jhu:[39.33,-76.62], gatech:[33.78,-84.40], notredame:[41.70,-86.24],
  uchicago:[41.79,-87.60], boston_college:[42.34,-71.17], bu:[42.35,-71.10], caltech:[34.14,-118.13],
  tufts:[42.41,-71.12], uva:[38.03,-78.51], uf:[29.65,-82.35], rutgers:[40.50,-74.45],
  washu:[38.65,-90.31], uiuc:[40.10,-88.23], amherst:[42.37,-72.52], bowdoin:[43.91,-69.96],
  cu_boulder:[40.01,-105.27], williams:[42.71,-73.20]
};
// Natural Earth 1:110m coastline polygons via world-atlas. Stored inline so the globe works from file:// and Netlify.
const WORLD_LAND = [[[68.96,-180.0],[68.2,-177.55],[67.21,-174.93],[66.58,-175.01],[66.34,-174.34],[67.06,-174.57],[66.91,-171.86],[65.98,-169.9],[65.54,-170.89],[65.44,-172.53],[64.46,-172.56],[64.25,-172.95],[64.28,-173.89],[64.63,-174.65],[64.92,-175.98],[65.36,-176.21],[65.52,-177.22],[65.39,-178.36],[65.74,-178.9],[66.11,-178.69],[65.87,-179.88],[65.4,-179.43],[64.98,-180.0],[64.97,179.99],[64.53,178.71],[64.61,177.41],[64.08,178.31],[63.25,178.91],[62.98,179.37],[62.57,179.49],[62.3,179.23],[62.52,177.36],[61.77,174.57],[61.65,173.68],[60.95,172.15],[60.34,170.7],[59.88,170.33],[60.57,168.9],[59.79,166.29],[60.16,165.84],[59.73,164.88],[59.87,163.54],[59.21,163.22],[58.24,162.02],[57.84,162.05],[57.62,163.19],[56.16,163.06],[56.12,162.13],[55.29,161.7],[54.85,162.12],[54.35,160.37],[53.2,160.02],[52.96,158.53],[51.94,158.23],[51.01,156.79],[51.7,156.42],[53.16,155.99],[55.38,155.43],[56.77,155.92],[57.36,156.76],[57.83,156.81],[58.06,158.36],[59.31,160.15],[60.34,161.87],[61.14,163.67],[62.55,164.47],[62.47,163.26],[61.64,162.66],[60.55,160.12],[61.77,159.3],[61.43,156.72],[59.76,154.22],[59.15,155.04],[58.88,152.81],[58.78,151.26],[59.5,151.34],[59.66,149.78],[59.16,148.55],[59.34,145.49],[59.04,142.2],[57.09,138.96],[54.73,135.13],[54.6,136.7],[53.98,137.19],[53.75,138.16],[54.26,138.8],[54.19,139.9],[53.09,141.35],[52.24,141.38],[51.24,140.6],[50.05,140.51],[48.45,140.06],[47.0,138.56],[46.31,138.22],[45.14,136.86],[43.99,135.51],[43.4,134.87],[42.81,133.54],[42.8,132.91],[43.28,132.28],[42.55,130.94],[42.22,130.78],[42.28,130.4],[41.94,129.97],[41.6,129.67],[40.88,129.7],[40.66,129.19],[40.48,129.01],[40.19,128.63],[40.03,127.97],[39.76,127.53],[39.32,127.5],[39.21,127.39],[39.05,127.79],[38.61,128.35],[37.43,129.21],[36.78,129.46],[35.63,129.47],[35.08,129.09],[34.89,128.18],[34.48,127.39],[34.39,126.49],[34.93,126.37],[35.68,126.56],[36.73,126.12],[36.89,126.86],[37.75,126.18],[37.94,125.69],[37.75,125.57],[37.67,125.28],[37.86,125.24],[37.95,124.98],[38.11,124.71],[38.55,124.99],[38.67,125.22],[38.85,125.13],[39.39,125.39],[39.55,125.32],[39.66,124.74],[39.93,124.26],[39.64,122.87],[39.17,122.13],[38.9,121.05],[39.36,121.59],[39.75,121.38],[40.42,122.17],[40.95,121.64],[40.59,120.77],[39.9,119.64],[39.25,119.02],[39.2,118.04],[38.74,117.53],[38.06,118.06],[37.9,118.88],[37.45,118.91],[37.16,119.7],[37.87,120.82],[37.48,121.71],[37.46,122.36],[36.93,122.52],[36.65,121.1],[36.11,120.64],[35.61,119.66],[34.91,119.15],[34.36,120.23],[33.38,120.62],[32.46,121.23],[31.69,121.91],[30.95,121.89],[30.68,121.27],[30.14,121.5],[29.83,122.09],[29.02,121.94],[28.23,121.68],[28.14,121.13],[27.05,120.39],[25.74,119.58],[24.55,118.66],[23.63,117.28],[22.78,115.89],[22.67,114.76],[22.22,114.15],[22.55,113.81],[22.05,113.24],[21.55,111.84],[21.4,110.79],[20.34,110.44],[20.28,109.89],[21.01,109.63],[21.39,109.86],[21.72,108.52],[21.55,108.05],[20.7,106.71],[19.75,105.88],[19.06,105.66],[18.0,106.43],[16.7,107.36],[16.08,108.27],[15.28,108.88],[13.43,109.33],[11.67,109.2],[11.01,108.37],[10.36,107.22],[9.53,106.4],[8.6,105.16],[9.24,104.8],[9.92,105.08],[10.49,104.33],[10.63,103.5],[11.15,103.09],[12.19,102.58],[12.65,101.69],[12.63,100.83],[13.41,100.98],[13.41,100.1],[12.31,100.02],[10.85,99.48],[9.96,99.15],[9.24,99.22],[9.21,99.87],[8.3,100.28],[7.43,100.46],[6.86,101.02],[6.74,101.62],[6.22,102.14],[6.13,102.37],[5.53,102.96],[4.85,103.38],[4.18,103.44],[3.73,103.33],[3.38,103.43],[2.79,103.5],[2.52,103.86],[1.63,104.25],[1.29,104.23],[1.23,103.52],[1.97,102.57],[2.76,101.39],[3.27,101.27],[3.94,100.69],[4.77,100.56],[5.31,100.2],[6.04,100.31],[6.46,100.09],[6.85,99.69],[7.34,99.52],[7.91,98.99],[8.38,98.5],[7.79,98.34],[8.35,98.15],[8.97,98.26],[9.93,98.55],[10.68,98.46],[11.44,98.77],[12.03,98.43],[13.12,98.51],[13.64,98.1],[14.84,97.78],[16.1,97.6],[16.93,97.16],[16.43,96.5],[15.71,95.37],[15.8,94.81],[16.04,94.19],[17.28,94.54],[18.21,94.33],[19.37,93.54],[19.73,93.66],[19.86,93.08],[20.67,92.37],[21.19,92.08],[21.7,92.03],[22.18,91.84],[22.77,91.42],[22.8,90.5],[22.39,90.59],[21.84,90.27],[22.04,89.85],[21.86,89.7],[21.97,89.42],[22.06,89.03],[21.69,88.89],[21.7,88.21],[21.5,86.98],[20.74,87.03],[20.15,86.5],[19.48,85.06],[18.3,83.94],[17.67,83.19],[17.02,82.19],[16.56,82.19],[16.31,81.69],[15.95,80.79],[15.9,80.33],[15.14,80.02],[13.84,80.23],[13.01,80.29],[12.06,79.86],[10.36,79.86],[10.31,79.34],[9.55,78.89],[9.22,79.19],[8.93,78.28],[8.25,77.94],[7.97,77.54],[8.9,76.59],[10.3,76.13],[11.31,75.75],[11.78,75.4],[12.74,74.86],[13.99,74.62],[14.62,74.44],[15.99,73.53],[17.93,73.12],[19.21,72.82],[20.42,72.82],[21.36,72.63],[20.76,71.17],[20.88,70.47],[22.09,69.17],[22.45,69.64],[22.84,69.35],[23.69,68.18],[23.95,67.44],[24.66,67.15],[25.42,66.37],[25.24,64.53],[25.22,62.91],[25.08,61.5],[25.38,59.61],[25.61,58.53],[25.74,57.4],[26.97,56.97],[27.14,56.49],[26.96,55.72],[26.48,54.72],[26.81,53.49],[27.58,52.48],[27.87,51.52],[28.81,50.85],[30.15,50.11],[29.99,49.58],[30.32,48.94],[29.93,48.57],[29.98,47.98],[29.53,48.18],[29.31,48.09],[28.55,48.42],[27.69,48.81],[27.46,49.3],[27.11,49.47],[26.69,50.15],[26.28,50.21],[25.94,50.11],[25.61,50.24],[25.33,50.53],[25.0,50.66],[24.75,50.81],[25.48,50.74],[26.01,51.01],[26.12,51.29],[25.8,51.59],[25.22,51.61],[24.63,51.39],[24.24,51.58],[24.29,51.76],[24.02,51.8],[24.18,52.58],[24.15,53.4],[24.12,54.01],[24.8,54.69],[25.44,55.44],[26.06,56.07],[26.4,56.36],[26.31,56.49],[25.9,56.39],[25.71,56.26],[24.93,56.4],[24.24,56.85],[23.88,57.4],[23.75,58.14],[23.57,58.73],[22.99,59.18],[22.66,59.45],[22.53,59.81],[22.31,59.81],[21.71,59.44],[21.43,59.28],[21.11,58.86],[20.43,58.49],[20.48,58.03],[20.24,57.83],[19.74,57.67],[19.07,57.79],[18.95,57.7],[18.95,57.24],[18.57,56.61],[18.09,56.51],[17.88,56.28],[17.88,55.66],[17.63,55.27],[17.23,55.27],[16.95,54.79],[17.04,54.24],[16.71,53.57],[16.65,53.11],[16.38,52.39],[15.94,52.19],[15.6,52.17],[15.18,51.17],[14.71,49.57],[14.0,48.68],[13.95,48.24],[14.01,47.94],[13.59,47.35],[13.4,46.72],[13.35,45.88],[13.29,45.63],[13.03,45.41],[12.95,45.14],[12.7,44.99],[12.72,44.49],[12.59,44.17],[12.64,43.48],[13.22,43.22],[13.77,43.25],[14.06,43.09],[14.8,42.89],[15.21,42.6],[15.26,42.81],[15.72,42.7],[15.91,42.82],[16.35,42.78],[16.78,42.65],[17.08,42.35],[17.47,42.27],[17.83,41.76],[18.67,41.22],[19.49,40.94],[20.17,40.25],[20.34,39.8],[21.29,39.14],[21.99,39.02],[22.58,39.07],[23.69,38.49],[24.08,38.03],[24.29,37.49],[24.86,37.15],[25.08,37.21],[25.6,36.93],[25.83,36.64],[26.57,36.25],[27.38,35.64],[28.06,35.13],[28.06,34.63],[28.61,34.79],[28.96,34.83],[29.36,34.95],[29.5,34.92],[29.1,34.64],[28.34,34.43],[27.82,34.16],[27.65,33.92],[27.97,33.59],[28.42,33.14],[29.85,32.42],[29.76,32.32],[28.7,32.73],[27.7,33.35],[26.14,34.1],[25.6,34.47],[25.03,34.8],[23.93,35.69],[23.75,35.49],[23.1,35.53],[22.21,36.69],[22.0,36.87],[21.02,37.19],[20.84,36.97],[19.81,37.11],[18.61,37.48],[18.37,37.86],[18.0,38.41],[16.84,38.99],[15.92,39.27],[15.44,39.81],[14.49,41.18],[13.92,41.73],[13.34,42.28],[13.0,42.59],[12.7,43.08],[12.39,43.32],[11.98,43.29],[11.74,42.72],[11.46,43.14],[11.28,43.47],[10.87,43.67],[10.45,44.12],[10.44,44.61],[10.7,45.56],[10.82,46.64],[11.13,47.53],[11.19,48.02],[11.38,48.38],[11.41,48.95],[11.43,49.27],[11.58,49.73],[11.68,50.26],[12.02,50.73],[12.02,51.11],[11.75,51.13],[11.17,51.04],[10.64,51.05],[10.28,50.83],[9.2,50.55],[8.08,50.07],[6.8,49.45],[5.34,48.6],[4.22,47.74],[2.86,46.56],[2.05,45.56],[1.05,44.07],[0.29,43.14],[-0.92,42.04],[-1.45,41.81],[-1.68,41.59],[-2.08,40.88],[-2.5,40.64],[-2.57,40.26],[-3.28,40.12],[-3.68,39.8],[-4.35,39.61],[-4.68,39.2],[-5.91,38.74],[-6.48,38.8],[-6.84,39.44],[-7.1,39.47],[-7.7,39.2],[-8.01,39.25],[-8.49,39.19],[-9.11,39.54],[-10.1,39.95],[-10.32,40.32],[-10.77,40.48],[-11.76,40.44],[-12.64,40.56],[-14.2,40.6],[-14.69,40.78],[-15.41,40.48],[-16.1,40.09],[-16.72,39.45],[-17.1,38.54],[-17.59,37.41],[-18.66,36.28],[-18.84,35.9],[-19.55,35.2],[-19.78,34.79],[-20.5,34.7],[-21.25,35.18],[-21.84,35.37],[-22.14,35.39],[-22.09,35.56],[-23.07,35.53],[-23.53,35.37],[-23.71,35.61],[-24.12,35.46],[-24.48,35.04],[-24.82,34.22],[-25.36,33.01],[-25.73,32.57],[-26.15,32.66],[-26.22,32.92],[-26.74,32.83],[-27.47,32.58],[-28.3,32.46],[-28.75,32.2],[-29.26,31.52],[-29.4,31.33],[-29.91,30.9],[-30.42,30.62],[-31.14,30.05],[-32.17,28.92],[-32.77,28.22],[-33.23,27.47],[-33.62,26.42],[-33.67,25.91],[-33.95,25.78],[-33.8,25.17],[-33.99,24.68],[-33.79,23.59],[-33.92,22.99],[-33.86,22.57],[-34.26,21.54],[-34.42,20.69],[-34.8,20.07],[-34.82,19.61],[-34.46,19.19],[-34.44,18.86],[-34.0,18.42],[-34.14,18.38],[-33.87,18.24],[-33.28,18.25],[-32.61,17.93],[-32.43,18.25],[-31.66,18.22],[-30.73,17.57],[-29.88,17.07],[-29.88,17.06],[-28.58,16.35],[-27.82,15.6],[-27.09,15.21],[-26.12,14.99],[-25.39,14.74],[-23.85,14.41],[-22.66,14.38],[-22.11,14.26],[-21.7,13.87],[-20.87,13.35],[-19.67,12.83],[-19.05,12.61],[-18.07,11.8],[-17.3,11.73],[-16.67,11.64],[-15.79,11.78],[-14.88,12.12],[-14.45,12.18],[-13.55,12.5],[-13.14,12.74],[-12.48,13.31],[-12.04,13.64],[-11.3,13.74],[-10.73,13.69],[-10.37,13.39],[-9.77,13.12],[-9.17,12.88],[-8.96,12.93],[-8.56,13.24],[-7.6,12.93],[-6.93,12.73],[-6.29,12.23],[-6.1,12.32],[-5.79,12.18],[-5.04,11.91],[-3.98,11.09],[-2.97,10.07],[-2.14,9.41],[-1.11,8.8],[-0.78,8.83],[-0.46,9.05],[0.27,9.29],[1.01,9.49],[1.16,9.3],[2.28,9.65],[3.07,9.79],[3.73,9.41],[3.9,8.95],[4.35,8.75],[4.5,8.49],[4.77,8.5],[4.41,7.46],[4.47,7.08],[4.24,6.7],[4.26,5.9],[4.89,5.36],[5.61,5.03],[6.27,4.33],[6.26,3.57],[6.26,2.69],[6.14,1.87],[5.93,1.06],[5.34,-0.51],[5.0,-1.06],[4.71,-1.96],[5.0,-2.86],[4.98,-3.31],[5.18,-4.01],[5.17,-4.65],[4.99,-5.83],[4.71,-6.53],[4.34,-7.52],[4.36,-7.71],[4.36,-7.98],[4.83,-9.01],[5.59,-9.91],[6.14,-10.77],[6.79,-11.44],[6.86,-11.71],[7.26,-12.43],[7.8,-12.95],[8.16,-13.12],[8.9,-13.25],[9.49,-13.69],[9.89,-14.07],[10.02,-14.33],[10.22,-14.58],[10.66,-14.69],[10.88,-14.84],[11.04,-15.13],[11.46,-15.67],[11.53,-16.09],[11.81,-16.31],[11.96,-16.31],[12.17,-16.61],[12.39,-16.68],[13.15,-16.84],[13.6,-16.71],[14.37,-17.13],[14.73,-17.62],[14.92,-17.18],[15.62,-16.7],[16.14,-16.46],[16.67,-16.55],[17.17,-16.27],[18.11,-16.15],[19.1,-16.26],[19.59,-16.38],[20.09,-16.28],[20.57,-16.54],[21.0,-17.06],[21.42,-17.02],[21.89,-16.97],[22.16,-16.59],[22.68,-16.26],[23.02,-16.33],[23.72,-15.98],[24.36,-15.42],[24.52,-15.09],[25.1,-14.82],[25.64,-14.8],[26.25,-14.44],[26.62,-13.78],[27.64,-13.14],[28.04,-12.62],[28.15,-11.69],[28.83,-10.9],[29.1,-10.4],[29.93,-9.56],[31.18,-9.82],[32.04,-9.43],[32.57,-9.3],[33.24,-8.66],[33.7,-7.66],[34.11,-6.91],[35.15,-6.24],[35.76,-5.93],[35.76,-5.19],[35.33,-4.59],[35.4,-3.64],[35.18,-2.6],[35.17,-2.17],[35.72,-1.21],[35.89,-0.13],[36.3,0.5],[36.61,1.47],[36.78,3.16],[36.86,4.82],[36.72,5.32],[37.11,6.26],[37.12,7.33],[36.89,7.74],[36.95,8.42],[37.35,9.51],[37.23,10.21],[36.72,10.18],[37.09,11.03],[36.9,11.1],[36.41,10.6],[35.95,10.59],[35.7,10.94],[34.83,10.81],[34.33,10.15],[33.79,10.34],[33.77,10.86],[33.29,11.11],[33.14,11.49],[32.79,12.66],[32.88,13.08],[32.71,13.92],[32.27,15.24],[31.38,15.71],[31.18,16.61],[30.76,18.02],[30.27,19.09],[30.53,19.58],[30.99,20.05],[31.75,19.82],[32.24,20.13],[32.71,20.85],[32.84,21.54],[32.64,22.89],[32.19,23.24],[32.19,23.61],[32.02,23.93],[31.9,24.92],[31.57,25.17],[31.59,26.49],[31.32,27.46],[31.03,28.45],[30.87,28.91],[31.19,29.68],[31.47,30.09],[31.56,30.98],[31.43,31.69],[30.93,31.96],[31.26,32.19],[31.02,32.99],[30.97,33.77],[31.22,34.27],[31.55,34.55],[31.61,34.49],[32.07,34.75],[32.83,34.95],[33.08,35.1],[33.09,35.13],[33.91,35.48],[34.61,35.98],[34.65,36.0],[35.41,35.9],[35.82,36.15],[36.28,35.78],[36.65,36.16],[36.56,35.55],[36.8,34.71],[36.22,34.03],[36.11,32.51],[36.64,31.7],[36.68,30.62],[36.26,30.39],[36.14,29.7],[36.68,28.73],[36.66,27.64],[37.65,27.05],[38.21,26.32],[38.99,26.8],[39.46,26.17],[40.42,27.28],[40.46,28.82],[41.22,29.24],[41.09,31.15],[41.74,32.35],[42.02,33.51],[42.04,35.17],[41.34,36.91],[40.95,38.35],[41.1,39.51],[41.01,40.37],[41.54,41.55],[41.96,41.7],[42.64,41.45],[43.01,40.88],[43.13,40.32],[43.44,39.95],[44.28,38.68],[44.66,37.54],[45.24,36.68],[45.41,37.4],[46.24,38.23],[46.64,37.67],[47.05,39.15],[47.26,39.12],[47.1,38.22],[47.02,37.42],[46.7,36.76],[46.65,35.82],[46.27,34.96],[45.65,35.02],[45.41,35.51],[45.47,36.53],[45.11,36.33],[44.94,35.24],[44.36,33.88],[44.57,33.33],[45.03,33.55],[45.33,32.45],[45.52,32.63],[45.85,33.59],[46.08,33.3],[46.33,31.74],[46.71,31.67],[46.58,30.75],[46.03,30.38],[45.29,29.6],[45.04,29.63],[44.82,29.14],[44.91,28.84],[43.71,28.56],[43.29,28.04],[42.58,27.68],[42.01,28.0],[41.62,28.11],[41.3,28.99],[41.06,28.81],[41.0,27.62],[40.69,27.19],[40.15,26.36],[40.62,26.04],[40.82,26.06],[40.85,25.45],[40.95,24.92],[40.69,23.72],[40.12,24.41],[39.96,23.9],[39.96,23.34],[40.48,22.82],[40.26,22.63],[39.66,22.85],[39.19,23.35],[38.97,22.97],[38.51,23.53],[38.22,24.02],[37.65,24.04],[37.92,23.11],[37.41,23.41],[37.3,22.78],[36.42,23.15],[36.41,22.49],[36.85,21.67],[37.64,21.3],[38.31,21.12],[38.77,20.73],[39.34,20.22],[39.63,20.15],[39.69,19.98],[39.91,19.96],[40.25,19.41],[40.73,19.32],[41.41,19.4],[41.72,19.54],[41.88,19.37],[41.96,19.16],[42.28,18.88],[42.48,18.45],[42.85,17.51],[43.21,16.93],[43.51,16.01],[44.24,15.18],[44.32,15.38],[44.74,14.92],[45.08,14.9],[45.23,14.26],[44.8,13.95],[45.14,13.66],[45.48,13.68],[45.5,13.71],[45.59,13.94],[45.74,13.14],[45.38,12.33],[44.89,12.38],[44.6,12.26],[44.09,12.59],[43.59,13.53],[42.76,14.03],[41.96,15.14],[41.96,15.92],[41.74,16.17],[41.54,15.89],[41.18,16.79],[40.88,17.52],[40.36,18.38],[40.17,18.48],[39.81,18.29],[40.28,17.74],[40.44,16.87],[39.8,16.45],[39.43,17.17],[38.9,17.05],[38.84,16.63],[37.99,16.1],[37.91,15.68],[38.22,15.69],[38.75,15.89],[38.96,16.11],[39.54,15.72],[40.05,15.41],[40.17,15.0],[40.61,14.7],[40.79,14.06],[41.19,13.63],[41.25,12.89],[41.71,12.11],[42.36,11.19],[42.93,10.51],[43.92,10.2],[44.04,9.7],[44.37,8.89],[44.23,8.43],[43.77,7.85],[43.69,7.44],[43.13,6.53],[43.4,4.56],[43.07,3.1],[42.47,2.99],[41.89,3.04],[41.23,2.09],[41.01,0.81],[40.68,0.72],[40.12,0.11],[39.31,-0.28],[38.74,0.11],[38.29,-0.47],[37.64,-0.68],[37.44,-1.44],[36.67,-2.15],[36.66,-3.41],[36.68,-4.37],[36.32,-5.0],[35.95,-5.38],[36.03,-5.87],[36.37,-6.24],[36.94,-6.52],[37.1,-7.45],[36.84,-7.86],[36.98,-8.38],[36.87,-8.9],[37.65,-8.75],[38.27,-8.84],[38.36,-9.29],[38.74,-9.53],[39.39,-9.45],[39.76,-9.05],[40.16,-8.98],[40.76,-8.77],[41.18,-8.79],[41.54,-8.99],[41.88,-9.03],[42.59,-8.98],[43.03,-9.39],[43.75,-7.98],[43.57,-6.76],[43.57,-5.41],[43.4,-4.35],[43.46,-3.52],[43.42,-1.9],[44.02,-1.38],[46.01,-1.19],[47.06,-2.23],[47.57,-2.96],[47.96,-4.49],[48.68,-4.59],[48.9,-3.3],[48.64,-1.62],[49.78,-1.94],[49.35,-0.99],[50.13,1.34],[50.95,1.64],[51.15,2.51],[51.35,3.31],[51.62,3.83],[53.09,4.71],[53.51,6.08],[53.48,6.91],[53.69,7.1],[53.75,7.94],[53.53,8.12],[54.02,8.8],[54.4,8.57],[54.96,8.53],[55.52,8.12],[56.54,8.09],[56.81,8.26],[57.11,8.54],[57.17,9.42],[57.45,9.78],[57.73,10.58],[57.22,10.55],[56.89,10.25],[56.61,10.37],[56.46,10.91],[56.08,10.67],[56.19,10.37],[55.47,9.65],[54.98,9.92],[54.6,9.94],[54.36,10.95],[54.01,10.94],[54.2,11.96],[54.47,12.52],[54.08,13.65],[53.76,14.12],[54.05,14.8],[54.51,16.36],[54.85,17.62],[54.68,18.62],[54.44,18.7],[54.43,19.66],[54.87,19.89],[55.19,21.27],[56.03,21.05],[56.78,21.09],[57.41,21.58],[57.75,22.52],[57.01,23.32],[57.03,24.12],[57.79,24.31],[58.38,24.43],[58.26,24.06],[58.61,23.43],[59.19,23.34],[59.47,24.6],[59.61,25.86],[59.45,26.95],[59.48,27.98],[60.03,29.12],[60.5,28.07],[60.42,26.26],[60.06,24.5],[59.85,22.87],[60.39,22.29],[60.72,21.32],[61.7,21.54],[62.61,21.06],[63.19,21.54],[63.82,22.44],[64.9,24.73],[65.11,25.4],[65.53,25.3],[66.01,23.9],[65.72,22.18],[65.03,21.21],[64.41,21.37],[63.61,19.78],[62.75,17.85],[61.34,17.12],[60.64,17.83],[60.08,18.79],[58.95,17.87],[58.72,16.83],[57.04,16.45],[56.1,15.88],[56.2,14.67],[55.41,14.1],[55.36,12.94],[56.31,12.62],[57.44,11.79],[58.86,11.03],[59.47,10.36],[58.31,8.38],[58.08,7.05],[58.59,5.66],[59.66,5.31],[61.97,4.99],[62.62,5.91],[63.45,8.55],[64.49,10.53],[65.88,12.36],[67.81,14.76],[68.56,16.44],[69.82,19.18],[70.26,21.38],[70.2,23.02],[71.03,24.55],[70.99,26.37],[71.19,28.16],[70.45,31.29],[70.19,30.0],[69.56,31.1],[69.91,32.13],[69.3,33.77],[69.06,36.51],[67.93,40.29],[67.46,41.06],[66.79,41.13],[66.27,40.02],[66.0,38.38],[66.76,33.92],[66.63,33.18],[65.9,34.81],[64.41,34.94],[64.11,36.23],[63.85,37.01],[64.33,37.14],[64.78,36.52],[65.14,37.18],[64.52,39.59],[64.76,40.44],[65.5,39.76],[66.48,42.09],[66.42,43.02],[66.07,43.95],[66.76,44.53],[67.35,43.7],[67.95,44.19],[68.57,43.45],[68.25,46.25],[67.69,46.82],[67.57,45.56],[67.01,45.56],[66.67,46.35],[66.88,47.89],[67.52,48.14],[68.0,50.23],[68.86,53.72],[68.81,54.47],[68.2,53.49],[68.1,54.73],[68.44,55.44],[68.47,57.32],[68.88,58.8],[68.28,59.94],[68.94,61.08],[69.52,60.03],[69.85,60.55],[69.55,63.5],[69.23,64.89],[68.09,68.51],[68.62,69.18],[69.14,68.16],[69.36,68.14],[69.45,66.93],[69.93,67.26],[70.71,66.72],[71.03,66.7],[71.93,68.54],[72.84,69.19],[73.04,69.94],[72.78,72.59],[72.22,72.79],[71.41,71.85],[71.09,72.47],[70.39,72.79],[69.02,72.56],[68.41,73.67],[67.74,73.24],[66.32,71.28],[66.17,72.42],[66.53,72.82],[66.79,73.92],[67.28,74.19],[67.76,75.05],[68.33,74.47],[68.99,74.94],[69.07,73.84],[69.63,73.6],[70.63,74.4],[71.45,73.1],[72.12,74.89],[72.83,74.66],[72.86,75.16],[72.3,75.68],[71.34,75.29],[71.15,76.36],[71.87,75.9],[72.27,77.58],[72.32,79.65],[71.75,81.5],[72.58,80.61],[73.65,80.51],[73.85,82.25],[73.81,84.66],[73.94,86.82],[74.46,86.01],[75.12,87.17],[75.14,88.31],[75.64,90.26],[75.77,92.9],[76.05,93.24],[76.14,95.86],[75.92,96.68],[76.45,98.92],[76.43,100.76],[76.86,101.04],[77.29,101.99],[77.7,104.35],[77.37,106.07],[77.13,104.71],[76.97,106.97],[76.48,107.24],[76.72,108.15],[76.71,111.08],[76.22,113.33],[75.85,114.13],[75.33,113.89],[75.03,112.78],[74.48,110.15],[74.18,109.4],[74.04,110.64],[73.79,112.12],[73.98,113.02],[73.34,113.53],[73.59,113.97],[73.75,115.57],[73.59,118.78],[73.12,119.02],[72.97,123.2],[73.74,123.26],[73.56,125.38],[73.57,126.98],[73.04,128.59],[72.4,129.05],[71.98,128.46],[71.19,129.71],[70.79,131.29],[71.84,132.25],[71.39,133.86],[71.66,135.56],[71.35,137.5],[71.63,138.23],[71.49,139.87],[72.42,139.15],[72.85,140.47],[72.2,149.5],[71.61,150.35],[70.84,152.97],[71.03,157.01],[70.87,159.0],[70.45,159.83],[69.72,159.71],[69.44,160.94],[69.64,162.28],[69.67,164.05],[69.47,165.94],[69.58,167.84],[68.69,169.58],[69.01,170.82],[69.65,170.01],[70.1,170.45],[69.82,173.64],[69.88,175.72],[69.4,178.6],[68.96,-180.0]],[[69.5,-90.55],[68.47,-90.55],[69.26,-89.21],[68.62,-88.02],[67.87,-88.32],[67.2,-87.35],[67.92,-86.31],[68.78,-85.58],[69.88,-85.52],[69.81,-84.1],[69.66,-82.62],[69.16,-81.28],[68.67,-81.22],[68.13,-81.96],[67.6,-81.26],[67.11,-81.39],[66.41,-83.35],[66.26,-84.74],[66.56,-85.77],[66.06,-86.07],[65.21,-87.03],[64.78,-87.32],[64.1,-88.48],[64.03,-89.91],[63.61,-90.7],[62.96,-90.77],[62.84,-91.93],[62.02,-93.16],[60.9,-94.24],[60.11,-94.63],[58.95,-94.68],[58.78,-93.21],[57.85,-92.76],[57.09,-92.3],[57.29,-90.9],[56.85,-89.04],[56.47,-88.04],[56.0,-87.32],[55.72,-86.07],[55.3,-85.01],[55.25,-83.36],[55.15,-82.27],[54.28,-82.44],[53.28,-82.13],[52.16,-81.4],[51.21,-79.91],[51.53,-79.14],[52.56,-78.6],[54.14,-79.12],[54.67,-79.83],[55.14,-78.23],[55.84,-77.1],[56.53,-76.54],[57.2,-76.62],[58.05,-77.3],[58.81,-78.52],[59.85,-77.34],[60.76,-77.77],[62.32,-78.11],[62.55,-77.41],[62.28,-75.7],[62.18,-74.67],[62.44,-73.84],[62.11,-72.91],[61.53,-71.68],[61.14,-71.37],[61.06,-69.59],[60.22,-69.62],[58.96,-69.29],[58.8,-68.37],[58.21,-67.65],[58.77,-66.2],[59.87,-65.25],[60.34,-64.58],[59.44,-63.81],[58.17,-62.5],[56.97,-61.4],[56.34,-61.8],[55.78,-60.47],[55.2,-59.57],[54.95,-57.98],[54.63,-57.33],[53.78,-56.94],[53.65,-56.16],[53.27,-55.76],[52.15,-55.68],[51.77,-56.41],[51.42,-57.13],[51.07,-58.78],[50.24,-60.03],[50.08,-61.72],[50.29,-63.86],[50.3,-65.36],[50.23,-66.4],[49.51,-67.24],[49.07,-68.51],[47.74,-69.95],[46.82,-71.11],[46.99,-70.26],[48.3,-68.65],[49.13,-66.55],[49.23,-65.05],[48.74,-64.17],[48.07,-65.12],[46.99,-64.8],[46.24,-64.47],[45.74,-63.17],[45.88,-61.52],[47.01,-60.52],[46.28,-60.45],[45.92,-59.8],[45.26,-61.04],[44.67,-63.25],[44.27,-64.25],[43.55,-65.36],[43.62,-66.12],[44.47,-66.16],[45.29,-64.42],[45.26,-66.03],[45.14,-67.14],[44.81,-66.97],[44.33,-68.03],[43.98,-69.06],[43.68,-70.12],[43.03,-70.69],[42.86,-70.81],[42.33,-70.83],[41.81,-70.49],[41.78,-70.08],[42.15,-70.18],[41.92,-69.89],[41.64,-69.96],[41.48,-70.64],[41.5,-71.12],[41.32,-71.86],[41.27,-72.29],[41.22,-72.88],[40.93,-73.71],[41.12,-72.24],[40.93,-71.94],[40.63,-73.35],[40.63,-73.98],[40.75,-73.95],[40.47,-74.26],[40.43,-73.96],[39.71,-74.18],[38.94,-74.91],[39.2,-74.98],[39.25,-75.2],[39.5,-75.53],[38.96,-75.32],[38.78,-75.08],[38.4,-75.06],[38.02,-75.38],[37.22,-75.94],[37.26,-76.03],[37.94,-75.72],[38.32,-76.23],[39.15,-76.35],[38.72,-76.54],[38.08,-76.33],[38.23,-76.96],[37.92,-76.3],[36.97,-76.26],[36.9,-75.97],[36.55,-75.87],[35.55,-75.73],[34.81,-76.36],[34.51,-77.4],[33.93,-78.05],[33.86,-78.55],[33.49,-79.06],[33.16,-79.2],[32.51,-80.3],[32.03,-80.87],[31.44,-81.34],[30.73,-81.49],[30.04,-81.31],[29.18,-80.98],[28.47,-80.53],[28.04,-80.53],[26.88,-80.06],[26.21,-80.09],[25.82,-80.13],[25.21,-80.38],[25.08,-80.68],[25.2,-81.17],[25.64,-81.33],[25.87,-81.71],[26.73,-82.24],[27.49,-82.71],[27.89,-82.86],[28.55,-82.65],[29.1,-82.93],[29.94,-83.71],[30.09,-84.1],[29.64,-85.11],[29.69,-85.29],[30.15,-85.77],[30.4,-86.4],[30.27,-87.53],[30.39,-88.42],[30.32,-89.18],[30.18,-89.61],[29.89,-89.41],[29.49,-89.43],[29.29,-89.22],[29.16,-89.41],[29.31,-89.78],[29.12,-90.15],[29.15,-90.88],[29.68,-91.63],[29.55,-92.5],[29.78,-93.22],[29.71,-93.85],[29.48,-94.69],[28.74,-95.6],[28.31,-96.59],[27.83,-97.14],[27.38,-97.37],[26.69,-97.38],[26.21,-97.33],[25.87,-97.14],[24.99,-97.53],[24.27,-97.7],[22.93,-97.78],[22.44,-97.87],[21.9,-97.7],[21.41,-97.39],[20.64,-97.19],[19.89,-96.53],[19.32,-96.29],[18.83,-95.9],[18.56,-94.84],[18.14,-94.43],[18.42,-93.55],[18.53,-92.79],[18.71,-92.04],[18.88,-91.41],[19.28,-90.77],[19.87,-90.53],[20.71,-90.45],[21.0,-90.28],[21.26,-89.6],[21.49,-88.54],[21.46,-87.66],[21.54,-87.05],[21.33,-86.81],[20.85,-86.85],[20.26,-87.38],[19.65,-87.62],[19.47,-87.44],[19.04,-87.59],[18.26,-87.84],[18.52,-88.09],[18.5,-88.3],[18.35,-88.3],[18.35,-88.11],[18.08,-88.12],[17.64,-88.29],[17.49,-88.2],[17.13,-88.3],[17.04,-88.24],[16.53,-88.35],[16.27,-88.55],[16.23,-88.73],[15.89,-88.93],[15.71,-88.61],[15.85,-88.52],[15.73,-88.22],[15.69,-88.12],[15.86,-87.9],[15.88,-87.62],[15.8,-87.52],[15.85,-87.37],[15.76,-86.9],[15.78,-86.44],[15.89,-86.12],[16.01,-86.0],[15.95,-85.68],[15.89,-85.45],[15.91,-85.18],[16.0,-84.98],[15.86,-84.53],[15.83,-84.37],[15.65,-84.06],[15.42,-83.77],[15.27,-83.41],[15.0,-83.15],[14.9,-83.23],[14.68,-83.29],[14.31,-83.18],[13.97,-83.41],[13.57,-83.52],[13.13,-83.55],[12.87,-83.5],[12.42,-83.47],[12.32,-83.63],[11.89,-83.72],[11.63,-83.65],[11.37,-83.85],[11.1,-83.81],[10.94,-83.66],[10.4,-83.4],[9.99,-83.02],[9.57,-82.55],[9.21,-82.19],[9.0,-82.21],[8.95,-81.81],[9.03,-81.72],[8.79,-81.44],[8.86,-80.95],[9.11,-80.52],[9.31,-79.92],[9.61,-79.57],[9.55,-79.02],[9.46,-79.06],[9.42,-78.5],[9.25,-78.05],[8.95,-77.73],[8.67,-77.35],[8.64,-76.84],[9.34,-76.08],[9.44,-75.67],[9.77,-75.66],[10.62,-75.48],[11.08,-74.91],[11.1,-74.28],[11.31,-74.2],[11.23,-73.41],[11.73,-72.63],[11.96,-72.24],[12.44,-71.75],[12.38,-71.4],[12.11,-71.14],[11.78,-71.33],[11.54,-71.36],[11.42,-71.95],[10.97,-71.62],[10.45,-71.63],[9.87,-72.07],[9.07,-71.7],[9.14,-71.26],[9.86,-71.04],[10.21,-71.35],[10.97,-71.4],[11.38,-70.16],[11.85,-70.29],[12.16,-69.94],[11.46,-69.58],[11.44,-68.88],[10.89,-68.23],[10.56,-68.19],[10.55,-67.3],[10.65,-66.23],[10.2,-65.66],[10.08,-64.89],[10.39,-64.33],[10.64,-64.32],[10.7,-63.08],[10.72,-61.88],[10.42,-62.73],[9.95,-62.39],[9.87,-61.59],[9.38,-60.83],[8.58,-60.67],[8.6,-60.15],[8.37,-59.76],[8.0,-59.1],[7.35,-58.48],[6.83,-58.46],[6.81,-58.08],[6.32,-57.54],[5.97,-57.15],[5.77,-55.95],[5.95,-55.84],[6.03,-55.03],[5.76,-53.96],[5.65,-53.62],[5.41,-52.88],[4.57,-51.82],[4.16,-51.66],[4.2,-51.32],[3.65,-51.07],[1.9,-50.51],[1.74,-49.97],[1.05,-49.95],[0.22,-50.7],[-0.08,-50.39],[-0.23,-48.62],[-1.24,-48.58],[-0.58,-47.82],[-0.94,-46.57],[-1.55,-44.91],[-2.14,-44.42],[-2.69,-44.58],[-2.38,-43.42],[-2.91,-41.47],[-2.87,-39.98],[-3.7,-38.5],[-4.82,-37.22],[-5.11,-36.45],[-5.15,-35.6],[-5.46,-35.24],[-6.74,-34.9],[-7.34,-34.73],[-9.0,-35.13],[-9.65,-35.64],[-11.04,-37.05],[-12.17,-37.68],[-13.04,-38.42],[-13.06,-38.67],[-13.79,-38.95],[-15.67,-38.88],[-17.21,-39.16],[-17.87,-39.27],[-18.26,-39.58],[-19.6,-39.76],[-20.9,-40.78],[-21.94,-40.95],[-22.37,-41.76],[-22.97,-41.99],[-22.97,-43.08],[-23.35,-44.65],[-23.8,-45.35],[-24.09,-46.47],[-24.89,-47.65],[-25.88,-48.49],[-26.62,-48.64],[-27.18,-48.48],[-28.19,-48.66],[-28.67,-48.89],[-29.22,-49.59],[-30.99,-50.7],[-31.78,-51.58],[-32.25,-52.26],[-33.2,-52.71],[-33.77,-53.37],[-34.4,-53.81],[-34.95,-54.93],[-34.75,-55.67],[-34.86,-56.22],[-34.43,-57.14],[-34.46,-57.82],[-33.91,-58.43],[-34.43,-58.5],[-35.29,-57.22],[-35.98,-57.36],[-36.41,-56.74],[-36.9,-56.79],[-38.18,-57.75],[-38.72,-59.23],[-38.93,-61.24],[-38.83,-62.34],[-39.42,-62.12],[-40.17,-62.33],[-40.68,-62.15],[-41.03,-62.75],[-41.17,-63.77],[-40.8,-64.73],[-41.06,-65.12],[-42.06,-64.98],[-42.36,-64.3],[-42.04,-63.75],[-42.56,-63.46],[-42.87,-64.38],[-43.49,-65.18],[-44.5,-65.33],[-45.04,-65.57],[-45.04,-66.51],[-45.55,-67.29],[-46.3,-67.58],[-47.03,-66.6],[-47.24,-65.64],[-48.13,-65.99],[-48.7,-67.17],[-49.87,-67.82],[-50.27,-68.73],[-50.73,-69.14],[-51.77,-68.82],[-52.35,-68.15],[-52.3,-68.57],[-52.29,-69.46],[-52.54,-69.94],[-52.9,-70.84],[-53.83,-71.01],[-53.86,-71.43],[-53.53,-72.56],[-52.83,-73.7],[-52.26,-74.95],[-51.63,-75.26],[-51.04,-74.98],[-50.38,-75.48],[-48.67,-75.61],[-47.71,-75.18],[-46.94,-74.13],[-46.65,-75.65],[-45.76,-74.69],[-44.1,-74.35],[-44.45,-73.24],[-42.38,-72.72],[-42.12,-73.39],[-43.37,-73.7],[-43.23,-74.33],[-41.8,-74.02],[-39.94,-73.68],[-39.26,-73.22],[-38.28,-73.5],[-37.16,-73.59],[-37.12,-73.17],[-35.51,-72.55],[-33.91,-71.86],[-32.42,-71.44],[-30.92,-71.67],[-30.1,-71.37],[-28.86,-71.49],[-27.64,-70.9],[-25.71,-70.72],[-23.63,-70.4],[-21.39,-70.09],[-19.76,-70.16],[-18.35,-70.37],[-17.77,-71.38],[-17.36,-71.46],[-16.36,-73.45],[-15.27,-75.24],[-14.65,-76.01],[-13.82,-76.42],[-13.53,-76.26],[-12.22,-77.11],[-10.38,-78.09],[-8.39,-79.04],[-7.93,-79.45],[-7.19,-79.76],[-6.54,-80.54],[-6.14,-81.25],[-5.69,-80.93],[-4.74,-81.41],[-4.04,-81.1],[-3.4,-80.3],[-2.66,-79.77],[-2.22,-79.99],[-2.69,-80.37],[-2.25,-80.97],[-1.96,-80.77],[-1.06,-80.93],[-0.91,-80.59],[-0.28,-80.4],[0.36,-80.02],[0.77,-80.09],[0.98,-79.54],[1.38,-78.86],[1.69,-78.99],[1.77,-78.62],[2.27,-78.66],[2.63,-78.43],[2.7,-77.93],[3.32,-77.51],[3.85,-77.13],[4.09,-77.5],[4.67,-77.31],[5.58,-77.53],[5.84,-77.32],[6.69,-77.48],[7.22,-77.88],[7.51,-78.22],[8.05,-78.43],[8.32,-78.18],[8.39,-78.44],[8.72,-78.62],[9.0,-79.12],[8.93,-79.56],[8.59,-79.76],[8.33,-80.16],[8.3,-80.38],[8.09,-80.48],[7.55,-80.01],[7.42,-80.28],[7.27,-80.42],[7.22,-80.89],[7.82,-81.06],[7.65,-81.19],[7.71,-81.52],[8.11,-81.72],[8.18,-82.13],[8.29,-82.39],[8.29,-82.82],[8.07,-82.85],[8.22,-82.96],[8.45,-83.51],[8.66,-83.71],[8.83,-83.59],[9.05,-83.63],[9.29,-83.91],[9.49,-84.3],[9.62,-84.65],[9.91,-84.71],[10.09,-84.98],[9.8,-84.91],[9.56,-85.11],[9.83,-85.34],[9.93,-85.66],[10.14,-85.8],[10.44,-85.79],[10.76,-85.66],[10.9,-85.94],[11.09,-85.71],[11.4,-86.06],[11.81,-86.53],[12.14,-86.74],[12.46,-87.17],[12.91,-87.67],[13.07,-87.56],[12.91,-87.39],[12.98,-87.32],[13.3,-87.49],[13.39,-87.79],[13.15,-87.9],[13.16,-88.48],[13.26,-88.84],[13.46,-89.26],[13.52,-89.81],[13.74,-90.1],[13.91,-90.61],[13.93,-91.23],[14.13,-91.69],[14.54,-92.23],[15.62,-93.36],[15.94,-93.88],[16.2,-94.69],[16.13,-95.25],[15.75,-96.05],[15.65,-96.56],[15.92,-97.26],[16.11,-98.01],[16.57,-98.95],[16.71,-99.7],[17.17,-100.83],[17.65,-101.67],[17.92,-101.92],[17.98,-102.48],[18.29,-103.5],[18.75,-103.92],[19.32,-104.99],[19.95,-105.49],[20.43,-105.73],[20.53,-105.4],[20.82,-105.5],[21.08,-105.27],[21.42,-105.27],[21.87,-105.6],[22.27,-105.69],[22.77,-106.03],[23.77,-106.91],[24.55,-107.92],[25.17,-108.4],[25.58,-109.26],[25.83,-109.44],[26.44,-109.29],[26.68,-109.8],[27.16,-110.39],[27.86,-110.64],[27.94,-111.18],[28.47,-111.76],[28.96,-112.23],[29.27,-112.27],[30.02,-112.81],[30.79,-113.17],[31.17,-113.15],[31.57,-113.87],[31.52,-114.21],[31.8,-114.78],[31.39,-114.94],[30.91,-114.77],[30.16,-114.67],[29.75,-114.33],[29.06,-113.59],[28.83,-113.42],[28.76,-113.27],[28.41,-113.14],[28.43,-112.96],[27.78,-112.76],[27.53,-112.46],[27.17,-112.24],[26.66,-111.62],[25.73,-111.29],[25.29,-110.99],[24.83,-110.71],[24.3,-110.66],[24.27,-110.17],[23.81,-109.77],[23.36,-109.41],[23.19,-109.43],[22.82,-109.85],[22.82,-110.03],[23.43,-110.3],[24.0,-110.95],[24.49,-111.67],[24.74,-112.18],[25.47,-112.15],[26.01,-112.3],[26.32,-112.78],[26.77,-113.46],[26.64,-113.6],[26.9,-113.85],[27.14,-114.46],[27.72,-115.06],[27.8,-114.98],[27.74,-114.57],[28.12,-114.2],[28.57,-114.16],[29.28,-114.93],[29.56,-115.52],[30.18,-115.89],[30.84,-116.26],[31.64,-116.72],[32.53,-117.13],[33.05,-117.29],[33.62,-117.94],[33.74,-118.41],[34.03,-118.52],[34.08,-119.08],[34.35,-119.44],[34.45,-120.37],[34.61,-120.62],[35.16,-120.74],[36.16,-121.72],[37.55,-122.55],[37.78,-122.51],[38.11,-122.95],[38.95,-123.73],[39.77,-123.86],[40.31,-124.4],[41.14,-124.18],[42.0,-124.21],[42.77,-124.53],[43.71,-124.14],[45.52,-123.9],[46.86,-124.08],[47.72,-124.4],[48.18,-124.69],[48.38,-124.57],[48.04,-123.12],[47.1,-122.59],[47.36,-122.34],[48.18,-122.5],[49.0,-122.84],[49.0,-122.98],[49.99,-124.91],[50.42,-125.63],[50.83,-127.44],[51.72,-127.99],[52.33,-127.85],[52.76,-129.13],[53.56,-129.3],[54.29,-130.51],[54.8,-130.54],[55.18,-131.09],[55.5,-131.97],[56.37,-132.25],[57.18,-133.54],[58.12,-134.08],[58.19,-135.04],[58.21,-136.63],[58.5,-137.8],[59.54,-139.87],[59.73,-140.82],[60.08,-142.57],[60.0,-143.96],[60.46,-145.93],[60.89,-147.11],[60.67,-148.23],[59.98,-148.02],[59.91,-148.57],[59.71,-149.73],[59.37,-150.61],[59.16,-151.71],[59.74,-151.86],[60.73,-151.41],[61.03,-150.35],[61.28,-150.62],[60.73,-151.89],[60.06,-152.58],[59.35,-154.02],[58.86,-153.29],[58.15,-154.23],[57.73,-155.31],[57.42,-156.31],[56.98,-156.56],[56.46,-158.12],[55.99,-158.43],[55.57,-159.6],[55.64,-160.29],[55.36,-161.22],[55.02,-162.24],[54.69,-163.07],[54.4,-164.79],[54.57,-164.94],[55.04,-163.85],[55.35,-162.87],[55.9,-161.81],[56.01,-160.56],[56.42,-160.07],[57.02,-158.68],[57.22,-158.46],[57.57,-157.72],[58.33,-157.55],[58.92,-157.04],[58.62,-158.19],[58.79,-158.52],[58.42,-159.06],[58.93,-159.71],[58.57,-159.98],[59.07,-160.35],[58.67,-161.36],[58.67,-161.97],[59.27,-162.05],[59.63,-161.87],[59.99,-162.52],[59.8,-163.82],[60.27,-164.66],[60.51,-165.35],[61.07,-165.35],[61.5,-166.12],[62.08,-165.73],[62.63,-164.92],[63.15,-164.56],[63.22,-163.75],[63.06,-163.07],[63.54,-162.26],[63.46,-161.54],[63.77,-160.77],[64.22,-160.96],[64.4,-161.52],[64.79,-160.78],[64.78,-161.39],[64.56,-162.45],[64.34,-162.76],[64.56,-163.55],[64.45,-164.96],[64.69,-166.42],[65.09,-166.85],[65.67,-168.11],[66.09,-166.71],[66.58,-164.47],[66.58,-163.65],[66.08,-163.79],[66.12,-161.68],[66.73,-162.49],[67.12,-163.72],[67.62,-164.43],[68.04,-165.39],[68.36,-166.76],[68.88,-166.2],[68.91,-164.43],[69.37,-163.17],[69.86,-162.93],[70.33,-161.91],[70.45,-160.93],[70.89,-159.04],[70.82,-158.12],[71.36,-156.58],[71.15,-155.07],[70.7,-154.34],[70.89,-153.9],[70.83,-152.21],[70.6,-152.27],[70.43,-150.74],[70.53,-149.72],[70.21,-147.61],[70.12,-145.69],[69.99,-144.92],[70.15,-143.59],[69.85,-142.07],[69.71,-140.99],[69.47,-139.12],[68.99,-137.54],[68.9,-136.5],[69.32,-135.63],[69.63,-134.42],[69.51,-132.93],[69.94,-131.43],[70.19,-129.79],[69.78,-129.11],[70.01,-128.36],[70.48,-128.14],[70.38,-127.45],[69.48,-125.75],[70.16,-124.43],[69.4,-124.29],[69.56,-123.06],[69.86,-122.68],[69.8,-121.47],[69.38,-119.94],[69.01,-117.6],[68.84,-116.23],[68.91,-115.25],[68.4,-113.9],[67.9,-115.3],[67.69,-113.5],[67.81,-110.8],[67.98,-109.95],[67.38,-108.88],[67.89,-107.79],[68.31,-108.81],[68.65,-108.17],[68.7,-106.95],[68.8,-106.15],[68.56,-105.34],[68.02,-104.34],[68.1,-103.22],[67.65,-101.45],[67.81,-99.9],[67.78,-98.44],[68.4,-98.56],[68.58,-97.67],[68.24,-96.12],[67.29,-96.13],[68.09,-95.49],[68.06,-94.69],[69.07,-94.23],[69.68,-95.31],[70.09,-96.47],[71.19,-96.39],[71.92,-95.21],[71.76,-93.89],[71.32,-92.88],[70.19,-91.52],[69.7,-92.41],[69.5,-90.55]],[[-84.71,-180.0],[-84.72,-179.94],[-84.14,-179.06],[-84.45,-177.26],[-84.42,-177.14],[-84.33,-176.86],[-84.23,-176.52],[-84.14,-176.23],[-84.1,-176.08],[-84.1,-175.94],[-84.12,-175.83],[-84.53,-174.38],[-84.12,-173.12],[-84.06,-172.89],[-83.88,-169.95],[-84.12,-169.0],[-84.24,-168.53],[-84.57,-167.02],[-84.83,-164.18],[-85.14,-161.93],[-85.37,-158.07],[-85.1,-155.19],[-85.3,-150.94],[-85.61,-148.53],[-85.31,-145.89],[-85.04,-143.11],[-84.57,-142.89],[-84.53,-146.83],[-84.3,-150.06],[-83.9,-150.9],[-83.69,-153.59],[-83.24,-153.41],[-82.83,-153.04],[-82.45,-152.66],[-82.04,-152.86],[-81.77,-154.53],[-81.41,-155.29],[-81.1,-156.84],[-81.16,-154.41],[-81.0,-152.1],[-81.34,-150.65],[-81.04,-148.87],[-80.67,-147.22],[-80.34,-146.42],[-79.93,-146.77],[-79.65,-148.06],[-79.36,-149.53],[-79.3,-151.59],[-79.16,-153.39],[-79.06,-155.33],[-78.69,-155.98],[-78.38,-157.27],[-78.03,-158.05],[-76.89,-158.36],[-76.99,-157.87],[-77.3,-156.97],[-77.2,-155.33],[-77.07,-153.74],[-77.5,-152.92],[-77.4,-151.33],[-77.18,-150.0],[-76.91,-148.75],[-76.58,-147.61],[-76.48,-146.11],[-76.11,-146.15],[-75.73,-146.49],[-75.38,-146.2],[-75.2,-144.91],[-75.54,-144.32],[-75.34,-142.79],[-75.09,-141.64],[-75.07,-140.21],[-74.97,-138.86],[-74.73,-137.51],[-74.52,-136.43],[-74.3,-135.22],[-74.36,-134.43],[-74.44,-133.75],[-74.3,-132.26],[-74.48,-130.92],[-74.46,-129.55],[-74.32,-128.24],[-74.42,-126.89],[-74.52,-125.4],[-74.48,-124.01],[-74.5,-122.56],[-74.52,-121.07],[-74.48,-119.7],[-74.18,-118.68],[-74.03,-117.47],[-74.24,-116.21],[-74.07,-115.02],[-73.72,-113.94],[-74.03,-113.3],[-74.38,-112.95],[-74.71,-112.3],[-74.42,-111.26],[-74.79,-110.07],[-74.91,-108.72],[-75.18,-107.56],[-75.13,-106.15],[-74.95,-104.87],[-74.99,-103.37],[-75.13,-102.02],[-75.3,-100.64],[-74.87,-100.12],[-74.54,-100.76],[-74.18,-101.25],[-74.11,-102.55],[-73.73,-103.11],[-73.36,-103.33],[-72.62,-103.68],[-72.75,-102.92],[-72.81,-101.61],[-72.75,-100.31],[-72.91,-99.14],[-73.21,-98.12],[-73.56,-97.69],[-73.62,-96.34],[-73.48,-95.04],[-73.28,-93.67],[-73.17,-92.44],[-73.4,-91.42],[-73.32,-90.09],[-72.56,-89.23],[-73.01,-88.42],[-73.19,-87.27],[-73.09,-86.01],[-73.48,-85.19],[-73.52,-83.88],[-73.64,-82.67],[-73.85,-81.47],[-73.48,-80.69],[-73.13,-80.3],[-73.52,-79.3],[-73.42,-77.92],[-73.64,-76.91],[-73.97,-76.22],[-73.87,-74.89],[-73.66,-73.85],[-73.4,-72.83],[-73.26,-71.62],[-73.15,-70.21],[-73.01,-68.94],[-72.79,-67.96],[-72.48,-67.37],[-72.05,-67.14],[-71.64,-67.25],[-71.25,-67.56],[-70.85,-67.92],[-70.46,-68.23],[-70.11,-68.49],[-69.72,-68.54],[-69.32,-68.45],[-68.95,-67.98],[-68.54,-67.59],[-68.15,-67.43],[-67.72,-67.62],[-67.33,-67.74],[-66.88,-67.25],[-66.58,-66.7],[-66.21,-66.06],[-65.9,-65.37],[-65.6,-64.57],[-65.17,-64.18],[-64.9,-63.63],[-64.64,-63.0],[-64.58,-62.04],[-64.27,-61.41],[-64.07,-60.71],[-63.96,-59.89],[-63.7,-59.16],[-63.39,-58.6],[-63.27,-57.81],[-63.53,-57.22],[-63.86,-57.6],[-64.15,-58.61],[-64.37,-59.05],[-64.21,-59.79],[-64.31,-60.61],[-64.55,-61.3],[-64.8,-62.02],[-65.09,-62.51],[-65.48,-62.65],[-65.86,-62.59],[-66.19,-62.12],[-66.43,-62.8],[-66.5,-63.74],[-66.84,-64.29],[-67.15,-64.88],[-67.58,-65.51],[-67.95,-65.67],[-68.37,-65.31],[-68.68,-64.78],[-68.91,-63.96],[-69.23,-63.2],[-69.62,-62.79],[-69.99,-62.57],[-70.38,-62.28],[-70.72,-61.81],[-71.09,-61.51],[-72.01,-61.38],[-72.38,-61.08],[-72.77,-61.0],[-73.17,-60.69],[-73.7,-60.83],[-74.11,-61.38],[-74.44,-61.96],[-74.58,-63.29],[-74.93,-63.74],[-75.26,-64.35],[-75.63,-65.86],[-75.79,-67.19],[-76.01,-68.45],[-76.22,-69.8],[-76.64,-70.6],[-76.67,-72.21],[-76.64,-73.97],[-76.71,-75.56],[-76.71,-77.24],[-77.11,-76.93],[-77.28,-75.4],[-77.56,-74.28],[-77.91,-73.65],[-78.22,-74.77],[-78.12,-76.5],[-78.38,-77.92],[-78.79,-77.99],[-79.18,-78.03],[-79.51,-76.85],[-79.89,-76.63],[-80.26,-75.36],[-80.42,-73.24],[-80.69,-71.44],[-81.0,-70.01],[-81.32,-68.19],[-81.47,-65.71],[-81.75,-63.25],[-82.04,-61.55],[-82.38,-59.69],[-82.85,-58.71],[-83.22,-58.22],[-82.87,-57.01],[-82.57,-55.36],[-82.26,-53.62],[-82.0,-51.54],[-81.73,-49.76],[-81.71,-47.27],[-81.85,-44.83],[-82.08,-42.81],[-81.65,-42.16],[-81.36,-40.77],[-81.34,-38.24],[-81.12,-36.26],[-80.91,-34.39],[-80.77,-32.31],[-80.59,-30.1],[-80.34,-28.55],[-79.98,-29.26],[-79.63,-29.68],[-79.26,-29.68],[-79.3,-31.62],[-79.46,-33.68],[-79.46,-35.64],[-79.08,-35.92],[-78.34,-35.78],[-78.12,-35.33],[-77.89,-33.9],[-77.65,-32.21],[-77.36,-31.0],[-77.07,-29.78],[-76.67,-28.88],[-76.5,-27.51],[-76.36,-26.16],[-76.28,-25.48],[-76.24,-23.93],[-76.11,-22.46],[-75.91,-21.22],[-75.67,-20.01],[-75.44,-18.91],[-75.13,-17.52],[-74.79,-16.64],[-74.5,-15.7],[-74.11,-15.41],[-73.87,-16.46],[-73.46,-16.11],[-73.15,-15.45],[-72.95,-14.41],[-72.72,-13.31],[-72.4,-12.29],[-72.01,-11.51],[-71.54,-11.02],[-71.26,-10.29],[-71.32,-9.1],[-71.66,-8.61],[-71.7,-7.42],[-71.32,-7.38],[-70.93,-6.87],[-71.03,-5.79],[-71.4,-5.54],[-71.46,-4.34],[-71.28,-3.05],[-71.17,-1.79],[-71.23,-0.66],[-71.64,-0.23],[-71.31,0.87],[-71.13,1.89],[-70.99,3.02],[-70.85,4.14],[-70.62,5.16],[-70.46,6.27],[-70.25,7.14],[-69.89,7.74],[-70.15,8.49],[-70.01,9.52],[-70.48,10.25],[-70.83,10.82],[-70.64,11.95],[-70.25,12.4],[-69.97,13.42],[-70.03,14.74],[-70.4,15.13],[-70.03,15.95],[-69.91,17.03],[-69.88,18.2],[-69.89,19.26],[-70.01,20.37],[-70.07,21.45],[-70.4,21.92],[-70.7,22.57],[-70.52,23.66],[-70.48,24.84],[-70.48,25.98],[-70.46,27.09],[-70.33,28.09],[-70.21,29.15],[-69.93,30.03],[-69.76,30.97],[-69.66,31.99],[-69.38,32.75],[-68.84,33.3],[-68.5,33.87],[-68.66,34.91],[-69.01,35.3],[-69.25,36.16],[-69.17,37.2],[-69.52,37.91],[-69.78,38.65],[-69.54,39.67],[-69.11,40.02],[-68.93,40.92],[-68.6,41.96],[-68.46,42.94],[-68.27,44.11],[-68.05,44.9],[-67.82,45.72],[-67.6,46.5],[-67.72,47.44],[-67.37,48.34],[-67.09,48.99],[-67.11,49.93],[-66.88,50.76],[-66.52,50.95],[-66.25,51.79],[-66.05,52.61],[-65.9,53.61],[-65.82,54.54],[-65.88,55.41],[-65.98,56.36],[-66.25,57.16],[-66.68,57.26],[-67.01,58.14],[-67.29,58.74],[-67.41,59.94],[-67.68,60.6],[-67.95,61.43],[-68.01,62.39],[-67.82,63.19],[-67.41,64.05],[-67.62,64.99],[-67.74,65.97],[-67.86,66.91],[-67.93,67.89],[-67.93,68.89],[-68.97,69.71],[-69.23,69.67],[-69.68,69.55],[-69.93,68.6],[-70.3,67.81],[-70.7,67.95],[-70.68,69.06],[-71.07,68.93],[-71.44,68.42],[-71.85,67.95],[-72.17,68.71],[-72.26,69.87],[-72.09,71.02],[-71.7,71.57],[-71.32,71.91],[-71.01,72.46],[-70.72,73.08],[-70.36,73.33],[-69.88,73.86],[-69.78,74.49],[-69.74,75.63],[-69.62,76.62],[-69.46,77.64],[-69.07,78.13],[-68.7,78.43],[-68.33,79.11],[-68.07,80.09],[-67.88,80.93],[-67.54,81.49],[-67.37,82.05],[-67.21,82.78],[-67.31,83.77],[-67.21,84.67],[-67.09,85.65],[-67.15,86.75],[-66.88,87.48],[-66.21,87.99],[-66.48,88.36],[-66.96,88.83],[-67.15,89.67],[-67.23,90.63],[-67.11,91.59],[-67.19,92.61],[-67.21,93.55],[-67.11,94.18],[-67.17,95.02],[-67.39,95.78],[-67.25,96.68],[-67.25,97.76],[-67.11,98.68],[-67.25,99.72],[-66.91,100.39],[-66.58,100.89],[-66.31,101.58],[-65.56,102.83],[-65.7,103.48],[-65.98,104.24],[-66.33,104.91],[-66.94,106.18],[-66.96,107.16],[-66.96,108.08],[-66.84,109.16],[-66.7,110.23],[-66.43,111.06],[-66.13,111.74],[-66.09,112.86],[-65.88,113.6],[-66.07,114.39],[-66.39,114.9],[-66.7,115.6],[-66.66,116.7],[-66.91,117.38],[-67.17,118.58],[-67.27,119.83],[-67.19,120.87],[-66.88,121.65],[-66.56,122.32],[-66.48,123.22],[-66.62,124.12],[-66.72,125.16],[-66.56,126.1],[-66.56,127.0],[-66.66,127.88],[-66.76,128.8],[-66.58,129.7],[-66.43,130.78],[-66.39,131.8],[-66.39,132.94],[-66.29,133.85],[-66.21,134.76],[-65.72,135.03],[-65.31,135.07],[-65.58,135.7],[-66.03,135.87],[-66.45,136.21],[-66.78,136.62],[-66.96,137.46],[-66.9,138.6],[-66.88,139.91],[-66.82,140.81],[-66.82,142.12],[-66.8,143.06],[-66.84,144.37],[-66.91,145.49],[-67.23,146.2],[-67.6,146.0],[-67.89,146.65],[-68.13,147.72],[-68.39,148.84],[-68.56,150.13],[-68.72,151.48],[-68.87,152.5],[-68.9,153.64],[-68.56,154.28],[-68.84,155.17],[-69.15,155.93],[-69.38,156.81],[-69.48,158.03],[-69.6,159.18],[-69.99,159.67],[-70.23,160.81],[-70.58,161.57],[-70.74,162.69],[-70.72,163.84],[-70.78,164.92],[-70.76,166.11],[-70.83,167.31],[-70.97,168.43],[-71.21,169.46],[-71.4,170.5],[-71.7,171.21],[-72.09,171.09],[-72.44,170.56],[-72.89,170.11],[-73.24,169.76],[-73.66,169.29],[-73.81,167.98],[-74.17,167.39],[-74.38,166.09],[-74.77,165.64],[-75.15,164.96],[-75.46,164.24],[-75.87,163.82],[-76.24,163.57],[-76.69,163.47],[-77.07,163.49],[-77.46,164.06],[-77.83,164.28],[-78.18,164.74],[-78.32,166.6],[-78.75,167.0],[-78.91,165.19],[-79.12,163.67],[-79.16,161.77],[-79.73,160.92],[-80.2,160.75],[-80.57,160.32],[-80.95,159.79],[-81.28,161.12],[-81.69,161.63],[-82.06,162.49],[-82.39,163.71],[-82.71,165.1],[-83.02,166.6],[-83.34,168.89],[-83.83,169.41],[-84.04,172.29],[-84.12,172.48],[-84.41,173.22],[-84.16,175.99],[-84.47,178.28],[-84.71,-180.0]],[[-13.76,143.56],[-14.55,143.92],[-14.17,144.56],[-14.59,144.9],[-14.99,145.37],[-15.43,145.27],[-16.29,145.49],[-16.78,145.64],[-16.91,145.89],[-17.76,146.16],[-18.28,146.06],[-18.96,146.39],[-19.48,147.47],[-19.96,148.18],[-20.39,148.85],[-20.63,148.72],[-21.26,149.29],[-22.34,149.68],[-22.12,150.08],[-22.56,150.48],[-22.4,150.73],[-23.46,150.9],[-24.08,151.61],[-24.46,152.07],[-25.27,152.86],[-26.07,153.14],[-26.64,153.16],[-27.26,153.09],[-28.11,153.57],[-28.99,153.51],[-29.46,153.34],[-30.35,153.07],[-30.92,153.09],[-31.64,152.89],[-32.55,152.45],[-33.04,151.71],[-33.82,151.34],[-34.31,151.01],[-35.17,150.71],[-35.67,150.33],[-36.42,150.08],[-37.11,149.95],[-37.43,150.0],[-37.77,149.42],[-37.81,148.31],[-38.22,147.38],[-38.61,146.92],[-39.04,146.32],[-38.59,145.49],[-38.42,144.88],[-37.9,145.03],[-38.09,144.49],[-38.81,143.61],[-38.54,142.75],[-38.38,142.18],[-38.31,141.61],[-38.02,140.64],[-37.4,139.99],[-36.64,139.81],[-36.14,139.58],[-35.73,139.08],[-35.61,138.12],[-35.13,138.45],[-34.39,138.21],[-35.08,137.72],[-35.26,136.83],[-34.71,137.35],[-34.13,137.51],[-33.64,137.89],[-32.9,137.81],[-33.75,137.0],[-34.09,136.37],[-34.89,135.99],[-34.48,135.21],[-33.95,135.24],[-33.22,134.61],[-32.85,134.09],[-32.62,134.27],[-32.01,132.99],[-31.98,132.29],[-31.5,131.33],[-31.59,129.53],[-31.95,128.24],[-32.28,127.1],[-32.22,126.15],[-32.73,125.09],[-32.96,124.22],[-33.48,124.03],[-33.89,123.66],[-33.91,122.81],[-34.0,122.18],[-33.82,121.3],[-33.93,120.58],[-33.98,119.89],[-34.51,119.3],[-34.46,119.01],[-34.75,118.5],[-35.06,118.03],[-35.03,117.29],[-35.03,116.62],[-34.39,115.56],[-34.2,115.03],[-33.62,115.05],[-33.49,115.54],[-33.26,115.71],[-32.9,115.68],[-32.21,115.8],[-31.61,115.69],[-30.6,115.16],[-30.03,115.0],[-29.46,115.04],[-28.81,114.64],[-28.52,114.62],[-28.12,114.17],[-27.33,114.05],[-26.54,113.48],[-26.12,113.34],[-26.55,113.78],[-25.62,113.44],[-25.91,113.94],[-26.3,114.23],[-25.79,114.22],[-25.0,113.72],[-24.68,113.63],[-24.38,113.39],[-23.81,113.5],[-23.56,113.71],[-23.06,113.84],[-22.47,113.74],[-21.76,114.15],[-22.52,114.22],[-21.83,114.65],[-21.49,115.46],[-21.07,115.95],[-20.7,116.71],[-20.62,117.16],[-20.75,117.44],[-20.37,118.23],[-20.26,118.84],[-20.04,118.99],[-19.95,119.25],[-19.98,119.8],[-19.68,120.86],[-19.24,121.4],[-18.71,121.65],[-18.2,122.24],[-17.8,122.29],[-17.26,122.31],[-16.41,123.01],[-17.27,123.43],[-17.07,123.86],[-16.6,123.5],[-16.11,123.82],[-16.33,124.26],[-15.57,124.38],[-15.08,124.93],[-14.68,125.17],[-14.51,125.67],[-14.23,125.69],[-14.35,126.13],[-14.1,126.14],[-13.95,126.58],[-13.82,127.07],[-14.28,127.8],[-14.87,128.36],[-14.88,128.98],[-14.97,129.62],[-14.42,129.41],[-13.62,129.89],[-13.36,130.34],[-13.11,130.18],[-12.54,130.62],[-12.18,131.22],[-12.3,131.73],[-12.11,132.58],[-11.6,132.56],[-11.27,131.82],[-11.13,132.36],[-11.38,133.02],[-11.79,133.55],[-12.04,134.39],[-11.94,134.68],[-12.25,135.3],[-11.96,135.88],[-12.05,136.26],[-11.86,136.49],[-12.35,136.95],[-12.89,136.68],[-13.29,136.31],[-13.32,135.96],[-13.72,136.08],[-14.22,135.78],[-14.72,135.43],[-15.0,135.5],[-15.55,136.3],[-15.87,137.07],[-16.22,137.58],[-16.81,138.3],[-16.81,138.59],[-17.06,139.11],[-17.37,139.26],[-17.71,140.22],[-17.37,140.87],[-16.83,141.07],[-16.39,141.27],[-15.84,141.4],[-15.04,141.7],[-14.56,141.56],[-14.27,141.63],[-13.7,141.52],[-12.94,141.65],[-12.74,141.84],[-12.41,141.69],[-11.88,141.93],[-11.33,142.12],[-11.04,142.14],[-10.67,142.52],[-11.16,142.8],[-11.78,142.87],[-11.9,143.12],[-12.33,143.16],[-12.83,143.52],[-13.4,143.6],[-13.76,143.56]],[[83.52,-27.1],[82.73,-20.85],[82.34,-22.69],[82.3,-26.52],[82.2,-31.9],[82.02,-31.4],[82.13,-27.86],[81.79,-24.85],[82.09,-22.9],[81.73,-22.07],[81.15,-23.17],[81.52,-20.62],[81.91,-15.77],[81.72,-12.77],[81.29,-12.21],[80.58,-16.28],[80.35,-16.85],[80.18,-20.05],[80.13,-17.73],[79.4,-18.9],[78.75,-19.7],[77.64,-19.67],[76.98,-18.47],[76.94,-20.04],[76.63,-21.68],[76.1,-19.83],[75.25,-19.6],[75.16,-20.67],[74.3,-19.37],[74.22,-21.59],[73.82,-20.44],[73.46,-20.76],[73.31,-22.17],[73.31,-23.57],[72.63,-22.31],[72.18,-22.3],[72.6,-24.28],[72.33,-24.79],[72.08,-23.44],[71.47,-22.13],[70.66,-21.75],[70.47,-23.54],[70.86,-24.31],[71.43,-25.54],[70.75,-25.2],[70.23,-26.36],[70.18,-23.73],[70.13,-22.35],[69.26,-25.03],[68.47,-27.75],[68.12,-30.67],[68.12,-31.78],[67.74,-32.81],[66.68,-34.2],[65.98,-36.35],[65.94,-37.04],[65.69,-38.37],[65.46,-39.81],[64.84,-40.67],[64.14,-40.68],[63.48,-41.19],[62.68,-42.82],[61.9,-42.42],[61.07,-42.87],[60.1,-43.38],[60.04,-44.79],[60.85,-46.26],[60.86,-48.26],[61.41,-49.23],[62.38,-49.9],[63.63,-51.63],[64.28,-52.14],[65.18,-52.28],[66.1,-53.66],[66.84,-53.3],[67.19,-53.97],[68.36,-52.98],[68.73,-51.48],[69.15,-51.08],[69.93,-50.87],[69.57,-52.02],[69.43,-52.56],[69.28,-53.46],[69.61,-54.68],[70.29,-54.75],[70.82,-54.36],[70.84,-53.43],[70.57,-51.39],[71.2,-53.11],[71.55,-54.01],[71.41,-55.0],[71.66,-55.83],[72.59,-54.72],[72.96,-55.33],[73.65,-56.12],[74.71,-57.33],[75.1,-58.6],[75.52,-58.59],[76.1,-61.27],[76.18,-63.39],[76.14,-66.07],[76.06,-68.5],[76.38,-69.67],[77.01,-71.4],[77.32,-68.78],[77.38,-66.76],[77.64,-71.04],[78.04,-73.3],[78.43,-73.16],[78.91,-69.37],[79.4,-65.71],[79.76,-65.32],[80.12,-68.02],[80.52,-67.15],[81.21,-63.69],[81.32,-62.24],[81.77,-62.65],[82.03,-60.28],[82.19,-57.21],[82.2,-54.14],[81.89,-53.04],[82.44,-50.39],[82.06,-48.0],[81.99,-46.6],[81.66,-44.52],[82.2,-46.9],[82.63,-46.76],[83.23,-43.41],[83.18,-39.9],[83.55,-38.62],[83.65,-35.09],[83.52,-27.1]],[[73.16,-86.56],[72.53,-85.77],[73.34,-84.85],[73.75,-82.32],[72.72,-80.6],[72.06,-80.75],[72.35,-78.77],[72.75,-77.82],[72.24,-75.61],[71.77,-74.23],[71.33,-74.1],[71.56,-72.24],[70.92,-71.2],[70.52,-68.79],[70.12,-67.92],[69.19,-66.97],[68.72,-68.81],[68.07,-66.45],[67.85,-64.86],[66.93,-63.42],[66.86,-61.85],[66.16,-62.16],[65.0,-63.92],[65.43,-65.15],[66.39,-66.72],[66.26,-68.01],[65.69,-68.14],[65.11,-67.09],[64.65,-65.73],[64.38,-65.32],[63.39,-64.67],[62.67,-65.01],[62.95,-66.27],[63.75,-68.78],[62.88,-67.37],[62.28,-66.33],[61.93,-66.17],[62.33,-68.88],[62.91,-71.02],[63.4,-72.24],[63.68,-71.89],[64.19,-73.38],[64.68,-74.84],[64.39,-74.82],[64.23,-77.71],[64.57,-78.55],[65.31,-77.9],[65.33,-76.02],[65.46,-73.96],[65.81,-74.29],[66.31,-73.95],[67.28,-72.65],[67.73,-72.93],[68.07,-73.31],[68.55,-74.84],[68.89,-76.87],[69.15,-76.23],[69.77,-77.29],[69.83,-78.17],[70.17,-78.96],[69.87,-79.49],[69.74,-81.31],[69.97,-84.94],[70.26,-87.06],[70.41,-88.68],[70.76,-89.51],[71.22,-88.47],[71.22,-89.89],[72.24,-90.2],[73.13,-89.44],[73.54,-88.41],[73.8,-85.83],[73.16,-86.56]],[[-1.15,134.14],[-2.77,134.42],[-3.37,135.46],[-2.31,136.29],[-1.7,137.44],[-1.7,138.33],[-2.05,139.19],[-2.41,139.93],[-2.6,141.0],[-3.29,142.74],[-3.86,144.58],[-4.37,145.27],[-4.88,145.83],[-5.47,145.98],[-6.08,147.65],[-6.61,147.89],[-6.72,146.97],[-7.39,147.19],[-8.04,148.09],[-9.11,148.73],[-9.07,149.31],[-9.51,149.27],[-9.68,150.04],[-9.87,149.74],[-10.29,150.8],[-10.58,150.69],[-10.65,150.03],[-10.39,149.78],[-10.28,148.92],[-10.13,147.91],[-9.49,147.14],[-8.94,146.57],[-8.07,146.05],[-7.63,144.74],[-7.92,143.9],[-8.25,143.29],[-8.98,143.41],[-9.33,142.63],[-9.16,142.07],[-9.12,141.03],[-8.3,140.14],[-8.1,139.13],[-8.38,138.88],[-8.41,137.61],[-7.6,138.04],[-7.32,138.67],[-6.23,138.41],[-5.39,137.93],[-4.55,135.99],[-4.46,135.17],[-3.54,133.66],[-4.02,133.37],[-4.11,132.98],[-3.75,132.76],[-3.31,132.75],[-2.82,131.99],[-2.46,133.07],[-2.48,133.78],[-2.21,133.7],[-2.21,132.23],[-1.62,131.84],[-1.43,130.94],[-0.94,130.52],[-0.7,131.87],[-0.37,132.38],[-0.78,133.98],[-1.15,134.14]],[[83.11,-68.5],[83.03,-65.83],[82.9,-63.68],[82.63,-61.85],[82.36,-61.89],[81.93,-64.33],[81.73,-66.75],[81.5,-67.66],[81.51,-65.48],[80.9,-67.84],[80.62,-69.47],[79.8,-71.18],[79.63,-73.24],[79.43,-73.88],[79.32,-76.91],[79.2,-75.53],[79.02,-76.22],[78.53,-75.39],[78.18,-76.34],[77.9,-77.89],[77.51,-78.36],[77.21,-79.76],[76.98,-79.62],[77.02,-77.91],[76.78,-77.89],[76.18,-80.56],[76.45,-83.17],[76.3,-86.11],[76.42,-87.6],[76.47,-89.49],[76.95,-89.62],[77.18,-87.77],[77.9,-88.26],[77.97,-87.65],[77.54,-84.98],[78.18,-86.34],[78.37,-87.96],[78.76,-87.15],[79.0,-85.38],[79.35,-85.1],[79.74,-86.51],[80.25,-86.93],[80.21,-84.2],[80.1,-83.41],[80.46,-81.85],[80.58,-84.1],[80.52,-87.6],[80.86,-89.37],[81.26,-90.2],[81.55,-91.37],[81.9,-91.59],[82.08,-90.1],[82.12,-88.93],[82.28,-86.97],[82.65,-85.5],[82.6,-84.26],[82.32,-83.18],[82.86,-82.42],[83.02,-81.1],[83.13,-79.31],[83.17,-76.25],[83.06,-75.72],[83.23,-72.83],[83.17,-70.67],[83.11,-68.5]],[[-13.56,50.06],[-14.76,50.22],[-15.23,50.48],[-15.71,50.38],[-16.0,50.2],[-15.41,49.86],[-15.71,49.67],[-16.45,49.86],[-16.87,49.78],[-17.11,49.5],[-17.95,49.43],[-19.12,49.04],[-20.5,48.55],[-22.39,47.93],[-23.78,47.55],[-24.94,47.1],[-25.18,46.28],[-25.6,45.41],[-25.35,44.83],[-24.99,44.04],[-24.46,43.76],[-23.57,43.7],[-22.78,43.35],[-22.06,43.25],[-21.34,43.43],[-21.16,43.89],[-20.83,43.9],[-20.07,44.38],[-19.44,44.47],[-18.96,44.23],[-18.33,44.04],[-17.41,43.96],[-16.85,44.31],[-16.22,44.45],[-16.18,44.94],[-15.97,45.5],[-15.79,45.87],[-15.78,46.31],[-15.21,46.88],[-14.59,47.71],[-14.09,48.0],[-13.66,47.87],[-13.78,48.29],[-13.09,48.84],[-12.49,48.87],[-12.04,49.2],[-12.47,49.54],[-12.9,49.81],[-13.56,50.06]],[[1.83,117.87],[0.9,119.0],[0.78,117.81],[0.1,117.48],[-0.8,117.52],[-1.49,116.56],[-2.48,116.53],[-4.01,116.15],[-3.66,116.0],[-4.11,114.86],[-3.5,114.47],[-3.44,113.76],[-3.12,113.26],[-3.48,112.07],[-3.0,111.7],[-3.05,111.05],[-2.93,110.22],[-1.59,110.07],[-1.31,109.57],[-0.46,109.09],[0.42,108.95],[1.34,109.07],[2.01,109.66],[1.66,110.4],[1.85,111.17],[2.7,111.37],[2.89,111.8],[3.1,113.0],[3.89,113.71],[4.53,114.21],[4.9,114.6],[5.45,115.45],[6.14,116.22],[6.92,116.73],[6.93,117.13],[6.42,117.64],[5.99,117.69],[5.71,118.35],[5.41,119.18],[5.02,119.11],[4.97,118.44],[4.48,118.62],[4.14,117.88],[3.24,117.31],[2.29,118.05],[1.83,117.87]],[[1.42,125.24],[0.43,124.44],[0.24,123.68],[0.43,122.72],[0.38,121.06],[0.24,120.18],[-0.52,120.04],[-1.41,120.93],[-0.96,121.47],[-0.62,123.34],[-1.08,123.26],[-0.93,122.82],[-1.52,122.39],[-1.91,121.51],[-3.19,122.45],[-3.53,122.27],[-4.68,123.17],[-5.34,123.16],[-5.63,122.63],[-5.28,122.24],[-4.46,122.72],[-4.85,121.74],[-4.57,121.49],[-4.19,121.62],[-3.6,120.9],[-2.63,120.97],[-2.93,120.3],[-4.1,120.39],[-5.53,120.43],[-5.67,119.8],[-5.38,119.37],[-4.46,119.65],[-3.49,119.5],[-3.49,119.08],[-2.8,118.77],[-2.15,119.18],[-1.35,119.32],[0.15,119.83],[0.57,120.03],[1.31,120.89],[1.01,121.67],[0.88,122.93],[0.92,124.08],[1.64,125.07],[1.42,125.24]],[[73.12,-114.17],[72.65,-114.67],[72.95,-112.44],[72.45,-111.05],[72.96,-109.92],[72.63,-109.01],[71.65,-108.19],[72.06,-107.69],[73.09,-108.4],[73.24,-107.52],[73.08,-106.52],[72.67,-105.4],[71.7,-104.77],[70.99,-104.46],[70.5,-102.79],[70.03,-100.98],[69.59,-101.09],[69.5,-102.73],[69.12,-102.09],[68.75,-102.43],[68.91,-104.24],[69.18,-105.96],[69.12,-107.12],[68.78,-109.0],[68.61,-111.97],[68.54,-113.31],[69.01,-113.86],[69.28,-115.22],[69.17,-116.11],[69.96,-117.34],[70.07,-116.68],[70.24,-115.13],[70.19,-113.72],[70.37,-112.42],[70.6,-114.35],[70.52,-116.49],[70.54,-117.91],[70.91,-118.43],[71.31,-116.11],[71.29,-117.65],[71.56,-119.4],[72.31,-118.56],[72.71,-117.87],[73.31,-115.19],[73.12,-114.17]],[[58.63,-3.0],[57.55,-4.07],[57.69,-3.05],[57.68,-1.96],[56.87,-2.22],[55.97,-3.12],[55.91,-2.09],[54.62,-1.11],[54.46,-0.43],[53.32,0.19],[52.93,0.47],[52.74,1.68],[52.1,1.56],[51.81,1.05],[51.29,1.45],[50.77,0.55],[50.78,-0.79],[50.5,-2.49],[50.7,-2.96],[50.23,-3.62],[50.34,-4.54],[49.96,-5.24],[50.16,-5.78],[51.21,-4.31],[51.43,-3.41],[51.59,-4.98],[51.99,-5.27],[52.3,-4.22],[52.84,-4.77],[53.5,-4.58],[53.4,-3.09],[53.98,-2.95],[54.61,-3.63],[54.79,-4.84],[55.06,-5.08],[55.51,-4.72],[55.78,-5.05],[55.31,-5.59],[56.27,-5.65],[56.78,-6.15],[57.82,-5.79],[58.63,-5.01],[58.55,-4.21],[58.63,-3.0]],[[22.77,-79.68],[22.4,-79.28],[22.51,-78.35],[22.28,-77.99],[21.66,-77.15],[21.21,-76.52],[21.22,-76.19],[21.02,-75.6],[20.73,-75.67],[20.69,-74.93],[20.28,-74.18],[20.05,-74.3],[19.92,-74.96],[19.87,-75.63],[19.95,-76.32],[19.86,-77.76],[20.41,-77.09],[20.67,-77.49],[20.74,-78.14],[21.03,-78.48],[21.6,-78.72],[21.56,-79.29],[21.83,-80.22],[22.04,-80.52],[22.19,-81.82],[22.39,-82.17],[22.64,-81.79],[22.69,-82.78],[22.17,-83.49],[22.15,-83.91],[21.91,-84.05],[21.8,-84.55],[21.9,-84.97],[22.21,-84.45],[22.57,-84.23],[22.79,-83.78],[22.98,-83.27],[23.08,-82.51],[23.19,-82.27],[23.12,-81.41],[23.11,-80.62],[22.77,-79.68]],[[37.14,140.98],[36.34,140.6],[35.84,140.77],[35.14,140.25],[34.67,138.97],[34.61,137.22],[33.46,135.79],[33.85,135.12],[34.6,135.08],[34.38,133.34],[33.9,132.16],[33.89,130.99],[33.15,132.0],[31.45,131.33],[31.03,130.69],[31.42,130.2],[32.32,130.45],[32.61,129.82],[33.3,129.41],[33.6,130.36],[34.23,130.88],[34.75,131.89],[35.43,132.62],[35.73,134.61],[35.53,135.68],[37.3,136.72],[36.83,137.39],[37.83,138.86],[38.22,139.43],[39.44,140.05],[40.56,139.88],[41.2,140.31],[41.38,141.37],[39.99,141.92],[39.18,141.88],[38.17,140.96],[37.14,140.98]],[[-36.16,174.61],[-37.21,175.34],[-36.53,175.36],[-36.8,175.81],[-37.56,175.96],[-37.88,176.76],[-37.96,177.44],[-37.58,178.01],[-37.7,178.52],[-38.58,178.28],[-39.17,177.97],[-39.15,177.21],[-39.45,176.94],[-39.88,177.03],[-40.07,176.89],[-40.61,176.51],[-41.29,176.01],[-41.69,175.24],[-41.43,175.07],[-41.28,174.65],[-40.46,175.23],[-39.91,174.9],[-39.51,173.82],[-39.15,173.85],[-38.8,174.57],[-38.03,174.74],[-37.38,174.7],[-36.71,174.29],[-36.53,174.32],[-36.12,173.84],[-35.24,173.06],[-34.53,172.63],[-34.45,173.01],[-35.01,173.55],[-35.27,174.33],[-36.16,174.61]],[[19.87,-72.58],[19.71,-71.71],[19.88,-71.59],[19.88,-70.81],[19.62,-70.21],[19.65,-69.95],[19.29,-69.77],[19.31,-69.22],[19.01,-69.26],[18.98,-68.81],[18.61,-68.32],[18.21,-68.69],[18.42,-69.17],[18.38,-69.62],[18.43,-69.95],[18.25,-70.13],[18.18,-70.52],[18.43,-70.67],[18.28,-71.0],[17.6,-71.4],[17.76,-71.66],[18.04,-71.71],[18.21,-72.37],[18.14,-72.84],[18.22,-73.45],[18.03,-73.92],[18.34,-74.46],[18.66,-74.37],[18.53,-73.45],[18.45,-72.69],[18.67,-72.33],[19.1,-72.79],[19.48,-72.78],[19.64,-73.41],[19.92,-73.19],[19.87,-72.58]],[[-5.85,105.82],[-5.87,104.71],[-5.04,103.87],[-4.22,102.58],[-3.61,102.16],[-2.8,101.4],[-2.05,100.9],[-0.65,100.14],[0.18,99.26],[1.04,98.97],[1.82,98.6],[2.45,97.7],[3.31,97.18],[3.87,96.43],[4.97,95.38],[5.48,95.29],[5.44,95.94],[5.25,97.48],[4.27,98.37],[3.59,99.14],[3.17,99.69],[2.1,100.64],[2.08,101.66],[1.4,102.5],[0.56,103.08],[0.1,103.84],[-0.71,103.44],[-1.06,104.01],[-1.08,104.37],[-1.78,104.54],[-2.34,104.89],[-2.43,105.62],[-3.06,106.11],[-4.31,105.86],[-5.85,105.82]],[[18.5,121.32],[18.22,121.94],[18.48,122.24],[18.22,122.34],[17.81,122.17],[17.09,122.51],[16.26,122.25],[15.93,121.66],[15.13,121.51],[14.33,121.73],[14.22,122.26],[14.34,122.7],[13.78,123.95],[13.24,123.85],[13.0,124.18],[12.54,124.08],[13.03,123.3],[13.55,122.93],[13.19,122.67],[13.78,122.04],[13.64,121.13],[13.86,120.63],[14.27,120.68],[14.53,120.99],[14.76,120.69],[14.4,120.56],[14.97,120.07],[15.41,119.92],[16.36,119.88],[16.03,120.29],[17.6,120.39],[18.51,120.71],[18.5,121.32]],[[50.69,-56.13],[49.81,-56.8],[50.15,-56.14],[49.94,-55.47],[49.59,-55.82],[49.31,-54.93],[49.56,-54.47],[49.25,-53.48],[48.52,-53.79],[48.69,-53.09],[48.16,-52.96],[47.54,-52.65],[46.66,-53.07],[46.62,-53.52],[46.81,-54.18],[47.63,-53.96],[47.75,-54.24],[46.88,-55.4],[46.92,-56.0],[47.39,-55.29],[47.63,-56.25],[47.57,-57.33],[47.6,-59.27],[47.9,-59.42],[48.25,-58.8],[48.52,-59.23],[49.13,-58.39],[50.72,-57.36],[51.29,-56.74],[51.63,-55.87],[51.59,-55.41],[51.32,-55.6],[50.69,-56.13]],[[-40.92,173.02],[-41.33,173.25],[-40.93,173.96],[-41.35,174.25],[-41.77,174.25],[-42.23,173.88],[-42.97,173.22],[-43.37,172.71],[-43.85,173.08],[-43.87,172.31],[-44.24,171.45],[-44.9,171.18],[-45.91,170.62],[-46.36,169.83],[-46.64,169.33],[-46.62,168.41],[-46.29,167.76],[-46.22,166.68],[-45.85,166.51],[-45.11,167.05],[-44.12,168.3],[-43.94,168.95],[-43.56,169.67],[-43.03,170.52],[-42.51,171.13],[-41.77,171.57],[-41.51,171.95],[-40.96,172.1],[-40.49,172.8],[-40.92,173.02]],[[77.1,-94.68],[76.78,-93.57],[76.78,-91.6],[76.45,-90.74],[76.07,-90.97],[75.85,-89.82],[75.61,-89.19],[75.57,-87.84],[75.48,-86.38],[75.7,-84.79],[75.78,-82.75],[75.71,-81.13],[75.34,-80.06],[74.92,-79.83],[74.66,-80.46],[74.44,-81.95],[74.56,-83.23],[74.41,-86.1],[74.39,-88.15],[74.52,-89.77],[74.84,-92.42],[75.39,-92.77],[75.88,-92.89],[76.32,-93.89],[76.44,-95.96],[76.75,-97.12],[77.16,-96.75],[77.1,-94.68]],[[8.41,126.38],[7.75,126.48],[7.19,126.54],[6.27,126.2],[7.29,125.83],[6.79,125.36],[6.05,125.68],[5.58,125.4],[6.16,124.22],[6.89,123.94],[7.36,124.24],[7.83,123.61],[7.42,123.3],[7.46,122.82],[6.9,122.09],[7.19,121.92],[8.04,122.31],[8.32,122.94],[8.69,123.49],[8.24,123.84],[8.51,124.6],[8.96,124.76],[8.99,125.47],[9.76,125.41],[9.29,126.22],[8.78,126.31],[8.41,126.38]],[[70.72,57.53],[70.63,56.94],[70.76,53.68],[71.21,53.41],[71.47,51.6],[72.02,51.46],[72.23,52.48],[72.78,52.44],[73.63,54.43],[73.75,53.51],[74.63,55.9],[75.08,55.63],[75.61,57.87],[76.25,61.17],[76.44,64.5],[76.81,66.21],[76.94,68.16],[76.54,68.85],[76.23,68.18],[75.74,64.64],[75.26,61.58],[74.31,58.48],[73.33,56.99],[72.37,55.42],[71.54,55.62],[70.72,57.53]],[[-70.96,-68.45],[-71.41,-68.33],[-71.8,-68.51],[-72.17,-68.78],[-72.31,-69.96],[-72.5,-71.08],[-72.48,-72.39],[-72.09,-71.9],[-72.23,-73.08],[-72.37,-74.19],[-72.07,-74.95],[-71.66,-75.01],[-71.27,-73.91],[-71.15,-73.23],[-71.19,-72.07],[-70.68,-71.78],[-70.31,-71.72],[-69.51,-71.74],[-69.04,-71.17],[-68.88,-70.25],[-69.25,-69.72],[-69.62,-69.49],[-70.07,-69.06],[-70.5,-68.73],[-70.96,-68.45]],[[-53.85,-67.75],[-54.45,-66.45],[-54.7,-65.05],[-55.2,-65.5],[-55.25,-66.45],[-54.9,-66.96],[-55.3,-67.29],[-55.61,-68.15],[-55.5,-69.23],[-55.2,-69.96],[-55.05,-71.01],[-54.49,-72.27],[-53.96,-73.28],[-52.84,-74.66],[-53.05,-73.84],[-53.72,-72.43],[-54.07,-71.11],[-53.62,-70.59],[-52.93,-70.27],[-52.52,-69.35],[-52.64,-68.63],[-53.1,-68.25],[-53.85,-67.75]],[[-6.78,108.62],[-6.88,110.54],[-6.46,110.76],[-6.95,112.61],[-7.59,112.98],[-7.78,114.48],[-8.37,115.71],[-8.75,114.57],[-8.35,113.46],[-8.38,112.56],[-8.3,111.52],[-8.12,110.59],[-7.74,109.43],[-7.64,108.69],[-7.77,108.28],[-7.36,106.45],[-6.93,106.28],[-6.85,105.36],[-5.9,106.05],[-5.96,107.26],[-6.35,108.07],[-6.42,108.49],[-6.78,108.62]],[[-5.48,151.98],[-5.56,151.46],[-5.84,151.3],[-6.08,150.75],[-6.32,150.24],[-6.32,149.71],[-6.03,148.89],[-5.75,148.32],[-5.44,148.4],[-5.58,149.3],[-5.51,149.85],[-5.03,150.0],[-5.0,150.14],[-5.53,150.24],[-5.46,150.81],[-5.11,151.09],[-4.76,151.65],[-4.17,151.54],[-4.15,152.14],[-4.31,152.34],[-4.87,152.32],[-5.48,151.98]],[[50.75,143.65],[48.98,144.65],[49.31,143.18],[47.86,142.56],[46.84,143.54],[46.14,143.51],[46.74,142.75],[45.97,142.09],[46.81,141.91],[47.78,142.02],[48.86,141.9],[49.61,142.13],[50.95,142.18],[51.94,141.59],[53.3,141.68],[53.76,142.61],[54.23,142.21],[54.37,142.65],[53.7,142.92],[52.74,143.26],[51.76,143.24],[50.75,143.65]],[[76.2,-108.21],[75.85,-107.82],[76.01,-106.93],[75.97,-105.88],[75.48,-105.71],[75.0,-106.31],[74.85,-109.7],[74.42,-112.22],[74.39,-113.74],[74.72,-113.87],[75.16,-111.79],[75.04,-116.31],[75.22,-117.71],[76.2,-116.35],[76.48,-115.4],[76.14,-112.59],[75.55,-110.81],[75.47,-109.07],[76.43,-110.5],[76.79,-109.58],[76.68,-108.55],[76.2,-108.21]],[[-78.05,-45.15],[-78.48,-43.92],[-79.09,-43.49],[-79.52,-43.37],[-80.03,-43.33],[-80.34,-44.88],[-80.59,-46.51],[-80.83,-48.39],[-81.03,-50.48],[-80.97,-52.85],[-80.63,-54.16],[-80.22,-53.99],[-79.95,-51.85],[-79.61,-50.99],[-79.18,-50.37],[-78.81,-49.91],[-78.46,-49.31],[-78.05,-48.66],[-78.05,-48.15],[-77.83,-46.66],[-78.05,-45.15]],[[79.66,-87.02],[79.34,-85.82],[79.04,-87.19],[78.29,-89.03],[78.22,-90.81],[78.34,-92.88],[78.75,-93.95],[79.11,-93.94],[79.38,-93.15],[79.37,-94.97],[79.7,-96.08],[80.16,-96.71],[80.6,-96.01],[80.91,-95.32],[80.98,-94.3],[81.21,-94.74],[81.26,-92.41],[80.72,-91.13],[80.51,-89.45],[80.32,-87.81],[79.66,-87.02]],[[65.66,-85.16],[65.22,-84.98],[65.37,-84.46],[65.11,-83.88],[64.77,-82.79],[64.45,-81.64],[63.98,-81.55],[64.06,-80.82],[63.73,-80.1],[63.41,-80.99],[63.65,-82.55],[64.1,-83.11],[63.57,-84.1],[63.05,-85.52],[63.64,-85.87],[63.54,-87.22],[64.04,-86.35],[64.82,-86.23],[65.74,-85.88],[65.66,-85.16]],[[66.46,-14.51],[65.81,-14.74],[65.13,-13.61],[64.36,-14.91],[63.68,-17.79],[63.5,-18.66],[63.64,-19.97],[63.96,-22.76],[64.4,-21.78],[64.89,-23.96],[65.08,-22.19],[65.38,-22.23],[65.61,-24.33],[66.26,-23.65],[66.41,-22.13],[65.73,-20.58],[66.28,-19.06],[65.99,-17.8],[66.53,-16.17],[66.46,-14.51]],[[79.7,18.25],[78.96,21.54],[78.56,19.03],[77.83,18.47],[77.64,17.6],[76.81,17.12],[76.77,15.91],[77.38,13.76],[77.74,14.67],[78.02,13.17],[78.87,11.22],[79.65,10.45],[80.01,13.17],[79.66,13.72],[79.67,15.14],[80.02,15.52],[80.05,16.99],[79.7,18.25]],[[-40.79,145.4],[-41.14,146.36],[-41.0,146.91],[-40.81,147.69],[-40.87,148.29],[-42.06,148.36],[-42.41,148.02],[-43.21,147.91],[-42.94,147.56],[-43.64,146.87],[-43.58,146.66],[-43.55,146.05],[-42.69,145.43],[-42.03,145.3],[-41.16,144.72],[-40.7,144.74],[-40.79,145.4]],[[19.08,-155.54],[18.92,-155.69],[19.06,-155.94],[19.34,-155.91],[19.7,-156.07],[19.81,-156.02],[19.98,-155.85],[20.17,-155.92],[20.27,-155.86],[20.25,-155.79],[20.08,-155.4],[19.99,-155.22],[19.86,-155.06],[19.51,-154.81],[19.45,-154.83],[19.24,-155.22],[19.08,-155.54]],[[71.4,-120.46],[70.9,-123.09],[71.34,-123.62],[71.87,-125.93],[72.19,-125.59],[73.02,-124.81],[73.68,-123.94],[74.29,-124.92],[74.45,-121.54],[74.24,-120.11],[74.19,-117.56],[73.9,-116.59],[73.47,-115.51],[73.22,-116.77],[72.52,-119.22],[71.82,-120.46],[71.4,-120.46]],[[44.17,143.91],[43.96,144.61],[44.38,145.32],[43.26,145.54],[42.99,144.06],[41.99,143.18],[42.68,141.61],[41.59,141.07],[41.57,139.96],[42.56,139.82],[43.33,140.31],[43.39,141.38],[44.77,141.67],[45.55,141.97],[44.51,143.14],[44.17,143.91]],[[48.51,-123.51],[48.37,-124.01],[48.83,-125.65],[49.18,-125.96],[49.53,-126.85],[49.81,-127.03],[50.0,-128.06],[50.54,-128.44],[50.77,-128.36],[50.55,-127.31],[50.4,-126.69],[50.29,-125.75],[49.95,-125.42],[49.48,-124.92],[49.06,-123.92],[48.51,-123.51]],[[-10.14,124.44],[-10.36,123.58],[-10.24,123.46],[-9.9,123.55],[-9.29,123.98],[-8.89,124.97],[-8.66,125.09],[-8.43,125.95],[-8.4,126.64],[-8.27,126.96],[-8.4,127.34],[-8.67,126.97],[-9.11,125.93],[-9.39,125.09],[-10.14,124.44]],[[73.84,-100.36],[73.63,-99.16],[73.76,-97.38],[73.47,-97.12],[72.99,-98.05],[72.56,-96.54],[71.66,-96.72],[71.27,-98.36],[71.36,-99.32],[71.74,-100.01],[72.51,-102.5],[72.83,-102.48],[72.71,-100.44],[73.36,-101.54],[73.84,-100.36]],[[80.55,51.14],[80.42,49.79],[80.34,48.89],[80.18,48.75],[80.01,47.59],[80.25,46.5],[80.56,47.07],[80.59,44.85],[80.77,46.8],[80.78,48.32],[80.51,48.52],[80.75,49.1],[80.92,50.04],[80.7,51.52],[80.55,51.14]],[[-4.5,153.14],[-4.77,152.83],[-4.18,152.64],[-3.79,152.41],[-3.46,151.95],[-3.04,151.38],[-2.74,150.66],[-2.5,150.94],[-2.78,151.48],[-3.0,151.82],[-3.24,152.24],[-3.66,152.64],[-3.98,153.02],[-4.5,153.14]],[[12.16,125.5],[11.05,125.78],[11.31,125.01],[10.98,125.03],[10.36,125.28],[10.13,124.8],[10.84,124.76],[10.89,124.46],[11.49,124.3],[11.42,124.89],[11.79,124.88],[12.56,124.27],[12.54,125.23],[12.16,125.5]],[[-80.04,-59.57],[-80.55,-59.87],[-81.0,-60.16],[-80.86,-62.25],[-80.92,-64.49],[-80.59,-65.74],[-80.55,-65.74],[-80.26,-66.29],[-80.29,-64.04],[-80.39,-61.88],[-79.98,-61.14],[-79.63,-60.61],[-80.04,-59.57]],[[-71.93,-98.98],[-72.07,-97.88],[-71.95,-96.79],[-72.52,-96.2],[-72.44,-96.98],[-72.48,-98.2],[-72.44,-99.43],[-72.5,-100.78],[-72.31,-101.8],[-71.89,-102.33],[-71.72,-101.7],[-71.86,-100.43],[-71.93,-98.98]],[[-22.16,167.12],[-22.4,166.74],[-22.13,166.19],[-21.68,165.47],[-21.15,164.83],[-20.45,164.17],[-20.11,164.03],[-20.12,164.46],[-20.46,165.02],[-20.8,165.46],[-21.08,165.78],[-21.7,166.6],[-22.16,167.12]],[[1.13,128.69],[0.26,128.63],[0.36,128.12],[-0.25,127.97],[-0.78,128.38],[-0.9,128.1],[-0.27,127.7],[1.01,127.4],[1.81,127.6],[2.17,127.93],[1.63,128.0],[1.54,128.6],[1.13,128.69]],[[76.72,-98.5],[76.26,-97.74],[75.74,-97.7],[75.0,-98.16],[74.9,-99.81],[75.06,-100.88],[75.64,-100.86],[75.56,-102.5],[76.34,-102.57],[76.31,-101.49],[76.65,-99.98],[76.59,-98.58],[76.72,-98.5]],[[10.28,123.98],[9.95,123.62],[9.32,123.31],[9.02,123.0],[9.71,122.38],[9.98,122.59],[10.26,122.84],[10.88,122.95],[10.94,123.5],[10.27,123.34],[11.23,124.08],[10.28,123.98]],[[34.15,134.64],[33.81,134.77],[33.2,134.2],[33.52,133.79],[33.29,133.28],[32.7,133.02],[32.99,132.36],[33.46,132.37],[34.06,132.93],[33.94,133.49],[34.36,133.91],[34.15,134.64]],[[35.67,34.58],[35.25,33.9],[35.06,33.98],[34.98,34.0],[34.57,32.98],[34.7,32.49],[35.1,32.26],[35.14,32.73],[35.14,32.8],[35.39,32.95],[35.37,33.67],[35.67,34.58]],[[52.26,-6.79],[51.67,-8.56],[51.82,-9.98],[52.86,-9.17],[53.88,-9.69],[54.67,-8.33],[55.13,-7.57],[55.17,-6.73],[54.56,-5.66],[53.87,-6.2],[53.15,-6.03],[52.26,-6.79]],[[63.78,-171.73],[63.59,-171.12],[63.69,-170.49],[63.43,-169.68],[63.3,-168.69],[63.19,-168.77],[62.98,-169.53],[63.19,-170.29],[63.38,-170.67],[63.32,-171.55],[63.41,-171.79],[63.78,-171.73]],[[80.41,25.45],[80.06,27.41],[79.52,25.93],[79.4,23.02],[79.57,20.08],[79.84,19.9],[79.86,18.46],[80.32,17.37],[80.6,20.46],[80.36,21.91],[80.66,22.92],[80.41,25.45]],[[-79.5,-159.21],[-79.63,-161.13],[-79.28,-162.44],[-78.93,-163.03],[-78.87,-163.07],[-78.6,-163.71],[-78.22,-163.11],[-78.38,-161.24],[-78.69,-160.25],[-79.05,-159.48],[-79.5,-159.21]],[[-6.82,155.88],[-6.92,155.6],[-6.54,155.17],[-5.9,154.73],[-5.14,154.52],[-5.04,154.65],[-5.34,154.76],[-5.57,155.06],[-6.2,155.55],[-6.54,156.02],[-6.82,155.88]],[[17.87,-76.9],[17.7,-77.2],[17.86,-77.77],[18.23,-78.34],[18.45,-78.22],[18.52,-77.8],[18.49,-77.57],[18.4,-76.89],[18.16,-76.37],[17.89,-76.2],[17.87,-76.9]],[[35.71,23.7],[35.37,24.25],[35.43,25.03],[35.35,25.77],[35.18,25.75],[35.3,26.29],[35.0,26.16],[34.92,24.72],[35.09,24.73],[35.28,23.51],[35.71,23.7]],[[38.23,15.52],[37.44,15.16],[37.13,15.31],[36.62,15.1],[37.0,14.33],[37.1,13.83],[37.61,12.43],[38.13,12.57],[38.04,13.74],[38.14,14.76],[38.23,15.52]],[[54.04,-132.71],[54.12,-131.75],[52.98,-132.05],[52.18,-131.18],[52.18,-131.58],[52.64,-132.18],[53.1,-132.55],[53.41,-133.06],[53.85,-133.24],[54.17,-133.18],[54.04,-132.71]],[[69.11,-95.65],[68.76,-96.27],[69.06,-97.62],[68.95,-98.43],[69.4,-99.8],[69.71,-98.92],[70.14,-98.22],[69.86,-97.16],[69.68,-96.56],[69.49,-96.26],[69.11,-95.65]],[[73.1,-76.34],[72.83,-76.25],[72.86,-77.32],[72.88,-78.39],[72.74,-79.49],[72.8,-79.77],[73.33,-80.88],[73.69,-80.83],[73.76,-80.35],[73.65,-78.06],[73.1,-76.34]],[[72.77,-93.2],[72.02,-94.27],[72.06,-95.41],[72.94,-96.03],[73.44,-96.02],[73.86,-95.5],[74.13,-94.5],[74.1,-92.42],[73.86,-90.51],[72.97,-92.0],[72.77,-93.2]],[[77.65,-116.2],[76.88,-116.34],[76.53,-117.11],[76.48,-118.04],[76.05,-119.9],[75.9,-121.5],[76.12,-122.86],[76.86,-121.16],[77.51,-119.11],[77.5,-117.57],[77.65,-116.2]],[[78.33,-100.06],[77.91,-99.67],[78.02,-101.3],[78.34,-102.95],[78.38,-105.18],[78.68,-104.21],[78.92,-105.42],[79.3,-105.49],[79.16,-103.53],[78.8,-100.82],[78.33,-100.06]],[[78.88,99.94],[78.76,97.76],[79.04,94.97],[79.43,93.31],[80.14,92.54],[80.34,91.18],[81.03,93.78],[81.25,95.94],[80.75,97.88],[79.78,100.19],[78.88,99.94]],[[-51.1,-58.55],[-51.55,-57.75],[-51.9,-58.05],[-52.2,-59.4],[-51.85,-59.85],[-52.3,-60.7],[-51.85,-61.2],[-51.25,-60.0],[-51.5,-59.15],[-51.1,-58.55]],[[-16.56,-180.0],[-16.8,179.36],[-17.01,178.73],[-16.64,178.6],[-16.43,179.1],[-16.38,179.41],[-16.07,-180.0],[-16.02,-179.79],[-16.5,-179.92],[-16.56,-180.0]],[[-8.09,117.9],[-8.36,118.26],[-8.28,118.88],[-8.71,119.13],[-8.91,117.97],[-9.04,117.28],[-9.03,116.74],[-8.46,117.08],[-8.45,117.63],[-8.09,117.9]],[[6.2,81.22],[5.97,80.35],[6.76,79.87],[8.2,79.7],[9.82,80.15],[9.27,80.84],[8.56,81.31],[7.52,81.79],[6.48,81.64],[6.2,81.22]],[[18.68,110.34],[18.2,109.48],[18.51,108.65],[19.37,108.63],[19.82,109.12],[20.1,110.21],[20.08,110.79],[19.7,111.01],[19.26,110.57],[18.68,110.34]],[[41.21,9.21],[40.5,9.81],[39.18,9.67],[39.24,9.21],[38.91,8.81],[39.17,8.43],[40.38,8.39],[40.95,8.16],[40.9,8.71],[41.21,9.21]],[[-73.5,-121.21],[-73.66,-119.92],[-73.48,-118.72],[-73.83,-119.29],[-74.09,-120.23],[-74.01,-121.62],[-73.66,-122.62],[-73.32,-122.41],[-73.5,-121.21]],[[-49.71,70.28],[-49.77,68.74],[-49.24,68.72],[-48.83,68.87],[-48.62,68.94],[-48.94,69.58],[-49.07,70.53],[-49.25,70.56],[-49.71,70.28]],[[-17.34,178.37],[-17.63,178.72],[-18.15,178.55],[-18.29,177.93],[-18.16,177.38],[-17.72,177.29],[-17.38,177.67],[-17.51,178.12],[-17.34,178.37]],[[-8.09,122.9],[-8.65,122.76],[-8.93,121.25],[-8.81,119.92],[-8.45,119.92],[-8.24,120.71],[-8.54,121.34],[-8.46,122.01],[-8.09,122.9]],[[-8.34,159.88],[-8.54,159.92],[-8.11,159.13],[-7.75,158.59],[-7.42,158.21],[-7.32,158.36],[-7.56,158.82],[-8.02,159.64],[-8.34,159.88]],[[-3.09,130.47],[-3.86,130.83],[-3.45,129.99],[-3.36,129.16],[-3.43,128.59],[-3.39,127.9],[-2.84,128.13],[-2.8,129.37],[-3.09,130.47]],[[9.32,118.5],[8.37,117.18],[9.07,117.67],[9.68,118.39],[10.38,118.99],[11.37,119.51],[10.55,119.69],[10.0,119.03],[9.32,118.5]],[[11.89,121.88],[11.58,122.48],[11.58,123.12],[11.17,123.1],[10.74,122.64],[10.44,122.0],[10.91,121.97],[11.42,122.04],[11.89,121.88]],[[18.23,-65.59],[17.98,-65.85],[17.98,-66.6],[17.95,-67.19],[18.37,-67.24],[18.52,-67.1],[18.52,-66.28],[18.43,-65.77],[18.23,-65.59]],[[20.64,-156.08],[20.57,-156.42],[20.78,-156.59],[20.86,-156.7],[20.93,-156.71],[21.01,-156.61],[20.92,-156.26],[20.76,-155.99],[20.64,-156.08]],[[21.32,-157.65],[21.26,-157.71],[21.28,-157.78],[21.31,-158.13],[21.54,-158.25],[21.58,-158.29],[21.72,-158.03],[21.65,-157.94],[21.32,-157.65]],[[22.79,121.18],[21.97,120.75],[22.81,120.22],[23.56,120.11],[24.54,120.69],[25.3,121.5],[25.0,121.95],[24.39,121.78],[22.79,121.18]],[[46.55,-63.66],[46.42,-62.94],[46.44,-62.01],[46.03,-62.51],[45.97,-62.87],[46.39,-64.14],[46.73,-64.39],[47.04,-64.01],[46.55,-63.66]],[[57.12,-153.01],[56.74,-154.0],[56.99,-154.52],[57.46,-154.67],[57.82,-153.76],[57.97,-153.23],[57.9,-152.56],[57.59,-152.14],[57.12,-153.01]],[[67.15,-75.87],[67.1,-76.99],[67.59,-77.24],[68.15,-76.81],[68.29,-75.89],[68.01,-75.11],[67.58,-75.1],[67.44,-75.22],[67.15,-75.87]],[[75.56,145.09],[74.82,144.3],[74.85,140.62],[74.61,138.96],[75.26,136.98],[75.95,137.51],[76.14,138.83],[76.09,141.47],[75.56,145.09]],[[78.06,-95.83],[77.85,-97.31],[78.08,-98.12],[78.46,-98.55],[78.87,-98.63],[78.83,-97.34],[78.77,-96.75],[78.42,-95.56],[78.06,-95.83]],[[-9.87,160.85],[-9.9,160.46],[-9.79,159.85],[-9.64,159.64],[-9.24,159.7],[-9.4,160.36],[-9.61,160.69],[-9.87,160.85]],[[10.11,-60.94],[10.0,-61.77],[10.09,-61.95],[10.37,-61.66],[10.76,-61.68],[10.89,-61.11],[10.85,-60.9],[10.11,-60.94]],[[23.76,-77.54],[23.71,-77.78],[24.29,-78.03],[24.57,-78.41],[25.21,-78.19],[25.17,-77.89],[24.34,-77.54],[23.76,-77.54]],[[49.11,-61.81],[49.09,-62.29],[49.4,-63.59],[49.87,-64.52],[49.96,-64.17],[49.71,-62.86],[49.29,-61.84],[49.11,-61.81]],[[62.16,-79.27],[61.63,-79.66],[61.72,-80.1],[62.02,-80.36],[62.09,-80.32],[62.38,-79.93],[62.36,-79.52],[62.16,-79.27]],[[71.52,-180.0],[71.56,-179.87],[71.56,-179.02],[71.27,-177.58],[71.13,-177.66],[70.89,-178.69],[70.83,-180.0],[71.52,-180.0]],[[73.21,143.6],[73.21,142.09],[73.32,140.04],[73.37,139.86],[73.77,140.81],[73.86,142.06],[73.47,143.48],[73.21,143.6]],[[74.98,-93.61],[74.59,-94.16],[74.67,-95.61],[74.93,-96.82],[75.38,-96.29],[75.65,-94.85],[75.3,-93.98],[74.98,-93.61]],[[77.85,24.72],[77.45,22.49],[77.68,20.73],[77.93,21.41],[78.25,20.81],[78.46,22.88],[78.08,23.28],[77.85,24.72]],[[-73.48,-125.56],[-73.87,-124.03],[-73.83,-124.62],[-73.74,-125.91],[-73.46,-127.28],[-73.25,-126.56],[-73.48,-125.56]],[[-14.93,167.11],[-15.74,167.27],[-15.61,167.0],[-15.67,166.79],[-15.39,166.65],[-14.63,166.63],[-14.93,167.11]],[[-10.24,120.71],[-10.26,120.29],[-9.56,118.97],[-9.36,119.9],[-9.67,120.43],[-9.97,120.78],[-10.24,120.71]],[[-9.6,161.68],[-9.78,161.53],[-8.92,160.79],[-8.32,160.58],[-8.32,160.92],[-9.12,161.28],[-9.6,161.68]],[[-7.35,157.54],[-7.4,157.34],[-7.18,156.9],[-6.77,156.49],[-6.6,156.54],[-7.02,157.14],[-7.35,157.54]],[[-6.21,134.73],[-6.89,134.21],[-6.14,134.11],[-5.78,134.29],[-5.44,134.5],[-5.74,134.73],[-6.21,134.73]],[[21.98,-159.35],[21.88,-159.47],[22.06,-159.8],[22.14,-159.75],[22.24,-159.59],[22.22,-159.36],[21.98,-159.35]],[[26.59,-77.0],[25.88,-77.17],[26.01,-77.36],[26.53,-77.34],[26.93,-77.79],[27.04,-77.79],[26.59,-77.0]],[[42.15,9.56],[41.38,9.23],[41.58,8.78],[42.26,8.54],[42.63,8.75],[43.01,9.39],[42.15,9.56]],[[59.91,-165.58],[59.75,-166.19],[59.94,-166.85],[60.21,-167.45],[60.38,-166.47],[60.29,-165.68],[59.91,-165.58]],[[62.71,-81.9],[62.16,-83.07],[62.18,-83.77],[62.45,-83.99],[62.91,-83.25],[62.9,-81.88],[62.71,-81.9]],[[75.08,150.73],[74.69,149.58],[74.78,147.98],[75.17,146.12],[75.5,146.36],[75.35,148.22],[75.08,150.73]],[[77.52,-93.84],[77.49,-94.29],[77.56,-96.17],[77.83,-96.44],[77.82,-94.42],[77.63,-93.72],[77.52,-93.84]],[[77.7,-110.19],[77.41,-112.05],[77.73,-113.53],[78.05,-112.73],[78.15,-111.26],[78.0,-109.85],[77.7,-110.19]],[[78.6,-109.66],[78.41,-110.88],[78.41,-112.54],[78.55,-112.52],[78.85,-111.5],[78.8,-110.96],[78.6,-109.66]],[[78.31,105.08],[77.92,99.44],[79.23,101.26],[79.35,102.09],[79.28,102.84],[78.71,105.37],[78.31,105.08]],[[-10.48,162.12],[-10.83,162.4],[-10.82,161.7],[-10.21,161.32],[-10.45,161.92],[-10.48,162.12]],[[-3.46,127.25],[-3.79,126.87],[-3.61,126.18],[-3.18,125.99],[-3.13,127.0],[-3.46,127.25]],[[13.07,121.53],[12.21,121.26],[12.7,120.83],[13.47,120.32],[13.43,121.18],[13.07,121.53]],[[26.58,-77.82],[26.42,-78.91],[26.79,-78.98],[26.87,-78.51],[26.84,-77.85],[26.58,-77.82]],[[55.61,12.69],[54.8,12.09],[55.36,11.04],[55.78,10.9],[56.11,12.37],[55.61,12.69]],[[73.42,-104.5],[72.76,-105.38],[73.46,-106.94],[73.6,-106.6],[73.64,-105.26],[73.42,-104.5]],[[-16.47,167.85],[-16.6,167.52],[-16.16,167.18],[-15.89,167.22],[-16.47,167.85]],[[21.18,-156.76],[21.07,-156.79],[21.1,-157.33],[21.22,-157.25],[21.18,-156.76]],[[71.52,-180.0],[70.83,180.0],[70.78,178.9],[71.1,178.73],[71.52,-180.0]]];

const EXPLORE_GLOBE = {
  lon: -96,
  lat: 38,
  zoom: 1.95,
  targetZoom: 1.95,
  previewLon: -98,
  previewLat: 18,
  previewVelocity: 0,
  modalVelocityLon: 0,
  modalVelocityLat: 0,
  isDragging: false,
  modalDragging: false,
  moved: false,
  modalMoved: false,
  lastX: 0,
  lastY: 0,
  lastMoveTime: 0,
  raf: null,
  modalRaf: null,
  renderRaf: null,
  focusRaf: null,
  pins: [],
  selectedId: null,
  hoveredId: null,
  previewHit: null,
  modalHit: null
};

function getSchoolCoord(s) {
  return SCHOOL_COORDS[s.id] || STATE_COORDS[s.state] || [39, -98];
}
function globeSchools() {
  try {
    if (document.getElementById('page-explore')?.classList.contains('active')) return applyFilters();
  } catch (e) {}
  return SCHOOLS;
}
function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, rect.width || canvas.width);
  const h = Math.max(1, rect.height || canvas.height);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function globeProject(lat, lon, centerLon, centerLat, cx, cy, r) {
  const phi = lat * Math.PI / 180;
  const lambda = (lon - centerLon) * Math.PI / 180;
  const phi0 = centerLat * Math.PI / 180;
  const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  return {
    x: cx + r * Math.cos(phi) * Math.sin(lambda),
    y: cy - r * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
    visible: cosc > 0.015,
    depth: cosc
  };
}
function clampGlobeLat(lat) {
  return Math.max(-58, Math.min(72, lat));
}
function normLon(lon) {
  return ((lon + 540) % 360) - 180;
}
function lonStep(from, to) {
  return normLon(to - from);
}
function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}
function globeThemePalette() {
  const dark = isDarkTheme();
  return {
    ocean: dark ? '#06111d' : 'rgba(231, 239, 240, .62)',
    land: dark ? '#172632' : 'rgba(112, 132, 126, .18)',
    coast: dark ? 'rgba(174, 199, 205, .28)' : 'rgba(72, 91, 88, .38)',
    grid: dark ? 'rgba(174, 199, 205, .1)' : 'rgba(72, 91, 88, .14)',
    ring: dark ? 'rgba(142, 220, 232, .2)' : 'rgba(72, 91, 88, .34)'
  };
}
function pointerInsideGlobe(e, hit) {
  if (!hit) return true;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return Math.hypot(x - hit.cx, y - hit.cy) <= hit.r + 14;
}
function resetGlobeNorthAmericaView() {
  EXPLORE_GLOBE.lon = -96;
  EXPLORE_GLOBE.lat = 24;
  EXPLORE_GLOBE.zoom = 1.95;
  EXPLORE_GLOBE.targetZoom = 1.95;
}
function clampGlobeZoom(zoom) {
  return Math.max(1.18, Math.min(2.85, zoom));
}
let WORLD_LAND_GEOJSON = null;
function worldLandGeoJson() {
  if (!WORLD_LAND_GEOJSON) {
    WORLD_LAND_GEOJSON = {
      type: 'MultiPolygon',
      coordinates: WORLD_LAND.map(points => [[
        ...points.map(([lat, lon]) => [lon, lat]),
        [points[0][1], points[0][0]]
      ]])
    };
  }
  return WORLD_LAND_GEOJSON;
}
function globeProjection(centerLon, centerLat, cx, cy, r) {
  if (!window.d3?.geoOrthographic) return null;
  return d3.geoOrthographic()
    .rotate([-centerLon, -centerLat])
    .translate([cx, cy])
    .scale(r)
    .clipAngle(90);
}
function drawProjectedPath(ctx, points, centerLon, centerLat, cx, cy, r, closePath) {
  let started = false;
  let visibleCount = 0;
  let prev = null;
  let broken = false;
  points.forEach(([lat, lon]) => {
    const p = globeProject(lat, lon, centerLon, centerLat, cx, cy, r);
    const offscreenJump = prev && Math.hypot(p.x - prev.x, p.y - prev.y) > r * .45;
    if (!p.visible || offscreenJump) {
      started = false;
      prev = p;
      broken = true;
      return;
    }
    visibleCount++;
    if (!started) {
      ctx.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
    prev = p;
  });
  if (closePath && visibleCount >= 3 && !broken) ctx.closePath();
  return { visibleCount, broken };
}
function drawLandMasses(ctx, cx, cy, r, centerLon, centerLat, compact) {
  const palette = globeThemePalette();
  const land = compact ? 'transparent' : palette.land;
  const coast = compact
    ? (isDarkTheme() ? 'rgba(218, 214, 200, .44)' : 'rgba(88, 84, 73, .38)')
    : palette.coast;
  const projection = globeProjection(centerLon, centerLat, cx, cy, r);
  if (projection && window.d3?.geoPath) {
    const path = d3.geoPath(projection, ctx);
    ctx.beginPath();
    path(worldLandGeoJson());
    if (!compact) {
      ctx.fillStyle = land;
      ctx.fill();
    }
    ctx.strokeStyle = coast;
    ctx.lineWidth = compact ? .7 : .65;
    ctx.stroke();
    return;
  }
  WORLD_LAND.forEach(points => {
    ctx.beginPath();
    const result = drawProjectedPath(ctx, points, centerLon, centerLat, cx, cy, r, true);
    if (!result.visibleCount) return;
    if (!compact && !result.broken) {
      ctx.fillStyle = land;
      ctx.fill();
    }
    ctx.strokeStyle = coast;
    ctx.lineWidth = compact ? .7 : .65;
    ctx.stroke();
  });
}
function drawGlobeGrid(ctx, cx, cy, r, centerLon, centerLat, compact) {
  const palette = globeThemePalette();
  ctx.strokeStyle = compact
    ? (isDarkTheme() ? 'rgba(218, 214, 200, .20)' : 'rgba(88, 84, 73, .18)')
    : palette.grid;
  ctx.lineWidth = compact ? .75 : .65;
  const projection = globeProjection(centerLon, centerLat, cx, cy, r);
  if (projection && window.d3?.geoPath && window.d3?.geoGraticule10) {
    const path = d3.geoPath(projection, ctx);
    ctx.beginPath();
    path(d3.geoGraticule10());
    ctx.stroke();
    return;
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = globeProject(lat, lon, centerLon, centerLat, cx, cy, r);
      if (!p.visible) { started = false; continue; }
      started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      started = true;
    }
    ctx.stroke();
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    ctx.beginPath();
    let started = false;
    for (let lat = -80; lat <= 80; lat += 3) {
      const p = globeProject(lat, lon, centerLon, centerLat, cx, cy, r);
      if (!p.visible) { started = false; continue; }
      started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      started = true;
    }
    ctx.stroke();
  }
}
function drawGlobeStand(ctx, cx, cy, r, compact) {
  const dark = isDarkTheme();
  const stand = dark ? 'rgba(154, 151, 137, .62)' : 'rgba(111, 107, 96, .58)';
  const standSoft = dark ? 'rgba(154, 151, 137, .22)' : 'rgba(111, 107, 96, .18)';
  ctx.save();
  ctx.strokeStyle = standSoft;
  ctx.lineWidth = compact ? 1.4 : 1.8;
  ctx.beginPath();
  ctx.ellipse(cx + r * .03, cy, r * 1.04, r * 1.08, -.36, Math.PI * 1.18, Math.PI * 1.88);
  ctx.stroke();
  ctx.strokeStyle = stand;
  ctx.lineWidth = compact ? 2 : 2.4;
  ctx.lineCap = 'round';
  const neckY = cy + r + (compact ? 6 : 8);
  const baseY = cy + r + (compact ? 34 : 48);
  ctx.beginPath();
  ctx.moveTo(cx, neckY);
  ctx.lineTo(cx, baseY);
  ctx.stroke();
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + (compact ? 3 : 5), r * .48, compact ? 7 : 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * .18, neckY);
  ctx.lineTo(cx + r * .18, neckY);
  ctx.stroke();
  ctx.restore();
}
function drawGlobeShell(ctx, cx, cy, r, centerLon, centerLat, compact, showStand = true) {
  const palette = globeThemePalette();
  const ocean = palette.ocean;
  if (showStand) drawGlobeStand(ctx, cx, cy, r, compact);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (!compact) {
    ctx.fillStyle = ocean;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  drawLandMasses(ctx, cx, cy, r, centerLon, centerLat, compact);
  drawGlobeGrid(ctx, cx, cy, r, centerLon, centerLat, compact);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = compact
    ? (isDarkTheme() ? 'rgba(218, 214, 200, .52)' : 'rgba(88, 84, 73, .46)')
    : palette.ring;
  ctx.lineWidth = compact ? 1.4 : 1.15;
  ctx.stroke();
}
function drawMapPin(ctx, x, y, color, selected, compact, hovered) {
  const scale = hovered ? 1.2 : 1;
  const h = (selected ? 10 : compact ? 0 : 8) * scale;
  const w = (selected ? 6.5 : compact ? 0 : 5) * scale;
  if (compact) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(247, 251, 255, .72)';
    ctx.stroke();
    ctx.restore();
    return;
  }
  const headY = y - h * .58;
  const headR = w * .48;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, .2)';
  ctx.shadowBlur = 1.5;
  ctx.shadowOffsetY = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - w * .56, y - h * .32, x - w * .62, y - h * .7, x, y - h);
  ctx.bezierCurveTo(x + w * .62, y - h * .7, x + w * .56, y - h * .32, x, y);
  ctx.closePath();
  ctx.fillStyle = selected ? '#f7fbff' : color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, headY, Math.max(2.1, headR * .46), 0, Math.PI * 2);
  ctx.fillStyle = selected ? '#08101b' : color;
  ctx.fill();
  ctx.restore();
}
function globeFitTier(s) {
  const userGpa = Number(USER_PROFILE.gpa) || 3.5;
  const diff = userGpa - Number(s.gpa || 0);
  if (diff >= .3) return 'competitive';
  if (diff >= -.05) return 'borderline';
  return 'reach';
}
function globeFitColor(s) {
  const tier = globeFitTier(s);
  if (tier === 'competitive') return '#3fd58f';
  if (tier === 'borderline') return '#f2c94c';
  return '#9aa3ad';
}
function globeGpaRange(s) {
  const gpa = Number(s.gpa || 0);
  return `${Math.max(0, gpa - .12).toFixed(2)}-${Math.min(4, gpa + .12).toFixed(2)}`;
}
function drawSchoolPins(ctx, schools, centerLon, centerLat, cx, cy, r, compact) {
  const maxPins = compact ? 34 : 120;
  const pins = schools.slice(0, maxPins).map(s => {
    const [lat, lon] = getSchoolCoord(s);
    const p = globeProject(lat, lon, centerLon, centerLat, cx, cy, r);
    return { s, p, radius: compact ? 4 : 6 };
  }).filter(x => x.p.visible).sort((a, b) => a.p.depth - b.p.depth);
  pins.forEach(({ s, p }) => {
    const color = globeFitColor(s);
    const selected = EXPLORE_GLOBE.selectedId === s.id && !compact;
    const hovered = EXPLORE_GLOBE.hoveredId === s.id && !compact;
    drawMapPin(ctx, p.x, p.y, color, selected, compact, hovered);
    p.hitRadius = selected || hovered ? 14 : compact ? 0 : 11;
  });
  EXPLORE_GLOBE.pins = pins;
}
function stopPreviewSpin() {
  if (EXPLORE_GLOBE.raf) cancelAnimationFrame(EXPLORE_GLOBE.raf);
  EXPLORE_GLOBE.raf = null;
}
function startPreviewSpin() {
  stopPreviewSpin();
  const step = () => {
    if (EXPLORE_GLOBE.isDragging) return;
    EXPLORE_GLOBE.previewLon = normLon(EXPLORE_GLOBE.previewLon + EXPLORE_GLOBE.previewVelocity);
    EXPLORE_GLOBE.previewVelocity *= .965;
    renderExploreGlobePreview();
    if (Math.abs(EXPLORE_GLOBE.previewVelocity) > .012) {
      EXPLORE_GLOBE.raf = requestAnimationFrame(step);
    } else {
      EXPLORE_GLOBE.raf = null;
    }
  };
  if (Math.abs(EXPLORE_GLOBE.previewVelocity) > .012) EXPLORE_GLOBE.raf = requestAnimationFrame(step);
}
function renderExploreGlobePreview() {
  const canvas = document.getElementById('globePreviewCanvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 24 || rect.height < 24) {
    requestAnimationFrame(renderExploreGlobePreview);
    return;
  }
  const schools = globeSchools();
  const count = document.getElementById('globeSchoolCount');
  if (count) count.textContent = `${schools.length} school${schools.length === 1 ? '' : 's'}`;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * .38;
  const r = Math.min(w * .28, h * .31);
  EXPLORE_GLOBE.previewHit = { cx, cy, r };
  drawGlobeShell(ctx, cx, cy, r, EXPLORE_GLOBE.previewLon, EXPLORE_GLOBE.previewLat, true, true);
}
function initExploreGlobe() {
  const wrap = document.getElementById('globePreview');
  if (!wrap || wrap.dataset.ready) return;
  wrap.dataset.ready = 'true';
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => renderExploreGlobePreview());
    ro.observe(wrap);
    wrap._globeResizeObserver = ro;
  }
  const down = e => {
    if (!pointerInsideGlobe(e, EXPLORE_GLOBE.previewHit)) return;
    stopPreviewSpin();
    EXPLORE_GLOBE.isDragging = true;
    EXPLORE_GLOBE.moved = false;
    EXPLORE_GLOBE.lastX = e.clientX;
    EXPLORE_GLOBE.lastY = e.clientY;
    EXPLORE_GLOBE.lastMoveTime = performance.now();
    EXPLORE_GLOBE.previewVelocity = 0;
  };
  const move = e => {
    if (!EXPLORE_GLOBE.isDragging) return;
    const now = performance.now();
    const dx = e.clientX - EXPLORE_GLOBE.lastX;
    const dy = e.clientY - EXPLORE_GLOBE.lastY;
    const dt = Math.max(16, now - EXPLORE_GLOBE.lastMoveTime);
    if (Math.abs(dx) > 2) EXPLORE_GLOBE.moved = true;
    EXPLORE_GLOBE.previewLon = normLon(EXPLORE_GLOBE.previewLon - dx * .42);
    EXPLORE_GLOBE.previewLat = clampGlobeLat(EXPLORE_GLOBE.previewLat + dy * .08);
    EXPLORE_GLOBE.previewVelocity = Math.max(-10, Math.min(10, (-dx * .42) * (16 / dt)));
    EXPLORE_GLOBE.lastX = e.clientX;
    EXPLORE_GLOBE.lastY = e.clientY;
    EXPLORE_GLOBE.lastMoveTime = now;
    renderExploreGlobePreview();
  };
  const up = (e, withInertia = true) => {
    if (!EXPLORE_GLOBE.isDragging) return;
    EXPLORE_GLOBE.isDragging = false;
    if (!withInertia) EXPLORE_GLOBE.previewVelocity = 0;
    startPreviewSpin();
  };
  wrap.addEventListener('pointerdown', down);
  wrap.addEventListener('pointermove', move);
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', e => up(e, false));
  wrap.addEventListener('pointerleave', e => up(e, false));
  wrap.addEventListener('click', e => {
    if (EXPLORE_GLOBE.moved) {
      e.preventDefault();
      e.stopPropagation();
      EXPLORE_GLOBE.moved = false;
    }
  });
  renderExploreGlobePreview();
  requestAnimationFrame(renderExploreGlobePreview);
  setTimeout(renderExploreGlobePreview, 120);
}
function openExploreGlobe() {
  if (EXPLORE_GLOBE.moved) {
    EXPLORE_GLOBE.moved = false;
    return;
  }
  const schools = globeSchools();
  resetGlobeNorthAmericaView();
  EXPLORE_GLOBE.selectedId = null;
  EXPLORE_GLOBE.hoveredId = null;
  const box = document.getElementById('appModalBox');
  box.className = 'modal globe-modal';
  box.innerHTML = `
    <div class="modal-head">
      <div>
        <h3>Data Atlas</h3>
        <div class="mh-sub">${schools.length} visible school${schools.length === 1 ? '' : 's'} from current Schools filters</div>
      </div>
      <div class="globe-topbar" aria-label="GPA fit legend">
        <span class="globe-fit-key"><i style="--fit:#3fd58f"></i>Competitive</span>
        <span class="globe-fit-key"><i style="--fit:#f2c94c"></i>Borderline</span>
        <span class="globe-fit-key"><i style="--fit:#9aa3ad"></i>Reach</span>
        <div class="globe-zoom-controls" aria-label="Globe zoom controls">
          <button type="button" onclick="setGlobeZoom(-.2)" title="Zoom out" aria-label="Zoom out">-</button>
          <button type="button" onclick="setGlobeZoom(.2)" title="Zoom in" aria-label="Zoom in">+</button>
        </div>
        <button class="drawer-close" onclick="closeAppModal()" title="Close"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
    </div>
    <div class="globe-modal-body">
      <div class="globe-stage" id="globeStage">
        <canvas id="globeModalCanvas"></canvas>
        <div class="globe-info-card" id="globeInfoCard" hidden></div>
        <span class="globe-stage-note">Drag to rotate. Use + / - to zoom.</span>
      </div>
      <aside class="globe-detail-panel" id="globeDetailPanel">
        <div class="globe-panel-empty">Select a school pin for transfer fit, deadline, and cost.</div>
      </aside>
    </div>
  `;
  document.getElementById('appModal').classList.add('active');
  initModalGlobe();
}
function syncGlobePinListSelection() {
  renderGlobeDetailPanel();
}
function updateGlobeInfoCard() {
  const card = document.getElementById('globeInfoCard');
  const stage = document.getElementById('globeStage');
  const activeId = EXPLORE_GLOBE.hoveredId;
  if (!card || !stage || !activeId) {
    if (card) card.hidden = true;
    return;
  }
  const pin = EXPLORE_GLOBE.pins.find(item => item.s.id === activeId);
  if (!pin) {
    card.hidden = true;
    return;
  }
  const s = pin.s;
  const stageRect = stage.getBoundingClientRect();
  const left = Math.min(stageRect.width - 124, Math.max(124, pin.p.x));
  const top = Math.min(stageRect.height - 28, Math.max(76, pin.p.y));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.innerHTML = `
    <div class="gic-name">${s.name}</div>
    <div class="gic-meta">GPA ${globeGpaRange(s)}</div>
  `;
  card.hidden = false;
}
function renderGlobeDetailPanel() {
  const panel = document.getElementById('globeDetailPanel');
  if (!panel) return;
  const s = byId(EXPLORE_GLOBE.selectedId);
  if (!s) {
    if (!panel.classList.contains('active') && panel.dataset.schoolId === '') return;
    panel.dataset.schoolId = '';
    panel.classList.remove('active');
    panel.innerHTML = '<div class="globe-panel-empty">Select a school pin for transfer fit, deadline, and cost.</div>';
    return;
  }
  if (panel.dataset.schoolId === s.id) return;
  panel.dataset.schoolId = s.id;
  const deadlineDate = compactDeadlineDate(s);
  const d = daysTo(deadlineDate);
  const onList = USER_APPS.some(a => a.id === s.id);
  const fit = globeFitTier(s);
  panel.innerHTML = `
    <div class="globe-school-panel">
      <div class="globe-panel-head">
        <button class="globe-panel-close" onclick="clearGlobeSelection()" title="Close"><svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <span class="tag">${fit}</span>
        <h3>${s.name}</h3>
        <p>${s.location ? s.location + ', ' : ''}${s.state} · ${s.platform}</p>
      </div>
      <div class="modal-body">
        <div class="sd-stats">
        <div class="sd-stat"><div class="sd-v">${formatAcceptance(s)}</div><div class="sd-l">Accept</div></div>
          <div class="sd-stat"><div class="sd-v">${formatGpa(s)}</div><div class="sd-l">Avg GPA</div></div>
          <div class="sd-stat"><div class="sd-v">${s.undergrad ? (s.undergrad/1000).toFixed(1)+'k' : '-'}</div><div class="sd-l">Undergrads</div></div>
        </div>
        <div class="sd-block">
          <div class="sd-row"><span>${compactDeadlineType(s)}</span><b class="mono">${d > 0 ? d + ' days' : fmtDate(deadlineDate)}</b></div>
          <div class="sd-row"><span>Out-of-state tuition</span><b class="mono">$${s.tuition.out.toLocaleString()}/yr</b></div>
          <div class="sd-row"><span>Application fee</span><b class="mono">${formatFee(s)}${s.waiver ? ' · waiver' : ''}</b></div>
          <div class="sd-row"><span>Major areas</span><span style="font-size:.85rem; color:var(--text-secondary); text-align:right; max-width:190px;">${s.majors.slice(0, 3).join(', ')}</span></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost btn-sm" onclick="toggleFav('${s.id}'); renderGlobeDetailPanel(); renderSchoolGrid();">
          ${onList ? 'In applications' : 'Add to applications'}
        </button>
        <div class="row gap-1">
          ${s.schoolUrl ? `<a class="btn btn-ghost btn-sm" href="${s.schoolUrl}" target="_blank" rel="noopener">School site</a>` : ''}
          ${s.applyLink ? `<a class="btn btn-primary btn-sm" href="${s.applyLink}" target="_blank" rel="noopener">Apply</a>` : ''}
        </div>
      </div>
    </div>
  `;
  panel.classList.add('active');
}
function clearGlobeSelection() {
  EXPLORE_GLOBE.selectedId = null;
  EXPLORE_GLOBE.targetZoom = EXPLORE_GLOBE.zoom;
  renderModalGlobe();
}
function focusGlobeOnSchool(id) {
  const s = byId(id);
  if (!s) return;
  const [lat, lon] = getSchoolCoord(s);
  EXPLORE_GLOBE.selectedId = id;
  EXPLORE_GLOBE.targetZoom = Math.max(EXPLORE_GLOBE.zoom, 2.15);
  renderGlobeDetailPanel();
  animateGlobeTo(lon, Math.max(22, Math.min(55, lat)), EXPLORE_GLOBE.targetZoom);
}
function setGlobeZoom(delta) {
  EXPLORE_GLOBE.zoom = clampGlobeZoom(EXPLORE_GLOBE.zoom + delta);
  EXPLORE_GLOBE.targetZoom = EXPLORE_GLOBE.zoom;
  renderModalGlobe();
}
function animateGlobeTo(targetLon, targetLat, targetZoom) {
  if (EXPLORE_GLOBE.focusRaf) cancelAnimationFrame(EXPLORE_GLOBE.focusRaf);
  const step = () => {
    EXPLORE_GLOBE.lon = normLon(EXPLORE_GLOBE.lon + lonStep(EXPLORE_GLOBE.lon, targetLon) * .16);
    EXPLORE_GLOBE.lat += (targetLat - EXPLORE_GLOBE.lat) * .16;
    EXPLORE_GLOBE.zoom += (targetZoom - EXPLORE_GLOBE.zoom) * .14;
    renderModalGlobe();
    const done = Math.abs(lonStep(EXPLORE_GLOBE.lon, targetLon)) < .25
      && Math.abs(EXPLORE_GLOBE.lat - targetLat) < .18
      && Math.abs(EXPLORE_GLOBE.zoom - targetZoom) < .01;
    if (!done) {
      EXPLORE_GLOBE.focusRaf = requestAnimationFrame(step);
    } else {
      EXPLORE_GLOBE.lon = normLon(targetLon);
      EXPLORE_GLOBE.lat = targetLat;
      EXPLORE_GLOBE.zoom = targetZoom;
      renderModalGlobe();
      EXPLORE_GLOBE.focusRaf = null;
    }
  };
  EXPLORE_GLOBE.focusRaf = requestAnimationFrame(step);
}
function renderModalGlobe() {
  const canvas = document.getElementById('globeModalCanvas');
  if (!canvas) return;
  const schools = globeSchools();
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const panelOpen = !!EXPLORE_GLOBE.selectedId && w > 900;
  const cx = panelOpen ? w * .37 : w * .5;
  const cy = h * .5;
  const r = Math.min(w * (panelOpen ? .82 : 1), h) * .3 * EXPLORE_GLOBE.zoom;
  EXPLORE_GLOBE.modalHit = { cx, cy, r };
  drawGlobeShell(ctx, cx, cy, r, EXPLORE_GLOBE.lon, EXPLORE_GLOBE.lat, false, false);
  drawSchoolPins(ctx, schools, EXPLORE_GLOBE.lon, EXPLORE_GLOBE.lat, cx, cy, r, false);
  updateGlobeInfoCard();
  syncGlobePinListSelection();
}
function scheduleModalGlobeRender() {
  if (EXPLORE_GLOBE.renderRaf) return;
  EXPLORE_GLOBE.renderRaf = requestAnimationFrame(() => {
    EXPLORE_GLOBE.renderRaf = null;
    renderModalGlobe();
  });
}
function stopModalInertia() {
  if (EXPLORE_GLOBE.modalRaf) cancelAnimationFrame(EXPLORE_GLOBE.modalRaf);
  EXPLORE_GLOBE.modalRaf = null;
}
function startModalInertia() {
  stopModalInertia();
  const step = () => {
    if (EXPLORE_GLOBE.modalDragging) return;
    EXPLORE_GLOBE.lon = normLon(EXPLORE_GLOBE.lon + EXPLORE_GLOBE.modalVelocityLon);
    EXPLORE_GLOBE.lat = clampGlobeLat(EXPLORE_GLOBE.lat + EXPLORE_GLOBE.modalVelocityLat);
    EXPLORE_GLOBE.modalVelocityLon *= .86;
    EXPLORE_GLOBE.modalVelocityLat *= .84;
    renderModalGlobe();
    if (Math.abs(EXPLORE_GLOBE.modalVelocityLon) > .018 || Math.abs(EXPLORE_GLOBE.modalVelocityLat) > .018) {
      EXPLORE_GLOBE.modalRaf = requestAnimationFrame(step);
    } else {
      EXPLORE_GLOBE.modalRaf = null;
    }
  };
  if (Math.abs(EXPLORE_GLOBE.modalVelocityLon) > .018 || Math.abs(EXPLORE_GLOBE.modalVelocityLat) > .018) {
    EXPLORE_GLOBE.modalRaf = requestAnimationFrame(step);
  }
}
function globePinFromPointer(e) {
  const canvas = document.getElementById('globeModalCanvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (let i = EXPLORE_GLOBE.pins.length - 1; i >= 0; i--) {
    const pin = EXPLORE_GLOBE.pins[i];
    const hitRadius = pin.p.hitRadius || 12;
    if (Math.hypot(pin.p.x - x, pin.p.y - y) <= hitRadius) return pin.s;
  }
  return null;
}
function initModalGlobe() {
  const stage = document.getElementById('globeStage');
  if (!stage) return;
  let lastX = 0, lastY = 0, lastMove = 0;
  stage.addEventListener('pointerdown', e => {
    if (!pointerInsideGlobe(e, EXPLORE_GLOBE.modalHit) && !globePinFromPointer(e)) return;
    if (EXPLORE_GLOBE.focusRaf) cancelAnimationFrame(EXPLORE_GLOBE.focusRaf);
    stopModalInertia();
    EXPLORE_GLOBE.modalDragging = true;
    EXPLORE_GLOBE.modalMoved = false;
    EXPLORE_GLOBE.modalVelocityLon = 0;
    EXPLORE_GLOBE.modalVelocityLat = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = performance.now();
  });
  stage.addEventListener('pointermove', e => {
    if (!EXPLORE_GLOBE.modalDragging) {
      const school = globePinFromPointer(e);
      const nextHover = school ? school.id : null;
      if (EXPLORE_GLOBE.hoveredId !== nextHover) {
        EXPLORE_GLOBE.hoveredId = nextHover;
        stage.style.cursor = school ? 'pointer' : 'grab';
        scheduleModalGlobeRender();
      }
      return;
    }
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dt = Math.max(16, now - lastMove);
    if (Math.abs(dx) + Math.abs(dy) > 4) EXPLORE_GLOBE.modalMoved = true;
    EXPLORE_GLOBE.lon = normLon(EXPLORE_GLOBE.lon - dx * .16);
    EXPLORE_GLOBE.lat = clampGlobeLat(EXPLORE_GLOBE.lat + dy * .08);
    EXPLORE_GLOBE.modalVelocityLon = (-dx * .16) * (16 / dt);
    EXPLORE_GLOBE.modalVelocityLat = (dy * .08) * (16 / dt);
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = now;
    scheduleModalGlobeRender();
  });
  const end = (e, withInertia = true) => {
    if (!EXPLORE_GLOBE.modalDragging) return;
    EXPLORE_GLOBE.modalDragging = false;
    if (!withInertia) {
      EXPLORE_GLOBE.modalVelocityLon = 0;
      EXPLORE_GLOBE.modalVelocityLat = 0;
    }
    startModalInertia();
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', e => end(e, false));
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -.14 : .14;
    setGlobeZoom(direction);
  }, { passive: false });
  stage.addEventListener('click', e => {
    if (EXPLORE_GLOBE.modalMoved) {
      EXPLORE_GLOBE.modalMoved = false;
      return;
    }
    const school = globePinFromPointer(e);
    if (school) focusGlobeOnSchool(school.id);
    else clearGlobeSelection();
  });
  stage.addEventListener('pointerleave', () => {
    if (EXPLORE_GLOBE.modalDragging) end(null, false);
    if (!EXPLORE_GLOBE.hoveredId) return;
    EXPLORE_GLOBE.hoveredId = null;
    stage.style.cursor = 'grab';
    scheduleModalGlobeRender();
  });
  requestAnimationFrame(renderModalGlobe);
}

const SCHOOL_IMAGES = {
  umich: 'College_images/University_Of_Michigan_Card_Image.jpg',
  berkeley: 'College_images/UC_Berkley_Card_Image.jpg',
  ucla: 'College_images/UCLA_Card_Image.jpg',
  stanford: 'College_images/Stanford_Campus_Image.jpg',
  mit: 'College_images/MIT_Campus_Image.png',
  cmu: 'College_images/CMU_Campus_Image.webp',
  cornell: 'College_images/Cornell_Card_Image.jpg',
  upenn: 'College_images/UPenn_Card_Image.avif',
  harvard: 'College_images/Harvard_Card_Image.jpg',
  yale: 'College_images/Yale_Card_Image.jpg',
  columbia: 'College_images/Columbia_Card_Image.webp',
  dartmouth: 'College_images/Dartmouth_Card_Image.jpg',
  brown: 'College_images/Brown_Card_Image.jpg',
  vanderbilt: 'College_images/Vanderbilt_University_Card_Image.jpeg',
  usc: 'College_images/USC_Card_Image.jpg',
  unc: 'College_images/UNC_Card_Image.webp',
  ut: 'College_images/UT_Austin_Card_Image.jpg',
  tulane: 'College_images/Tulane_Card_Image.webp',
  ucsd: 'College_images/UC_San_Diego_Card_Image.jpg',
  ucsb: 'College_images/UC_Santa_Barbara_Card_Image.jpg',
  uci: 'College_images/UC_Irvine_Card_Image.webp',
  ucd: 'College_images/UC_Davis_Card_Image.jpg',
  ucr: 'College_images/UC_Riverside_Card_image.jpg',
  ucsc: 'College_images/UC_Santa_Cruz_Card_Imafe.jpg',
  duke: 'College_images/Duke_Campus_Image.jpg',
  princeton: 'College_images/Princeton_Card_Image.jpg',
  northwestern: 'College_images/Northwestern_Campus_Image.jpg',
  nyu: 'College_images/NYU_Campus_Image.jpeg',
  rice: 'College_images/Rice_Campus_Image.jpg',
  emory: 'College_images/Emory_Campus_Image.jpg',
  georgetown: 'College_images/Georgetown_Campus_Image.jpg',
  jhu: 'College_images/John_Hopkins_Campus_Image.jpg',
  gatech: 'College_images/Georgia_Tech_Campus_Image.png',
  notredame: 'College_images/Notre_Dame_Campus_Image.jpg',
  uchicago: 'College_images/UChicago_Campus_Image.jpg',
  boston_college: 'College_images/Boston_College_Campus_Image.jpg',
  bu: 'College_images/Boston_University_Card_Image.jpg',
  caltech: 'College_images/Caltech_Campus_Image.png',
  tufts: 'College_images/Tufts_Campus_Image.jpeg',
  uva: 'College_images/UVA_Campus_Image.jpeg',
  uf: 'College_images/University_of_Florida_Campus_Image.webp',
  rutgers: 'College_images/Rutgers_Campus_Image.jpg',
  washu: 'College_images/Washington_University_Campus_Image.jpeg',
  uiuc: 'College_images/UIUC_Campus_Image.jpg',
  amherst: 'College_images/Amherst_Campus_Image.jpg',
  bowdoin: 'College_images/Bowdoin_Campus_Image.jpg',
  cu_boulder: 'College_images/CU_Boulder_Campus_Image.jpg',
  ohio_state: 'College_images/OSU_Campus_Image.jpeg',
  uw_madison: 'College_images/UW_Madison_Campus_Image.jpg',
  williams: 'College_images/Williams_College_Campus.jpg',
};

function schoolCard(s) {
  const deadlineDate = compactDeadlineDate(s);
  const d = daysTo(deadlineDate);
  const fav = EX_FAVS.has(s.id);
  const brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#4F7CFF';
  const initials = s.short.replace(/UC\s*/,'UC ').split(' ').map(w=>w[0]).join('').slice(0,3);
  const img = SCHOOL_IMAGES[s.id];
  const bannerClass = img ? 'school-banner has-image' : 'school-banner';
  const bannerStyle = img
    ? `--brand:${s.color}; --brand2:${brand2}; background-image: url('${img}');`
    : `--brand:${s.color}; --brand2:${brand2};`;
  return `<div class="school-card" onclick="renderSchoolDetail('${s.id}')">
    <div class="${bannerClass}" style="${bannerStyle}">
      <div class="seal">${initials}</div>
      <span class="platform">${s.platform}</span>
      <button class="fav ${fav?'active':''}" onclick="event.stopPropagation(); toggleFav('${s.id}'); renderSchoolGrid();" title="${fav ? 'Remove from applications' : 'Add to applications'}" aria-label="${fav ? 'Remove from applications' : 'Add to applications'}">
        <svg class="icon icon-sm" viewBox="0 0 24 24" style="${fav?'fill:currentColor;':''}"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>
    <div class="school-body">
      <div class="sb-name">${s.name}</div>
      <div class="sb-state">${s.location ? s.location + ', ' : ''}${s.state} · ${s.type.join(' · ')}</div>
      <div class="school-stats">
        <div class="ss"><div class="ss-v">${formatAcceptance(s)}</div><div class="ss-l">Accept</div></div>
        <div class="ss"><div class="ss-v">${formatGpa(s)}</div><div class="ss-l">Avg GPA</div></div>
        <div class="ss"><div class="ss-v">$${(s.tuition.out/1000).toFixed(0)}k</div><div class="ss-l">Tuition</div></div>
      </div>
      <div class="sb-foot">
        <div class="sb-dl">${compactDeadlineType(s)} · <b>${d>0?d+'d':'Closed'}</b></div>
        ${s.cc ? `<span class="tag primary">TAG</span>` : ''}
        ${s.waiver ? `<span class="tag">Waiver</span>` : ''}
      </div>
    </div>
  </div>`;
}

function toggleFav(id) {
  if (!CURRENT_USER) {
    showAuthModal(false);
    toast('Sign in to save schools to your applications.');
    return;
  }
  const s = byId(id);
  const idx = USER_APPS.findIndex(a => a.id === id);
  if (idx >= 0) {
    if (!confirm(`Remove ${s?.short || 'this school'} from your applications?`)) return;
    USER_APPS.splice(idx, 1);
    EX_FAVS.delete(id);
    saveUserApps();
    toast(`${s?.short || 'School'} removed from applications.`);
  } else {
    addSchoolToList(id, { open: false });
    toast(`${s?.short || 'School'} added to applications.`);
  }
  renderKanban();
  renderAppList();
  renderAppStats();
  renderTimeline();
}

function renderSchoolGrid() {
  const filtered = sortSchools(applyFilters());
  const count = filtered.length;
  document.getElementById('exCount').textContent = `Showing ${count} school${count===1?'':'s'}`;
  const activeTab = EX_TABS.find(t => t.id === EX_ACTIVE_TAB);
  const tabNote = document.getElementById('exTabNote');
  if (tabNote) {
    tabNote.hidden = !activeTab?.note;
    tabNote.textContent = activeTab?.note || '';
  }
  renderExploreGlobePreview();
  const grid = document.getElementById('schoolGrid');
  const table = document.getElementById('schoolTable');
  const empty = document.getElementById('schoolEmpty');

  // Loading skeleton
  if (SCHOOLS_LOADING) {
    if (empty) empty.style.display = 'none';
    table.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = Array(8).fill(0).map(() => `
      <div class="school-card school-card-skeleton" aria-hidden="true">
        <div class="sk-line sk-name"></div>
        <div class="sk-line sk-sub"></div>
        <div class="sk-line sk-stat"></div>
        <div class="sk-line sk-stat sk-short"></div>
      </div>`).join('');
    return;
  }

  // Empty state
  if (count === 0) {
    grid.innerHTML = '';
    table.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    grid.style.display = 'none';
    table.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.style.display  = EX_VIEW === 'grid'  ? 'grid'  : 'none';
  table.style.display = EX_VIEW === 'table' ? 'block' : 'none';

  grid.innerHTML = filtered.map(schoolCard).join('');

  // table view
  table.innerHTML = `<table class="school-table">
    <thead><tr>
      <th>School</th><th>State</th><th>Region</th><th>Accept</th><th>Avg GPA</th><th>Min GPA</th><th>Deadline</th><th>Platform</th><th></th>
    </tr></thead>
    <tbody>
    ${filtered.map(s => {
      const deadlineDate = compactDeadlineDate(s);
      const d = daysTo(deadlineDate);
      return `<tr onclick="renderSchoolDetail('${s.id}')">
        <td><b>${s.name}</b></td>
        <td>${s.state}</td>
        <td><span class="tag">${regionFor(s.state)}</span></td>
        <td class="mono">${formatAcceptance(s)}</td>
        <td class="mono">${formatGpa(s)}</td>
        <td class="mono">${formatMinGpa(s)}</td>
        <td class="mono">${compactDeadlineType(s)} · ${d>0?d+'d':'—'}</td>
        <td>${s.platform}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); toggleFav('${s.id}'); renderSchoolGrid();">${EX_FAVS.has(s.id)?'In applications':'Add'}</button></td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}

/* =============== applications kanban =============== */
const KANBAN_COLS = ['Researching', 'Applying', 'Submitted', 'Decision Received'];

const MATERIAL_LABELS = [
  ['transcriptReq', 'Transcript requested'],
  ['transcriptSent', 'Transcript sent'],
  ['essay1', 'Essay 1 drafted'],
  ['essay2', 'Essay 2 drafted'],
  ['lor1', 'LOR 1 secured'],
  ['lor2', 'LOR 2 secured'],
  ['feePaid', 'Application fee paid'],
  ['submitted', 'Application submitted'],
];

function computeProgress(app) {
  const vals = Object.values(app.materials || {});
  if (!vals.length) return app.progress || 0;
  const done = vals.filter(Boolean).length;
  return Math.round((done / MATERIAL_LABELS.length) * 100);
}

function renderKanban() {
  const kb = document.getElementById('kanban');
  if (!kb) return;
  const appsWithSchools = USER_APPS
    .map(a => ({ app: a, school: byId(a.id), days: byId(a.id) ? schoolDeadlineDays(byId(a.id)) : 9999 }))
    .filter(x => x.school);
  if (appsWithSchools.length === 0) {
    kb.innerHTML = `<div class="apps-onboard">
      <div class="apps-onboard-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="5" width="26" height="37" rx="4"/><path d="M14 16h14M14 23h14M14 30h9" stroke-linecap="round"/><circle cx="36" cy="36" r="9" fill="var(--accent-primary)" stroke="none"/><path d="M32 36l3 3 5-5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3>Track your first application</h3>
      <p>Add schools you are considering. TransferSpace watches deadlines, materials, and progress so nothing slips.</p>
      <div class="apps-onboard-actions">
        <button class="btn btn-primary" onclick="goto('schools')"><svg class="control-icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Browse schools</button>
        <button class="btn btn-ghost btn-sm" onclick="openCmdK()">Search by name</button>
      </div>
    </div>`;
    renderAppStats();
    return;
  }
  const liveApps = appsWithSchools
    .filter(x => hasUpcomingSchoolDeadline(x.school) || x.app.status === 'Submitted' || x.app.status === 'Decision Received')
    .sort((a, b) => {
      const aDone = a.app.status === 'Submitted' || a.app.status === 'Decision Received';
      const bDone = b.app.status === 'Submitted' || b.app.status === 'Decision Received';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.days - b.days;
    });
  const activeLive = liveApps.filter(x => x.app.status !== 'Submitted' && x.app.status !== 'Decision Received');
  const focus = activeLive.slice(0, 5);
  const materialSummary = MATERIAL_LABELS.filter(([key]) => key !== 'transcriptReq').map(([key, label]) => {
    const missing = activeLive.filter(x => !x.app.materials?.[key]).length;
    return { key, label, missing };
  }).filter(x => x.missing > 0).slice(0, 5);
  const maxStage = Math.max(1, ...KANBAN_COLS.map(col => appsWithSchools.filter(x => x.app.status === col).length));
  const pipelineHtml = KANBAN_COLS.map(col => {
    const count = appsWithSchools.filter(x => x.app.status === col).length;
    const width = Math.max(7, Math.round(count / maxStage * 100));
    return `<div class="pipeline-row" data-col="${col}" ondragover="event.preventDefault(); this.classList.add('drop');" ondragleave="this.classList.remove('drop');" ondrop="onDrop(event, '${col}')">
      <div class="pipeline-label">${col}</div>
      <div class="pipeline-count">${count}</div>
      <div class="pipeline-meter"><span style="width:${width}%"></span></div>
    </div>`;
  }).join('');
  const datesHtml = activeLive.slice(0, 4).map(x => `
    <div class="date-row" onclick="openAppModal('${x.school.id}')">
      <div class="date-label">${x.school.short}</div>
      <div class="date-count">${deadlinePhrase(compactDeadlineDate(x.school))}</div>
    </div>`).join('') || '<div class="date-row"><div class="date-label">No live deadlines</div><div class="date-count">Clear</div></div>';
  const hiddenCount = Math.max(0, appsWithSchools.length - focus.length);
  kb.innerHTML = `<div class="apps-workspace">
    <section class="apps-focus-panel">
      <div class="apps-panel-head">
        <div>
          <h3>Focus queue</h3>
          <p>Schools with live deadlines, sorted by urgency. Open a row to manage materials and notes.</p>
        </div>
        <span class="apps-live-count">${activeLive.length} live</span>
      </div>
      <div class="apps-focus-list">
        ${focus.length ? focus.map(x => {
          const a = x.app, s = x.school, p = computeProgress(a);
          const img = SCHOOL_IMAGES[s.id];
          const brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#3B67D8';
          const initials = s.short.replace(/UC\\s*/,'UC ').split(' ').map(w => w[0]).join('').slice(0,3);
          const materials = MATERIAL_LABELS.filter(([key]) => key !== 'transcriptReq').map(([key, label]) => {
            const done = !!a.materials?.[key];
            const short = label.replace('Application ', '').replace(' requested', '').replace(' drafted', '').replace(' secured', '').replace(' paid', '').replace(' sent', '');
            return `<span class="material-pill ${done ? 'done' : 'missing'}">${short}</span>`;
          }).join('');
          return `<div class="apps-focus-card" draggable="true" ondragstart="onDragStart(event, '${s.id}')" ondragend="onDragEnd(event)" onclick="openAppModal('${s.id}')">
            <div class="apps-school-photo ${img ? '' : 'no-image'}" style="--brand:${s.color};--brand2:${brand2};${img ? `background-image:url('${img}');` : ''}">${img ? '' : initials}</div>
            <div class="apps-focus-main">
              <div class="apps-school-line"><strong>${s.name}</strong><span class="kc-label ${a.label.toLowerCase()}">${a.label}</span></div>
              <div class="apps-meta-line">${a.status} · ${s.platform} · ${compactDeadlineType(s)}</div>
              <div class="apps-materials">${materials}</div>
            </div>
            <div class="apps-focus-deadline">
              <div class="deadline-chip"><strong>${deadlinePhrase(compactDeadlineDate(s))}</strong><span>${fmtDate(compactDeadlineDate(s))}</span></div>
              <div class="apps-progress-wrap">
                <div class="apps-progress-label"><span>Progress</span><span>${p}%</span></div>
                <div class="apps-progress-track"><span style="width:${p}%"></span></div>
              </div>
            </div>
          </div>`;
        }).join('') : '<div class="empty-state" style="padding:1.5rem;"><p>No live applications. Add schools from Schools to start planning.</p></div>'}
      </div>
      ${hiddenCount > 0 ? `<div class="apps-focus-footer"><span>${hiddenCount} more school${hiddenCount === 1 ? '' : 's'} tracked</span><button class="btn-link" onclick="goto('timeline')">View all in Timeline</button></div>` : ''}
    </section>
    <aside class="apps-side-panel">
      <div class="apps-module">
        <h4>Pipeline</h4>
        ${pipelineHtml}
      </div>
      <div class="apps-module">
        <h4>Material gaps</h4>
        ${materialSummary.length ? materialSummary.map(x => `<div class="material-row"><div class="material-label">${x.label}</div><div class="material-count">${x.missing}</div></div>`).join('') : '<div class="material-row"><div class="material-label">Everything current</div><div class="material-count">0</div></div>'}
      </div>
      <div class="apps-module">
        <h4>Upcoming dates</h4>
        ${datesHtml}
      </div>
    </aside>
  </div>`;
  renderAppStats();
  // Apply decision styling
  if (typeof patchKanbanCards === 'function') patchKanbanCards();
}

function renderAppStats() {
  const active = USER_APPS.filter(a => {
    const s = byId(a.id);
    return s && hasUpcomingSchoolDeadline(s) && a.status !== 'Submitted' && a.status !== 'Decision Received';
  }).length;
  const submitted = USER_APPS.filter(a => a.status === 'Submitted').length;
  const pending = USER_APPS.reduce((n, a) => {
    const s = byId(a.id);
    if (!s || !hasUpcomingSchoolDeadline(s) || a.status === 'Submitted' || a.status === 'Decision Received') return n;
    return n + MATERIAL_LABELS.length - Object.values(a.materials||{}).filter(Boolean).length;
  }, 0);
  const weekCount = USER_APPS.filter(a => {
    const s = byId(a.id);
    return s && a.status !== 'Submitted' && schoolDeadlineDays(s) <= 7 && hasUpcomingSchoolDeadline(s);
  }).length;
  const set = (id, v) => document.getElementById(id).innerHTML = `<em>${v}</em>`;
  set('statTotal', active);
  set('statSubmitted', submitted);
  set('statPending', pending);
  set('statWeek', weekCount);
}

let DRAG_ID = null;
function onDragStart(e, id) {
  DRAG_ID = id;
  e.currentTarget.classList.add('dragging');
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch(_){}
}
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.kcol').forEach(k => k.classList.remove('drop'));
  document.querySelectorAll('.pipeline-row').forEach(k => k.classList.remove('drop'));
}
function onDrop(e, col) {
  e.preventDefault();
  if (!DRAG_ID) return;
  const app = USER_APPS.find(a => a.id === DRAG_ID);
  if (!app) return;
  if (app.status !== col) {
    app.status = col;
    if (col === 'Submitted') { app.progress = 100; Object.keys(app.materials).forEach(k => app.materials[k] = true); }
    saveUserApps();
    toast(`${byId(app.id).short} moved to ${col}.`);
  }
  DRAG_ID = null;
  renderKanban();
  renderAppList();
}

/* =============== remove app =============== */
function removeApp(id) {
  const s = byId(id);
  const name = s ? s.short : id;
  const idx = USER_APPS.findIndex(a => a.id === id);
  if (idx < 0) return;
  const snapshot = JSON.parse(JSON.stringify(USER_APPS[idx]));
  const wasFav = EX_FAVS.has(id);
  USER_APPS.splice(idx, 1);
  EX_FAVS.delete(id);
  saveUserApps();
  renderKanban();
  renderAppList();
  renderAppStats();
  toastUndo(`${name} removed.`, () => {
    USER_APPS.splice(idx, 0, snapshot);
    if (wasFav) EX_FAVS.add(id);
    saveUserApps();
    renderKanban();
    renderAppList();
    renderAppStats();
  });
}

/* =============== app view toggle =============== */
let APP_VIEW = 'board';

function setAppView(mode) {
  APP_VIEW = mode;
  const kb = document.getElementById('kanban');
  const list = document.getElementById('appList');
  const toggle = document.getElementById('appViewToggle');
  if (!kb || !list || !toggle) return;

  toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  if (mode === 'list') {
    toggle.children[1].classList.add('active');
    kb.classList.add('hidden');
    list.classList.add('active');
    renderAppList();
  } else {
    toggle.children[0].classList.add('active');
    kb.classList.remove('hidden');
    list.classList.remove('active');
    renderKanban();
  }
}

function renderAppList() {
  const container = document.getElementById('appList');
  if (!container) return;

  const sorted = [...USER_APPS].sort((a, b) => {
    const sa = byId(a.id), sb2 = byId(b.id);
    if (!sa || !sb2) return 0;
    const da = daysTo(sa.deadline), db = daysTo(sb2.deadline);
    const aOpen = da > 0, bOpen = db > 0;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return da - db;
  });

  if (sorted.length === 0) {
    container.innerHTML = '<div style="padding:3rem; text-align:center; color:var(--text-muted);">No applications yet. <a href="#" onclick="goto(\'schools\'); return false;">Open Schools</a> to get started.</div>';
    return;
  }

  var html = '<div class="app-list-header"><span>School</span><span>Status</span><span>Label</span><span>Deadline</span><span>Progress</span><span></span></div>';
  sorted.forEach(function(a) {
    var s = byId(a.id);
    if (!s) return;
    var d = daysTo(s.deadline);
    var p = computeProgress(a);
    var img = SCHOOL_IMAGES[s.id];
    var brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#4F7CFF';
    var initials = s.short.replace(/UC\s*/, 'UC ').split(' ').map(function(w){return w[0];}).join('').slice(0,3);
    var thumbStyle = img
      ? "background-image:url('" + img + "'); --brand:" + s.color + "; --brand2:" + brand2 + ";"
      : "--brand:" + s.color + "; --brand2:" + brand2 + ";";
    var statusClass = a.status.toLowerCase().replace(/\s+/g, '-');
    html += '<div class="app-list-row" onclick="openAppModal(\'' + a.id + '\')">'
      + '<div class="alr-school">'
      + '<div class="alr-thumb" style="' + thumbStyle + '">' + (img ? '' : initials) + '</div>'
      + '<div class="alr-info"><div class="alr-name">' + s.short + '</div>'
      + '<div class="alr-loc">' + s.state + ' · ' + s.platform + '</div></div></div>'
      + '<div><span class="alr-status ' + statusClass + '">' + a.status + '</span></div>'
      + '<div class="alr-label ' + a.label.toLowerCase() + '">' + a.label + '</div>'
      + '<div class="alr-deadline"><div class="alr-days' + (d <= 7 ? ' urgent' : '') + '">' + (d >= 0 ? d + 'd' : 'Past') + '</div>'
      + '<div class="alr-date">' + fmtDate(s.deadline) + '</div></div>'
      + '<div class="alr-progress"><div class="alr-bar"><span style="width:' + p + '%"></span></div>' + p + '%</div>'
      + '<button class="alr-remove" onclick="event.stopPropagation(); removeApp(\'' + a.id + '\')" title="Remove">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button></div>';
  });
  container.innerHTML = html;
}

/* =============== app detail modal =============== */
/* =============== school detail (info) modal =============== */

function renderSchoolDetail(id) {
  const s = byId(id);
  if (!s) return;
  const deadlineDate = compactDeadlineDate(s);
  const d = daysTo(deadlineDate);
  const img = SCHOOL_IMAGES[s.id];
  const brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#4F7CFF';
  const initials = s.short.replace(/UC\s*/,'UC ').split(' ').map(w=>w[0]).join('').slice(0,3);
  const heroStyle = img
    ? `--brand:${s.color}; --brand2:${brand2}; background-image:url('${img}');`
    : `--brand:${s.color}; --brand2:${brand2};`;
  const onList = USER_APPS.some(a => a.id === s.id);
  const fav = EX_FAVS.has(s.id);
  const termDeadlineRows = (s.termDeadlines || []).map(item => `
    <div class="sd-row"><span>${item.term} closing date${item.sourceType === 'secondary' ? ' estimate' : ''}</span><b class="mono">${item.closing}</b></div>
  `).join('');
  const notificationRows = (s.termDeadlines || []).filter(item => item.notification).map(item => `
    <div class="sd-row"><span>${item.term} notification</span><b class="mono">${item.notification}</b></div>
  `).join('');
  const deadlineSource = (s.termDeadlines || []).find(item => item.source)?.source || '';
  const hasSecondaryDeadline = (s.termDeadlines || []).some(item => item.sourceType === 'secondary');
  const fallbackGpaSourceType = s.gpaIsFallback ? s.gpaSourceType : s.minGpaSourceType;
  const gpaSourceDescription = (s.gpaIsFallback || s.minGpaIsFallback)
    ? (fallbackGpaSourceType === 'official'
      ? 'A GPA field comes from official college guidance because the CDS row did not publish it.'
      : `A GPA field is an estimate from ${fallbackGpaSourceType === 'reddit' ? 'Reddit/student-reported context' : 'a secondary source'} after CDS and official college pages did not publish it.`)
    : '';

  const box = document.getElementById('appModalBox');
  box.className = 'modal';
  box.innerHTML = `
    <div class="modal-hero ${img?'':'no-image'}" style="${heroStyle}" data-initials="${initials}">
      <button class="mh-close" onclick="closeAppModal()" title="Close"><svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="mh-overlay">
        <span class="tag">${regionFor(s.state)}</span>
        <h3 style="margin-top:.45rem;">${s.name}</h3>
        <div class="mh-sub">${s.location ? s.location + ', ' : ''}${s.state} · ${s.type.join(' · ')} — <b style="color:#fff;">${s.platform}</b></div>
      </div>
    </div>
    <div class="modal-body">
      <!-- top stat strip — uses real undergrad count from Supabase when available -->
      <div class="sd-stats">
        <div class="sd-stat"><div class="sd-v">${formatAcceptance(s)}</div><div class="sd-l">Transfer accept</div></div>
        <div class="sd-stat"><div class="sd-v">${formatGpa(s)}</div><div class="sd-l">Avg transfer GPA</div></div>
        <div class="sd-stat"><div class="sd-v">${formatMinGpa(s)}</div><div class="sd-l">Min GPA</div></div>
        <div class="sd-stat"><div class="sd-v">${formatMinCredits(s)}</div><div class="sd-l">Min credits</div></div>
        <div class="sd-stat"><div class="sd-v">${s.undergrad ? (s.undergrad/1000).toFixed(1)+'k' : '—'}</div><div class="sd-l">Undergrads</div></div>
      </div>

      <div class="sd-grid">
        <div>
          <div class="eyebrow" style="margin-bottom:.5rem;">Tuition &amp; fees</div>
          <div class="sd-block">
            <div class="sd-row"><span>In-state</span><b class="mono">$${s.tuition.in.toLocaleString()}/yr</b></div>
            <div class="sd-row"><span>Out-of-state</span><b class="mono">$${s.tuition.out.toLocaleString()}/yr</b></div>
            <div class="sd-row"><span>Application fee</span><b class="mono">${formatFee(s)}${s.waiver ? ' · waiver ✓' : ''}</b></div>
            <div class="sd-row"><span>Aid</span><span style="font-size:.85rem; color:var(--text-secondary); text-align:right; max-width:180px;">${s.aid}</span></div>
          </div>

          <div class="eyebrow" style="margin:1.2rem 0 .5rem;">Deadline</div>
          <div class="sd-block">
            <div class="sd-row"><span>${compactDeadlineType(s)}</span><b class="mono" style="color:${d<=14?'var(--accent-warm)':'var(--text-primary)'};">${d > 0 ? d + ' days · ' + fmtDate(deadlineDate) : fmtDate(deadlineDate)}</b></div>
            ${termDeadlineRows}
            <div class="sd-row"><span>Platform</span><b>${s.platform}</b></div>
          </div>

          ${(s.maxCredits || s.residencyCredits || s.minCredits || s.minCreditsDisplay || s.lowestTransferGrade) ? `
          <div class="eyebrow" style="margin:1.2rem 0 .5rem;">Transfer credits</div>
          <div class="sd-block">
            ${s.maxCredits ? `<div class="sd-row"><span>Max credits accepted</span><b class="mono">${s.maxCredits}</b></div>` : ''}
            ${s.residencyCredits ? `<div class="sd-row"><span>Residency credits required</span><b class="mono">${s.residencyCredits}</b></div>` : ''}
            ${(s.minCredits || s.minCreditsDisplay) ? `<div class="sd-row"><span>${s.minCreditsSource || 'Minimum credits to apply'}</span><b class="mono">${formatMinCredits(s)}</b></div>` : ''}
            ${s.lowestTransferGrade ? `<div class="sd-row"><span>Lowest transferable grade</span><b class="mono">${s.lowestTransferGrade}</b></div>` : ''}
          </div>` : ''}
        </div>

        <div>
          <div class="eyebrow" style="margin-bottom:.5rem;">Published transfer policy</div>
          <div class="sd-block">
            <div class="sd-row"><span>Terms offered</span><b class="mono">${s.transferTerms.length ? s.transferTerms.join(', ') : 'See source'}</b></div>
            <div class="sd-row"><span>${gpaLabel(s)}</span><b class="mono">${formatGpa(s)}</b></div>
            <div class="sd-row"><span>${s.minGpaSource || 'Minimum GPA'}</span><b class="mono">${formatMinGpa(s)}</b></div>
            ${notificationRows}
          </div>

          <div class="eyebrow" style="margin:1.2rem 0 .5rem;">Sources</div>
          <p class="sd-notes">${s.sourceLabel}. ${hasSecondaryDeadline ? 'One or more deadline rows are secondary estimates because no CDS/official transfer-page date was available. ' : ''}${gpaSourceDescription ? `${gpaSourceDescription} ` : ''}</p>
          <div class="row gap-1" style="flex-wrap:wrap;">
            ${s.transferInfoLink ? `<a class="btn btn-ghost btn-sm" href="${s.transferInfoLink}" target="_blank" rel="noopener">Transfer source ↗</a>` : ''}
            ${deadlineSource ? `<a class="btn btn-ghost btn-sm" href="${deadlineSource}" target="_blank" rel="noopener">Deadline source ↗</a>` : ''}
            ${s.gpaSourceLink ? `<a class="btn btn-ghost btn-sm" href="${s.gpaSourceLink}" target="_blank" rel="noopener">GPA source ↗</a>` : ''}
            ${s.minGpaSourceLink && s.minGpaSourceLink !== s.gpaSourceLink ? `<a class="btn btn-ghost btn-sm" href="${s.minGpaSourceLink}" target="_blank" rel="noopener">Min GPA source ↗</a>` : ''}
            ${s.minCreditsSourceLink ? `<a class="btn btn-ghost btn-sm" href="${s.minCreditsSourceLink}" target="_blank" rel="noopener">Credit source ↗</a>` : ''}
            ${s.schoolUrl ? `<a class="btn btn-ghost btn-sm" href="${s.schoolUrl}" target="_blank" rel="noopener">School site ↗</a>` : ''}
          </div>

          <div class="eyebrow" style="margin:1.2rem 0 .5rem;">Popular majors</div>
          <div class="chip-row">${s.majors.map(m => `<span class="chip active" style="cursor:default;">${m}</span>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost btn-sm" onclick="toggleFav('${s.id}'); renderSchoolDetail('${s.id}'); renderSchoolGrid();">
        ${fav ? 'In applications' : 'Add to applications'}
      </button>
      <div class="row gap-1">
        ${s.schoolUrl ? `<a class="btn btn-ghost btn-sm" href="${s.schoolUrl}" target="_blank" rel="noopener">School site ↗</a>` : ''}
        ${s.applyLink ? `<a class="btn btn-ghost btn-sm" href="${s.applyLink}" target="_blank" rel="noopener">Apply ↗</a>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="closeAppModal()">Close</button>
        ${onList
          ? `<button class="btn btn-primary btn-sm" onclick="openAppModal('${s.id}')">Open tracking view →</button>`
          : `<button class="btn btn-primary btn-sm" onclick="addSchoolToList('${s.id}')">Add to My List</button>`
        }
      </div>
    </div>
  `;
  document.getElementById('appModal').classList.add('active');
}

function addSchoolToList(id, options = {}) {
  if (!CURRENT_USER) {
    showAuthModal(false);
    toast('Sign in to start tracking applications.');
    return;
  }
  const shouldOpen = options.open !== false;
  if (USER_APPS.some(a => a.id === id)) { openAppModal(id); return; }
  const s = byId(id);
  const accept = s.accept;
  const label = typeof accept === 'number' ? (accept < 15 ? 'Reach' : accept < 40 ? 'Match' : 'Safety') : 'Research';
  const newApp = {
    id,
    status: 'Researching',
    label,
    progress: 5,
    materials: {}
  };
  USER_APPS.push(newApp);
  EX_FAVS.add(id);
  saveUserApps();
  toast(`${s.short} added to your list · Researching.`);
  // Re-render everything that depends on USER_APPS
  renderKanban();
  renderAppList();
  renderTimeline();
  renderSchoolGrid();
  // Swap from detail modal to tracking modal
  if (shouldOpen) openAppModal(id);
}

function openAppModal(id) {
  const app = USER_APPS.find(a => a.id === id);
  if (!app) return;
  const s = byId(id);
  const deadlineDate = compactDeadlineDate(s);
  const d = daysTo(deadlineDate);
  const p = computeProgress(app);
  const materials = MATERIAL_LABELS.map(([k, lbl]) => {
    const done = !!app.materials?.[k];
    return `<label class="check-row ${done?'done':''}">
      <input type="checkbox" ${done?'checked':''} onchange="toggleMaterial('${id}','${k}',this.checked)"/>
      <span style="flex:1">${lbl}</span>
    </label>`;
  }).join('');
  const img = SCHOOL_IMAGES[s.id];
  const brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#4F7CFF';
  const initials = s.short.replace(/UC\s*/,'UC ').split(' ').map(w=>w[0]).join('').slice(0,3);
  const heroStyle = img
    ? `--brand:${s.color}; --brand2:${brand2}; background-image:url('${img}');`
    : `--brand:${s.color}; --brand2:${brand2};`;
  const stageButtons = KANBAN_COLS.map((stage) => {
    const active = app.status === stage;
    return `<button type="button" class="app-stage-step ${active ? 'active' : ''}" onclick="setAppStage('${id}','${stage}')" aria-pressed="${active}">
      ${stage}
    </button>`;
  }).join('');
  const box = document.getElementById('appModalBox');
  box.className = 'modal app-track-modal';
  box.innerHTML = `
    <div class="modal-hero ${img?'':'no-image'}" style="${heroStyle}" data-initials="${initials}">
      <button class="mh-close" onclick="closeAppModal()" title="Close"><svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="mh-overlay">
        <span class="tag">${app.label}</span>
        <h3 style="margin-top:.45rem;">${s.name}</h3>
        <div class="mh-sub">${s.state} · ${s.platform} · ${compactDeadlineType(s)} — <b style="color:${d<=14?'var(--accent-warm)':'#fff'};">${d > 0 ? d + ' days' : fmtDate(deadlineDate)}</b></div>
      </div>
    </div>
    <div class="app-track-body">
      <section class="app-track-panel">
        <div class="app-track-panel-head">
          <div>
            <div class="eyebrow">Materials</div>
            <div class="text-muted" style="font-size:.82rem;">${p}% complete</div>
          </div>
        </div>
        <div class="app-track-progress"><span style="width:${p}%"></span></div>
        <div class="check-list big">${materials}</div>
      </section>
      <section class="app-track-panel">
        <div class="app-track-panel-head"><div class="eyebrow">Details</div></div>
        <div class="app-track-details">
          <div class="app-track-detail"><span>${gpaLabel(s)}</span><strong class="mono">${formatGpa(s)}</strong></div>
          <div class="app-track-detail"><span>${s.minGpaSource || 'Minimum GPA'}</span><strong class="mono">${formatMinGpa(s)}</strong></div>
          <div class="app-track-detail"><span>Acceptance</span><strong class="mono">${formatAcceptance(s)}</strong></div>
          <div class="app-track-detail"><span>Out-of-state tuition</span><strong class="mono">$${s.tuition.out.toLocaleString()}</strong></div>
          <div class="app-track-detail"><span>Application fee</span><strong class="mono">${formatFee(s)}${s.waiver?' · waiver ✓':''}</strong></div>
          <div class="app-track-detail app-stage-detail">
            <span class="app-stage-label">Stage</span>
            <div class="app-stage-control" role="group" aria-label="Application stage">
              ${stageButtons}
            </div>
          </div>
        </div>
        <div class="app-track-scratch">
          <div class="eyebrow" style="margin-bottom:.45rem;">Strategy Scratchpad</div>
          <textarea class="scratchpad" id="scratchpad_${id}" oninput="saveScratchpad('${id}')" placeholder="Reddit intel, faculty names, scholarship leads, prereq notes…"></textarea>
        </div>
      </section>
      </div>
    <div class="modal-foot">
      <a class="btn btn-ghost btn-sm" href="${s.applyLink || s.schoolUrl || '#'}" target="_blank" rel="noopener">Open portal ↗</a>
      <div class="row gap-1">
        ${app.status === 'Submitted' ? `<button class="btn btn-success btn-sm" onclick="openDecisionForm('${id}')">Decision received</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="closeAppModal()">Close</button>
      </div>
    </div>
  `;
  document.getElementById('appModal').classList.add('active');
  // Load scratchpad content
  if (CURRENT_USER) loadScratchpad(id);
}
function closeAppModal() { document.getElementById('appModal').classList.remove('active'); }

function setAppStage(id, stage) {
  const app = USER_APPS.find(a => a.id === id);
  if (!app || !KANBAN_COLS.includes(stage)) return;
  if (app.status === stage) return;
  app.status = stage;
  if (stage === 'Submitted') {
    app.materials = app.materials || {};
    Object.keys(app.materials).forEach(k => app.materials[k] = true);
    app.progress = 100;
  } else {
    app.progress = computeProgress(app);
  }
  saveUserApps();
  renderKanban();
  renderAppList();
  openAppModal(id);
  toast(`${byId(id).short} stage set to ${stage}`);
}

function toggleMaterial(id, key, val) {
  const app = USER_APPS.find(a => a.id === id);
  if (!app) return;
  app.materials = app.materials || {};
  app.materials[key] = val;
  app.progress = computeProgress(app);
  saveUserApps();
  openAppModal(id);
  renderKanban();
  renderAppList();
}
function advanceStage(id) {
  const app = USER_APPS.find(a => a.id === id);
  if (!app) return;
  const i = KANBAN_COLS.indexOf(app.status);
  if (i < KANBAN_COLS.length - 1) {
    setAppStage(id, KANBAN_COLS[i + 1]);
  }
}

/* =============== essay editor (legacy ESSAYS object removed — now Supabase-backed) =============== */

/* =============== documents filtering + view =============== */
let DOCS_CAT = 'all';
let DOCS_VIEW = 'grid';

function countDocs(cat) {
  if (cat === 'essays') return DB_ESSAYS.length;
  if (cat === 'lors') return DB_LORS.length;
  if (cat === 'transcripts') return DB_DOCUMENTS.filter(d => d.category === 'transcripts').length;
  if (cat === 'activities') return DB_DOCUMENTS.filter(d => d.category === 'activities').length;
  if (cat === 'all') return DB_ESSAYS.length + DB_LORS.length + DB_DOCUMENTS.length;
  return document.querySelectorAll(`[data-doc-cat="${cat}"]`).length;
}
function refreshDocsCounts() {
  document.querySelectorAll('.doc-cat-item [data-count]').forEach(el => {
    el.textContent = countDocs(el.dataset.count);
  });
}
function filterDocuments(cat) {
  DOCS_CAT = cat;
  document.querySelectorAll('.doc-cat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  const sections = document.querySelectorAll('[data-docs-section]');
  let visibleCount = 0;
  sections.forEach(sec => {
    const match = cat === 'all' || sec.dataset.docsSection === cat;
    sec.classList.toggle('hidden', !match);
    if (match) visibleCount += sec.querySelectorAll('[data-doc-cat]').length;
  });
  const empty = document.getElementById('docsEmpty');
  if (empty) empty.style.display = visibleCount === 0 ? 'flex' : 'none';
  refreshDocsCounts();
}
function setDocsView(mode) {
  DOCS_VIEW = mode;
  document.querySelectorAll('#docsViewToggle button').forEach((b,i) => {
    b.classList.toggle('active', (i===0 && mode==='grid') || (i===1 && mode==='list'));
  });
  document.getElementById('page-documents').classList.toggle('docs-list-mode', mode === 'list');
}

function closeEssayEditor() {
  CURRENT_ESSAY_ID = null;
  if (AUTOSAVE_TIMER) clearTimeout(AUTOSAVE_TIMER);
  document.getElementById('essayModal').classList.remove('active');
  renderDocumentsPage(); // refresh cards to show latest changes
}

/* =============== timeline =============== */
let CUSTOM_TASKS = [];
let TL_CURRENT_VIEW = 'timeline'; // 'timeline' or 'list'
let TL_FILTER = 'active'; // 'all', 'active', 'submitted', 'overdue'
let TL_SORT = 'deadline'; // 'deadline', 'name', 'progress'
let TL_NOTES = {}; // schoolId -> note string

const MATERIAL_CHECKLIST = [
  ['transcriptReq', 'transcriptSent', 'Request & send transcript'],
  ['essay1', null, 'Complete essay 1'],
  ['essay2', null, 'Complete essay 2'],
  ['lor1', null, 'Secure letter of recommendation 1'],
  ['lor2', null, 'Secure letter of recommendation 2'],
  ['feePaid', null, 'Pay application fee'],
  ['submitted', null, 'Submit application'],
];

function computeProgress(app) {
  if (!app.materials) return app.progress || 0;
  var m = app.materials;
  var total = 0, done = 0;
  MATERIAL_CHECKLIST.forEach(function(item) {
    total++;
    var key = item[1] || item[0];
    if (m[key]) done++;
  });
  return total > 0 ? Math.round(done / total * 100) : app.progress || 0;
}

function setTlFilter(f) {
  TL_FILTER = f;
  document.querySelectorAll('.tl-filter-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.filter === f);
  });
  renderTimeline();
}

function toggleTlSort() {
  var orders = ['deadline', 'name', 'progress'];
  var idx = orders.indexOf(TL_SORT);
  TL_SORT = orders[(idx + 1) % orders.length];
  var label = document.getElementById('tlSortLabel');
  if (label) label.textContent = TL_SORT.charAt(0).toUpperCase() + TL_SORT.slice(1);
  renderTimeline();
}

function getTlSearchQuery() {
  var el = document.getElementById('tlSearch');
  return el ? el.value.toLowerCase().trim() : '';
}

function filterApps() {
  var q = getTlSearchQuery();
  return USER_APPS.filter(function(a) {
    var s = byId(a.id);
    if (!s) return false;
    // Search filter
    if (q && s.name.toLowerCase().indexOf(q) < 0 && s.short.toLowerCase().indexOf(q) < 0) return false;
    // Status filter
    var d = daysTo(s.deadline);
    if (TL_FILTER === 'active') return isUpcomingDeadline(s.deadline) && a.status !== 'Submitted' && a.status !== 'Decision Received';
    if (TL_FILTER === 'submitted') return a.status === 'Submitted';
    if (TL_FILTER === 'overdue') return isRecentlyClosedDeadline(s.deadline) && a.status !== 'Submitted';
    return isUpcomingDeadline(s.deadline) || a.status === 'Submitted' || a.status === 'Decision Received';
  });
}

function sortApps(apps) {
  return apps.slice().sort(function(a, b) {
    var sa = byId(a.id), sb2 = byId(b.id);
    if (!sa || !sb2) return 0;
    if (TL_SORT === 'name') return sa.name.localeCompare(sb2.name);
    if (TL_SORT === 'progress') return computeProgress(b) - computeProgress(a);
    // deadline (default) — submitted go last
    if (a.status === 'Submitted' && b.status !== 'Submitted') return 1;
    if (b.status === 'Submitted' && a.status !== 'Submitted') return -1;
    return new Date(sa.deadline) - new Date(sb2.deadline);
  });
}

function setTlView(view) {
  if (view === 'visual' || view === 'schools') view = 'timeline';
  if (view === 'tasks') view = 'list';
  TL_CURRENT_VIEW = view;
  document.querySelectorAll('#tlViewToggle button').forEach(function(b) {
    b.classList.toggle('active', b.dataset.view === view);
  });
  var schoolsView = document.getElementById('tlSchoolCardsView');
  var tasksView = document.getElementById('tlTasksView');
  var stripView = document.getElementById('tlStripView');
  if (schoolsView) schoolsView.classList.add('hidden');
  if (tasksView) tasksView.classList.remove('active');
  if (stripView) stripView.classList.remove('active');
  if (view === 'list') {
    tasksView.classList.add('active');
  } else {
    if (stripView) stripView.classList.add('active');
  }
  renderTimeline();
}

function toggleSchoolCard(id) {
  var card = document.getElementById('tl-card-' + id);
  if (card) card.classList.toggle('expanded');
}

function saveTlNote(schoolId) {
  var el = document.getElementById('tl-note-' + schoolId);
  if (el) { TL_NOTES[schoolId] = el.value; }
  saveUserTimelineExtras();
}

function renderTimelineSummary() {
  var bar = document.getElementById('tlSummaryBar');
  if (!bar) return;
  var active = USER_APPS.filter(function(a) {
    var s = byId(a.id);
    return s && isUpcomingDeadline(s.deadline) && a.status !== 'Submitted' && a.status !== 'Decision Received';
  });
  var submitted = USER_APPS.filter(function(a) { return a.status === 'Submitted'; });
  var next7 = active.filter(function(a) { var s = byId(a.id); return s && daysTo(s.deadline) <= 7; });
  var next30 = active.filter(function(a) { var s = byId(a.id); return s && daysTo(s.deadline) <= 30; });
  var overdue = USER_APPS.filter(function(a) { var s = byId(a.id); return s && isRecentlyClosedDeadline(s.deadline) && a.status !== 'Submitted'; });
  var nextDeadline = null;
  active.forEach(function(a) {
    var s = byId(a.id);
    if (!s) return;
    var d = daysTo(s.deadline);
    if (d > 0 && (nextDeadline === null || d < nextDeadline)) nextDeadline = d;
  });

  var allTasks = gatherAllTasks();
  var pendingTasks = allTasks.filter(function(t) { return !t.done; });
  var completedTasks = allTasks.filter(function(t) { return t.done; });
  var totalCompletion = allTasks.length > 0 ? Math.round(completedTasks.length / allTasks.length * 100) : 0;

  bar.innerHTML = '<div class="tl-summary-card' + (next7.length > 0 ? ' danger' : '') + '" style="cursor:pointer" onclick="setTlFilter(\'active\')">'
    + '<div class="tl-sc-val"><em>' + (nextDeadline !== null ? nextDeadline + 'd' : '—') + '</em></div><div class="tl-sc-lbl">Next deadline</div></div>'
    + '<div class="tl-summary-card warn" style="cursor:pointer" onclick="setTlView(\'list\')">'
    + '<div class="tl-sc-val"><em>' + pendingTasks.length + '</em></div><div class="tl-sc-lbl">Open tasks</div></div>'
    + '<div class="tl-summary-card" style="cursor:pointer" onclick="setTlFilter(\'all\')">'
    + '<div class="tl-sc-val"><em>' + totalCompletion + '%</em></div><div class="tl-sc-lbl">Overall progress</div></div>'
    + '<div class="tl-summary-card" style="cursor:pointer" onclick="setTlFilter(\'submitted\')">'
    + '<div class="tl-sc-val"><em>' + submitted.length + '</em></div><div class="tl-sc-lbl">Submitted</div></div>';
}

function renderSchoolCards() {
  var container = document.getElementById('tlSchoolCards');
  if (!container) return;

  var filteredApps = filterApps();

  if (USER_APPS.length === 0) {
    container.innerHTML = '<div class="tl-empty-state">'
      + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
      + '<p>Add schools from <a href="#" onclick="goto(\'schools\'); return false;">Schools</a> to see your timeline.</p></div>';
    return;
  }

  if (filteredApps.length === 0) {
    container.innerHTML = '<div class="tl-empty-state"><p>No schools match the current filter. Try changing your filter or search.</p></div>';
    return;
  }

  var sorted = sortApps(filteredApps);

  container.innerHTML = sorted.map(function(app) {
    var s = byId(app.id);
    if (!s) return '';
    var d = daysTo(s.deadline);
    var progress = computeProgress(app);
    var isSubmitted = app.status === 'Submitted';
    var statusClass = isSubmitted ? 'submitted' : app.status === 'Researching' ? 'researching' : 'applying';
    var daysClass = isSubmitted ? 'past' : d <= 7 ? 'urgent' : d <= 21 ? 'soon' : 'ok';
    var brand = s.color || 'var(--accent-primary)';
    var brand2 = s.accent && s.accent !== '#FFFFFF' && s.accent.length > 1 ? s.accent : '#4F7CFF';
    var initials = s.short.replace(/UC\s*/,'UC ').split(' ').map(function(w){return w[0];}).join('').slice(0,3);
    var progressColor = progress >= 80 ? 'var(--success)' : progress >= 40 ? 'var(--accent-primary)' : 'var(--accent-warm)';

    // Build checklist
    var checklistHtml = '';
    if (app.materials && !isSubmitted) {
      var m = app.materials;
      if (m.transcriptReq !== undefined) {
        var trDone = !!m.transcriptSent;
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (trDone ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'transcriptSent\',this.checked)"><label class="' + (trDone ? 'done' : '') + '">Send transcript</label><span class="tl-check-tag ' + (trDone ? 'done' : 'pending') + '">' + (trDone ? 'Done' : 'Pending') + '</span></div>';
      }
      if (m.essay1 !== undefined) {
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (m.essay1 ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'essay1\',this.checked)"><label class="' + (m.essay1 ? 'done' : '') + '">Essay 1</label><span class="tl-check-tag ' + (m.essay1 ? 'done' : 'pending') + '">' + (m.essay1 ? 'Done' : 'Pending') + '</span></div>';
      }
      if (m.essay2 !== undefined) {
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (m.essay2 ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'essay2\',this.checked)"><label class="' + (m.essay2 ? 'done' : '') + '">Essay 2</label><span class="tl-check-tag ' + (m.essay2 ? 'done' : 'pending') + '">' + (m.essay2 ? 'Done' : 'Pending') + '</span></div>';
      }
      if (m.lor1 !== undefined) {
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (m.lor1 ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'lor1\',this.checked)"><label class="' + (m.lor1 ? 'done' : '') + '">Letter of rec 1</label><span class="tl-check-tag ' + (m.lor1 ? 'done' : 'pending') + '">' + (m.lor1 ? 'Done' : 'Pending') + '</span></div>';
      }
      if (m.lor2 !== undefined) {
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (m.lor2 ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'lor2\',this.checked)"><label class="' + (m.lor2 ? 'done' : '') + '">Letter of rec 2</label><span class="tl-check-tag ' + (m.lor2 ? 'done' : 'pending') + '">' + (m.lor2 ? 'Done' : 'Pending') + '</span></div>';
      }
      if (m.feePaid !== undefined) {
        checklistHtml += '<div class="tl-check-item"><input type="checkbox" ' + (m.feePaid ? 'checked' : '') + ' onchange="toggleMaterial(\'' + s.id + '\',\'feePaid\',this.checked)"><label class="' + (m.feePaid ? 'done' : '') + '">Pay fee ($' + (s.fee || 75) + ')</label><span class="tl-check-tag ' + (m.feePaid ? 'done' : 'pending') + '">' + (m.feePaid ? 'Done' : 'Pending') + '</span></div>';
      }
    } else if (isSubmitted) {
      checklistHtml = '<div class="text-success materials-done"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> All materials submitted</div>';
    } else {
      checklistHtml = '<div style="padding: .5rem 0; color: var(--text-muted); font-size: .85rem;">No materials tracked yet</div>';
    }

    // Details panel
    var detailsHtml = '<div class="tl-detail-row"><div class="tl-detail-label">Deadline</div><div class="tl-detail-value">' + fmtDate(s.deadline) + '</div></div>'
      + '<div class="tl-detail-row"><div class="tl-detail-label">Days left</div><div class="tl-detail-value" style="color:' + (d <= 7 ? 'var(--danger)' : d <= 21 ? 'var(--accent-warm)' : 'var(--text-primary)') + '">' + (d >= 0 ? d + ' days' : Math.abs(d) + ' days overdue') + '</div></div>'
      + '<div class="tl-detail-row"><div class="tl-detail-label">Type</div><div class="tl-detail-value" style="font-family: var(--font-ui); text-transform: capitalize;">' + (s.deadlineType || 'Rolling') + '</div></div>'
      + '<div class="tl-detail-row"><div class="tl-detail-label">Platform</div><div class="tl-detail-value" style="font-family: var(--font-ui);">' + (s.platform || '—') + '</div></div>'
      + '<div class="tl-detail-row"><div class="tl-detail-label">Classification</div><div class="tl-detail-value" style="font-family: var(--font-ui);">' + app.label + '</div></div>'
      + '<div class="tl-detail-row"><div class="tl-detail-label">Progress</div><div class="tl-detail-value">' + progress + '%</div></div>';

    // Notes section
    var noteVal = TL_NOTES[s.id] || '';
    var notesHtml = '<div class="tl-notes-section"><h4>Notes</h4>'
      + '<textarea class="tl-note-input" id="tl-note-' + s.id + '" placeholder="Add notes for ' + s.short + '..." onblur="saveTlNote(\'' + s.id + '\')">' + noteVal + '</textarea></div>';

    return '<div class="tl-school-card" id="tl-card-' + s.id + '">'
      + '<div class="tl-school-card-header" onclick="toggleSchoolCard(\'' + s.id + '\')">'
      +   '<div class="tl-sc-avatar" style="--brand:' + brand + '; --brand2:' + brand2 + '">' + initials + '</div>'
      +   '<div class="tl-sc-info">'
      +     '<h3>' + s.name + '</h3>'
      +     '<div class="tl-sc-meta">'
      +       '<span class="status-pill ' + statusClass + '">' + app.status + '</span>'
      +       '<span style="font-size:.72rem; color:var(--text-muted);">' + fmtDate(s.deadline) + '</span>'
      +     '</div>'
      +     '<div class="tl-sc-progress-bar"><div class="tl-sc-progress-fill" style="width:' + progress + '%; background:' + progressColor + '"></div></div>'
      +   '</div>'
      +   '<div class="tl-sc-right">'
      +     '<div class="tl-sc-countdown">'
      +       '<div class="days-num ' + daysClass + '">' + (isSubmitted ? '✓' : (d >= 0 ? d : Math.abs(d))) + '</div>'
      +       '<div class="days-label">' + (isSubmitted ? 'sent' : d < 0 ? 'overdue' : 'days') + '</div>'
      +     '</div>'
      +     '<svg class="tl-sc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
      +   '</div>'
      + '</div>'
      + '<div class="tl-school-card-body">'
      +   '<div class="tl-body-grid">'
      +     '<div class="tl-checklist-panel"><h4>Materials checklist</h4>' + checklistHtml + '</div>'
      +     '<div class="tl-details-panel"><h4>Details</h4>' + detailsHtml + '</div>'
      +   '</div>'
      +   notesHtml
      +   '<div class="tl-card-actions">'
      +     '<button class="btn btn-ghost btn-sm" onclick="openAppModal(\'' + s.id + '\')">Open full view</button>'
      +     '<button class="btn btn-ghost btn-sm" onclick="goto(\'explore\')">View in catalogue</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }).join('');
}

/* Gather all tasks for the All Tasks view */
function gatherAllTasks() {
  var tasks = [];
  var now = new Date();

  USER_APPS.forEach(function(app) {
    var s = byId(app.id);
    if (!s) return;
    var d = daysTo(s.deadline);
    if (d <= 0 && app.status !== 'Submitted' && app.status !== 'Decision Received') return;
    if (app.status === 'Submitted' || app.status === 'Decision Received') {
      if (app.status === 'Submitted') {
        var hasDecision = DB_DECISIONS && DB_DECISIONS[app.id];
        tasks.push({text: 'Check for decision', school: s.short, schoolId: s.id, days: 0, done: !!hasDecision, custom: false});
      }
      return;
    }
    var m = app.materials || {};
    if (m.transcriptReq && !m.transcriptSent) tasks.push({text: 'Send transcript', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'transcriptSent'});
    if (m.essay1 === false) tasks.push({text: 'Complete essay 1', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'essay1'});
    if (m.essay2 === false) tasks.push({text: 'Complete essay 2', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'essay2'});
    if (m.lor1 !== undefined && !m.lor1) tasks.push({text: 'Secure letter of rec 1', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'lor1'});
    if (m.lor1 && !m.lor2) tasks.push({text: 'Secure letter of rec 2', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'lor2'});
    if (m.feePaid === false) tasks.push({text: 'Pay application fee', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'feePaid'});
    if (!m.submitted && app.progress >= 80) tasks.push({text: 'Submit application', school: s.short, schoolId: s.id, days: d, done: false, custom: false, matKey: 'submitted'});
  });

  CUSTOM_TASKS.forEach(function(ct, i) {
    var due = new Date(ct.dueDate);
    var d = Math.round((due - now) / 86400000);
    tasks.push({text: ct.name, school: ct.schoolName, schoolId: ct.schoolId, days: d, done: ct.done, custom: true, customIndex: i, priority: ct.priority || 'med'});
  });

  // Search filter
  var q = getTlSearchQuery();
  if (q) {
    tasks = tasks.filter(function(t) {
      return t.text.toLowerCase().indexOf(q) >= 0 || t.school.toLowerCase().indexOf(q) >= 0;
    });
  }

  // Sort: undone first, then by days ascending
  tasks.sort(function(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.days - b.days;
  });

  // Deduplicate auto-generated
  var seen = {};
  tasks = tasks.filter(function(t) {
    if (t.custom) return true;
    var key = t.text + '|' + t.school;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  return tasks;
}

function renderAllTasksView() {
  var container = document.getElementById('tlAllTasksList');
  if (!container) return;
  var rows = [];
  filterApps().forEach(function(app) {
    var s = byId(app.id);
    if (!s) return;
    rows.push({
      type: 'deadline',
      title: s.name,
      sub: app.status + ' · ' + computeProgress(app) + '% complete',
      schoolId: s.id,
      date: localDayStart(s.deadline),
      due: fmtDate(s.deadline),
      days: daysTo(s.deadline),
      done: app.status === 'Submitted' || app.status === 'Decision Received'
    });
  });
  gatherAllTasks().forEach(function(t) {
    if (t.done) return;
    var date = new Date();
    date.setDate(date.getDate() + t.days);
    rows.push({
      type: 'task',
      title: t.text,
      sub: t.school || 'General task',
      date: date,
      due: t.days < 0 ? 'Past due' : t.days === 0 ? 'Today' : t.days + ' days',
      days: t.days,
      task: t
    });
  });
  rows.sort(function(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.date - b.date;
  });

  if (rows.length === 0) {
    container.innerHTML = '<div class="timeline-list-panel"><div class="tl-empty-state"><p>No live timeline items. Closed deadlines are hidden automatically.</p></div></div>';
    return;
  }
  container.innerHTML = '<div class="timeline-list-panel">' + rows.map(function(r) {
    var click = r.schoolId ? ' onclick="openAppModal(\'' + r.schoolId + '\')"' : '';
    return '<div class="timeline-list-row"' + click + '>'
      + '<div><strong>' + r.title + '</strong><div class="timeline-event-sub">' + r.sub + '</div></div>'
      + '<div class="timeline-event-kicker">' + (r.done ? 'Submitted' : r.due) + '</div>'
      + '</div>';
  }).join('') + '</div>';
}

/* Visual timeline strip */
function renderVisualStrip() {
  var container = document.getElementById('tlVisualStrip');
  if (!container) return;

  var events = [];
  USER_APPS.forEach(function(app) {
    var s = byId(app.id);
    if (!s) return;
    var d = daysTo(s.deadline);
    if (d <= 0 && app.status !== 'Submitted' && app.status !== 'Decision Received') return;
    var urgency = app.status === 'Submitted' ? 'done' : d <= 14 ? 'soon' : '';
    events.push({
      date: new Date(s.deadline),
      dateStr: fmtDate(s.deadline),
      title: s.name,
      sub: app.status + ' · ' + computeProgress(app) + '% complete',
      urgency: urgency,
      schoolId: s.id,
      days: d,
      image: SCHOOL_IMAGES[s.id] || ''
    });
  });

  CUSTOM_TASKS.forEach(function(ct) {
    var due = new Date(ct.dueDate);
    var d = Math.round((due - new Date()) / 86400000);
    events.push({
      date: due,
      dateStr: fmtDate(ct.dueDate),
      title: ct.name,
      sub: ct.schoolName + (ct.done ? ' · Done' : ''),
      urgency: ct.done ? 'done' : d < 0 ? 'urgent' : d <= 14 ? 'soon' : '',
      days: d
    });
  });

  events.sort(function(a, b) { return a.date - b.date; });

  if (events.length === 0) {
    container.innerHTML = '<div class="timeline-board"><div class="tl-empty-state"><p>No live timeline items. Closed deadlines are hidden automatically.</p></div></div>';
    return;
  }
  var html = '<div class="timeline-board"><div class="timeline-board-head"><div><h3>Timeline stream</h3><p>Scroll sideways through deadlines, tasks, submissions, and reminders.</p></div><span class="mini-school-chip">' + events.length + ' items</span></div><div class="timeline-stream-wrap"><div class="timeline-stream">';
  events.forEach(function(e) {
    var month = e.date.toLocaleDateString('en-US', { month: 'short' });
    var day = e.date.toLocaleDateString('en-US', { day: 'numeric' });
    var isTask = !e.schoolId;
    var action = e.schoolId ? ' onclick="openAppModal(\'' + e.schoolId + '\')"' : ' onclick="openAddTaskForm()"';
    html += '<div class="timeline-stream-card ' + e.urgency + (isTask ? ' task' : '') + '"' + action + '>'
      + '<div class="timeline-stream-date"><strong>' + day + '</strong><span>' + month + '</span></div>'
      + (e.image ? '<div class="timeline-stream-media" style="background-image:url(\'' + e.image + '\');"></div>' : '')
      + '<div class="timeline-stream-title">' + e.title + '</div>'
      + '<div class="timeline-stream-sub">' + e.sub + '</div>'
      + '<div class="timeline-stream-kicker">' + (e.days > 0 ? deadlinePhrase(e.date) : e.urgency === 'done' ? 'Submitted' : 'Today') + '</div>'
      + '</div>';
  });
  html += '</div></div></div>';
  container.innerHTML = html;
}

function renderTimeline() {
  renderTimelineSummary();
  if (TL_CURRENT_VIEW === 'list') {
    renderAllTasksView();
  } else {
    renderVisualStrip();
  }
}

/* Open add task form */
function openAddTaskForm() {
  if (!CURRENT_USER) {
    showAuthModal(false);
    toast('Sign in to save timeline tasks.');
    return;
  }
  // Navigate to timeline if not already there
  if (document.getElementById('page-timeline') && !document.getElementById('page-timeline').classList.contains('active')) {
    goto('timeline');
  }
  setTimeout(function() {
    var form = document.getElementById('tlAddTaskForm');
    var schoolSelect = document.getElementById('atfSchool');
    if (!form || !schoolSelect) return;

    schoolSelect.innerHTML = '<option value="">General</option>' +
      USER_APPS.map(function(app) {
        var s = byId(app.id);
        return '<option value="' + s.id + '">' + s.short + '</option>';
      }).join('');

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('atfDate').valueAsDate = tomorrow;

    form.classList.add('active');
    document.getElementById('atfName').focus();
  }, 100);
}

function closeAddTaskForm() {
  var form = document.getElementById('tlAddTaskForm');
  if (form) {
    form.classList.remove('active');
    document.getElementById('atfName').value = '';
  }
}

function saveCustomTask() {
  var name = document.getElementById('atfName').value.trim();
  var schoolId = document.getElementById('atfSchool').value;
  var dateStr = document.getElementById('atfDate').value;
  var priorityEl = document.getElementById('atfPriority');
  var priority = priorityEl ? priorityEl.value : 'med';

  if (!name) { toast('Please enter a task name.'); return; }
  if (!dateStr) { toast('Please select a due date.'); return; }

  var school = schoolId ? byId(schoolId) : null;
  CUSTOM_TASKS.push({
    id: 'custom_' + Date.now(),
    name: name,
    schoolId: schoolId,
    schoolName: school ? school.short : 'General',
    dueDate: dateStr,
    done: false,
    priority: priority
  });

  saveUserTimelineExtras();
  closeAddTaskForm();
  renderTimeline();
  toast('Task added.');
}

function deleteCustomTask(i) {
  CUSTOM_TASKS.splice(i, 1);
  saveUserTimelineExtras();
  renderTimeline();
}

function toggleCustomTask(i) {
  CUSTOM_TASKS[i].done = !CUSTOM_TASKS[i].done;
  saveUserTimelineExtras();
  renderTimeline();
}

/* =============== CSV import modal =============== */
function openCsvImportModal() {
  var box = document.getElementById('appModalBox');
  box.className = 'modal';
  box.innerHTML = '<div style="padding:2rem;">'
    + '<h2 style="font-family:var(--font-display); margin-bottom:.3rem;">Import schools from CSV</h2>'
    + '<p class="sub" style="margin-bottom:1.2rem;">Upload a CSV file with school data. Required columns: <code>name</code>, <code>state</code>. Optional: <code>accept</code>, <code>gpa</code>, <code>deadline</code>, <code>platform</code>, <code>tuition_in</code>, <code>tuition_out</code>, <code>fee</code>, <code>type</code>, <code>majors</code>.</p>'
    + '<div style="border:2px dashed var(--border); border-radius:var(--radius); padding:2rem; text-align:center; margin-bottom:1rem; cursor:pointer;" onclick="document.getElementById(\'csvFileInput\').click()" id="csvDropZone">'
    + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:.5rem;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>'
    + '<div style="color:var(--text-secondary); font-size:.88rem;">Click to select a .csv file</div>'
    + '<div style="color:var(--text-muted); font-size:.75rem; margin-top:.3rem;">Or drag and drop</div>'
    + '</div>'
    + '<input type="file" id="csvFileInput" accept=".csv" style="display:none;" onchange="handleCsvFile(this.files[0])">'
    + '<div id="csvPreview" style="display:none; margin-bottom:1rem;"></div>'
    + '<div style="display:flex; gap:.5rem; justify-content:flex-end;">'
    + '<button class="btn btn-ghost btn-sm" onclick="closeAppModal()">Cancel</button>'
    + '<button class="btn btn-primary btn-sm" id="csvImportBtn" style="display:none;" onclick="importCsvSchools()">Import schools</button>'
    + '</div></div>';

  // Wire drag and drop
  var dz = document.getElementById('csvDropZone');
  dz.ondragover = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--accent-primary)'; };
  dz.ondragleave = function() { dz.style.borderColor = 'var(--border)'; };
  dz.ondrop = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--border)'; if (e.dataTransfer.files.length) handleCsvFile(e.dataTransfer.files[0]); };

  document.getElementById('appModal').classList.add('active');
}

var CSV_PARSED_ROWS = [];

function handleCsvFile(file) {
  if (!file || !file.name.endsWith('.csv')) { toast('Please select a .csv file.'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var lines = text.split(/\r?\n/).filter(function(l) { return l.trim(); });
    if (lines.length < 2) { toast('CSV needs at least a header row and one data row.'); return; }
    var headers = lines[0].split(',').map(function(h) { return h.trim().toLowerCase().replace(/['"]/g, ''); });
    var nameIdx = headers.indexOf('name');
    var stateIdx = headers.indexOf('state');
    if (nameIdx < 0) { toast('CSV must have a "name" column.'); return; }

    CSV_PARSED_ROWS = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(',').map(function(c) { return c.trim().replace(/^['"]|['"]$/g, ''); });
      if (!cols[nameIdx]) continue;
      CSV_PARSED_ROWS.push({
        name: cols[nameIdx],
        state: stateIdx >= 0 ? cols[stateIdx] : 'Unknown',
        accept: parseFloat(cols[headers.indexOf('accept')]) || null,
        gpa: parseFloat(cols[headers.indexOf('gpa')]) || null,
        deadline: cols[headers.indexOf('deadline')] || '',
        platform: cols[headers.indexOf('platform')] || 'User supplied',
        tuitionIn: parseInt(cols[headers.indexOf('tuition_in')]) || 0,
        tuitionOut: parseInt(cols[headers.indexOf('tuition_out')]) || 0,
        fee: parseInt(cols[headers.indexOf('fee')]) || null,
        type: cols[headers.indexOf('type')] || 'User supplied',
        majors: cols[headers.indexOf('majors')] || '',
      });
    }

    var preview = document.getElementById('csvPreview');
    var btn = document.getElementById('csvImportBtn');
    if (CSV_PARSED_ROWS.length === 0) { toast('No valid rows found.'); return; }

    preview.style.display = 'block';
    btn.style.display = 'inline-flex';
    preview.innerHTML = '<div style="font-size:.82rem; font-weight:600; margin-bottom:.4rem;">Preview: ' + CSV_PARSED_ROWS.length + ' school' + (CSV_PARSED_ROWS.length > 1 ? 's' : '') + '</div>'
      + '<div style="max-height:180px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius); font-size:.78rem;">'
      + '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:var(--bg-inset);"><th style="padding:.35rem .5rem; text-align:left;">Name</th><th style="padding:.35rem .5rem;">State</th><th style="padding:.35rem .5rem;">Accept</th><th style="padding:.35rem .5rem;">GPA</th></tr></thead><tbody>'
      + CSV_PARSED_ROWS.slice(0, 10).map(function(r) {
        return '<tr style="border-top:1px solid var(--border);"><td style="padding:.3rem .5rem;">' + r.name + '</td><td style="padding:.3rem .5rem; text-align:center;">' + r.state + '</td><td style="padding:.3rem .5rem; text-align:center;">' + formatAcceptance(r) + '</td><td style="padding:.3rem .5rem; text-align:center;">' + formatGpa(r) + '</td></tr>';
      }).join('')
      + (CSV_PARSED_ROWS.length > 10 ? '<tr><td colspan="4" style="padding:.3rem .5rem; color:var(--text-muted); text-align:center;">…and ' + (CSV_PARSED_ROWS.length - 10) + ' more</td></tr>' : '')
      + '</tbody></table></div>';
  };
  reader.readAsText(file);
}

function importCsvSchools() {
  var added = 0;
  CSV_PARSED_ROWS.forEach(function(r) {
    var id = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
    if (byId(id)) { id = id + '_custom'; }
    if (byId(id)) return; // skip duplicates
    var types = r.type.split(/[\/&,]/).map(function(t) { return t.trim(); }).filter(Boolean);
    var majors = r.majors ? r.majors.split(/[\/&;]/).map(function(m) { return m.trim(); }).filter(Boolean) : [];
    SCHOOLS.push({
      id: id, ipedsId: 0, name: r.name, short: r.name.length > 20 ? r.name.slice(0, 18) + '…' : r.name,
      state: r.state, location: '', type: types.length ? types : ['Private'],
      accept: r.accept, gpa: r.gpa, platform: r.platform,
      deadline: r.deadline || `${new Date().getFullYear() + 1}-03-01`, deadlineType: 'User supplied',
      tuition: { in: r.tuitionIn, out: r.tuitionOut },
      undergrad: 0, aid: '', cc: false, majors: majors,
      maxCredits: null, residencyCredits: null,
      applyLink: '', schoolUrl: '', fee: r.fee, waiver: false,
      color: '#6C5CE7', accent: '#A29BFE',
    });
    added++;
  });
  CSV_PARSED_ROWS = [];
  closeAppModal();
  if (added > 0) {
    toast(added + ' school' + (added > 1 ? 's' : '') + ' imported.');
    renderSchoolGrid();
    renderTabs();
  } else {
    toast('No new schools to import (possible duplicates).');
  }
}

function maybeShowFirstLoginHelp() {
  if (!CURRENT_USER) return;
  var key = 'ts-help-seen-' + CURRENT_USER.id;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  setTimeout(function() { openHelpModal({ onboarding: true }); }, 450);
}

function maybeShowSignedOutHelp() {
  if (CURRENT_USER) return;
  var key = 'ts-help-seen-signed-out';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  setTimeout(function() { openHelpModal({ signedOut: true }); }, 550);
}

/* =============== help modal =============== */
function openHelpModal(opts) {
  opts = opts || {};
  var isOnboarding = !!opts.onboarding;
  var isSignedOut = !!opts.signedOut;
  var box = document.getElementById('appModalBox');
  box.className = 'modal';
  box.innerHTML = '<div style="padding:2rem;">'
    + '<h2 style="font-family:var(--font-display); margin-bottom:.3rem;">' + (isOnboarding || isSignedOut ? 'Welcome to TransferSpace' : 'How to use TransferSpace') + '</h2>'
    + '<p class="sub" style="margin-bottom:1.5rem;">' + (isSignedOut ? 'Sign in when you are ready to save a private transfer workspace.' : isOnboarding ? 'A quick first-run tour so the workspace feels less mysterious.' : 'Quick guide to get the most out of your transfer tracker.') + '</p>'
    + '<div style="display:flex; flex-direction:column; gap:1.2rem;">'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">Schools</div><div style="color:var(--text-secondary); font-size:.88rem;">Browse schools and use the Refine panel on the left to filter by GPA, region, deadline type, and more. Click any card to see detailed info, then save schools to your list.</div></div>'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">Applications</div><div style="color:var(--text-secondary); font-size:.88rem;">Track your apps on the kanban board or list view. Drag cards between columns to update status. Click a card to check off materials like transcripts, essays, and LORs.</div></div>'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">Materials</div><div style="color:var(--text-secondary); font-size:.88rem;">Write and version your essays with the built-in editor (word count tracking included). Upload transcripts, manage LOR requests, and keep everything organized in one vault.</div></div>'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">Timeline</div><div style="color:var(--text-secondary); font-size:.88rem;">See all your deadlines on a Gantt-style chart. Zoom between 2-week, 6-month, and full-year views. The "Next 14 days" panel shows your most urgent tasks.</div></div>'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">CSV Import</div><div style="color:var(--text-secondary); font-size:.88rem;">On the Schools page, click "Import CSV" to add custom schools. Your CSV needs at minimum a <code>name</code> column. Optional columns: <code>state</code>, <code>accept</code>, <code>gpa</code>, <code>deadline</code>, <code>platform</code>, <code>fee</code>.</div></div>'
    + '<div><div style="font-weight:600; margin-bottom:.2rem;">Keyboard shortcuts</div><div style="color:var(--text-secondary); font-size:.88rem;"><kbd style="padding:.15rem .4rem; background:var(--bg-inset); border:1px solid var(--border); border-radius:4px; font-size:.75rem;">⌘K</kbd> — Quick search &amp; actions</div></div>'
    + '</div>'
    + '<div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:.5rem; flex-wrap:wrap;">'
    + (isSignedOut ? '<button class="btn btn-ghost btn-sm" onclick="closeAppModal()">Browse first</button><button class="btn btn-primary btn-sm" onclick="closeAppModal(); showAuthModal(false)">Sign in</button>' : '<button class="btn btn-primary btn-sm" onclick="closeAppModal()">Got it</button>')
    + '</div></div>';
  document.getElementById('appModal').classList.add('active');
}

/* =============== settings =============== */
function setSettingsTab(id) {
  document.querySelectorAll('.st-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
}
function renderThemeChips() {
  const t = document.documentElement.dataset.theme;
  const has = localStorage.getItem('ts-theme');
  document.getElementById('th-light')?.classList.toggle('active', has === 'light');
  document.getElementById('th-dark')?.classList.toggle('active', has === 'dark');
  document.getElementById('th-sys')?.classList.toggle('active', !has);
}

/* =============== Data Export =============== */
function exportUserData() {
  const data = {
    exported_at: new Date().toISOString(),
    essays: DB_ESSAYS,
    documents: DB_DOCUMENTS.map(d => ({ ...d, storage_path: undefined })),
    lors: DB_LORS,
    applications: USER_APPS,
    profile: USER_PROFILE,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'transferspace-export.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Data exported.');
}

/* =============== CSV Export =============== */
function exportUserDataCSV() {
  const rows = [['School','Status','Label','Progress','Deadline']];
  USER_APPS.forEach(a => {
    const s = SCHOOLS.find(x => x.id === a.id) || {};
    rows.push([s.name||a.id, a.status, a.label||'', a.progress||0, s.deadline||'']);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'transferspace-export.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('CSV exported.');
}

/* =============== Notification Settings =============== */
function getNotifSettings() {
  try { return JSON.parse(localStorage.getItem('ts-notif') || '{}'); } catch { return {}; }
}
function saveNotifSettings(obj) { localStorage.setItem('ts-notif', JSON.stringify(obj)); }

function toggleNotifSetting(el) {
  el.classList.toggle('on');
  const key = el.dataset.notif;
  const settings = getNotifSettings();
  settings[key] = el.classList.contains('on');
  saveNotifSettings(settings);
  syncNotifPrefs(); // persist to Supabase
  toast(el.classList.contains('on') ? 'Enabled' : 'Disabled');
}

function toggleDeadlineReminder(chip) {
  chip.classList.toggle('active');
  const active = [];
  document.querySelectorAll('#deadlineReminderChips .chip.active').forEach(c => active.push(c.dataset.days));
  localStorage.setItem('ts-deadline-reminders', JSON.stringify(active));
  updateReminderOverview(active);
  syncNotifPrefs(); // persist to Supabase
  toast('Reminder updated');
}

function updateReminderOverview(active) {
  const el = document.querySelector('.settings-overview-item:nth-child(2) strong');
  if (!el) return;
  if (!active || active.length === 0) {
    el.textContent = 'Off';
    return;
  }
  const sorted = active.map(Number).filter(Boolean).sort((a, b) => a - b);
  el.textContent = sorted.length === 1 ? `${sorted[0]} days` : `${sorted[0]}-${sorted[sorted.length - 1]} days`;
}

function loadNotifSettings() {
  const settings = getNotifSettings();
  document.querySelectorAll('[data-notif]').forEach(el => {
    const key = el.dataset.notif;
    if (key in settings) {
      el.classList.toggle('on', settings[key]);
    }
  });
  const reminders = JSON.parse(localStorage.getItem('ts-deadline-reminders') || '["30"]');
  document.querySelectorAll('#deadlineReminderChips .chip').forEach(c => {
    c.classList.toggle('active', reminders.includes(c.dataset.days));
  });
  updateReminderOverview(reminders);
}

/* =============== Font Size =============== */
function setFontSize(size) {
  const root = document.documentElement;
  if (size === 'large') {
    root.style.fontSize = '18px';
  } else {
    root.style.fontSize = '';
  }
  localStorage.setItem('ts-fontsize', size);
  document.querySelectorAll('#fontSizeChips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.size === size);
  });
  toast(size === 'large' ? 'Large text enabled' : 'Standard text restored');
}

function loadFontSize() {
  const size = localStorage.getItem('ts-fontsize') || 'standard';
  if (size === 'large') document.documentElement.style.fontSize = '18px';
  document.querySelectorAll('#fontSizeChips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.size === size);
  });
}

/* =============== Accent Color =============== */
const ACCENT_MAP = {
  '#1A3EBF': { ink: '#13308F', dark: '#6E93FF', darkInk: '#8AA8FF' },
  '#2D8A4E': { ink: '#1F6B3A', dark: '#5AC07A', darkInk: '#7AD49A' },
  '#8C1515': { ink: '#6B0F0F', dark: '#E05555', darkInk: '#F07070' },
  '#866D4B': { ink: '#6B5638', dark: '#C4A87A', darkInk: '#D4BC94' },
  '#1D1D1D': { ink: '#000000', dark: '#A0A0A0', darkInk: '#B8B8B8' },
};

function setAccentColor(color) {
  const map = ACCENT_MAP[color] || ACCENT_MAP['#1A3EBF'];
  const root = document.documentElement;
  const isDark = root.dataset.theme === 'dark';
  root.style.setProperty('--accent-primary', isDark ? map.dark : color);
  root.style.setProperty('--accent-primary-ink', isDark ? map.darkInk : map.ink);
  localStorage.setItem('ts-accent', color);
  document.querySelectorAll('#accentPicker .accent-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === color);
  });
  toast('Accent color updated');
}

function loadAccentColor() {
  const color = localStorage.getItem('ts-accent');
  if (color && ACCENT_MAP[color]) {
    const map = ACCENT_MAP[color];
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.style.setProperty('--accent-primary', isDark ? map.dark : color);
    document.documentElement.style.setProperty('--accent-primary-ink', isDark ? map.darkInk : map.ink);
    document.querySelectorAll('#accentPicker .accent-swatch').forEach(s => {
      s.classList.toggle('selected', s.dataset.color === color);
    });
  }
}

/* =============== Preferences =============== */
function savePrefGpa() {
  const val = document.getElementById('prefGpaInput')?.value || '3.5';
  localStorage.setItem('ts-pref-gpa', val);
  toast('Default GPA saved');
}

function togglePrefChip(chip, storageKey) {
  chip.classList.toggle('active');
  const container = chip.parentElement;
  const active = [];
  container.querySelectorAll('.chip.active').forEach(c => active.push(c.dataset.val));
  localStorage.setItem('ts-' + storageKey, JSON.stringify(active));
  toast('Preference saved');
}

function loadPreferences() {
  const gpa = localStorage.getItem('ts-pref-gpa');
  if (gpa) {
    const el = document.getElementById('prefGpaInput');
    if (el) el.value = gpa;
  }
  const types = JSON.parse(localStorage.getItem('ts-prefTypes') || '[]');
  document.querySelectorAll('#prefTypeChips .chip').forEach(c => {
    c.classList.toggle('active', types.includes(c.dataset.val));
  });
  const regions = JSON.parse(localStorage.getItem('ts-prefRegions') || '[]');
  document.querySelectorAll('#prefRegionChips .chip').forEach(c => {
    c.classList.toggle('active', regions.includes(c.dataset.val));
  });
}

/* =============== Password Change =============== */
async function changePassword() {
  const curr = document.getElementById('pwCurrent')?.value;
  const newPw = document.getElementById('pwNew')?.value;
  const confirm = document.getElementById('pwConfirm')?.value;
  if (!newPw || !confirm) { toast('Please fill in all fields.'); return; }
  if (newPw !== confirm) { toast('Passwords do not match.'); return; }
  if (newPw.length < 6) { toast('Password must be at least 6 characters.'); return; }
  try {
    const { error } = await sb.auth.updateUser({ password: newPw });
    if (error) { toast('Error: ' + error.message); return; }
    document.getElementById('pwCurrent').value = '';
    document.getElementById('pwNew').value = '';
    document.getElementById('pwConfirm').value = '';
    document.getElementById('pwLastChanged').textContent = 'Last changed: just now.';
    toast('Password updated successfully!');
  } catch (e) {
    toast('Failed to update password.');
  }
}

/* =============== Delete Account =============== */
let deleteConfirmStep = 0;
let deleteConfirmTimer = null;

function deleteAccountStep() {
  const btn = document.getElementById('deleteAccountBtn');
  if (deleteConfirmStep === 0) {
    deleteConfirmStep = 1;
    btn.textContent = 'Are you sure? Click again to confirm.';
    btn.style.background = 'color-mix(in srgb, var(--danger) 10%, transparent)';
    deleteConfirmTimer = setTimeout(() => {
      deleteConfirmStep = 0;
      btn.textContent = 'Delete my account';
      btn.style.background = '';
    }, 5000);
  } else {
    clearTimeout(deleteConfirmTimer);
    deleteConfirmStep = 0;
    btn.textContent = 'Deleting...';
    btn.disabled = true;
    // Sign out and clear local data
    localStorage.clear();
    sb.auth.signOut().then(() => {
      toast('Account data cleared. Goodbye.');
      setTimeout(() => location.reload(), 1500);
    });
  }
}

/* =============== Settings Init =============== */
function initSettings() {
  loadNotifSettings();
  loadFontSize();
  loadAccentColor();
  loadPreferences();
  renderThemeChips();
}

/* =============== Profile — Supabase persistence =============== */
let DB_PROFILE = null;

async function loadProfile() {
  if (!CURRENT_USER) { hydrateProfilePage(); return; }
  const { data } = await sb.from('profiles').select('*').eq('id', CURRENT_USER.id).maybeSingle();
  if (data) {
    DB_PROFILE = data;
    // Sync to USER_PROFILE for backward compatibility
    if (data.full_name) USER_PROFILE.name = data.full_name;
    if (data.current_school) USER_PROFILE.currentSchool = data.current_school;
    if (data.intended_major) USER_PROFILE.major = data.intended_major;
    if (data.gpa) USER_PROFILE.gpa = data.gpa;
    if (data.credits_completed) USER_PROFILE.credits = data.credits_completed;
    if (data.home_state) USER_PROFILE.homeState = data.home_state;
    if (data.transfer_term) USER_PROFILE.transferTerm = data.transfer_term;
    if (data.avatar_color) USER_PROFILE.avatarColor = data.avatar_color;
    hydrateProfilePage();
    syncSidebarFromProfile();
    updateProfilePreview();
    renderTabs();
    renderSchoolGrid();
  } else {
    if (CURRENT_USER?.email) USER_PROFILE.email = CURRENT_USER.email;
    if (CURRENT_USER && USER_PROFILE.name === DEFAULT_PROFILE.name) USER_PROFILE.name = authDisplayName();
    hydrateProfilePage();
    syncSidebarFromProfile();
    updateProfilePreview();
  }
}

function hydrateProfilePage() {
  const p = DB_PROFILE || {
    full_name: USER_PROFILE.name,
    email: USER_PROFILE.email,
    current_school: USER_PROFILE.currentSchool,
    home_state: USER_PROFILE.homeState,
    gpa: USER_PROFILE.gpa,
    credits_completed: USER_PROFILE.credits,
    transfer_term: USER_PROFILE.transferTerm,
    intended_major: USER_PROFILE.major,
    avatar_color: USER_PROFILE.avatarColor,
    academic_standing: 'Sophomore',
    application_cycle: '2025-2026',
    interests: ['Research', 'Financial aid']
  };
  const el = (id) => document.getElementById(id);
  if (el('pf-name')) el('pf-name').value = p.full_name || '';
  if (el('pf-email')) el('pf-email').value = p.email || '';
  if (el('pf-school')) el('pf-school').value = p.current_school || '';
  if (el('pf-home')) el('pf-home').value = p.home_state || '';
  if (el('pf-gpa')) el('pf-gpa').value = p.gpa || '';
  if (el('pf-credits')) el('pf-credits').value = p.credits_completed || '';
  if (el('pf-term')) el('pf-term').value = p.transfer_term || 'Fall 2026';
  if (el('pf-major')) el('pf-major').value = p.intended_major || 'Computer Science';
  if (el('pf-bio')) el('pf-bio').value = p.bio || '';
  if (el('pf-story')) el('pf-story').value = p.transfer_story || '';
  if (el('pf-standing')) el('pf-standing').value = p.academic_standing || 'Sophomore';
  if (el('pf-cycle')) el('pf-cycle').value = p.application_cycle || '2025-2026';
  const social = p.social_links || {};
  if (el('pf-linkedin')) el('pf-linkedin').value = social.linkedin || '';
  if (el('pf-github')) el('pf-github').value = social.github || '';
  if (el('pf-twitter')) el('pf-twitter').value = social.twitter || '';
  // Update profile card preview
  renderProfileCard();
  // Update avatar swatches
  document.querySelectorAll('.ac-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === (p.avatar_color || 'indigo'));
  });
  // Update interests
  if (p.interests && p.interests.length) {
    document.querySelectorAll('#profileInterests .chip').forEach(c => {
      c.classList.toggle('active', p.interests.includes(c.textContent.trim()));
    });
  }
  bindProfileLiveSync();
  renderProfileImpact();
}

function renderProfileCard() {
  const card = document.getElementById('profileCardPreview');
  if (!card) return;
  const p = {
    full_name: document.getElementById('pf-name')?.value || DB_PROFILE?.full_name || USER_PROFILE.name,
    current_school: document.getElementById('pf-school')?.value || DB_PROFILE?.current_school || USER_PROFILE.currentSchool,
    intended_major: document.getElementById('pf-major')?.value || DB_PROFILE?.intended_major || USER_PROFILE.major,
    gpa: document.getElementById('pf-gpa')?.value || DB_PROFILE?.gpa || USER_PROFILE.gpa,
    credits_completed: document.getElementById('pf-credits')?.value || DB_PROFILE?.credits_completed || USER_PROFILE.credits,
    transfer_term: document.getElementById('pf-term')?.value || DB_PROFILE?.transfer_term || USER_PROFILE.transferTerm,
    academic_standing: document.getElementById('pf-standing')?.value || DB_PROFILE?.academic_standing || 'Sophomore',
    avatar_color: DB_PROFILE?.avatar_color || USER_PROFILE.avatarColor
  };
  const initials = initialsFrom(p.full_name);
  const avatarBg = AVATAR_GRADIENTS[p.avatar_color || 'violet'] || AVATAR_GRADIENTS.violet;
  card.innerHTML = `
    <div class="profile-preview-pane">
    <div class="profile-preview-top">
      <div style="width:52px; height:52px; border-radius:14px; background:${avatarBg}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.05rem;">${initials}</div>
      <div>
        <div class="profile-preview-name">${p.full_name || 'Your Name'}</div>
        <div class="profile-preview-meta">${p.current_school || 'Your School'} · ${p.intended_major || 'Major'}</div>
      </div>
    </div>
    <div class="profile-preview-tags">
      <span class="mini-school-chip">GPA ${p.gpa || '-'}</span>
      <span class="mini-school-chip">${p.credits_completed || 0} credits</span>
      <span class="mini-school-chip">${p.transfer_term || '-'}</span>
      <span class="mini-school-chip">${p.academic_standing || '-'}</span>
    </div>
    </div>
  `;
  updateProfileSignalOverview(p);
}

function updateProfileSignalOverview(profile = {}) {
  const fitEl = document.getElementById('profileSignalFit');
  const cycleEl = document.getElementById('profileSignalCycle');
  if (fitEl) {
    const hasCore = Boolean(profile.gpa || USER_PROFILE.gpa) && Boolean(profile.intended_major || USER_PROFILE.major);
    fitEl.textContent = hasCore ? 'Live' : 'Needs basics';
  }
  if (cycleEl) {
    const cycle = document.getElementById('pf-cycle')?.value || DB_PROFILE?.application_cycle || '2025-2026';
    cycleEl.textContent = cycle;
  }
}

async function saveProfile() {
  syncProfileFromForm();
  if (!CURRENT_USER) {
    renderProfileCard();
    renderProfileImpact();
    renderTabs();
    if (document.getElementById('page-explore')?.classList.contains('active')) renderSchoolGrid();
    toast('Profile applied locally.');
    return;
  }
  const el = (id) => document.getElementById(id)?.value || '';
  // Gather interests
  const interests = [];
  document.querySelectorAll('#profileInterests .chip.active').forEach(c => interests.push(c.textContent.trim()));

  const profileData = {
    full_name: el('pf-name'),
    email: el('pf-email'),
    avatar_color: DB_PROFILE?.avatar_color || 'indigo',
    bio: el('pf-bio'),
    transfer_story: el('pf-story'),
    current_school: el('pf-school'),
    home_state: el('pf-home'),
    gpa: parseFloat(el('pf-gpa')) || null,
    credits_completed: parseInt(el('pf-credits')) || 0,
    transfer_term: el('pf-term'),
    application_cycle: el('pf-cycle'),
    intended_major: el('pf-major'),
    academic_standing: el('pf-standing'),
    interests,
    social_links: {
      linkedin: el('pf-linkedin'),
      github: el('pf-github'),
      twitter: el('pf-twitter'),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb.from('profiles').upsert({ id: CURRENT_USER.id, ...profileData }).select().single();
  if (error) { toast('Error saving profile: ' + error.message); return; }
  DB_PROFILE = data;
  // Sync back
  USER_PROFILE.name = data.full_name;
  USER_PROFILE.currentSchool = data.current_school;
  USER_PROFILE.major = data.intended_major;
  USER_PROFILE.gpa = data.gpa;
  USER_PROFILE.credits = data.credits_completed;
  USER_PROFILE.homeState = data.home_state;
  USER_PROFILE.transferTerm = data.transfer_term;
  USER_PROFILE.avatarColor = data.avatar_color;
  syncSidebarFromProfile();
  updateProfilePreview();
  renderProfileCard();
  renderProfileImpact();
  renderTabs();
  if (document.getElementById('page-explore')?.classList.contains('active')) renderSchoolGrid();
  toast('Profile saved!');
  // Show confirmation on button
  const btn = document.getElementById('profileSaveBtn');
  if (btn) { btn.textContent = 'Applied'; btn.style.background = 'var(--success)'; setTimeout(() => { btn.textContent = 'Apply profile'; btn.style.background = ''; }, 2000); }
}

function profileUpdateAvatar(color) {
  if (DB_PROFILE) DB_PROFILE.avatar_color = color;
  updateProfile('avatarColor', color);
  renderProfileCard();
  renderProfileImpact();
}

function syncProfileFromForm() {
  const val = id => document.getElementById(id)?.value || '';
  USER_PROFILE.name = val('pf-name') || USER_PROFILE.name;
  USER_PROFILE.email = val('pf-email') || USER_PROFILE.email;
  USER_PROFILE.currentSchool = val('pf-school') || USER_PROFILE.currentSchool;
  USER_PROFILE.homeState = val('pf-home') || USER_PROFILE.homeState;
  USER_PROFILE.gpa = parseFloat(val('pf-gpa')) || USER_PROFILE.gpa;
  USER_PROFILE.credits = parseInt(val('pf-credits'), 10) || USER_PROFILE.credits;
  USER_PROFILE.transferTerm = val('pf-term') || USER_PROFILE.transferTerm;
  USER_PROFILE.major = val('pf-major') || USER_PROFILE.major;
  syncSidebarFromProfile();
  renderProfileCard();
  renderProfileImpact();
}

let PROFILE_LIVE_BOUND = false;
function bindProfileLiveSync() {
  if (PROFILE_LIVE_BOUND) return;
  PROFILE_LIVE_BOUND = true;
  ['pf-name','pf-school','pf-home','pf-gpa','pf-credits','pf-standing','pf-term','pf-cycle','pf-major'].forEach(id => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('input', syncProfileFromForm);
    node.addEventListener('change', syncProfileFromForm);
  });
}

function stateCodeFromName(name) {
  const map = {
    massachusetts: 'MA', ma: 'MA',
    california: 'CA', ca: 'CA',
    newyork: 'NY', 'new york': 'NY', ny: 'NY',
    texas: 'TX', tx: 'TX',
    michigan: 'MI', mi: 'MI',
    pennsylvania: 'PA', pa: 'PA',
    northcarolina: 'NC', 'north carolina': 'NC', nc: 'NC',
    louisiana: 'LA', la: 'LA'
  };
  const key = String(name || '').trim().toLowerCase();
  return map[key] || key.toUpperCase().slice(0, 2);
}

function renderProfileImpact() {
  const grid = document.getElementById('profileImpactGrid');
  if (!grid) return;
  const gpa = parseFloat(USER_PROFILE.gpa) || 0;
  const credits = parseInt(USER_PROFILE.credits, 10) || 0;
  const state = stateCodeFromName(USER_PROFILE.homeState);
  const bestFits = SCHOOLS.filter(s => isProfileFitSchool(s)).length;
  const inState = SCHOOLS.filter(s => s.state === state).length;
  const creditReadiness = credits >= 60 ? 'Junior-ready' : credits >= 30 ? 'Sophomore track' : 'Early transfer';
  const major = USER_PROFILE.major || 'Undecided';
  grid.innerHTML = `
    <div class="profile-impact-item"><strong>${bestFits}</strong><span>Best Fit schools use your ${gpa ? gpa.toFixed(2) : 'current'} GPA and ${major} signal.</span></div>
    <div class="profile-impact-item"><strong>${inState}</strong><span>In-state options match ${USER_PROFILE.homeState || 'your home state'}.</span></div>
    <div class="profile-impact-item"><strong>${creditReadiness}</strong><span>${credits} credits inform transfer standing and planning prompts.</span></div>
  `;
  updateProfileSignalOverview();
}

function applyProfileToExplore() {
  syncProfileFromForm();
  goto('schools');
  setTimeout(function() {
    setTab('fit');
    renderSchoolGrid();
  }, 0);
}

async function uploadProfilePhoto() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !CURRENT_USER) return;
    const path = `${CURRENT_USER.id}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await sb.storage.from('documents').upload(path, file);
    if (upErr) { toast('Upload failed: ' + upErr.message); return; }
    const { data: urlData } = sb.storage.from('documents').getPublicUrl(path);
    if (urlData?.publicUrl) {
      await sb.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', CURRENT_USER.id);
      if (DB_PROFILE) DB_PROFILE.avatar_url = urlData.publicUrl;
      toast('Photo uploaded!');
      renderProfileCard();
    }
  };
  input.click();
}

/* =============== Load Schools from Supabase =============== */
async function loadSchoolsFromDB() {
  let rows = [];
  let source = 'Supabase';
  SCHOOLS_LOADING = true;
  renderSchoolGrid();
  const allowedIds = (window.TRANSFERSPACE_SCHOOL_DATA || []).map(s => s.id).filter(Boolean);
  try {
    const { data, error } = await sb.from('schools_full')
      .select('*')
      .in('id', allowedIds)
      .order('name', { ascending: true });
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    console.warn('School data unavailable from Supabase; using local fallback.', err);
  }
  SCHOOLS_LOADING = false;

  if (!rows.length) {
    loadSchoolsFromVerifiedFallback();
  } else {
    hydrateSchools(rows, source);
  }

  renderSchoolGrid();
  renderTabs();
  renderProfileImpact();
  populateFitMajorOptions();
  renderExploreGlobePreview();
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    if (activePage.id === 'page-stats') renderStatsPanel();
    if (activePage.id === 'page-gpachart') renderGpaChart();
    if (activePage.id === 'page-explore') {
      const inp = document.getElementById('fitGpaInput');
      if (inp && inp.value) runFitEstimator();
    }
  }
}

function shortenName(name) {
  return name
    .replace(/^University of California-/, 'UC ')
    .replace(/^University of /, 'U ')
    .replace(/^The /, '')
    .replace(/ University$/, '')
    .replace(/ at .*/, '')
    .replace(/-.*/, '')
    .replace(/ Campus Immersion/, '')
    .replace(/ in the City of New York/, '')
    .slice(0, 25);
}

/* =============== Resource Directory =============== */
let DB_BOOKMARKS = [];

async function loadBookmarks() {
  if (!CURRENT_USER) return;
  const { data } = await sb.from('bookmarks').select('*').eq('user_id', CURRENT_USER.id).order('created_at', { ascending: false });
  DB_BOOKMARKS = data || [];
  renderBookmarks();
}

function renderBookmarks() {
  const grid = document.getElementById('bookmarksGrid');
  const empty = document.getElementById('bookmarksEmpty');
  if (!grid) return;
  if (DB_BOOKMARKS.length === 0) {
    grid.innerHTML = '<div class="res-empty compact" id="bookmarksEmpty"><strong>No bookmarks yet</strong><span>Add a registrar, portal, or transfer center link.</span></div>';
    return;
  }
  grid.innerHTML = DB_BOOKMARKS.map((bm, i) => {
    const domain = (() => { try { return new URL(bm.url).hostname; } catch(e) { return ''; } })();
    return `
      <a href="${bm.url}" target="_blank" class="res-card res-card-bm" style="animation-delay:${i * .06}s" data-res-idx="${i}">
        <div class="res-card-icon">
          <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" />
        </div>
        <div class="res-card-body">
          <div class="res-card-title">${bm.title}</div>
          ${bm.description ? '<div class="res-card-tip">' + bm.description + '</div>' : ''}
        </div>
        <div class="res-card-link">↗</div>
        <button class="res-bm-delete" onclick="event.preventDefault(); event.stopPropagation(); deleteBookmark('${bm.id}')">✕</button>
      </a>
    `;
  }).join('');
}

function openBookmarkModal() {
  if (!CURRENT_USER) { showAuthModal(); return; }
  document.getElementById('bmTitle').value = '';
  document.getElementById('bmUrl').value = '';
  document.getElementById('bmDesc').value = '';
  document.getElementById('bookmarkModal').style.display = 'flex';
}
function closeBookmarkModal() { document.getElementById('bookmarkModal').style.display = 'none'; }

async function handleBookmarkSubmit(e) {
  e.preventDefault();
  const row = {
    user_id: CURRENT_USER.id,
    title: document.getElementById('bmTitle').value.trim(),
    url: document.getElementById('bmUrl').value.trim(),
    description: document.getElementById('bmDesc').value.trim(),
  };
  const { data, error } = await sb.from('bookmarks').insert(row).select().single();
  if (error) { toast('Error: ' + error.message); return; }
  DB_BOOKMARKS.unshift(data);
  closeBookmarkModal();
  renderBookmarks();
  toast('Bookmark saved.');
}

async function deleteBookmark(id) {
  await sb.from('bookmarks').delete().eq('id', id);
  DB_BOOKMARKS = DB_BOOKMARKS.filter(b => b.id !== id);
  renderBookmarks();
  toast('Bookmark removed.');
}

// Copy link to clipboard utility
function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => toast('Copied!')).catch(() => toast('Copy failed.'));
}

// Re-trigger entrance animations when switching to resources tab
const _originalGoto = goto;

/* =============== Strategy Scratchpad =============== */
let SCRATCHPAD_CACHE = {};
let SCRATCHPAD_TIMER = null;

async function loadScratchpad(schoolId) {
  if (!CURRENT_USER) return;
  if (SCRATCHPAD_CACHE[schoolId] !== undefined) {
    const el = document.getElementById('scratchpad_' + schoolId);
    if (el) el.value = SCRATCHPAD_CACHE[schoolId];
    return;
  }
  const { data } = await sb.from('school_notes').select('*').eq('user_id', CURRENT_USER.id).eq('school_id', schoolId).maybeSingle();
  const content = data?.content || '';
  SCRATCHPAD_CACHE[schoolId] = content;
  const el = document.getElementById('scratchpad_' + schoolId);
  if (el) el.value = content;
}

function saveScratchpad(schoolId) {
  if (SCRATCHPAD_TIMER) clearTimeout(SCRATCHPAD_TIMER);
  SCRATCHPAD_TIMER = setTimeout(async () => {
    if (!CURRENT_USER) return;
    const el = document.getElementById('scratchpad_' + schoolId);
    if (!el) return;
    const content = el.value;
    SCRATCHPAD_CACHE[schoolId] = content;
    // Upsert
    const { data: existing } = await sb.from('school_notes').select('id').eq('user_id', CURRENT_USER.id).eq('school_id', schoolId).maybeSingle();
    if (existing) {
      await sb.from('school_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await sb.from('school_notes').insert({ user_id: CURRENT_USER.id, school_id: schoolId, content });
    }
  }, 1200);
}

// Override openAppModal to also load scratchpad
const _origOpenAppModal = openAppModal;

/* =============== Decision Day =============== */
let DB_DECISIONS = {};

async function loadDecisions() {
  if (!CURRENT_USER) return;
  const { data } = await sb.from('decisions').select('*').eq('user_id', CURRENT_USER.id);
  (data || []).forEach(d => { DB_DECISIONS[d.school_id] = d; });
}

function openDecisionForm(schoolId) {
  const s = byId(schoolId);
  if (!s) return;
  const box = document.getElementById('appModalBox');
  box.className = 'modal';
  box.innerHTML = `
    <div class="modal-head">
      <div>
        <h3>Decision for ${s.short}</h3>
        <p class="mh-sub">Log the outcome of this application.</p>
      </div>
      <button class="drawer-close" onclick="openAppModal('${schoolId}')" title="Back">
        <svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
    <div class="decision-body">
      <div class="decision-actions">
        <button class="btn btn-success" onclick="recordDecision('${schoolId}','accepted')">Accepted</button>
        <button class="btn btn-ghost"   onclick="recordDecision('${schoolId}','waitlisted')">Waitlisted</button>
        <button class="btn btn-danger"  onclick="recordDecision('${schoolId}','denied')">Denied</button>
      </div>
      <button class="btn btn-ghost btn-sm decision-back" onclick="openAppModal('${schoolId}')">← Go back to application</button>
    </div>
  `;
}

async function recordDecision(schoolId, result) {
  const app = USER_APPS.find(a => a.id === schoolId);
  if (app) {
    app.status = 'Decision Received';
    app.decision = result;
    saveUserApps();
  }
  if (CURRENT_USER) {
    const row = { user_id: CURRENT_USER.id, school_id: schoolId, result };
    const { data } = await sb.from('decisions').insert(row).select().single();
    if (data) DB_DECISIONS[schoolId] = data;
  }
  closeAppModal();
  renderKanban();
  renderAppList();
  const s = byId(schoolId);
  if (result === 'accepted') {
    toast(s.short + ' — Accepted! Congratulations!');
    fireConfetti(s.color, s.accent);
  } else if (result === 'waitlisted') {
    toast(s.short + ' — Waitlisted. Hang in there.');
  } else {
    toast(s.short + ' — Denied. Onward.');
  }
}

/* =============== Confetti =============== */
function fireConfetti(color1, color2) {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = [color1, color2 || '#D4AF37', '#FFD700', '#FFFFFF', color1 + 'CC'];
  const particles = [];
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - .5) * 400,
      y: canvas.height / 2 - 100,
      vx: (Math.random() - .5) * 18,
      vy: -(Math.random() * 14 + 4),
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotVel: (Math.random() - .5) * 12,
      gravity: .25 + Math.random() * .1,
      opacity: 1,
    });
  }
  let frame = 0;
  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.vx *= .99;
      p.rotation += p.rotVel;
      if (frame > 60) p.opacity -= .012;
      if (p.opacity <= 0) return;
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive > 0 && frame < 300) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

/* =============== Kanban Decision Styling =============== */
const _origRenderKanban = typeof renderKanban === 'function' ? renderKanban : null;

// Patch renderKanban to add decision classes after render
function patchKanbanCards() {
  document.querySelectorAll('.kcard').forEach(card => {
    const id = card.dataset?.id || card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (!id) return;
    const app = USER_APPS.find(a => a.id === id);
    if (!app || !app.decision) {
      const dbDec = DB_DECISIONS[id];
      if (dbDec) { if (app) app.decision = dbDec.result; }
    }
    if (app?.decision === 'accepted') card.classList.add('decision-accepted');
    else if (app?.decision === 'denied') card.classList.add('decision-denied');
    else if (app?.decision === 'waitlisted') card.classList.add('decision-waitlisted');
  });
}

/* =============== init =============== */
document.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  normalizeExploreFilterDefaults();
  initSettings();
  addGpaRow(); // start with one empty course row
  window.addEventListener('resize', () => {
    renderExploreGlobePreview();
    renderModalGlobe();
  });
  setTimeout(function() {
    if (!CURRENT_USER && !document.getElementById('authModal')?.classList.contains('active')) {
      maybeShowSignedOutHelp();
    }
  }, 1200);

  // Auto-login if session exists
  const hasSession = await checkSession();
  if (hasSession) {
    await onAuthSuccess();
  } else {
    resetPersonalWorkspace();
    await loadSchoolsFromDB();
    renderWorkspaceViews();
    document.querySelectorAll('.ac-swatch').forEach(s => {
      s.classList.toggle('selected', s.dataset.color === USER_PROFILE.avatarColor);
    });
    maybeShowSignedOutHelp();
  }
  [0, 250].forEach(delay => {
    setTimeout(() => {
      normalizeExploreFilterDefaults();
      renderTabs();
      renderSchoolGrid();
    }, delay);
  });
});

/* ================================================================
   DOCUMENT VAULT — verified toggle
   ================================================================ */
function toggleDocVerified(checkEl) {
  const card = checkEl.closest('.vault-card');
  if (!card) return;
  const isVerified = card.classList.toggle('verified');
  const icon = card.querySelector('.vc-icon');
  if (icon) {
    icon.classList.toggle('pending-icon', !isVerified);
    icon.classList.toggle('verified-icon', isVerified);
  }
  if (isVerified) toast('Marked as received!');
}

/* ================================================================
   TRANSFER GPA CALCULATOR
   ================================================================ */
let GPA_ROW_ID = 0;

function addGpaRow() {
  const container = document.getElementById('gpaRows');
  if (!container) return;
  const id = GPA_ROW_ID++;
  const row = document.createElement('div');
  row.className = 'gpa-row';
  row.dataset.gpaRow = id;
  row.innerHTML = `
    <input type="text" placeholder="Course name" style="font-size:.82rem;"/>
    <input type="number" min="0" max="6" step=".5" placeholder="Credits" onchange="calcTransferGPA()" style="font-size:.82rem;"/>
    <select onchange="calcTransferGPA()" style="font-size:.82rem;">
      <option value="" selected>Grade</option>
      <option value="4.0">A</option><option value="3.7">A-</option>
      <option value="3.3">B+</option><option value="3.0">B</option><option value="2.7">B-</option>
      <option value="2.3">C+</option><option value="2.0">C</option><option value="1.7">C-</option>
      <option value="1.0">D</option><option value="0.0">F</option>
    </select>
    <button onclick="this.parentElement.remove(); calcTransferGPA();" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:.9rem;">✕</button>
  `;
  container.appendChild(row);
}

function calcTransferGPA() {
  const rows = document.querySelectorAll('#gpaRows .gpa-row');
  let totalPoints = 0, totalCredits = 0;
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const sel = row.querySelector('select');
    const credits = parseFloat(inputs[1]?.value) || 0;
    const grade = parseFloat(sel?.value) || 0;
    if (credits > 0) {
      totalPoints += credits * grade;
      totalCredits += credits;
    }
  });
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '—';
  const resEl = document.getElementById('gpaCalcResult');
  const credEl = document.getElementById('gpaTotalCredits');
  if (resEl) resEl.textContent = gpa;
  if (credEl) credEl.textContent = totalCredits;
  // Color the GPA based on competitiveness
  if (resEl && gpa !== '—') {
    const v = parseFloat(gpa);
    resEl.style.color = v >= 3.5 ? 'var(--success)' : v >= 3.0 ? 'var(--warning)' : 'var(--danger)';
  }
}

/* =========================================================
   INSIGHTS — Fit Estimator · Summary Stats · GPA Distribution
   ========================================================= */

// Helper — only schools that actually have a GPA value
function _schoolsWithGpa() {
  return SCHOOLS.filter(s => typeof s.gpa === 'number' && !isNaN(s.gpa));
}
function _schoolsWithMinGpa() {
  return SCHOOLS.filter(s => typeof s.minGpa === 'number' && !isNaN(s.minGpa));
}

// ---- Feature 1: GPA Fit Estimator (now with optional major filter) ----

// Build the unique set of majors across the SCHOOLS array.
function _allMajors() {
  const set = new Set();
  SCHOOLS.forEach(s => (s.majors || []).forEach(m => { if (m) set.add(m); }));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Populate the Major <select> on the Fit Estimator. Idempotent — preserves
// the user's current selection when called repeatedly.
function populateFitMajorOptions() {
  const sel = document.getElementById('fitMajorInput');
  if (!sel) return;
  const current = sel.value;
  const majors = _allMajors();
  // Skip rebuild if the option count already matches (cheap idempotency check)
  if (sel.options.length === majors.length + 1) return;
  sel.innerHTML = '<option value="">Any major</option>'
    + majors.map(m => `<option value="${_esc(m)}">${_esc(m)}</option>`).join('');
  if (current) sel.value = current;
}

// Hide/show the Recommended body without losing input state.
function toggleFitSection() {
  const body = document.getElementById('fitBody');
  const btn  = document.getElementById('fitToggleBtn');
  if (!body || !btn) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? '' : 'none';
  btn.textContent = isHidden ? 'Hide' : 'Show';
}

function runFitEstimator(e) {
  if (e) e.preventDefault();
  const inp = document.getElementById('fitGpaInput');
  const majorSel = document.getElementById('fitMajorInput');
  const errEl = document.getElementById('fitError');
  const metaEl = document.getElementById('fitMeta');
  const results = document.getElementById('fitResults');
  errEl.style.display = 'none';
  errEl.textContent = '';

  const userGpa = parseFloat(inp.value);
  if (isNaN(userGpa) || userGpa < 0 || userGpa > 4.5) {
    errEl.textContent = 'Please enter a GPA between 0.00 and 4.50.';
    errEl.style.display = 'block';
    results.style.display = 'none';
    if (metaEl) metaEl.style.display = 'none';
    return;
  }

  const major = (majorSel && majorSel.value) ? majorSel.value : '';

  // Filter the candidate pool: must have a GPA, and if a major was chosen,
  // the school's majors[] array must include it.
  let pool = _schoolsWithGpa();
  if (major) {
    pool = pool.filter(s => Array.isArray(s.majors) && s.majors.includes(major));
  }

  // Tier rules (user GPA vs school minimum):
  //   Safety: user is comfortably above (>= +0.30)
  //   Match : user is at or just above  (-0.05 to <+0.30)
  //   Reach : user is below             (< -0.05)
  const safety = [], match = [], reach = [];
  pool.forEach(s => {
    const diff = userGpa - s.gpa;
    if (diff >= 0.30)       safety.push(s);
    else if (diff >= -0.05) match.push(s);
    else                    reach.push(s);
  });

  // Sort each tier by school min GPA (most competitive first)
  const byGpa = (a, b) => b.gpa - a.gpa;
  safety.sort(byGpa); match.sort(byGpa); reach.sort(byGpa);

  _renderFitTier('Safety', safety, major);
  _renderFitTier('Match',  match,  major);
  _renderFitTier('Reach',  reach,  major);

  // Footer meta — total considered + caveat when nothing matched
  if (metaEl) {
    const total = safety.length + match.length + reach.length;
    let msg = `Bucketed ${total} school${total === 1 ? '' : 's'}`;
    if (major) msg += ` offering ${major}`;
    msg += ` against a GPA of ${userGpa.toFixed(2)}.`;
    if (major && total === 0) {
      msg += ' Try a different major or clear the filter.';
    }
    metaEl.textContent = msg;
    metaEl.style.display = 'block';
  }

  results.style.display = 'block';
}

function _renderFitTier(tierName, schools, selectedMajor) {
  const list = document.getElementById('fitList' + tierName);
  const count = document.getElementById('fitCount' + tierName);
  count.textContent = schools.length;
  if (schools.length === 0) {
    const why = selectedMajor
      ? `No schools in this tier offer ${_esc(selectedMajor)}.`
      : 'No schools in this tier.';
    list.innerHTML = `<div class="fit-tier-empty">${why}</div>`;
    return;
  }
  list.innerHTML = schools.map(s => {
    const loc = `${_esc(s.location || '')}${s.location && s.state ? ', ' : ''}${_esc(s.state || '')}`;
    return `
      <div class="fit-school-card">
        <div style="min-width:0;">
          <div class="fit-school-card-name">${_esc(s.name)}</div>
          <div class="fit-school-card-loc">${loc}</div>
        </div>
        <div class="fit-school-card-gpa">${_esc(gpaLabel(s))}: ${formatGpa(s)}</div>
      </div>
    `;
  }).join('');
}

function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ---- Feature 2: Summary Stats Panel ----
function renderStatsPanel() {
  const grid = document.getElementById('statGrid');
  if (!grid) return;

  const all      = SCHOOLS;
  const withGpa  = _schoolsWithMinGpa();

  // Aggregates
  const totalSchools = all.length;
  const avgGpa = withGpa.length
    ? (withGpa.reduce((a, s) => a + s.minGpa, 0) / withGpa.length).toFixed(2)
    : '—';

  let highest = null, lowest = null;
  withGpa.forEach(s => {
    if (!highest || s.minGpa > highest.minGpa) highest = s;
    if (!lowest  || s.minGpa < lowest.minGpa)  lowest  = s;
  });

  // Spring transfers — derived from deadlineType containing "Spring" or "Rolling"
  const springCount = all.filter(s => {
    const d = (s.deadlineType || '').toLowerCase();
    return d.includes('spring') || d.includes('rolling');
  }).length;

  // CC articulation — uses curated cc flag (true for CA + a few partner schools like Cornell)
  const ccCount = all.filter(s => s.cc === true).length;

  const cards = [
    {
      label: 'Schools tracked',
      value: totalSchools.toLocaleString(),
      sub: 'In the catalogue right now'
    },
    {
      label: 'Average min GPA',
      value: avgGpa,
      sub: 'Mean of every school with a published minimum'
    },
    {
      label: 'Highest min GPA',
      value: highest ? formatMinGpa(highest) : '—',
      sub: highest ? highest.name : 'No data'
    },
    {
      label: 'Lowest min GPA',
      value: lowest ? formatMinGpa(lowest) : '—',
      sub: lowest ? lowest.name : 'No data'
    },
    {
      label: 'Accept spring transfers',
      value: springCount.toLocaleString(),
      sub: `Out of ${totalSchools} schools`
    },
    {
      label: 'CC articulation contracts',
      value: ccCount.toLocaleString(),
      sub: `Out of ${totalSchools} schools`
    },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-card-label">${_esc(c.label)}</div>
      <div class="stat-card-value">${_esc(c.value)}</div>
      <div class="stat-card-sub">${_esc(c.sub)}</div>
    </div>
  `).join('');
}

// ---- Feature 3: GPA Distribution Chart ----
let _gpaChartInstance = null;

function _gpaTierColor(gpa) {
  // Returns [bg, border] CSS color strings for each tier.
  // We resolve CSS variables at runtime so it follows light/dark theme.
  const cs = getComputedStyle(document.documentElement);
  const get = name => cs.getPropertyValue(name).trim() || '#888';
  if (gpa >= 3.7)  return [get('--alert'),   get('--alert-ink')];   // competitive
  if (gpa >= 3.3)  return [get('--warning'), get('--warning-ink')]; // moderate
  return              [get('--success'), get('--success-ink')];     // accessible
}

function renderGpaChart() {
  const canvas = document.getElementById('gpaChartCanvas');
  if (!canvas || typeof Chart === 'undefined') return;

  // Sort highest GPA first (top of chart since y axis is reversed)
  const sorted = _schoolsWithMinGpa().slice().sort((a, b) => b.minGpa - a.minGpa);

  const labels = sorted.map(s => s.short || s.name);
  const data   = sorted.map(s => s.minGpa);
  const colors = sorted.map(s => _gpaTierColor(s.minGpa));
  const bgs    = colors.map(c => c[0]);
  const borders = colors.map(c => c[1]);

  // Resize canvas wrapper based on count so each bar gets ~22px of vertical space
  const wrap = document.getElementById('gpaChartWrap');
  if (wrap) {
    const h = Math.max(600, sorted.length * 22 + 80);
    wrap.style.height = h + 'px';
  }

  const cs = getComputedStyle(document.documentElement);
  const gridColor = cs.getPropertyValue('--border').trim() || '#ddd';
  const tickColor = cs.getPropertyValue('--text-secondary').trim() || '#444';

  if (_gpaChartInstance) {
    _gpaChartInstance.destroy();
    _gpaChartInstance = null;
  }

  _gpaChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Min transfer GPA',
        data,
        backgroundColor: bgs,
        borderColor: borders,
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Min GPA: ${ctx.parsed.x.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: false,
          min: 2.0,
          max: 4.0,
          title: { display: true, text: 'Minimum transfer GPA', color: tickColor },
          grid: { color: gridColor },
          ticks: { color: tickColor, stepSize: 0.2 }
        },
        y: {
          grid: { display: false },
          ticks: { color: tickColor, font: { size: 11 } }
        }
      }
    }
  });
}
