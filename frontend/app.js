// API Configuration
const API_BASE_URL = window.location.origin;

// Global state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// DOM Elements
const pages = document.querySelectorAll('.page');
const pageContents = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.nav-link');

// Login/Register elements
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const appPage = document.getElementById('app-page');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLogin = document.getElementById('show-login');
const showRegister = document.getElementById('show-register');
const logoutBtn = document.getElementById('logout-btn');

// Utility Functions
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function showSpinner(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    button.disabled = true;
    return originalText;
}

function hideSpinner(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

function navigateToPage(pageId) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    pageContents.forEach(content => content.classList.add('hidden'));
    
    // Show target page
    const targetPage = document.getElementById(pageId + '-page');
    const targetContent = document.getElementById(pageId + '-content');
    
    if (targetPage) {
        targetPage.classList.add('active');
    }
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }
    
    // Update navigation
    navLinks.forEach(link => {
        link.classList.remove('sidebar-active');
        if (link.dataset.page === pageId) {
            link.classList.add('sidebar-active');
        }
    });
}

function updateAuthState() {
    if (authToken) {
        loginPage.classList.remove('active');
        registerPage.classList.remove('active');
        appPage.classList.add('active');
        navigateToPage('dashboard');
    } else {
        appPage.classList.remove('active');
        loginPage.classList.add('active');
    }
}

// API Calls
async function apiRequest(method, url, data = null, auth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (auth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: method,
            headers: headers,
            body: data ? JSON.stringify(data) : null,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Something went wrong');
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Authentication
async function handleLogin(event) {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = showSpinner(button);
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiRequest('POST', '/api/auth/login', { email, password }, false);
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        currentUser = { email: email };
        showToast('Logged in successfully!', 'success');
        updateAuthState();
    } catch (error) {
        console.error('Login failed:', error);
    } finally {
        hideSpinner(button, originalText);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = showSpinner(button);
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        hideSpinner(button, originalText);
        return;
    }

    try {
        await apiRequest('POST', '/api/auth/register', { email, password }, false);
        showToast('Registration successful! Please log in.', 'success');
        showLogin.click();
    } catch (error) {
        console.error('Registration failed:', error);
    } finally {
        hideSpinner(button, originalText);
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('authToken');
    currentUser = null;
    showToast('Logged out successfully!', 'info');
    updateAuthState();
}

// Document Upload
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    if (!uploadArea) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.ppt,.pptx,.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-purple-500', 'bg-purple-50');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-purple-500', 'bg-purple-50');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-purple-500', 'bg-purple-50');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    if (!authToken) {
        showToast('Please log in to upload files.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        showToast('Uploading file...', 'info');
        const response = await fetch(`${API_BASE_URL}/api/articles/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            showToast('File uploaded successfully!', 'success');
            navigateToPage('history');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        showToast('Upload failed. Please try again.', 'error');
    }
}

// Load Articles for History Page
async function loadArticles() {
    if (!authToken) {
        showToast('Please log in to view articles.', 'error');
        return;
    }

    try {
        const articles = await apiRequest('GET', '/api/articles');
        displayArticles(articles);
    } catch (error) {
        console.error('Failed to load articles:', error);
        showToast('Failed to load articles.', 'error');
    }
}

function displayArticles(articles) {
    const historyContent = document.getElementById('history-content');
    if (!historyContent) return;

    let articlesHTML = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <input type="text" placeholder="Search documents, summaries, or tags..." class="w-96 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                    <select class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option>All types</option>
                        <option>PDF</option>
                        <option>DOCX</option>
                        <option>PPT</option>
                    </select>
                    <select class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option>Date</option>
                        <option>Today</option>
                        <option>This week</option>
                        <option>This month</option>
                    </select>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-2 bg-purple-600 text-white rounded-lg">
                        <i class="fas fa-th"></i>
                    </button>
                    <button class="p-2 bg-gray-200 text-gray-600 rounded-lg">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            </div>
            <div class="flex space-x-4 mb-6">
                <button class="px-4 py-2 bg-purple-600 text-white rounded-lg">All Documents (${articles.length})</button>
                <button class="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg">Saved (0)</button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    articles.forEach(article => {
        const fileType = getFileTypeIcon(article.title || '');
        const date = new Date(article.created_at || Date.now()).toLocaleDateString();
        
        articlesHTML += `
            <div class="document-card">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 ${fileType.bg} rounded-lg flex items-center justify-center">
                        <i class="${fileType.icon} text-xl"></i>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 bg-black text-white text-xs rounded-full">completed</span>
                        <button class="p-1 text-gray-400 hover:text-gray-600">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${article.title || 'Untitled'}</h3>
                <p class="text-sm text-gray-600 mb-4">${(article.content || '').substring(0, 100)}...</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${(article.tags || []).map(tag => `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">${tag}</span>`).join('')}
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>
                        ${date}
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="px-4 py-2 bg-black text-white rounded-lg text-sm">
                            <i class="fas fa-eye mr-1"></i>
                            View
                        </button>
                        <button class="p-2 text-gray-400 hover:text-gray-600">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-gray-600">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    articlesHTML += '</div>';
    historyContent.innerHTML = articlesHTML;
}

function getFileTypeIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return { icon: 'fas fa-file-pdf text-red-600', bg: 'bg-red-100' };
        case 'docx':
        case 'doc':
            return { icon: 'fas fa-file-word text-blue-600', bg: 'bg-blue-100' };
        case 'ppt':
        case 'pptx':
            return { icon: 'fas fa-file-powerpoint text-orange-600', bg: 'bg-orange-100' };
        default:
            return { icon: 'fas fa-file-alt text-gray-600', bg: 'bg-gray-100' };
    }
}

