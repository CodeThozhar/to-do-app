document.addEventListener('DOMContentLoaded', () => {

    // --- 1. STATE & DATA STORES ---
    let currentUser = null;
    let tasks = [];
    let projects = [];
    let routines = [];

    // --- LOGO COMPONENT ---
    const nexoraLogoSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="nexora-logo-symbol" style="width: 1.5em; height: 1.5em; display: inline-block; vertical-align: middle; flex-shrink: 0;">
      <rect x="3" y="3" width="5" height="18" rx="1.5" fill="var(--text-primary)" stroke="none"/>
      <rect x="16" y="3" width="5" height="18" rx="1.5" fill="var(--accent-color, #2563eb)" stroke="none"/>
      <path d="M3 3 L21 21 L16 21 L3 8 Z" fill="var(--text-primary)" opacity="0.85" stroke="none" />
    </svg>
    `;

    function injectLogo() {
        document.querySelectorAll('.brand').forEach(el => {
            if (!el.querySelector('.nexora-logo-symbol')) {
                el.insertAdjacentHTML('afterbegin', nexoraLogoSVG);
            }
        });

        document.querySelectorAll('.brand-large').forEach(el => {
            if (!el.querySelector('.nexora-logo-symbol')) {
                const content = el.innerHTML;
                el.innerHTML = `
                    <div style="display: flex; align-items: flex-start; justify-content: center; gap: 0.75rem;">
                        <div style="font-size: 1.5rem; margin-top: 0.1rem;">${nexoraLogoSVG}</div>
                        <div style="text-align: left;">
                            ${content}
                        </div>
                    </div>
                `;
            }
        });
    }

    // Inject immediately
    injectLogo();

    // --- BULK SELECTION STATE ---
    let selectionMode = {
        active: false,
        entity: null // 'tasks', 'projects', 'routines'
    };
    let selectedIds = new Set();

    function getBulkCheckboxHTML(id, entity) {
        if (!selectionMode.active || selectionMode.entity !== entity) return '';
        const isChecked = selectedIds.has(id);
        return `
            <label class="bulk-select-wrapper" style="margin-right: 0.75rem;" onclick="event.stopPropagation()">
                <input type="checkbox" class="bulk-select-checkbox" data-id="${id}" data-entity="${entity}" ${isChecked ? 'checked' : ''}>
                <span class="custom-bulk-checkbox">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
            </label>
        `;
    }

    // --- BULK SELECTION LOGIC ---
    function toggleSelectionMode(entity) {
        selectionMode.active = true;
        selectionMode.entity = entity;
        selectedIds.clear();

        document.getElementById(`bulk-actions-${entity}`).classList.remove('hidden');
        document.querySelector(`.btn-select-mode[data-entity="${entity}"]`).style.display = 'none';

        const container = getEntityContainer(entity);
        if (container) container.classList.add('selection-mode-active');

        reRenderEntity(entity);
        updateBulkActionBar(entity);
    }

    function cancelSelectionMode(entity) {
        selectionMode.active = false;
        selectionMode.entity = null;
        selectedIds.clear();

        document.getElementById(`bulk-actions-${entity}`).classList.add('hidden');
        document.querySelector(`.btn-select-mode[data-entity="${entity}"]`).style.display = 'block';

        const container = getEntityContainer(entity);
        if (container) container.classList.remove('selection-mode-active');

        reRenderEntity(entity);
    }

    function getEntityContainer(entity) {
        if (entity === 'tasks') return document.getElementById('task-list');
        if (entity === 'projects') return document.getElementById('projects-grid');
        if (entity === 'routines') return document.getElementById('routines-list');
        return null;
    }

    function reRenderEntity(entity) {
        if (entity === 'tasks') renderTasks();
        if (entity === 'projects') renderProjects();
        if (entity === 'routines') renderRoutines();
    }

    function updateBulkActionBar(entity) {
        const countStr = document.getElementById(`selection-count-${entity}`);
        const deleteBtn = document.querySelector(`.btn-delete-selected[data-entity="${entity}"]`);
        const selectAllBtn = document.querySelector(`.btn-select-all[data-entity="${entity}"]`);

        const size = selectedIds.size;
        if (countStr) countStr.textContent = size === 1 ? '1 selected' : `${size} selected`;

        if (deleteBtn) {
            deleteBtn.disabled = size === 0;
            deleteBtn.textContent = size > 0 ? `Delete Selected (${size})` : 'Delete Selected';
        }

        const visibleIds = getVisibleIds(entity);
        if (selectAllBtn) {
            const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
            selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
        }
    }

    function getVisibleIds(entity) {
        const ids = [];
        const container = getEntityContainer(entity);
        if (!container) return ids;

        const checkboxes = container.querySelectorAll('.bulk-select-checkbox');
        checkboxes.forEach(cb => {
            ids.push(Number(cb.dataset.id));
        });
        return ids;
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('bulk-select-checkbox')) {
            const id = Number(e.target.dataset.id);
            const entity = e.target.dataset.entity;

            if (e.target.checked) {
                selectedIds.add(id);
            } else {
                selectedIds.delete(id);
            }
            updateBulkActionBar(entity);
        }
    });

    // We attach the click listener to document body to ensure it catches events reliably
    document.body.addEventListener('click', (e) => {
        const selectModeBtn = e.target.closest('.btn-select-mode');
        if (selectModeBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleSelectionMode(selectModeBtn.dataset.entity);
            return;
        }

        const cancelSelectBtn = e.target.closest('.btn-cancel-select');
        if (cancelSelectBtn) {
            e.preventDefault();
            e.stopPropagation();
            cancelSelectionMode(cancelSelectBtn.dataset.entity);
            return;
        }

        const selectAllBtn = e.target.closest('.btn-select-all');
        if (selectAllBtn) {
            e.preventDefault();
            e.stopPropagation();
            const entity = selectAllBtn.dataset.entity;
            const visibleIds = getVisibleIds(entity);
            const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

            if (allSelected) {
                visibleIds.forEach(id => selectedIds.delete(id));
            } else {
                visibleIds.forEach(id => selectedIds.add(id));
            }
            reRenderEntity(entity);
            updateBulkActionBar(entity);
            return;
        }

        const deleteSelectedBtn = e.target.closest('.btn-delete-selected');
        if (deleteSelectedBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (deleteSelectedBtn.disabled) return;
            const entity = deleteSelectedBtn.dataset.entity;
            const count = selectedIds.size;

            const entityNamePlural = entity === 'tasks' ? 'tasks' : (entity === 'projects' ? 'projects' : 'routines');
            const entityNameSingular = entity === 'tasks' ? 'task' : (entity === 'projects' ? 'project' : 'routine');
            const entityName = count === 1 ? entityNameSingular : entityNamePlural;
            
            document.getElementById('confirm-title').textContent = `Delete ${count === 1 ? '' : count + ' '}${entityName}?`;
            document.getElementById('confirm-message').textContent = `You are about to delete ${count} ${entityName}. This action cannot be undone.`;
            
            const btnEntityText = entityName.charAt(0).toUpperCase() + entityName.slice(1);
            document.getElementById('confirm-submit-btn').textContent = count === 1 ? `Delete ${btnEntityText}` : `Delete ${count} ${btnEntityText}`;
            
            itemToDelete = { type: 'bulk-' + entity, id: null };
            openModal('confirm');
            return;
        }
    });

    let currentFilter = 'All'; // 'All', 'Active', 'Completed'
    let searchQuery = '';
    let itemToDelete = null; // { type, id }
    let currentProjectId = null;

    // --- 2. DOM ELEMENTS ---
    // Layouts
    const authLayout = document.getElementById('auth-layout');
    const appLayout = document.getElementById('app-layout');
    const views = {
        tasks: document.getElementById('view-tasks'),
        projects: document.getElementById('view-projects'),
        calendar: document.getElementById('view-calendar'),
        routines: document.getElementById('view-routines'),
        settings: document.getElementById('view-settings'),
        'project-detail': document.getElementById('view-project-detail')
    };

    // Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Tasks UI
    const taskInput = document.getElementById('new-task-input');
    const taskProjectSelect = document.getElementById('new-task-project');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statRemaining = document.getElementById('stat-remaining');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Grids & Lists
    const projectsGrid = document.getElementById('projects-grid');
    const routinesList = document.getElementById('routines-list');

    // Modals
    const modals = {
        task: document.getElementById('task-modal'),
        project: document.getElementById('project-modal'),
        routine: document.getElementById('routine-modal'),
        confirm: document.getElementById('confirm-modal')
    };

    // Auth & Settings
    const viewWelcome = document.getElementById('view-welcome');
    const viewSignin = document.getElementById('view-signin');
    const viewSignup = document.getElementById('view-signup');
    const viewReset = document.getElementById('view-reset');
    const toastContainer = document.getElementById('toast-container');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const btnSignout = document.getElementById('btn-signout');

    // --- 3. DATA PERSISTENCE ---
    function loadData() {
        try {
            currentUser = JSON.parse(localStorage.getItem('nexoraUser'));

            const allTasks = JSON.parse(localStorage.getItem('nexoraTasks')) || [];
            const allProjects = JSON.parse(localStorage.getItem('nexoraProjects')) || [];
            const allRoutines = JSON.parse(localStorage.getItem('nexoraRoutines')) || [];

            if (currentUser) {
                tasks = allTasks.filter(t => t.userId === currentUser.email);
                projects = allProjects.filter(p => p.userId === currentUser.email);
                routines = allRoutines.filter(r => r.userId === currentUser.email);
            } else {
                tasks = []; projects = []; routines = [];
            }
        } catch (e) {
            console.error('Error loading data', e);
            tasks = []; projects = []; routines = [];
        }
    }

    function saveData(key, data) {
        if (!currentUser) return;
        try {
            const allData = JSON.parse(localStorage.getItem(key)) || [];
            const otherUsersData = allData.filter(item => item.userId !== currentUser.email);
            localStorage.setItem(key, JSON.stringify([...otherUsersData, ...data]));
        } catch (e) {
            console.error('Error saving data', e);
        }
    }

    // --- 4. AUTHENTICATION LOGIC ---
    function initAuth() {
        if (currentUser) {
            authLayout.classList.add('hidden');
            appLayout.classList.remove('hidden');

            const name = currentUser.name || 'User';
            document.getElementById('sidebar-user-name').textContent = name;
            document.getElementById('sidebar-user-email').textContent = currentUser.email;
            document.getElementById('sidebar-user-avatar').textContent = name.charAt(0).toUpperCase();
            document.getElementById('settings-user-name').textContent = name;
            document.getElementById('settings-user-email').textContent = currentUser.email;

            populateTaskProjectSelect();
            handleRoute();
        } else {
            authLayout.classList.remove('hidden');
            appLayout.classList.add('hidden');
            viewWelcome.classList.remove('hidden');
        }
    }

    // Auth Listeners
    document.getElementById('btn-goto-signin').addEventListener('click', () => { viewWelcome.classList.add('hidden'); viewSignin.classList.remove('hidden'); });
    document.getElementById('btn-goto-signup').addEventListener('click', () => { viewWelcome.classList.add('hidden'); viewSignup.classList.remove('hidden'); });

    // Back Buttons
    document.getElementById('btn-back-signin').addEventListener('click', () => { viewSignin.classList.add('hidden'); viewWelcome.classList.remove('hidden'); });
    document.getElementById('btn-back-signup').addEventListener('click', () => { viewSignup.classList.add('hidden'); viewWelcome.classList.remove('hidden'); });
    document.getElementById('btn-back-reset').addEventListener('click', () => { viewReset.classList.add('hidden'); viewSignin.classList.remove('hidden'); });

    // Link toggles
    document.getElementById('link-goto-signup').addEventListener('click', (e) => { e.preventDefault(); viewSignin.classList.add('hidden'); viewSignup.classList.remove('hidden'); });
    document.getElementById('link-goto-signin').addEventListener('click', (e) => { e.preventDefault(); viewSignup.classList.add('hidden'); viewSignin.classList.remove('hidden'); });
    document.getElementById('link-goto-forgot').addEventListener('click', (e) => { e.preventDefault(); viewSignin.classList.add('hidden'); viewReset.classList.remove('hidden'); });

    // Google Auth Implementation
    document.querySelectorAll('.btn-google-login').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Google Login Button Clicked!");
            if (window.firebaseSignInGoogle) {
                console.log("Calling window.firebaseSignInGoogle...");
                window.firebaseSignInGoogle();
            } else {
                console.warn("window.firebaseSignInGoogle is not defined.");
                showToast('Google sign-in is initializing...');
            }
        });
    });

    function showToast(message) {
        toastContainer.textContent = message;
        toastContainer.classList.remove('hidden');
        toastContainer.style.opacity = '1';
        setTimeout(() => {
            toastContainer.style.opacity = '0';
            setTimeout(() => toastContainer.classList.add('hidden'), 300);
        }, 3000);
    }

    document.getElementById('signin-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;
        const errorEl = document.getElementById('signin-error');

        if (!email || !password) {
            errorEl.textContent = 'Please fill out all fields.';
            errorEl.classList.remove('hidden');
            return;
        }

        const users = JSON.parse(localStorage.getItem('nexoraUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            errorEl.classList.add('hidden');
            currentUser = { email: user.email, name: user.name };
            localStorage.setItem('nexoraUser', JSON.stringify(currentUser));

            document.getElementById('signin-email').value = '';
            document.getElementById('signin-password').value = '';

            loadData();
            initAuth();
        } else {
            errorEl.textContent = 'Invalid email or password.';
            errorEl.classList.remove('hidden');
        }
    });

    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-password-confirm').value;
        const errorEl = document.getElementById('signup-error');

        if (!name || !email || !password || !confirmPassword) {
            errorEl.textContent = 'Please fill out all fields.';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.classList.remove('hidden');
            return;
        }

        const users = JSON.parse(localStorage.getItem('nexoraUsers')) || [];
        if (users.find(u => u.email === email)) {
            errorEl.textContent = 'An account with this email already exists.';
            errorEl.classList.remove('hidden');
            return;
        }

        users.push({ name, email, password });
        localStorage.setItem('nexoraUsers', JSON.stringify(users));

        errorEl.classList.add('hidden');

        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-password-confirm').value = '';

        viewSignup.classList.add('hidden');
        viewSignin.classList.remove('hidden');
    });

    // Reset Password Logic
    document.getElementById('reset-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value.trim();
        const password = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-password-confirm').value;
        const errorEl = document.getElementById('reset-error');
        const successEl = document.getElementById('reset-success');

        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');

        if (!email || !password || !confirmPassword) {
            errorEl.textContent = 'Please fill out all fields.';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.classList.remove('hidden');
            return;
        }

        const users = JSON.parse(localStorage.getItem('nexoraUsers')) || [];
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            errorEl.textContent = 'Invalid email or password.'; // Keeps validation ambiguous
            errorEl.classList.remove('hidden');
            return;
        }

        // Update password
        users[userIndex].password = password;
        localStorage.setItem('nexoraUsers', JSON.stringify(users));

        successEl.textContent = 'Password reset successful!';
        successEl.classList.remove('hidden');

        // Clear fields and return to sign in after delay
        setTimeout(() => {
            document.getElementById('reset-email').value = '';
            document.getElementById('reset-password').value = '';
            document.getElementById('reset-password-confirm').value = '';
            successEl.classList.add('hidden');
            viewReset.classList.add('hidden');
            viewSignin.classList.remove('hidden');
        }, 1500);
    });

    btnSignout.addEventListener('click', async () => {
        if (window.firebaseSignOut) {
            try {
                await window.firebaseSignOut();
            } catch(e) {
                console.error("Firebase Signout Error", e);
            }
        }
        currentUser = null;
        localStorage.removeItem('nexoraUser');
        loadData(); // clear memory
        initAuth();
        history.pushState(null, '', window.location.pathname);
    });

    // --- 5. FRONTEND ROUTER ---
    function navigateTo(target, pushState = true) {
        if (!currentUser && target !== 'welcome') {
            initAuth();
            viewWelcome.classList.add('hidden');
            viewSignup.classList.add('hidden');
            if (viewReset) viewReset.classList.add('hidden');
            viewSignin.classList.remove('hidden');
            return;
        }

        if (selectionMode.active && selectionMode.entity) cancelSelectionMode(selectionMode.entity);

        if (!views[target]) target = 'tasks';

        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[target].classList.remove('hidden');

        navItems.forEach(item => {
            if (item.dataset.target === target) item.classList.add('active');
            else item.classList.remove('active');
        });

        if (target === 'tasks') { renderTasks(); }
        else if (target === 'projects') { renderProjects(); }
        else if (target === 'routines') { renderRoutines(); }
        else if (target === 'project-detail') { renderProjectDetail(); }
        else if (target === 'calendar') { renderCalendar(); }

        closeSidebar();
        if (pushState) history.pushState({ view: target }, '', `#${target}`);
    }

    function handleRoute() {
        const hash = window.location.hash.replace('#', '');
        if (views[hash]) navigateTo(hash, false);
        else navigateTo('tasks', false);
    }
    window.addEventListener('popstate', () => { if (currentUser) handleRoute(); });

    // Sidebar navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            if (target) navigateTo(target);
        });
    });

    // --- 6. UI UTILITIES ---
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('nexora_theme', 'light'); }
            else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('nexora_theme', 'dark'); }
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- 7. MODAL MANAGEMENT ---
    function openModal(modalId) {
        const modal = modals[modalId];
        if (modal) {
            modal.classList.remove('hidden');
            const input = modal.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }

    function closeModal(modalId) {
        const modal = modals[modalId];
        if (modal) {
            modal.classList.add('hidden');
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                const hiddenId = form.querySelector('input[type="hidden"]');
                if (hiddenId) hiddenId.value = '';
            }
        }
    }

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) closeModal(modalId.replace('-modal', ''));
        });
    });

    function confirmDelete(type, id) {
        itemToDelete = { type, id };

        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const submitBtn = document.getElementById('confirm-submit-btn');

        if (type === 'task') {
            const t = tasks.find(x => x.id === id);
            titleEl.textContent = `Delete task?`;
            messageEl.textContent = t ? `Are you sure you want to delete "${t.title}"?` : `Are you sure you want to delete this task? This action cannot be undone.`;
            submitBtn.textContent = 'Delete Task';
        } else if (type === 'project') {
            const p = projects.find(x => x.id === id);
            titleEl.textContent = `Delete project?`;
            messageEl.textContent = p ? `Are you sure you want to delete "${p.name}"?` : `Are you sure you want to delete this project?`;
            submitBtn.textContent = 'Delete Project';
        } else if (type === 'routine') {
            const r = routines.find(x => x.id === id);
            titleEl.textContent = `Delete routine?`;
            messageEl.textContent = r ? `Are you sure you want to delete "${r.name}"?` : `Are you sure you want to delete this routine?`;
            submitBtn.textContent = 'Delete Routine';
        } else {
            titleEl.textContent = 'Are you sure?';
            messageEl.textContent = 'This action cannot be undone.';
            submitBtn.textContent = 'Delete';
        }

        openModal('confirm');
    }

    document.getElementById('confirm-submit-btn').addEventListener('click', () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'task') {
            tasks = tasks.filter(t => t.id !== itemToDelete.id);
            saveData('nexoraTasks', tasks);
            renderTasks();
            if (currentProjectId) renderProjectDetail();
            updateTaskStats();
            showToast('Task deleted');
        } else if (itemToDelete.type === 'project') {
            projects = projects.filter(p => p.id !== itemToDelete.id);
            // Unlink tasks from deleted project
            tasks.forEach(t => { if (t.projectId === itemToDelete.id) t.projectId = null; });
            saveData('nexoraProjects', projects);
            saveData('nexoraTasks', tasks);
            populateTaskProjectSelect();
            renderProjects();
            showToast('Project deleted');
        } else if (itemToDelete.type === 'routine') {
            routines = routines.filter(r => r.id !== itemToDelete.id);
            saveData('nexoraRoutines', routines);
            renderRoutines();
            showToast('Routine deleted');
        } else if (itemToDelete.type.startsWith('bulk-')) {
            const entity = itemToDelete.type.replace('bulk-', '');

            if (entity === 'tasks') {
                tasks = tasks.filter(t => !selectedIds.has(t.id));
                saveData('nexoraTasks', tasks);
                updateTaskStats();
            } else if (entity === 'projects') {
                projects = projects.filter(p => !selectedIds.has(p.id));
                tasks.forEach(t => { if (selectedIds.has(t.projectId)) t.projectId = null; });
                saveData('nexoraProjects', projects);
                saveData('nexoraTasks', tasks);
                populateTaskProjectSelect();
            } else if (entity === 'routines') {
                routines = routines.filter(r => !selectedIds.has(r.id));
                saveData('nexoraRoutines', routines);
            }

            const deletedCount = selectedIds.size;
            cancelSelectionMode(entity);
            showToast(`${deletedCount} ${entity} deleted`);
        }

        closeModal('confirm');
        itemToDelete = null;
    });


    // --- 8. TASK MANAGEMENT CORE ---
    function populateTaskProjectSelect() {
        taskProjectSelect.innerHTML = '<option value="">No project</option>';
        const editTaskProjectSelect = document.getElementById('task-project');
        if (editTaskProjectSelect) editTaskProjectSelect.innerHTML = '<option value="">No project</option>';

        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            taskProjectSelect.appendChild(opt);

            if (editTaskProjectSelect) {
                const opt2 = document.createElement('option');
                opt2.value = p.id;
                opt2.textContent = p.name;
                editTaskProjectSelect.appendChild(opt2);
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (searchQuery) clearSearchBtn.classList.remove('hidden');
        else clearSearchBtn.classList.add('hidden');
        renderTasks();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchQuery = ''; searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus(); renderTasks();
    });

    function addTask() {
        const title = taskInput.value.trim();
        if (!title) {
            showToast('Please enter a task.');
            return taskInput.focus();
        }

        const taskExists = tasks.some(t => t.title.toLowerCase() === title.toLowerCase());
        if (taskExists) {
            showToast('Task already exists.');
            return taskInput.focus();
        }

        const projectId = taskProjectSelect.value ? Number(taskProjectSelect.value) : null;
        const priority = document.getElementById('new-task-priority').value || 'medium';
        const dueDate = document.getElementById('new-task-date').value || null;

        tasks.push({
            id: Date.now(),
            title: title,
            completed: false,
            projectId: projectId,
            priority: priority,
            dueDate: dueDate,
            userId: currentUser.email
        });
        saveData('nexoraTasks', tasks);

        taskInput.value = '';
        taskProjectSelect.value = '';
        document.getElementById('new-task-priority').value = 'medium';
        document.getElementById('new-task-date').value = '';
        taskInput.focus();

        renderTasks();
        showToast('Task created');
    }
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } });

    const toggleTaskOptionsBtn = document.getElementById('toggle-task-options-btn');
    const advancedTaskOptions = document.getElementById('advanced-task-options');

    if (toggleTaskOptionsBtn && advancedTaskOptions) {
        toggleTaskOptionsBtn.addEventListener('click', () => {
            const isHidden = advancedTaskOptions.classList.contains('hidden');
            if (isHidden) {
                advancedTaskOptions.classList.remove('hidden');
                toggleTaskOptionsBtn.setAttribute('aria-expanded', 'true');
                toggleTaskOptionsBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Hide options
                `;
            } else {
                advancedTaskOptions.classList.add('hidden');
                toggleTaskOptionsBtn.setAttribute('aria-expanded', 'false');
                toggleTaskOptionsBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                    More options
                `;
            }
        });
    }

    function renderTasks() {
        taskList.innerHTML = '';
        let filtered = tasks;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(task => task.title.toLowerCase().includes(query));
        }

        if (currentFilter === 'Active') filtered = filtered.filter(task => !task.completed);
        else if (currentFilter === 'Completed') filtered = filtered.filter(task => task.completed);

        const sortSelect = document.getElementById('task-sort');
        const sortValue = sortSelect ? sortSelect.value : 'newest';

        filtered.sort((a, b) => {
            if (sortValue === 'newest') return b.id - a.id;
            if (sortValue === 'oldest') return a.id - b.id;
            if (sortValue === 'due-date') {
                if (!a.dueDate && !b.dueDate) return b.id - a.id;
                if (!a.dueDate) return 1; // items without due date go at the end
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            }
            if (sortValue === 'priority') {
                const pMap = { high: 3, medium: 2, low: 1 };
                const pA = pMap[a.priority] || 0;
                const pB = pMap[b.priority] || 0;
                if (pA !== pB) return pB - pA;
                return b.id - a.id;
            }
            return 0;
        });

        if (tasks.length === 0) return showTaskEmptyState("No tasks yet", "Add your first task and get started.");
        if (filtered.length === 0) {
            if (searchQuery) return showTaskEmptyState("No matching tasks", "Try a different search term.");
            if (currentFilter === 'Active') return showTaskEmptyState("No active tasks", "You're all caught up! 🎉");
            if (currentFilter === 'Completed') return showTaskEmptyState("No completed tasks yet", "");
        }

        emptyState.classList.add('hidden');
        taskList.style.display = 'flex';

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-row ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            const safeTitle = escapeHTML(task.title);

            let metaItems = [];
            if (task.projectId) {
                const proj = projects.find(p => p.id === task.projectId);
                if (proj) metaItems.push(`<span class="meta-project" style="font-weight: 500;">${escapeHTML(proj.name)}</span>`);
            }

            if (task.priority) {
                const prioLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
                metaItems.push(`<span class="meta-priority">${prioLabel}</span>`);
            }

            if (task.dueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const [year, month, day] = task.dueDate.split('-');
                const taskDate = new Date(year, month - 1, day);

                let dateClass = '';
                let dateText = `Due ${taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                if (!task.completed) {
                    if (taskDate < today) {
                        dateClass = 'text-danger';
                        dateText = 'Overdue';
                    } else if (taskDate.getTime() === today.getTime()) {
                        dateClass = 'text-warning';
                        dateText = 'Due Today';
                    }
                }
                metaItems.push(`<span class="meta-date ${dateClass}">${dateText}</span>`);
            }

            const metaHTML = metaItems.length > 0
                ? `<div class="task-metadata" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.3rem;">${metaItems.join(' &bull; ')}</div>`
                : '';

            li.innerHTML = `
                ${getBulkCheckboxHTML(task.id, 'tasks')}
                <label class="checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
                    <span class="custom-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                </label>
                <div style="display:flex; flex-direction:column; flex:1; margin-left:1rem; padding-right: 1rem;">
                    <span class="task-text" style="margin-left:0; font-size: 1.05rem; font-weight: 500;">${safeTitle}</span>
                    ${metaHTML}
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" aria-label="Edit task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" aria-label="Delete task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });

        updateTaskStats();
    }

    function showTaskEmptyState(title, subtitle) {
        emptyState.querySelector('h3').textContent = title;
        emptyState.querySelector('p').textContent = subtitle;
        emptyState.classList.remove('hidden');
        taskList.style.display = 'none';
    }

    function updateTaskStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const remaining = total - completed;

        statTotal.textContent = total;
        statCompleted.textContent = completed;
        statRemaining.textContent = remaining;

        filterButtons.forEach(btn => {
            const type = btn.dataset.filter;
            if (type === 'All') btn.textContent = `All (${total})`;
            if (type === 'Active') btn.textContent = `Active (${remaining})`;
            if (type === 'Completed') btn.textContent = `Completed (${completed})`;
        });
    }

    taskList.addEventListener('click', (e) => {
        const taskRow = e.target.closest('.task-row');
        if (!taskRow) return;
        const id = Number(taskRow.dataset.id);

        if (e.target.closest('.delete-btn')) {
            confirmDelete('task', id);
        }

        if (e.target.closest('.edit-btn')) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-project').value = task.projectId || '';
            document.getElementById('task-priority').value = task.priority || 'medium';
            document.getElementById('task-date').value = task.dueDate || '';

            openModal('task');
        }
    });

    taskList.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskRow = e.target.closest('.task-row');
            if (taskRow) {
                const id = Number(taskRow.dataset.id);
                const task = tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    saveData('nexoraTasks', tasks);
                    renderTasks(); updateTaskStats();
                }
            }
        }
    });

    const taskSortEl = document.getElementById('task-sort');
    if (taskSortEl) {
        taskSortEl.addEventListener('change', () => {
            renderTasks();
        });
    }

    // --- 9. PROJECTS CRUD ---
    // Event delegation used for opening modals to ensure it works even if dynamically rendered
    document.addEventListener('click', (e) => {
        const createProjectBtn = e.target.closest('#btn-create-project');
        if (createProjectBtn) {
            e.preventDefault();
            document.getElementById('project-modal-title').textContent = 'Create Project';
            document.getElementById('project-submit-btn').textContent = 'Create Project';
            openModal('project');
        }

        const createRoutineBtn = e.target.closest('#btn-create-routine');
        if (createRoutineBtn) {
            e.preventDefault();
            document.getElementById('routine-modal-title').textContent = 'Create Routine';
            document.getElementById('routine-submit-btn').textContent = 'Create Routine';
            openModal('routine');
        }
    });

    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value.trim();
        const projectId = document.getElementById('task-project').value ? Number(document.getElementById('task-project').value) : null;
        const priority = document.getElementById('task-priority').value || 'medium';
        const dueDate = document.getElementById('task-date').value || null;

        if (!title || !idInput) return;

        const task = tasks.find(t => t.id === Number(idInput));
        if (task) {
            task.title = title;
            task.projectId = projectId;
            task.priority = priority;
            task.dueDate = dueDate;

            saveData('nexoraTasks', tasks);
            renderTasks();
            closeModal('task');
            showToast('Task updated');
        }
    });

    document.getElementById('project-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('project-id').value;
        const name = document.getElementById('project-name').value.trim();
        const desc = document.getElementById('project-desc').value.trim();
        const status = document.getElementById('project-status').value;

        if (!name) return;

        if (idInput) {
            const p = projects.find(p => p.id === Number(idInput));
            if (p) { p.name = name; p.description = desc; p.status = status; p.updatedAt = new Date().toISOString(); }
        } else {
            projects.push({
                id: Date.now(), name, description: desc, status, userId: currentUser.email,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            });
            showToast('Project created');
        }

        saveData('nexoraProjects', projects);
        populateTaskProjectSelect();
        renderProjects();
        closeModal('project');
    });

    function renderProjects() {
        projectsGrid.innerHTML = '';
        if (projects.length === 0) {
            projectsGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><h3>No projects yet</h3><p>Create your first project to organize your work.</p></div>`;
            return;
        }

        projects.forEach(project => {
            const pTasks = tasks.filter(t => t.projectId === project.id);
            const total = pTasks.length;
            const completed = pTasks.filter(t => t.completed).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            const div = document.createElement('div');
            div.className = 'project-card';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center;">
                        ${getBulkCheckboxHTML(project.id, 'projects')}
                        <h3 style="margin-bottom:0; cursor:pointer;" class="open-project-btn" data-id="${project.id}">${escapeHTML(project.name)}</h3>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn edit-project-btn" data-id="${project.id}" aria-label="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-project-btn text-danger" data-id="${project.id}" aria-label="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-tertiary); margin-bottom: 0.75rem; display: block;">${project.status}</span>
                <p>${escapeHTML(project.description || '')}</p>
                <div class="project-stats" style="margin-top: 1rem;">
                    <div style="font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--text-secondary);">${total} Tasks &bull; ${completed} Completed</div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                    <div class="progress-text"><span>Progress</span><span>${pct}%</span></div>
                </div>
                <button class="btn btn-secondary open-project-btn" data-id="${project.id}" style="margin-top: 1rem; width: 100%;">Open Project</button>
            `;
            projectsGrid.appendChild(div);
        });
    }

    projectsGrid.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-project-btn');
        const delBtn = e.target.closest('.delete-project-btn');
        const openBtn = e.target.closest('.open-project-btn');

        if (openBtn) {
            currentProjectId = Number(openBtn.dataset.id);
            navigateTo('project-detail');
        }
        else if (editBtn) {
            const p = projects.find(p => p.id === Number(editBtn.dataset.id));
            if (p) {
                document.getElementById('project-id').value = p.id;
                document.getElementById('project-name').value = p.name;
                document.getElementById('project-desc').value = p.description || '';
                document.getElementById('project-status').value = p.status || 'Not Started';
                document.getElementById('project-modal-title').textContent = 'Edit Project';
                document.getElementById('project-submit-btn').textContent = 'Save Changes';
                openModal('project');
            }
        }
        else if (delBtn) {
            confirmDelete('project', Number(delBtn.dataset.id));
        }
    });

    // --- 9.5 PROJECT DETAIL VIEW ---
    document.getElementById('btn-back-to-projects').addEventListener('click', () => {
        currentProjectId = null;
        navigateTo('projects');
    });

    document.getElementById('add-project-task-btn').addEventListener('click', () => {
        if (!currentProjectId) return;
        const title = document.getElementById('project-task-input').value.trim();
        if (!title) return document.getElementById('project-task-input').focus();

        tasks.push({ id: Date.now(), title: title, completed: false, projectId: currentProjectId, userId: currentUser.email });
        saveData('nexoraTasks', tasks);
        document.getElementById('project-task-input').value = '';
        document.getElementById('project-task-input').focus();

        renderProjectDetail();
        updateTaskStats();
    });

    document.getElementById('project-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-project-task-btn').click(); }
    });

    function renderProjectDetail() {
        if (!currentProjectId) return navigateTo('projects');
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return navigateTo('projects');

        document.getElementById('project-detail-title').textContent = project.name;
        document.getElementById('project-detail-desc').textContent = project.description || '';

        const pTasks = tasks.filter(t => t.projectId === currentProjectId);
        const total = pTasks.length;
        const completed = pTasks.filter(t => t.completed).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('project-detail-progress-fill').style.width = pct + '%';
        document.getElementById('project-detail-progress-text').textContent = pct + '%';

        const list = document.getElementById('project-task-list');
        list.innerHTML = '';

        if (pTasks.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No tasks in this project yet.</div>';
            return;
        }

        pTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-row ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            const safeTitle = escapeHTML(task.title);

            li.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
                    <span class="custom-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                </label>
                <span class="task-text">${safeTitle}</span>
                <div class="task-actions">
                    <button class="action-btn edit-btn" aria-label="Edit task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" aria-label="Delete task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    document.getElementById('project-task-list').addEventListener('click', (e) => {
        const taskRow = e.target.closest('.task-row');
        if (!taskRow) return;
        const id = Number(taskRow.dataset.id);

        if (e.target.closest('.delete-btn')) {
            confirmDelete('task', id);
        }

        if (e.target.closest('.edit-btn')) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            const newTitle = prompt('Edit task title:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                task.title = newTitle.trim();
                saveData('nexoraTasks', tasks);
                renderProjectDetail();
            }
        }
    });

    document.getElementById('project-task-list').addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskRow = e.target.closest('.task-row');
            if (taskRow) {
                const id = Number(taskRow.dataset.id);
                const task = tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    saveData('nexoraTasks', tasks);
                    renderProjectDetail(); updateTaskStats();
                }
            }
        }
    });

    // --- 10. ROUTINES CRUD ---

    document.getElementById('routine-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('routine-id').value;
        const name = document.getElementById('routine-name').value.trim();
        const desc = document.getElementById('routine-desc').value.trim();
        const freq = document.getElementById('routine-frequency').value;

        if (!name) return;

        if (idInput) {
            const r = routines.find(r => r.id === Number(idInput));
            if (r) { r.name = name; r.description = desc; r.frequency = freq; r.updatedAt = new Date().toISOString(); }
        } else {
            routines.push({
                id: Date.now(), name, description: desc, frequency: freq, completedDates: [], userId: currentUser.email,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            });
        }

        saveData('nexoraRoutines', routines);
        renderRoutines();
        closeModal('routine');
    });

    function renderRoutines() {
        routinesList.innerHTML = '';
        if (routines.length === 0) {
            routinesList.innerHTML = `<div class="empty-state"><h3>No routines yet</h3><p>Build small habits that help you stay consistent.</p></div>`;
            return;
        }

        const todayISO = new Date().toISOString().split('T')[0];

        routines.forEach(routine => {
            const completedDates = routine.completedDates || [];
            const isCompletedToday = completedDates.includes(todayISO);

            const div = document.createElement('div');
            div.className = 'routine-card';

            div.innerHTML = `
                ${getBulkCheckboxHTML(routine.id, 'routines')}
                <div class="routine-info" style="flex:1;">
                    <div style="display:flex; align-items:center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <h3 style="margin:0;">${escapeHTML(routine.name)}</h3>
                        <span style="font-size:0.7rem; background: var(--bg-hover); padding:0.15rem 0.4rem; border-radius:4px; color:var(--text-secondary);">${routine.frequency}</span>
                    </div>
                    <p style="margin-bottom: 0.75rem;">${escapeHTML(routine.description || '')}</p>
                    <div class="card-actions" style="margin-top: auto;">
                        <button class="action-btn edit-routine-btn" data-id="${routine.id}" aria-label="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-routine-btn text-danger" data-id="${routine.id}" aria-label="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div style="display:flex; align-items:center; justify-content:center; padding-left: 2rem; border-left: 1px solid var(--border-color);">
                    <button class="btn toggle-routine-btn ${isCompletedToday ? 'btn-primary' : 'btn-secondary'}" data-id="${routine.id}">
                        ${isCompletedToday ? '✓ Completed Today' : 'Complete Today'}
                    </button>
                </div>
            `;
            routinesList.appendChild(div);
        });
    }

    routinesList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-routine-btn');
        const delBtn = e.target.closest('.delete-routine-btn');
        const toggleBtn = e.target.closest('.toggle-routine-btn');

        if (editBtn) {
            const r = routines.find(r => r.id === Number(editBtn.dataset.id));
            if (r) {
                document.getElementById('routine-id').value = r.id;
                document.getElementById('routine-name').value = r.name;
                document.getElementById('routine-desc').value = r.description || '';
                document.getElementById('routine-frequency').value = r.frequency || 'Daily';
                document.getElementById('routine-modal-title').textContent = 'Edit Routine';
                document.getElementById('routine-submit-btn').textContent = 'Save Changes';
                openModal('routine');
            }
        }
        if (delBtn) confirmDelete('routine', Number(delBtn.dataset.id));

        if (toggleBtn) {
            const r = routines.find(r => r.id === Number(toggleBtn.dataset.id));
            if (r) {
                const todayISO = new Date().toISOString().split('T')[0];
                const index = r.completedDates.indexOf(todayISO);
                if (index > -1) r.completedDates.splice(index, 1);
                else r.completedDates.push(todayISO);
                saveData('nexoraRoutines', routines);
                renderRoutines();
            }
        }
    });

    // --- 11. CALENDAR VIEW ---
    let currentCalendarDate = new Date();

    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const currentDay = today.getDate();

        let hasDeadlinesThisMonth = false;

        // Pad previous month days
        for (let i = 0; i < startingDay; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            grid.appendChild(div);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = isCurrentMonth && day === currentDay;

            const div = document.createElement('div');
            div.className = `calendar-day ${isToday ? 'today' : ''}`;
            div.dataset.date = dateStr;

            div.innerHTML = `<div class="calendar-day-date">${day}</div>`;

            // Find tasks due this day
            const dayTasks = tasks.filter(t => t.dueDate === dateStr);
            if (dayTasks.length > 0) {
                hasDeadlinesThisMonth = true;
                const maxToShow = 3;
                for (let i = 0; i < Math.min(dayTasks.length, maxToShow); i++) {
                    const task = dayTasks[i];
                    div.innerHTML += `<div class="calendar-task ${task.completed ? 'completed' : ''}" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</div>`;
                }
                if (dayTasks.length > maxToShow) {
                    div.innerHTML += `<div class="calendar-more">+${dayTasks.length - maxToShow} more</div>`;
                }
            }

            grid.appendChild(div);
        }

        // Pad next month days to complete 35 or 42 grid cells
        const totalCells = startingDay + daysInMonth;
        const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
        for (let i = 0; i < remainingCells; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            grid.appendChild(div);
        }

        if (hasDeadlinesThisMonth) {
            document.getElementById('calendar-empty-state').classList.add('hidden');
        } else {
            document.getElementById('calendar-empty-state').classList.remove('hidden');
        }
    }

    document.getElementById('today-month-btn').addEventListener('click', () => {
        currentCalendarDate = new Date();
        renderCalendar();
    });

    document.getElementById('prev-month-btn').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('calendar-grid').addEventListener('click', (e) => {
        const dayCell = e.target.closest('.calendar-day:not(.empty)');
        if (!dayCell) return;

        const dateStr = dayCell.dataset.date;
        if (!dateStr) return;

        const [year, month, day] = dateStr.split('-');
        const dateObj = new Date(year, month - 1, day);
        document.getElementById('day-tasks-title').textContent = `Tasks for ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;

        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        const list = document.getElementById('day-tasks-list');
        list.innerHTML = '';

        if (dayTasks.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks due on this date.</li>';
        } else {
            dayTasks.forEach(task => {
                let priorityClass = '';
                let priorityLabel = '';
                if (task.priority) {
                    priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
                }

                let projName = '';
                if (task.projectId) {
                    const p = projects.find(p => p.id === task.projectId);
                    if (p) projName = p.name;
                }

                const metaHTML = [];
                if (projName) metaHTML.push(`<span style="font-weight: 500;">${escapeHTML(projName)}</span>`);
                if (priorityLabel) metaHTML.push(priorityLabel);

                list.innerHTML += `
                    <li class="task-row ${task.completed ? 'completed' : ''}" style="padding-left: 0; padding-right: 0; background: transparent;">
                        <div style="display:flex; flex-direction:column; flex:1;">
                            <span class="task-text" style="font-size: 1rem; font-weight: 500; margin-left: 0;">${escapeHTML(task.title)}</span>
                            ${metaHTML.length > 0 ? `<div class="task-metadata" style="margin-left: 0;">${metaHTML.join(' &bull; ')}</div>` : ''}
                        </div>
                    </li>
                `;
            });
        }

        openModal('day-tasks-modal');
    });

    // --- BOOTSTRAP ---
    loadData();
    initAuth();
});
