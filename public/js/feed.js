/* =============================================
   FEED.JS — Social Feed Logic
   InnovateSphere India Platform
   ============================================= */

(function() {
  'use strict';

  // ---- STATE ----
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let currentFilters = { sort: 'recent', state: 'all', category: '', status: 'all', search: '' };
  let currentUser = null;
  let openChallengeId = null;
  let lightboxImages = [];
  let lightboxIdx = 0;
  let searchDebounce = null;

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await checkAuth();
    setupNav();
    setupFilters();
    setupCommentDrawer();
    setupLightbox();
    loadFeedStats();
    loadFeed(true);
    initMiniMap();
    setupScrollListener();
  }

  // ---- AUTH ----
  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.data;
        updateNavForUser();
      }
    } catch (e) {}
  }

  function updateNavForUser() {
    if (!currentUser) return;
    const actions = document.getElementById('feed-nav-actions');
    if (actions) {
      actions.innerHTML = `
        <span style="font-size:.8rem;color:#64748b;font-weight:500">Hi, ${currentUser.name.split(' ')[0]}</span>
        <a href="/dashboard/${currentUser.role === 'admin' ? 'admin' : currentUser.role === 'university_rep' ? 'university' : currentUser.role === 'industry_rep' ? 'industry' : 'citizen'}" class="btn-nav-signup">Dashboard</a>
      `;
    }
    // Show comment input, hide login prompt
    document.getElementById('comment-input-area').style.display = 'block';
    document.getElementById('comment-login-prompt').style.display = 'none';
    // Set avatar
    const av = document.getElementById('commenter-avatar');
    if (av) av.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  function setupNav() {
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('feed-nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    });
    if (!currentUser) {
      document.getElementById('comment-input-area').style.display = 'none';
      document.getElementById('comment-login-prompt').style.display = 'block';
    }
  }

  // ---- FILTERS ----
  function setupFilters() {
    // Sort pills
    document.querySelectorAll('.sort-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilters.sort = btn.dataset.sort;
        reloadFeed();
      });
    });

    // State filter
    document.getElementById('filter-state').addEventListener('change', e => {
      currentFilters.state = e.target.value;
      reloadFeed();
    });

    // Category pills
    document.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilters.category = btn.dataset.cat;
        reloadFeed();
      });
    });

    // Status filter
    document.getElementById('filter-status').addEventListener('change', e => {
      currentFilters.status = e.target.value;
      reloadFeed();
    });

    // Search (debounced)
    document.getElementById('filter-search').addEventListener('input', e => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentFilters.search = e.target.value;
        reloadFeed();
      }, 400);
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', resetFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', resetFilters);

    // Load more btn
    document.getElementById('btn-load-more').addEventListener('click', () => loadFeed(false));
  }

  function resetFilters() {
    currentFilters = { sort: 'recent', state: 'all', category: '', status: 'all', search: '' };
    document.getElementById('filter-state').value = 'all';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-search').value = '';
    document.querySelectorAll('.sort-pill').forEach(b => b.classList.toggle('active', b.dataset.sort === 'recent'));
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === ''));
    reloadFeed();
  }

  function reloadFeed() {
    currentPage = 1;
    totalPages = 1;
    loadFeed(true);
    updateActiveFiltersBar();
  }

  function updateActiveFiltersBar() {
    const bar = document.getElementById('active-filters-bar');
    const tags = document.getElementById('filter-tags');
    const active = [];
    if (currentFilters.state !== 'all') active.push(currentFilters.state);
    if (currentFilters.category) active.push(currentFilters.category);
    if (currentFilters.status !== 'all') active.push(currentFilters.status.replace('_', ' '));
    if (currentFilters.search) active.push(`"${currentFilters.search}"`);
    if (active.length > 0) {
      bar.style.display = 'flex';
      tags.innerHTML = active.map(t => `<span class="filter-tag">${t}</span>`).join('');
    } else {
      bar.style.display = 'none';
    }
  }

  // ---- FEED STATS ----
  async function loadFeedStats() {
    try {
      const res = await fetch('/api/map-data');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.summary) {
        animateNumber(document.getElementById('stat-total'), data.summary.totalChallenges);
        animateNumber(document.getElementById('stat-active'), data.summary.totalActive);
        animateNumber(document.getElementById('stat-states'), data.summary.totalStates);
        animateNumber(document.getElementById('stat-resolved'), data.summary.totalResolved);
      }
    } catch (e) {}
  }

  function animateNumber(el, target) {
    if (!el) return;
    const start = 0;
    const dur = 1200;
    const startTime = performance.now();
    function step(now) {
      const pct = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      el.textContent = Math.round(start + (target - start) * ease).toLocaleString('en-IN');
      if (pct < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- LOAD FEED ----
  async function loadFeed(reset = false) {
    if (isLoading) return;
    isLoading = true;

    const spinner = document.getElementById('load-spinner');
    const btnMore = document.getElementById('btn-load-more');
    const endMsg = document.getElementById('feed-end-msg');

    if (reset) {
      document.getElementById('feed-items').innerHTML = '';
      showSkeletons();
    } else {
      spinner.style.display = 'flex';
      btnMore.style.display = 'none';
    }

    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      sort: currentFilters.sort
    });
    if (currentFilters.state !== 'all') params.set('state', currentFilters.state);
    if (currentFilters.category) params.set('category', currentFilters.category);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.search) params.set('search', currentFilters.search);

    try {
      const res = await fetch(`/api/challenges/feed?${params}`);
      const data = await res.json();

      if (reset) removeSkeletons();
      spinner.style.display = 'none';

      if (!data.success) throw new Error(data.message);

      totalPages = data.pagination.pages;
      const challenges = data.data;

      if (reset && challenges.length === 0) {
        document.getElementById('feed-items').innerHTML = `
          <div class="no-results" style="text-align:center;padding:4rem 2rem;color:#94a3b8">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:1rem"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style="font-size:1rem;font-weight:600;color:#64748b;margin-bottom:.5rem">No challenges found</p>
            <p style="font-size:.85rem">Try adjusting your filters</p>
          </div>
        `;
        return;
      }

      challenges.forEach((c, i) => {
        const card = createFeedCard(c);
        card.style.animationDelay = `${i * 50}ms`;
        document.getElementById('feed-items').appendChild(card);
      });

      currentPage++;

      if (currentPage <= totalPages) {
        btnMore.style.display = 'block';
        endMsg.style.display = 'none';
      } else {
        btnMore.style.display = 'none';
        endMsg.style.display = 'flex';
      }
    } catch (e) {
      removeSkeletons();
      spinner.style.display = 'none';
      document.getElementById('feed-items').innerHTML = `
        <div style="text-align:center;padding:2rem;color:#dc2626">
          <p>Failed to load feed. Please try again.</p>
          <button onclick="location.reload()" style="margin-top:.75rem;padding:.5rem 1rem;background:#1a56db;color:#fff;border:none;border-radius:8px;cursor:pointer">Retry</button>
        </div>
      `;
    } finally {
      isLoading = false;
    }
  }

  function showSkeletons() {
    const container = document.getElementById('feed-items');
    container.innerHTML = ['skel-1','skel-2','skel-3'].map(id =>
      `<div class="feed-card skeleton-card" id="${id}"></div>`
    ).join('');
  }

  function removeSkeletons() {
    document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
  }

  // ---- CREATE FEED CARD ----
  function createFeedCard(challenge) {
    const card = document.createElement('div');
    card.className = 'feed-card';
    card.id = `card-${challenge._id}`;

    const authorName = challenge.submittedBy?.name || challenge.submitterContact?.name || 'Anonymous';
    const authorInitial = authorName.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(challenge.createdAt);
    const statusClass = `status-${challenge.status}`;
    const statusLabel = challenge.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const priorityLabel = challenge.priority.charAt(0).toUpperCase() + challenge.priority.slice(1);
    const loc = challenge.location;
    const locationStr = [loc.district, loc.state].filter(Boolean).join(', ');
    const supported = currentUser && challenge.supports?.includes(currentUser._id);

    // Gallery HTML
    const galleryHtml = buildGalleryHtml(challenge);

    // University note
    const uniNote = challenge.assignedUniversity ? `
      <div class="card-university-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 10-5 10 5-10 5z"/><path d="M6 9.5v5a6 6 0 0 0 12 0v-5"/></svg>
        Being solved by ${challenge.assignedUniversity.shortName || challenge.assignedUniversity.name}
      </div>
    ` : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-author">
          <div class="author-avatar">${authorInitial}</div>
          <div class="author-info">
            <div class="author-name">${escapeHtml(authorName)}</div>
            <div class="author-meta">
              <span>${timeAgo}</span>
              <span class="dot"></span>
              <span>${escapeHtml(loc.state || 'India')}</span>
            </div>
          </div>
        </div>
        <div class="card-badges">
          <span class="badge ${challenge.priority}">${priorityLabel}</span>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHtml(locationStr)}</span>
        </div>
        <div class="card-category-tag">${escapeHtml(challenge.category)}</div>
        <h2 class="card-title" data-id="${challenge._id}">${escapeHtml(challenge.title)}</h2>
        <p class="card-description" id="desc-${challenge._id}">${escapeHtml(challenge.description)}</p>
        <button class="btn-expand-desc" data-id="${challenge._id}">Read more</button>
        ${uniNote}
      </div>
      ${galleryHtml}
      <div class="card-footer">
        <div class="card-actions">
          <button class="action-btn btn-support ${supported ? 'supported' : ''}" data-id="${challenge._id}" data-count="${challenge.supportCount || 0}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${supported ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="support-count">${formatCount(challenge.supportCount || 0)}</span>
          </button>
          <button class="action-btn btn-comment" data-id="${challenge._id}" data-title="${escapeHtml(challenge.title)}" data-count="${challenge.commentCount || 0}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>${formatCount(challenge.commentCount || 0)}</span>
          </button>
          <button class="action-btn btn-share" data-id="${challenge._id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
        </div>
        <div class="card-view-count">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${formatCount(challenge.viewCount || 0)} views
        </div>
      </div>
    `;

    // Event listeners
    card.querySelector('.card-title').addEventListener('click', () => {
      window.location.href = `/dashboard/citizen?challenge=${challenge._id}`;
    });

    card.querySelector('.btn-expand-desc').addEventListener('click', function() {
      const desc = card.querySelector('.card-description');
      const expanded = desc.classList.toggle('expanded');
      this.textContent = expanded ? 'Show less' : 'Read more';
    });

    card.querySelector('.btn-support').addEventListener('click', () => handleSupport(challenge._id, card));

    card.querySelector('.btn-comment').addEventListener('click', () => {
      openCommentDrawer(challenge._id, challenge.title, challenge.commentCount || 0);
    });

    card.querySelector('.btn-share').addEventListener('click', () => handleShare(challenge));

    return card;
  }

  function buildGalleryHtml(challenge) {
    const images = (challenge.attachments || []).filter(a => a.mimetype && a.mimetype.startsWith('image/'));
    if (images.length === 0) return '';

    let inner = '';
    if (images.length === 1) {
      inner = `<div class="gallery-img-wrap gallery-single" data-imgs='${JSON.stringify(images.map(i => i.url || `/uploads/${i.filename}`))}' data-idx="0">
        <img src="${images[0].url || `/uploads/${images[0].filename}`}" alt="Evidence" loading="lazy" />
      </div>`;
    } else if (images.length === 2) {
      inner = images.map((img, i) => `
        <div class="gallery-img-wrap gallery-two" data-imgs='${JSON.stringify(images.map(im => im.url || `/uploads/${im.filename}`))}' data-idx="${i}">
          <img src="${img.url || `/uploads/${img.filename}`}" alt="Evidence ${i+1}" loading="lazy" />
        </div>
      `).join('');
    } else {
      // 3+: first image + right column
      const allUrls = JSON.stringify(images.map(im => im.url || `/uploads/${im.filename}`));
      inner = `
        <div class="gallery-img-wrap gallery-three-main" data-imgs='${allUrls}' data-idx="0">
          <img src="${images[0].url || `/uploads/${images[0].filename}`}" alt="Evidence 1" loading="lazy" />
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;width:40%;flex-shrink:0">
          <div class="gallery-img-wrap gallery-three-side" data-imgs='${allUrls}' data-idx="1" style="height:108px">
            <img src="${images[1].url || `/uploads/${images[1].filename}`}" alt="Evidence 2" loading="lazy" />
          </div>
          <div class="gallery-img-wrap gallery-three-side" data-imgs='${allUrls}' data-idx="2" style="height:108px;position:relative">
            <img src="${images[2].url || `/uploads/${images[2].filename}`}" alt="Evidence 3" loading="lazy" />
            ${images.length > 3 ? `<div class="gallery-more-overlay">+${images.length - 3} more</div>` : ''}
          </div>
        </div>
      `;
    }

    const gallery = document.createElement('div');
    gallery.className = 'card-gallery';
    gallery.innerHTML = `<div class="gallery-track">${inner}</div>`;
    // After creation, attach lightbox handlers
    setTimeout(() => {
      gallery.querySelectorAll('.gallery-img-wrap').forEach(wrap => {
        wrap.addEventListener('click', () => {
          const imgs = JSON.parse(wrap.dataset.imgs);
          const idx = parseInt(wrap.dataset.idx);
          openLightbox(imgs, idx);
        });
      });
    }, 0);

    return gallery.outerHTML;
  }

  // ---- SUPPORT ----
  async function handleSupport(challengeId, card) {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Login required to support a challenge', 'error');
      return;
    }

    const btn = card.querySelector('.btn-support');
    if (!btn) return;

    try {
      const res = await fetch(`/api/challenges/${challengeId}/support`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const countEl = btn.querySelector('.support-count');
      countEl.textContent = formatCount(data.data.supportCount);

      if (data.data.supported) {
        btn.classList.add('supported');
        btn.querySelector('svg').setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('supported');
        btn.querySelector('svg').setAttribute('fill', 'none');
      }
    } catch (e) {
      showToast(e.message || 'Failed to support', 'error');
    }
  }

  // ---- SHARE ----
  function handleShare(challenge) {
    const url = `${window.location.origin}/feed#challenge=${challenge._id}`;
    if (navigator.share) {
      navigator.share({ title: challenge.title, text: challenge.description.substring(0, 120) + '...', url })
        .catch(() => copyToClipboard(url));
    } else {
      copyToClipboard(url);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Link copied to clipboard!', 'success'));
  }

  // ---- COMMENT DRAWER ----
  function setupCommentDrawer() {
    document.getElementById('drawer-close').addEventListener('click', closeCommentDrawer);
    document.getElementById('comment-overlay').addEventListener('click', closeCommentDrawer);

    const textarea = document.getElementById('comment-text');
    textarea.addEventListener('input', () => {
      document.getElementById('char-count').textContent = `${textarea.value.length}/1000`;
    });

    document.getElementById('btn-post-comment').addEventListener('click', postComment);
  }

  function openCommentDrawer(challengeId, title, count) {
    openChallengeId = challengeId;
    document.getElementById('drawer-challenge-title').textContent = title;
    document.getElementById('drawer-comment-count').textContent = count;
    document.getElementById('comment-overlay').classList.add('open');
    document.getElementById('comment-drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
    loadComments(challengeId);
  }

  function closeCommentDrawer() {
    openChallengeId = null;
    document.getElementById('comment-overlay').classList.remove('open');
    document.getElementById('comment-drawer').classList.remove('open');
    document.body.style.overflow = '';
  }

  async function loadComments(challengeId) {
    const list = document.getElementById('comments-list');
    list.innerHTML = `<div class="comments-loading"><div class="spinner-ring"></div></div>`;

    try {
      const res = await fetch(`/api/challenges/${challengeId}/comments?limit=50`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      list.innerHTML = '';

      if (data.data.length === 0) {
        list.innerHTML = `<div class="no-comments-msg">No comments yet. Be the first to comment!</div>`;
        return;
      }

      data.data.forEach(comment => {
        list.appendChild(createCommentEl(comment, challengeId));
      });
    } catch (e) {
      list.innerHTML = `<div class="no-comments-msg" style="color:#dc2626">Failed to load comments.</div>`;
    }
  }

  function createCommentEl(comment, challengeId) {
    const el = document.createElement('div');
    el.className = 'comment-item';
    el.id = `comment-${comment._id}`;

    const authorName = comment.author?.name || 'Anonymous';
    const initial = authorName.charAt(0).toUpperCase();
    const isOwn = currentUser && comment.author?._id === currentUser._id;

    if (comment.isDeleted) {
      el.innerHTML = `
        <div class="comment-avatar" style="background:#e2e8f0;color:#94a3b8">—</div>
        <div class="comment-body"><em class="comment-deleted">[Comment deleted]</em></div>
      `;
      return el;
    }

    let repliesHtml = '';
    if (comment.replies && comment.replies.length > 0) {
      repliesHtml = `<div class="comment-replies" id="replies-${comment._id}">` +
        comment.replies.map(r => {
          const rName = r.author?.name || 'Anonymous';
          return `
            <div class="comment-item" id="comment-${r._id}">
              <div class="comment-avatar" style="width:26px;height:26px;font-size:.65rem">${rName.charAt(0).toUpperCase()}</div>
              <div class="comment-body">
                <div class="comment-author-row">
                  <span class="comment-author-name">${escapeHtml(rName)}</span>
                  <span class="comment-time">${formatTimeAgo(r.createdAt)}</span>
                </div>
                <p class="comment-text">${escapeHtml(r.text)}</p>
              </div>
            </div>
          `;
        }).join('') +
      `</div>`;
    }

    el.innerHTML = `
      <div class="comment-avatar">${initial}</div>
      <div class="comment-body" style="flex:1">
        <div class="comment-author-row">
          <span class="comment-author-name">${escapeHtml(authorName)}</span>
          <span class="comment-time">${formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
        <div class="comment-actions-btns">
          <button class="comment-action-btn" data-action="reply" data-id="${comment._id}">Reply</button>
          ${isOwn ? `<button class="comment-action-btn" data-action="delete" data-id="${comment._id}" style="color:#dc2626">Delete</button>` : ''}
        </div>
        <div class="reply-area-${comment._id}"></div>
        ${repliesHtml}
      </div>
    `;

    el.querySelector('[data-action="reply"]')?.addEventListener('click', () => toggleReplyInput(comment._id, challengeId));
    el.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteComment(comment._id, challengeId));

    return el;
  }

  function toggleReplyInput(commentId, challengeId) {
    const area = document.querySelector(`.reply-area-${commentId}`);
    if (!area) return;
    if (area.innerHTML) { area.innerHTML = ''; return; }
    if (!currentUser) { showToast('Login to reply', 'error'); return; }

    area.innerHTML = `
      <div class="reply-input-wrap">
        <textarea class="reply-input" placeholder="Write a reply..." rows="2"></textarea>
        <button class="btn-submit-reply">Reply</button>
      </div>
    `;
    area.querySelector('.btn-submit-reply').addEventListener('click', async () => {
      const text = area.querySelector('.reply-input').value.trim();
      if (!text) return;
      await postCommentOrReply(challengeId, text, commentId);
      area.innerHTML = '';
      loadComments(challengeId);
    });
    area.querySelector('.reply-input').focus();
  }

  async function postComment() {
    if (!currentUser || !openChallengeId) return;
    const textarea = document.getElementById('comment-text');
    const text = textarea.value.trim();
    if (!text) { showToast('Please write a comment', 'error'); return; }

    const btn = document.getElementById('btn-post-comment');
    btn.disabled = true;
    btn.textContent = 'Posting...';

    await postCommentOrReply(openChallengeId, text, null);
    textarea.value = '';
    document.getElementById('char-count').textContent = '0/1000';
    btn.disabled = false;
    btn.textContent = 'Post Comment';
    loadComments(openChallengeId);
  }

  async function postCommentOrReply(challengeId, text, parentId) {
    const token = localStorage.getItem('token');
    try {
      const body = { text };
      if (parentId) body.parentCommentId = parentId;
      const res = await fetch(`/api/challenges/${challengeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Update comment count on card
      const card = document.getElementById(`card-${challengeId}`);
      if (card) {
        const btn = card.querySelector('.btn-comment span');
        if (btn) {
          const curr = parseInt(btn.textContent) || 0;
          btn.textContent = formatCount(curr + 1);
        }
      }
      // Update drawer count
      const drawerCount = document.getElementById('drawer-comment-count');
      if (drawerCount) {
        const curr = parseInt(drawerCount.textContent) || 0;
        drawerCount.textContent = curr + 1;
      }
      return data.data;
    } catch (e) {
      showToast(e.message || 'Failed to post comment', 'error');
    }
  }

  async function deleteComment(commentId, challengeId) {
    if (!confirm('Delete this comment?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Comment deleted', 'success');
      loadComments(challengeId);
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error');
    }
  }

  // ---- LIGHTBOX ----
  function setupLightbox() {
    document.getElementById('lightbox-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('lightbox-overlay')) closeLightbox();
    });
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => navigateLightbox(1));
    document.addEventListener('keydown', e => {
      if (!document.getElementById('lightbox-overlay').classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(images, startIdx) {
    lightboxImages = images;
    lightboxIdx = startIdx;
    renderLightboxImage();
    document.getElementById('lightbox-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    lightboxIdx = (lightboxIdx + dir + lightboxImages.length) % lightboxImages.length;
    renderLightboxImage();
  }

  function renderLightboxImage() {
    const content = document.getElementById('lightbox-content');
    const counter = document.getElementById('lightbox-counter');
    content.innerHTML = `<img src="${lightboxImages[lightboxIdx]}" alt="Evidence ${lightboxIdx + 1}" />`;
    counter.textContent = `${lightboxIdx + 1} / ${lightboxImages.length}`;
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    prevBtn.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
  }

  // ---- MINI MAP ----
  function initMiniMap() {
    const container = document.getElementById('mini-map');
    if (!container) return;

    // Show India SVG icon placeholder
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:.5rem">
        <svg width="60" height="72" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5 L90 25 L85 75 L50 115 L15 75 L10 25 Z" fill="#dbeafe" stroke="#1a56db" stroke-width="2"/>
          <circle cx="50" cy="60" r="8" fill="#dc2626" opacity="0.8"/>
          <circle cx="30" cy="45" r="5" fill="#f59e0b" opacity="0.7"/>
          <circle cx="70" cy="50" r="6" fill="#dc2626" opacity="0.6"/>
          <circle cx="55" cy="80" r="4" fill="#f59e0b" opacity="0.5"/>
        </svg>
        <a href="/map" style="font-size:.7rem;color:#1a56db;font-weight:700;text-decoration:none">Open Full Map →</a>
      </div>
    `;
  }

  // ---- SCROLL ----
  function setupScrollListener() {
    // Observe last card for infinite scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && currentPage <= totalPages) {
          loadFeed(false);
        }
      });
    }, { rootMargin: '200px' });

    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    document.getElementById('feed-load-more').appendChild(sentinel);
    observer.observe(sentinel);
  }

  // ---- TOAST ----
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);
      background:${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1a56db'};
      color:#fff;padding:.65rem 1.25rem;border-radius:10px;font-size:.82rem;
      font-weight:600;z-index:1000;white-space:nowrap;
      box-shadow:0 8px 24px rgba(0,0,0,0.2);
      animation:toastIn .3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ---- UTILS ----
  function formatTimeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
  }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

})();
