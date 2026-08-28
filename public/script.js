const filters = document.querySelectorAll('.filter');
const people = document.querySelectorAll('.person');
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  const selected = filter.dataset.filter;
  people.forEach(person => { person.style.display = selected === 'all' || person.dataset.type === selected ? 'grid' : 'none'; });
}));

document.querySelector('#abstract-form').addEventListener('submit', event => {
  event.preventDefault();
  const status = document.querySelector('.form-status');
  status.textContent = 'Thanks — your abstract has been received. We will be in touch.';
  event.target.reset();
});

