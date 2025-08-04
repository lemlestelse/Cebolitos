// Global variables
let currentUser = null;
let currentToken = null;
let isProcessing = false;
let activities = [];
let filteredActivities = [];
let progressInterval = null;
let currentSection = 'dashboard';
let sidebarCollapsed = false;
let searchTimeout = null;
let stats = {
    completed: 0,
    pending: 0,
    errors: 0,
    processingTime: 0
};

// Configuration
const CONFIG = {
    TEMPO: 90, // Tempo atividade em SEGUNDOS
    ENABLE_SUBMISSION: true,
    LOGIN_URL: 'https://sedintegracoes.educacao.sp.gov.br/credenciais/api/LoginCompletoToken',
    AUTO_PROCESS: false,
    INCLUDE_ESSAYS: false,
    ENABLE_NOTIFICATIONS: true,
    PROGRESS_STEPS: [
        { text: 'Conectando ao sistema...', progress: 10, step: 1 },
        { text: 'Autenticando usuário...', progress: 25, step: 2 },
        { text: 'Obtendo token de acesso...', progress: 40, step: 2 },
        { text: 'Buscando salas disponíveis...', progress: 60, step: 3 },
        { text: 'Carregando atividades...', progress: 80, step: 4 },
        { text: 'Processamento concluído!', progress: 100, step: 4 }
    ]
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('senha');
const logoutButton = document.getElementById('logoutButton');
const userRAElement = document.getElementById('userRA');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');
const currentPage = document.getElementById('currentPage');

// Dashboard elements
const searchActivitiesBtn = document.getElementById('searchActivitiesBtn');
const processAllBtn = document.getElementById('processAllBtn');
const exportReportBtn = document.getElementById('exportReportBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const refreshButton = document.getElementById('refreshButton');

// Activities elements
const advancedSearchToggle = document.getElementById('advancedSearchToggle');
const advancedSearch = document.getElementById('advancedSearch');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const statusTitle = document.getElementById('statusTitle');
const statusDescription = document.getElementById('statusDescription');
const statusTime = document.getElementById('statusTime');
const statusDetails = document.getElementById('statusDetails');
const mainStatusIcon = document.getElementById('mainStatusIcon');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressSteps = document.querySelectorAll('.step');
const activitiesList = document.getElementById('activitiesList');
const activityCount = document.getElementById('activityCount');
const noActivities = document.getElementById('noActivities');
const startSearchBtn = document.getElementById('startSearchBtn');
const viewBtns = document.querySelectorAll('.view-btn');
const sortActivities = document.getElementById('sortActivities');

// Stats elements
const totalActivities = document.getElementById('totalActivities');
const completedActivities = document.getElementById('completedActivities');
const dashCompletedCount = document.getElementById('dashCompletedCount');
const dashPendingCount = document.getElementById('dashPendingCount');
const dashProcessingTime = document.getElementById('dashProcessingTime');
const dashErrorCount = document.getElementById('dashErrorCount');

// Settings elements
const processingTime = document.getElementById('processingTime');
const processingTimeValue = document.getElementById('processingTimeValue');
const autoProcess = document.getElementById('autoProcess');
const includeEssaysSettings = document.getElementById('includeEssaysSettings');
const enableNotifications = document.getElementById('enableNotifications');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Other elements
const notificationContainer = document.getElementById('notificationContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingText = document.getElementById('loadingText');
const loadingProgressFill = document.getElementById('loadingProgressFill');
const loadingProgressText = document.getElementById('loadingProgressText');
const lastSync = document.getElementById('lastSync');

// Modal elements
const activityModal = document.getElementById('activityModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const modalCancel = document.getElementById('modalCancel');
const modalProcess = document.getElementById('modalProcess');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load settings
    loadSettings();
    
    // Event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('cebolitos_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        updateStats();
    }
    
    // Initialize particles (placeholder)
    initializeParticles();
    
    // Update time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Navigation
    logoutButton.addEventListener('click', handleLogout);
    sidebarToggle.addEventListener('click', toggleSidebar);
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Dashboard actions
    searchActivitiesBtn?.addEventListener('click', startActivitySearch);
    processAllBtn?.addEventListener('click', processAllActivities);
    exportReportBtn?.addEventListener('click', exportReport);
    clearDataBtn?.addEventListener('click', clearAllData);
    refreshButton?.addEventListener('click', refreshData);
    
    // Activities
    advancedSearchToggle?.addEventListener('click', toggleAdvancedSearch);
    searchInput?.addEventListener('input', handleSearch);
    clearSearch?.addEventListener('click', clearSearchInput);
    startSearchBtn?.addEventListener('click', startActivitySearch);
    
    // View controls
    viewBtns?.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.closest('.view-btn').dataset.view;
            switchView(view);
        });
    });
    
    // Sort
    sortActivities?.addEventListener('change', handleSort);
    
    // Settings
    processingTime?.addEventListener('input', updateProcessingTime);
    autoProcess?.addEventListener('change', updateAutoProcess);
    includeEssaysSettings?.addEventListener('change', updateIncludeEssays);
    enableNotifications?.addEventListener('change', updateNotifications);
    clearCacheBtn?.addEventListener('click', clearCache);
    exportDataBtn?.addEventListener('click', exportData);
    resetSettingsBtn?.addEventListener('click', resetSettings);
    
    // Modal
    closeModal?.addEventListener('click', closeActivityModal);
    modalCancel?.addEventListener('click', closeActivityModal);
    modalProcess?.addEventListener('click', processSelectedActivity);
    
    // Click outside modal to close
    activityModal?.addEventListener('click', (e) => {
        if (e.target === activityModal) {
            closeActivityModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('cebolitos_settings') || '{}');
    
    CONFIG.TEMPO = settings.processingTime || 90;
    CONFIG.AUTO_PROCESS = settings.autoProcess || false;
    CONFIG.INCLUDE_ESSAYS = settings.includeEssays || false;
    CONFIG.ENABLE_NOTIFICATIONS = settings.enableNotifications !== false;
    
    // Update UI
    if (processingTime) {
        processingTime.value = CONFIG.TEMPO;
        processingTimeValue.textContent = `${CONFIG.TEMPO}s`;
    }
    if (autoProcess) autoProcess.checked = CONFIG.AUTO_PROCESS;
    if (includeEssaysSettings) includeEssaysSettings.checked = CONFIG.INCLUDE_ESSAYS;
    if (enableNotifications) enableNotifications.checked = CONFIG.ENABLE_NOTIFICATIONS;
}

function saveSettings() {
    const settings = {
        processingTime: CONFIG.TEMPO,
        autoProcess: CONFIG.AUTO_PROCESS,
        includeEssays: CONFIG.INCLUDE_ESSAYS,
        enableNotifications: CONFIG.ENABLE_NOTIFICATIONS
    };
    localStorage.setItem('cebolitos_settings', JSON.stringify(settings));
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    isProcessing = true;
    
    const ra = document.getElementById('ra').value;
    const senha = document.getElementById('senha').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    setLoginLoading(true);
    
    try {
        await simulateLoginProgress();
        await performLogin(ra, senha);
        
        if (rememberMe) {
            localStorage.setItem('cebolitos_credentials', JSON.stringify({ ra, senha }));
        }
        
    } catch (error) {
        showNotification('Erro no Login', error.message, 'error');
        setLoginLoading(false);
        isProcessing = false;
    }
}

async function performLogin(ra, senha) {
    const loginData = { user: ra, senha: senha };
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': navigator.userAgent,
        'Ocp-Apim-Subscription-Key': '2b03c1db3884488795f79c37c069381a',
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(CONFIG.LOGIN_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            throw new Error(`Erro de autenticação: ${response.status}`);
        }

        const data = await response.json();
        
        currentUser = { ra, token: data.token };
        localStorage.setItem('cebolitos_user', JSON.stringify(currentUser));
        
        showNotification('Login Realizado', 'Conectado com sucesso!', 'success');
        
        setTimeout(() => {
            setLoginLoading(false);
            showDashboard();
            updateStats();
            updateLastSync();
        }, 1000);
        
    } catch (error) {
        throw new Error('Falha na autenticação. Verifique suas credenciais.');
    }
}

