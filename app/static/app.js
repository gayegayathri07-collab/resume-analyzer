const API = "http://127.0.0.1:8000/api";

let analyzeFile = null;
let matchFile = null;
let batchFiles = [];

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initDropzone("dropzone-analyze", "file-input-analyze", (f) => { analyzeFile = f; analyze(); });
  initDropzone("dropzone-match", "file-input-match", (f) => { matchFile = f; });
  initDropzone("dropzone-batch", "file-input-batch", (files) => { batchFiles = Array.from(files); });

  document.getElementById("btn-match").addEventListener("click", match);
  document.getElementById("btn-batch").addEventListener("click", analyzeBatch);
  document.getElementById("btn-compare").addEventListener("click", compare);
  document.getElementById("export-pdf").addEventListener("click", exportPDF);
  document.querySelector('[data-tab="history"]').addEventListener("click", loadHistory);
  document.querySelector('[data-tab="compare"]').addEventListener("click", () => {
    const input = document.getElementById("compare-ids");
    if (!input.value) loadCompareHistory();
  });
});

function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
  });
}

function initDropzone(dzId, inputId, onFile) {
  const dz = document.getElementById(dzId);
  const input = document.getElementById(inputId);
  dz.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (input.multiple) {
      if (input.files.length) onFile(input.files);
    } else {
      if (input.files[0]) onFile(input.files[0]);
    }
  });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      if (input.multiple) onFile(e.dataTransfer.files);
      else onFile(e.dataTransfer.files[0]);
    }
  });
}

function showSpinner(t) { const s = document.getElementById("spinner"); s.querySelector("p").textContent = t || "Working..."; s.hidden = false; }
function hideSpinner() { document.getElementById("spinner").hidden = true; }

function setScore(id, score) {
  const ring = document.getElementById(id);
  const offset = 339.292 - (score / 100) * 339.292;
  ring.style.strokeDashoffset = offset;
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--yellow)" : "var(--red)";
  ring.style.stroke = color;
  document.getElementById(id.replace("ring", "score-text")).textContent = Math.round(score);
}

function buildBreakdown(parent, data) {
  parent.innerHTML = "";
  for (const [key, val] of Object.entries(data)) {
    const div = document.createElement("div");
    div.className = "breakdown-item";
    const v = document.createElement("div");
    v.className = "value";
    v.textContent = Math.round(val);
    v.style.color = val >= 70 ? "var(--green)" : val >= 40 ? "var(--yellow)" : "var(--red)";
    const l = document.createElement("div");
    l.className = "label";
    l.textContent = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    div.appendChild(v); div.appendChild(l);
    parent.appendChild(div);
  }
}

function buildSuggestions(parent, list, isGood) {
  parent.innerHTML = "<h4>Suggestions</h4><ul>" +
    list.map((s) => `<li class="${isGood ? "good" : ""}">${s}</li>`).join("") + "</ul>";
}

