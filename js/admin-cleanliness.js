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

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadTodayLog();
    } else {
        window.location.href = "../index.html";
    }
});

// LOG CLEANING
window.logCleaning = async function () {
    const roomNo = document.getElementById("room-no").value;
    const studentEmail = document.getElementById("student-uid").value;
    const status = document.getElementById("clean-status").value;
    const msg = document.getElementById("msg");

    if (!roomNo || !studentEmail || !status) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Please fill all fields!";
        return;
    }

    const today = new Date().toDateString();

    try {
        await addDoc(collection(db, "cleanliness"), {
            roomNo: roomNo,
            studentUid: studentEmail, 
            studentEmail: studentEmail,
            status: status,
            date: today,
            createdAt: serverTimestamp()
        });

        msg.style.color = "#4caf50";
        msg.textContent = "✅ Cleaning logged successfully!";

        document.getElementById("room-no").value = "";
        document.getElementById("student-uid").value = "";
        document.getElementById("clean-status").value = "";

    } catch (error) {
        msg.style.color = "#e94560";
        msg.textContent = "❌ Error: " + error.message;
    }
}

// LOAD TODAY'S LOG
function loadTodayLog() {
    const today = new Date().toDateString();

    const q = query(
        collection(db, "cleanliness"),
        where("date", "==", today),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const log = document.getElementById("today-log");

        if (snapshot.empty) {
            log.innerHTML = '<p class="loading">No rooms logged today!</p>';
            return;
        }

        log.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const badgeClass = data.status === "Cleaned" ? "cleaned-badge" : "skipped-badge";
            const badgeText = data.status === "Cleaned" ? "✅ Cleaned" : "❌ Skipped";

            log.innerHTML += `
                <div class="history-item">
                    <p>🚪 Room ${data.roomNo} — ${data.studentEmail}</p>
                    <span class="${badgeClass}">${badgeText}</span>
                </div>
            `;
        });
    });
}