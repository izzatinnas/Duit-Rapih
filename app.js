/* =========================================================
   DUIT RAPIH
   Google Sheets Edition
   ========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbzed9eGYsAwTXO3b81BTxMnlaU1qCuPbdjiPFmvKecE9tK-WhUlNaRk4rMhoOAVyuy6/exec";


/* =========================================================
   HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);

const rupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(angka) || 0);
};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  JSON.parse(
    localStorage.getItem("duit_rapih_user") || "null"
  );

let transactions = [];


/* =========================================================
   API
   ========================================================= */

async function api(action, data = {}) {

  try {

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


    const text =
      await response.text();


    let result;

    try {

      result = JSON.parse(text);

    } catch (e) {

      throw new Error(
        "Server mengirim jawaban yang tidak valid."
      );

    }


    if (!result.success) {

      throw new Error(
        result.message ||
        "Terjadi kesalahan pada server."
      );

    }


    return result;


  } catch (error) {

    console.error("API ERROR:", error);

    throw new Error(
      error.message ||
      "Gagal terhubung ke Google Sheets."
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

  const email =
    ($("loginEmail")?.value || "")
      .trim()
      .toLowerCase();

  const password =
    $("loginPassword")?.value || "";


  if (!email) {

    alert("Email wajib diisi.");

    return;

  }


  if (!password) {

    alert("Password wajib diisi.");

    return;

  }


  try {

    showLoading(true);


    const result =
      await api("login", {

        email,
        password

      });


    currentUser =
      result.user;


    localStorage.setItem(
      "duit_rapih_user",
      JSON.stringify(currentUser)
    );


    alert(
      "Login berhasil. Selamat datang " +
      currentUser.nama + "!"
    );


    showApp();


    await loadTransactions();


  } catch (error) {

    alert(
      "Login gagal:\n" +
      error.message
    );

  } finally {

    showLoading(false);

  }

}


/* =========================================================
   PENDAFTARAN
   ========================================================= */

async function register() {

  const nama =
    ($("registerNama")?.value || "")
      .trim();

  const email =
    ($("registerEmail")?.value || "")
      .trim()
      .toLowerCase();

  const password =
    $("registerPassword")?.value || "";


  if (!nama) {

    alert("Nama wajib diisi.");

    return;

  }


  if (!email) {

    alert("Email wajib diisi.");

    return;

  }


  if (password.length < 8) {

    alert(
      "Password minimal 8 karakter."
    );

    return;

  }


  try {

    showLoading(true);


    const result =
      await api("register", {

        nama,
        email,
        password

      });


    alert(
      result.message +
      "\n\nSilakan login menggunakan akun Anda."
    );


    if ($("registerNama"))
      $("registerNama").value = "";

    if ($("registerEmail"))
      $("registerEmail").value = "";

    if ($("registerPassword"))
      $("registerPassword").value = "";


    showLogin();


  } catch (error) {

    alert(
      "Pendaftaran gagal:\n" +
      error.message
    );

  } finally {

    showLoading(false);

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  currentUser = null;

  transactions = [];


  localStorage.removeItem(
    "duit_rapih_user"
  );


  location.reload();

}


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

  if (!currentUser) {

    return;

  }


  try {

    showLoading(true);


    const result =
      await api(
        "listTransactions",
        {
          user_id: currentUser.id
        }
      );


    transactions =
      result.transactions || [];


    renderTransactions();

    updateSummary();


  } catch (error) {

    alert(
      "Gagal mengambil data transaksi:\n" +
      error.message
    );

  } finally {

    showLoading(false);

  }

}


/* =========================================================
   TAMBAH TRANSAKSI
   ========================================================= */

async function addTransaction() {

  if (!currentUser) {

    alert(
      "Silakan login terlebih dahulu."
    );

    return;

  }


  const jenis =
    $("type")?.value || "pengeluaran";

  const tanggal =
    $("date")?.value || "";

  const kategori =
    $("category")?.value || "Lainnya";

  const keterangan =
    ($("desc")?.value || "").trim();

  const nominal =
    Number(
      $("amount")?.value || 0
    );


  if (!tanggal) {

    alert("Tanggal wajib diisi.");

    return;

  }


  if (
    !nominal ||
    nominal <= 0
  ) {

    alert(
      "Masukkan nominal yang benar."
    );

    return;

  }


  try {

    showLoading(true);


    const result =
      await api(
        "addTransaction",
        {

          user_id:
            currentUser.id,

          jenis:
            jenis,

          tanggal:
            tanggal,

          kategori:
            kategori,

          nominal:
            nominal,

          keterangan:
            keterangan

        }
      );


    alert(
      result.message ||
      "Transaksi berhasil disimpan."
    );


    if ($("amount"))
      $("amount").value = "";

    if ($("desc"))
      $("desc").value = "";


    await loadTransactions();


  } catch (error) {

    alert(
      "Gagal menyimpan transaksi:\n" +
      error.message
    );

  } finally {

    showLoading(false);

  }

}


/* =========================================================
   HITUNG SALDO
   ========================================================= */

function updateSummary() {

  let pemasukan = 0;

  let pengeluaran = 0;


  transactions.forEach(
    (item) => {

      const nominal =
        Number(item.nominal) || 0;


      if (
        item.jenis === "pemasukan"
      ) {

        pemasukan += nominal;

      }


      if (
        item.jenis === "pengeluaran"
      ) {

        pengeluaran += nominal;

      }

    }
  );


  const saldo =
    pemasukan -
    pengeluaran;


  if ($("income"))
    $("income").textContent =
      rupiah(pemasukan);


  if ($("expense"))
    $("expense").textContent =
      rupiah(pengeluaran);


  if ($("saldo"))
    $("saldo").textContent =
      rupiah(saldo);


  const count =
    $("transactionCount");


  if (count) {

    count.textContent =
      transactions.length;

  }

}


/* =========================================================
   TAMPILKAN TRANSAKSI
   ========================================================= */

function renderTransactions() {

  const list =
    $("list");


  if (!list)
    return;


  if (!transactions.length) {

    list.innerHTML =
      "<p>Belum ada transaksi.</p>";

    return;

  }


  const sorted =
    [...transactions].sort(
      (a, b) =>
        String(b.tanggal)
          .localeCompare(
            String(a.tanggal)
          )
    );


  list.innerHTML =
    sorted.map(
      (item) => {

        const isIncome =
          item.jenis === "pemasukan";


        const sign =
          isIncome ? "+" : "-";


        const className =
          isIncome ? "in" : "out";


        return `
          <div class="item">

            <div>

              <b>
                ${escapeHtml(
                  item.keterangan ||
                  "Tanpa keterangan"
                )}
              </b>

              <br>

              <small>
                ${escapeHtml(
                  item.tanggal
                )}
                •
                ${escapeHtml(
                  item.kategori ||
                  "Lainnya"
                )}
              </small>

            </div>

            <div>

              <b class="${className}">
                ${sign}
                ${rupiah(item.nominal)}
              </b>

              <br>

              <button
                class="delete"
                onclick="deleteTransaction('${item.id}')"
              >
                Hapus
              </button>

            </div>

          </div>
        `;

      }
    ).join("");

}


/* =========================================================
   HAPUS TRANSAKSI
   ========================================================= */

async function deleteTransaction(id) {

  if (!currentUser)
    return;


  const yakin =
    confirm(
      "Apakah transaksi ini ingin dihapus?"
    );


  if (!yakin)
    return;


  try {

    showLoading(true);


    await api(
      "deleteTransaction",
      {

        id:
          id,

        user_id:
          currentUser.id

      }
    );


    await loadTransactions();


  } catch (error) {

    alert(
      "Gagal menghapus transaksi:\n" +
      error.message
    );

  } finally {

    showLoading(false);

  }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(text) {

  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   LOGIN / REGISTER TAMPILAN
   ========================================================= */

function showLogin() {

  const login =
    $("loginPanel");

  const register =
    $("registerPanel");


  if (login)
    login.style.display = "block";

  if (register)
    register.style.display = "none";

}


function showRegister() {

  const login =
    $("loginPanel");

  const register =
    $("registerPanel");


  if (login)
    login.style.display = "none";

  if (register)
    register.style.display = "block";

}


/* =========================================================
   TAMPILKAN APLIKASI
   ========================================================= */

function showApp() {

  const auth =
    $("auth");

  const app =
    $("app");


  if (auth)
    auth.style.display = "none";

  if (app)
    app.style.display = "block";


  const userName =
    $("userName");


  if (
    userName &&
    currentUser
  ) {

    userName.textContent =
      currentUser.nama;

  }

}


/* =========================================================
   TAMPILKAN AUTH
   ========================================================= */

function showAuth() {

  const auth =
    $("auth");

  const app =
    $("app");


  if (auth)
    auth.style.display = "block";

  if (app)
    app.style.display = "none";

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(status) {

  const loading =
    $("loading");


  if (!loading)
    return;


  loading.style.display =
    status ? "block" : "none";

}


/* =========================================================
   DARK MODE
   ========================================================= */

function initTheme() {

  const dark =
    localStorage.getItem(
      "duit_rapih_dark"
    ) === "true";


  if (dark) {

    document.body.classList.add(
      "dark"
    );

  }

}


function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );


  localStorage.setItem(
    "duit_rapih_dark",

    document.body.classList.contains(
      "dark"
    )
  );

}


/* =========================================================
   EVENT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initTheme();


    /*
     * Tanggal hari ini
     */

    if ($("date")) {

      $("date").value =
        new Date()
          .toISOString()
          .slice(0, 10);

    }


    /*
     * Tombol login
     */

    if ($("loginBtn")) {

      $("loginBtn").onclick =
        login;

    }


    /*
     * Tombol daftar
     */

    if ($("registerBtn")) {

      $("registerBtn").onclick =
        register;

    }


    /*
     * Tombol tambah transaksi
     */

    if ($("add")) {

      $("add").onclick =
        addTransaction;

    }


    /*
     * Tombol logout
     */

    if ($("logout")) {

      $("logout").onclick =
        logout;

    }


    /*
     * Tombol theme
     */

    if ($("theme")) {

      $("theme").onclick =
        toggleTheme;

    }


    /*
     * Tab login
     */

    if ($("showLoginBtn")) {

      $("showLoginBtn").onclick =
        showLogin;

    }


    /*
     * Tab daftar
     */

    if ($("showRegisterBtn")) {

      $("showRegisterBtn").onclick =
        showRegister;

    }


    /*
     * Cek session lokal
     */

    if (currentUser) {

      showApp();

      loadTransactions();

    } else {

      showAuth();

    }

  }
);


/* =========================================================
   AGAR BISA DIPANGGIL DARI HTML
   ========================================================= */

window.login =
  login;

window.register =
  register;

window.logout =
  logout;

window.addTransaction =
  addTransaction;

window.deleteTransaction =
  deleteTransaction;

window.showLogin =
  showLogin;

window.showRegister =
  showRegister;

window.toggleTheme =
  toggleTheme;
