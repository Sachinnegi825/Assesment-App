import BrandMark from './BrandMark'

const footerLinks = [
  {
    href: 'https://sidlabs.net/',
    label: 'Home',
  },
  {
    href: 'https://www.sidlabs.net/careers/',
    label: 'Careers',
  },
  {
    href: 'https://sidlabs.net/founders-essentials/',
    label: 'Founder’s Essentials',
  },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <BrandMark />
          <p className="site-footer__summary">
            SidLabs builds AI-powered MVPs, research systems, and founder-first
            product experiences with a lightweight, execution-focused approach.
          </p>
        </div>

        <div className="site-footer__grid">
          <section className="site-footer__section">
            <p className="site-footer__title">Quick Links</p>
            <div className="site-footer__links">
              {footerLinks.map((item) => (
                <a
                  className="site-footer__link"
                  href={item.href}
                  key={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>

          <section className="site-footer__section">
            <p className="site-footer__title">Get In Touch</p>
            <div className="site-footer__contact">
              <a className="site-footer__link" href="mailto:connect@sidlabs.net">
                connect@sidlabs.net
              </a>
              <a className="site-footer__link" href="https://wa.me/919805737808">
                +91 9805737808 (WhatsApp only)
              </a>
              <p>
                2-A/3 S/F, Front Side,
                <br />
                Asaf Ali Rd, Turkman Gate,
                <br />
                New Delhi, 110002, India
              </p>
            </div>
          </section>
        </div>

        <div className="site-footer__legal">
          <p>© 2026 SidLabs LLP. All rights reserved.</p>
          <p>Built for research, applicant screening, and evaluator workflows.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