function handleLogout() {
    localStorage.removeItem('cebolitos_user');
    localStorage.removeItem('cebolitos_activities');
    currentUser = null;
    currentToken = null;
    activities = [];
    filteredActivities = [];
    isProcessing = false;
    
    showNotification('Logout', 'Sessão encerrada com sucesso', 'info');
    showLogin();
    resetDashboard();
}

// UI Management
function showLogin() {
    loginScreen.classList.add('active');
    dashboardScreen.classList.remove('active');
    
    // Load saved credentials if available
    const savedCredentials = localStorage.getItem('cebolitos_credentials');
    if (savedCredentials) {
        const { ra, senha } = JSON.parse(savedCredentials);
        document.getElementById('ra').value = ra;
        document.getElementById('senha').value = senha;
        document.getElementById('rememberMe').checked = true;
    }
}

function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    
    if (currentUser) {
        userRAElement.textContent = currentUser.ra;
    }
    
    // Load saved activities
    const savedActivities = localStorage.getItem('cebolitos_activities');
    if (savedActivities) {
        activities = JSON.parse(savedActivities);
        filteredActivities = [...activities];
        updateActivityDisplay();
        updateStats();
    }
}

function setLoginLoading(loading) {
    const btnContent = loginButton.querySelector('.btn-content');
    const btnLoader = loginButton.querySelector('.btn-loader');
    
    if (loading) {
        loginButton.classList.add('loading');
        btnContent.style.opacity = '0';
        btnLoader.style.opacity = '1';
    } else {
        loginButton.classList.remove('loading');
        btnContent.style.opacity = '1';
        btnLoader.style.opacity = '0';
    }
}

