import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import Benefits from "../../components/Benefits/Benefits";
import "./Home.css";

function Home() {
  return (
    <main className="home">
      <Navbar />

      <Hero />

      <Benefits />
    </main>
  );
}

export default Home;