async function analyze() {
  if (!analyzeFile) return;
  showSpinner("Parsing resume...");
  try {
    const form = new FormData();
    form.append("resume", analyzeFile);
    const res = await fetch(API + "/analyze/", { method: "POST", body: form });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Analysis failed"); }
    const json = await res.json();
    window.__lastResult = json.data;
    window.__lastAnalysisId = json.analysis_id;
    renderResult(json.data);
    document.getElementById("results-analyze").hidden = false;
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}

function renderResult(d) {
  document.getElementById("result-filename").textContent = d.filename + (window.__lastAnalysisId ? ` (id:${window.__lastAnalysisId})` : "");
  setScore("score-ring", d.ats_score.score);
  buildBreakdown(document.getElementById("breakdown"), d.ats_score.breakdown);
  buildSuggestions(document.getElementById("suggestions"), d.ats_score.suggestions);
  document.getElementById("skills-list").innerHTML = (d.skills || []).map((s) =>
    `<span class="tag">${s.name}${s.proficiency ? `<span class="prof"> · ${s.proficiency}</span>` : ""}</span>`
  ).join("");
  document.getElementById("experience-list").innerHTML = (d.experience || []).map((e) =>
    `<div class="exp-item"><h4>${e.role} @ ${e.company}</h4><div class="meta">${e.duration}</div><ul>${e.description.map((d) => `<li>${d}</li>`).join("")}</ul></div>`
  ).join("");
  document.getElementById("education-list").innerHTML = (d.education || []).map((e) =>
    `<div class="edu-item"><h4>${e.degree} in ${e.field}</h4><p>${e.institution}${e.year ? ` · ${e.year}` : ""}</p></div>`
  ).join("");
}

async function match() {
  if (!matchFile) return alert("Please upload a resume first.");
  const jd = document.getElementById("jd-input").value.trim();
  if (!jd) return alert("Please paste a job description.");
  showSpinner("Matching...");
  try {
    const form = new FormData();
    form.append("file", matchFile);
    form.append("job_description", jd);
    const res = await fetch(API + "/match", { method: "POST", body: form });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Match failed"); }
    const json = await res.json();
    const d = json.data;
    setScore("match-ring", d.score);
    buildBreakdown(document.getElementById("match-breakdown"), d.breakdown);
    buildSuggestions(document.getElementById("match-suggestions"), d.suggestions, d.score >= 70);
    document.getElementById("results-match").hidden = false;
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}

async function analyzeBatch() {
  if (!batchFiles.length) return alert("Select at least one resume.");
  showSpinner(`Processing ${batchFiles.length} resumes...`);
  try {
    const form = new FormData();
    for (const f of batchFiles) form.append("files", f);
    const jd = document.getElementById("jd-batch").value.trim();
    if (jd) form.append("job_description", jd);
    const res = await fetch(API + "/analyze-batch", { method: "POST", body: form });
    if (!res.ok) throw new Error("Batch failed");
    const json = await res.json();
    const list = document.getElementById("batch-results-list");
    list.innerHTML = "<table style='width:100%;border-collapse:collapse'><tr style='color:var(--text2);font-size:13px'><th style='text-align:left;padding:8px'>File</th><th style='text-align:right;padding:8px'>Score</th><th style='padding:8px'>ID</th></tr>" +
      json.results.map((r) =>
        `<tr style='border-top:1px solid var(--border)'><td style='padding:8px'>${r.filename}</td><td style='padding:8px;text-align:right;font-weight:700;color:${r.score >= 70 ? "var(--green)" : r.score >= 40 ? "var(--yellow)" : "var(--red)"}'>${Math.round(r.score)}</td><td style='padding:8px;text-align:center;color:var(--text2);font-size:13px'>${r.id}</td></tr>`
      ).join("") + "</table>";
    const errors = document.getElementById("batch-errors");
    errors.innerHTML = json.errors.length ? `<p style="color:var(--red);font-size:13px">${json.errors.length} error(s)</p>` : "";
    document.getElementById("results-batch").hidden = false;
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}

async function loadHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = '<p class="dropzone-hint">Loading...</p>';
  try {
    const res = await fetch(API + "/history?limit=50");
    const json = await res.json();
    if (!json.analyses.length) { list.innerHTML = '<p class="dropzone-hint">No analyses yet.</p>'; return; }
    list.innerHTML = "<table style='width:100%;border-collapse:collapse'><tr style='color:var(--text2);font-size:13px'><th style='text-align:left;padding:8px'>ID</th><th style='text-align:left;padding:8px'>File</th><th style='text-align:right;padding:8px'>Score</th><th style='text-align:right;padding:8px'>Date</th></tr>" +
      json.analyses.map((a) =>
        `<tr style='border-top:1px solid var(--border);cursor:pointer' onclick='viewAnalysis(${a.id})'><td style='padding:8px;color:var(--accent);font-size:13px'>${a.id}</td><td style='padding:8px'>${a.filename}</td><td style='padding:8px;text-align:right;font-weight:700;color:${a.ats_score.score >= 70 ? "var(--green)" : a.ats_score.score >= 40 ? "var(--yellow)" : "var(--red)"}'>${Math.round(a.ats_score.score)}</td><td style='padding:8px;text-align:right;color:var(--text2);font-size:13px'>${new Date(a.created_at).toLocaleDateString()}</td></tr>`
      ).join("") + "</table>";
  } catch (err) {
    list.innerHTML = `<p style="color:var(--red)">Failed to load: ${err.message}</p>`;
  }
}

async function viewAnalysis(id) {
  showSpinner("Loading analysis...");
  try {
    const res = await fetch(`${API}/analyses/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error("Not found");
    const d = json.data;
    window.__lastResult = {
      filename: d.filename, skills: d.skills, experience: d.experience,
      education: d.education, ats_score: d.ats_score, suggestions: d.suggestions,
    };
    window.__lastAnalysisId = d.id;
    renderResult(window.__lastResult);
    document.querySelector('[data-tab="analyze"]').click();
    document.getElementById("results-analyze").hidden = false;
    document.getElementById("results-analyze").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}

async function compare() {
  const input = document.getElementById("compare-ids").value.trim();
  if (!input) return alert("Enter analysis IDs.");
  const ids = input.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
  if (ids.length < 2) return alert("Enter at least 2 IDs.");
  showSpinner("Comparing...");
  try {
    const res = await fetch(API + "/compare?ids=" + ids.join("&ids="));
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Compare failed"); }
    const json = await res.json();
    renderComparison(json.analyses);
    document.getElementById("results-compare").hidden = false;
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}

function loadCompareHistory() {
  fetch(API + "/history?limit=20").then((r) => r.json()).then((json) => {
    const input = document.getElementById("compare-ids");
    if (json.analyses.length >= 2) {
      input.placeholder = `e.g. ${json.analyses.slice(0, 3).map((a) => a.id).join(", ")} (recent IDs)`;
    }
  }).catch(() => {});
}

function renderComparison(analyses) {
  const wrap = document.getElementById("compare-table-wrapper");
  const allSkills = [...new Set(analyses.flatMap((a) => (a.skills || []).map((s) => s.name)))];
  const allScores = analyses.map((a) => ({ name: a.filename, score: a.ats_score?.score || 0, id: a.id }));

  let html = "<table style='width:100%;border-collapse:collapse'>";
  html += "<tr style='color:var(--text2);font-size:13px'><th style='text-align:left;padding:10px'>Metric</th>";
  for (const a of analyses) {
    html += `<th style='text-align:center;padding:10px'>${a.filename.split(".")[0].slice(0, 20)}</th>`;
  }
  html += "</tr>";

  html += "<tr style='border-top:1px solid var(--border)'><td style='padding:10px;font-weight:600'>ATS Score</td>";
  for (const a of analyses) {
    const s = a.ats_score?.score || 0;
    const c = s >= 70 ? "var(--green)" : s >= 40 ? "var(--yellow)" : "var(--red)";
    html += `<td style='text-align:center;padding:10px;font-weight:700;color:${c}'>${Math.round(s)}</td>`;
  }
  html += "</tr>";

  if (analyses[0].match_score != null) {
    html += "<tr style='border-top:1px solid var(--border)'><td style='padding:10px;font-weight:600'>Match Score</td>";
    for (const a of analyses) {
      const s = a.match_score || 0;
      const c = s >= 70 ? "var(--green)" : s >= 40 ? "var(--yellow)" : "var(--red)";
      html += `<td style='text-align:center;padding:10px;font-weight:700;color:${c}'>${Math.round(s)}</td>`;
    }
    html += "</tr>";
  }

  html += "<tr style='border-top:1px solid var(--border)'><td style='padding:10px;font-weight:600'>Skills</td>";
  for (const a of analyses) {
    const skillNames = (a.skills || []).map((s) => s.name);
    html += `<td style='text-align:center;padding:10px;font-size:13px;color:var(--text2)'>${skillNames.length} found</td>`;
  }
  html += "</tr>";

  html += "<tr style='border-top:2px solid var(--border)'><td style='padding:10px;font-weight:600'>Skill Overlap</td>";
  for (const a of analyses) {
    const skills = new Set((a.skills || []).map((s) => s.name.toLowerCase()));
    const overlap = allSkills.filter((s) => skills.has(s.toLowerCase())).length;
    const pct = allSkills.length ? Math.round((overlap / allSkills.length) * 100) : 0;
    html += `<td style='text-align:center;padding:10px;color:${pct > 50 ? "var(--green)" : "var(--yellow)"}'>${pct}%</td>`;
  }
  html += "</tr>";

  html += "<tr style='border-top:1px solid var(--border)'><td style='padding:10px;font-weight:600'>Experience</td>";
  for (const a of analyses) {
    html += `<td style='text-align:center;padding:10px;font-size:13px;color:var(--text2)'>${(a.experience || []).length} entries</td>`;
  }
  html += "</tr>";

  html += "</table>";

  html += "<h4 style='margin-top:20px;margin-bottom:10px'>All Skills</h4><table style='width:100%;border-collapse:collapse'><tr style='color:var(--text2);font-size:13px'><th style='text-align:left;padding:8px'>Skill</th>";
  for (const a of analyses) {
    html += `<th style='text-align:center;padding:8px'>${a.filename.split(".")[0].slice(0, 15)}</th>`;
  }
  html += "</tr>";
  for (const skill of allSkills) {
    html += "<tr style='border-top:1px solid var(--border)'>";
    html += `<td style='padding:8px'>${skill}</td>`;
    for (const a of analyses) {
      const has = (a.skills || []).some((s) => s.name === skill);
      html += `<td style='text-align:center;padding:8px;color:${has ? "var(--green)" : "var(--red)"}'>${has ? "✓" : "✗"}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  wrap.innerHTML = html;
}

async function exportPDF() {
  if (!window.__lastResult) return alert("No results to export.");
  showSpinner("Generating PDF...");
  try {
    const res = await fetch(API + "/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: window.__lastResult }),
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "resume-analysis.pdf"; a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  } finally {
    hideSpinner();
  }
}
