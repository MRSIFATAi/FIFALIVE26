// =========================================================================
// 🔑 কনফিগারেশন এবং সিকিউরিটি (পাসওয়ার্ড পরিবর্তন করতে নিচের adminPass টি বদলে দিন)
// =========================================================================
const adminPass = "Password123"; // আপনার নতুন পাসওয়ার্ড এখানে দিন

// 🌍 আপনার Firebase অ্যাকাউন্ট থেকে এই Config কোডটি কপি করে নিচে বসাবেন।
// যদি ফায়ারবেজ ব্যবহার না করতে চান, তবে এটি এভাবেই রেখে দিন—কোনো এরর হবে না।
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "https://YOUR_DATABASE_NAME.firebaseio.com", 
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 🎯 ডিফল্ট ব্যাকআপ ডেটা (ফায়ারবেজ কানেক্ট না থাকলে বা খালি থাকলে এটি কাজ করবে)
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
let database = null;
let isFirebaseReady = false;

// =========================================================================
// 🔒 ১. আনলক ওভারলে বাটন লজিক (এটি সবার আগে দেওয়া হয়েছে যেন সবসময় কাজ করে)
// =========================================================================
if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
        unlockBtn.style.pointerEvents = 'none';
        unlockBtn.style.opacity = '0.6';
        if (lockIcon) {
            lockIcon.className = "fa-solid fa-lock-open";
            lockIcon.style.color = "#00ff88";
        }

        let timeLeft = 5;
        countdownText.innerText = `লিঙ্ক আনলক হচ্ছে... ${timeLeft} সেকেন্ড`;

        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdownText.innerText = `লিঙ্ক আনলক হচ্ছে... ${timeLeft} সেকেন্ড`;
            } else {
                clearInterval(timer);
                if (unlockOverlay) {
                    unlockOverlay.style.opacity = '0';
                    setTimeout(() => { unlockOverlay.style.display = 'none'; }, 500);
                }
            }
        }, 1000);
    });
}

// =========================================================================
// 📡 ২. নিরাপদ ফায়ারবেজ ইনিশিয়ালাইজেশন (Try-Catch Safety)
// =========================================================================
try {
    // চেক করা হচ্ছে ইউজার placeholders পরিবর্তন করেছেন কিনা
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        isFirebaseReady = true;
        console.log("Firebase successfully connected!");
    } else {
        console.warn("Firebase config is handling placeholders. Falling back to local storage mode.");
    }
} catch (error) {
    console.error("Firebase initialization failed, switching to local mode:", error);
    isFirebaseReady = false;
}

// =========================================================================
// ⏱️ ৩. পেজ লোড ও রিয়েল-টাইম সিঙ্ক কন্ট্রোল
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (isFirebaseReady && database) {
        // ফায়ারবেজ মোড: ক্লাউড থেকে ডাটা রিড করা
        database.ref('liveSettings').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                livePlayer.src = data.streamLink || defaultStream;
                nextMatchTitle.innerText = data.matchTitle || defaultMatchTitle;
                globalMatchTime = data.matchTime || defaultMatchTime;
                runCountdownLogic(globalMatchTime);
            } else {
                useLocalFallback();
            }
        });
        // ১০০% অরিজিনাল লাইভ ভিউয়ার ট্র্যাকিং
        startRealtimePresence();
    } else {
        // লোকাল মোড: ফায়ারবেজ না থাকলে ব্রাউজার মেমোরি থেকে ডাটা লোড হবে
        useLocalFallback();
        // ডাইনামিক ভিউয়ার কাউন্টার সিমুলেশন শুরু
        startViewerCounterSimulation();
    }
});

// লোকাল ব্যাকআপ লোড ফাংশন
function useLocalFallback() {
    const savedLink = localStorage.getItem('currentStreamLink') || defaultStream;
    const savedTitle = localStorage.getItem('matchTitle') || defaultMatchTitle;
    globalMatchTime = localStorage.getItem('matchTime') || defaultMatchTime;

    livePlayer.src = savedLink;
    nextMatchTitle.innerText = savedTitle;
    runCountdownLogic(globalMatchTime);
}

