from pathlib import Path

social = Path('assets/site-social.mjs')
text = social.read_text()
text = text.replace("  if (!turnstileSiteKey) throw new Error('A Turnstile site key is required.');\n\n", "")
text = text.replace("  if (!String(captchaToken ?? '').trim()) throw new Error('Human verification is required.');\n", "")
old = """  const { data, error } = await client.auth.signInAnonymously({
    options: { captchaToken: String(captchaToken).trim() },
  });
"""
new = """  const token = String(captchaToken ?? '').trim();
  const { data, error } = token
    ? await client.auth.signInAnonymously({ options: { captchaToken: token } })
    : await client.auth.signInAnonymously();
"""
if old not in text:
    raise SystemExit('anonymous sign-in block not found')
social.write_text(text.replace(old, new))

panel = Path('assets/site-social-panel.mjs')
ptext = panel.read_text()
old_gate = "joinButton.disabled = !state.client || (!state.session && !state.captchaToken);"
if old_gate not in ptext:
    raise SystemExit('join button gate not found')
panel.write_text(ptext.replace(old_gate, "joinButton.disabled = !state.client;"))
