const filters = document.querySelectorAll('.filter');
const people = document.querySelectorAll('.person');
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  const selected = filter.dataset.filter;
  people.forEach(person => { person.style.display = selected === 'all' || person.dataset.type === selected ? 'grid' : 'none'; });
}));

const endpoint = "https://formsubmit.co/ajax/83d1c623a0456ca8801a18f8b8ffd665";

const canvas = document.querySelector('#market-canvas');
if (canvas) {
  const context = canvas.getContext('2d');
  const visual = canvas.parentElement;
  let width = 0;
  let height = 0;
  let frame;
  let nodes = [];

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = visual.clientWidth;
    height = visual.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(18, Math.min(42, Math.round(width / 18)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .18,
      vy: (Math.random() - .5) * .18,
      radius: index % 7 === 0 ? 2.6 : 1.5,
      phase: Math.random() * Math.PI * 2
    }));
  };

  const draw = (time) => {
    const seconds = time * .001;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#101211';
    context.fillRect(0, 0, width, height);

    // A quiet coordinate field suggests a live market/data surface.
    context.strokeStyle = 'rgba(214,245,74,.08)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 42) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 0; y < height; y += 42) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < -10 || node.x > width + 10) node.vx *= -1;
      if (node.y < -10 || node.y > height + 10) node.vy *= -1;
    });

    nodes.forEach((node, index) => nodes.slice(index + 1).forEach(other => {
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 118) {
        context.strokeStyle = `rgba(214,245,74,${(1 - distance / 118) * .28})`;
        context.beginPath(); context.moveTo(node.x, node.y); context.lineTo(other.x, other.y); context.stroke();
      }
    }));

    nodes.forEach((node, index) => {
      const pulse = 1 + Math.sin(seconds * 2 + node.phase) * .25;
      context.fillStyle = index % 7 === 0 ? '#ff744d' : '#d6f54a';
      context.shadowColor = context.fillStyle;
      context.shadowBlur = index % 7 === 0 ? 14 : 8;
      context.beginPath(); context.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2); context.fill();
      context.shadowBlur = 0;
    });

    // Animated price/data trace across the network.
    context.strokeStyle = 'rgba(255,116,77,.78)';
    context.lineWidth = 1.5;
    context.beginPath();
    for (let x = 0; x <= width; x += 5) {
      const y = height * .68 + Math.sin(x * .035 + seconds * .7) * 22 + Math.sin(x * .11 + seconds) * 8;
      if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
    frame = requestAnimationFrame(draw);
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
