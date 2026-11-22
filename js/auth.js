// Wanderlist: handles the register and login forms by calling the API
const form = document.querySelector("form");
const message = document.getElementById("message");
const isRegister = location.pathname.endsWith("register.html");

function show(text, ok = false) {
    message.textContent = text;
    message.className = "form-message " + (ok ? "ok" : "error");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    if (isRegister && data.password !== data.confirm_password) {
        return show("Passwords do not match.");
    }

    const url = isRegister ? "/api/register" : "/api/login";
    const body = isRegister
        ? { username: data.username, email: data.email, password: data.password }
        : { username: data.username, password: data.password };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const json = await res.json();

        if (!res.ok) {
            return show(json.error || "Something went wrong.");
        }

        if (isRegister) {
            show("Account created! Redirecting to log in...", true);
            setTimeout(() => (location.href = "login.html"), 1200);
        } else {
            localStorage.setItem("token", json.token);
            localStorage.setItem("username", json.username);
            location.href = "index.html";
        }
    } catch (err) {
        show("Could not reach the server.");
    }
});