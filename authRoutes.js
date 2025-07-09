const express = require("express");
const axios = require("axios");
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const User = require("../models/User"); // Import your User model

const router = express.Router();

// --- Config ---
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL; // e.g., https://yourdomain.com
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');
const HUNTER_CLIENT_ID = process.env.HUNTER_CLIENT_ID
const HUNTER_CLIENT_SECRET = process.env.HUNTER_CLIENT_SECRET
// ---------------------------------------------
// ✅ Step 1: Creator: GitHub login (with state=bounty data)
// ---------------------------------------------
router.get("/github/login", (req, res) => {
  const { state } = req.query; // state = JSON bounty data
  const redirect_uri = `${BASE_URL}/api/auth/github/callback`;

  res.redirect(
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&scope=repo` +
    `&state=${encodeURIComponent(state)}`
  );
});

// ---------------------------------------------
// ✅ Step 2: Creator: OAuth callback → setup webhooks & protections
// ---------------------------------------------
router.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } }
    );
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) throw new Error("Failed to get GitHub access token.");

    const bountyData = JSON.parse(decodeURIComponent(state));
    const repoUrl = bountyData.githubLink;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?/);
    const owner = match?.[1];
    const repo = match?.[2];
    if (!owner || !repo) throw new Error("Invalid GitHub repo link.");

    // Create webhook using user's token
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: "web",
        active: true,
        events: ["pull_request"],
        config: { url: `${BASE_URL}/api/webhooks/github`, content_type: "json", insecure_ssl: "0" }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
    );

    // Create Octokit app instance
    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: GITHUB_APP_ID, privateKey: GITHUB_PRIVATE_KEY }
    });

    const installations = await appOctokit.request("GET /app/installations");
    const installation = installations.data.find(inst => inst.account.login.toLowerCase() === owner.toLowerCase());
    if (!installation) {
      return res.redirect(`https://github.com/apps/fixera-bot/installations/new`);
    }

    // Apply branch protection on main
    const installationOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: GITHUB_APP_ID, privateKey: GITHUB_PRIVATE_KEY, installationId: installation.id }
    });
    await installationOctokit.repos.updateBranchProtection({
      owner,
      repo,
      branch: "main",
      required_status_checks: null,
      enforce_admins: true,
      required_pull_request_reviews: { required_approving_review_count: 1 },
      restrictions: null
    });

    res.redirect(`http://localhost:3000/github/success?token=${accessToken}&data=${encodeURIComponent(state)}`);
  } catch (error) {
    console.error("OAuth callback error:", error?.response?.data || error.message);
    res.redirect("http://localhost:3000/github/failure");
  }
});

// ---------------------------------------------
// ✅ NEW: Hunter: GitHub login (just get username)
// ---------------------------------------------
router.get("/github/hunter/login", (req, res) => {
  const redirect_uri = 'https://ed6b0f06d41c.ngrok-free.app/api/auth/github/hunter/callback';
  res.redirect(
    `https://github.com/login/oauth/authorize` +
    `?client_id=${HUNTER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&scope=read:user`
  );
});

// ✅ Hunter: OAuth callback
router.get("/github/hunter/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      { client_id: HUNTER_CLIENT_ID, client_secret: HUNTER_CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } }
    );
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) throw new Error("Failed to get GitHub access token.");

    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    const githubUsername = userResponse.data.login;

    res.send(`
      <script>
        window.opener.postMessage({ githubUsername: "${githubUsername}" }, "*");
        window.close();
      </script>
    `);
  } catch (error) {
    console.error("Hunter OAuth callback error:", error?.response?.data || error.message);
    res.send("GitHub login failed");
  }
});


// ---------------------------------------------
// ✅ Existing: Approve and merge PR
// ---------------------------------------------
router.post("/approve-bounty", async (req, res) => {
  try {
    const { creatorUsername, bountyTitle, repoUrl, prNumber } = req.body;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?/);
    const owner = match?.[1];
    const repo = match?.[2];
    if (!owner || !repo || !prNumber) {
      return res.status(400).json({ error: "Invalid repo URL or PR number" });
    }

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: GITHUB_APP_ID, privateKey: GITHUB_PRIVATE_KEY }
    });
    const installations = await appOctokit.request("GET /app/installations");
    const installation = installations.data.find(inst => inst.account.login.toLowerCase() === owner.toLowerCase());
    if (!installation) return res.status(400).json({ error: "App not installed on repo owner" });

    const installationOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: GITHUB_APP_ID, privateKey: GITHUB_PRIVATE_KEY, installationId: installation.id }
    });

    await installationOctokit.pulls.createReview({ owner, repo, pull_number: prNumber, event: "APPROVE" });
    const mergeResponse = await installationOctokit.pulls.merge({ owner, repo, pull_number: prNumber });

    res.json({ success: true, mergeResponse: mergeResponse.data });
  } catch (error) {
    console.error("Approve bounty error:", error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Unknown error" });
  }
});

module.exports = router;
