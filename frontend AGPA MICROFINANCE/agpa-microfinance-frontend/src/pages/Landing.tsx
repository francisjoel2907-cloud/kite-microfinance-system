import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Phone,
  Mail,
  Menu,
  X,
  CheckCircle,
  Landmark
} from "lucide-react";

const MicrofinanceLandingPage = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  /* ===============================
     Announcement Messages
  =============================== */

  const announcements = [
    "💰 Affordable loans for small businesses",
    "📊 Secure digital savings platform",
    "📈 Grow your financial future with us",
    "🤝 Trusted community microfinance partner"
  ];

  /* ===============================
     Scroll Effect
  =============================== */

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ===============================
     Announcement Rotation
  =============================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex(
        (prev) => (prev + 1) % announcements.length
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  /* ===============================
     Features
  =============================== */

  const features = [
    {
      icon: Users,
      title: "Client Management",
      description:
        "Register members, manage profiles, and track engagement efficiently"
    },

    {
      icon: DollarSign,
      title: "Loan Management",
      description:
        "Process loans, approvals, repayments, and track balances easily"
    },

    {
      icon: Wallet,
      title: "Savings Tracking",
      description:
        "Monitor member savings and generate accurate financial summaries"
    },

    {
      icon: TrendingUp,
      title: "Reports & Analytics",
      description:
        "Access real-time dashboards and performance insights"
    },

    {
      icon: ShieldCheck,
      title: "Secure System",
      description:
        "Enterprise-level data protection and role-based access"
    },

    {
      icon: Landmark,
      title: "Financial Transparency",
      description:
        "Improve accountability with automated audit-ready reports"
    }
  ];

  /* ===============================
     Benefits
  =============================== */

  const benefits = [
    "Fast loan processing workflow",
    "Accurate member savings tracking",
    "Smart financial dashboards",
    "Secure cloud-based system",
    "Mobile-friendly interface",
    "24/7 system availability"
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Announcement Bar */}

      <div className="bg-green-600 text-white py-3 text-center text-sm font-medium">
        {announcements[announcementIndex]}
      </div>

      {/* Navbar */}

      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex justify-between items-center">

          <div className="flex items-center gap-2">

            <Building2 className="text-green-600" />

            <span className="font-bold text-xl text-gray-900">
              MicroFinancePro
            </span>

          </div>

          <div className="hidden md:flex gap-8 text-gray-700 font-medium">

            <a href="#features">Features</a>

            <a href="#benefits">Benefits</a>

            <a href="#contact">Contact</a>

          </div>

          <div className="hidden md:flex gap-4">

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 border border-green-600 text-green-600 rounded-lg"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2 bg-green-600 text-white rounded-lg"
            >
              Get Started
            </button>

          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

        </div>

        {menuOpen && (

          <div className="bg-white border-t md:hidden p-4 space-y-3">

            <a href="#features">Features</a>

            <a href="#benefits">Benefits</a>

            <a href="#contact">Contact</a>

            <button
              onClick={() => navigate("/login")}
              className="w-full border border-green-600 py-2 rounded-lg text-green-600"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/register")}
              className="w-full bg-green-600 text-white py-2 rounded-lg"
            >
              Get Started
            </button>

          </div>

        )}

      </nav>

      {/* Hero Section */}

      <section className="py-24 text-center">

        <div className="max-w-4xl mx-auto px-6">

          <h1 className="text-5xl font-bold text-gray-900 mb-6">

            Empower Your Financial Institution With

            <span className="text-green-600 block">
              Smart Digital Microfinance System
            </span>

          </h1>

          <p className="text-gray-600 text-lg mb-8">

            Manage members, loans, savings, and reports efficiently
            using our secure modern microfinance platform.

          </p>

          <button
            onClick={() => navigate("/register")}
            className="px-10 py-4 bg-green-600 text-white rounded-xl text-lg"
          >
            Start Managing Today
          </button>

        </div>

      </section>

      {/* Features Section */}

      <section
        id="features"
        className="py-20 bg-white"
      >

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-16">

            Powerful Microfinance Features

          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {features.map((feature, index) => (

              <div
                key={index}
                className="p-6 border rounded-xl hover:shadow-lg transition"
              >

                <feature.icon className="text-green-600 mb-4" />

                <h3 className="font-bold text-xl mb-2">

                  {feature.title}

                </h3>

                <p className="text-gray-600">

                  {feature.description}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Benefits Section */}

      <section
        id="benefits"
        className="py-20 bg-green-50"
      >

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

          <div>

            <h2 className="text-4xl font-bold mb-6">

              Why Choose Our Microfinance Platform

            </h2>

            {benefits.map((benefit, index) => (

              <div
                key={index}
                className="flex items-center gap-3 mb-4"
              >

                <CheckCircle className="text-green-600" />

                <span>{benefit}</span>

              </div>

            ))}

          </div>

          <div className="bg-green-600 text-white rounded-2xl p-10 shadow-xl">

            <h3 className="text-3xl font-bold mb-6">

              Trusted Financial Solution

            </h3>

            <p>

              Built for SACCOs, microfinance institutions,
              and community lending organizations across Africa.

            </p>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer
        id="contact"
        className="bg-gray-900 text-gray-300 py-12"
      >

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">

          <div>

            <Building2 className="text-green-500 mb-2" />

            <h3 className="text-white font-bold">

              MicroFinancePro

            </h3>

            <p className="text-sm mt-2">

              Smart solutions for modern financial institutions.

            </p>

          </div>

          <div>

            <h4 className="text-white font-semibold mb-3">

              Contact

            </h4>

            <div className="flex gap-2 items-center">

              <Mail size={16} />

              info@microfinance.co.tz

            </div>

            <div className="flex gap-2 items-center mt-2">

              <Phone size={16} />

              +255 700 000 000

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};

export default MicrofinanceLandingPage;