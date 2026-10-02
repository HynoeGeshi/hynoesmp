(() => {
  const button = document.getElementById('copy-invite');
  if (!button) return;
  button.addEventListener('click', async () => {
    const text = document.getElementById('invite-text');
    const status = document.getElementById('invite-status');
    try {
      await navigator.clipboard.writeText(text.textContent);
      status.textContent = 'Invite copied. Send it to your next teammate.';
    } catch {
      text.closest('details').open = true;
      status.textContent = 'Select and copy the invite below.';
    }
  });
})();
