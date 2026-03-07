import { db, auth } from "./firebase-config.js";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUser = null;

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadComplaints();
    } else {
        window.location.href = "../index.html";
    }
});

// SUBMIT COMPLAINT
window.submitComplaint = async function () {
    const roomNo = document.getElementById("room-no").value;
    const issueType = document.getElementById("issue-type").value;
    const severity = document.getElementById("severity").value;
    const description = document.getElementById("description").value;
    const msg = document.getElementById("msg");

    // Validation
    if (!roomNo || !issueType || !severity || !description) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Please fill all fields!";
        return;
    }

    try {
        await addDoc(collection(db, "complaints"), {
            roomNo: roomNo,
            issueType: issueType,
            severity: severity,
            description: description,
            status: "Pending",
            studentEmail: currentUser.email,
            studentUid: currentUser.uid,
            createdAt: serverTimestamp()
        });

        msg.style.color = "#4caf50";
        msg.textContent = "✅ Complaint submitted successfully!";

        // Clear form
        document.getElementById("room-no").value = "";
        document.getElementById("issue-type").value = "";
        document.getElementById("severity").value = "";
        document.getElementById("description").value = "";

    } catch (error) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Error: " + error.message;
    }
}

// LOAD COMPLAINTS
function loadComplaints() {
    const list = document.getElementById("complaints-list");

    const q = query(
        collection(db, "complaints"),
        where("studentUid", "==", currentUser.uid),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = '<p class="loading">No complaints yet!</p>';
            return;
        }

        list.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.createdAt?.toDate().toLocaleDateString() || "Just now";

            // Check if overdue (more than 3 days and still pending)
            let isOverdue = false;
            if (data.createdAt && data.status === "Pending") {
                const days = (new Date() - data.createdAt.toDate()) / (1000 * 60 * 60 * 24);
                if (days > 3) isOverdue = true;
            }

            const statusClass = isOverdue ? "status-overdue" :
                data.status === "Pending" ? "status-pending" :
                data.status === "In Progress" ? "status-progress" :
                "status-resolved";

            const statusText = isOverdue ? "⚠️ Overdue" : data.status;

            list.innerHTML += `
                <div class="complaint-card">
                    <h4>${data.issueType} — Room ${data.roomNo}</h4>
                    <p>${data.description}</p>
                    <p>📅 ${date} | 🔴 ${data.severity}</p>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            `;
        });
    });
}

