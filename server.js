const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const bountyRoutes = require('./routes/bounties');
const negotiateRoutes = require('./routes/negotiate');
const paymentRoutes = require('./routes/payment');
const creatorRoutes = require("./routes/creator");
const notifyRoutes = require('./routes/notifyRoutes');
const bountyFetchRoutes = require('./routes/bountyfetch'); // Assuming this is the correct path
const applyRoute = require("./routes/applyRoute")
const githubAuthRoutes = require('./routes/authRoutes'); // Assuming this is the correct path
const webhookRoutes = require("./routes/webhooks");
const prreviewRoutes = require('./routes/prreview'); // Assuming this is the correct path
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const aiRoutes = require('./routes/ai');
const approveBountyRoutes = require('./routes/approveBounty'); // Assuming this is the correct path
const notApprovePrRoute = require("./routes/notapprovepr");
const heroDataRoutes = require('./routes/hero-data'); // Assuming this is the correct path
const activitiesRoutes = require('./routes/activities'); // Assuming this is the correct path
const skillsRoutes = require('./routes/skills'); // Assuming this is the correct path
const certificationRoutes = require('./routes/certifications'); // Assuming this is the correct path
const UserBank = require('./routes/UserBank')
const payout = require('./routes/payout')
const app = express();

// const cron = require('node-cron');
// cron.schedule('*/5 * * * *', () => {
//   console.log('🕒 Running payout agent...');
//   require('./scripts/payoutAgent');
// });

app.use(cors());
app.use(express.json({limit: '50mb'})); // Increase limit for large payloads

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/negotiate', negotiateRoutes); // maps to POST /api/negotiate
app.use('/api/payment', paymentRoutes);
app.use("/api/creator", creatorRoutes);
app.use('/api/notify', notifyRoutes); // maps to POST /api/notify
app.use('/api/bountyfetch', bountyFetchRoutes); // maps to GET /api/bountyfetch
app.use("/api", applyRoute)
app.use("/api/auth", githubAuthRoutes); // maps to /api/auth/github/login and /api/auth/github/callback
app.use("/api/webhooks", webhookRoutes);
app.use('/api/review', prreviewRoutes); // maps to GET /api/review
app.use('/api', approveBountyRoutes); // maps to POST /api/approve-bounty
app.use("/api", notApprovePrRoute);
app.use("/api", heroDataRoutes); // maps to GET /api/hero-data
app.use("/api", activitiesRoutes);
app.use("/api", skillsRoutes);
app.use("/api", certificationRoutes); // maps to POST /api/certification
app.use("/api/user", UserBank)
// app.use("/api/payout", payout)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
