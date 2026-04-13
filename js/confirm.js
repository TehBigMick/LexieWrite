const messageEl = document.getElementById("message");

(async () => {
  const params = new URLSearchParams(window.location.search);
  const token_hash = params.get("token_hash");
  const type = params.get("type");

  if (!token_hash || !type) {
    messageEl.textContent = "Invalid confirmation link.";
    return;
  }

  const { error } = await supabaseClient.auth.verifyOtp({
    token_hash,
    type
  });

  if (error) {
    messageEl.textContent = "This confirmation link is invalid or has expired. Please sign up again.";
    return;
  }

  messageEl.textContent = "Your email has been confirmed. Redirecting to login...";

  setTimeout(() => {
    window.location.href = "/login.html";
  }, 1500);
})();
