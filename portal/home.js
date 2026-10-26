(() => {
  const { games, galleries } = window.SONMACH;
  
  const danceEl = document.getElementById('home-dance');
  const throwEl = document.getElementById('home-throw');
  if (danceEl && games['nhay-sap']) danceEl.src = games['nhay-sap'].photo;
  if (throwEl && games['nem-con']) throwEl.src = games['nem-con'].photo;

  const grid = document.getElementById('game-grid');
  if (grid) {
    grid.innerHTML = '';
    for (const [slug, g] of Object.entries(games)) {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.dataset.reveal = '';
      card.innerHTML = `
        <a class="game-image" href="tro-choi/?game=${slug}" aria-label="Tìm hiểu ${g.title}">
          <img src="${g.photo}" alt="${g.photoAlt}" loading="lazy">
          <span class="image-open" aria-hidden="true">↗</span>
        </a>
        <div class="game-content">
          <div class="game-type">${g.category || 'TRÒ CHƠI DÂN GIAN'} <span>${g.place || 'Văn hóa truyền thống'}</span></div>
          <h3>${g.title}</h3>
          <p>${g.description}</p>
          <div class="card-actions">
            <a class="button small" href="tro-choi/?game=${slug}">Tìm hiểu văn hóa <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      `;
      grid.append(card);
    }
  }

  const scenes = [
    { ...galleries['nem-con'][0], title: 'Gặp nhau trong ngày hội', text: 'Không gian lễ hội Roóng Poọc ở Sa Pa.', href: 'tro-choi/?game=nem-con#cau-chuyen' },
    { ...galleries['nhay-sap'][0], title: 'Cùng nghe, cùng bước', text: 'Nhảy sạp cộng đồng tại Thái Nguyên năm 2026.', href: 'tro-choi/?game=nhay-sap#hinh-anh' }
  ];
  const festGrid = document.getElementById('festival-grid');
  if (festGrid) {
    festGrid.innerHTML = '';
    for (const scene of scenes) {
      if (!scene || !scene.src) continue;
      const figure = document.createElement('figure');
      figure.dataset.reveal = '';
      figure.innerHTML = `
        <a href="${scene.href}">
          <img src="${scene.src}" alt="${scene.caption}" loading="lazy">
        </a>
        <figcaption>
          <h3><a href="${scene.href}">${scene.title} ↗</a></h3>
          <p>${scene.text}</p>
          <a class="credit" href="${scene.source}" target="_blank" rel="noopener">Ảnh: ${scene.credit} ↗</a>
        </figcaption>
      `;
      festGrid.append(figure);
    }
  }
})();
