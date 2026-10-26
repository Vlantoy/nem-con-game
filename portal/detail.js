(() => {
  const { games, galleries } = window.SONMACH;
  const slug = new URLSearchParams(location.search).get('game') || 'nem-con';
  const g = games[slug];
  const root = document.getElementById('detail-content');

  if (!g) {
    root.innerHTML = `
      <section class="wrap empty-state">
        <h1>Chọn một cuộc vui.</h1>
        <p>Trò chơi này chưa có trong bộ sưu tập. Khám phá Ném còn hoặc Nhảy sạp để bắt đầu.</p>
        <a class="button" href="../#tro-choi">Xem các trò chơi →</a>
      </section>
    `;
    return;
  }

  document.title = `${g.title} · Khám phá cùng Sắc Việt`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = g.description;
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) breadcrumb.textContent = g.title;

  const gameKeys = Object.keys(games);
  const currentIdx = gameKeys.indexOf(slug);
  const nextSlug = gameKeys[(currentIdx + 1) % gameKeys.length];
  const other = games[nextSlug];

  const extraPhotos = (galleries && galleries[slug]) ? galleries[slug] : [];
  const photos = [{ src: g.photo, caption: g.photoAlt, credit: g.photoCredit, source: g.source }, ...extraPhotos];

  root.innerHTML = `
    <section class="detail-hero wrap">
      <div class="detail-hero-copy">
        <p class="eyebrow">${(g.category || g.type).toUpperCase()} · SẮC VIỆT</p>
        <h1>${g.title}</h1>
        <p class="detail-tagline">${g.intro || ''}</p>
        <p class="lead">${g.description}</p>
        <div class="actions" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <a class="button" href="../${slug}/index.html" style="background:#d97706; color:#fff; font-weight:700;">🎮 Vào Chơi ${g.title} Ngay →</a>
          <a class="button" href="#cach-choi">Cách chơi ngoài đời <span aria-hidden="true">↓</span></a>
          <a class="text-link" href="#tong-quan">Ý nghĩa văn hóa ↓</a>
        </div>
        <p class="play-note">Chuyên trang văn hóa Sắc Việt · Bấm logo Sắc Việt trên thanh điều hướng để về sảnh game</p>
      </div>
      <figure class="detail-cover">
        <button class="photo-button" data-photo="0" aria-label="Mở ảnh lớn: ${g.photoAlt}">
          <img src="${g.photo}" alt="${g.photoAlt}" fetchpriority="high">
          <span class="image-open" aria-hidden="true">↗</span>
        </button>
        <figcaption>
          <a class="credit" href="${g.source}" target="_blank" rel="noopener">${g.photoCredit} ↗</a>
        </figcaption>
      </figure>
    </section>

    <div class="detail-facts wrap">
      <p><span>Loại hình</span>${g.type}</p>
      <p><span>Không gian</span>${g.place}</p>
      <p><span>Điểm thú vị</span>${g.skill}</p>
    </div>

    <nav class="chapter-nav" aria-label="Mục lục trò chơi">
      <div class="wrap">
        <div class="chapter-links">
          <a href="#tong-quan" aria-current="location">Giới thiệu</a>
          <a href="#y-nghia">Ý nghĩa</a>
          <a href="#cach-choi">Cách chơi</a>
          <a href="#hinh-anh">Hình ảnh</a>
          ${g.video ? '<a href="#video">Video</a>' : ''}
          <a href="#nguon">Nguồn đọc</a>
        </div>
      </div>
    </nav>

    <section class="chapter wrap section-space" id="tong-quan">
      <div class="chapter-heading" data-reveal>
        <span class="section-caption">Làm quen với cuộc vui</span>
        <h2>${g.title}:<br>cuộc vui bắt đầu thế nào?</h2>
      </div>
      <div class="reading-copy" data-reveal>
        ${(g.overview || []).map(p => `<p>${p}</p>`).join('')}
        ${g.sources && g.sources[0] ? `<a class="source-inline" href="${g.sources[0][1]}" target="_blank" rel="noopener">Đọc thêm: ${g.sources[0][0]} ↗</a>` : ''}
      </div>
    </section>

    <section class="meaning-section wrap section-space" id="y-nghia" aria-labelledby="meaning-heading">
      <div class="chapter">
        <div class="chapter-heading" data-reveal>
          <h2 id="meaning-heading">${g.meaningTitle}</h2>
        </div>
        <div class="reading-copy" data-reveal>
          <p class="large-copy">${g.meaningIntro}</p>
        </div>
      </div>
      <div class="meaning-points">
        ${(g.meaningBlocks || []).map(([title, text]) => `<article data-reveal><h3>${title}</h3><p>${text}</p></article>`).join('')}
      </div>
      <p class="meaning-scope">${g.meaningScope || ''}</p>
      ${g.sources && g.sources[g.meaningSource || 0] ? `<a class="source-inline" href="${g.sources[g.meaningSource || 0][1]}" target="_blank" rel="noopener">Nguồn tham khảo: ${g.sources[g.meaningSource || 0][0]} ↗</a>` : ''}
    </section>

    <section class="equipment-section wrap" aria-labelledby="equipment-heading">
      <h2 class="compact-heading" id="equipment-heading">Một cuộc chơi cần những gì?</h2>
      <dl class="equipment-list">
        ${(g.equipment || []).map(([t, p]) => `<div data-reveal><dt>${t}</dt><dd>${p}</dd></div>`).join('')}
      </dl>
    </section>

    <section class="how-section section-space" id="cach-choi">
      <div class="wrap">
        <div class="section-title" data-reveal>
          <h2>Hiểu nhịp chơi,<br>nhập cuộc dễ hơn.</h2>
          <p>Cách tham gia ngoài đời. Khi đến một ngày hội, hãy theo cách tổ chức và hướng dẫn của cộng đồng tại đó.</p>
        </div>
        <ol class="steps-list">
          ${(g.steps || []).map(([t, p], i) => `<li data-reveal><span class="step-number">0${i + 1}</span><div><h3>${t}</h3><p>${p}</p></div></li>`).join('')}
        </ol>
        <div class="variations">
          ${(g.variants || []).map(([t, p]) => `<div><h3>${t}</h3><p>${p}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="photo-section wrap section-space" id="hinh-anh">
      <div class="section-title" data-reveal>
        <h2>Những khoảnh khắc<br>ngoài màn hình.</h2>
        <p>Quan sát dụng cụ, tư thế và không gian ngày hội. Bấm ảnh để xem lớn.</p>
      </div>
      <div class="gallery-grid">
        ${photos.map((photo, i) => `
          <figure data-reveal>
            <button class="photo-button" data-photo="${i}" aria-label="Xem ảnh lớn: ${photo.caption}">
              <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
              <span class="image-open" aria-hidden="true">↗</span>
            </button>
            <figcaption>
              <p>${photo.caption}</p>
              <a class="credit" href="${photo.source}" target="_blank" rel="noopener">${photo.credit} ↗</a>
            </figcaption>
          </figure>
        `).join('')}
      </div>
      <div class="photo-context" id="cau-chuyen">
        <h3>Đọc ảnh trong đúng bối cảnh</h3>
        <p>${g.context || ''}</p>
      </div>
    </section>

    ${g.video ? `
    <section class="video-section section-space" id="video">
      <div class="wrap">
        <div class="section-title" data-reveal>
          <h2>Nghe nhịp, nhìn động tác.<br>Cảm nhận cuộc vui.</h2>
          <p>Video tư liệu giúp bạn quan sát cách chơi và không khí ngoài đời.</p>
        </div>
        <div class="video-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/${g.video}" title="${g.videoTitle} · ${g.channel}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <div class="video-caption">
          <p>${g.videoTitle}<span>${g.channel}</span></p>
          <a class="text-link" href="https://www.youtube.com/watch?v=${g.video}" target="_blank" rel="noopener">Mở trên YouTube ↗</a>
        </div>
      </div>
    </section>
    ` : ''}

    <section class="digital-section wrap section-space" id="trai-nghiem">
      <div data-reveal>
        <span class="section-caption">Góc nhìn văn hóa</span>
        <h2>Tinh hoa truyền đời,<br>kết nối thế hệ.</h2>
        <p>${g.digital || 'Trò chơi dân gian lưu giữ tâm hồn, tinh thần lạc quan và sự kết nối bền chặt của các thế hệ người Việt.'}</p>
      </div>
      <div class="play-panel">
        <h3>Khám phá ${g.title.toLowerCase()} cùng Sắc Việt</h3>
        <p>${g.controls || 'Trải nghiệm không gian ngày hội qua tư liệu chân thực.'}</p>
        <small>Bấm vào biểu tượng “SẮC VIỆT” ở đầu trang để quay lại sảnh chơi game bất cứ lúc nào.</small>
      </div>
    </section>

    <section class="faq-section wrap section-space">
      <h2>Bạn có thể đang tò mò</h2>
      <div class="faq-list">
        ${(g.faqs || []).map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
      </div>
    </section>

    <section class="sources-section wrap" id="nguon">
      <h2>Tiếp tục tìm hiểu</h2>
      <p>Nội dung được biên soạn và đối chiếu từ những nguồn dưới đây. Cách chơi, ý nghĩa và nghi thức có thể thay đổi theo cộng đồng.</p>
      <ol>
        ${(g.sources || []).map(([t, url, note]) => `<li><a href="${url}" target="_blank" rel="noopener">${t} ↗</a><p>${note}</p></li>`).join('')}
      </ol>
    </section>

    <section class="next-story wrap">
      <a href="?game=${nextSlug}">
        <img src="${other.photo}" alt="${other.photoAlt}" loading="lazy">
        <div>
          <span>Tiếp tục hành trình khám phá</span>
          <h2>${other.title} <span aria-hidden="true">↗</span></h2>
          <p>${other.intro || other.description}</p>
        </div>
      </a>
    </section>
  `;

  // Lightbox
  const dialog = document.getElementById('lightbox');
  let index = 0;
  let opener = null;

  function showPhoto(next) {
    if (!photos.length) return;
    index = (next + photos.length) % photos.length;
    const p = photos[index];
    const imgEl = document.getElementById('lightbox-image');
    const capEl = document.getElementById('lightbox-caption');
    const srcEl = document.getElementById('lightbox-source');
    const cntEl = document.getElementById('lightbox-count');

    if (imgEl) { imgEl.src = p.src; imgEl.alt = p.caption; }
    if (capEl) capEl.textContent = p.caption;
    if (srcEl) { srcEl.href = p.source; srcEl.textContent = (p.credit || 'Nguồn ảnh') + ' ↗'; }
    if (cntEl) cntEl.textContent = `${index + 1} / ${photos.length}`;
  }

  root.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      showPhoto(Number(button.dataset.photo));
      if (dialog) {
        dialog.showModal();
        document.body.classList.add('modal-open');
      }
    });
  });

  document.getElementById('lightbox-close')?.addEventListener('click', () => dialog?.close());
  document.getElementById('lightbox-prev')?.addEventListener('click', () => showPhoto(index - 1));
  document.getElementById('lightbox-next')?.addEventListener('click', () => showPhoto(index + 1));

  dialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(index - 1); }
  });

  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  dialog?.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    opener?.focus({ preventScroll: true });
  });

  // Chapter active link observer
  const links = Array.from(root.querySelectorAll('.chapter-links a'));
  if ('IntersectionObserver' in window && links.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(link => {
            if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

    links.forEach(link => {
      const target = document.querySelector(link.hash);
      if (target) observer.observe(target);
    });

    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
})();
