import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// REGISTER
window.registerUser = async function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    // Check IITP email
    if (!email.endsWith("@iitp.ac.in")) {
        errorMsg.textContent = "❌ Only @iitp.ac.in emails are allowed!";
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Save user in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: "student",
            createdAt: new Date()
        });

        errorMsg.style.color = "green";
        errorMsg.textContent = "✅ Registered! Check your IITP email to verify!";

    } catch (error) {
        errorMsg.style.color = "red";
        errorMsg.textContent = "❌ " + error.message;
    }
}

// LOGIN
window.loginUser = async function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    if (!email.endsWith("@iitp.ac.in")) {
        errorMsg.textContent = "❌ Only @iitp.ac.in emails are allowed!";
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            errorMsg.style.color = "orange";
            errorMsg.textContent = "⚠️ Please verify your email first!";
            return;
        }

        // Check role and redirect
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === "admin") {
                window.location.href = "admin/dashboard.html";
            } else {
                window.location.href = "student/dashboard.html";
            }
        }

    } catch (error) {
        errorMsg.style.color = "red";
        errorMsg.textContent = "❌ " + error.message;
    }
}