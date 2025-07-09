// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import CreateBounty from './components/CreateBounty';
import PostedBounties from './components/PostedBounties';
import Wallet from "./components/Wallet";
import { Toaster } from 'sonner'; // Importing Toaster from sonner
import CreatorProfile from './components/CreatorProfile';
import BountyDisplay from './components/BountyDisplay';
import HunterProfile from './components/hunter profile/Dashboard';
import GithubSuccess from './components/GithubSuccess';
function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-bounty" element={<CreateBounty />} />
          <Route path="/bounties" element={<PostedBounties />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/creator-profile" element={<CreatorProfile />} />
          <Route path="/bounties-display" element={<BountyDisplay />} />
          <Route path="/hunter-profile" element={<HunterProfile />} />
          <Route path="/github/success" element={<GithubSuccess />}/>
          {/* Add more routes as needed */}

        </Routes>

        {/* ✅ Toaster placed globally */}
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
