const router = require('express').Router();

const frontendUrl = () =>
  (process.env.FRONTEND_URL || '').replace(/\/$/, '');

// Home
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend home page',
    redirect: `${frontendUrl()}/index.html`
  });
});

// Land / promo
router.get('/land', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend land page',
    redirect: `${frontendUrl()}/land.html`
  });
});

// Demo high-low
router.get('/demo-high-low', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend demo high-low page',
    redirect: `${frontendUrl()}/demo-high-low.html`
  });
});

// Market (mapped to achievements in original)
router.get('/market', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend market / achievements page',
    redirect: `${frontendUrl()}/achievements.html`
  });
});

// High-low
router.get('/high-low', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend high-low page',
    redirect: `${frontendUrl()}/high-low.html`
  });
});

// Achievements
router.get('/achievements', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend achievements page',
    redirect: `${frontendUrl()}/achievements.html`
  });
});

// Applications
router.get('/applications', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend applications page',
    redirect: `${frontendUrl()}/applications.html`
  });
});

// Platform guide
router.get('/platform-guide', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend platform guide page',
    redirect: `${frontendUrl()}/platform-guide.html`
  });
});

// Password recovery (was incorrectly registered as another '/')
router.get('/password-recovery', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend password recovery page',
    redirect: `${frontendUrl()}/password-recovery.html`
  });
});

// Support
router.get('/support', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend support page',
    redirect: `${frontendUrl()}/support.html`
  });
});

// Responsibility disclosure
router.get('/responsibility-disclosure', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend responsibility disclosure page',
    redirect: `${frontendUrl()}/responsibility-disclosure.html`
  });
});

// Quick start
router.get('/quick-start', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend quick start page',
    redirect: `${frontendUrl()}/quick-start.html`
  });
});

// About us
router.get('/about-us', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend about us page',
    redirect: `${frontendUrl()}/about-us.html`
  });
});

// Assets current
router.get('/assets-current', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend assets current page',
    redirect: `${frontendUrl()}/assets-current.html`
  });
});

// Reviews
router.get('/reviews', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend reviews page',
    redirect: `${frontendUrl()}/reviews.html`
  });
});

// Payment methods
router.get('/payment-methods', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend payment methods page',
    redirect: `${frontendUrl()}/payment-methods.html`
  });
});

// Try demo
router.get('/try-demo', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend try demo page',
    redirect: `${frontendUrl()}/try-demo.html`
  });
});

// Contacts
router.get('/contacts', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend contacts page',
    redirect: `${frontendUrl()}/contacts.html`
  });
});

// AML policy
router.get('/aml-policy', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend AML policy page',
    redirect: `${frontendUrl()}/aml-policy.html`
  });
});

// Payment policy
router.get('/payment-policy', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend payment policy page',
    redirect: `${frontendUrl()}/payment-policy.html`
  });
});

// Regulatory environment
router.get('/regulatory-environment', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend regulatory environment page',
    redirect: `${frontendUrl()}/regulatory-environment.html`
  });
});

// Public offer
router.get('/public-offer', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend public offer page',
    redirect: `${frontendUrl()}/public-offer.html`
  });
});

module.exports = router;