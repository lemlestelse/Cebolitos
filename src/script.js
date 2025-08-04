// Global variables
let currentUser = null;
let currentToken = null;
let isProcessing = false;
let activities = [];
let progressInterval = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('senha');
const logoutButton = document.getElementById('logoutButton');
const userRAElement = document.getElementById('userRA');
const statusTitle = document.getElementById('statusTitle');
const statusDescription = document.getElementById('statusDescription');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const activitiesList = document.getElementById('activitiesList');
const activityCount = document.getElementById('activityCount');
const noActivities = document.getElementById('noActivities');
const notificationContainer = document.getElementById('notificationContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Configuration
const CONFIG = {
    TEMPO: 90, // Tempo atividade em SEGUNDOS
    ENABLE_SUBMISSION: true,
    LOGIN_URL: 'https://sedintegracoes.educacao.sp.gov.br/credenciais/api/LoginCompletoToken',
    PROGRESS_STEPS: [
        { text: 'Conectando ao sistema...', progress: 10 },
        { text: 'Autenticando usuário...', progress: 25 },
        { text: 'Obtendo token de acesso...', progress: 40 },
        { text: 'Buscando salas disponíveis...', progress: 60 },
        { text: 'Carregando atividades...', progress: 80 },
        { text: 'Processamento concluído!', progress: 100 }
    ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    togglePassword.addEventListener('click', togglePasswordVisibility);
    logoutButton.addEventListener('click', handleLogout);
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('cebolitos_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    isProcessing = true;
    
    const ra = document.getElementById('ra').value;
    const senha = document.getElementById('senha').value;
    
    setLoginLoading(true);
    
    try {
        await simulateProgress();
        await performLogin(ra, senha);
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
            startActivitySearch();
        }, 1000);
        
    } catch (error) {
        throw new Error('Falha na autenticação. Verifique suas credenciais.');
    }
}

function handleLogout() {
    localStorage.removeItem('cebolitos_user');
    currentUser = null;
    currentToken = null;
    activities = [];
    isProcessing = false;
    
    showNotification('Logout', 'Sessão encerrada com sucesso', 'info');
    showLogin();
}

// UI Management
function showLogin() {
    loginScreen.classList.add('active');
    dashboardScreen.classList.remove('active');
    resetDashboard();
}

function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    
    if (currentUser) {
        userRAElement.textContent = currentUser.ra;
    }
}

