import { db, auth } from "./firebase-config.js";
import {
    collection,
    query,
    onSnapshot,
    getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadStats();
        loadCharts();
    } else {
        window.location.href = "../index.html";
    }
});

// LOAD STATS
async function loadStats() {
    // Total complaints
    const complaintsSnap = await getCountFromServer(collection(db, "complaints"));
    document.getElementById("total-complaints").textContent = complaintsSnap.data().count;

    // Feedback count
    const feedbackSnap = await getCountFromServer(collection(db, "feedback"));
    document.getElementById("total-feedback").textContent = feedbackSnap.data().count;

    // Pending + Resolved
    onSnapshot(collection(db, "complaints"), (snapshot) => {
        let pending = 0, resolved = 0;
        snapshot.forEach((doc) => {
            if (doc.data().status === "Pending") pending++;
            if (doc.data().status === "Resolved") resolved++;
        });
        document.getElementById("pending-complaints").textContent = pending;
        document.getElementById("resolved-complaints").textContent = resolved;
    });
}

// LOAD CHARTS
function loadCharts() {
    // Complaints by type chart
    onSnapshot(collection(db, "complaints"), (snapshot) => {
        const types = {};
        snapshot.forEach((doc) => {
            const type = doc.data().issueType || "Other";
            types[type] = (types[type] || 0) + 1;
        });

        const ctx1 = document.getElementById("complaintsChart").getContext("2d");
        new Chart(ctx1, {
            type: "doughnut",
            data: {
                labels: Object.keys(types),
                datasets: [{
                    data: Object.values(types),
                    backgroundColor: [
                        "#e94560", "#2196f3", "#4caf50",
                        "#ffc107", "#9c27b0", "#ff5722"
                    ]
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: { color: "rgba(255,255,255,0.7)" }
                    }
                }
            }
        });
    });

    // Ratings chart
    onSnapshot(collection(db, "feedback"), (snapshot) => {
        const ratings = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        snapshot.forEach((doc) => {
            const r = doc.data().rating;
            if (r) ratings[r]++;
        });

        const ctx2 = document.getElementById("ratingsChart").getContext("2d");
        new Chart(ctx2, {
            type: "bar",
            data: {
                labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],
                datasets: [{
                    label: "Responses",
                    data: Object.values(ratings),
                    backgroundColor: "#e94560"
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: { color: "rgba(255,255,255,0.7)" }
                    }
                },
                scales: {
                    x: { ticks: { color: "rgba(255,255,255,0.7)" } },
                    y: { ticks: { color: "rgba(255,255,255,0.7)" } }
                }
            }
        });
    });
}