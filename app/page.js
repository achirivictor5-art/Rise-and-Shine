import SiteNav from '../components/SiteNav';

export const metadata = {
  title: 'Rise and Shine Nursery and Primary School',
  description: 'Rise and Shine Nursery and Primary School — three branches, one school. Where every child can shine.',
};

export default function HomePage() {
  return (
    <>
      <SiteNav />

      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow" style={{ color: 'var(--gold)' }}>Three branches. One family.</p>
            <h1>Where every child <em>can shine</em>.</h1>
            <p className="lead">Rise and Shine Nursery and Primary School nurtures curious, confident learners across our three branches — one shared standard of care, one shared promise to every parent.</p>
            <div className="hero-ctas">
              <a className="btn btn-gold" href="#admissions">Start Admission</a>
              <a className="btn btn-outline" href="#branches">Find Your Nearest Branch</a>
            </div>
            <div className="hero-stats">
              <div><b>3</b><span>Branches, one curriculum</span></div>
              <div><b>2</b><span>Nursery &amp; Primary sections</span></div>
              <div><b>1:12</b><span>Teacher to pupil ratio</span></div>
            </div>
          </div>
          <div>
            <svg className="sunrise" viewBox="0 0 500 420">
              <circle cx="250" cy="150" r="62" fill="#F5B400" />
              <g fill="#F5B400">
                <rect x="243" y="50" width="14" height="34" rx="7" />
                <rect x="243" y="216" width="14" height="34" rx="7" transform="rotate(180 250 233)" />
                <rect x="150" y="143" width="34" height="14" rx="7" transform="rotate(20 167 150)" />
                <rect x="316" y="143" width="34" height="14" rx="7" transform="rotate(-20 333 150)" />
                <rect x="170" y="90" width="34" height="14" rx="7" transform="rotate(45 187 97)" />
                <rect x="296" y="90" width="34" height="14" rx="7" transform="rotate(-45 313 97)" />
              </g>
              <polygon points="60,270 440,270 250,400" fill="#ffffff" opacity="0.95" />
              <g fill="#0C5C32">
                <circle cx="200" cy="240" r="9" /><rect x="192" y="250" width="16" height="26" rx="4" />
                <circle cx="240" cy="220" r="9" /><rect x="232" y="230" width="16" height="30" rx="4" />
                <circle cx="280" cy="225" r="9" /><rect x="272" y="235" width="16" height="28" rx="4" />
                <circle cx="320" cy="245" r="9" /><rect x="312" y="255" width="16" height="24" rx="4" />
                <circle cx="170" cy="260" r="8" /><rect x="163" y="269" width="14" height="20" rx="4" />
                <circle cx="260" cy="260" r="8" /><rect x="253" y="269" width="14" height="20" rx="4" />
                <circle cx="300" cy="262" r="8" /><rect x="293" y="271" width="14" height="20" rx="4" />
              </g>
            </svg>
          </div>
        </div>
        <svg className="horizon-strip" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,60 C300,10 900,10 1200,60 L1200,60 L0,60 Z" fill="#FBF8F1" /></svg>
      </section>

      <section id="about">
        <div className="wrap about-grid">
          <div>
            <p className="eyebrow">Who we are</p>
            <h2>One school, three campuses, the same sunrise.</h2>
            <p style={{ marginTop: 16, color: '#454a40' }}>However close you live, Rise and Shine gives your child the same warm classrooms, the same trained teachers, and the same daily rhythm of learning and play — because every branch answers to one school, one proprietor, and one set of standards.</p>
            <div className="portal-badges" style={{ marginTop: 22 }}>
              <span className="badge">Nursery</span><span className="badge">Primary 1 – 6</span><span className="badge">After-school Care</span>
            </div>
          </div>
          <div>
            <div className="about-card"><h3>Our Mission</h3><p>To raise confident, well-rounded children through a nurturing, disciplined, and joyful learning environment — across every branch, without exception.</p></div>
            <div className="about-card"><h3>Our Promise to Parents</h3><p>A safe, clean, well-staffed classroom; a head teacher who knows your child by name; and clear, honest communication — including on school fees and payments.</p></div>
            <div className="about-card"><h3>Our Vision</h3><p>To be the most trusted name in early childhood and primary education in every community we serve.</p></div>
          </div>
        </div>
      </section>

      <section className="tint">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Why families choose us</p>
            <h2>Built around the child, run like a school should be.</h2>
          </div>
          <div className="features">
            <div className="feature"><div className="icon">🧸</div><h3>Nursery-first care</h3><p>Gentle, play-based routines for our youngest learners, led by dedicated nursery staff.</p></div>
            <div className="feature"><div className="icon">📘</div><h3>Structured Primary</h3><p>A consistent Primary 1–6 curriculum delivered the same way at every branch.</p></div>
            <div className="feature"><div className="icon">🚌</div><h3>Safe daily transport</h3><p>Supervised pick-up and drop-off available across all three branches.</p></div>
            <div className="feature"><div className="icon">🧾</div><h3>Transparent records</h3><p>Every pupil&apos;s fees and payments are tracked internally by school leadership.</p></div>
          </div>
        </div>
      </section>

      <section id="branches">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Find us</p>
            <h2>Our Three Branches</h2>
            <p>One school. Three doors. Update the details below with each branch&apos;s real address, phone line, and head teacher.</p>
          </div>
          <div className="branches">
            {['AGIP', 'LOGPOM', 'IPD'].map((label) => (
                <div className="branch-card" key={label}>
                  <div className="branch-top"><p className="eyebrow">Branch</p><h3>Rise and Shine — {label}</h3></div>
                <div className="branch-body">
                  <div className="branch-row">📍 <span><b>Address:</b> [Street, Neighbourhood, City]</span></div>
                  <div className="branch-row">📞 <span><b>Tel:</b> [Branch phone]</span></div>
                  <div className="branch-row">👤 <span><b>Head Teacher:</b> [Name]</span></div>
                  <div className="branch-cta"><a href="#contact">Contact this branch</a></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="academics" className="tint">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">What we teach</p>
            <h2>Academics, the same way at every branch</h2>
          </div>
          <div className="academics">
            <div className="prog-card"><p className="eyebrow">Ages 2 – 5</p><h3>Nursery</h3><p>Play-based foundations in language, numbers, and social skills.</p><ul><li>Phonics &amp; early literacy</li><li>Number sense &amp; play</li><li>Motor skills &amp; creative arts</li></ul></div>
            <div className="prog-card"><p className="eyebrow">Primary 1 – 3</p><h3>Lower Primary</h3><p>Building strong reading, writing, and reasoning habits.</p><ul><li>English &amp; French literacy</li><li>Mathematics fundamentals</li><li>Science &amp; discovery</li></ul></div>
            <div className="prog-card"><p className="eyebrow">Primary 4 – 6</p><h3>Upper Primary</h3><p>Preparing confident, exam-ready learners for secondary school.</p><ul><li>Common Entrance preparation</li><li>ICT &amp; project work</li><li>Leadership &amp; clubs</li></ul></div>
          </div>
        </div>
      </section>

      <section id="admissions">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Joining us</p>
            <h2>Admission in four simple steps</h2>
          </div>
          <div className="steps">
            <div className="step"><div className="step-num">1</div><h3>Enquire</h3><p>Call or visit your nearest branch to check space availability.</p></div>
            <div className="step"><div className="step-num">2</div><h3>Tour &amp; Assess</h3><p>Visit the branch and meet the head teacher for a short pupil assessment.</p></div>
            <div className="step"><div className="step-num">3</div><h3>Register</h3><p>Submit documents and complete registration with the head teacher.</p></div>
            <div className="step"><div className="step-num">4</div><h3>Resume</h3><p>Your child joins their class and settles in with our welcome week.</p></div>
          </div>
        </div>
      </section>

      <section className="tint">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Parents say</p>
            <h2>Trusted across every branch</h2>
          </div>
          <div className="testi-grid">
            <div className="testi"><p className="quote">&quot;My daughter moved branches when we relocated, and nothing changed for her — same routines, same warmth.&quot;</p><div className="who"><div className="dot">A</div><div><b>A parent</b><span>Primary 2</span></div></div></div>
            <div className="testi"><p className="quote">&quot;The head teacher always knows exactly where my son stands — academically and with his fees.&quot;</p><div className="who"><div className="dot">M</div><div><b>A parent</b><span>Nursery</span></div></div></div>
            <div className="testi"><p className="quote">&quot;What I appreciate most is how organised everything is, from the classroom to the office.&quot;</p><div className="who"><div className="dot">E</div><div><b>A parent</b><span>Primary 5</span></div></div></div>
          </div>
        </div>
      </section>

      <section id="gallery">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">A look inside</p>
            <h2>Life at Rise and Shine</h2>
          </div>
          <div className="gallery-grid">
            <div className="g1">Classroom moments</div>
            <div className="g2">Nursery play</div>
            <div className="g3">Sports day</div>
            <div className="g4">Assembly</div>
            <div className="g5">Graduation day</div>
          </div>
        </div>
      </section>

      <section className="tint" id="contact">
        <div className="wrap contact-grid">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2 style={{ margin: '10px 0 20px' }}>Send us a message</h2>
            <div className="field"><label>Full name</label><input type="text" placeholder="Your name" /></div>
            <div className="field"><label>Branch of interest</label>
              <select><option>AGIP</option><option>LOGPOM</option><option>IPD</option><option>Not sure yet</option></select>
            </div>
            <div className="field"><label>Phone number</label><input type="text" placeholder="6XX XXX XXX" /></div>
            <div className="field"><label>Message</label><textarea placeholder="Tell us about your child and what you need"></textarea></div>
            <button className="btn btn-forest" type="button">Send Message</button>
          </div>
          <div className="contact-info">
            <p className="eyebrow">Head Office</p>
            <div className="row"><div className="ic">☎️</div><div><h3>Call us</h3><p>677 612 198</p></div></div>
            <div className="row"><div className="ic">📍</div><div><h3>Branches</h3><p>Three branches — see full addresses above.</p></div></div>
            <div className="row"><div className="ic">✉️</div><div><h3>Email</h3><p>info@riseandshineschool.com</p></div></div>
            <div className="row"><div className="ic">🕐</div><div><h3>Office hours</h3><p>Monday – Friday, 7:30am – 4:30pm</p></div></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="portal-teaser">
            <div>
              <p className="eyebrow" style={{ color: 'var(--gold)' }}>For staff only</p>
              <h2>Head teachers &amp; the proprietor sign in here.</h2>
              <p>Head teachers record each pupil&apos;s payments per branch. Only the proprietor can view every branch and edit any record. Parents do not pay through this portal — it is a private record system, not a payment gateway.</p>
              <div className="portal-badges">
                <span className="badge">Role-based access</span><span className="badge">Per-branch records</span><span className="badge">Proprietor oversight</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a className="btn btn-gold" href="/portal/login">Open Staff Portal</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <div className="brand-mark"><svg width="22" height="22" viewBox="0 0 100 100"><circle cx="50" cy="40" r="18" fill="#F5B400" /><polygon points="10,58 90,58 50,92" fill="#fff" /></svg></div>
              <div className="brand-name" style={{ color: '#fff' }}>RISE AND SHINE</div>
            </div>
            <p style={{ fontSize: '0.86rem', maxWidth: '32ch' }}>Nursery and Primary School — where every child can shine, across three branches.</p>
          </div>
          <div><h4>Explore</h4><ul>
            <li><a href="#about">About</a></li><li><a href="#branches">Our Branches</a></li><li><a href="#academics">Academics</a></li><li><a href="#admissions">Admissions</a></li>
          </ul></div>
          <div><h4>School</h4><ul>
            <li><a href="#gallery">Gallery</a></li><li><a href="#contact">Contact</a></li><li><a href="/portal/login">Staff Portal</a></li>
          </ul></div>
          <div><h4>Contact</h4><ul>
            <li>677 612 198</li><li>info@riseandshineschool.com</li>
          </ul></div>
        </div>
        <div className="wrap footer-bottom">
          <span>© 2026 Rise and Shine Nursery and Primary School. All rights reserved.</span>
          <span>Where every child can shine.</span>
        </div>
      </footer>
    </>
  );
}
