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
