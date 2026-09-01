document.documentElement.classList.add('js-ready');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-header nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navigation.classList.remove('open')));
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
