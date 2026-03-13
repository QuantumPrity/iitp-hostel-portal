import { db, auth } from "./firebase-config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentRating = 0;

// Check login
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// SET RATING
window.setRating = function(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll(".stars span");
    stars.forEach((star, index) => {
        star.style.opacity = index < rating ? "1" : "0.3";
    });
    document.getElementById("rating-text").textContent = rating + " / 5 stars";
}

// SUBMIT FEEDBACK
window.submitFeedback = async function() {
    const category = document.getElementById("feedback-category").value;
    const message = document.getElementById("feedback-msg").value;
    const msg = document.getElementById("msg");

    if (!category || !message || currentRating === 0) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Please fill all fields and give a rating!";
        return;
    }

    try {
        await addDoc(collection(db, "feedback"), {
            category: category,
            message: message,
            rating: currentRating,
            createdAt: serverTimestamp()
            // NO email, NO uid — completely anonymous!
        });

        msg.style.color = "#4caf50";
        msg.textContent = "✅ Feedback submitted anonymously!";

        // Clear form
        document.getElementById("feedback-category").value = "";
        document.getElementById("feedback-msg").value = "";
        document.getElementById("rating-text").textContent = "Not rated";
        currentRating = 0;
        document.querySelectorAll(".stars span").forEach(s => s.style.opacity = "1");

    } catch (error) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Error: " + error.message;
    }
}