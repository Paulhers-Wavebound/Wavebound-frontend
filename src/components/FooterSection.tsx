import { Link } from "react-router-dom";
import waveboundLogo from "@/assets/wavebound-logo.png";

const FooterSection = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={waveboundLogo} alt="Wavebound" className="w-8 h-8 rounded-lg" />
            <span className="text-white font-semibold">Wavebound</span>
            <span className="text-xs text-gray-500 font-medium">(beta)</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/subscription" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <a href="mailto:support@wavebound.io" className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Copyright */}
          <p className="text-sm">
            © {new Date().getFullYear()} Wavebound (beta)
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
