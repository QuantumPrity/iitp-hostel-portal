import { db, auth } from "./firebase-config.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let allFeedback = [];

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadFeedback();
    } else {
        window.location.href = "../index.html";
    }
});

// LOAD FEEDBACK
function loadFeedback() {
    const q = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        allFeedback = [];
        let totalRating = 0;

        snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            allFeedback.push(data);
            totalRating += data.rating || 0;
        });

        // Update stats
        document.getElementById("total-feedback").textContent = allFeedback.length;
        const avg = allFeedback.length > 0 ? (totalRating / allFeedback.length).toFixed(1) : 0;
        document.getElementById("avg-rating").textContent = avg + " ⭐";

        displayFeedback(allFeedback);
    });
}

// DISPLAY FEEDBACK
function displayFeedback(feedbackList) {
    const list = document.getElementById("feedback-list");

    if (feedbackList.length === 0) {
        list.innerHTML = '<p class="loading">No feedback yet!</p>';
        return;
    }

    list.innerHTML = "";
    feedbackList.forEach((item) => {
        const date = item.createdAt?.toDate().toLocaleDateString() || "Just now";
        const stars = "⭐".repeat(item.rating || 0);

        list.innerHTML += `
            <div class="admin-complaint-card">
                <div class="complaint-top">
                    <div>
                        <h4>${item.category}</h4>
                        <p class="student-email">🔒 Anonymous</p>
                    </div>
                    <span class="rating-display">${stars}</span>
                </div>
                <p class="complaint-desc">${item.message}</p>
                <span class="complaint-date">📅 ${date}</span>
            </div>
        `;
    });
}

// FILTER FEEDBACK
window.filterFeedback = function(category) {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.target.classList.add("active");

    if (category === "All") {
        displayFeedback(allFeedback);
    } else {
        const filtered = allFeedback.filter(f => f.category === category);
        displayFeedback(filtered);
    }
}