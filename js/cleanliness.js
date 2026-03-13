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

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadCleaningHistory();
        checkTodayStatus();
    } else {
        window.location.href = "../index.html";
    }
});

// CHECK TODAY'S STATUS
function checkTodayStatus() {
    const today = new Date().toDateString();

    const q = query(
        collection(db, "cleanliness"),
        where("date", "==", today),
        where("studentEmail", "==", currentUser.email)
    );

    onSnapshot(q, (snapshot) => {
        const icon = document.getElementById("status-icon");
        const title = document.getElementById("status-title");
        const desc = document.getElementById("status-desc");
        const card = document.getElementById("my-room-status");

        if (snapshot.empty) {
            icon.textContent = "⏳";
            title.textContent = "Not Updated Yet";
            desc.textContent = "Cleaning status for today hasn't been logged yet";
            card.className = "status-card";
        } else {
            const data = snapshot.docs[0].data();
            if (data.status === "Cleaned") {
                icon.textContent = "✅";
                title.textContent = "Room Cleaned Today!";
                desc.textContent = "Your room has been cleaned today";
                card.className = "status-card status-cleaned";
            } else {
                icon.textContent = "❌";
                title.textContent = "Room Not Cleaned";
                desc.textContent = "Your room was skipped today";
                card.className = "status-card status-not-cleaned";
            }
        }
    });
}

// LOAD CLEANING HISTORY
function loadCleaningHistory() {
    const q = query(
        collection(db, "cleanliness"),
        where("studentEmail", "==", currentUser.email),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const history = document.getElementById("cleaning-history");

        if (snapshot.empty) {
            history.innerHTML = '<p class="loading">No cleaning records yet!</p>';
            return;
        }

        history.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const badgeClass = data.status === "Cleaned" ? "cleaned-badge" : "skipped-badge";
            const badgeText = data.status === "Cleaned" ? "✅ Cleaned" : "❌ Skipped";

            history.innerHTML += `
                <div class="history-item">
                    <p>📅 ${data.date} — Room ${data.roomNo}</p>
                    <span class="${badgeClass}">${badgeText}</span>
                </div>
            `;
        });
    });
}

// REPORT ISSUE
window.reportIssue = async function () {
    const roomNo = document.getElementById("room-no").value;
    const issueDesc = document.getElementById("issue-desc").value;
    const msg = document.getElementById("msg");

    if (!roomNo || !issueDesc) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Please fill all fields!";
        return;
    }

    try {
        await addDoc(collection(db, "cleanliness_issues"), {
            roomNo: roomNo,
            issue: issueDesc,
            studentEmail: currentUser.email,
            studentUid: currentUser.uid,
            status: "Pending",
            createdAt: serverTimestamp()
        });

        msg.style.color = "#4caf50";
        msg.textContent = "✅ Issue reported successfully!";
        document.getElementById("room-no").value = "";
        document.getElementById("issue-desc").value = "";

    } catch (error) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Error: " + error.message;
    }
}