function togglePasswordVisibility() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    const icon = togglePassword.querySelector('svg');
    if (type === 'text') {
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    localStorage.setItem('cebolitos_sidebar_collapsed', sidebarCollapsed);
}

function switchSection(section) {
    currentSection = section;
    
    // Update navigation
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Update content
    contentSections.forEach(content => {
        content.classList.toggle('active', content.id === `${section}Section`);
    });
    
    // Update header
    const titles = {
        dashboard: 'Dashboard',
        activities: 'Atividades',
        analytics: 'Análises',
        settings: 'Configurações'
    };
    
    pageTitle.textContent = titles[section];
    currentPage.textContent = titles[section];
    
    // Section-specific actions
    if (section === 'activities') {
        updateActivityDisplay();
    } else if (section === 'analytics') {
        updateAnalytics();
    }
}

function toggleAdvancedSearch() {
    const isHidden = advancedSearch.classList.contains('hidden');
    advancedSearch.classList.toggle('hidden', !isHidden);
    
    const toggleText = advancedSearchToggle.querySelector('span');
    toggleText.textContent = isHidden ? 'Busca Simples' : 'Busca Avançada';
}

function switchView(view) {
    viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    activitiesList.className = `activities-list ${view}-view`;
}

// Progress simulation
async function simulateLoginProgress() {
    return new Promise((resolve) => {
        let currentStep = 0;
        
        const updateProgress = () => {
            if (currentStep < CONFIG.PROGRESS_STEPS.length) {
                const step = CONFIG.PROGRESS_STEPS[currentStep];
                // Login progress is handled differently
                currentStep++;
                setTimeout(updateProgress, 600);
            } else {
                resolve();
            }
        };
        
        updateProgress();
    });
}

function updateStatus(title, description, progress, step = null) {
    if (statusTitle) statusTitle.textContent = title;
    if (statusDescription) statusDescription.textContent = description;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
    
    // Update status icon
    if (mainStatusIcon) {
        mainStatusIcon.className = 'status-icon';
        if (progress === 100) {
            mainStatusIcon.classList.add('success');
        } else if (progress > 0) {
            mainStatusIcon.classList.add('searching');
        }
    }
    
    // Update progress steps
    if (step && progressSteps) {
        progressSteps.forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'completed');
            
            if (stepNum < step) {
                stepEl.classList.add('completed');
            } else if (stepNum === step) {
                stepEl.classList.add('active');
            }
        });
    }
    
    // Update time and details
    if (statusTime) statusTime.textContent = new Date().toLocaleTimeString();
    if (statusDetails) statusDetails.textContent = progress === 100 ? 'Concluído' : 'Em andamento';
}

