(async () => {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (user) {
    const emailEl = document.getElementById("user-email");
    if (emailEl) emailEl.textContent = `Logged in as: ${user.email}`;
  }

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
})();