// Settings Page
function setupSettingsPage() {
    const settingsContent = document.getElementById('settings-content');
    if (!settingsContent) return;

    settingsContent.innerHTML = `
        <div class="mb-6">
            <div class="flex space-x-1 border-b border-gray-200">
                <button class="px-4 py-2 text-sm font-medium text-purple-600 border-b-2 border-purple-600">Profile</button>
                <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Preferences</button>
                <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Integrations</button>
                <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">API Access</button>
                <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Security</button>
                <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Notifications</button>
            </div>
        </div>

        <div class="bg-white rounded-xl p-6 card-shadow">
            <div class="flex items-center mb-6">
                <i class="fas fa-user text-gray-600 mr-3"></i>
                <h3 class="text-lg font-semibold text-gray-900">Profile Information</h3>
            </div>
            
            <div class="flex items-start space-x-6 mb-6">
                <div class="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-xl font-bold">JD</span>
                </div>
                <div>
                    <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-camera mr-2"></i>
                        Upload Photo
                    </button>
                    <p class="text-xs text-gray-500 mt-1">Recommended: Square image, at least 400x400px</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" value="John" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" value="Doe" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
            </div>

            <div class="mt-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" value="john@example.com" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>

            <div class="mt-8">
                <button class="btn-primary text-white px-6 py-3 rounded-lg font-semibold">
                    <i class="fas fa-save mr-2"></i>
                    Save Changes
                </button>
            </div>
        </div>

        <div class="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div class="flex items-center mb-4">
                <i class="fas fa-trash text-red-600 mr-3"></i>
                <h3 class="text-lg font-semibold text-red-900">Danger Zone</h3>
            </div>
            <p class="text-red-700 mb-4">Permanently delete your account and all associated data.</p>
            <button class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                Delete Account
            </button>
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial state
    updateAuthState();

    // Login/Register forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerPage.classList.remove('active');
        loginPage.classList.add('active');
    });
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginPage.classList.remove('active');
        registerPage.classList.add('active');
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            navigateToPage(pageId);
            
            // Load specific page content
            if (pageId === 'history') {
                loadArticles();
            } else if (pageId === 'settings') {
                setupSettingsPage();
            }
        });
    });

    // File upload
    setupFileUpload();
});