// Activity management
async function startActivitySearch() {
    if (isProcessing) return;
    
    isProcessing = true;
    updateStatus('Procurando Atividades', 'Conectando ao sistema...', 0, 1);
    
    // Enable process button
    if (processAllBtn) processAllBtn.disabled = false;
    
    try {
        // Get API token
        updateStatus('Procurando Atividades', 'Autenticando usuário...', 25, 2);
        const apiToken = await getApiToken(currentUser.token);
        currentToken = apiToken;
        
        updateStatus('Procurando Atividades', 'Buscando salas disponíveis...', 60, 3);
        
        // Get user rooms
        const rooms = await getUserRooms(apiToken);
        
        if (rooms.length === 0) {
            throw new Error('Nenhuma sala encontrada');
        }
        
        updateStatus('Procurando Atividades', 'Carregando atividades...', 80, 4);
        
        // Fetch activities
        const roomName = rooms[0].name;
        await fetchAllActivities(apiToken, roomName);
        
        updateStatus('Atividades Carregadas', `${activities.length} atividades encontradas`, 100, 4);
        
        // Save activities
        localStorage.setItem('cebolitos_activities', JSON.stringify(activities));
        
        setTimeout(() => {
            filteredActivities = [...activities];
            updateActivityDisplay();
            updateStats();
            updateLastSync();
            
            if (activities.length > 0) {
                showNotification('Atividades Encontradas', `${activities.length} atividades disponíveis para processamento`, 'success');
                
                if (CONFIG.AUTO_PROCESS) {
                    setTimeout(() => processAllActivities(), 2000);
                }
            } else {
                showNotification('Nenhuma Atividade', 'Não foram encontradas atividades pendentes', 'info');
            }
        }, 1000);
        
    } catch (error) {
        updateStatus('Erro', error.message, 0);
        showNotification('Erro', error.message, 'error');
    } finally {
        isProcessing = false;
    }
}

async function getApiToken(token) {
    const url = 'https://edusp-api.ip.tv/registration/edusp/token';
    const headers = {
        'x-api-realm': 'edusp',
        'x-api-platform': 'webclient',
        'User-Agent': navigator.userAgent,
        'Host': 'edusp-api.ip.tv',
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ token })
    });

    if (!response.ok) {
        throw new Error('Falha ao obter token de API');
    }

    const data = await response.json();
    return data.auth_token;
}

async function getUserRooms(token) {
    const url = 'https://edusp-api.ip.tv/room/user?list_all=true&with_cards=true';
    const headers = {
        'User-Agent': navigator.userAgent,
        'x-api-key': token
    };

    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
        throw new Error('Falha ao buscar salas');
    }

    const data = await response.json();
    return data.rooms || [];
}

async function fetchAllActivities(token, room) {
    const urls = [
        {
            label: 'Normal',
            url: `https://edusp-api.ip.tv/tms/task/todo?expired_only=false&filter_expired=true&with_answer=true&publication_target=${room}&answer_statuses=pending&with_apply_moment=false`,
        },
        {
            label: 'Expirada',
            url: `https://edusp-api.ip.tv/tms/task/todo?expired_only=true&filter_expired=false&with_answer=true&publication_target=${room}&answer_statuses=pending&with_apply_moment=true`,
        }
    ];

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': navigator.userAgent,
        'x-api-key': token,
    };

    activities = [];

    for (const { label, url } of urls) {
        try {
            const response = await fetch(url, { method: 'GET', headers });
            if (response.ok) {
                const data = await response.json();
                
                // Filter out drafts and expired essays if not included
                let filteredData = data;
                if (label === 'Expirada' || !CONFIG.INCLUDE_ESSAYS) {
                    filteredData = data.filter(task => {
                        const isEssay = task.tags.some(t => t.toLowerCase().includes('redacao'));
                        return CONFIG.INCLUDE_ESSAYS || !isEssay;
                    });
                }
                
                filteredData.forEach(task => {
                    activities.push({
                        ...task,
                        type: label,
                        status: 'pending',
                        progress: 0,
                        createdAt: new Date().toISOString()
                    });
                });
            }
        } catch (error) {
            console.error(`Erro ao buscar atividades ${label}:`, error);
        }
    }
}

function updateActivityDisplay() {
    if (!activityCount) return;
    
    activityCount.textContent = filteredActivities.length;
    
    if (filteredActivities.length === 0) {
        activitiesList.style.display = 'none';
        noActivities.classList.remove('hidden');
        return;
    }
    
    activitiesList.style.display = '';
    noActivities.classList.add('hidden');
    
    activitiesList.innerHTML = '';
    
    filteredActivities.forEach((activity, index) => {
        const activityElement = createActivityElement(activity, index);
        activitiesList.appendChild(activityElement);
    });
}

function createActivityElement(activity, index) {
    const div = document.createElement('div');
    div.className = `activity-item ${activity.status}`;
    div.id = `activity-${index}`;
    
    const isEssay = activity.tags.some(t => t.toLowerCase().includes('redacao'));
    const statusText = getStatusText(activity.status);
    const createdDate = new Date(activity.createdAt || Date.now()).toLocaleDateString();
    
    div.innerHTML = `
        <div class="activity-header">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-status ${activity.status}">${statusText}</div>
        </div>
        <div class="activity-description">
            ${isEssay ? '📝 Redação' : '📋 Atividade'} • Tipo: ${activity.type} • Criado: ${createdDate}
        </div>
        <div class="activity-progress">
            <div class="activity-progress-fill" style="width: ${activity.progress}%"></div>
        </div>
        <div class="activity-meta">
            <span>ID: ${activity.id}</span>
            <span>${activity.progress}% concluído</span>
        </div>
    `;
    
    // Add click handler
    div.addEventListener('click', () => showActivityModal(activity, index));
    
    return div;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'completed': 'Concluída',
        'error': 'Erro'
    };
    return statusMap[status] || status;
}

