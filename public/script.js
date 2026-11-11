document.documentElement.classList.add('js-ready');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-header nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
} else {
  document.documentElement.classList.remove('js-ready');
}

const tabs = document.querySelectorAll('.people-tab');
const panels = document.querySelectorAll('.people-panel');
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(item => item.classList.toggle('active', item === tab));
  panels.forEach(panel => panel.classList.toggle('active', panel.id === tab.dataset.panel));
}));

const programCards = document.querySelectorAll('.program-card');
programCards.forEach(card => card.addEventListener('toggle', () => {
  if (card.open) programCards.forEach(other => { if (other !== card) other.open = false; });
}));

const programTabs = [...document.querySelectorAll('[data-program-tab]')];
const activateProgramTab = tab => {
  programTabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.dataset.programTab);
    if (panel) {
      panel.hidden = !selected;
      panel.classList.toggle('active', selected);
    }
  });
};

programTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateProgramTab(tab));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % programTabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + programTabs.length) % programTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = programTabs.length - 1;
    else return;
    event.preventDefault();
    programTabs[next].focus();
    activateProgramTab(programTabs[next]);
  });
});


const demoOpenButton = document.getElementById('open-demo-presentation');
const demoDialog = document.getElementById('demo-presentation-dialog');
const demoForm = document.getElementById('demo-unlock-form');
const demoPassphrase = document.getElementById('demo-passphrase');
const demoStatus = document.getElementById('demo-status');
const demoReady = document.getElementById('demo-ready');
const demoPdfLink = document.getElementById('demo-open-pdf');
const demoUnlockButton = document.getElementById('demo-unlock-submit');
let demoPdfUrl = null;

if (demoOpenButton && demoDialog && demoForm) {
  demoOpenButton.addEventListener('click', () => {
    demoDialog.showModal();
    demoPassphrase.focus();
  });
  document.getElementById('close-demo-dialog')?.addEventListener('click', () => demoDialog.close());
  demoDialog.addEventListener('close', () => {
    if (demoPdfUrl) URL.revokeObjectURL(demoPdfUrl);
    demoPdfUrl = null;
    demoPdfLink.removeAttribute('href');
    demoReady.hidden = true;
    demoStatus.textContent = '';
    demoPassphrase.value = '';
  });
  demoForm.addEventListener('submit', async event => {
    event.preventDefault();
    const password = demoPassphrase.value;
    demoPassphrase.value = '';
    demoReady.hidden = true;
    demoStatus.textContent = 'Decrypting in this browser…';
    demoUnlockButton.disabled = true;
    try {
      const response = await fetch('/presentations/encrypted/demo-encrypted-talk.pdf.enc', { cache: 'no-store' });
      if (!response.ok) throw new Error('The encrypted sample could not be loaded.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      const magic = new TextDecoder().decode(bytes.subarray(0, 8));
      if (magic !== 'ICAIFP01' || bytes.length < 56) throw new Error('The encrypted sample has an invalid format.');
      const iterations = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(36, false);
      if (iterations < 100000 || iterations > 2000000) throw new Error('The encrypted sample has invalid password settings.');
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: bytes.slice(8, 24), iterations, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(24, 36) }, key, bytes.slice(40)));
      if (new TextDecoder().decode(plain.slice(0, 5)) !== '%PDF-') throw new Error('The decrypted file is not a PDF.');
      if (demoPdfUrl) URL.revokeObjectURL(demoPdfUrl);
      demoPdfUrl = URL.createObjectURL(new Blob([plain], { type: 'application/pdf' }));
      demoPdfLink.href = demoPdfUrl;
      demoStatus.textContent = '';
      demoReady.hidden = false;
      demoPdfLink.focus();
    } catch (error) {
      demoStatus.textContent = error?.name === 'OperationError'
        ? 'The passphrase is incorrect, or the encrypted file is damaged. Try the public demo passphrase shown on the page.'
        : (error?.message || 'Decryption failed.');
    } finally {
      demoUnlockButton.disabled = false;
    }
  });
}
