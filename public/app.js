const API_BASE = "";
let currentLocation = { latitude: null, longitude: null };
let otpEmailStore = "";
let forgotEmailStore = "";

function showAlert(message, type) {
  const box = document.getElementById("alertBox");
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { box.innerHTML = ""; }, 5000);
}

function hideAllForms() {
  const ids = ["loginForm", "signupForm", "forgotForm", "resetForm", "otpRequestForm", "otpVerifyForm"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
}

function switchTab(tab) {
  hideAllForms();
  const tabs = document.querySelectorAll(".tab-btn");
  if (tab === "login") {
    const el = document.getElementById("loginForm");
    if (el) el.classList.remove("hidden");
    if (tabs[0]) tabs[0].classList.add("active");
  } else if (tab === "signup") {
    const el = document.getElementById("signupForm");
    if (el) el.classList.remove("hidden");
    if (tabs[1]) tabs[1].classList.add("active");
  }
}

function showForgot() {
  hideAllForms();
  const el = document.getElementById("forgotForm");
  if (el) el.classList.remove("hidden");
}

function showOtpRequest() {
  hideAllForms();
  const el = document.getElementById("otpRequestForm");
  if (el) el.classList.remove("hidden");
}

async function requestOtp() {
  const email = document.getElementById("otpEmail").value;
  if (!email) return showAlert("Please enter your email", "error");

  try {
    const res = await fetch(API_BASE + "/api/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      otpEmailStore = email;
      showAlert("OTP sent! Code: " + data.otp + " (simulated)", "success");
      hideAllForms();
      const el = document.getElementById("otpVerifyForm");
      if (el) el.classList.remove("hidden");
    } else {
      showAlert(data.error, "error");
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

async function verifyOtp() {
  const otp = document.getElementById("otpCode").value;
  if (!otp) return showAlert("Please enter the OTP", "error");

  try {
    const res = await fetch(API_BASE + "/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmailStore, otp }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("vritara_token", data.token);
      localStorage.setItem("vritara_user", JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    } else {
      showAlert(data.error, "error");
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

async function handleForgot() {
  const email = document.getElementById("forgotEmail").value;
  if (!email) return showAlert("Please enter your email", "error");

  try {
    const res = await fetch(API_BASE + "/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      forgotEmailStore = email;
      showAlert("Reset token: " + data.resetToken + " (simulated)", "success");
      hideAllForms();
      const el = document.getElementById("resetForm");
      if (el) el.classList.remove("hidden");
    } else {
      showAlert(data.error, "error");
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

async function handleReset() {
  const resetToken = document.getElementById("resetToken").value;
  const newPassword = document.getElementById("newPassword").value;
  if (!resetToken || !newPassword) return showAlert("Please fill in all fields", "error");

  try {
    const res = await fetch(API_BASE + "/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmailStore, resetToken, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      showAlert(data.message, "success");
      switchTab("login");
    } else {
      showAlert(data.error, "error");
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch(API_BASE + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("vritara_token", data.token);
        localStorage.setItem("vritara_user", JSON.stringify(data.user));
        window.location.href = "/dashboard.html";
      } else {
        showAlert(data.error, "error");
      }
    } catch (err) {
      showAlert("Network error", "error");
    }
  });
}

const signupFormEl = document.getElementById("signupForm");
if (signupFormEl) {
  signupFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const phone = document.getElementById("signupPhone").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const res = await fetch(API_BASE + "/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("vritara_token", data.token);
        localStorage.setItem("vritara_user", JSON.stringify(data.user));
        window.location.href = "/dashboard.html";
      } else {
        showAlert(data.error, "error");
      }
    } catch (err) {
      showAlert("Network error", "error");
    }
  });
}

function getToken() {
  return localStorage.getItem("vritara_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
  };
}

function logout() {
  localStorage.removeItem("vritara_token");
  localStorage.removeItem("vritara_user");
  window.location.href = "/";
}

async function initDashboard() {
  const user = JSON.parse(localStorage.getItem("vritara_user") || "{}");
  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl && user.username) {
    welcomeEl.textContent = "Welcome, " + user.username + "!";
  }

  loadContacts();
  loadIncidents();
  startLocationTracking();
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    document.getElementById("locationInfo").textContent = "Geolocation not supported";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      currentLocation.latitude = pos.coords.latitude;
      currentLocation.longitude = pos.coords.longitude;
      document.getElementById("locationInfo").textContent =
        "Lat: " + pos.coords.latitude.toFixed(6) + " | Lon: " + pos.coords.longitude.toFixed(6);

      fetch(API_BASE + "/api/location", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(currentLocation),
      }).catch(() => {});
    },
    (err) => {
      document.getElementById("locationInfo").textContent = "Location access denied";
    },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

async function triggerSOS() {
  const statusBar = document.getElementById("statusBar");
  const overlay = document.getElementById("emergencyOverlay");

  statusBar.className = "status-bar status-emergency";
  statusBar.textContent = "Status: EMERGENCY";

  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("hidden"), 2000);

  try {
    const res = await fetch(API_BASE + "/api/sos/manual", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        message: "Emergency SOS triggered from app",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showAlert("SOS sent! Help is on the way.", "success");
      loadIncidents();
    } else {
      showAlert(data.error || "Failed to send SOS", "error");
    }
  } catch (err) {
    showAlert("Network error sending SOS", "error");
  }

  setTimeout(() => {
    statusBar.className = "status-bar status-normal";
    statusBar.textContent = "Status: Normal";
  }, 30000);
}

async function loadContacts() {
  const list = document.getElementById("contactsList");
  if (!list) return;

  try {
    const res = await fetch(API_BASE + "/api/contacts", {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.contacts && data.contacts.length > 0) {
      list.innerHTML = data.contacts
        .map(
          (c) => `
        <div class="contact-item">
          <div class="contact-info">
            <h4>${escapeHtml(c.name)}</h4>
            <p>${escapeHtml(c.phone)} - ${escapeHtml(c.relationship)}</p>
          </div>
          <button class="delete-btn" onclick="deleteContact('${c.id}')">Remove</button>
        </div>`
        )
        .join("");

      if (data.contacts.length >= 3) {
        document.getElementById("addContactSection").classList.add("hidden");
      } else {
        document.getElementById("addContactSection").classList.remove("hidden");
      }
    } else {
      list.innerHTML = '<p class="no-data">No emergency contacts added yet</p>';
    }
  } catch (err) {
    list.innerHTML = '<p class="no-data">Failed to load contacts</p>';
  }
}

async function addContact() {
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const relationship = document.getElementById("contactRelation").value;

  if (!name || !phone) return showAlert("Name and phone are required", "error");

  try {
    const res = await fetch(API_BASE + "/api/contacts", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, phone, relationship }),
    });
    const data = await res.json();
    if (res.ok) {
      showAlert("Contact added!", "success");
      document.getElementById("contactName").value = "";
      document.getElementById("contactPhone").value = "";
      document.getElementById("contactRelation").value = "";
      loadContacts();
    } else {
      showAlert(data.error, "error");
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

async function deleteContact(id) {
  try {
    const res = await fetch(API_BASE + "/api/contacts/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      showAlert("Contact removed", "success");
      loadContacts();
    }
  } catch (err) {
    showAlert("Network error", "error");
  }
}

async function loadIncidents() {
  const list = document.getElementById("incidentList");
  if (!list) return;

  try {
    const res = await fetch(API_BASE + "/api/sos/incidents", {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.incidents && data.incidents.length > 0) {
      list.innerHTML = data.incidents
        .map(
          (i) => `
        <div class="incident-item">
          <span class="incident-type">${escapeHtml(i.type)} SOS</span>
          <p class="incident-time">${new Date(i.created_at).toLocaleString()}</p>
          <p class="incident-msg">${i.latitude ? "Location: " + Number(i.latitude).toFixed(4) + ", " + Number(i.longitude).toFixed(4) : "No location"}</p>
        </div>`
        )
        .join("");
    } else {
      list.innerHTML = '<p class="no-data">No incidents recorded</p>';
    }
  } catch (err) {
    list.innerHTML = '<p class="no-data">Failed to load incidents</p>';
  }
}

async function uploadFile(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById("uploadStatus");
  statusEl.textContent = "Uploading " + file.name + "...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API_BASE + "/api/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      statusEl.textContent = "Uploaded: " + data.file.original_name;
      showAlert("File uploaded successfully!", "success");
    } else {
      statusEl.textContent = "Upload failed";
      showAlert(data.error || "Upload failed", "error");
    }
  } catch (err) {
    statusEl.textContent = "Upload error";
    showAlert("Network error uploading file", "error");
  }

  input.value = "";
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
  if (localStorage.getItem("vritara_token")) {
    window.location.href = "/dashboard.html";
  }
}