async function processAllActivities() {
    if (!CONFIG.ENABLE_SUBMISSION) {
        showNotification('Modo Demonstração', 'Processamento desabilitado para demonstração', 'info');
        return;
    }
    
    if (activities.length === 0) {
        showNotification('Nenhuma Atividade', 'Não há atividades para processar', 'warning');
        return;
    }
    
    showLoadingOverlay('Processando Atividades', 'Iniciando processamento das atividades encontradas...');
    
    let processed = 0;
    const total = activities.length;
    
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        
        // Skip essays if not enabled
        const isEssay = activity.tags.some(t => t.toLowerCase().includes('redacao'));
        if (isEssay && !CONFIG.INCLUDE_ESSAYS) {
            updateActivityStatus(i, 'completed', 100);
            showNotification('Redação Ignorada', `${activity.title} - Redações não são processadas automaticamente`, 'info');
            processed++;
            continue;
        }
        
        try {
            updateActivityStatus(i, 'processing', 0);
            updateLoadingText(`Processando: ${activity.title}`);
            updateLoadingProgress((processed / total) * 100);
            
            await processActivity(activity, i);
            
            updateActivityStatus(i, 'completed', 100);
            showNotification('Atividade Concluída', activity.title, 'success');
            stats.completed++;
            
        } catch (error) {
            updateActivityStatus(i, 'error', 0);
            showNotification('Erro na Atividade', `${activity.title}: ${error.message}`, 'error');
            stats.errors++;
        }
        
        processed++;
        updateLoadingProgress((processed / total) * 100);
        
        // Small delay between activities
        await delay(1000);
    }
    
    hideLoadingOverlay();
    showNotification('Processamento Concluído', 'Todas as atividades foram processadas', 'success');
    
    // Save updated activities
    localStorage.setItem('cebolitos_activities', JSON.stringify(activities));
    updateStats();
    updateLastSync();
}

async function processActivity(activity, index) {
    const startTime = Date.now();
    
    // Get activity details
    const details = await getActivityDetails(activity.id);
    
    // Generate answers
    const answers = generateAnswers(details.questions);
    
    // Submit initial answers
    updateActivityStatus(index, 'processing', 25);
    const submissionResponse = await submitAnswers(activity.id, answers);
    
    // Wait for processing time
    updateActivityStatus(index, 'processing', 50);
    await delay(CONFIG.TEMPO * 1000);
    
    // Get correct answers
    updateActivityStatus(index, 'processing', 75);
    const correctAnswers = await getCorrectAnswers(activity.id, submissionResponse.id);
    
    // Submit correct answers
    const finalAnswers = transformAnswers(correctAnswers);
    await submitFinalAnswers(activity.id, submissionResponse.id, finalAnswers);
    
    updateActivityStatus(index, 'processing', 100);
    
    // Update processing time stats
    const processingTime = (Date.now() - startTime) / 1000;
    stats.processingTime = (stats.processingTime + processingTime) / 2;
}

async function getActivityDetails(taskId) {
    const url = `https://edusp-api.ip.tv/tms/task/${taskId}/apply?preview_mode=false`;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-realm': 'edusp',
        'x-api-platform': 'webclient',
        'User-Agent': navigator.userAgent,
        'x-api-key': currentToken,
    };

    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
        throw new Error(`Erro ao buscar detalhes: ${response.status}`);
    }
    
    return await response.json();
}

function generateAnswers(questions) {
    const answersData = {};

    questions.forEach(question => {
        const questionId = question.id;
        let answer = {};

        if (question.type === 'info') return;

        if (question.type === 'media') {
            answer = { status: 'error', message: 'Type=media system require url' };
        } else if (question.options && typeof question.options === 'object') {
            const options = Object.values(question.options);
            const correctIndex = Math.floor(Math.random() * options.length);

            options.forEach((_, i) => {
                answer[i] = i === correctIndex;
            });
        }

        answersData[questionId] = {
            question_id: questionId,
            question_type: question.type,
            answer,
        };
    });

    return answersData;
}

