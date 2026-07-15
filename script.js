// আপনার দেওয়া নতুন আইফ্রেমের আসল লিঙ্কটি ডিফল্ট করা হলো
const defaultStream = "https://ritzembeds.pages.dev/play/fox-usa";
const adminPass = "admin123"; // আপনার পাসওয়ার্ড পরিবর্তন করতে চাইলে এখানে করবেন

// DOM Elements
const livePlayer = document.getElementById('livePlayer');
const subPopup = document.getElementById('subPopup');
const adminModal = document.getElementById('adminModal');
const openAdmin = document.getElementById('openAdmin');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const adminActions = document.getElementById('adminActions');
const loginBtn = document.getElementById('loginBtn');
const adminPassword = document.getElementById('adminPassword');
const newStreamLink = document.getElementById('newStreamLink');
const updateLinkBtn = document.getElementById('updateLinkBtn');
const subBtn = document.getElementById('subBtn');
const liveViewersText = document.getElementById('liveViewers');

// ১. পেজ লোড ও স্ট্রিম সেটআপ
window.addEventListener('DOMContentLoaded', () => {
    const savedLink = localStorage.getItem('currentStreamLink');
    if (savedLink) {
        livePlayer.src = savedLink;
    } else {
        livePlayer.src = defaultStream;
    }

    // ৫ সেকেন্ড পর সাবস্ক্রাইব পপআপ দেখানো
    setTimeout(() => {
        subPopup.classList.add('show');
    }, 5000);

    // লাইভ ভিউয়ার কাউন্টার শুরু করা
    startViewerCounter();
});

// ২. রিয়ালিস্টিক লাইভ ভিউয়ার কাউন্টার ফাংশন
function startViewerCounter() {
    let baseViewers = Math.floor(Math.random() * (16000 - 12000) + 12000); // ১২০০০ থেকে ১৬০০০ এর মধ্যে শুরু হবে
    liveViewersText.innerText = baseViewers.toLocaleString('bn-BD'); 

    setInterval(() => {
        // প্রতি ৪ সেকেন্ডে ভিউয়ার সংখ্যা একটু ফ্ল্যাকচুয়েট করবে (+/- ৫০ জন)
        const change = Math.floor(Math.random() * 101) - 50; 
        baseViewers += change;
        liveViewersText.innerText = baseViewers.toLocaleString('bn-BD');
    }, 4000);
}

// সাবস্ক্রাইব বাটনে ক্লিক করলে পপআপ বন্ধ করা
subBtn.addEventListener('click', () => {
    subPopup.classList.remove('show');
});

// ৩. অ্যাডমিন প্যানেল হ্যান্ডলার
openAdmin.addEventListener('click', () => {
    adminModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    adminModal.style.display = 'none';
    resetAdminForm();
});

// ৪. অ্যাডমিন লগইন ভেরিফিকেশন
loginBtn.addEventListener('click', () => {
    if (adminPassword.value === adminPass) {
        loginForm.classList.add('hidden');
        adminActions.classList.remove('hidden');
        newStreamLink.value = livePlayer.src;
    } else {
        alert('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
        adminPassword.value = '';
    }
});

// ৫. লিঙ্ক পরিবর্তন/আপডেট করা (স্মার্ট আইফ্রেম এক্সট্রাকশন সহ)
updateLinkBtn.addEventListener('click', () => {
    let inputVal = newStreamLink.value.trim();
    
    if (inputVal !== "") {
        // ইউজার যদি পুরো <iframe src="..."> কোড পেস্ট করে, তবে শুধু src এর ভেতরের URL-টি বের করার লজিক
        if (inputVal.includes('<iframe')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(inputVal, 'text/html');
            const iframeEl = doc.querySelector('iframe');
            if (iframeEl && iframeEl.src) {
                inputVal = iframeEl.src;
            } else {
                alert('আইফ্রেম কোডটি সঠিক নয়! দয়া করে আবার চেক করুন।');
                return;
            }
        }
        
        // প্লেয়ারে নতুন লিঙ্ক দেওয়া এবং লোকাল স্টোরেজে সেভ করা
        livePlayer.src = inputVal;
        localStorage.setItem('currentStreamLink', inputVal);
        alert('লাইভ স্ট্রিম সফলভাবে আপডেট করা হয়েছে!');
        adminModal.style.display = 'none';
        resetAdminForm();
    } else {
        alert('অনুগ্রহ করে একটি সঠিক লিঙ্ক বা আইফ্রেম কোড দিন।');
    }
});

// মডালের বাইরে ক্লিক করলে বন্ধ হওয়া
window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.style.display = 'none';
        resetAdminForm();
    }
});

function resetAdminForm() {
    adminPassword.value = '';
    loginForm.classList.remove('hidden');
    adminActions.classList.add('hidden');
}