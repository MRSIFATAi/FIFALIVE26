// =========================================================================
// 🔑 কনফিগারেশন এবং সিকিউরিটি (পাসওয়ার্ড পরিবর্তন করতে নিচের adminPass টি বদলে দিন)
// =========================================================================
const adminPass = "Password123"; // আপনার নতুন পাসওয়ার্ড এখানে দিন

// 🌍 আপনার Firebase অ্যাকাউন্ট থেকে এই Config কোডটি কপি করে নিচে বসাবেন:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "https://YOUR_DATABASE_NAME.firebaseio.com", // এটি খুব গুরুত্বপূর্ণ
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🎯 ডিফল্ট ব্যাকআপ ডেটা (ফায়ারবেজ খালি থাকলে এটি কাজ করবে)
const defaultStream = "https://ritzembeds.pages.dev/play/fox-usa";
const defaultMatchTitle = "Argentina vs Spain";
const defaultMatchTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0,16);

// DOM Elements
const livePlayer = document.getElementById('livePlayer');
const unlockOverlay = document.getElementById('unlockOverlay');
const unlockBtn = document.getElementById('unlockBtn');
const countdownText = document.getElementById('countdownText');
const lockIcon = document.getElementById('lockIcon');
const adminModal = document.getElementById('adminModal');
const openAdmin = document.getElementById('openAdmin');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const adminActions = document.getElementById('adminActions');
const loginBtn = document.getElementById('loginBtn');
const adminPassword = document.getElementById('adminPassword');
const newStreamLink = document.getElementById('newStreamLink');
const matchTitleInput = document.getElementById('matchTitleInput');
const matchDateTimeInput = document.getElementById('matchDateTimeInput');
const updateAdminBtn = document.getElementById('updateAdminBtn');
const liveViewersText = document.getElementById('liveViewers');
const nextMatchTitle = document.getElementById('nextMatchTitle');
const nextMatchDateDisplay = document.getElementById('nextMatchDateDisplay');

let countdownInterval;
let globalMatchTime = defaultMatchTime;

// =========================================================================
// 📡 ফায়ারবেজ রিয়েল-টাইম ডাটা সিঙ্ক (Realtime Sync)
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    // ফায়ারবেজ থেকে লাইভ ডাটা রিড করা (যেকোনো ভিজিটর ঢুকলেই অটো আপডেট হবে)
    database.ref('liveSettings').on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // ১. স্ট্রিম লিংক আপডেট
            livePlayer.src = data.streamLink || defaultStream;
            
            // ২. পরবর্তী ম্যাচের নাম আপডেট
            nextMatchTitle.innerText = data.matchTitle || defaultMatchTitle;
            
            // ৩. ম্যাচের সময় ও কাউন্টডাউন আপডেট
            globalMatchTime = data.matchTime || defaultMatchTime;
            runCountdownLogic(globalMatchTime);
        } else {
            // ডাটাবেজ প্রথমবার খালি থাকলে ডিফল্ট ডেটা সেট করা
            livePlayer.src = defaultStream;
            nextMatchTitle.innerText = defaultMatchTitle;
            runCountdownLogic(defaultMatchTime);
        }
    });

    // 👥 ১০০% অরিজিনাল লাইভ ভিউয়ার ট্র্যাকিং সিস্টেম শুরু
    startRealtimePresence();
});

// =========================================================================
// 👥 অরিজিনাল ভিউয়ার কাউন্টার (Firebase Presence System)
// =========================================================================
function startRealtimePresence() {
    const myPresenceRef = database.ref('online_users').push();
    const connectionsRef = database.ref('.info/connected');
    const totalOnlineRef = database.ref('online_users');

    connectionsRef.on('value', (snap) => {
        if (snap.val() === true) {
            // ইউজার সাইটে ঢুকলে ডাটাবেজে এন্ট্রি হবে, ট্যাব বা ব্রাউজার বন্ধ করলে অটো ডিলিট হবে
            myPresenceRef.onDisconnect().remove();
            myPresenceRef.set(true);
        }
    });

    // ডাটাবেজে টোটাল কতজন একটিভ আছে তা রিয়েল-টাইমে গণনা করে স্ক্রিনে দেখানো
    totalOnlineRef.on('value', (snap) => {
        const userCount = snap.numChildren() || 1; // কেউ না থাকলে অন্তত ১ জন (আপনি নিজে) দেখাবে
        liveViewersText.innerText = userCount.toLocaleString('bn-BD');
    });
}

