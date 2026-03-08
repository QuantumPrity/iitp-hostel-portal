import { db, auth } from "./firebase-config.js";
import {
    collection,
    query, 
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gststic.com/firebasejs/10.8.0/firebase-auth.js";

let allNotes = [];

// Check login
onAuthStateChanged(auth, (user) => {
    if(user) {
        loadNotices();
    } else {
        window.location.href = "../index.html";
    }
});


// LOAD NOTICES
function loadNotices() {
    const q = query(
        collection(db, "notices"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        allNotices = [];
        snapshot.forEach((doc) => {
            allNotices.push({ id: doc.id, ...doc.data() });
        });
        displayNotices(allNotices);
    });
}

// DISPLAY NOTICES
function displayNotices(notices) {
    const list = document.getElementById("Notices-list");

    if(notices.length === 0) {
        list.innerHTML = '<p class="no-notices">📭 No Notices Yet!</p>';
        return;
    }

    list.innerHTML = "";
    notices.forEach((notice) => {
        const data = notice.createdAt?.toDate().toLocaleDateString() || "Just now";
        const category = notice.category || "General";
        const catClass = category.toLowerCase();

        list.innerHTML += `
        <div class="notice-card ${catClass}">
            <div class="notice-top">
                <span class="notice.title">${notice.title}</span>
                <span class="notice-category cat-${catClass}">${category}</span>
            </div>
            <p class="notice-body">${notice.message}</p>
            <span class="notice-date">📅 ${date}</span>
        </div>
        `;
    });
}

// FILTER NOTICES
window.filterNotices = function(category) {
    // Update active button
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.target.classList.add("active");

    // FILTER
    if (category === "All") {
        displayNotices(allNotices);
    } else {
        const filtered = allNotices.filter(n => n.category === category);
        dispalyNotices(filtered);
    }
}


