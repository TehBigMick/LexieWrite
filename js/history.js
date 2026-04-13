(async () => {
  const historyList = document.getElementById("history-list");

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("essays")
    .select("id, task_type, prompt_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    historyList.innerHTML = `<div class="card">Could not load essay history.</div>`;
    return;
  }

  if (!data || data.length === 0) {
    historyList.innerHTML = `<div class="card">No essays saved yet.</div>`;
    return;
  }

  historyList.innerHTML = data.map(essay => `
    <div class="card">
      <h3>${essay.task_type}</h3>
      <p>${essay.prompt_text || "No prompt saved."}</p>
      <small>${new Date(essay.created_at).toLocaleString()}</small>
    </div>
  `).join("");
})();