// =========================================================================
// 👥 ৪. ভিউয়ার কাউন্টার ম্যানেজমেন্ট (Original vs Simulated)
// =========================================================================
// ক) অরিজিনাল ফায়ারবেজ ট্র্যাকিং
function startRealtimePresence() {
    const myPresenceRef = database.ref('online_users').push();
    const connectionsRef = database.ref('.info/connected');
    const totalOnlineRef = database.ref('online_users');

    connectionsRef.on('value', (snap) => {
        if (snap.val() === true) {
            myPresenceRef.onDisconnect().remove();
            myPresenceRef.set(true);
        }
    });

    totalOnlineRef.on('value', (snap) => {
        const userCount = snap.numChildren() || 1;
        liveViewersText.innerText = userCount.toLocaleString('bn-BD');
    });
}

// খ) লোকাল সিমুলেশন (ফায়ারবেজ একটিভ না থাকলে এটি সাময়িক ব্যাকআপ হিসেবে সুন্দর ভিউ দেখাবে)
function startViewerCounterSimulation() {
    let baseViewers = Math.floor(Math.random() * (2400 - 1800) + 1800); 
    liveViewersText.innerText = baseViewers.toLocaleString('bn-BD'); 

    setInterval(() => {
        const change = Math.floor(Math.random() * 41) - 20; 
        baseViewers += change;
        if(baseViewers < 1) baseViewers = 1;
        liveViewersText.innerText = baseViewers.toLocaleString('bn-BD');
    }, 3000);
}

// =========================================================================
// ⏱️ ৫. কাউন্টডাউন টাইমার কোর লজিক
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
// 🛠️ ৬. অ্যাডমিন প্যানেল লজিক
// =========================================================================
openAdmin.addEventListener('click', () => { adminModal.style.display = 'flex'; });
closeModal.addEventListener('click', () => { adminModal.style.display = 'none'; resetAdminForm(); });

loginBtn.addEventListener('click', () => {
    if (adminPassword.value === adminPass) {
        loginForm.classList.add('hidden');
        adminActions.classList.remove('hidden');
        
        newStreamLink.value = livePlayer.src;
        matchTitleInput.value = nextMatchTitle.innerText;
        matchDateTimeInput.value = globalMatchTime;
    } else {
        alert('ভুল পাসওয়ার্ড!');
        adminPassword.value = '';
    }
});

updateAdminBtn.addEventListener('click', () => {
    let streamUrl = newStreamLink.value.trim();
    const matchTitleVal = matchTitleInput.value.trim();
    const matchTimeVal = matchDateTimeInput.value;

    if (streamUrl.includes('<iframe')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(streamUrl, 'text/html');
        const iframeEl = doc.querySelector('iframe');
        if (iframeEl && iframeEl.src) streamUrl = iframeEl.src;
        else { alert('ভুল আইফ্রেম কোড!'); return; }
    }

    if (isFirebaseReady && database) {
        // ফায়ারবেজে ক্লাউড আপডেট
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
    } else {
        // লোকাল মেমোরি আপডেট (ফায়ারবেজ ছাড়া টেস্ট করার জন্য)
        if(streamUrl !== "") {
            livePlayer.src = streamUrl;
            localStorage.setItem('currentStreamLink', streamUrl);
        }
        if(matchTitleVal !== "") {
            localStorage.setItem('matchTitle', matchTitleVal);
            nextMatchTitle.innerText = matchTitleVal;
        }
        if(matchTimeVal !== "") {
            localStorage.setItem('matchTime', matchTimeVal);
            globalMatchTime = matchTimeVal;
        }
        runCountdownLogic(globalMatchTime);
        
        alert('লোকাল মেমোরিতে আপডেট হয়েছে! (ফায়ারবেজ অফ থাকায় এটি শুধু এই ব্রাউজারেই দেখাবে)');
        adminModal.style.display = 'none';
        resetAdminForm();
    }
});

window.addEventListener('click', (e) => {
    if (e.target === adminModal) { adminModal.style.display = 'none'; resetAdminForm(); }
});

function resetAdminForm() {
    adminPassword.value = '';
    loginForm.classList.remove('hidden');
    adminActions.classList.add('hidden');
    }
