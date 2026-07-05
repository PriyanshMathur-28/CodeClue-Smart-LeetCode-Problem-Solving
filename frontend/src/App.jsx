import React, { useState, useEffect } from 'react';
import './App.css';

// Header Component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-icon" role="img" aria-label="CODE-CLUE Logo">
              💡
            </div>
            <span className="logo-text">CODE-CLUE</span>
          </div>
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#home" className="nav-link active" onClick={() => setIsMenuOpen(false)}>
              Home
            </a>
            <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Features
            </a>
            {/* <a href="#analysis" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Analysis
            </a> */}
            {/* <a href="#docs" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Documentation
            </a> */}
            <a href="#support" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Support
            </a>
          </nav>
          <div className="header-actions">
            <button 
              className="download-btn"
              onClick={() => window.open('https://microsoftedge.microsoft.com/addons/detail/codeclue-smart-hints-for/plchdapjhfihmgeelmemiambkmkelopo', '_blank')}
              aria-label="Install CODE-CLUE Extension"
            >
              Install Extension
            </button>
            <button 
              className="mobile-menu-btn"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = () => {
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => (prev + 1) % 10);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const codeLines = [
    { number: 1, content: '// AI-Powered Code Analysis', type: 'comment' },
    { number: 2, content: 'function analyzeCode(codeString) {', type: 'function' },
    { number: 3, content: '  const patterns = detectPatterns(codeString);', type: 'variable' },
    { number: 4, content: '  const complexity = calculateComplexity(patterns);', type: 'variable' },
    { number: 5, content: '  return {', type: 'keyword' },
    { number: 6, content: '    insights: generateInsights(patterns),', type: 'property' },
    { number: 7, content: '    optimization: suggestOptimizations(complexity),', type: 'property' },
    { number: 8, content: '    performance: analyzePerformance(codeString)', type: 'property' },
    { number: 9, content: '  };', type: 'bracket' },
    { number: 10, content: '}', type: 'bracket' }
  ];

  const getCodeLineClass = (type) => {
    switch (type) {
      case 'comment': return 'comment';
      case 'function': return 'function';
      case 'variable': return 'variable';
      case 'keyword': return 'keyword';
      case 'property': return 'variable';
      case 'bracket': return 'bracket';
      default: return '';
    }
  };

  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Unlock <span className="highlight">Code Intelligence</span><br />
              with CODE-CLUE
            </h1>
            <p>
              Experience the future of code analysis with our advanced AI-powered extension. 
              Get instant insights, detect patterns, optimize performance, and enhance your 
              development workflow like never before.
            </p>
            <div className="hero-buttons">
              <button 
                className="get-started-btn"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                aria-label="Start analyzing code with CODE-CLUE"
              >
                Start Analyzing
                <span className="arrow" aria-hidden="true">→</span>
              </button>
              <button 
                className="watch-video-btn"
                onClick={() => window.open('https://youtube.com/watch?v=demo', '_blank')}
                aria-label="Watch CODE-CLUE demonstration video"
              >
                <div className="play-icon" aria-hidden="true">▶</div>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="code-editor-container">
              <div className="code-editor primary">
                <div className="editor-header">
                  <div className="window-controls">
                    <div className="control-btn close" aria-label="Close"></div>
                    <div className="control-btn minimize" aria-label="Minimize"></div>
                    <div className="control-btn maximize" aria-label="Maximize"></div>
                  </div>
                  <div className="editor-title">main.js - CODE-CLUE Analysis</div>
                </div>
                <div className="editor-content">
                  {codeLines.map((line, index) => (
                    <div 
                      key={line.number} 
                      className={`code-line ${currentLine === index ? 'highlight' : ''}`}
                    >
                      <span className="line-number">{line.number}</span>
                      <span className={`code-text ${getCodeLineClass(line.type)}`}>
                        {line.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="code-editor secondary">
                <div className="editor-header">
                  <div className="window-controls">
                    <div className="control-btn close" aria-label="Close"></div>
                    <div className="control-btn minimize" aria-label="Minimize"></div>
                    <div className="control-btn maximize" aria-label="Maximize"></div>
                  </div>
                  <div className="editor-title">analysis-results.json</div>
                </div>
                <div className="editor-content">
                  <div className="code-line">
                    <span className="line-number">1</span>
                    <span className="code-text bracket">{"{"}</span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">2</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="string">"complexity"</span>
                      <span className="operator">:</span> <span className="string">"Medium"</span>
                      <span className="bracket">,</span>
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">3</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="string">"performance"</span>
                      <span className="operator">:</span> <span className="string">"Optimized"</span>
                      <span className="bracket">,</span>
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">4</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="string">"patterns"</span>
                      <span className="operator">:</span> <span className="bracket">[</span>
                      <span className="string">"Factory"</span><span className="bracket">,</span> 
                      <span className="string">"Observer"</span><span className="bracket">]</span>
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">5</span>
                    <span className="code-text bracket">{"}"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="analysis-popup" role="alert" aria-live="polite">
              <div className="popup-content">
                <h4>
                  <span role="img" aria-label="Target">🎯</span> 
                  <span className="analysis-badge">Live Analysis</span>
                </h4>
                <p>AI detected 3 optimization opportunities and 2 design patterns in your code!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your code patterns, detect vulnerabilities, and suggest intelligent improvements for better performance.",
      stats: "85% accuracy in bug detection"
    },
    {
      icon: "⚡",
      title: "Real-time Insights",
      description: "Get instant feedback as you type with real-time code analysis, performance metrics, and optimization suggestions directly in your editor.",
      stats: "Sub-second response time"
    },
    {
      icon: "🔍",
      title: "Pattern Detection",
      description: "Automatically identify design patterns, code smells, and architectural issues to maintain clean, maintainable code architecture.",
      stats: "12+ pattern types recognized"
    },
    // {
    //   icon: "📊",
    //   title: "Performance Metrics",
    //   description: "Comprehensive performance analysis with detailed metrics, bottleneck identification, and optimization recommendations.",
    //   stats: "30% average performance improvement"
    // }
  ];

  const analysisData = [
    { type: "Code Quality", status: "success", message: "Excellent code structure with proper modularization" },
    { type: "Performance", status: "warning", message: "Consider extracting complex logic into separate functions" },
    { type: "Security", status: "success", message: "No security vulnerabilities found" },
    { type: "Optimization", status: "error", message: "Memory leak detected in event listener cleanup" }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="features-content">
          <div className="features-text">
            <div className="section-header">
              <span className="section-label">FEATURES</span>
              <h2>CODE-CLUE Premium</h2>
            </div>
            <div className="features-list">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`feature-item ${activeFeature === index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveFeature(index)}
                  role="button"
                  tabIndex="0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveFeature(index);
                    }
                  }}
                >
                  <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <div className="feature-stats">{feature.stats}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="features-visual">
            <div className="code-analysis-display">
              <div className="analysis-header">
                <div className="analysis-title">
                  <span role="img" aria-label="Chart">📈</span> Code Analysis Dashboard
                </div>
                <div className="analysis-stats">
                  <div className="stat-item">
                    <div className="stat-dot success" aria-hidden="true"></div>
                    <span>85 Passed</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-dot warning" aria-hidden="true"></div>
                    <span>12 Warnings</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-dot error" aria-hidden="true"></div>
                    <span>3 Errors</span>
                  </div>
                </div>
              </div>
              <div className="analysis-content">
                {analysisData.map((item, index) => (
                  <div key={index} className="analysis-section">
                    <h4>
                      <span role="img" aria-label="Target">🎯</span> {item.type}
                    </h4>
                    <div className={`analysis-item ${item.status}`}>
                      <div className={`analysis-icon ${item.status}`} aria-hidden="true">
                        {item.status === 'success' ? '✓' : item.status === 'warning' ? '⚠' : '✗'}
                      </div>
                      <div className="analysis-text">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonial Section Component
// const TestimonialSection = () => {
//   const [currentTestimonial, setCurrentTestimonial] = useState(0);

//   const testimonials = [
//     {
//       name: "Alex Johnson",
//       position: "Senior Developer at TechCorp",
//       avatar: "AJ",
//       rating: 5,
//       text: "CODE-CLUE has revolutionized my development workflow! The AI-powered insights have helped me catch subtle bugs and optimize performance issues I would have never noticed otherwise."
//     },
//     {
//       name: "Sarah Chen",
//       position: "Lead Engineer at StartupXYZ",
//       avatar: "SC",
//       rating: 5,
//       text: "The real-time analysis feature is a game-changer. It's like having a senior developer reviewing my code as I write it. Highly recommended!"
//     },
//     {
//       name: "Michael Rodriguez",
//       position: "Full Stack Developer",
//       avatar: "MR",
//       rating: 5,
//       text: "I've tried many code analysis tools, but CODE-CLUE stands out with its accuracy and user-friendly interface. It's become an essential part of my toolkit."
//     }
//   ];

//   const nextTestimonial = () => {
//     setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
//   };

//   const prevTestimonial = () => {
//     setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
//   };

//   useEffect(() => {
//     const interval = setInterval(nextTestimonial, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <section className="testimonial" id="testimonials">
//       <div className="container">
//         <div className="testimonial-content">
//           <div className="testimonial-text">
//             <div className="section-header">
//               <span className="section-label">TESTIMONIALS</span>
//               <h2>What Developers Say About CODE-CLUE?</h2>
//             </div>
//             <div className="testimonial-card">
//               <div className="testimonial-quote">
//                 <div className="quote-icon" aria-hidden="true">"</div>
//                 <p className="quote-text">
//                   {testimonials[currentTestimonial].text}
//                 </p>
//               </div>
//               <div className="testimonial-author">
//                 <div className="author-info">
//                   <div className="author-avatar">
//                     <div className="avatar-placeholder">
//                       {testimonials[currentTestimonial].avatar}
//                     </div>
//                   </div>
//                   <div className="author-details">
//                     <h4 className="author-name">{testimonials[currentTestimonial].name}</h4>
//                     <p className="author-position">{testimonials[currentTestimonial].position}</p>
//                   </div>
//                 </div>
//                 <div className="rating">
//                   <div className="stars">
//                     {[...Array(5)].map((_, i) => (
//                       <span 
//                         key={i} 
//                         className={`star ${i < testimonials[currentTestimonial].rating ? 'active' : ''}`}
//                         aria-hidden="true"
//                       >
//                         ★
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//               <div className="testimonial-controls">
//                 <button 
//                   className="testimonial-btn prev" 
//                   onClick={prevTestimonial}
//                   aria-label="Previous testimonial"
//                 >
//                   ←
//                 </button>
//                 <div className="testimonial-indicators">
//                   {testimonials.map((_, index) => (
//                     <button
//                       key={index}
//                       className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
//                       onClick={() => setCurrentTestimonial(index)}
//                       aria-label={`Go to testimonial ${index + 1}`}
//                     />
//                   ))}
//                 </div>
//                 <button 
//                   className="testimonial-btn next" 
//                   onClick={nextTestimonial}
//                   aria-label="Next testimonial"
//                 >
//                   →
//                 </button>
//               </div>
//             </div>
//           </div>
//           {/* <div className="testimonial-visual">
//             <div className="performance-dashboard">
//               <div className="dashboard-header">
//                 <div className="dashboard-title">
//                   <span role="img" aria-label="Chart">📊</span> Performance Dashboard
//                 </div>
//               </div>
//               <div className="dashboard-content">
//                 <div className="metric-card">
//                   <div className="metric-header">
//                     <div className="metric-title">Code Quality Score</div>
//                     <div className="metric-value">92%</div>
//                   </div>
//                   <div className="metric-chart">
//                     <div className="chart-progress" style={{width: '92%'}}></div>
//                   </div>
//                   <div className="metric-description">
//                     Excellent code quality with minimal technical debt
//                   </div>
//                 </div>
//                 <div className="metric-card">
//                   <div className="metric-header">
//                     <div className="metric-title">Performance Index</div>
//                     <div className="metric-value">87%</div>
//                   </div>
//                   <div className="metric-chart">
//                     <div className="chart-progress" style={{width: '87%'}}></div>
//                   </div>
//                   <div className="metric-description">
//                     Optimized for speed and efficiency
//                   </div>
//                 </div>
//                 <div className="metric-card">
//                   <div className="metric-header">
//                     <div className="metric-title">Security Rating</div>
//                     <div className="metric-value">95%</div>
//                   </div>
//                   <div className="metric-chart">
//                     <div className="chart-progress" style={{width: '95%'}}></div>
//                   </div>
//                   <div className="metric-description">
//                     No critical vulnerabilities detected
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="floating-elements">
//               <div className="floating-star star-1" aria-hidden="true">⭐</div>
//               <div className="floating-star star-2" aria-hidden="true">⭐</div>
//               <div className="floating-star star-3" aria-hidden="true">⭐</div>
//               <div className="floating-star star-4" aria-hidden="true">⭐</div>
//             </div>
//           </div> */}
//         </div>
//       </div>
//     </section>
//   );
// };

// Support Form Component
const SupportForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Replace with your actual email address
  const SUPPORT_EMAIL = 'priyansh.mathur2023@vitstudent.ac.in';

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('Please fill in all required fields.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus('Please enter a valid email address.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      // Email body with formatted content
      const mailtoBody = `
NAME: ${formData.name}
EMAIL: ${formData.email}
PRIORITY: ${formData.priority.toUpperCase()}
SUBJECT: ${formData.subject}

MESSAGE:
${formData.message}

---
This email was sent from the CODE-CLUE Support Form
Time: ${new Date().toLocaleString()}
      `.trim();

      const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[CODE-CLUE Support] ${formData.subject}`)}&body=${encodeURIComponent(mailtoBody)}`;
      
      window.open(mailtoLink);
      
      setSubmitStatus('✅ Email client opened successfully! Please send the email to complete your support request.');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
        setSubmitStatus('');
      }, 5000);
      
    } catch (error) {
      setSubmitStatus('❌ Error opening email client. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-form-container">
      <div className="form-header">
        <h3>Send us a message</h3>
        <p>Fill out the form below and we'll get back to you as soon as possible.</p>
     
      </div>
      
      <form className="support-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              className="form-input"
            />
          </div>
        </div>

        {/* <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority Level</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-select"
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🟠 High Priority</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Brief description of your issue"
              className="form-input"
            />
          </div>
        </div> */}

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and your system information..."
            className="form-textarea"
            rows="6"
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? '📤 Opening Email Client...' : '📧 Send Support Request'}
        </button>

        {submitStatus && (
          <div className={`status-message ${submitStatus.includes('❌') ? 'error' : 'success'}`}>
            {submitStatus}
          </div>
        )}
      </form>
    </div>
  );
};

// Support Section Component
const SupportSection = () => {
  return (
    <section className="support-section" id="support">
      <div className="container">
        <div className="support-content">
          <div className="support-header">
            <div className="section-header">
              <span className="section-label">SUPPORT</span>
              <h2>Get Help & Support</h2>
              <p>Having trouble with CODE-CLUE? We're here to help! Send us your questions and we'll get back to you as soon as possible.</p>
            </div>
          </div>
          
          <div className="support-grid">
            <div className="support-info">
              <div className="info-card">
                <div className="info-icon">📧</div>
                <h3>Email Support</h3>
                <p>Get direct help from our support team</p>
                <span className="info-detail">Response within 24 hours</span>
              </div>
              
              <div className="info-card">
                <div className="info-icon">📚</div>
                <h3>Documentation</h3>
                <p>Find answers in our comprehensive guides</p>
                <span className="info-detail">Setup guides & tutorials</span>
                <h6 style={{marginLeft:"-20px"}}>*Coming Soon</h6>
              </div>
              
              {/* <div className="info-card">
                <div className="info-icon">💬</div>
                <h3>Community</h3>
                <p>Connect with other developers</p>
                <span className="info-detail">Share tips & solutions</span>
              </div> */}
            </div>
            
            <div className="support-form-wrapper">
              <SupportForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-icon" role="img" aria-label="CODE-CLUE Logo">💡</div>
              <span className="logo-text">CODE-CLUE</span>
            </div>
            <p className="footer-description">
              Empowering developers with AI-powered code analysis and optimization tools.
            </p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#api">API</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#support">Help Center</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#community">Community</a></li>


              <li><a href="#status">Status</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 CODE-CLUE. All rights reserved  <span style={{
            marginLeft:"148px", fontWeight:'bolder' 
          }}>Made by Priyash Mathur</span>  </p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const App = () => {
  return (
    <div className="App">
      <Header />
      <HeroSection />
      <FeaturesSection />
      {/* <TestimonialSection /> */}
      <SupportSection />
      <Footer />
    </div>
  );
};

export default App;