// =========================================================================
// ⏱️ কাউন্টডাউন টাইমার লজিক
// =========================================================================
function runCountdownLogic(targetTimeString) {
    const matchDate = new Date(targetTimeString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    nextMatchDateDisplay.innerText = `তারিখ: ${matchDate.toLocaleDateString('bn-BD', options)}`;

    if (countdownInterval) clearInterval(countdownInterval);

    function updateTimer() {
        const now = new Date().getTime();
        const distance = matchDate.getTime() - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('days').innerText = "00";
            document.getElementById('hours').innerText = "00";
            document.getElementById('minutes').innerText = "00";
            document.getElementById('seconds').innerText = "00";
            return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = d < 10 ? '0' + d : d;
        document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
        document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
        document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// =========================================================================
// 🔓 আনলক ওভারলে বাটন লজিক
// =========================================================================
unlockBtn.addEventListener('click', () => {
    unlockBtn.style.pointerEvents = 'none';
    unlockBtn.style.opacity = '0.6';
    lockIcon.className = "fa-solid fa-lock-open";
    lockIcon.style.color = "#00ff88";

    let timeLeft = 5;
    countdownText.innerText = `লিঙ্ক আনলক হচ্ছে... ${timeLeft} সেকেন্ড`;

    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            countdownText.innerText = `লিঙ্ক আনলক হচ্ছে... ${timeLeft} সেকেন্ড`;
        } else {
            clearInterval(timer);
            unlockOverlay.style.opacity = '0';
            setTimeout(() => { unlockOverlay.style.display = 'none'; }, 500);
        }
    }, 1000);
});

// =========================================================================
// 🛠️ অ্যাডমিন প্যানেল লজিক (Firebase-এ ডাটা পুশ করা)
// =========================================================================
openAdmin.addEventListener('click', () => { adminModal.style.display = 'flex'; });
closeModal.addEventListener('click', () => { adminModal.style.display = 'none'; resetAdminForm(); });

loginBtn.addEventListener('click', () => {
    if (adminPassword.value === adminPass) {
        loginForm.classList.add('hidden');
        adminActions.classList.remove('hidden');
        
        // বর্তমান ফিল্ডগুলো লোড করা
        newStreamLink.value = livePlayer.src;
        matchTitleInput.value = nextMatchTitle.innerText;
        matchDateTimeInput.value = globalMatchTime;
    } else {
        alert('ভুল পাসওয়ার্ড!');
        adminPassword.value = '';
    }
});

// সব তথ্য একসাথে ফায়ারবেজ ক্লাউডে আপলোড করার ইভেন্ট
updateAdminBtn.addEventListener('click', () => {
    let streamUrl = newStreamLink.value.trim();
    const matchTitleVal = matchTitleInput.value.trim();
    const matchTimeVal = matchDateTimeInput.value;

    // আইফ্রেম সোর্স এক্সট্রাকশন
    if (streamUrl.includes('<iframe')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(streamUrl, 'text/html');
        const iframeEl = doc.querySelector('iframe');
        if (iframeEl && iframeEl.src) streamUrl = iframeEl.src;
        else { alert('ভুল আইফ্রেম কোড!'); return; }
    }

    // 🚀 ফায়ারবেজ রিয়েল-টাইম ডাটাবেজে ডাটা সেভ করা হচ্ছে
    database.ref('liveSettings').set({
        streamLink: streamUrl || defaultStream,
        matchTitle: matchTitleVal || defaultMatchTitle,
        matchTime: matchTimeVal || defaultMatchTime
    }).then(() => {
        alert('ফায়ারবেজ ক্লাউডে সব কিছু সফলভাবে আপডেট হয়েছে!');
        adminModal.style.display = 'none';
        resetAdminForm();
    }).catch((error) => {
        alert('ত্রুটি ঘটেছে: ' + error.message);
    });
});

window.addEventListener('click', (e) => {
    if (e.target === adminModal) { adminModal.style.display = 'none'; resetAdminForm(); }
});

function resetAdminForm() {
    adminPassword.value = '';
    loginForm.classList.remove('hidden');
    adminActions.classList.add('hidden');
                        }    if (e.target === adminModal) {
        adminModal.style.display = 'none';
        resetAdminForm();
    }
});

function resetAdminForm() {
    adminPassword.value = '';
    loginForm.classList.remove('hidden');
    adminActions.classList.add('hidden');
}
