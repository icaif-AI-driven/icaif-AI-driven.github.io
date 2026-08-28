const filters = document.querySelectorAll('.filter');
const people = document.querySelectorAll('.person');
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  const selected = filter.dataset.filter;
  people.forEach(person => { person.style.display = selected === 'all' || person.dataset.type === selected ? 'grid' : 'none'; });
}));

const endpoint = "https://formsubmit.co/ajax/83d1c623a0456ca8801a18f8b8ffd665";

const canvas = document.querySelector('#orderbook-canvas');
if (canvas) {
  const context = canvas.getContext('2d');
  const visual = canvas.parentElement;
  let width = 0;
  let height = 0;
  let levels = [];
  let tape = [];
  let lastTime = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = visual.clientWidth;
    height = visual.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(12, Math.min(20, Math.round(width / 42)));
    levels = Array.from({ length: count }, (_, index) => ({
      y: height * .22 + index * Math.min(22, height * .045),
      bid: .18 + Math.random() * .7,
      ask: .18 + Math.random() * .7,
      bidTarget: .18 + Math.random() * .7,
      askTarget: .18 + Math.random() * .7,
      phase: Math.random() * Math.PI * 2
    }));
    tape = Array.from({ length: 11 }, (_, index) => ({
      x: width * (.48 + Math.random() * .52),
      y: height * (.08 + (index / 12) * .82),
      speed: 8 + Math.random() * 22,
      direction: Math.random() > .5 ? 1 : -1,
      value: (100 + Math.random() * 900).toFixed(2),
      color: Math.random() > .48 ? '#d6f54a' : '#ff744d'
    }));
  };

  const draw = (time) => {
    const seconds = time * .001;
    const delta = Math.min((time - lastTime) * .001, .05);
    lastTime = time;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#101211';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(214,245,74,.07)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 44) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 0; y < height; y += 34) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }

    const center = height * .51;
    context.setLineDash([3, 7]);
    context.strokeStyle = 'rgba(243,241,235,.22)';
    context.beginPath(); context.moveTo(0, center); context.lineTo(width, center); context.stroke();
    context.setLineDash([]);

    context.font = '10px DM Mono, monospace';
    context.fillStyle = 'rgba(243,241,235,.55)';
    context.fillText('ORDER BOOK / AI MARKET SIMULATION', 18, 23);
    context.fillStyle = 'rgba(255,116,77,.85)';
    context.fillText('ASK', Math.max(18, width * .22), center - 13);
    context.fillStyle = 'rgba(214,245,74,.85)';
    context.fillText('BID', Math.max(18, width * .22), center + 24);

    levels.forEach((level, index) => {
      if (Math.random() < .035) level.bidTarget = .15 + Math.random() * .82;
      if (Math.random() < .035) level.askTarget = .15 + Math.random() * .82;
      level.bid += (level.bidTarget - level.bid) * .035;
      level.ask += (level.askTarget - level.ask) * .035;
      const yAsk = center - 18 - index * 18;
      const yBid = center + 18 + index * 18;
      const maxBar = width * .29;
      context.fillStyle = `rgba(255,116,77,${.12 + level.ask * .2})`;
      context.fillRect(width * .5 - level.ask * maxBar, yAsk - 7, level.ask * maxBar, 11);
      context.fillStyle = `rgba(214,245,74,${.12 + level.bid * .2})`;
      context.fillRect(width * .5, yBid - 7, level.bid * maxBar, 11);
      context.fillStyle = 'rgba(243,241,235,.62)';
      context.fillText((102.5 - index * .05).toFixed(2), width * .5 - 42, yAsk + 3);
      context.fillText((102.45 - index * .05).toFixed(2), width * .5 + 8, yBid + 3);
    });

    tape.forEach(item => {
      item.x += item.speed * item.direction * delta;
      if (item.x < width * .48 || item.x > width + 100) {
        item.direction = item.direction * -1;
        item.y = height * (.08 + Math.random() * .84);
        item.value = (100 + Math.random() * 900).toFixed(2);
      }
      context.fillStyle = item.color;
      context.globalAlpha = .42 + Math.sin(seconds * 2 + item.y) * .18;
      context.fillText(item.value, item.x, item.y);
    });
    context.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(draw);
}

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
