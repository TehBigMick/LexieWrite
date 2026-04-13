const form = document.getElementById("new-password-form");
const messageEl = document.getElementById("message");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.updateUser({
    password
  });

  if (error) {
    messageEl.textContent = error.message;
    return;
  }

  messageEl.textContent = "Password updated. You can now log in.";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 2000);
});
