import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import Benefits from "../../components/Benefits/Benefits";
import Sports from "../../components/Sports/Sports";
import About from "../../components/About/About";
import Footer from "../../components/Footer/Footer";
import "./Home.css";

function Home() {
  return (
    <main className="home">
      <Navbar />

      <Hero />

      <Benefits />

      <Sports />

      <About />

      <Footer />
    </main>
  );
}

export default Home;