function setLoginLoading(loading) {
    const btnText = loginButton.querySelector('.btn-text');
    const btnLoader = loginButton.querySelector('.btn-loader');
    
    if (loading) {
        loginButton.classList.add('loading');
        btnText.style.opacity = '0';
        btnLoader.classList.remove('hidden');
    } else {
        loginButton.classList.remove('loading');
        btnText.style.opacity = '1';
        btnLoader.classList.add('hidden');
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

// Progress simulation
async function simulateProgress() {
    return new Promise((resolve) => {
        let currentStep = 0;
        
        const updateProgress = () => {
            if (currentStep < CONFIG.PROGRESS_STEPS.length) {
                const step = CONFIG.PROGRESS_STEPS[currentStep];
                updateStatus('Conectando...', step.text, step.progress);
                currentStep++;
                setTimeout(updateProgress, 800);
            } else {
                resolve();
            }
        };
        
        updateProgress();
    });
}

function updateStatus(title, description, progress) {
    statusTitle.textContent = title;
    statusDescription.textContent = description;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

// Activity management
async function startActivitySearch() {
    isProcessing = true;
    updateStatus('Procurando Atividades', 'Conectando ao sistema...', 0);
    
    try {
        // Get API token
        const apiToken = await getApiToken(currentUser.token);
        currentToken = apiToken;
        
        updateStatus('Procurando Atividades', 'Buscando salas disponíveis...', 30);
        
        // Get user rooms
        const rooms = await getUserRooms(apiToken);
        
        if (rooms.length === 0) {
            throw new Error('Nenhuma sala encontrada');
        }
        
        updateStatus('Procurando Atividades', 'Carregando atividades...', 60);
        
        // Fetch activities
        const roomName = rooms[0].name;
        await fetchAllActivities(apiToken, roomName);
        
        updateStatus('Atividades Carregadas', `${activities.length} atividades encontradas`, 100);
        
        setTimeout(() => {
            updateActivityDisplay();
            if (activities.length > 0) {
                showNotification('Atividades Encontradas', `${activities.length} atividades disponíveis para processamento`, 'success');
                startActivityProcessing();
            }
        }, 1000);
        
    } catch (error) {
        updateStatus('Erro', error.message, 0);
        showNotification('Erro', error.message, 'error');
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
                
                // Filter out drafts and expired essays
                let filteredData = data;
                if (label === 'Expirada') {
                    filteredData = data.filter(task => 
                        !task.tags.some(t => t.toLowerCase().includes('redacao'))
                    );
                }
                
                filteredData.forEach(task => {
                    activities.push({
                        ...task,
                        type: label,
                        status: 'pending',
                        progress: 0
                    });
                });
            }
        } catch (error) {
            console.error(`Erro ao buscar atividades ${label}:`, error);
        }
    }
}

function updateActivityDisplay() {
    activityCount.textContent = activities.length;
    
    if (activities.length === 0) {
        activitiesList.style.display = 'none';
        noActivities.classList.remove('hidden');
        return;
    }
    
    activitiesList.style.display = 'flex';
    noActivities.classList.add('hidden');
    
    activitiesList.innerHTML = '';
    
    activities.forEach((activity, index) => {
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
    
    div.innerHTML = `
        <div class="activity-header">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-status ${activity.status}">${statusText}</div>
        </div>
        <div class="activity-description">
            ${isEssay ? '📝 Redação' : '📋 Atividade'} • Tipo: ${activity.type}
        </div>
        <div class="activity-progress">
            <div class="activity-progress-fill" style="width: ${activity.progress}%"></div>
        </div>
    `;
    
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

async function startActivityProcessing() {
    if (!CONFIG.ENABLE_SUBMISSION) {
        showNotification('Modo Demonstração', 'Processamento desabilitado para demonstração', 'info');
        return;
    }
    
    showLoadingOverlay('Processando Atividades', 'Iniciando processamento das atividades encontradas...');
    
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        
        // Skip essays
        const isEssay = activity.tags.some(t => t.toLowerCase().includes('redacao'));
        if (isEssay) {
            updateActivityStatus(i, 'completed', 100);
            showNotification('Redação Ignorada', `${activity.title} - Redações não são processadas automaticamente`, 'info');
            continue;
        }
        
        try {
            updateActivityStatus(i, 'processing', 0);
            updateLoadingText(`Processando: ${activity.title}`);
            
            await processActivity(activity, i);
            
            updateActivityStatus(i, 'completed', 100);
            showNotification('Atividade Concluída', activity.title, 'success');
            
        } catch (error) {
            updateActivityStatus(i, 'error', 0);
            showNotification('Erro na Atividade', `${activity.title}: ${error.message}`, 'error');
        }
        
        // Small delay between activities
        await delay(1000);
    }
    
    hideLoadingOverlay();
    showNotification('Processamento Concluído', 'Todas as atividades foram processadas', 'success');
    isProcessing = false;
}

async function processActivity(activity, index) {
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
    activities[index].status = status;
    activities[index].progress = progress;
    
    const element = document.getElementById(`activity-${index}`);
    if (element) {
        element.className = `activity-item ${status}`;
        
        const statusElement = element.querySelector('.activity-status');
        statusElement.textContent = getStatusText(status);
        statusElement.className = `activity-status ${status}`;
        
        const progressFill = element.querySelector('.activity-progress-fill');
        progressFill.style.width = `${progress}%`;
    }
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetDashboard() {
    activities = [];
    updateStatus('Procurando Atividades', 'Aguardando conexão...', 0);
    activitiesList.innerHTML = '';
    activityCount.textContent = '0';
    noActivities.classList.add('hidden');
}

function showLoadingOverlay(title, text) {
    loadingOverlay.querySelector('h3').textContent = title;
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    loadingOverlay.classList.add('hidden');
}

function updateLoadingText(text) {
    loadingText.textContent = text;
}

// Notification system
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">${title}</div>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}