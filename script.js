// CHANGE THIS TO YOUR RENDER URL
const API_URL = 'https://luminawebserver.onrender.com/api/chat';

// Lumina avatar image (use your actual Lumina.png URL)
const LUMINA_AVATAR = 'Lumina.png';

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const chatMessages = document.getElementById('chatMessages');
    const navItems = document.querySelectorAll('.nav-item');

    // Mobile Navigation Drawer Selectors
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Sidebar View State Control Modifiers
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }

    // Attach Mobile Action Trigger Listeners
    if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleSidebar);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Section Routing Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const sections = document.querySelectorAll('.section');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');

            // Collapse drawer display when a link item is activated on mobile views
            closeSidebar();
        });
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Send on Enter (Shift+Enter for new line)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Quick command buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.dataset.command;
            chatInput.style.height = 'auto';
            sendMessage();
        });
    });

    sendBtn.addEventListener('click', sendMessage);
    clearBtn.addEventListener('click', clearChat);

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Remove welcome message
        const welcome = document.querySelector('.welcome-message');
        if (welcome) welcome.remove();

        // Add user message
        addMessage(message, true);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Typing indicator
        const typingDiv = createMessage('...', false, true);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            typingDiv.remove();

            if (data.response) {
                addMessage(data.response, false);
            } else if (data.error) {
                addMessage(`❌ Error: ${data.error}`, false);
            }
        } catch (error) {
            console.error('API Error:', error);
            typingDiv.remove();
            addMessage('❌ Connection error. Make sure the server is running at: ' + API_URL, false);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function linkify(escapedText) {
        let result = escapedText;
        result = result.replace(/([\w.+-]+@[\w-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" target="_blank" rel="noopener noreferrer">$1</a>');
        result = result.replace(/(https?:\/\/[^\s<]+)/g, (match) => {
            if (match.includes('</a>')) return match;
            return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });
        result = result.replace(/\n/g, '<br>');
        return result;
    }

    function createMessage(content, isUser, isTyping = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isUser ? 'user' : 'aeon'}`;

        // Avatar
        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.alt = isUser ? 'You' : 'Lumina';
        avatar.src = isUser 
            ? 'https://via.placeholder.com/40/FFD700/1a1a2e?text=U'
            : LUMINA_AVATAR;

        // Content
        const msgContent = document.createElement('div');
        msgContent.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        if (isTyping) {
            bubble.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
        } else {
            let displayContent = content;
            let mediaUrl = null;
            let mediaType = null;

            const imageMatch = content.match(/%%IMAGE_URL%%(.*?)%%END_IMAGE%%/);
            const videoMatch = content.match(/%%VIDEO_URL%%(.*?)%%END_VIDEO%%/);

            if (imageMatch) {
                mediaUrl = imageMatch[1];
                mediaType = 'image';
                displayContent = content.replace(/%%IMAGE_URL%%.*?%%END_IMAGE%%/, '');
            } else if (videoMatch) {
                mediaUrl = videoMatch[1];
                mediaType = 'video';
                displayContent = content.replace(/%%VIDEO_URL%%.*?%%END_VIDEO%%/, '');
            }

            bubble.innerHTML = isUser ? escapeHtml(displayContent) : linkify(escapeHtml(displayContent));

            // Add media if exists
            if (mediaType === 'image' && mediaUrl && !isUser) {
                const img = document.createElement('img');
                img.src = mediaUrl;
                img.crossOrigin = 'anonymous';
                img.style.cursor = 'pointer';
                img.onclick = () => window.open(mediaUrl, '_blank');
                bubble.appendChild(img);
            } else if (mediaType === 'video' && mediaUrl && !isUser) {
                const video = document.createElement('video');
                video.src = mediaUrl;
                video.controls = true;
                bubble.appendChild(video);
            }
        }

        msgContent.appendChild(bubble);
        wrapper.appendChild(avatar);
        wrapper.appendChild(msgContent);

        return wrapper;
    }

    function addMessage(content, isUser) {
        const msg = createMessage(content, isUser);
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function clearChat() {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <img src="${LUMINA_AVATAR}" class="welcome-logo" alt="Lumina">
                <h2>Welcome to Lumina AI</h2>
                <p>আপনার স্টাডি পার্টনার। যেকোনো প্রশ্ন করুন!</p>
                <div class="quick-commands">
                    <button class="quick-btn" data-command="!help">!help</button>
                    <button class="quick-btn" data-command="!joke">!joke</button>
                    <button class="quick-btn" data-command="!quote">!quote</button>
                </div>
            </div>
        `;
        
        // Re-attach quick button listeners
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                chatInput.value = btn.dataset.command;
                chatInput.style.height = 'auto';
                sendMessage();
            });
        });
    }
});

// Typing animation styles
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: inline-flex;
        gap: 4px;
        align-items: center;
    }
    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }
    @keyframes typing {
        0%, 60%, 100% { opacity: 0.5; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-8px); }
    }
`;
document.head.appendChild(style);