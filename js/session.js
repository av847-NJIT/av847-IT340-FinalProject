// Wanderlist: shows the signed-in user in the nav bar
const savedUser = localStorage.getItem("username");
const savedToken = localStorage.getItem("token");
const navLinks = document.querySelector(".nav-links");

if (savedUser && savedToken && navLinks) {
    const item = (el) => {
        const li = document.createElement("li");
        li.appendChild(el);
        return li;
    };

    const home = document.createElement("a");
    home.href = "index.html";
    home.textContent = "Home";
    home.setAttribute("aria-current", "page");

    const hello = document.createElement("span");
    hello.className = "nav-user";
    hello.textContent = "Hi, " + savedUser;

    const logout = document.createElement("a");
    logout.href = "#";
    logout.textContent = "Log out";
    logout.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        location.reload();
    });

    navLinks.replaceChildren(item(home), item(hello), item(logout));
}