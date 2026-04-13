const resetForm = document.getElementById("reset-form");
const messageEl = document.getElementById("message");

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "https://www.lexiewrite.com/reset-password.html"
  });

  if (error) {
    messageEl.textContent = error.message;
    return;
  }

  messageEl.textContent = "Check your email for the password reset link.";
});
