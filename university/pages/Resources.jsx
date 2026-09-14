import { useState, useEffect, useMemo } from 'react';
import {
  Search, Download, FileText, Database, Code, ShieldCheck,
  ChevronDown, Globe, Bookmark, Trophy, File, CheckCircle,
  TrendingDown, TrendingUp, Users, ArrowRight, Share2, Target, Check
} from 'lucide-react';

export default function Resources() {
  const [discipline, setDiscipline] = useState('All Disciplines');
  const [type, setType] = useState('All Types');
  const [sort, setSort] = useState('Most Relevant');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Resources');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', type: 'Research Paper', discipline: 'Environmental Science', file: null });

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (discipline !== 'All Disciplines' && r.discipline !== discipline) return false;
      if (type !== 'All Types' && r.type !== type) return false;
      if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeCategory === 'My Bookmarks' && !r.bookmarkedBy?.includes('111122223333444455556666')) return false;
      if (activeCategory === 'Battle-Tested' && !r.isBattleTested) return false;
      if (activeCategory === 'Datasets' && r.type !== 'Dataset') return false;
      if (activeCategory === 'Research Papers' && r.type !== 'Research Paper') return false;
      if (activeCategory === 'Code & Tools' && r.type !== 'Code/Tool') return false;
      if (activeCategory === 'Reports & Guides' && r.type !== 'Report/Guide') return false;
      return true;
    });
  }, [resources, discipline, type, searchQuery, activeCategory]);

  const handleBookmark = async (id) => {
    try {
      await fetch(`/api/resources/${id}/bookmark`, { method: 'PATCH' });
      setResources(prev => prev.map(r => r._id === id ? { ...r, bookmarkedBy: r.bookmarkedBy?.includes('111122223333444455556666') ? r.bookmarkedBy.filter(x => x !== '111122223333444455556666') : [...(r.bookmarkedBy || []), '111122223333444455556666'] } : r));
      import('../utils/toast').then(m => m.toast('Bookmark toggled!', 'success'));
    } catch (e) {}
  };

  const handleDownload = async (id) => {
    try {
      await fetch(`/api/resources/${id}/download-count`, { method: 'PATCH' });
      setResources(prev => prev.map(r => r._id === id ? { ...r, downloads: (r.downloads || 0) + 1 } : r));
      import('../utils/toast').then(m => m.toast('Download started!', 'success'));
    } catch (e) {}
  };

  return (
    <div className="res-container animate-in">
      
      {/* ── Hero Section ── */}
      <div className="res-hero">
        <div>
          <h1 className="res-hero-title">Resources</h1>
          <p className="res-hero-subtitle">
            Access curated datasets, research papers, code repositories and deployment reports linked to real-world problems.
          </p>
        </div>
        <div className="res-hero-badge">
          <div style={{ background: '#10B981', padding: 6, borderRadius: '50%' }}>
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="res-hero-badge-title">From Data to<br/>Real-World Impact</div>
            <div className="res-hero-badge-sub">Explore. Learn. Build. Share.</div>
            <div style={{ display: 'flex', height: 2, width: 60, marginTop: 6, borderRadius: 2 }}>
              <div style={{ flex: 1, background: '#FF9933' }} />
              <div style={{ flex: 1, background: '#138808' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Row ── */}
      <div className="res-tabs">
        <button className={`res-tab ${activeCategory === 'All Resources' ? 'active' : ''}`} onClick={() => setActiveCategory('All Resources')}>All Resources</button>
        <button className={`res-tab ${activeCategory === 'My Bookmarks' ? 'active' : ''}`} onClick={() => setActiveCategory('My Bookmarks')}><Bookmark className="w-4 h-4" /> My Bookmarks</button>
        <button className={`res-tab ${activeCategory === 'Battle-Tested' ? 'active' : ''}`} onClick={() => setActiveCategory('Battle-Tested')}><Trophy className="w-4 h-4 text-orange-500" /> Battle-Tested</button>
        <button className={`res-tab ${activeCategory === 'Datasets' ? 'active' : ''}`} onClick={() => setActiveCategory('Datasets')}><Database className="w-4 h-4 text-blue-500" /> Datasets</button>
        <button className={`res-tab ${activeCategory === 'Research Papers' ? 'active' : ''}`} onClick={() => setActiveCategory('Research Papers')}><FileText className="w-4 h-4 text-purple-500" /> Research Papers</button>
        <button className={`res-tab ${activeCategory === 'Code & Tools' ? 'active' : ''}`} onClick={() => setActiveCategory('Code & Tools')}><Code className="w-4 h-4 text-teal-500" /> Code & Tools</button>
        <button className={`res-tab ${activeCategory === 'Reports & Guides' ? 'active' : ''}`} onClick={() => setActiveCategory('Reports & Guides')}><File className="w-4 h-4 text-slate-500" /> Reports & Guides</button>
      </div>

      {/* ── Proven Solutions Box ── */}
      <div className="res-proven-box">
        <div className="res-proven-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy className="w-5 h-5 text-yellow-500" fill="currentColor" /> Proven Solutions
            </h3>
            <p style={{ fontSize: 13, color: '#92400E', marginTop: 2 }}>Resources from projects that have been successfully deployed in real-world communities.</p>
          </div>
          <a href="#" style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="res-proven-cards">
          <div className="res-p-card">
            <img src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=150&q=80" alt="Flood" className="res-p-img" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Flood Prediction Model<br/>& Dataset</div>
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Trophy className="w-3 h-3" /> Battle-Tested
              </span>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>📍 Used in 3 districts<br/>❤️ 12K+ people impacted</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
          </div>
          <div className="res-p-card">
            <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=150&q=80" alt="Waste" className="res-p-img" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Smart Waste Segregation<br/>Model & Dataset</div>
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Trophy className="w-3 h-3" /> Battle-Tested
              </span>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>📍 Used in 5 cities<br/>❤️ 8K+ people impacted</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
          </div>
          <div className="res-p-card">
            <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=150&q=80" alt="Solar" className="res-p-img" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Campus Energy Monitoring<br/>System (Full Stack)</div>
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Trophy className="w-3 h-3" /> Battle-Tested
              </span>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>📍 Deployed in 2 universities<br/>❤️ 4.5K+ students benefited</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
          </div>
        </div>
      </div>

      <div className="res-grid">
        
        {/* ── Left Column (Main Content) ── */}
        <div>
          {/* Filters Row */}
          <div className="res-filter-row" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: 200, position: 'relative' }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search resources by title, keyword or topic..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 500, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 130 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Discipline</label>
              <select value={discipline} onChange={e => setDiscipline(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#1E293B', boxSizing: 'border-box' }}>
                <option>All Disciplines</option>
                <option>Environmental Science</option>
                <option>Disaster Management</option>
                <option>Sustainable Infrastructure</option>
              </select>
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 130 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#1E293B', boxSizing: 'border-box' }}>
                <option>All Types</option>
                <option>Research Paper</option>
                <option>Dataset</option>
                <option>Guide/Report</option>
              </select>
            </div>
            <div style={{ flex: '1 1 130px', minWidth: 120 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Sort By</label>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#1E293B', boxSizing: 'border-box' }}>
                <option>Most Relevant</option>
              </select>
            </div>
          </div>

          {/* Dynamic Resource Cards */}
          {filteredResources.map((res) => {
            const isPaper = res.type === 'Research Paper';
            const isDataset = res.type === 'Dataset';
            const iconBg = isPaper ? '#F3E8FF' : isDataset ? '#DBEAFE' : '#D1FAE5';
            const iconColor = isPaper ? 'text-purple-600' : isDataset ? 'text-blue-600' : 'text-teal-600';
            const IconComponent = isPaper ? FileText : isDataset ? Database : Code;

            return (
              <div key={res._id} className="res-card">
                <div className="res-card-top">
                  <div className="res-card-icon" style={{ background: iconBg }}>
                    <IconComponent className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="res-c-title">{res.title}</h3>
                        <div className="res-c-badges">
                          <span className="res-badge" style={{ background: iconBg, color: isPaper ? '#9333EA' : isDataset ? '#2563EB' : '#059669' }}>{res.type}</span>
                          <span className="res-badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>{res.discipline}</span>
                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>• {res.format} • {res.size}</span>
                        </div>
                      </div>
                      <div className="res-c-actions">
                        <div className="res-rating">
                          <span style={{ color: '#F59E0B' }}>★</span> {res.rating} <span style={{ color: '#94A3B8', fontWeight: 500 }}>({res.ratingCount})</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="res-btn-bm" onClick={() => handleBookmark(res._id)}><Bookmark className="w-4 h-4" style={{ fill: res.bookmarkedBy?.includes('111122223333444455556666') ? 'currentColor' : 'none' }} /></button>
                          <button className="res-btn-dl" onClick={() => handleDownload(res._id)}><Download className="w-4 h-4" /> Download ({res.downloads || 0})</button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="res-c-desc">{res.description}</p>
                    
                    <div className="res-c-meta">
                      <span><Globe className="w-3 h-3 inline mr-1 text-slate-400" /> {res.source}</span>
                      <span>|</span>
                      <span>Added {res.date}</span>
                    </div>

                    {res.linkedProblems && res.linkedProblems.length > 0 && (
                      <div className="res-c-links">
                        <span><ShieldCheck className="w-3 h-3 inline text-blue-500 mr-1" /> Linked Problems</span>
                        {res.linkedProblems.slice(0, 2).map((p, i) => (
                          <span key={i} className="res-c-link-tag">{p}</span>
                        ))}
                        {res.linkedProblems.length > 2 && (
                          <span className="res-c-link-tag" style={{ background: '#F1F5F9', color: '#475569' }}>+{res.linkedProblems.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredResources.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748B' }}>
              <FileText className="w-8 h-8 mx-auto mb-4 text-slate-300" />
              <p>No resources found matching your filters.</p>
            </div>
          )}

        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div>
          {/* Quick Stats */}
          <div className="res-sidebar-card">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target className="w-5 h-5 text-blue-600" /> Quick Stats
            </h3>
            <div className="res-stat-grid">
              <div className="res-stat-item">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>1,240</div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Total Resources</div>
                </div>
              </div>
              <div className="res-stat-item">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>8.5K+</div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Total Downloads</div>
                </div>
              </div>
              <div className="res-stat-item">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>320</div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Contributors</div>
                </div>
              </div>
              <div className="res-stat-item">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>12</div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Battle-Tested</div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="res-sidebar-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bookmark className="w-5 h-5 text-slate-700" /> Popular Tags
              </h3>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>View All</a>
            </div>
            <div className="res-tag-cloud">
              <span>Disaster Management</span>
              <span>Urban Planning</span>
              <span>Healthcare</span>
              <span>Sustainability</span>
              <span>Machine Learning</span>
              <span>IoT</span>
              <span>Computer Vision</span>
              <span>Public Infrastructure</span>
              <span>Climate Change</span>
              <span>Data Analytics</span>
            </div>
          </div>

          {/* Top Contributing Institutes */}
          <div className="res-sidebar-card">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy className="w-5 h-5 text-slate-700" /> Top Contributing Institutes
            </h3>
            <div className="res-inst-list">
              {[
                { name: 'IIT Delhi', count: 120, logo: '🔴' },
                { name: 'IISc Bengaluru', count: 98, logo: '🔘' },
                { name: 'IIT Bombay', count: 87, logo: '⚙️' },
                { name: 'NIT Trichy', count: 54, logo: '🛡️' },
                { name: 'BITS Pilani', count: 46, logo: '🔵' }
              ].map(inst => (
                <div key={inst.name} className="res-inst-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1E293B' }}>
                    <span style={{ fontSize: 16 }}>{inst.logo}</span> {inst.name}
                  </div>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>{inst.count} resources</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Box */}
          <div className="res-submit-box">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 className="w-5 h-5" /> Have a resource to share?
            </h3>
            <p style={{ fontSize: 12, color: '#065F46', marginTop: 8, lineHeight: 1.5, opacity: 0.9 }}>
              Contribute datasets, papers, code or reports to help more teams solve real-world problems.
            </p>
            <button style={{ width: '100%', marginTop: 16, background: '#10B981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setShowUploadModal(true)}>
              <Share2 className="w-4 h-4" /> Submit Resource <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Banner ── */}
      <div className="res-bottom-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>Knowledge from one solution can power many more.</h3>
            <p style={{ fontSize: 12, color: '#475569', fontWeight: 500, marginTop: 4 }}>
              When your project gets deployed, its dataset, code and report are automatically added here —<br/>helping the next team start further ahead.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText className="w-4 h-4" /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>Solve a Problem</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy className="w-4 h-4" /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>Deploy Solution</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 className="w-4 h-4" /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>Share as Resource</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp className="w-4 h-4" /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>Create Bigger Impact</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#2563EB', fontStyle: 'italic' }}>Let's build<br/>a stronger India together.</div>
        </div>
      </div>


      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Upload Resource</h3>
            <input type="text" placeholder="Title" value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }} />
            <textarea placeholder="Description" value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, minHeight: 80 }} />
            <select value={uploadData.type} onChange={e => setUploadData({...uploadData, type: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}>
              <option value="Research Paper">Research Paper</option>
              <option value="Dataset">Dataset</option>
              <option value="Code/Tool">Code & Tools</option>
              <option value="Report/Guide">Report & Guide</option>
            </select>
            <select value={uploadData.discipline} onChange={e => setUploadData({...uploadData, discipline: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 16, border: '1px solid #ccc', borderRadius: 4 }}>
              <option value="Environmental Science">Environmental Science</option>
              <option value="Disaster Management">Disaster Management</option>
              <option value="Sustainable Infrastructure">Sustainable Infrastructure</option>
              <option value="Computer Science">Computer Science</option>
            </select>
            <input type="file" onChange={e => setUploadData({...uploadData, file: e.target.files[0]})} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowUploadModal(false)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                const formData = new FormData();
                formData.append('title', uploadData.title);
                formData.append('description', uploadData.description);
                formData.append('type', uploadData.type);
                formData.append('discipline', uploadData.discipline);
                if (uploadData.file) formData.append('file', uploadData.file);
                
                const res = await fetch('/api/resources', { method: 'POST', body: formData });
                const r = await res.json();
                setResources(prev => [r, ...prev]);
                setShowUploadModal(false);
                import('../utils/toast').then(m => m.toast('Resource uploaded', 'success'));
              }} style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#10B981', color: 'white', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}
</div>
    
  );
}
