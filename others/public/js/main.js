// main.js — Landing page logic

document.addEventListener('DOMContentLoaded', async () => {
  // Update navbar and submit buttons if user is logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (user) {
      const actions = document.querySelector('.navbar-actions');
      const dashUrl = `/dashboard/${user.role === 'citizen' ? 'citizen' : user.role === 'university_rep' ? 'university' : user.role === 'industry_rep' ? 'industry' : 'admin'}.html`;
      const submitUrl = `${dashUrl}#submit`;

      if (actions) {
        actions.innerHTML = `
          <a href="${dashUrl}" class="btn-nav-cta" style="display:inline-flex;align-items:center;gap:8px">
            <span style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.25);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">${user.name.charAt(0).toUpperCase()}</span>
            <span>Dashboard (${user.name.split(' ')[0]})</span>
          </a>
          <button onclick="logoutHome()" class="btn-nav-login" style="padding:6px 14px;font-size:13px;cursor:pointer">Logout</button>
          <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
        `;
      }

      // Update hero CTA buttons — fix the selector to target the actual hero submit button
      document.querySelectorAll('.hero-ctas .btn-primary, .hero-ctas a[href*="register"], a[href="/register.html?role=citizen"]').forEach(btn => {
        btn.href = submitUrl;
        btn.textContent = 'Submit a Challenge →';
      });

      // Update bottom CTA buttons
      document.querySelectorAll('.cta-section a[href*="register"]').forEach(btn => {
        btn.href = submitUrl;
        btn.textContent = 'Go to Dashboard →';
      });

    }
  }


  initNavbar();
  initMobileNav();
  await loadStats();
  populateCategories();
  initHomeHeatmap();
  await loadUniversities();
  await loadIndustryPartners();
  initFAQ();
  initScrollAnimations();
});

function initHomeHeatmap() {
  if (window.IndiaHeatmap && document.getElementById('homeIndiaMap')) {
    try {
      window.IndiaHeatmap.create('homeIndiaMap', { isMini: false, center: [22.8, 80.5], zoom: 4.6 });
    } catch(e) {
      console.warn('Home heatmap init note:', e);
    }
  }
}


window.logoutHome = () => {
  Auth.clearAuth();
  window.location.reload();
};


// ── Navbar scroll effect ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }, { passive: true });

  // Smooth nav link active state
  document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

// ── Mobile nav ──
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const closeBtn = document.getElementById('mobileNavClose');

  hamburger?.addEventListener('click', () => mobileNav.classList.add('open'));
  closeBtn?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobileNav?.addEventListener('click', (e) => { if (e.target === mobileNav) mobileNav.classList.remove('open'); });
}

window.closeMobileNav = () => { document.getElementById('mobileNav')?.classList.remove('open'); };

// ── Load live stats ──
async function loadStats() {
  try {
    const res = await fetch('/api/challenges/stats');
    const data = await res.json();
    if (data.success) {
      const stats = data.data;
      animateStat('stat-challenges', stats.total || 50);
      animateStat('stat-resolved', stats.resolved || 18);
      animateStat('liveTotal', stats.total || 50);
      animateStat('liveResolved', stats.resolved || 18);
    }
  } catch(e) {
    animateStat('stat-challenges', 50);
    animateStat('stat-resolved', 18);
    animateStat('liveTotal', 50);
    animateStat('liveResolved', 18);
  }

  // Universities and partners stats
  try {
    const [uRes, iRes] = await Promise.all([
      fetch('/api/universities'), fetch('/api/industry')
    ]);
    const [uData, iData] = await Promise.all([uRes.json(), iRes.json()]);
    if (uData.success) {
      animateStat('stat-universities', uData.data.length);
      animateStat('liveUnivs', uData.data.length);
    }
    if (iData.success) {
      animateStat('stat-partners', iData.data.length);
      animateStat('liveIndustry', iData.data.length);
    }
  } catch(e) {
    animateStat('stat-universities', 5);
    animateStat('stat-partners', 5);
    animateStat('liveUnivs', 5);
    animateStat('liveIndustry', 5);
  }
}

function animateStat(id, target) {
  const el = document.getElementById(id);
  if (!el || typeof target !== 'number') return;
  Utils.animateCounter(el, target, 1800);
}

// ── Categories ──
const CATEGORIES = [
  { name: 'Education', icon: '📚', color: '#dbeafe', iconColor: '#1d4ed8', count: 0 },
  { name: 'Healthcare', icon: '🏥', color: '#fce7f3', iconColor: '#be185d', count: 0 },
  { name: 'Agriculture', icon: '🌾', color: '#d1fae5', iconColor: '#065f46', count: 0 },
  { name: 'Water Management', icon: '💧', color: '#cffafe', iconColor: '#0e7490', count: 0 },
  { name: 'Sanitation & Environment', icon: '🌿', color: '#dcfce7', iconColor: '#166534', count: 0 },
  { name: 'Rural Livelihoods', icon: '🏘️', color: '#fef9c3', iconColor: '#854d0e', count: 0 },
  { name: 'Accessibility', icon: '♿', color: '#f3e8ff', iconColor: '#7c3aed', count: 0 },
  { name: 'Urban Infrastructure', icon: '🏗️', color: '#ffedd5', iconColor: '#c2410c', count: 0 },
  { name: 'Public Administration', icon: '🏛️', color: '#e0e7ff', iconColor: '#3730a3', count: 0 },
  { name: 'Energy & Technology', icon: '⚡', color: '#fef3c7', iconColor: '#d97706', count: 0 }
];

async function populateCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  // Try to get real counts
  try {
    const res = await fetch('/api/challenges/stats');
    const data = await res.json();
    if (data.success && data.data.byCategory) {
      data.data.byCategory.forEach(c => {
        const cat = CATEGORIES.find(x => x.name === c._id);
        if (cat) cat.count = c.count;
      });
    }
  } catch(e) {
    // Use demo counts
    CATEGORIES.forEach((c, i) => c.count = Math.floor(3 + Math.random() * 12));
  }

  const catUrl = (typeof Auth !== 'undefined' && Auth.isLoggedIn())
    ? '/dashboard/citizen.html#submit'
    : '/register.html?role=citizen';

  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card" onclick="window.location.href='${catUrl}&category=${encodeURIComponent(cat.name)}'">
      <div class="category-icon" style="background:${cat.color}">
        <span style="font-size:22px">${cat.icon}</span>
      </div>
      <div class="category-name">${cat.name}</div>
      <div class="category-count"><span>${cat.count}</span> challenges</div>
    </div>
  `).join('');

}

// ── Universities ──
async function loadUniversities() {
  const grid = document.getElementById('universitiesGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="skeleton skeleton-card" style="height:160px"></div>'.repeat(4);

  try {
    const res = await fetch('/api/universities');
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      grid.innerHTML = data.data.slice(0, 4).map(u => `
        <div class="category-card" style="cursor:default">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:10px;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:var(--primary)">${u.shortName?.substring(0,3) || u.name.substring(0,3)}</div>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--gray-900)">${u.shortName || u.name.substring(0,20)}</div>
              <div style="font-size:11px;color:var(--gray-400)">${u.location?.city || 'Jharkhand'}</div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--gray-600);margin-bottom:12px;line-height:1.5">${u.name}</div>
          <div style="display:flex;gap:10px;font-size:12px">
            <span style="color:var(--primary);font-weight:700">${u.stats?.totalAssigned || 0}</span>
            <span style="color:var(--gray-400)">challenges</span>
            <span style="color:var(--accent);font-weight:700">${u.stats?.totalResolved || 0}</span>
            <span style="color:var(--gray-400)">resolved</span>
          </div>
          ${u.naacGrade ? `<div style="margin-top:10px"><span class="badge" style="background:var(--primary-50);color:var(--primary)">NAAC ${u.naacGrade}</span></div>` : ''}
        </div>
      `).join('');
    }
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--gray-400);padding:40px">Could not load universities. Please start the server.</div>';
  }
}

// ── Industry Partners ──
async function loadIndustryPartners() {
  const container = document.getElementById('industryPartnerCards');
  if (!container) return;

  try {
    const res = await fetch('/api/industry');
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const typeColors = { industry: '#dbeafe', startup: '#d1fae5', msme: '#fef3c7', csr: '#f3e8ff', research_lab: '#ffedd5', innovation_hub: '#cffafe', ngo: '#fce7f3', government_agency: '#e0e7ff' };
      const typeLabels = { industry: 'Industry', startup: 'Startup', msme: 'MSME', csr: 'CSR', research_lab: 'Research Lab', innovation_hub: 'Innovation Hub', ngo: 'NGO', government_agency: 'Gov Agency' };

      container.outerHTML = data.data.slice(0, 4).map(p => `
        <div style="background:white;border-radius:var(--radius-xl);padding:20px;border:1.5px solid var(--gray-100);box-shadow:var(--shadow-card);transition:all 0.25s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-card)'">
          <div style="width:44px;height:44px;border-radius:10px;background:${typeColors[p.type] || '#f3f4f6'};display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-weight:800;font-size:18px">
            ${p.type === 'csr' ? '🤝' : p.type === 'startup' ? '🚀' : p.type === 'research_lab' ? '🔬' : p.type === 'ngo' ? '🌱' : p.type === 'innovation_hub' ? '💡' : '🏢'}
          </div>
          <div style="font-weight:700;font-size:14px;color:var(--gray-900);margin-bottom:4px">${p.name}</div>
          <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">${typeLabels[p.type] || p.type} · ${p.sector || 'Multiple'}</div>
          <div style="font-size:12px;color:var(--gray-600);line-height:1.5">${(p.description || '').substring(0,80)}...</div>
          ${p.stats?.totalCollaborations ? `<div style="margin-top:12px;font-size:12px;color:var(--primary);font-weight:600">${p.stats.totalCollaborations} collaborations</div>` : ''}
        </div>
      `).join('');
    }
  } catch(e) {}
}

// ── FAQ ──
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

window.toggleFAQ = (item) => {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};

// ── Scroll animations with Intersection Observer ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.category-card, .timeline-step, .testimonial-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}
