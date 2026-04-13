const signupForm = document.getElementById("signup-form");
const messageEl = document.getElementById("message");

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    messageEl.textContent = "Passwords do not match.";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "https://YOURDOMAIN.com/verify.html"
    }
  });

  if (error) {
    messageEl.textContent = error.message;
    return;
  }

  messageEl.textContent = "Account created. Check your email to confirm your account.";
});
