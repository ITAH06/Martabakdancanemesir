import { supabase, isAdmin } from '../js/supabase-client.js';

const $ = (id) => document.getElementById(id);
const pesan = (teks, ok = false) => {
  const el = $('pesan');
  el.textContent = teks;
  el.className = 'pesan' + (ok ? ' ok' : '');
};

/* Mode reset password: Supabase mengirim redirect dengan #type=recovery */
if (window.location.hash.includes('type=recovery')) {
  $('loginForm').hidden = true;
  $('forgotBtn').hidden = true;
  $('recoveryForm').hidden = false;
  document.querySelector('h1').textContent = 'Password Baru';
  document.querySelector('.sub').textContent = 'Masukkan password baru untuk akun admin Anda.';
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  pesan('Memeriksa akun...');

  const { error } = await supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });

  if (error) {
    pesan(error.message);
    return;
  }

  const admin = await isAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    pesan('Akun ini tidak memiliki akses admin.');
    return;
  }

  window.location.href = 'dashboard.html';
});

$('forgotBtn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  if (!email) {
    pesan('Isi email terlebih dahulu.');
    return;
  }

  const redirectTo = window.location.href.split('#')[0];
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  pesan(
    error ? error.message : 'Link reset password sudah dikirim ke email Anda.',
    !error
  );
});

$('recoveryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.auth.updateUser({ password: $('newPassword').value });
  if (error) {
    pesan(error.message);
    return;
  }
  pesan('Password berhasil diperbarui. Silakan login.', true);
  setTimeout(() => { window.location.href = 'login.html'; }, 1200);
});