async function submitAnswers(taskId, answersData) {
    const request = {
        status: "submitted",
        accessed_on: "room",
        executed_on: currentUser.ra,
        answers: answersData,
    };

    const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/answer`, {
        method: 'POST',
        headers: {
            'X-Api-Key': currentToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error('Erro ao enviar respostas');
    }

    return await response.json();
}

async function getCorrectAnswers(taskId, answerId) {
    const url = `https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;
    const headers = {
        'User-Agent': navigator.userAgent,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-realm': 'edusp',
        'x-api-platform': 'webclient',
        'x-api-key': currentToken,
    };

    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
        throw new Error('Erro ao buscar respostas corretas');
    }
    
    return await response.json();
}

async function submitFinalAnswers(taskId, answerId, answers) {
    const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}`, {
        method: 'PUT',
        headers: {
            'User-Agent': navigator.userAgent,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-api-realm': 'edusp',
            'x-api-platform': 'webclient',
            'x-api-key': currentToken,
        },
        body: JSON.stringify(answers)
    });

    if (!response.ok) {
        throw new Error('Erro ao enviar respostas finais');
    }

    return await response.json();
}

function transformAnswers(originalData) {
    if (!originalData || !originalData.task || !originalData.task.questions) {
        throw new Error("Estrutura de dados inválida para transformação.");
    }

    let transformedData = {
        accessed_on: originalData.accessed_on,
        executed_on: originalData.executed_on,
        answers: {}
    };

    for (let questionId in originalData.answers) {
        let questionData = originalData.answers[questionId];
        let taskQuestion = originalData.task.questions.find(q => q.id === parseInt(questionId));

        if (!taskQuestion) {
            console.warn(`Questão com ID ${questionId} não encontrada!`);
            continue;
        }

        let answerPayload = {
            question_id: questionData.question_id,
            question_type: taskQuestion.type,
            answer: null
        };

        try {
            switch (taskQuestion.type) {
                case "order-sentences":
                    if (taskQuestion.options && taskQuestion.options.sentences && Array.isArray(taskQuestion.options.sentences)) {
                        answerPayload.answer = taskQuestion.options.sentences.map(sentence => sentence.value);
                    }
                    break;
                case "fill-words":
                    if (taskQuestion.options && taskQuestion.options.phrase && Array.isArray(taskQuestion.options.phrase)) {
                        answerPayload.answer = taskQuestion.options.phrase
                            .map(item => item.value)
                            .filter((_, index) => index % 2 !== 0);
                    }
                    break;
                case "text_ai":
                    let cleanedAnswer = removeTags(taskQuestion.comment || '');
                    answerPayload.answer = { "0": cleanedAnswer };
                    break;
                case "fill-letters":
                    if (taskQuestion.options && taskQuestion.options.answer !== undefined) {
                        answerPayload.answer = taskQuestion.options.answer;
                    }
                    break;
                case "cloud":
                    if (taskQuestion.options && taskQuestion.options.ids && Array.isArray(taskQuestion.options.ids)) {
                        answerPayload.answer = taskQuestion.options.ids;
                    }
                    break;
                default:
                    if (taskQuestion.options && typeof taskQuestion.options === 'object') {
                        answerPayload.answer = Object.fromEntries(
                            Object.keys(taskQuestion.options).map(optionId => {
                                const optionData = taskQuestion.options[optionId];
                                const answerValue = (optionData && optionData.answer !== undefined) ? optionData.answer : false;
                                return [optionId, answerValue];
                            })
                        );
                    }
                    break;
            }
            transformedData.answers[questionId] = answerPayload;
        } catch (err) {
            console.error(`Erro ao processar questão ID ${questionId}:`, err);
            continue;
        }
    }
    return transformedData;
}

function removeTags(htmlString) {
    return htmlString.replace(/<[^>]*>?/gm, '');
}

function updateActivityStatus(index, status, progress) {
    if (index >= activities.length) return;
    
    activities[index].status = status;
    activities[index].progress = progress;
    
    const element = document.getElementById(`activity-${index}`);
    if (element) {
        element.className = `activity-item ${status}`;
        
        const statusElement = element.querySelector('.activity-status');
        if (statusElement) {
            statusElement.textContent = getStatusText(status);
            statusElement.className = `activity-status ${status}`;
        }
        
        const progressFill = element.querySelector('.activity-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        const metaProgress = element.querySelector('.activity-meta span:last-child');
        if (metaProgress) {
            metaProgress.textContent = `${progress}% concluído`;
        }
    }
}

// Search and filter functions
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            filteredActivities = [...activities];
        } else {
            filteredActivities = activities.filter(activity => 
                activity.title.toLowerCase().includes(query) ||
                activity.type.toLowerCase().includes(query) ||
                (activity.tags && activity.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }
        
        updateActivityDisplay();
    }, 300);
}

function clearSearchInput() {
    searchInput.value = '';
    filteredActivities = [...activities];
    updateActivityDisplay();
}

function handleSort() {
    const sortBy = sortActivities.value;
    
    filteredActivities.sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'status':
                return a.status.localeCompare(b.status);
            case 'date':
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            default:
                return 0;
        }
    });
    
    updateActivityDisplay();
}

// Modal functions
function showActivityModal(activity, index) {
    const isEssay = activity.tags.some(t => t.toLowerCase().includes('redacao'));
    
    modalTitle.textContent = activity.title;
    modalBody.innerHTML = `
        <div class="activity-detail">
            <div class="detail-row">
                <strong>Tipo:</strong> ${isEssay ? 'Redação' : 'Atividade'} (${activity.type})
            </div>
            <div class="detail-row">
                <strong>Status:</strong> <span class="status-badge ${activity.status}">${getStatusText(activity.status)}</span>
            </div>
            <div class="detail-row">
                <strong>Progresso:</strong> ${activity.progress}%
            </div>
            <div class="detail-row">
                <strong>ID:</strong> ${activity.id}
            </div>
            <div class="detail-row">
                <strong>Tags:</strong> ${activity.tags ? activity.tags.join(', ') : 'Nenhuma'}
            </div>
            <div class="detail-row">
                <strong>Criado em:</strong> ${new Date(activity.createdAt || Date.now()).toLocaleString()}
            </div>
            ${activity.status === 'error' ? `
                <div class="detail-row error">
                    <strong>Erro:</strong> ${activity.error || 'Erro desconhecido'}
                </div>
            ` : ''}
        </div>
    `;
    
    // Update modal buttons
    modalProcess.textContent = activity.status === 'completed' ? 'Reprocessar' : 'Processar';
    modalProcess.disabled = isProcessing;
    modalProcess.onclick = () => processSelectedActivity(activity, index);
    
    activityModal.classList.add('active');
}

function closeActivityModal() {
    activityModal.classList.remove('active');
}

async function processSelectedActivity(activity, index) {
    if (isProcessing) return;
    
    closeActivityModal();
    
    const isEssay = activity.tags.some(t => t.toLowerCase().includes('redacao'));
    if (isEssay && !CONFIG.INCLUDE_ESSAYS) {
        showNotification('Redação Ignorada', 'Redações não são processadas automaticamente', 'warning');
        return;
    }
    
    showLoadingOverlay('Processando Atividade', `Processando: ${activity.title}`);
    
    try {
        await processActivity(activity, index);
        updateActivityStatus(index, 'completed', 100);
        showNotification('Atividade Concluída', activity.title, 'success');
        stats.completed++;
        updateStats();
    } catch (error) {
        updateActivityStatus(index, 'error', 0);
        showNotification('Erro na Atividade', `${activity.title}: ${error.message}`, 'error');
        stats.errors++;
        updateStats();
    } finally {
        hideLoadingOverlay();
        localStorage.setItem('cebolitos_activities', JSON.stringify(activities));
    }
}

// Settings functions
function updateProcessingTime() {
    CONFIG.TEMPO = parseInt(processingTime.value);
    processingTimeValue.textContent = `${CONFIG.TEMPO}s`;
    saveSettings();
}

function updateAutoProcess() {
    CONFIG.AUTO_PROCESS = autoProcess.checked;
    saveSettings();
}

function updateIncludeEssays() {
    CONFIG.INCLUDE_ESSAYS = includeEssaysSettings.checked;
    saveSettings();
}

function updateNotifications() {
    CONFIG.ENABLE_NOTIFICATIONS = enableNotifications.checked;
    saveSettings();
}

function clearCache() {
    localStorage.removeItem('cebolitos_activities');
    localStorage.removeItem('cebolitos_stats');
    activities = [];
    filteredActivities = [];
    stats = { completed: 0, pending: 0, errors: 0, processingTime: 0 };
    updateActivityDisplay();
    updateStats();
    showNotification('Cache Limpo', 'Dados temporários removidos com sucesso', 'success');
}

function exportData() {
    const data = {
        user: currentUser?.ra || 'Unknown',
        activities: activities,
        stats: stats,
        exportDate: new Date().toISOString(),
        version: '2.0.1'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cebolitos-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Dados Exportados', 'Relatório baixado com sucesso', 'success');
}

function resetSettings() {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
        localStorage.removeItem('cebolitos_settings');
        CONFIG.TEMPO = 90;
        CONFIG.AUTO_PROCESS = false;
        CONFIG.INCLUDE_ESSAYS = false;
        CONFIG.ENABLE_NOTIFICATIONS = true;
        loadSettings();
        showNotification('Configurações Resetadas', 'Todas as configurações foram restauradas', 'success');
    }
}

// Stats and analytics
function updateStats() {
    stats.pending = activities.filter(a => a.status === 'pending').length;
    stats.completed = activities.filter(a => a.status === 'completed').length;
    stats.errors = activities.filter(a => a.status === 'error').length;
    
    // Update UI
    if (totalActivities) totalActivities.textContent = activities.length;
    if (completedActivities) completedActivities.textContent = stats.completed;
    if (dashCompletedCount) dashCompletedCount.textContent = stats.completed;
    if (dashPendingCount) dashPendingCount.textContent = stats.pending;
    if (dashProcessingTime) dashProcessingTime.textContent = `${Math.round(stats.processingTime)}s`;
    if (dashErrorCount) dashErrorCount.textContent = stats.errors;
    
    // Save stats
    localStorage.setItem('cebolitos_stats', JSON.stringify(stats));
}

function updateAnalytics() {
    // Placeholder for analytics implementation
    // This would integrate with a charting library like Chart.js
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetDashboard() {
    activities = [];
    filteredActivities = [];
    stats = { completed: 0, pending: 0, errors: 0, processingTime: 0 };
    updateStatus('Pronto para Buscar', 'Clique em "Buscar Atividades" para começar', 0);
    updateActivityDisplay();
    updateStats();
}

function refreshData() {
    if (isProcessing) return;
    
    refreshButton.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        refreshButton.style.transform = '';
    }, 300);
    
    if (currentToken) {
        startActivitySearch();
    } else {
        showNotification('Token Expirado', 'Faça login novamente para atualizar os dados', 'warning');
    }
}

function exportReport() {
    exportData();
}

function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        clearCache();
    }
}

function showLoadingOverlay(title, text) {
    if (loadingTitle) loadingTitle.textContent = title;
    if (loadingText) loadingText.textContent = text;
    if (loadingProgressFill) loadingProgressFill.style.width = '0%';
    if (loadingProgressText) loadingProgressText.textContent = '0%';
    loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    loadingOverlay.classList.add('hidden');
}

function updateLoadingText(text) {
    if (loadingText) loadingText.textContent = text;
}

function updateLoadingProgress(progress) {
    if (loadingProgressFill) loadingProgressFill.style.width = `${progress}%`;
    if (loadingProgressText) loadingProgressText.textContent = `${Math.round(progress)}%`;
}

function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    // Update any time displays
    document.querySelectorAll('.current-time').forEach(el => {
        el.textContent = timeString;
    });
}

function updateLastSync() {
    const now = new Date().toLocaleString();
    if (lastSync) lastSync.textContent = now;
    localStorage.setItem('cebolitos_last_sync', now);
}

function initializeParticles() {
    // Placeholder for particles.js initialization
    // This would require the particles.js library
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        if (activityModal && activityModal.classList.contains('active')) {
            closeActivityModal();
        }
    }
    
    // Ctrl/Cmd + R for refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }
}

// Notification system
function showNotification(title, message, type = 'info') {
    if (!CONFIG.ENABLE_NOTIFICATIONS) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
        </svg>`,
        error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`,
        info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`
    };
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-title">${title}</div>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInNotification 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Load saved data on initialization
window.addEventListener('load', () => {
    // Load saved stats
    const savedStats = localStorage.getItem('cebolitos_stats');
    if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
        updateStats();
    }
    
    // Load last sync time
    const savedLastSync = localStorage.getItem('cebolitos_last_sync');
    if (savedLastSync && lastSync) {
        lastSync.textContent = savedLastSync;
    }
    
    // Load sidebar state
    const sidebarState = localStorage.getItem('cebolitos_sidebar_collapsed');
    if (sidebarState === 'true') {
        sidebarCollapsed = true;
        sidebar.classList.add('collapsed');
    }
});