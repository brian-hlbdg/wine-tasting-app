import React, { useState, useEffect } from 'react';
import { Wine, Calendar, MapPin, Users, BarChart3, Star, CheckCircle } from 'lucide-react';

const AppPreview = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [activeDemo, setActiveDemo] = useState('live');
  const [activeDemoView, setActiveDemoView] = useState('organizer');
  const [userRating, setUserRating] = useState(4);
  const [demoEventCreated, setDemoEventCreated] = useState(false);
  const [eventJoined, setEventJoined] = useState(false);
  const [participantCode, setParticipantCode] = useState('');
  const [liveStats, setLiveStats] = useState({
    participants: 28,
    ratings: 21,
    joinedCount: 0,
    ratingCount: 0
  });

  // Scroll observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.story-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleEventCreation = () => {
    setDemoEventCreated(true);
    setTimeout(() => setDemoEventCreated(false), 3000);
  };

  const handleJoinEvent = () => {
    if (participantCode.toUpperCase() === 'WDE2025' || demoEventCreated) {
      setEventJoined(true);
      setLiveStats(prev => ({ ...prev, joinedCount: 1 }));
    }
  };

  const handleSaveRating = () => {
    setLiveStats(prev => ({ 
      ...prev, 
      ratings: prev.ratings + 1, 
      ratingCount: 1 
    }));
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer transition-all hover:scale-110 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <style jsx global>{`
        .story-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s ease;
        }
        
        .story-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-pulse-gentle {
          animation: pulseGentle 2s infinite;
        }
        
        @keyframes pulseGentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Wine className="w-6 h-6" />
            Palate Collectif
          </div>
          <nav className="hidden md:flex space-x-8">
            {['Challenge', 'Organizer', 'Users', 'Results', 'Demo'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {item === 'Challenge' ? 'The Challenge' : 
                 item === 'Organizer' ? 'For Organizers' :
                 item === 'Users' ? 'For Participants' :
                 item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 animate-fadeInUp">
            Transform Your Wine Tasting Events
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            Create unforgettable experiences for participants while simplifying event management for organizers
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/50 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="bg-white p-6 rounded-xl text-center shadow-md border-l-4 border-purple-500">
                <div className="text-2xl mb-2">🎯</div>
                <strong className="text-purple-600">For Organizers</strong>
                <p className="text-sm text-gray-600 mt-1">Streamlined event creation & real-time insights</p>
              </div>
              <div className="text-3xl">⚡</div>
              <div className="bg-white p-6 rounded-xl text-center shadow-md border-l-4 border-green-500">
                <div className="text-2xl mb-2">👥</div>
                <strong className="text-green-600">For Participants</strong>
                <p className="text-sm text-gray-600 mt-1">Seamless tasting & personal wine discovery</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => document.getElementById('challenge')?.scrollIntoView({behavior: 'smooth'})}
            className="bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 transition-all hover:-translate-y-1 animate-fadeInUp"
            style={{animationDelay: '0.9s'}}
          >
            Discover How It Works
          </button>
        </div>
      </section>

      {/* The Challenge */}
      <section id="challenge" className="story-section py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Wine tasting events are complex to organize and participants often lose track of their discoveries
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📋',
                title: 'Organizer Pain Points',
                description: 'Managing guest lists, wine selections, and collecting feedback through spreadsheets and paper forms'
              },
              {
                icon: '🤔',
                title: 'Participant Frustrations', 
                description: 'Forgetting which wines they enjoyed and struggling to remember tasting notes after the event'
              },
              {
                icon: '📊',
                title: 'Missed Opportunities',
                description: 'No actionable insights to improve future events or help participants discover their preferences'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl text-center shadow-md border border-gray-200 hover:-translate-y-2 transition-all">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer Story */}
      <section id="organizer" className="story-section py-20 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">The Organizer Experience</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet Sarah, a sommelier organizing a corporate wine tasting for 30 executives
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Organizer Dashboard
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 font-medium"
                    value="Executive Wine Discovery"
                    readOnly
                  />
                  <input 
                    type="date" 
                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                    value="2025-10-15"
                    readOnly
                  />
                  <input 
                    type="text" 
                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                    value="Corporate Conference Room"
                    readOnly
                  />
                  <textarea 
                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 resize-none"
                    rows="2"
                    value="Premium wine selection featuring Bordeaux varietals..."
                    readOnly
                  />
                </div>
                <button 
                  className="w-full mt-4 bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                  onClick={handleEventCreation}
                >
                  {demoEventCreated ? <CheckCircle className="w-4 h-4" /> : '+'} 
                  {demoEventCreated ? 'Event Created!' : 'Create Event & Generate Code'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Participant View
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Join Event</h3>
                <p className="text-gray-600 text-sm mb-4">Sarah shares the event code with participants</p>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-center text-lg tracking-widest mb-4"
                  placeholder="Enter Event Code"
                />
                <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  🎉 Join Executive Wine Discovery
                </button>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Event joined successfully! Ready to taste wines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <h3 className="text-center text-xl font-semibold mb-8">Sarah's Organizer Benefits</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: '⏱️',
                  title: '5-Minute Setup',
                  description: 'Create events quickly with wine templates and auto-generated access codes'
                },
                {
                  icon: '📱',
                  title: 'Real-Time Monitoring',
                  description: 'Watch participation rates and ratings come in live during the event'
                },
                {
                  icon: '📊',
                  title: 'Instant Reports',
                  description: 'Export detailed analytics immediately after the event for follow-up'
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Story */}
      <section id="users" className="story-section py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">The Participant Experience</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet Jake, attending his first corporate wine tasting and wanting to remember his favorites
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Sarah's Live Dashboard
              </div>
              <div className="p-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-semibold mb-2">Executive Wine Discovery - Live</h4>
                  <p className="text-gray-600 text-sm mb-4">👥 {liveStats.participants} participants joined</p>
                  <div className="mb-4">
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-600 h-full transition-all duration-1000"
                        style={{width: '75%'}}
                      />
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{liveStats.ratings} ratings submitted</p>
                  </div>
                  <button 
                    className="bg-gray-800 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-900 transition-all flex items-center gap-2"
                    onClick={() => setLiveStats(prev => ({...prev, ratings: prev.ratings + 1}))}
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Live Insights
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <Wine className="w-4 h-4" />
                Jake's Tasting Experience
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Rate This Wine</h3>
                <div className="text-center mb-4">
                  <p className="font-semibold">Château Margaux 2018</p>
                  <p className="text-gray-600 text-sm">Bordeaux Red Blend • France</p>
                </div>
                <div className="flex justify-center mb-4">
                  <StarRating rating={userRating} onRatingChange={setUserRating} />
                </div>
                <textarea 
                  className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none mb-4"
                  rows="2"
                  placeholder="Your tasting notes..."
                  defaultValue="Rich and complex, notes of dark cherry and subtle oak"
                />
                <button 
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  onClick={handleSaveRating}
                >
                  💾 Save My Rating
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <h3 className="text-center text-xl font-semibold mb-8">Jake's Participant Benefits</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: '📝',
                  title: 'Never Forget Favorites',
                  description: 'Digital notes and ratings are saved permanently to review anytime'
                },
                {
                  icon: '🎯',
                  title: 'Discover Your Taste',
                  description: 'Learn your wine preferences through smart analytics and recommendations'
                },
                {
                  icon: '🛒',
                  title: 'Take Action',
                  description: 'Get purchase recommendations and food pairing suggestions'
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-green-50 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="story-section py-20 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">The Results</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Better experiences for everyone, with data-driven insights for continuous improvement
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Organizer Results
              </div>
              <div className="p-8">
                <h4 className="font-semibold mb-6">Event Success Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Participation Rate</span>
                      <strong>93%</strong>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-full w-[93%] transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Average Rating</span>
                      <strong>4.2/5 ⭐</strong>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[84%] transition-all duration-1000"></div>
                    </div>
                  </div>
                </div>
                <button className="mt-6 bg-gray-800 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-900 transition-all flex items-center gap-2">
                  📤 Export Complete Report
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Participant Outcomes
              </div>
              <div className="p-8">
                <h4 className="font-semibold mb-6">Jake's Wine Journey</h4>
                <div className="space-y-4">
                  {[
                    {
                      icon: '📝',
                      title: '5 wines rated',
                      description: 'Complete tasting profile saved'
                    },
                    {
                      icon: '🎯',
                      title: 'Preferences discovered',
                      description: 'You love full-bodied reds!'
                    },
                    {
                      icon: '🌟',
                      title: 'Next steps',
                      description: '3 similar wines recommended'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="bg-yellow-100 p-2 rounded-lg text-lg">{item.icon}</div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Demo Tabs */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
              {[
                { key: 'live', label: '📊 Live Analytics' },
                { key: 'insights', label: '🎯 Smart Insights' },
                { key: 'follow', label: '📬 Follow-up Tools' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDemo(tab.key)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeDemo === tab.key 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeDemo === 'live' && (
              <div>
                <h4 className="text-center text-lg font-semibold mb-6">Real-Time Event Analytics</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{liveStats.participants}</div>
                    <p className="font-semibold">Active Participants</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200">
                    <div className="text-3xl font-bold text-green-600 mb-2">{liveStats.ratings}</div>
                    <p className="font-semibold">Ratings Submitted</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200">
                    <div className="text-3xl font-bold text-yellow-500 mb-2">4.2</div>
                    <p className="font-semibold">Average Rating</p>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === 'insights' && (
              <div>
                <h4 className="text-center text-lg font-semibold mb-6">Smart Wine Insights</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-2xl mb-3">🏆</div>
                    <h5 className="font-semibold mb-2">Most Popular Wine</h5>
                    <p className="text-sm text-gray-600 mb-1"><strong>Château Margaux 2018</strong></p>
                    <p className="text-sm text-gray-600">Average rating: 4.6/5 stars</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-2xl mb-3">📈</div>
                    <h5 className="font-semibold mb-2">Preference Trend</h5>
                    <p className="text-sm text-gray-600 mb-1">Participants prefer <strong>full-bodied reds</strong></p>
                    <p className="text-sm text-gray-600">87% rated Bordeaux blends 4+ stars</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-2xl mb-3">💡</div>
                    <h5 className="font-semibold mb-2">Next Event Suggestion</h5>
                    <p className="text-sm text-gray-600 mb-1">Consider featuring <strong>Italian Barolos</strong></p>
                    <p className="text-sm text-gray-600">Based on group preferences</p>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === 'follow' && (
              <div>
                <h4 className="text-center text-lg font-semibold mb-6">Automated Follow-up Tools</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl text-center border border-gray-200">
                    <div className="text-3xl mb-4">📧</div>
                    <h5 className="font-semibold mb-2">Thank You Emails</h5>
                    <p className="text-sm text-gray-600 mb-4">Personalized emails with each participant's wine ratings and notes</p>
                    <button className="bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium">Send to All</button>
                  </div>
                  <div className="bg-white p-6 rounded-xl text-center border border-gray-200">
                    <div className="text-3xl mb-4">🛒</div>
                    <h5 className="font-semibold mb-2">Purchase Links</h5>
                    <p className="text-sm text-gray-600 mb-4">Automated recommendations with retailer links for highly-rated wines</p>
                    <button className="bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium">Generate Links</button>
                  </div>
                  <div className="bg-white p-6 rounded-xl text-center border border-gray-200">
                    <div className="text-3xl mb-4">📋</div>
                    <h5 className="font-semibold mb-2">Event Summary</h5>
                    <p className="text-sm text-gray-600 mb-4">Professional report with all data, insights, and participant feedback</p>
                    <button className="bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium">Download PDF</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="story-section py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Try It Yourself</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience both sides of Palate Collectif - see how easy it is to organize and participate
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
              {[
                { key: 'organizer', label: '👨‍💼 Organizer View' },
                { key: 'participant', label: '👥 Participant View' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDemoView(tab.key)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeDemoView === tab.key 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeDemoView === 'organizer' && (
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-purple-600">Create Your Event</h4>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                      value="Wine & Dine Experience"
                      readOnly
                    />
                    <input 
                      type="date" 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                      value="2025-11-20"
                      readOnly
                    />
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                      value="Private Dining Room"
                      readOnly
                    />
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <option>French Wine Collection</option>
                      <option>California Varietals</option>
                      <option>Italian Wine Journey</option>
                    </select>
                    <button 
                      className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                      onClick={handleEventCreation}
                    >
                      🚀 Create Event
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-green-600">Your Event Dashboard</h4>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-purple-600 mb-1">WDE2025</div>
                      <p className="text-gray-600 text-sm">Share this code with participants</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{liveStats.joinedCount}</div>
                        <div className="text-gray-600 text-sm">Joined</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{liveStats.ratingCount}</div>
                        <div className="text-gray-600 text-sm">Ratings</div>
                      </div>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm">
                      ▶️ Start Event
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeDemoView === 'participant' && (
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-green-600">Join an Event</h4>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg text-center text-xl tracking-widest"
                      placeholder="Try: WDE2025"
                      value={participantCode}
                      onChange={(e) => setParticipantCode(e.target.value)}
                    />
                    <button 
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all"
                      onClick={handleJoinEvent}
                    >
                      🎯 Join Event
                    </button>
                  </div>
                  {eventJoined && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-semibold">✓ Successfully joined!</p>
                      <p className="text-green-600 text-sm">Wine & Dine Experience</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-purple-600">Rate Wines</h4>
                  <div className={`transition-opacity ${eventJoined ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="text-center mb-4">
                      <p className="font-semibold">Burgundian Pinot Noir</p>
                      <p className="text-gray-600 text-sm">Domaine de la Côte • 2020</p>
                    </div>
                    <div className="flex justify-center mb-4">
                      <StarRating rating={4} onRatingChange={() => {}} readonly={!eventJoined} />
                    </div>
                    <textarea 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none mb-4"
                      rows="2"
                      placeholder="Your tasting notes..."
                      disabled={!eventJoined}
                    />
                    <button 
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                      disabled={!eventJoined}
                      onClick={handleSaveRating}
                    >
                      💾 Save Rating
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Transform Your Wine Events?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join organizers and wine enthusiasts who are creating better tasting experiences
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <button 
              className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all animate-pulse-gentle"
              onClick={() => alert('🚀 Welcome to Palate Collectif!\n\nIn the full version, this would take you to account creation where you can start organizing wine events immediately.')}
            >
              🚀 Get Started
            </button>
            <button 
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all"
              onClick={() => alert('📧 Demo Request Submitted!\n\nThank you for your interest. In the full version, this would schedule a personalized demonstration of Palate Collectif.')}
            >
              📧 Request Demo
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold mb-1">5 min</div>
              <p className="text-gray-300 text-sm">Average setup time</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">94%</div>
              <p className="text-gray-300 text-sm">User satisfaction rate</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">1000+</div>
              <p className="text-gray-300 text-sm">Events hosted</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppPreview;