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

  essayForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = essayForm.querySelector('button[type="submit"]');
    const taskType = document.getElementById("task-type").value;
    const promptText = document.getElementById("essay-prompt").value.trim();
    const essayText = document.getElementById("essay-text").value.trim();

    if (!essayText) {
      showMessage("Please paste an essay before submitting.", false);
      return;
    }

    if (essayText.split(/\s+/).filter(Boolean).length < 20) {
      showMessage("The essay is too short to evaluate properly.", false);
      return;
    }

    submitBtn.disabled = true;
    showMessage("Evaluating essay...", true, false);

    try {
      const {
        data: { session }
      } = await supabaseClient.auth.getSession();

      console.log("Supabase session:", session);

      if (!session?.access_token) {
        showMessage("You are not logged in properly. Please log out and log back in.", false);
        submitBtn.disabled = false;
        return;
      }

      const response = await fetch(
        "https://njuymuqeevkuqfubimio.supabase.co/functions/v1/score-essay",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdXltdXFlZXZrdXFmdWJpbWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjM2NDMsImV4cCI6MjA5MTU5OTY0M30.W--9HT9lIYAwXcM5_AyCKQzML04H5UhxFF7YtK4hkns"
          },
          body: JSON.stringify({
            task_type: taskType,
            prompt_text: promptText,
            essay_text: essayText
          })
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Could not parse function response as JSON:", jsonError);
        showMessage("The server returned an unreadable response.", false);
        submitBtn.disabled = false;
        return;
      }

      if (!response.ok) {
        console.error("Function response error:", data);
        showMessage(
          data?.details || data?.error || "Could not evaluate the essay. Please try again.",
          false
        );
        submitBtn.disabled = false;
        return;
      }

      if (!data || !data.evaluation) {
        console.error("Unexpected response:", data);
        showMessage("The server returned an invalid response.", false);
        submitBtn.disabled = false;
        return;
      }

      const result = data.evaluation;
      const wordCount = essayText.split(/\s+/).filter(Boolean).length;

      renderLatestResult(result, taskType, wordCount);
      renderRecentSubmission(result, taskType, wordCount);

      showMessage("Essay evaluated successfully.", true, true);
    } catch (err) {
      console.error("Dashboard error:", err);
      showMessage("Something went wrong while evaluating the essay.", false);
    } finally {
      submitBtn.disabled = false;
    }
  });

  function showMessage(text, success = true, boxed = false) {
    messageEl.textContent = text;
    messageEl.classList.remove("success");

    if (success && boxed) {
      messageEl.classList.add("success");
    }
  }

  function renderLatestResult(result, taskType, wordCount) {
    latestResultEl.innerHTML = `
      <div class="result-block">
        <div class="score-grid">
          <div class="score-item">
            <strong>Overall Band</strong>
            <span>${safe(result.estimated_overall_band)}</span>
          </div>
          <div class="score-item">
            <strong>Task</strong>
            <span>${safe(result.criterion_scores.task_achievement_or_response.band)}</span>
          </div>
          <div class="score-item">
            <strong>Coherence</strong>
            <span>${safe(result.criterion_scores.coherence_and_cohesion.band)}</span>
          </div>
          <div class="score-item">
            <strong>Lexical</strong>
            <span>${safe(result.criterion_scores.lexical_resource.band)}</span>
          </div>
          <div class="score-item">
            <strong>Grammar</strong>
            <span>${safe(result.criterion_scores.grammatical_range_and_accuracy.band)}</span>
          </div>
          <div class="score-item">
            <strong>Word Count</strong>
            <span>${wordCount}</span>
          </div>
        </div>

        <div class="result-section">
          <h3>Summary</h3>
          <p>${safe(result.brief_summary)}</p>
        </div>

        <div class="result-section">
          <h3>Criterion feedback</h3>
          <ul>
            <li><strong>Task:</strong> ${safe(result.criterion_scores.task_achievement_or_response.feedback)}</li>
            <li><strong>Coherence:</strong> ${safe(result.criterion_scores.coherence_and_cohesion.feedback)}</li>
            <li><strong>Lexical:</strong> ${safe(result.criterion_scores.lexical_resource.feedback)}</li>
            <li><strong>Grammar:</strong> ${safe(result.criterion_scores.grammatical_range_and_accuracy.feedback)}</li>
          </ul>
        </div>

        <div class="result-section">
          <h3>Strengths</h3>
          <ul>
            ${renderListItems(result.strengths)}
          </ul>
        </div>

        <div class="result-section">
          <h3>Main issues</h3>
          <ul>
            ${renderListItems(result.main_issues)}
          </ul>
        </div>

        <div class="result-section">
          <h3>Two actionable next steps</h3>
          <ul>
            ${renderListItems(result.two_action_points)}
          </ul>
        </div>

        <div class="result-section">
          <h3>Submission details</h3>
          <p><strong>Task type:</strong> ${formatTaskType(taskType)}</p>
        </div>
      </div>
    `;
  }

  function renderRecentSubmission(result, taskType, wordCount) {
    const now = new Date();

    recentEvaluationsEl.innerHTML = `
      <div class="recent-item">
        <p><strong>Latest submission</strong></p>
        <p><strong>Task type:</strong> ${formatTaskType(taskType)}</p>
        <p><strong>Overall band:</strong> ${safe(result.estimated_overall_band)}</p>
        <p><strong>Word count:</strong> ${wordCount}</p>
        <p class="muted-text">Submitted at: ${now.toLocaleString()}</p>
      </div>
    `;
  }

  function renderListItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "<li>No details available.</li>";
    }

    return items.map(item => `<li>${safe(item)}</li>`).join("");
  }

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

  function safe(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
