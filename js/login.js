const loginForm = document.getElementById("login-form");
const loginMessageEl = document.getElementById("message");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMessageEl.textContent = error.message;
    return;
  }

  window.location.href = "dashboard.html";
});
