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

  const verificationPanel = document.getElementById("verification-panel");
  const verifyScoreBtn = document.getElementById("verify-score-btn");
  const verifyMessageEl = document.getElementById("verify-message");

  let currentEssayId = null;
  let currentTaskType = null;
  let currentWordCount = null;
  let currentEvaluation = null;

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
    verificationPanel.style.display = "none";
    verifyMessageEl.textContent = "";
    currentEssayId = null;
    currentEvaluation = null;

    showMessage("Evaluating essay...", true, false);

    try {
      const {
        data: { session }
      } = await supabaseClient.auth.getSession();

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

      if (!data || !data.evaluation || !data.essay_id) {
        console.error("Unexpected response:", data);
        showMessage("The server returned an invalid response.", false);
        submitBtn.disabled = false;
        return;
      }

      const result = data.evaluation;
      const wordCount = essayText.split(/\s+/).filter(Boolean).length;

      currentEssayId = data.essay_id;
      currentTaskType = taskType;
      currentWordCount = wordCount;
      currentEvaluation = result;

      renderLatestResult(result, taskType, wordCount, false);
      renderRecentSubmission(result, taskType, wordCount, false);

      verificationPanel.style.display = "block";
      verifyMessageEl.textContent = "";

      showMessage("Essay evaluated successfully.", true, true);
    } catch (err) {
      console.error("Dashboard error:", err);
      showMessage("Something went wrong while evaluating the essay.", false);
    } finally {
      submitBtn.disabled = false;
    }
  });

  verifyScoreBtn?.addEventListener("click", async () => {
    if (!currentEssayId || !currentEvaluation) {
      verifyMessageEl.textContent = "No essay is available to verify.";
      return;
    }

    verifyScoreBtn.disabled = true;
    verifyMessageEl.textContent = "Verifying score...";

    try {
      const {
        data: { session }
      } = await supabaseClient.auth.getSession();

      if (!session?.access_token) {
        verifyMessageEl.textContent = "You are not logged in properly. Please log out and log back in.";
        verifyScoreBtn.disabled = false;
        return;
      }

      const response = await fetch(
        "https://njuymuqeevkuqfubimio.supabase.co/functions/v1/verify-score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdXltdXFlZXZrdXFmdWJpbWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjM2NDMsImV4cCI6MjA5MTU5OTY0M30.W--9HT9lIYAwXcM5_AyCKQzML04H5UhxFF7YtK4hkns"
          },
          body: JSON.stringify({
            essay_id: currentEssayId
          })
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Could not parse verifier response as JSON:", jsonError);
        verifyMessageEl.textContent = "The verifier returned an unreadable response.";
        verifyScoreBtn.disabled = false;
        return;
      }

      if (!response.ok) {
        console.error("Verifier response error:", data);
        verifyMessageEl.textContent =
          data?.details || data?.error || "Could not verify the score.";
        verifyScoreBtn.disabled = false;
        return;
      }

      if (!data || !data.evaluation || !data.verification) {
        console.error("Unexpected verifier response:", data);
        verifyMessageEl.textContent = "The verifier returned an invalid response.";
        verifyScoreBtn.disabled = false;
        return;
      }

      currentEvaluation = data.evaluation;

      renderLatestResult(data.evaluation, currentTaskType, currentWordCount, true, data.verification);
      renderRecentSubmission(data.evaluation, currentTaskType, currentWordCount, true);

      verifyMessageEl.textContent = data.verification.agrees_with_original_score
        ? "Verification confirmed the original score."
        : "Verification adjusted the score.";

      verifyScoreBtn.style.display = "none";
    } catch (err) {
      console.error("Verification error:", err);
      verifyMessageEl.textContent = "Something went wrong while verifying the score.";
    } finally {
      verifyScoreBtn.disabled = false;
    }
  });

  function showMessage(text, success = true, boxed = false) {
    messageEl.textContent = text;
    messageEl.classList.remove("success");

    if (success && boxed) {
      messageEl.classList.add("success");
    }
  }

  function renderLatestResult(result, taskType, wordCount, isVerified = false, verification = null) {
    latestResultEl.innerHTML = `
      <div class="result-block">
        <div class="score-grid">
          <div class="score-item">
            <strong>${isVerified ? "Verified Band" : "Overall Band"}</strong>
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
          <p><strong>Status:</strong> ${isVerified ? "Verified" : "Scored"}</p>
          ${verification ? `<p><strong>Verification confidence:</strong> ${safe(verification.verifier_confidence)}</p>` : ""}
          ${verification ? `<p><strong>Adjustment reason:</strong> ${safe(verification.adjustment_reason)}</p>` : ""}
        </div>
      </div>
    `;
  }

  function renderRecentSubmission(result, taskType, wordCount, isVerified = false) {
    const now = new Date();

    recentEvaluationsEl.innerHTML = `
      <div class="recent-item">
        <p><strong>Latest submission</strong></p>
        <p><strong>Task type:</strong> ${formatTaskType(taskType)}</p>
        <p><strong>${isVerified ? "Verified band" : "Overall band"}:</strong> ${safe(result.estimated_overall_band)}</p>
        <p><strong>Word count:</strong> ${wordCount}</p>
        <p><strong>Status:</strong> ${isVerified ? "Verified" : "Scored"}</p>
        <p class="muted-text">Updated at: ${now.toLocaleString()}</p>
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
