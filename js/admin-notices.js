import { db, auth } from "./firebase-config.js";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Check login + admin role
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadNotices();
    } else {
        window.location.href = "../index.html";
    }
});

// POST NOTICE
window.postNotice = async function () {
    const title = document.getElementById("notice-title").value;
    const category = document.getElementById("notice-category").value;
    const message = document.getElementById("notice-message").value;
    const msg = document.getElementById("msg");

    if (!title || !category || !message) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Please fill all fields!";
        return;
    }

    try {
        await addDoc(collection(db, "notices"), {
            title: title,
            category: category,
            message: message,
            createdAt: serverTimestamp()
        });

        msg.style.color = "#4caf50";
        msg.textContent = "✅ Notice posted successfully!";

        // Clear form
        document.getElementById("notice-title").value = "";
        document.getElementById("notice-category").value = "";
        document.getElementById("notice-message").value = "";

    } catch (error) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Error: " + error.message;
    }
}

// LOAD ALL NOTICES
function loadNotices() {
    const q = query(
        collection(db, "notices"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const list = document.getElementById("notices-list");

        if (snapshot.empty) {
            list.innerHTML = '<p class="loading">No notices yet!</p>';
            return;
        }

        list.innerHTML = "";
        snapshot.forEach((document) => {
            const data = document.data();
            const date = data.createdAt?.toDate().toLocaleDateString() || "Just now";
            const catClass = data.category?.toLowerCase();

            list.innerHTML += `
                <div class="notice-card ${catClass}">
                    <div class="notice-top">
                        <span class="notice-title">${data.title}</span>
                        <span class="notice-category cat-${catClass}">${data.category}</span>
                    </div>
                    <p class="notice-body">${data.message}</p>
                    <div class="notice-bottom">
                        <span class="notice-date">📅 ${date}</span>
                        <button class="delete-btn" onclick="deleteNotice('${document.id}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
    });
}

// DELETE NOTICE
window.deleteNotice = async function (id) {
    if (confirm("Are you sure you want to delete this notice?")) {
        try {
            await deleteDoc(doc(db, "notices", id));
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    }
}