(async () => {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (user) {
    const emailEl = document.getElementById("user-email");
    if (emailEl) {
      emailEl.textContent = `Logged in as: ${user.email}`;
    }
  }

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });

  const essayForm = document.getElementById("essay-form");
  const messageEl = document.getElementById("essay-message");
  const latestResultEl = document.getElementById("latest-result");
  const recentEvaluationsEl = document.getElementById("recent-evaluations");

  const renderDemoResult = (taskType, essayText) => {
    const wordCount = essayText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    latestResultEl.innerHTML = `
      <div class="result-block">
        <p><strong>Status:</strong> Frontend ready. Supabase scoring connection not added yet.</p>

        <div class="score-grid">
          <div class="score-item">
            <strong>Overall Band</strong>
            <span>--</span>
          </div>
          <div class="score-item">
            <strong>Task</strong>
            <span>--</span>
          </div>
          <div class="score-item">
            <strong>Coherence</strong>
            <span>--</span>
          </div>
          <div class="score-item">
            <strong>Lexical</strong>
            <span>--</span>
          </div>
          <div class="score-item">
            <strong>Grammar</strong>
            <span>--</span>
          </div>
          <div class="score-item">
            <strong>Word Count</strong>
            <span>${wordCount}</span>
          </div>
        </div>

        <div class="result-section">
          <h3>Submission details</h3>
          <p><strong>Task type:</strong> ${formatTaskType(taskType)}</p>
        </div>

        <div class="result-section">
          <h3>What happens next</h3>
          <ul>
            <li>The essay form is now working on the page.</li>
            <li>The scoring function and database save step still need to be connected.</li>
          </ul>
        </div>
      </div>
    `;
  };

  const renderRecentPlaceholder = (taskType, wordCount) => {
    const now = new Date();
    recentEvaluationsEl.innerHTML = `
      <div class="recent-item">
        <p><strong>Most recent submission</strong></p>
        <p>Task type: ${formatTaskType(taskType)}</p>
        <p>Word count: ${wordCount}</p>
        <p class="muted-text">Submitted at: ${now.toLocaleString()}</p>
      </div>
    `;
  };

  essayForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = essayForm.querySelector('button[type="submit"]');
    const taskType = document.getElementById("task-type").value;
    const promptText = document.getElementById("essay-prompt").value.trim();
    const essayText = document.getElementById("essay-text").value.trim();

    if (!essayText) {
      messageEl.textContent = "Please paste an essay before submitting.";
      messageEl.classList.remove("success");
      return;
    }

    submitBtn.disabled = true;
    messageEl.textContent = "Essay received. Frontend submission is working.";
    messageEl.classList.add("success");

    const wordCount = essayText.split(/\s+/).filter(Boolean).length;

    renderDemoResult(taskType, essayText);
    renderRecentPlaceholder(taskType, wordCount);

    console.log("Essay form submission ready for backend connection:", {
      task_type: taskType,
      prompt_text: promptText,
      essay_text: essayText
    });

    submitBtn.disabled = false;
  });

  function formatTaskType(taskType) {
    switch (taskType) {
      case "academic_task_1":
        return "Academic Task 1";
      case "academic_task_2":
        return "Academic Task 2";
      case "general_task_1":
        return "General Task 1";
      default:
        return taskType;
    }
  }
})();
