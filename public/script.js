const filters = document.querySelectorAll('.filter');
const people = document.querySelectorAll('.person');
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  const selected = filter.dataset.filter;
  people.forEach(person => { person.style.display = selected === 'all' || person.dataset.type === selected ? 'grid' : 'none'; });
}));

const endpoint = "https://formsubmit.co/ajax/83d1c623a0456ca8801a18f8b8ffd665";

document.querySelector('#abstract-form').addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('.form-status');
  const button = event.target.querySelector('button');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(event.target)
    });
    if (!response.ok) throw new Error('Submission failed');
    status.textContent = 'Thanks — your abstract has been received.';
    event.target.reset();
  } catch (error) {
    status.textContent = 'Unable to send. Please try again or contact the organizers.';
  } finally {
    button.disabled = false;
  }
});

