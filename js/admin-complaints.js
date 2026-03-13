import { db, auth } from "./firebase-config.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let allComplaints = [];

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadComplaints();
    } else {
        window.location.href = "../index.html";
    }
});

// LOAD ALL COMPLAINTS
function loadComplaints() {
    const q = query(
        collection(db, "complaints"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        allComplaints = [];
        snapshot.forEach((document) => {
            allComplaints.push({ id: document.id, ...document.data() });
        });
        displayComplaints(allComplaints);
    });
}

// DISPLAY COMPLAINTS
function displayComplaints(complaints) {
    const list = document.getElementById("complaints-list");

    if (complaints.length === 0) {
        list.innerHTML = '<p class="loading">No complaints found!</p>';
        return;
    }

    list.innerHTML = "";
    complaints.forEach((complaint) => {
        const date = complaint.createdAt?.toDate().toLocaleDateString() || "Just now";

        // Check overdue
        let isOverdue = false;
        if (complaint.createdAt && complaint.status === "Pending") {
            const days = (new Date() - complaint.createdAt.toDate()) / (1000 * 60 * 60 * 24);
            if (days > 3) isOverdue = true;
        }

        const statusClass = isOverdue ? "status-overdue" :
            complaint.status === "Pending" ? "status-pending" :
            complaint.status === "In Progress" ? "status-progress" :
            "status-resolved";

        const statusText = isOverdue ? "⚠️ Overdue" : complaint.status;

        list.innerHTML += `
            <div class="admin-complaint-card">
                <div class="complaint-top">
                    <div>
                        <h4>${complaint.issueType} — Room ${complaint.roomNo}</h4>
                        <p class="student-email">👤 ${complaint.studentEmail}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <p class="complaint-desc">${complaint.description}</p>
                <div class="complaint-bottom">
                    <span class="complaint-date">📅 ${date} | 🔴 ${complaint.severity}</span>
                    <div class="status-actions">
                        <button onclick="updateStatus('${complaint.id}', 'Pending')" class="action-btn pending-btn">Pending</button>
                        <button onclick="updateStatus('${complaint.id}', 'In Progress')" class="action-btn progress-btn">In Progress</button>
                        <button onclick="updateStatus('${complaint.id}', 'Resolved')" class="action-btn resolved-btn">Resolved</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// UPDATE STATUS
window.updateStatus = async function(id, status) {
    try {
        await updateDoc(doc(db, "complaints", id), {
            status: status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// FILTER COMPLAINTS
window.filterComplaints = function(filter) {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.target.classList.add("active");

    if (filter === "All") {
        displayComplaints(allComplaints);
    } else if (filter === "Overdue") {
        const overdue = allComplaints.filter(c => {
            if (c.createdAt && c.status === "Pending") {
                const days = (new Date() - c.createdAt.toDate()) / (1000 * 60 * 60 * 24);
                return days > 3;
            }
            return false;
        });
        displayComplaints(overdue);
    } else {
        const filtered = allComplaints.filter(c => c.status === filter);
        displayComplaints(filtered);
    }
}