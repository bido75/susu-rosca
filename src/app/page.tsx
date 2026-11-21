import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SusuFlow — Better Circles. Bigger Goals.',
  description:
    'SusuFlow helps trusted communities organize rotating savings circles, track contributions and follow transparent payout schedules.',
};

const style = `
*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}h1,h2,h3,p{margin-top:0}button,input{font:inherit}a{color:inherit}svg{display:inline-block;vertical-align:middle;flex-shrink:0}details summary{cursor:pointer}
.landing-root{background:#fff;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
.landing-root a{text-decoration:none}.landing-container{width:min(1180px,calc(100% - 48px));margin-inline:auto}.landing-header{height:84px;background:#fff;border-bottom:1px solid #eef2f4;position:relative;z-index:40}.nav-inner{height:100%;display:flex;align-items:center;justify-content:space-between}.brand-mark{width:41px;height:41px;display:inline-flex;align-items:center;justify-content:center;border-radius:13px;background:#059669;color:white;box-shadow:0 8px 17px #05966928}.desktop-nav{display:flex;gap:33px;align-items:center}.desktop-nav a,.nav-signin{font-size:13px;font-weight:650;color:#475569}.desktop-nav a:hover,.nav-signin:hover{color:#059669}.desktop-nav-actions{display:flex;gap:26px;align-items:center}.landing-button{display:inline-flex;align-items:center;justify-content:center;gap:14px;border-radius:12px;padding:14px 22px;font-size:13px;font-weight:800;transition:transform .2s,background .2s,box-shadow .2s;white-space:nowrap}.landing-button:hover{transform:translateY(-2px)}.landing-button-primary{color:white;background:#059669;box-shadow:0 12px 23px #0596692b}.landing-button-primary:hover{background:#047857;box-shadow:0 14px 26px #05966940}.landing-button-light{background:white;color:#065f46;box-shadow:0 9px 20px #022c2228}.mobile-menu{display:none;position:relative}.mobile-menu summary{cursor:pointer;list-style:none;padding:10px}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu-panel{position:absolute;right:0;top:48px;min-width:250px;padding:13px;background:white;border:1px solid #e2e8f0;box-shadow:0 20px 40px #0f172a20;border-radius:15px;display:flex;flex-direction:column;gap:4px}.mobile-menu-panel a{padding:12px;font-weight:650;font-size:14px;color:#0f172a;border-radius:8px;display:flex;gap:8px;align-items:center}.mobile-menu-panel a:last-child{color:#047857;background:#ecfdf5}
.hero-section{position:relative;background:radial-gradient(circle at 85% 34%,#d1fae5 0,transparent 36%),linear-gradient(110deg,#f8fffc 0%,#f2fbf6 43%,#edf9f2 100%)}.hero-layout{min-height:654px;display:grid;grid-template-columns:48% 52%;align-items:center;gap:16px;padding-top:50px;padding-bottom:66px}.hero-copy{position:relative;z-index:4;max-width:595px}.eyebrow{display:inline-flex;align-items:center;gap:10px;font-weight:850;letter-spacing:1.35px;font-size:10px;color:#047857;background:#e4f9ee;border:1px solid #bcebd3;padding:10px 15px;border-radius:30px}.eyebrow-dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 4px #10b98119}.hero-copy h1{font-size:clamp(49px,5.4vw,76px);line-height:1.04;letter-spacing:-.072em;font-weight:850;margin:23px 0 22px;max-width:650px}.hero-copy h1 em{font-style:normal;color:#059669}.hero-subtitle{font-size:16px;color:#526777;line-height:1.85;max-width:490px}.hero-ctas{display:flex;align-items:center;gap:25px;margin-top:33px}.hero-secondary{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:800;color:#164e3d}.secondary-arrow{display:grid;place-items:center;border:1px solid #b2d9c6;width:31px;height:31px;border-radius:100%}.hero-proof{display:flex;align-items:center;gap:11px;margin-top:40px;color:#527063;font-size:11px;font-weight:650}.proof-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;color:#059669;background:#e0f5e9}.hero-proof span{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.hero-proof i{width:3px;height:3px;background:#6b9785;border-radius:50%}.hero-bottom-line{position:absolute;bottom:0;height:1px;width:100%;background:#dcf4e6}
.hero-visual{height:555px;position:relative;display:flex;align-items:center;justify-content:center;min-width:0}.hero-grid-glow{position:absolute;inset:12% 0 0 7%;background-image:radial-gradient(#6dbd9d55 .9px,transparent 1px);background-size:20px 20px;mask-image:radial-gradient(ellipse,black 30%,transparent 70%)}.mock-dashboard{position:relative;z-index:2;transform:rotate(-3deg);width:min(100%,520px);border-radius:20px;border:1px solid #e3f0e9;background:#fff;padding:22px 24px 20px;box-shadow:0 45px 90px #115a3923,0 10px 25px #164e3d0f}.mock-topline{display:flex;align-items:center;gap:8px;padding-bottom:18px;border-bottom:1px solid #eff4f2;font-size:12px;letter-spacing:-.02em}.mock-icon{display:grid;place-items:center;color:white;background:#059669;width:26px;height:26px;border-radius:8px}.mock-live{margin-left:auto;color:#64748b;font-size:10px;display:flex;align-items:center;gap:5px}.mock-live span{height:6px;width:6px;border-radius:50%;background:#10b981}.mock-heading{display:flex;align-items:center;justify-content:space-between;margin-top:23px}.mock-heading small{font-size:9px;letter-spacing:1.3px;font-weight:850;color:#059669}.mock-heading h3{font-size:21px;font-weight:850;letter-spacing:-.05em;margin-top:4px}.mock-avatars{display:flex;padding-left:8px}.mock-avatars i{display:grid;place-items:center;background:#fdecc9;border:2px solid white;margin-left:-8px;width:30px;height:30px;border-radius:50%;font-size:9px;font-weight:800;color:#775a1c;font-style:normal}.mock-avatars i:nth-child(2){background:#d9e9f3;color:#33647d}.mock-avatars i:nth-child(3){background:#e0d7ff;color:#6251a4}.mock-avatars i:nth-child(4){background:#e7f3ec;color:#237955}.mock-metrics{display:grid;grid-template-columns:1.12fr .88fr;gap:12px;margin-top:22px}.mock-metrics>div{padding:17px;border-radius:13px;background:#f5faf8;border:1px solid #e7f0e9}.mock-metrics>div:first-child{background:#056747;color:white;border-color:#056747}.mock-metrics small{font-size:9px;font-weight:850;letter-spacing:1.2px}.mock-metrics strong{display:block;font-size:26px;font-weight:850;margin-top:8px}.mock-metrics strong span{font-size:15px;font-weight:700}.mock-metrics .metric-note{display:flex;align-items:center;gap:5px;font-size:10px;color:#64748b;margin-top:7px}.mock-metrics>div:first-child .metric-note{color:#d4f3e3}.metric-suffix{font-size:15px;color:#94a3b8}.mock-progress-head{display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-top:19px;font-weight:700}.mock-progress-head strong{color:#059669}.mock-progress{height:7px;background:#e9f2ec;border-radius:4px;margin-top:8px;overflow:hidden}.mock-progress span{display:block;height:100%;width:75%;background:linear-gradient(90deg,#059669,#10b981);border-radius:4px}.mock-members-title{display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:1.2px;font-weight:850;color:#64748b;margin-top:21px}.mock-members-title span{color:#059669;letter-spacing:0;font-weight:800}
.floating-pill{position:absolute;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 16px 35px #0f172a14;z-index:3}.floating-pill strong{display:block;font-size:11px;font-weight:800;color:#0f172a}.floating-pill small{display:block;font-size:9px;color:#64748b;margin-top:2px}.floating-check{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#e6f8ee;color:#059669}.floating-pill-left{top:76px;left:-18px}.floating-pill-right{bottom:88px;right:-10px}
.value-strip{background:#fff;border-bottom:1px solid #edf2f0}.strip-inner{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:96px}.strip-inner>span{letter-spacing:1.5px;color:#6b8074;font-size:10px;font-weight:850}.strip-inner>div{display:flex;gap:46px}.strip-inner>div span{display:flex;align-items:center;gap:10px;color:#355b4b;font-size:12px;font-weight:800}.strip-inner svg{color:#059669}.landing-section{padding:108px 0;scroll-margin-top:30px}.section-kicker{font-size:11px;letter-spacing:1.65px;font-weight:850;color:#059669}.section-heading h2,.spotlight-copy h2,.payments-layout h2,.faq-heading h2{font-size:clamp(35px,3.8vw,50px);letter-spacing:-.065em;line-height:1.15;font-weight:850;margin-top:17px}.section-heading h2 span,.spotlight-copy h2 span,.payments-layout h2 span,.faq-heading h2 span{color:#059669}.section-heading p{color:#64748b;font-size:15px;line-height:1.9}.section-heading-center{text-align:center;max-width:650px;margin:0 auto}.section-heading-center p{max-width:570px;margin:19px auto 0}.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:49px}.step-card{border:1px solid #e6eee9;border-radius:19px;background:#fff;padding:29px;position:relative;overflow:hidden;box-shadow:0 7px 27px #0f172a05;min-height:250px}.step-top{display:flex;align-items:center;justify-content:space-between}.step-icon,.feature-icon{display:grid;place-items:center;background:#e6f8ee;color:#059669;width:55px;height:55px;border-radius:15px}.step-number{font-size:32px;font-weight:850;color:#d8eae0;letter-spacing:-.06em}.step-card h3,.feature-card h3{font-size:18px;font-weight:850;letter-spacing:-.04em;margin-top:28px}.step-card p,.feature-card p{color:#64748b;font-size:13px;line-height:1.9;margin-top:10px}.step-dash{position:absolute;bottom:0;left:0;height:4px;width:76px;background:#059669;border-radius:3px}.features-section{background:#f7fbf9}.split-heading{display:flex;align-items:end;justify-content:space-between;gap:80px}.split-heading p{max-width:400px}.features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:50px}.feature-card{border:1px solid #e8f0ea;border-radius:19px;background:#fff;padding:27px;box-shadow:0 7px 27px #0f172a05}.feature-icon{background:#e6f8ee;color:#059669;width:52px;height:52px;border-radius:14px}
.spotlight-layout{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:95px}.spotlight-board{min-height:470px;background:radial-gradient(circle at 45% 50%,#116f53,#064631 70%,#053b2a);border-radius:28px;position:relative;display:grid;place-items:center;overflow:hidden}.spotlight-board:before{content:'';position:absolute;inset:24px;border:1px solid #ffffff20;border-radius:22px}.spotlight-orb{position:absolute;border:1px solid #ffffff23;border-radius:50%;width:400px;height:400px}.orbit-two{width:290px;height:290px}.spotlight-wheel{width:250px;height:250px;border-radius:50%;background:conic-gradient(#34d399 0 60deg,#0d9488 60deg 120deg,#a7f3d0 120deg 180deg,#059669 180deg 240deg,#72d9ae 240deg 300deg,#047857 300deg 360deg);box-shadow:0 17px 50px #022c2259;border:11px solid #ffffff25;display:grid;place-items:center;transform:rotate(-12deg);position:relative}.spotlight-wheel:after{content:'';position:absolute;top:-25px;left:calc(50% - 10px);border-left:10px solid transparent;border-right:10px solid transparent;border-top:19px solid #fff}.spotlight-wheel-center{width:120px;height:120px;background:#063b2b;border:5px solid #cfffe0;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:850;font-size:13px;line-height:1.35;transform:rotate(12deg);gap:5px}.spotlight-tag{position:absolute;background:white;border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:9px;color:#047857;font-size:12px;font-weight:850;box-shadow:0 17px 35px #00160d45;z-index:3}.tag-one{top:59px;right:28px}.tag-two{bottom:60px;left:26px}.spotlight-copy h2{font-size:clamp(34px,3.5vw,46px)}.spotlight-copy p,.payments-layout p,.faq-heading p{color:#64748b;line-height:1.9;font-size:14px;margin:22px 0}.spotlight-copy ul{display:grid;gap:16px;margin:23px 0 34px}.spotlight-copy li{display:flex;gap:12px;align-items:center;font-weight:700;font-size:13px;color:#334155}.spotlight-copy li svg{color:#059669}
.payments-layout{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:70px}.payments-note{display:flex;gap:12px;align-items:flex-start;background:#f2fbf6;border:1px solid #d7efe2;border-radius:14px;padding:15px;font-size:12px;color:#314e41;line-height:1.7;margin-top:26px}.payments-note svg{color:#059669;flex-shrink:0}.payment-methods{display:grid;gap:13px}.payment-method{display:flex;align-items:center;gap:14px;border:1px solid #e8f0ea;border-radius:16px;padding:17px;background:#fff}.payment-method-icon{display:grid;place-items:center;background:#e6f8ee;color:#059669;width:44px;height:44px;border-radius:12px}.payment-method strong{display:block;font-size:13px;font-weight:800;color:#0f172a}.payment-method small{display:block;font-size:11px;color:#64748b;margin-top:3px}.payment-method svg:last-child{margin-left:auto;color:#059669}
.faq-layout{display:grid;grid-template-columns:.85fr 1.15fr;gap:90px;align-items:start}.faq-items{display:grid;gap:12px}.faq-item{border:1px solid #e6eee9;border-radius:16px;background:#fff;padding:19px 22px}.faq-item summary{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:14px;color:#0f172a;gap:20px}.faq-plus{font-size:22px;font-weight:500;color:#059669;line-height:1}.faq-item[open] .faq-plus{transform:rotate(45deg)}.faq-item p{color:#64748b;font-size:13px;line-height:1.85;margin-top:14px}
.final-cta{padding-bottom:108px}.cta-box{position:relative;overflow:hidden;background:radial-gradient(circle at 80% 20%,#10b981,#047857 45%,#064e3b);border-radius:26px;min-height:370px;display:grid;place-items:center}.cta-deco{position:absolute;border-radius:50%;border:1px solid #ffffff25}.cta-deco-one{width:320px;height:320px;top:-120px;right:-80px}.cta-deco-two{width:190px;height:190px;bottom:-60px;left:-40px}.cta-content{text-align:center;color:white;position:relative;z-index:2;padding:40px 24px}.cta-content>span{font-size:10px;letter-spacing:1.7px;font-weight:850;color:#a7f3d0}.cta-content h2{font-size:clamp(34px,3.8vw,50px);letter-spacing:-.06em;line-height:1.12;font-weight:850;margin-top:16px}.cta-content p{color:#d1fae5;font-size:14px;margin-top:16px}
.landing-footer{background:#f7fbf9;border-top:1px solid #e6eee9;padding:60px 0 40px}.footer-top{display:flex;align-items:flex-start;justify-content:space-between;gap:30px}.footer-top p{color:#64748b;font-size:13px;line-height:1.7;max-width:280px;margin-top:16px}.footer-top>div{display:flex;gap:26px}.footer-top>div a{font-size:13px;font-weight:700;color:#475569}.footer-top>div a:hover{color:#059669}.footer-bottom{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:48px;padding-top:24px;border-top:1px solid #e6eee9;font-size:12px;color:#64748b}
@media(max-width:1050px){.desktop-nav{gap:18px}.hero-layout{grid-template-columns:49% 51%}.hero-copy h1{font-size:54px}.hero-visual{transform:scale(.88);transform-origin:center left}.floating-pill-left{left:-10px}.spotlight-layout,.payments-layout{gap:45px}.mock-dashboard{min-width:420px}}
@media(max-width:800px){.desktop-nav,.desktop-nav-actions{display:none}.mobile-menu{display:block}.landing-header{height:70px}.hero-layout{grid-template-columns:1fr;padding-top:65px;padding-bottom:40px}.hero-copy{max-width:620px}.hero-copy h1{font-size:clamp(51px,8vw,70px);max-width:650px}.hero-visual{transform:none;height:580px;max-width:590px;width:100%;margin:0 auto}.mock-dashboard{min-width:0}.floating-pill-left{left:0}.floating-pill-right{right:0}.strip-inner{flex-direction:column;align-items:flex-start;justify-content:center;padding:22px 0}.strip-inner>div{gap:24px;flex-wrap:wrap}.landing-section{padding:80px 0}.steps-grid{gap:15px}.step-card{padding:20px}.features-grid{grid-template-columns:repeat(2,1fr)}.spotlight-layout,.payments-layout,.faq-layout{grid-template-columns:1fr;gap:45px}.spotlight-board{max-width:580px;width:100%;margin:0 auto}.footer-top{flex-wrap:wrap}}
@media(max-width:560px){.landing-container{width:min(100% - 34px,1180px)}.hero-layout{padding-top:45px}.hero-copy h1{font-size:clamp(45px,11.2vw,61px)}.hero-subtitle{font-size:14px;line-height:1.8}.hero-ctas{flex-wrap:wrap;gap:18px}.hero-proof{margin-top:26px;line-height:1.5}.hero-visual{height:390px;margin-top:20px}.mock-dashboard{transform:rotate(-2deg) scale(.80);transform-origin:center center;width:490px;min-width:490px}.floating-pill{transform:scale(.72);transform-origin:center}.floating-pill-left{top:-7px;left:-19px}.floating-pill-right{bottom:-7px;right:-18px}.value-strip{display:none}.landing-section{padding:72px 0}.section-heading h2,.spotlight-copy h2,.payments-layout h2,.faq-heading h2{font-size:36px}.steps-grid,.features-grid{grid-template-columns:1fr;gap:15px;margin-top:32px}.step-card{min-height:210px;padding:24px}.step-card h3{margin-top:22px}.split-heading{display:block}.split-heading p{margin-top:15px}.feature-card{min-height:0}.spotlight-board{min-height:360px}.spotlight-wheel{transform:rotate(-12deg) scale(.8)}.tag-one{top:28px;right:13px}.tag-two{bottom:25px;left:13px}.payment-method{padding:15px}.payment-method strong{font-size:12px}.footer-top{flex-direction:column;align-items:flex-start}.footer-top>div{flex-wrap:wrap}.footer-bottom{flex-direction:column;align-items:flex-start}.footer-bottom span:last-child{text-align:left}.cta-box{min-height:320px}.cta-content h2{font-size:35px}}
@media(max-width:390px){.hero-visual{height:355px}.mock-dashboard{transform:rotate(-2deg) scale(.69)}.hero-copy h1{font-size:45px}}
@media(prefers-reduced-motion:reduce){.landing-root *,.landing-root *::before,.landing-root *::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

const I = {
  refresh: 'M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4',
  arrow: 'M5 12h14m-7-7 7 7-7 7',
  arrowUpRight: 'M7 17 17 7M8 7h9v9',
  check: 'm5 12 4 4L19 6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  checkShield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M11 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M15 7a4 4 0 0 0 0 8',
  dollar: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  banknote: 'M3 8v9M19 8v9M3 12h18M6 6v12M18 6v12',
  phone: 'M3 5a2 2 0 0 1 2-2h2a1 1 0 0 1 1 .8l1 4a1 1 0 0 1-.5 1.1L6.8 9a12 12 0 0 0 8.2 8.2l.1-1.7a1 1 0 0 1 1.1-.5l4 1a1 1 0 0 1 .8 1v2a2 2 0 0 1-2 2h-1A17 17 0 0 1 3 6V5z',
};

function Icon({ d, size = 18, stroke = 2 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : 'M') + seg} />)}
    </svg>
  );
}

export default function Landing() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div className="landing-root">
        <header className="landing-header">
          <div className="landing-container nav-inner">
            <a href="/" aria-label="SusuFlow home">
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="brand-mark"><Icon d={I.refresh} size={22} /></span>
                <strong style={{ fontSize: 23, letterSpacing: '-1.2px' }}>Susu<span style={{ color: '#059669' }}>Flow</span></strong>
              </span>
            </a>
            <nav className="desktop-nav" aria-label="Main navigation">
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#why-susuflow">Why SusuFlow</a>
              <a href="#faq">FAQs</a>
            </nav>
            <div className="desktop-nav-actions">
              <a href="/login" className="nav-signin">Sign in</a>
              <a href="/login" className="landing-button landing-button-primary">Get started <Icon d={I.arrow} /></a>
            </div>
            <details className="mobile-menu">
              <summary aria-label="Open navigation menu"><Icon d="M4 6h16M4 12h16M4 18h16" size={23} /></summary>
              <div className="mobile-menu-panel">
                <a href="#how-it-works">How it works</a>
                <a href="#features">Features</a>
                <a href="#why-susuflow">Why SusuFlow</a>
                <a href="#faq">FAQs</a>
                <a href="/login">Sign in / Get started <Icon d={I.arrow} size={16} /></a>
              </div>
            </details>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="hero-section">
            <div className="landing-container hero-layout">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-dot"></span>THE SMARTER WAY TO SAVE TOGETHER <Icon d={I.arrowUpRight} size={14} /></div>
                <h1>Big goals start with <em>better circles.</em></h1>
                <p className="hero-subtitle">Bring your community savings circle into the digital age. Organize contributions, track every turn, and move toward shared goals with clarity and confidence.</p>
                <div className="hero-ctas">
                  <a href="/login" className="landing-button landing-button-primary">Start a savings circle <Icon d={I.arrow} /></a>
                  <a href="#how-it-works" className="hero-secondary">See how it works <span className="secondary-arrow"><Icon d={I.arrowUpRight} size={17} /></span></a>
                </div>
                <div className="hero-proof">
                  <div className="proof-icon"><Icon d={I.checkShield} /></div>
                  <span>Interest-free by design <i></i> Clear records <i></i> Built around trust</span>
                </div>
              </div>
              <div className="hero-visual" aria-label="Illustrative SusuFlow circle dashboard">
                <div className="hero-grid-glow"></div>
                <div className="floating-pill floating-pill-left">
                  <span className="floating-check"><Icon d={I.check} size={15} /></span>
                  <span><strong>Contribution verified</strong><small>Payment status updated</small></span>
                </div>
                <div className="mock-dashboard">
                  <div className="mock-topline"><span className="mock-icon"><Icon d={I.refresh} size={15} /></span><strong>SusuFlow</strong><span className="mock-live"><span></span> Circle overview</span></div>
                  <div className="mock-heading">
                    <div><small>FAMILY &amp; FRIENDS</small><h3>Your circle, at a glance.</h3></div>
                    <span className="mock-avatars"><i>A</i><i>M</i><i>E</i><i>+3</i></span>
                  </div>
                  <div className="mock-metrics">
                    <div><small>TOTAL CIRCLE POT</small><strong>$3,000<span>.00</span></strong><span className="metric-note"><Icon d={I.check} size={12} /> Six members · $500 each</span></div>
                    <div><small>CURRENT ROTATION</small><strong>03 <span className="metric-suffix">/ 06</span></strong><span className="metric-note">Monthly savings circle</span></div>
                  </div>
                  <div className="mock-progress-head"><span>Contribution progress</span><strong>75%</strong></div>
                  <div className="mock-progress"><span></span></div>
                  <div className="mock-members-title">PAYOUT ROTATION <span>VIEW ALL <Icon d={I.arrowUpRight} size={11} /></span></div>
                </div>
                <div className="floating-pill floating-pill-right">
                  <span className="floating-check"><Icon d={I.users} size={15} /></span>
                  <span><strong>6 active members</strong><small>Everyone on track</small></span>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE STRIP */}
          <section className="value-strip">
            <div className="landing-container strip-inner">
              <span>YOUR CIRCLE. YOUR RULES. YOUR MOMENTUM.</span>
              <div>
                <span><Icon d={I.users} size={20} /> Community-first</span>
                <span><Icon d={I.checkShield} size={20} /> Transparent records</span>
                <span><Icon d={I.refresh} size={20} /> Simple rotations</span>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="landing-section steps-section" id="how-it-works">
            <div className="landing-container">
              <div className="section-heading section-heading-center">
                <span className="section-kicker">THE SUSU WAY, SIMPLIFIED</span>
                <h2>A familiar tradition.<br /><span>A better way to organize.</span></h2>
                <p>SusuFlow brings structure and visibility to the savings practice you already know, without losing the power of community.</p>
              </div>
              <div className="steps-grid">
                <article className="step-card"><div className="step-top"><span className="step-icon"><Icon d={I.users} size={25} /></span><span className="step-number">01</span></div><h3>Create your circle</h3><p>Set your contribution amount, choose a schedule, and invite people you know and trust.</p><div className="step-dash"></div></article>
                <article className="step-card"><div className="step-top"><span className="step-icon"><Icon d={I.refresh} size={25} /></span><span className="step-number">02</span></div><h3>Contribute together</h3><p>Everyone contributes the agreed amount each cycle. Track submissions and confirmations in one shared place.</p><div className="step-dash"></div></article>
                <article className="step-card"><div className="step-top"><span className="step-icon"><Icon d={I.banknote} size={25} /></span><span className="step-number">03</span></div><h3>Take turns receiving</h3><p>Follow a transparent payout order so each member receives the pooled amount once per rotation.</p><div className="step-dash"></div></article>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="landing-section features-section" id="features">
            <div className="landing-container">
              <div className="section-heading split-heading">
                <div><span className="section-kicker">EVERYTHING IN ONE PLACE</span><h2>Less chasing payments.<br /><span>More building together.</span></h2></div>
                <p>From your first invitation to the final payout, keep your circle organized with thoughtful tools designed for real people.</p>
              </div>
              <div className="features-grid">
                <article className="feature-card"><div className="feature-icon"><Icon d={I.dollar} size={25} /></div><h3>Clear contribution tracking</h3><p>See who has submitted, what has been verified, and what is still outstanding.</p></article>
                <article className="feature-card"><div className="feature-icon"><Icon d={I.refresh} size={25} /></div><h3>Transparent payout rotation</h3><p>Use a visual payout wheel and a shared schedule so everyone knows whose turn comes next.</p></article>
                <article className="feature-card"><div className="feature-icon"><Icon d={I.checkShield} size={25} /></div><h3>Accountable circle records</h3><p>Keep an activity history of contributions, payout confirmations, and important circle changes.</p></article>
                <article className="feature-card"><div className="feature-icon"><Icon d={I.users} size={25} /></div><h3>Built for real communities</h3><p>Invite the people you already trust and keep every member on the same page.</p></article>
              </div>
            </div>
          </section>

          {/* WHY SUSUFLOW */}
          <section className="landing-section spotlight-section" id="why-susuflow">
            <div className="landing-container spotlight-layout">
              <div className="spotlight-board">
                <div className="spotlight-orb orbit-one"></div>
                <div className="spotlight-orb orbit-two"></div>
                <div className="spotlight-wheel"><div className="spotlight-wheel-center"><Icon d={I.refresh} size={29} /><span>One circle.<br />Every turn.</span></div></div>
                <div className="spotlight-tag tag-one"><Icon d={I.check} size={17} /> Fair rotation</div>
                <div className="spotlight-tag tag-two"><Icon d={I.users} size={17} /> Shared progress</div>
              </div>
              <div className="spotlight-copy">
                <span className="section-kicker">ROOTED IN COMMUNITY</span>
                <h2>Saving together is powerful. <span>Knowing where things stand is even better.</span></h2>
                <p>Traditional Susu works because people show up for one another. SusuFlow adds the organization that helps your group stay on the same page.</p>
                <ul>
                  <li><Icon d={I.check} /> Everyone can see the payout schedule</li>
                  <li><Icon d={I.check} /> Members can follow contribution status</li>
                  <li><Icon d={I.check} /> One clear record for every rotation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* PAYMENTS */}
          <section className="landing-section payments-section">
            <div className="landing-container payments-layout">
              <div>
                <span className="section-kicker">FLEXIBLE BY DESIGN</span>
                <h2>Use the payment methods <span>your group already knows.</span></h2>
                <p>Start with ledger-mode tracking for contributions made outside the platform. Your organizer can confirm receipt, while everyone can follow the circle&apos;s progress.</p>
                <div className="payments-note"><Icon d={I.checkShield} /><span>SusuFlow currently records external payments; it does not process Zelle, ACH, Venmo, or cash transfers itself.</span></div>
              </div>
              <div className="payment-methods">
                <div className="payment-method"><span className="payment-method-icon"><Icon d={I.phone} size={22} /></span><span><strong>Zelle &amp; bank apps</strong><small>Record an external transfer</small></span><Icon d={I.check} size={20} /></div>
                <div className="payment-method"><span className="payment-method-icon"><Icon d={I.banknote} size={22} /></span><span><strong>Cash &amp; other methods</strong><small>Keep an organized payment record</small></span><Icon d={I.check} size={20} /></div>
                <div className="payment-method"><span className="payment-method-icon"><Icon d={I.dollar} size={22} /></span><span><strong>Organizer confirmation</strong><small>Receipt verified outside the platform</small></span><Icon d={I.check} size={20} /></div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="landing-section faq-section" id="faq">
            <div className="landing-container faq-layout">
              <div className="faq-heading"><span className="section-kicker">GOOD TO KNOW</span><h2>Questions? <span>We have answers.</span></h2><p>Get the essentials before you start your next savings circle.</p></div>
              <div className="faq-items">
                <details className="faq-item" open><summary>What is a Susu?<span className="faq-plus">+</span></summary><p>A Susu is a rotating savings circle. Members contribute an agreed amount on a regular schedule, and one member receives the pooled amount each cycle until everyone has had a turn.</p></details>
                <details className="faq-item"><summary>Does SusuFlow hold or transfer my money?<span className="faq-plus">+</span></summary><p>The current SusuFlow beta helps organize circles and track payments made outside the platform. It does not hold funds, debit bank accounts, or execute payouts. Automated payment capabilities are planned, not active.</p></details>
                <details className="faq-item"><summary>Can we use Zelle, Venmo, or cash?<span className="faq-plus">+</span></summary><p>Yes. In ledger mode, members can record payments made through their preferred external methods, and an authorized organizer can confirm receipt. Recording a payment is not the same as processing it.</p></details>
                <details className="faq-item"><summary>How are payout turns decided?<span className="faq-plus">+</span></summary><p>A circle can use its agreed payout order or a randomized assignment workflow. Members can view their positions and future payout schedule.</p></details>
                <details className="faq-item"><summary>Is SusuFlow a bank or a savings account?<span className="faq-plus">+</span></summary><p>No. SusuFlow is a circle-coordination platform, not a bank, insured deposit account, lender, or guarantee of repayment. Every circle involves financial and counterparty risk.</p></details>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="final-cta">
            <div className="landing-container">
              <div className="cta-box">
                <div className="cta-deco cta-deco-one"></div>
                <div className="cta-deco cta-deco-two"></div>
                <div className="cta-content">
                  <span>START SOMETHING GOOD TOGETHER</span>
                  <h2>More than saving.<br />It&apos;s moving forward, together.</h2>
                  <p>Your next circle starts with a simple invitation.</p>
                  <a href="/login" className="landing-button landing-button-light">Get started with SusuFlow <Icon d={I.arrow} /></a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="landing-container footer-top">
            <a href="/"><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="brand-mark"><Icon d={I.refresh} size={22} /></span><strong style={{ fontSize: 23, letterSpacing: '-1.2px' }}>Susu<span style={{ color: '#059669' }}>Flow</span></strong></span></a>
            <p>Make every contribution count. Community savings, organized with clarity.</p>
            <div><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#faq">FAQs</a><a href="/login">Sign in</a></div>
          </div>
          <div className="landing-container footer-bottom">
            <span>© 2026 SusuFlow. All rights reserved.</span>
            <span>SusuFlow is not a bank, lender, or insured deposit service. Savings circles involve financial risk.</span>
          </div>
        </footer>
      </div>
    </>
  );
}