(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const RADIUS = [80, 50, 30, 18, 10];
  const COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
  const SPLIT_COUNT = 4;
  const VELOCITY_RANGE = 1.2;

  let circles = [];
  let score = 0;
  let gameOver = false;

  function resizeCanvas() {
    const prevWidth = canvas.width || window.innerWidth;
    const prevHeight = canvas.height || window.innerHeight;
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    const scaleX = prevWidth ? newWidth / prevWidth : 1;
    const scaleY = prevHeight ? newHeight / prevHeight : 1;

    canvas.width = newWidth;
    canvas.height = newHeight;

    if (circles.length === 0) {
      return;
    }

    circles.forEach(circle => {
      circle.x *= scaleX;
      circle.y *= scaleY;
    });
  }

  function init() {
    resizeCanvas();
    resetGame();
    window.addEventListener('resize', onResize, { passive: true });
    canvas.addEventListener('click', handlePointer);
    canvas.addEventListener('touchstart', handlePointer, { passive: false });
    requestAnimationFrame(mainLoop);
  }

  function onResize() {
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    const scaleX = prevWidth ? newWidth / prevWidth : 1;
    const scaleY = prevHeight ? newHeight / prevHeight : 1;

    canvas.width = newWidth;
    canvas.height = newHeight;

    circles.forEach(circle => {
      circle.x *= scaleX;
      circle.y *= scaleY;
    });
  }

  function resetGame() {
    score = 0;
    gameOver = false;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    circles = [{ x: centerX, y: centerY, vx: 0, vy: 0, sizeIndex: 0 }];
  }

  function handlePointer(event) {
    if (event.type === 'touchstart') {
      if (event.touches.length === 0) return;
      event.preventDefault();
    }

    const point = getPointerPosition(event);

    if (gameOver) {
      resetGame();
      return;
    }

    for (let i = circles.length - 1; i >= 0; i--) {
      const circle = circles[i];
      const radius = RADIUS[circle.sizeIndex];
      const dx = point.x - circle.x;
      const dy = point.y - circle.y;
      if (dx * dx + dy * dy <= radius * radius) {
        if (circle.sizeIndex === RADIUS.length - 1) {
          circles.splice(i, 1);
          score += 5;
        } else {
          splitCircle(i);
        }
        break;
      }
    }
  }

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX;
    let clientY;

    if (event.type === 'touchstart') {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }

  function splitCircle(index) {
    const circle = circles[index];
    const nextSize = circle.sizeIndex + 1;
    circles.splice(index, 1);

    for (let i = 0; i < SPLIT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const offset = RADIUS[nextSize] * 0.8;
      const vx = (Math.random() * 2 - 1) * VELOCITY_RANGE;
      const vy = (Math.random() * 2 - 1) * VELOCITY_RANGE;
      circles.push({
        x: circle.x + Math.cos(angle) * offset,
        y: circle.y + Math.sin(angle) * offset,
        vx,
        vy,
        sizeIndex: nextSize
      });
    }
  }

  function update() {
    for (const circle of circles) {
      circle.x += circle.vx;
      circle.y += circle.vy;
      handleWallCollision(circle);
    }

    let merged;
    do {
      merged = mergeCheck();
    } while (merged && !gameOver);
  }

  function handleWallCollision(circle) {
    const radius = RADIUS[circle.sizeIndex];

    if (circle.x - radius < 0) {
      circle.x = radius;
      circle.vx = Math.abs(circle.vx);
    } else if (circle.x + radius > canvas.width) {
      circle.x = canvas.width - radius;
      circle.vx = -Math.abs(circle.vx);
    }

    if (circle.y - radius < 0) {
      circle.y = radius;
      circle.vy = Math.abs(circle.vy);
    } else if (circle.y + radius > canvas.height) {
      circle.y = canvas.height - radius;
      circle.vy = -Math.abs(circle.vy);
    }
  }

  function mergeCheck() {
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];

        if (a.sizeIndex !== b.sizeIndex) continue;

        const radius = RADIUS[a.sizeIndex];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distanceSq = dx * dx + dy * dy;
        const collisionDist = radius * 2;

        if (distanceSq <= collisionDist * collisionDist) {
          if (a.sizeIndex === 0) {
            gameOver = true;
            return false;
          }

          const newSize = a.sizeIndex - 1;
          const mergedCircle = {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            vx: (a.vx + b.vx) / 2,
            vy: (a.vy + b.vy) / 2,
            sizeIndex: newSize
          };

          score += 10 * (5 - newSize);

          circles.splice(j, 1);
          circles.splice(i, 1);
          circles.push(mergedCircle);
          return true;
        }
      }
    }
    return false;
  }

  function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const circle of circles) {
      drawCircle(circle);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 16, 16);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '48px sans-serif';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 24);
    }
  }

  function drawCircle(circle) {
    const radius = RADIUS[circle.sizeIndex];
    ctx.fillStyle = COLORS[circle.sizeIndex];
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function mainLoop() {
    if (!gameOver) {
      update();
    }
    render();
    requestAnimationFrame(mainLoop);
  }

  init();
})();
