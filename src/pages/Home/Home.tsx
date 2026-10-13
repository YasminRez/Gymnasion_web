import InstitutionalNavbar from "../../components/InstitutionalNavbar/InstitutionalNavbar";
import Hero from "../../components/Hero/Hero";
import Highlights from "../../components/Highlights/Highlights";
import Benefits from "../../components/Benefits/Benefits";
import Sports from "../../components/Sports/Sports";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import Subscription from "../../components/Subscription/Subscription";
import Footer from "../../components/Footer/Footer";
import "./Home.css";

export default function Home() {
  return <div className="institutional-home">
    <a className="institutional-skip" href="#conteudo">Pular para o conteúdo</a>
    <InstitutionalNavbar />
    <main id="conteudo"><Hero /><Highlights /><Benefits /><Sports /><HowItWorks /><Subscription /></main>
    <Footer />
  </div>;
}
