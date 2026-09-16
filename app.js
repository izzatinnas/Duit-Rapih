```javascript
/* =========================================================
   DUIT RAPIH
   Google Apps Script + Google Sheets
   ========================================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbzed9eGYsAwTXO3b81BTxMnlaU1qCuPbdjiPFmvKecE9tK-WhUlNaRk4rMhoOAVyuy6/exec";

const $ = id => document.getElementById(id);

let tx = [];
let currentUser = JSON.parse(
  sessionStorage.getItem("duit_rapih_user") || "null"
);

let month = new Date().toISOString().slice(0, 7);


/* =========================================================
   FORMAT RUPIAH
   ========================================================= */

const rupiah = n =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(n) || 0);


/* =========================================================
   TANGGAL DEFAULT
   ========================================================= */

if ($("month")) {
  $("month").value = month;
}

if ($("date")) {
  $("date").value = new Date().toISOString().slice(0, 10);
}


/* =========================================================
   CEK API
   ========================================================= */

async function cekAPI() {
  try {
    const response = await fetch(API_URL, {
      method: "GET"
    });

    const data = await response.json();

    if (data.success) {
      console.log("DUIT RAPIH API aktif.");
      return true;
    }

    return false;

  } catch (error) {
    console.error("API tidak dapat dihubungi:", error);
    return false;
  }
}


/* =========================================================
   REQUEST KE GOOGLE APPS SCRIPT
   ========================================================= */

async function api(action, data = {}) {

  if (!API_URL || API_URL.includes("PASTE_APPS_SCRIPT")) {
    throw new Error(
      "API belum dihubungkan. URL Apps Script belum dimasukkan."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action,
      ...data
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Terjadi kesalahan.");
  }

  return result;
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

  const emailElement = $("loginEmail") || $("email");
  const passwordElement = $("loginPassword") || $("password");

  if (!emailElement || !passwordElement) {
    alert("Form login belum tersedia di index.html.");
    return;
  }

  const email = emailElement.value.trim().toLowerCase();
  const password = passwordElement.value;

  if (!email || !password) {
    alert("Email dan password wajib diisi.");
    return;
  }

  try {

    const result = await api("login", {
      email,
      password
    });

    currentUser = result.user;

    sessionStorage.setItem(
      "duit_rapih_user",
      JSON.stringify(currentUser)
    );

    alert("Login berhasil. Selamat datang " + currentUser.nama + "!");

    await loadTransactions();

    updateUserInterface();
```
